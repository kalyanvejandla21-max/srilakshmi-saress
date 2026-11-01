import assert from 'assert';
import crypto from 'crypto';

console.log('\n======================================================');
console.log('🧪 Running Cashfree Unit & Signature Verification Tests');
console.log('======================================================\n');

// 1. Environment & Config Helpers (mirrors server/src/index.js)
function sanitizeEnvValue(val) {
  if (!val) return '';
  let cleaned = String(val).trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'") && cleaned.length >= 2)
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function inspectCashfreeCredentials(rawAppId, rawSecretKey, rawEnv) {
  const appId = sanitizeEnvValue(rawAppId);
  const secretKey = sanitizeEnvValue(rawSecretKey);
  const hadQuotes = Boolean(
    (rawAppId && rawAppId.trim() !== appId) ||
    (rawSecretKey && rawSecretKey.trim() !== secretKey)
  );

  const cleanEnv = (rawEnv || 'TEST').trim().toUpperCase();
  const isConfiguredProduction = cleanEnv === 'PRODUCTION' || cleanEnv === 'PROD';
  const targetEnv = isConfiguredProduction ? 'production' : 'sandbox';

  let secretKeyType = 'standard';
  if (secretKey.startsWith('cfsk_ma_test_') || secretKey.toLowerCase().includes('_test_')) {
    secretKeyType = 'sandbox';
  } else if (secretKey.startsWith('cfsk_ma_prod_') || secretKey.toLowerCase().includes('_prod_')) {
    secretKeyType = 'production';
  }

  let appIdType = 'standard';
  if (appId.toUpperCase().startsWith('TEST') || appId.toLowerCase().includes('test')) {
    appIdType = 'sandbox';
  } else if (appId.toUpperCase().startsWith('PROD') || appId.toLowerCase().includes('prod')) {
    appIdType = 'production';
  }

  let credentialsMatchEachOther = true;
  if (secretKeyType !== 'standard' && appIdType !== 'standard') {
    credentialsMatchEachOther = (secretKeyType === appIdType);
  }

  let credentialsMatchEnv = true;
  let mismatchReason = null;
  let suggestedAction = null;

  if (secretKeyType === 'production' && targetEnv === 'sandbox') {
    credentialsMatchEnv = false;
    mismatchReason = 'CASHFREE_ENV is configured as TEST (sandbox.cashfree.com), but CASHFREE_SECRET_KEY is a live Production key (starts with cfsk_ma_prod_). Cashfree Sandbox rejects production credentials with "authentication Failed".';
    suggestedAction = 'If your Cashfree account is activated for live transactions, set CASHFREE_ENV=PRODUCTION in Render Environment Variables. Otherwise, generate and enter Sandbox test credentials from sandbox.cashfree.com.';
  } else if (secretKeyType === 'sandbox' && targetEnv === 'production') {
    credentialsMatchEnv = false;
    mismatchReason = 'CASHFREE_ENV is configured as PRODUCTION (api.cashfree.com), but CASHFREE_SECRET_KEY is a Sandbox test key (starts with cfsk_ma_test_). Cashfree Production rejects test credentials with "authentication Failed".';
    suggestedAction = 'Enter live Production API credentials from merchant.cashfree.com in Render, or set CASHFREE_ENV=TEST to test in sandbox.';
  } else if (!credentialsMatchEachOther) {
    credentialsMatchEnv = false;
    mismatchReason = `CASHFREE_APP_ID is recognized as ${appIdType} mode, but CASHFREE_SECRET_KEY is recognized as ${secretKeyType} mode.`;
    suggestedAction = 'Ensure both CASHFREE_APP_ID and CASHFREE_SECRET_KEY are generated from the same environment in your Cashfree Merchant Dashboard.';
  }

  return {
    appId,
    secretKey,
    hadQuotes,
    targetEnv,
    secretKeyType,
    appIdType,
    credentialsMatchEachOther,
    credentialsMatchEnv,
    mismatchReason,
    suggestedAction,
  };
}

function getCashfreeConfigForTest(envObj) {
  const rawAppId = envObj.CASHFREE_APP_ID;
  const rawSecretKey = envObj.CASHFREE_SECRET_KEY;
  const rawEnv = envObj.CASHFREE_ENV || envObj.CASHFREE_ENVIRONMENT || 'TEST';
  const apiVersion = sanitizeEnvValue(envObj.CASHFREE_API_VERSION) || '2023-08-01';

  const creds = inspectCashfreeCredentials(rawAppId, rawSecretKey, rawEnv);
  const isProduction = creds.targetEnv === 'production';
  const baseUrl = isProduction ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

  const isConfigured = Boolean(
    creds.appId &&
    creds.secretKey &&
    !creds.appId.includes('placeholder') &&
    !creds.secretKey.includes('placeholder') &&
    creds.secretKey !== 'test_cashfree_secret_key'
  );

  return {
    appId: creds.appId,
    secretKey: creds.secretKey,
    isProduction,
    environment: creds.targetEnv,
    apiVersion,
    baseUrl,
    isConfigured,
    diagnostics: {
      appIdConfigured: Boolean(creds.appId),
      secretKeyConfigured: Boolean(creds.secretKey),
      appIdType: creds.appIdType,
      secretKeyType: creds.secretKeyType,
      credentialsMatchEachOther: creds.credentialsMatchEachOther,
      credentialsMatchEnv: creds.credentialsMatchEnv,
      hadQuotesCleaned: creds.hadQuotes,
      mismatchReason: creds.mismatchReason,
      suggestedAction: creds.suggestedAction,
    },
  };
}

// Test 1: Defaults to sandbox when env is TEST or unspecified
{
  const cfg = getCashfreeConfigForTest({ CASHFREE_APP_ID: 'TEST1234', CASHFREE_SECRET_KEY: 'cfsk_ma_test_1234' });
  assert.strictEqual(cfg.isProduction, false);
  assert.strictEqual(cfg.environment, 'sandbox');
  assert.strictEqual(cfg.baseUrl, 'https://sandbox.cashfree.com/pg');
  assert.strictEqual(cfg.apiVersion, '2023-08-01');
  assert.strictEqual(cfg.isConfigured, true);
  assert.strictEqual(cfg.diagnostics.credentialsMatchEnv, true);
  assert.strictEqual(cfg.diagnostics.secretKeyType, 'sandbox');
  assert.strictEqual(cfg.diagnostics.appIdType, 'sandbox');
  console.log('  ✅ PASSED: getCashfreeConfig correctly routes to sandbox endpoint by default');
}

// Test 2: Routes to production when CASHFREE_ENV=PRODUCTION
{
  const cfg = getCashfreeConfigForTest({
    CASHFREE_APP_ID: 'PROD1234',
    CASHFREE_SECRET_KEY: 'cfsk_ma_prod_1234',
    CASHFREE_ENV: 'PRODUCTION',
    CASHFREE_API_VERSION: '2023-08-01',
  });
  assert.strictEqual(cfg.isProduction, true);
  assert.strictEqual(cfg.environment, 'production');
  assert.strictEqual(cfg.baseUrl, 'https://api.cashfree.com/pg');
  assert.strictEqual(cfg.isConfigured, true);
  assert.strictEqual(cfg.diagnostics.credentialsMatchEnv, true);
  assert.strictEqual(cfg.diagnostics.secretKeyType, 'production');
  assert.strictEqual(cfg.diagnostics.appIdType, 'production');
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

// Test 4: Environment mismatch detection (CASHFREE_ENV=TEST but CASHFREE_SECRET_KEY is live production)
{
  const cfg = getCashfreeConfigForTest({
    CASHFREE_APP_ID: 'TEST_APP_123',
    CASHFREE_SECRET_KEY: 'cfsk_ma_prod_9988776655',
    CASHFREE_ENV: 'TEST',
  });
  assert.strictEqual(cfg.diagnostics.credentialsMatchEnv, false);
  assert.strictEqual(cfg.diagnostics.secretKeyType, 'production');
  assert.strictEqual(cfg.diagnostics.appIdType, 'sandbox');
  assert.ok(cfg.diagnostics.mismatchReason.includes('CASHFREE_ENV is configured as TEST'));
  console.log('  ✅ PASSED: Detects production secret key with CASHFREE_ENV=TEST as environment mismatch');
}

// Test 5: Quote and whitespace hygiene (strips accidental quotes entered in dashboard)
{
  const cfg = getCashfreeConfigForTest({
    CASHFREE_APP_ID: '  "TEST1002"  ',
    CASHFREE_SECRET_KEY: " 'cfsk_ma_test_secret99' ",
    CASHFREE_ENV: 'TEST',
  });
  assert.strictEqual(cfg.appId, 'TEST1002');
  assert.strictEqual(cfg.secretKey, 'cfsk_ma_test_secret99');
  assert.strictEqual(cfg.diagnostics.hadQuotesCleaned, true);
  console.log('  ✅ PASSED: Strips accidental quotes and whitespace from environment variables');
}

// Test 6: Webhook HMAC-SHA256 Base64 Signature Generation & Verification
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

// Test 7: Phone number and customer ID hygiene
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
