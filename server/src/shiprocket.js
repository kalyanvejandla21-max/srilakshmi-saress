/**
 * Sri Lakshmi Sarees - Shiprocket Official API Client
 * Provides server-side authentication, courier serviceability check,
 * order creation, AWB generation, and tracking.
 */

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v2/console';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Check if Shiprocket credentials are configured in the environment
 */
export const isShiprocketConfigured = () => {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  return Boolean(email && password && email.trim() && password.trim());
};

/**
 * Authenticate with Shiprocket and retrieve a valid Bearer token.
 * Tokens are valid for 10 days; we cache in-memory with a 9-day TTL.
 */
export const getShiprocketToken = async () => {
  if (!isShiprocketConfigured()) {
    throw new Error('SHIPROCKET_NOT_CONFIGURED: Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD in environment');
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL.trim();
  const password = process.env.SHIPROCKET_PASSWORD.trim();

  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.token) {
    const errorMsg = data.message || `Shiprocket authentication failed with status ${response.status}`;
    throw new Error(`SHIPROCKET_AUTH_FAILED: ${errorMsg}`);
  }

  cachedToken = data.token;
  // Cache for 9 days (777,600,000 ms)
  tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
};

/**
 * Fetch all registered pickup locations in the merchant's Shiprocket account.
 */
export const getPickupLocations = async () => {
  const token = await getShiprocketToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}/settings/company/pickup`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch Shiprocket pickup locations');
  }

  return (data.data && data.data.shipping_address) || [];
};

/**
 * Check serviceability and calculate courier rates for delivery.
 */
export const checkCourierServiceability = async ({
  pickupPostcode = '631501',
  deliveryPostcode,
  weightKg = 0.8,
  cod = 0,
}) => {
  if (!deliveryPostcode || !/^\d{6}$/.test(String(deliveryPostcode))) {
    throw new Error('Valid 6-digit delivery PIN code is required');
  }

  const token = await getShiprocketToken();

  const url = new URL(`${SHIPROCKET_BASE_URL}/courier/serviceability/`);
  url.searchParams.set('pickup_postcode', String(pickupPostcode));
  url.searchParams.set('delivery_postcode', String(deliveryPostcode));
  url.searchParams.set('weight', String(weightKg));
  url.searchParams.set('cod', String(cod));

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to check courier serviceability with Shiprocket');
  }

  const couriers = (data.data && data.data.available_courier_companies) || [];
  return {
    isServiceable: couriers.length > 0,
    couriersCount: couriers.length,
    couriers: couriers.slice(0, 5).map((c) => ({
      courierCompanyId: c.courier_company_id,
      courierName: c.courier_name,
      rate: c.rate,
      estimatedDeliveryDays: c.estimated_delivery_days,
      etd: c.etd,
    })),
  };
};

/**
 * Create a custom order in Shiprocket for an approved order.
 */
export const createShiprocketOrder = async (order, customPickupLocation) => {
  const token = await getShiprocketToken();

  const pickupLocation =
    customPickupLocation ||
    process.env.SHIPROCKET_PICKUP_LOCATION ||
    'Primary';

  // Format order date: "YYYY-MM-DD HH:mm"
  const orderDate = new Date(order.createdAt || Date.now())
    .toISOString()
    .replace('T', ' ')
    .slice(0, 16);

  const cleanPhone = String(order.shippingAddress.phone).replace(/\D/g, '').slice(-10);
  const fullName = order.shippingAddress.fullName || 'Customer';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || '.';

  const orderItems = (order.items || []).map((item) => ({
    name: item.productName || 'Handwoven Saree',
    sku: item.productId || `SKU-${Date.now()}`,
    units: item.quantity || 1,
    selling_price: item.price || 0,
    discount: 0,
    tax: 0,
  }));

  const billingAddress = [
    order.shippingAddress.houseNo,
    order.shippingAddress.street,
    order.shippingAddress.locality,
    order.shippingAddress.landmark,
  ]
    .filter(Boolean)
    .join(', ');

  const payload = {
    order_id: order.orderNumber,
    order_date: orderDate,
    pickup_location: pickupLocation,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: billingAddress || 'Kanchipuram Delivery',
    billing_city: order.shippingAddress.city || 'Kanchipuram',
    billing_pincode: order.shippingAddress.pincode,
    billing_state: order.shippingAddress.state || 'Tamil Nadu',
    billing_country: 'India',
    billing_email: order.guestEmail || 'support@srilakshmisarees.com',
    billing_phone: cleanPhone,
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    sub_total: order.finalTotal,
    length: 30,
    breadth: 25,
    height: 5,
    weight: 0.8 * (order.items?.length || 1),
  };

  const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.order_id) {
    const errorMsg =
      (data.errors && JSON.stringify(data.errors)) ||
      data.message ||
      `Shiprocket order creation failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return {
    shiprocketOrderId: data.order_id,
    shipmentId: data.shipment_id,
    status: data.status,
    statusCode: data.status_code,
  };
};

/**
 * Assign AWB to an existing shipment in Shiprocket
 */
export const assignAwbToShipment = async (shipmentId) => {
  const token = await getShiprocketToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ shipment_id: shipmentId }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.response || !data.response.data) {
    const errorMsg = data.message || `Failed to assign AWB for shipment ${shipmentId}`;
    throw new Error(errorMsg);
  }

  const awbData = data.response.data;
  return {
    awbCode: awbData.awb_code,
    courierName: awbData.courier_name,
    courierCompanyId: awbData.courier_company_id,
    trackingUrl: `https://shiprocket.co/tracking/${awbData.awb_code}`,
  };
};

/**
 * Schedule pickup with the assigned courier partner
 */
export const scheduleCourierPickup = async (shipmentId) => {
  const token = await getShiprocketToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/pickup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });

  const data = await response.json().catch(() => ({}));
  return data;
};

/**
 * Track an AWB number live through Shiprocket
 */
export const trackAwbNumber = async (awbCode) => {
  const token = await getShiprocketToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(awbCode)}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Shiprocket tracking request failed');
  }

  return (data.tracking_data && data.tracking_data.track_status) || data;
};
