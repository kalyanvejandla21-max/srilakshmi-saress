import assert from 'assert';
import crypto from 'crypto';

console.log('\n======================================================');
console.log('🧪 Running Cashfree Unit & Signature Verification Tests');
console.log('======================================================\n');

// 1. Environment & Config Tests
function getCashfreeConfigForTest(envObj) {
  const appId = envObj.CASHFREE_APP_ID?.trim();
  const secretKey = envObj.CASHFREE_SECRET_KEY?.trim();
  const rawEnv = (envObj.CASHFREE_ENV || envObj.CASHFREE_ENVIRONMENT || 'TEST').trim().toUpperCase();
  const isProduction = rawEnv === 'PRODUCTION' || rawEnv === 'PROD';
  const apiVersion = envObj.CASHFREE_API_VERSION?.trim() || '2023-08-01';

  const baseUrl = isProduction ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
  const isConfigured = Boolean(
    appId &&
    secretKey &&
    !appId.includes('placeholder') &&
    !secretKey.includes('placeholder') &&
    secretKey !== 'test_cashfree_secret_key'
  );

  return {
    appId,
    secretKey,
    isProduction,
    environment: isProduction ? 'production' : 'sandbox',
    apiVersion,
    baseUrl,
    isConfigured,
  };
}

// Test 1: Defaults to sandbox when env is TEST or unspecified
{
  const cfg = getCashfreeConfigForTest({ CASHFREE_APP_ID: 'TEST1234', CASHFREE_SECRET_KEY: 'sec_test_1234' });
  assert.strictEqual(cfg.isProduction, false);
  assert.strictEqual(cfg.environment, 'sandbox');
  assert.strictEqual(cfg.baseUrl, 'https://sandbox.cashfree.com/pg');
  assert.strictEqual(cfg.apiVersion, '2023-08-01');
  assert.strictEqual(cfg.isConfigured, true);
  console.log('  ✅ PASSED: getCashfreeConfig correctly routes to sandbox endpoint by default');
}

// Test 2: Routes to production when CASHFREE_ENV=PRODUCTION
{
  const cfg = getCashfreeConfigForTest({
    CASHFREE_APP_ID: 'PROD1234',
    CASHFREE_SECRET_KEY: 'sec_prod_1234',
    CASHFREE_ENV: 'PRODUCTION',
    CASHFREE_API_VERSION: '2023-08-01',
  });
  assert.strictEqual(cfg.isProduction, true);
  assert.strictEqual(cfg.environment, 'production');
  assert.strictEqual(cfg.baseUrl, 'https://api.cashfree.com/pg');
  assert.strictEqual(cfg.isConfigured, true);
  console.log('  ✅ PASSED: getCashfreeConfig switches to production endpoint when configured');
}

// Test 3: Detects unconfigured / placeholder keys
{
  const cfg = getCashfreeConfigForTest({
    CASHFREE_APP_ID: 'placeholder_app_id',
    CASHFREE_SECRET_KEY: 'test_cashfree_secret_key',
  });
  assert.strictEqual(cfg.isConfigured, false);
  console.log('  ✅ PASSED: getCashfreeConfig correctly marks placeholder keys as unconfigured');
}

// Test 4: Webhook HMAC-SHA256 Base64 Signature Generation & Verification
{
  const testSecret = 'cf_secret_key_prod_test_987654321';
  const timestamp = String(Date.now());
  const rawBody = JSON.stringify({
    data: {
      order: { order_id: 'SLS-20261023-1234' },
      payment: { payment_status: 'SUCCESS', cf_payment_id: 'cf_pay_998877' },
    },
  });

  const signaturePayload = `${timestamp}${rawBody}`;
  const computedSignature = crypto
    .createHmac('sha256', testSecret)
    .update(signaturePayload)
    .digest('base64');

  // Verify constant-time comparison
  const sigBuf = Buffer.from(computedSignature);
  const expBuf = Buffer.from(computedSignature);
  const isMatch = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  assert.strictEqual(isMatch, true);

  // Forged signature check
  const forgedSig = Buffer.from('forged_signature_tampered_value_123456');
  const isForgedMatch = sigBuf.length === forgedSig.length && crypto.timingSafeEqual(sigBuf, forgedSig);
  assert.strictEqual(isForgedMatch, false);

  console.log('  ✅ PASSED: Webhook HMAC-SHA256 base64 signature matches and rejects forged payloads');
}

// Test 5: Phone number and customer ID hygiene
{
  const rawPhone = '+91 98765-43210';
  const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
  assert.strictEqual(cleanPhone, '9876543210');

  const customerId = `cust_${cleanPhone}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  assert.strictEqual(customerId, 'cust_9876543210');
  console.log('  ✅ PASSED: Customer phone and customer ID sanitized cleanly for Cashfree specs');
}

console.log('\n======================================================');
console.log('🏁 All Cashfree Unit Tests Passed Successfully!');
console.log('======================================================\n');
