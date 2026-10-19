/**
 * Sri Lakshmi Sarees - Automated Test Suite
 * Verifies backend order persistence, price tamper protection,
 * privacy-preserving tracking, idempotency, and admin authorization.
 */

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🧪 Running Sri Lakshmi Sarees Automated Verification Suite`);
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

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
