/**
 * Sri Lakshmi Sarees - Automated Test Suite
 * Verifies backend order persistence, price tamper protection,
 * privacy-preserving tracking, idempotency, and admin authorization.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🧪 Running Sri Lakshmi Sarees Automated Verification Suite`);
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // Ensure test stock availability in local JSON store if running locally
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dataFile = path.join(__dirname, 'data/store_db.json');
    if (fs.existsSync(dataFile)) {
      const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      if (Array.isArray(db.products)) {
        let changed = false;
        for (const p of db.products) {
          if (p.stock < 5) {
            p.stock = 10;
            changed = true;
          }
        }
        if (changed) fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
      }
    }
  } catch {}

  let passed = 0;
  let failed = 0;

  // Phase 1: Unit & Provider Error Classification Tests
  console.log(`[Phase 1/2] Unit & Security Verification Tests`);
  try {
    execSync('node test-mailer.js', { stdio: 'inherit' });
    console.log(`  ✅ PASSED: Mailer unit tests (selection, freemail parsing, error classification)\n`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Mailer unit tests failed -> ${err.message}\n`);
    failed++;
  }

  try {
    execSync('node test-cashfree-unit.js', { stdio: 'inherit' });
    console.log(`  ✅ PASSED: Cashfree unit tests (endpoint routing, signature verification, payload sanitization)\n`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Cashfree unit tests failed -> ${err.message}\n`);
    failed++;
  }

  console.log(`[Phase 2/2] Backend API Integration Verification`);

  async function assertTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASSED: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await assertTest('GET /api/health returns 200 with database status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.status !== 200 && res.status !== 503) {
      throw new Error(`Unexpected status code: ${res.status}`);
    }
    const data = await res.json();
    if (!data.store || !data.database) {
      throw new Error('Health response missing store or database block');
    }
  });

  // 2. Products Catalog retrieval
  await assertTest('GET /api/products returns active saree list with demo labeling', async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.products) || data.products.length === 0) {
      throw new Error('No products returned');
    }
    const demoCount = data.products.filter((p) => p.isDemo).length;
    if (demoCount === 0) {
      throw new Error('Demo catalog labeling missing on initial products');
    }
  });

  // 3. Price Tampering Prevention & Authoritative Calculation
  let createdOrderNumber = null;
  const testIdempotencyKey = `test-idemp-${Date.now()}`;

  await assertTest('POST /api/orders rejects tampered prices and calculates authoritative total', async () => {
    const orderPayload = {
      items: [{ productId: 'prod-1', quantity: 1, price: 5, lineTotal: 5 }],
      shippingAddress: {
        fullName: 'Kalyan Vejandla',
        phone: '9876543210',
        pincode: '600001',
        houseNo: 'Flat 4A',
        street: 'Temple View Road',
        city: 'Kanchipuram',
        state: 'Tamil Nadu'
      },
      finalTotal: 5, // Client attempts to pay ₹5 instead of real price ₹18,499
      idempotencyKey: testIdempotencyKey
    };

    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    if (!res.ok) throw new Error(`Order creation failed with status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.order) throw new Error('Order creation did not return order object');

    createdOrderNumber = data.order.orderNumber;

    // Verify server authoritative price was enforced (real price 18499)
    if (data.order.finalTotal < 18000) {
      throw new Error(`Price tampering succeeded! Server accepted finalTotal of ${data.order.finalTotal}`);
    }
  });

  // 4. Idempotency Guard: Duplicate submission check
  await assertTest('POST /api/orders idempotency prevents duplicate order records', async () => {
    const duplicatePayload = {
      items: [{ productId: 'prod-1', quantity: 1 }],
      shippingAddress: {
        fullName: 'Kalyan Vejandla',
        phone: '9876543210',
        pincode: '600001',
        houseNo: 'Flat 4A',
        street: 'Temple View Road',
        city: 'Kanchipuram',
        state: 'Tamil Nadu'
      },
      idempotencyKey: testIdempotencyKey // Re-submitting identical idempotency token
    };

    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicatePayload)
    });

    const data = await res.json();
    if (!data.isDuplicate && data.order.orderNumber !== createdOrderNumber) {
      throw new Error('Idempotency failed: Server created duplicate order for same key');
    }
  });

  // 5. Validation Rejection: Invalid Phone & Empty Items
  await assertTest('POST /api/orders rejects invalid phone numbers and empty items', async () => {
    const invalidPayload = {
      items: [],
      shippingAddress: { fullName: 'Test', phone: '123' } // Invalid 3-digit phone
    };

    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload)
    });

    if (res.status !== 400) {
      throw new Error(`Expected status 400, received ${res.status}`);
    }
  });

  // 6. Privacy Protection on Public Order Tracking
  await assertTest('GET /api/orders/:id masks sensitive address when phone is unverified', async () => {
    if (!createdOrderNumber) throw new Error('Previous test did not set createdOrderNumber');

    const res = await fetch(`${BASE_URL}/api/orders/${createdOrderNumber}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    if (data.isVerified !== false) {
      throw new Error('Unverified lookup should return isVerified: false');
    }

    if (data.order.shippingAddress && data.order.shippingAddress.street) {
      throw new Error('Private street address leaked to unverified tracking query!');
    }
  });

  // 7. Verified Order Tracking with Matching Mobile Number
  await assertTest('GET /api/orders/:id?phone=... reveals full details when phone matches', async () => {
    if (!createdOrderNumber) throw new Error('Previous test did not set createdOrderNumber');

    const res = await fetch(`${BASE_URL}/api/orders/${createdOrderNumber}?phone=9876543210`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    if (data.isVerified !== true) {
      throw new Error('Verified lookup with matching phone should return isVerified: true');
    }

    if (!data.order.shippingAddress || !data.order.shippingAddress.street) {
      throw new Error('Verified lookup should include complete delivery details');
    }
  });

  // 8. Admin Security: Block Unauthorized Requests
  await assertTest('GET /api/admin/orders rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/orders`);
    if (res.status !== 401) {
      throw new Error(`Expected status 401 Unauthorized, received ${res.status}`);
    }
  });

  // 9. Admin Authentication: Login and Receive JWT
  let adminJwtToken = null;
  await assertTest('POST /api/admin/login generates valid JWT session token', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@srilakshmisarees.com',
        password: process.env.ADMIN_PASSWORD || 'admin@SLS2026!'
      })
    });

    if (!res.ok) throw new Error(`Admin login failed with status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.token) {
      throw new Error('Admin login response missing token');
    }
    adminJwtToken = data.token;
  });

  // 10. Admin Order Status Transition
  await assertTest('PATCH /api/admin/orders/:id/status updates order status with valid token', async () => {
    if (!adminJwtToken || !createdOrderNumber) {
      throw new Error('Missing token or order number for status transition test');
    }

    const res = await fetch(`${BASE_URL}/api/admin/orders/${createdOrderNumber}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminJwtToken}`
      },
      body: JSON.stringify({ orderStatus: 'Processing' })
    });

    if (!res.ok) throw new Error(`Status update failed with status ${res.status}`);
    const data = await res.json();
    if (data.order.orderStatus !== 'Processing') {
      throw new Error(`Status was not updated. Current: ${data.order.orderStatus}`);
    }
  });

  // 11. Payment Status Safety: New orders start Pending with no fake AWB
  let prepaidOrderNumber = null;
  await assertTest('POST /api/orders enforces paymentStatus = Pending and no fake AWB on creation', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'prod-1', quantity: 1 }],
        shippingAddress: {
          fullName: 'Test Customer',
          phone: '9876543210',
          pincode: '600001',
          houseNo: '10',
          street: 'Gandhi Road',
          city: 'Chennai',
          state: 'Tamil Nadu'
        },
        paymentMethod: 'Prepaid'
      })
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    prepaidOrderNumber = data.order.orderNumber;

    if (data.order.paymentStatus !== 'Pending') {
      throw new Error(`CRITICAL: Order was marked '${data.order.paymentStatus}' before payment verification!`);
    }

    if (data.order.awbNumber && data.order.awbNumber.trim()) {
      throw new Error(`CRITICAL: Fake AWB '${data.order.awbNumber}' was generated without courier booking!`);
    }
  });

  // 12. Razorpay Order Creation: Validates order existence and gateway config
  await assertTest('POST /api/payments/create-razorpay-order validates order reference', async () => {
    const res = await fetch(`${BASE_URL}/api/payments/create-razorpay-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: 'NON_EXISTENT_ORDER' })
    });

    // Expect 400 (if gateway not configured) or 404 (order not found)
    if (res.status !== 400 && res.status !== 404) {
      throw new Error(`Expected 400 or 404, received ${res.status}`);
    }
  });

  // 13. Razorpay Signature Verification: Rejects tampered/invalid signature
  await assertTest('POST /api/payments/verify-razorpay rejects forged payment signatures', async () => {
    const res = await fetch(`${BASE_URL}/api/payments/verify-razorpay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: prepaidOrderNumber,
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'fake_tampered_signature_hex_1234567890abcdef'
      })
    });

    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request, received ${res.status}`);
    }
  });

  // 14. Payment Failure Recording: Safely updates order paymentStatus to Failed
  await assertTest('POST /api/payments/record-failure records customer cancellation safely', async () => {
    const res = await fetch(`${BASE_URL}/api/payments/record-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: prepaidOrderNumber,
        reason: 'Payment cancelled in modal test'
      })
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Expected success: true');
  });

  // 14a. Payment Gateway Config: Exposes public gateway status without leaking secret keys
  await assertTest('GET /api/payments/config exposes public status without leaking secret keys', async () => {
    const res = await fetch(`${BASE_URL}/api/payments/config`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    if (!data.cashfree || typeof data.cashfree.configured !== 'boolean') {
      throw new Error('Missing cashfree status block');
    }
    if (!data.razorpay || typeof data.razorpay.configured !== 'boolean') {
      throw new Error('Missing razorpay status block');
    }

    const rawString = JSON.stringify(data);
    if (rawString.includes('CASHFREE_SECRET_KEY') || rawString.includes('RAZORPAY_KEY_SECRET') || rawString.includes('secretKey')) {
      throw new Error('CRITICAL SECURITY LEAK: Secret keys exposed in /api/payments/config!');
    }
  });

  // 14b. Cashfree Order Creation: Validates order reference and handles unconfigured/invalid keys securely
  await assertTest('POST /api/payments/create-cashfree-order validates order reference and handles gateway status', async () => {
    const res = await fetch(`${BASE_URL}/api/payments/create-cashfree-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: 'NON_EXISTENT_ORDER' })
    });

    // Expect 400 (if gateway not configured) or 404 (order not found)
    if (res.status !== 400 && res.status !== 404) {
      throw new Error(`Expected 400 or 404, received ${res.status}`);
    }

    const data = await res.json().catch(() => ({}));
    const rawString = JSON.stringify(data);
    if (rawString.includes('CASHFREE_SECRET_KEY') || rawString.includes('secretKey')) {
      throw new Error('CRITICAL: Cashfree Secret Key leaked in error payload!');
    }
  });

  // 14c. Cashfree Payment Verification: Rejects false/unverified payment claims (Enforces server verification)
  await assertTest('POST /api/payments/verify-cashfree rejects unverified payment claims without authoritative gateway confirmation', async () => {
    const res = await fetch(`${BASE_URL}/api/payments/verify-cashfree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: prepaidOrderNumber
      })
    });

    // In environment without live confirmed payment, must reject confirmation (status 400)
    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request, received ${res.status}`);
    }

    const data = await res.json().catch(() => ({}));
    if (data.success === true) {
      throw new Error('CRITICAL SECURITY VIOLATION: Claimed payment succeeded without authoritative Cashfree verification!');
    }
  });

  // 14d. Cashfree Webhook: Rejects forged or unsigned webhook calls
  await assertTest('POST /api/payments/cashfree-webhook rejects unsigned or forged webhook payloads', async () => {
    const res = await fetch(`${BASE_URL}/api/payments/cashfree-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': 'fake_forged_base64_signature==',
        'x-webhook-timestamp': String(Date.now())
      },
      body: JSON.stringify({
        data: {
          order: { order_id: prepaidOrderNumber },
          payment: { payment_status: 'SUCCESS', cf_payment_id: 'fake_pay_123' }
        }
      })
    });

    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request for invalid signature, received ${res.status}`);
    }
  });

  // 14e. Payment Failure Recording for Cashfree Orders
  await assertTest('POST /api/payments/record-failure handles cashfree_order_id safely', async () => {
    const res = await fetch(`${BASE_URL}/api/payments/record-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: prepaidOrderNumber,
        cashfree_order_id: prepaidOrderNumber,
        reason: 'User dismissed Cashfree checkout popup'
      })
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Expected success: true');
  });

  // 15. Courier Serviceability Public Endpoint
  await assertTest('GET /api/shipments/serviceability responds with delivery information', async () => {
    const res = await fetch(`${BASE_URL}/api/shipments/serviceability?deliveryPincode=600001`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Serviceability check failed');
  });

  // 16. Email Notification Configuration Status
  await assertTest('GET /api/admin/notifications/status returns notification status safely without exposing secrets', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/notifications/status`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || typeof data.isConfigured !== 'boolean') {
      throw new Error('Notification status response invalid');
    }
    if (!data.provider || !data.transportType) {
      throw new Error('Notification status missing provider or transportType');
    }
    if (data.smtpPass || data.password || data.resendApiKey || data.brevoApiKey) {
      throw new Error('CRITICAL: Provider secrets exposed by status endpoint!');
    }
  });

  // 17. Admin Protected Notification Trigger Endpoint
  await assertTest('POST /api/admin/orders/:id/resend-notification blocks unauthorized requests', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/orders/${createdOrderNumber || 'SLS-TEST'}/resend-notification`, {
      method: 'POST'
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, received ${res.status}`);
    }
  });

  // 18. Admin Protected Test-Email Trigger Endpoint
  await assertTest('POST /api/admin/notifications/test-email blocks unauthorized requests with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/notifications/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail: 'test@example.com' })
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, received ${res.status}`);
    }
  });

  // 19. Admin Authenticated Test-Email Handling (safe diagnostic execution)
  await assertTest('POST /api/admin/notifications/test-email responds cleanly without unhandled exceptions', async () => {
    if (!adminJwtToken) throw new Error('Missing admin token');
    const res = await fetch(`${BASE_URL}/api/admin/notifications/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminJwtToken}`
      },
      body: JSON.stringify({ targetEmail: 'test@example.com' })
    });
    // Either 200 (if active provider) or 400 (if unconfigured / connection blocked in local test)
    if (res.status !== 200 && res.status !== 400) {
      throw new Error(`Expected 200 or 400 status, received ${res.status}`);
    }
    const data = await res.json();
    if (!data.provider && !data.step && !data.message) {
      throw new Error('Response missing diagnostic metadata');
    }
  });

  console.log(`\n======================================================`);
  console.log(`🏁 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
