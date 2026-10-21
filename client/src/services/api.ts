import { Product, Order, Coupon, SiteSettings, Announcement } from '../types';
import { BUSINESS_CONFIG } from '../config/businessConfig';

// Mock Initial Data Seed for catalog (clearly flagged with isDemo: true)
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'SLS-KAN-001',
    name: 'Kanjivaram Silk Saree in Royal Crimson Maroon',
    slug: 'kanjivaram-silk-saree-royal-crimson-maroon',
    category: 'Silk Sarees',
    price: 18499,
    originalPrice: 22999,
    discountPercentage: 20,
    fabric: 'Pure Mulberry Silk',
    color: 'Crimson Maroon & Antique Gold',
    pattern: 'Korvai Weave with Traditional Temple Zari Border',
    occasion: 'Bridal & Wedding',
    sareeLength: '5.5 Meters + 0.8 Meter Running Blouse Piece',
    blouseIncluded: true,
    careInstructions: 'Dry Clean Only. Store wrapped in pure muslin cloth.',
    description: 'An iconic masterpiece of Indian handloom heritage, this Kanjivaram silk saree features rich deep maroon mulberry silk accented with hand-woven golden zari temple borders and an opulent pallu depicting peacock motifs.',
    stock: 8,
    images: ['/images/hero-banner.jpg', '/images/cat-silk.jpg', '/images/cat-wedding.jpg'],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    isDemo: true,
    rating: 4.9,
    reviewsCount: 14,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    sku: 'SLS-SIL-002',
    name: 'Emerald Green Kanjivaram Brocade Silk Saree',
    slug: 'emerald-green-kanjivaram-brocade-silk-saree',
    category: 'Silk Sarees',
    price: 16999,
    originalPrice: 19999,
    discountPercentage: 15,
    fabric: 'Pure Kanchipuram Silk',
    color: 'Emerald Green & Metallic Gold',
    pattern: 'All-over Jacquard Floral Motifs with Rich Pallu',
    occasion: 'Wedding & Grand Celebrations',
    sareeLength: '5.5 Meters + 0.8 Meter Unstitched Blouse Piece',
    blouseIncluded: true,
    careInstructions: 'Dry Clean Only. Iron on low heat on reverse side.',
    description: 'Embrace royal elegance with this lush Emerald Green Kanjivaram silk saree. Woven by master weavers, it boasts an intricate golden zari pallu and a heavy zari border that drapes like liquid gold.',
    stock: 5,
    images: ['/images/cat-silk.jpg', '/images/hero-banner.jpg'],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    isDemo: true,
    rating: 5.0,
    reviewsCount: 9,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    sku: 'SLS-COT-003',
    name: 'Pastel Blue Chanderi Handloom Cotton Saree',
    slug: 'pastel-blue-chanderi-handloom-cotton-saree',
    category: 'Cotton Sarees',
    price: 4299,
    originalPrice: 5499,
    discountPercentage: 22,
    fabric: 'Chanderi Silk Cotton Blend',
    color: 'Pastel Powder Blue',
    pattern: 'Hand Block Print with Delicate Silver Zari Border',
    occasion: 'Daily Wear & Workwear',
    sareeLength: '5.5 Meters + 0.8 Meter Contrast Blouse Piece',
    blouseIncluded: true,
    careInstructions: 'Gentle hand wash in cold water with mild liquid detergent.',
    description: 'Lightweight, ultra-breathable, and sophisticated. This Chanderi cotton saree keeps you fresh and chic all day. Ideal for modern office wear, daytime events, and family gatherings.',
    stock: 15,
    images: ['/images/cat-cotton.jpg', '/images/cat-dailywear.jpg'],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    isDemo: true,
    rating: 4.7,
    reviewsCount: 22,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    sku: 'SLS-WED-004',
    name: 'Royal Bridal Red Temple Pallu Silk Saree',
    slug: 'royal-bridal-red-temple-pallu-silk-saree',
    category: 'Wedding Sarees',
    price: 24999,
    originalPrice: 29999,
    discountPercentage: 17,
    fabric: 'Heavy Bridal Kanjivaram Silk',
    color: 'Vermillion Red & Pure Gold Zari',
    pattern: 'Classic Indian Bridal Motif with Elephant & Lotus Zari Weave',
    occasion: 'Wedding Day & Muhurtham',
    sareeLength: '5.5 Meters + 0.8 Meter Heavy Embroidered Blouse Piece',
    blouseIncluded: true,
    careInstructions: 'Dry Clean Only. Avoid direct sunlight when drying.',
    description: 'The ultimate wedding saree for the modern bride who respects timeless tradition. Handwoven in auspicious bridal red with pure silver-gold zari embroidery across the pallu.',
    stock: 3,
    images: ['/images/cat-wedding.jpg', '/images/hero-banner.jpg'],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    isDemo: true,
    rating: 5.0,
    reviewsCount: 31,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    sku: 'SLS-FES-005',
    name: 'Royal Blue Banarasi Silver Brocade Silk Saree',
    slug: 'royal-blue-banarasi-silver-brocade-silk-saree',
    category: 'Festive Sarees',
    price: 13999,
    originalPrice: 16999,
    discountPercentage: 18,
    fabric: 'Pure Banarasi Katan Silk',
    color: 'Royal Sapphire Blue & Silver Zari',
    pattern: 'Silver Kadwa Weave Butas with Kadwa Border',
    occasion: 'Diwali, Puja & Festive Gatherings',
    sareeLength: '5.5 Meters + 0.8 Meter Running Blouse',
    blouseIncluded: true,
    careInstructions: 'Dry Clean Only.',
    description: 'Celebrate festivities in glowing splendour with this silver brocade Banarasi silk saree. Features intricate kadwa butis that reflect light gracefully with every step.',
    stock: 10,
    images: ['/images/cat-festive.jpg', '/images/cat-silk.jpg'],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    isDemo: true,
    rating: 4.8,
    reviewsCount: 18,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-6',
    sku: 'SLS-DES-006',
    name: 'Blush Pink Hand-Embroidered Organza Saree',
    slug: 'blush-pink-hand-embroidered-organza-saree',
    category: 'Designer Sarees',
    price: 11499,
    originalPrice: 13999,
    discountPercentage: 18,
    fabric: 'Pure Sheer Organza',
    color: 'Blush Pink & Rose Gold',
    pattern: 'Scalloped Border with Cutdana & Zardozi Hand Embroidery',
    occasion: 'Reception, Cocktails & Modern Parties',
    sareeLength: '5.5 Meters + 0.8 Meter Satin Blouse Piece',
    blouseIncluded: true,
    careInstructions: 'Dry Clean Only. Handle delicate embroidery with care.',
    description: 'Ethereal and romantic. Made from light organza fabric with hand-carved scalloped edges and intricate zardozi floral border embroidery.',
    stock: 7,
    images: ['/images/cat-designer.jpg'],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    isDemo: true,
    rating: 4.9,
    reviewsCount: 8,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-7',
    sku: 'SLS-DAY-007',
    name: 'Mustard Yellow Artisanal Mulmul Cotton Saree',
    slug: 'mustard-yellow-artisanal-mulmul-cotton-saree',
    category: 'Daily Wear Sarees',
    price: 2899,
    originalPrice: 3499,
    discountPercentage: 17,
    fabric: '100% Fine Mulmul Cotton',
    color: 'Mustard Yellow & Ivory',
    pattern: 'Traditional Bagru Hand Block Print',
    occasion: 'Daily Wear & Summer Comfort',
    sareeLength: '5.5 Meters + 0.8 Meter Printed Blouse Piece',
    blouseIncluded: true,
    careInstructions: 'Hand wash separately in cold water.',
    description: 'Soft as a breeze. Crafted from natural mulmul cotton dyed with herbal eco-friendly colors, featuring authentic Bagru hand block print.',
    stock: 20,
    images: ['/images/cat-dailywear.jpg', '/images/cat-cotton.jpg'],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: false,
    isActive: true,
    isDemo: true,
    rating: 4.6,
    reviewsCount: 27,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-8',
    sku: 'SLS-KAN-008',
    name: 'Plum & Antique Gold Temple Border Silk Saree',
    slug: 'plum-antique-gold-temple-border-silk-saree',
    category: 'Silk Sarees',
    price: 17899,
    originalPrice: 21999,
    discountPercentage: 18,
    fabric: 'Pure Handloom Kanchipuram Silk',
    color: 'Rich Deep Plum & Antique Gold',
    pattern: 'Dual-tone Zari Weave with Peacock Motif Pallu',
    occasion: 'Grand Celebrations & Weddings',
    sareeLength: '5.5 Meters + 0.8 Meter Blouse Piece',
    blouseIncluded: true,
    careInstructions: 'Dry Clean Only.',
    description: 'Deep plum silk interwoven with antique gold thread gives this Kanjivaram saree a majestic sheen under ambient light.',
    stock: 6,
    images: ['/images/hero-banner.jpg', '/images/cat-silk.jpg'],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    isDemo: true,
    rating: 4.9,
    reviewsCount: 12,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_ANNOUNCEMENT: Announcement = {
  id: 'ann-1',
  message: '✨ Grand Festive Offer: Use code LAKSHMI10 for Flat 10% Off on All Pure Silk Sarees | Free Express Shipping across India',
  isActive: true,
  linkText: 'Shop Silk Sarees →',
  linkUrl: '/shop?category=Silk+Sarees'
};

export const INITIAL_SETTINGS: SiteSettings = {
  brandName: BUSINESS_CONFIG.brandName,
  tagline: BUSINESS_CONFIG.tagline,
  contactEmail: BUSINESS_CONFIG.contact.email || BUSINESS_CONFIG.contact.emailDisplay,
  contactPhone: BUSINESS_CONFIG.contact.phoneDisplay,
  whatsappNumber: BUSINESS_CONFIG.contact.whatsappDisplay,
  storeAddress: BUSINESS_CONFIG.contact.fullAddress,
  freeShippingMinAmount: BUSINESS_CONFIG.policies.freeShippingThreshold,
  standardShippingFee: BUSINESS_CONFIG.policies.standardShippingFee,
  codEnabled: true,
  returnWindowDays: BUSINESS_CONFIG.policies.returnWindowDays
};

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'LAKSHMI10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 5000,
    expiryDate: '2026-12-31',
    usageLimit: 500,
    timesUsed: 42,
    isActive: true
  },
  {
    id: 'coup-2',
    code: 'WELCOME500',
    discountType: 'fixed',
    discountValue: 500,
    minOrderValue: 3000,
    expiryDate: '2026-12-31',
    usageLimit: 1000,
    timesUsed: 128,
    isActive: true
  }
];

// Local storage keys for client caching
const STORAGE_KEYS = {
  PRODUCTS: 'sls_products',
  ANNOUNCEMENT: 'sls_announcement',
  SETTINGS: 'sls_settings',
  COUPONS: 'sls_coupons',
  ORDERS: 'sls_orders',
  ADMIN_TOKEN: 'sls_admin_token'
};

// Safe access to client storage
export const getStoredProducts = (): Product[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(data);
};

export const saveStoredProducts = (products: Product[]) => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const getStoredAnnouncement = (): Announcement => {
  const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENT);
  if (!data) return INITIAL_ANNOUNCEMENT;
  return JSON.parse(data);
};

export const getStoredSettings = (): SiteSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!data) return INITIAL_SETTINGS;
  return JSON.parse(data);
};

export const getStoredCoupons = (): Coupon[] => {
  const data = localStorage.getItem(STORAGE_KEYS.COUPONS);
  if (!data) return INITIAL_COUPONS;
  return JSON.parse(data);
};

export const getStoredOrders = (): Order[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  if (!data) return [];
  return JSON.parse(data);
};

export const saveOrder = (order: Order) => {
  const orders = getStoredOrders();
  const existingIndex = orders.findIndex((o) => o.orderNumber === order.orderNumber || o.id === order.id);
  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.unshift(order);
  }
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export const getAdminToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
};

export const setAdminToken = (token: string, persist: boolean = true) => {
  if (persist) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
  } else {
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
  }
};

export const clearAdminToken = () => {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
};

// --- PRODUCTION BACKEND API INTEGRATION ---
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Fetch products from backend with fallback
export const fetchProductsFromServer = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        saveStoredProducts(data.products);
        return data.products;
      }
    }
  } catch (err) {
    console.warn('Could not reach backend product catalog. Using cached catalog:', err);
  }
  return getStoredProducts();
};

// Create an order on the Express backend
// STRICT DATA-INTEGRITY RULE: Never fake a successful confirmation when backend fails.
export const createOrderOnServer = async (orderPayload: Partial<Order>): Promise<Order> => {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || `Server returned error (${response.status}). Could not securely record order.`;
    throw new Error(errorMessage);
  }

  if (data.success && data.order) {
    saveOrder(data.order);
    return data.order;
  }

  throw new Error('Unexpected response format from order processing service');
};

// Check backend API health status
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (response.ok) {
      return await response.json();
    }
    return { status: 'error', code: response.status };
  } catch (err) {
    return { status: 'offline', error: String(err) };
  }
};

export interface TrackOrderResult {
  success: boolean;
  isVerified: boolean;
  order: Order;
  message?: string;
}

// Fetch order from server with privacy protection
export const fetchOrderFromServer = async (
  idOrNumber: string,
  phoneQuery?: string
): Promise<TrackOrderResult | null> => {
  try {
    const url = new URL(`${API_BASE_URL || window.location.origin}/api/orders/${encodeURIComponent(idOrNumber)}`);
    if (phoneQuery && phoneQuery.trim()) {
      url.searchParams.set('phone', phoneQuery.trim());
    }

    const response = await fetch(url.toString());
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.order) {
        return {
          success: true,
          isVerified: !!data.isVerified,
          order: data.order,
          message: data.message
        };
      }
    }
  } catch (err) {
    console.warn('Could not reach backend order tracking endpoint:', err);
  }

  // Fallback to client localStorage for development/offline testing
  const localOrders = getStoredOrders();
  const cleanQuery = idOrNumber.trim().toUpperCase();
  const matched = localOrders.find(
    (o) =>
      (o.orderNumber && o.orderNumber.toUpperCase() === cleanQuery) ||
      (o.id && o.id.toUpperCase() === cleanQuery)
  );

  if (matched) {
    return {
      success: true,
      isVerified: true,
      order: matched
    };
  }

  return null;
};

// --- ADMIN API SERVICES ---

export const adminLoginApi = async (email: string, password: string): Promise<{ token: string; email: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Invalid administrator login credentials');
  }

  if (data.success && data.token) {
    setAdminToken(data.token);
    return { token: data.token, email: data.admin?.email || email };
  }

  throw new Error('Failed to retrieve authentication token');
};

export const adminGetOrdersApi = async (): Promise<Order[]> => {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to fetch admin orders');

  return data.orders || [];
};

export const adminUpdateOrderStatusApi = async (
  idOrNumber: string,
  updates: Partial<Order>
): Promise<Order> => {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/orders/${encodeURIComponent(idOrNumber)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to update order status');

  return data.order;
};

export const adminCreateProductApi = async (productData: Partial<Product>): Promise<Product> => {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to create product');

  return data.product;
};

export const adminUpdateProductApi = async (id: string, updates: Partial<Product>): Promise<Product> => {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to update product');

  return data.product;
};

export const adminArchiveProductApi = async (id: string): Promise<boolean> => {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to archive product');

  return true;
};

export const adminResetDemoCatalogApi = async (): Promise<boolean> => {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/products/reset-demo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to reset demo catalog');

  return true;
};

// --- RAZORPAY PAYMENT INTEGRATION SERVICES ---

export interface CreateRazorpayOrderResponse {
  success: boolean;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export const createRazorpayOrderApi = async (orderNumber: string): Promise<CreateRazorpayOrderResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/payments/create-razorpay-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err: any = new Error(data.message || data.error || 'Failed to initialize Razorpay payment');
    err.code = data.code;
    throw err;
  }

  return data;
};

export interface VerifyPaymentPayload {
  orderNumber: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const verifyRazorpayPaymentApi = async (payload: VerifyPaymentPayload): Promise<Order> => {
  const response = await fetch(`${API_BASE_URL}/api/payments/verify-razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Payment signature verification failed');
  }

  if (data.order) {
    saveOrder(data.order);
    return data.order;
  }

  throw new Error('Verified order object was not returned by server');
};

export const recordPaymentFailureApi = async (
  orderNumber: string,
  reason: string,
  razorpayOrderId?: string
): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/api/payments/record-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber, reason, razorpay_order_id: razorpayOrderId })
    });
  } catch (err) {
    console.warn('Could not record payment failure with server:', err);
  }
};

// --- SHIPROCKET COURIER SERVICES ---

export interface CourierServiceabilityResult {
  success: boolean;
  isConfigured: boolean;
  message?: string;
  isServiceable?: boolean;
  couriersCount?: number;
  couriers?: Array<{
    courierCompanyId: number;
    courierName: string;
    rate: number;
    estimatedDeliveryDays: string;
    etd?: string;
  }>;
}

export const checkServiceabilityApi = async (
  deliveryPincode: string,
  pickupPincode: string = '631501'
): Promise<CourierServiceabilityResult> => {
  try {
    const url = new URL(`${API_BASE_URL || window.location.origin}/api/shipments/serviceability`);
    url.searchParams.set('deliveryPincode', deliveryPincode);
    url.searchParams.set('pickupPincode', pickupPincode);

    const response = await fetch(url.toString());
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Courier serviceability check failed:', err);
  }

  return {
    success: true,
    isConfigured: false,
    message: 'Standard express courier delivery available across India (3 - 5 business days).'
  };
};

export const adminGetPickupLocationsApi = async (): Promise<any[]> => {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/shiprocket/pickup-locations`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'Failed to fetch pickup locations');

  return data.locations || [];
};

export const adminDispatchShiprocketApi = async (
  idOrNumber: string,
  pickupLocation?: string
): Promise<{ order: Order; shiprocket: any; awb: any }> => {
  const token = getAdminToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/orders/${encodeURIComponent(idOrNumber)}/dispatch-shiprocket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ pickupLocation })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Shiprocket dispatch failed');
  }

  return data;
};
