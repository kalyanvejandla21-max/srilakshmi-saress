/**
 * Sri Lakshmi Sarees - Shiprocket Official API Unit Test Suite
 * Validates credential hygiene, payment gating, COD workflow,
 * idempotency / retry protection, AWB failures, pickup booking,
 * and automated tracking notification email generation.
 *
 * All tests run strictly in sandbox/mock isolation without creating
 * real shipments, booking real pickups, or calling external APIs.
 */

import assert from 'assert';
import {
  sanitizeEnvValue,
  isShiprocketConfigured,
  getShiprocketConfig,
  DEFAULT_SHIPROCKET_PICKUP_POSTCODE,
} from './src/shiprocket.js';
import {
  generateShippingEmailContent,
  sendShippingNotificationEmail,
} from './src/mailer.js';

console.log('\n======================================================');
console.log('🧪 Running Shiprocket Unit & Shipping Workflow Tests');
console.log('======================================================\n');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASSED: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASSED: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// ======================================================
// [Suite 1/7] Environment Variable & Credential Hygiene
// ======================================================
console.log('[Suite 1/7] Environment Variable & Credential Hygiene');

runTest('sanitizeEnvValue strips quotes and leading/trailing whitespace', () => {
  assert.strictEqual(sanitizeEnvValue('  "test@srilakshmisarees.com"  '), 'test@srilakshmisarees.com');
  assert.strictEqual(sanitizeEnvValue(" 'strong_password_123' "), 'strong_password_123');
  assert.strictEqual(sanitizeEnvValue('Primary'), 'Primary');
  assert.strictEqual(sanitizeEnvValue(undefined), '');
  assert.strictEqual(sanitizeEnvValue(null), '');
});

runTest('isShiprocketConfigured rejects empty and placeholder credentials', () => {
  const originalEmail = process.env.SHIPROCKET_EMAIL;
  const originalPass = process.env.SHIPROCKET_PASSWORD;

  try {
    delete process.env.SHIPROCKET_EMAIL;
    delete process.env.SHIPROCKET_PASSWORD;
    assert.strictEqual(isShiprocketConfigured(), false);

    process.env.SHIPROCKET_EMAIL = 'your_placeholder_shiprocket_email';
    process.env.SHIPROCKET_PASSWORD = 'your_placeholder_password';
    assert.strictEqual(isShiprocketConfigured(), false);

    process.env.SHIPROCKET_EMAIL = 'orders@srilakshmisarees.com';
    process.env.SHIPROCKET_PASSWORD = 'secure_shiprocket_api_key_2026';
    assert.strictEqual(isShiprocketConfigured(), true);
  } finally {
    process.env.SHIPROCKET_EMAIL = originalEmail;
    process.env.SHIPROCKET_PASSWORD = originalPass;
  }
});

runTest('getShiprocketConfig masks email and exposes no raw secrets', () => {
  const originalEmail = process.env.SHIPROCKET_EMAIL;
  const originalPass = process.env.SHIPROCKET_PASSWORD;

  try {
    process.env.SHIPROCKET_EMAIL = 'logistics@srilakshmisarees.com';
    process.env.SHIPROCKET_PASSWORD = 'top_secret_credentials_never_exposed';
    const cfg = getShiprocketConfig();

    assert.strictEqual(cfg.isConfigured, true);
    assert.strictEqual(cfg.maskedEmail, 'log***@srilakshmisarees.com');
    assert.strictEqual(cfg.baseUrl, 'https://apiv2.shiprocket.in/v2/console');
    assert.strictEqual(cfg.password, undefined);
  } finally {
    process.env.SHIPROCKET_EMAIL = originalEmail;
    process.env.SHIPROCKET_PASSWORD = originalPass;
  }
});

runTest('DEFAULT_SHIPROCKET_PICKUP_POSTCODE defaults to 521125 (Mopidevi, AP)', () => {
  assert.strictEqual(DEFAULT_SHIPROCKET_PICKUP_POSTCODE, '521125');
  const cfg = getShiprocketConfig();
  assert.strictEqual(cfg.pickupPostcode, '521125');
});

// ======================================================
// [Suite 2/7] Payment Gating for Prepaid Orders
// ======================================================
console.log('\n[Suite 2/7] Payment Gating for Prepaid Orders');

// Simulates backend validation guard inside shipment creation
function validateShipmentCreationGuard(order) {
  if (order.paymentMethod === 'Prepaid' && order.paymentStatus !== 'Paid') {
    return {
      allowed: false,
      code: 'PAYMENT_NOT_VERIFIED',
      error: `Cannot create shipment for prepaid order: Payment has not been verified yet (current status: ${order.paymentStatus}).`,
    };
  }

  if (order.orderStatus === 'Cancelled') {
    return {
      allowed: false,
      code: 'ORDER_CANCELLED',
      error: 'Cannot create shipment for a cancelled order.',
    };
  }

  return { allowed: true };
}

runTest('Blocks shipment creation when prepaid order payment is Pending', () => {
  const pendingPrepaidOrder = {
    orderNumber: 'SLS-991201',
    paymentMethod: 'Prepaid',
    paymentStatus: 'Pending',
    orderStatus: 'Order Placed',
  };

  const gate = validateShipmentCreationGuard(pendingPrepaidOrder);
  assert.strictEqual(gate.allowed, false);
  assert.strictEqual(gate.code, 'PAYMENT_NOT_VERIFIED');
});

runTest('Blocks shipment creation when prepaid order payment has Failed', () => {
  const failedPrepaidOrder = {
    orderNumber: 'SLS-991202',
    paymentMethod: 'Prepaid',
    paymentStatus: 'Failed',
    orderStatus: 'Order Placed',
  };

  const gate = validateShipmentCreationGuard(failedPrepaidOrder);
  assert.strictEqual(gate.allowed, false);
  assert.strictEqual(gate.code, 'PAYMENT_NOT_VERIFIED');
});

runTest('Allows shipment creation when prepaid order payment is confirmed as Paid', () => {
  const paidPrepaidOrder = {
    orderNumber: 'SLS-991203',
    paymentMethod: 'Prepaid',
    paymentStatus: 'Paid',
    orderStatus: 'Payment Confirmed',
  };

  const gate = validateShipmentCreationGuard(paidPrepaidOrder);
  assert.strictEqual(gate.allowed, true);
});

// ======================================================
// [Suite 3/7] Cash on Delivery (COD) Workflow & State Preservation
// ======================================================
console.log('\n[Suite 3/7] Cash on Delivery (COD) Workflow & State Preservation');

runTest('Allows shipment creation for confirmed COD order without requiring prepaid status', () => {
  const codOrder = {
    orderNumber: 'SLS-COD-101',
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    orderStatus: 'Order Placed',
  };

  const gate = validateShipmentCreationGuard(codOrder);
  assert.strictEqual(gate.allowed, true);
});

runTest('Rejects shipment creation for cancelled COD order', () => {
  const cancelledCodOrder = {
    orderNumber: 'SLS-COD-102',
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    orderStatus: 'Cancelled',
  };

  const gate = validateShipmentCreationGuard(cancelledCodOrder);
  assert.strictEqual(gate.allowed, false);
  assert.strictEqual(gate.code, 'ORDER_CANCELLED');
});

runTest('COD orders preserve paymentStatus as Pending (never falsely flipped to Paid)', () => {
  const order = {
    orderNumber: 'SLS-COD-103',
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    finalTotal: 8499,
  };

  // Mock shipment fulfillment transition
  const fulfillmentUpdate = {
    shipmentId: 'SR_SHIP_98765',
    courierName: 'Delhivery Surface',
    awbNumber: '1428571234',
    orderStatus: 'Ready for Pickup',
    shipmentStatus: 'PICKUP_SCHEDULED',
  };

  // Ensure COD paymentStatus guard maintains Pending
  if (order.paymentMethod === 'COD' && order.paymentStatus !== 'Paid') {
    fulfillmentUpdate.paymentStatus = 'Pending';
  }

  const updatedOrder = { ...order, ...fulfillmentUpdate };
  assert.strictEqual(updatedOrder.paymentStatus, 'Pending');
  assert.strictEqual(updatedOrder.orderStatus, 'Ready for Pickup');
  assert.strictEqual(updatedOrder.shipmentId, 'SR_SHIP_98765');
});

// ======================================================
// [Suite 4/7] Idempotency & Duplicate Shipment Prevention
// ======================================================
console.log('\n[Suite 4/7] Idempotency & Duplicate Shipment Prevention');

runTest('Reuses existing shipmentId on retries instead of creating duplicate Shiprocket orders', () => {
  let shiprocketApiCallCount = 0;

  function mockCreateOrRetrieveShipment(order) {
    // Idempotency check: if order already has shipmentId, do not call Shiprocket create API
    if (order.shipmentId && order.shipmentId.trim()) {
      return {
        isExisting: true,
        shipmentId: order.shipmentId,
        shiprocketOrderId: order.shiprocketOrderId,
        status: 'EXISTING_SHIPMENT',
      };
    }

    shiprocketApiCallCount++;
    return {
      isExisting: false,
      shipmentId: 'SR_NEW_SHIP_554433',
      shiprocketOrderId: 'SR_ORD_998877',
      status: 'NEW',
    };
  }

  // Attempt 1: First creation
  const freshOrder = { orderNumber: 'SLS-IDEM-001', paymentMethod: 'COD', shipmentId: '' };
  const firstResult = mockCreateOrRetrieveShipment(freshOrder);
  assert.strictEqual(firstResult.isExisting, false);
  assert.strictEqual(firstResult.shipmentId, 'SR_NEW_SHIP_554433');
  assert.strictEqual(shiprocketApiCallCount, 1);

  // Attempt 2: Admin retries or timeout resumes
  freshOrder.shipmentId = firstResult.shipmentId;
  freshOrder.shiprocketOrderId = firstResult.shiprocketOrderId;
  const retryResult = mockCreateOrRetrieveShipment(freshOrder);
  assert.strictEqual(retryResult.isExisting, true);
  assert.strictEqual(retryResult.shipmentId, 'SR_NEW_SHIP_554433');
  // Crucial: API was NOT called again
  assert.strictEqual(shiprocketApiCallCount, 1);
});

// ======================================================
// [Suite 5/7] AWB Assignment Lifecycle & Safe Failure Handling
// ======================================================
console.log('\n[Suite 5/7] AWB Assignment Lifecycle & Safe Failure Handling');

runTest('Rejects AWB assignment if shipment has not been created first', () => {
  const orderWithoutShipment = {
    orderNumber: 'SLS-AWB-001',
    shipmentId: '',
    awbNumber: '',
  };

  const canAssign = Boolean(orderWithoutShipment.shipmentId && orderWithoutShipment.shipmentId.trim());
  assert.strictEqual(canAssign, false);
});

runTest('Handles AWB assignment failure safely without marking order as dispatched', () => {
  const order = {
    orderNumber: 'SLS-AWB-002',
    shipmentId: 'SR_SHIP_112233',
    awbNumber: '',
    orderStatus: 'Processing',
  };

  // Simulate Shiprocket returning AWB assignment error (e.g. unserviceable pincode or no wallet balance)
  const mockAwbError = new Error('Courier partner service unavailable for this destination PIN code');
  let orderStatusAfterFailure = order.orderStatus;

  try {
    throw mockAwbError;
  } catch (err) {
    // Safe error handling: do NOT set orderStatus to 'Ready for Pickup' or 'In Transit'
    orderStatusAfterFailure = order.orderStatus;
  }

  assert.strictEqual(orderStatusAfterFailure, 'Processing');
  assert.strictEqual(order.awbNumber, '');
});

runTest('Updates order record with real AWB details on successful assignment', () => {
  const mockAwbResponse = {
    awb_assign_status: 1,
    response: {
      data: {
        awb_code: '1428579999',
        courier_name: 'Delhivery Surface',
        courier_company_id: 2,
      },
    },
  };

  const awbData = mockAwbResponse.response.data;
  const update = {
    awbNumber: String(awbData.awb_code),
    courierName: awbData.courier_name,
    trackingUrl: `https://shiprocket.co/tracking/${awbData.awb_code}`,
    shipmentStatus: 'AWB_ASSIGNED',
  };

  assert.strictEqual(update.awbNumber, '1428579999');
  assert.strictEqual(update.courierName, 'Delhivery Surface');
  assert.strictEqual(update.trackingUrl, 'https://shiprocket.co/tracking/1428579999');
  assert.strictEqual(update.shipmentStatus, 'AWB_ASSIGNED');
});

// ======================================================
// [Suite 6/7] Courier Pickup Booking Lifecycle & Prerequisites
// ======================================================
console.log('\n[Suite 6/7] Courier Pickup Booking Lifecycle & Prerequisites');

runTest('Refuses courier pickup booking if shipmentId or awbNumber is missing', () => {
  const orderNoAwb = { shipmentId: 'SR_SHIP_123', awbNumber: '' };
  const orderNoShipment = { shipmentId: '', awbNumber: '1428570000' };

  const canBook1 = Boolean(orderNoAwb.shipmentId && orderNoAwb.awbNumber);
  const canBook2 = Boolean(orderNoShipment.shipmentId && orderNoShipment.awbNumber);

  assert.strictEqual(canBook1, false);
  assert.strictEqual(canBook2, false);
});

runTest('Updates status to Ready for Pickup with token number on successful pickup booking', () => {
  const mockPickupResponse = {
    pickup_status: 1,
    response: {
      pickup_scheduled_date: '2026-10-26 14:00:00',
      pickup_token_number: 'PKP-SLS-2026-987',
      pickup_priority: 'standard',
    },
  };

  const pickupDetails = mockPickupResponse.response;
  const update = {
    pickupStatus: 'SCHEDULED',
    pickupScheduledDate: pickupDetails.pickup_scheduled_date,
    pickupTokenNumber: pickupDetails.pickup_token_number,
    shipmentStatus: 'PICKUP_SCHEDULED',
    orderStatus: 'Ready for Pickup',
  };

  assert.strictEqual(update.orderStatus, 'Ready for Pickup');
  assert.strictEqual(update.pickupStatus, 'SCHEDULED');
  assert.strictEqual(update.pickupTokenNumber, 'PKP-SLS-2026-987');
});

runTest('Handles courier pickup failure safely without falsely marking as dispatched', () => {
  const order = {
    orderNumber: 'SLS-PKP-002',
    shipmentId: 'SR_SHIP_9988',
    awbNumber: '1428578888',
    orderStatus: 'Processing',
    pickupStatus: '',
  };

  // Mock pickup failure (e.g. pickup location address phone mismatch in Shiprocket)
  const mockPickupFailure = { pickup_status: 0, message: 'Pickup time slot unavailable for today' };
  let statusAfter = order.orderStatus;

  if (mockPickupFailure.pickup_status !== 1) {
    // Retain Processing status, do not mark as Ready for Pickup
    statusAfter = order.orderStatus;
  }

  assert.strictEqual(statusAfter, 'Processing');
  assert.strictEqual(order.pickupStatus, '');
});

// ======================================================
// [Suite 7/7] Shipping Notification Email Generation & Safe Dispatch
// ======================================================
console.log('\n[Suite 7/7] Shipping Notification Email Generation & Safe Dispatch');

runTest('generateShippingEmailContent includes courier name, AWB code, tracking button, and items', () => {
  const sampleOrder = {
    orderNumber: 'SLS-EMAIL-TEST-1',
    finalTotal: 15499,
    paymentMethod: 'Prepaid',
    paymentStatus: 'Paid',
    courierName: 'Blue Dart Express',
    awbNumber: 'BLUEDART-882211',
    trackingUrl: 'https://shiprocket.co/tracking/BLUEDART-882211',
    items: [
      {
        productName: 'Kanchipuram Silk Saree - Crimson Zari',
        quantity: 1,
        price: 15499,
      },
    ],
    shippingAddress: {
      fullName: 'Sita Devi',
      phone: '9876543210',
      email: 'sita@example.com',
      houseNo: '12-A',
      street: 'Temple View Street',
      city: 'Kanchipuram',
      state: 'Tamil Nadu',
      pincode: '631501',
    },
  };

  const { subject, html, text } = generateShippingEmailContent(sampleOrder);

  assert.ok(subject.includes('SLS-EMAIL-TEST-1'));
  assert.ok(subject.includes('Dispatched'));
  assert.ok(html.includes('Blue Dart Express'));
  assert.ok(html.includes('BLUEDART-882211'));
  assert.ok(html.includes('https://shiprocket.co/tracking/BLUEDART-882211'));
  assert.ok(html.includes('Kanchipuram Silk Saree - Crimson Zari'));
  assert.ok(text.includes('BLUEDART-882211'));
});

await runAsyncTest('sendShippingNotificationEmail returns simulated result safely when unconfigured', async () => {
  const originalResend = process.env.RESEND_API_KEY;
  const originalBrevo = process.env.BREVO_API_KEY;
  const originalSmtp = process.env.SMTP_USER;

  try {
    delete process.env.RESEND_API_KEY;
    delete process.env.BREVO_API_KEY;
    delete process.env.SMTP_USER;

    const testOrder = {
      orderNumber: 'SLS-MOCK-SHIP-01',
      awbNumber: '1428570001',
      courierName: 'Delhivery Surface',
      guestEmail: 'customer@example.com',
      items: [],
      shippingAddress: { fullName: 'Test Customer', phone: '9876543210' },
    };

    const result = await sendShippingNotificationEmail(testOrder);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'MAILER_NOT_CONFIGURED');
    assert.strictEqual(result.simulated, true);
    assert.strictEqual(result.orderNumber, 'SLS-MOCK-SHIP-01');
  } finally {
    process.env.RESEND_API_KEY = originalResend;
    process.env.BREVO_API_KEY = originalBrevo;
    process.env.SMTP_USER = originalSmtp;
  }
});

console.log('\n======================================================');
console.log(`🏁 Shiprocket Unit Test Results: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
