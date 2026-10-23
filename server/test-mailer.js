/**
 * Sri Lakshmi Sarees - Mailer Verification & Provider Error Test Suite
 *
 * Verifies:
 * 1. Provider selection priority and explicit overrides.
 * 2. RFC 5322 address parsing, quote stripping, freemail and shared sender detection.
 * 3. Accurate error classification (ensuring no misclassification of errors as domain failures).
 * 4. Preservation of actual provider error messages in providerError.
 * 5. Mocked dispatch testing for Resend and Brevo without sending real customer emails.
 */

import {
  getMailerProvider,
  isMailerConfigured,
  getSenderEmail,
  getNotificationEmail,
  parseAddress,
  classifyEmailError,
  sendOrderNotificationEmail,
} from './src/mailer.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASSED: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: ${name} -> ${err.message}`);
    failed++;
  }
}

async function runMailerTests() {
  console.log('======================================================');
  console.log('🧪 Running Sri Lakshmi Sarees Mailer Unit Test Suite');
  console.log('======================================================\n');

  // Save original environment
  const originalEnv = { ...process.env };

  try {
    // ----------------------------------------------------
    // Section 1: Address Parsing & Quotation Handling
    // ----------------------------------------------------
    console.log('[Suite 1/5] Address Parsing & Quote Hygiene');

    await test('parseAddress handles formatted RFC 5322 string', async () => {
      const parsed = parseAddress('"Sri Lakshmi Sarees" <onboarding@resend.dev>');
      assert(parsed.name === 'Sri Lakshmi Sarees', `Expected name 'Sri Lakshmi Sarees', got '${parsed.name}'`);
      assert(parsed.email === 'onboarding@resend.dev', `Expected email 'onboarding@resend.dev', got '${parsed.email}'`);
      assert(parsed.domain === 'resend.dev', `Expected domain 'resend.dev', got '${parsed.domain}'`);
      assert(parsed.isResendShared === true, 'Expected isResendShared = true');
      assert(parsed.isFreemail === false, 'Expected isFreemail = false');
    });

    await test('parseAddress strips accidental outer quotes from env vars', async () => {
      const parsed = parseAddress('"Sri Lakshmi Sarees <bhavanivejandla6@gmail.com>"');
      assert(parsed.email === 'bhavanivejandla6@gmail.com', `Expected email, got '${parsed.email}'`);
      assert(parsed.domain === 'gmail.com', `Expected domain 'gmail.com', got '${parsed.domain}'`);
      assert(parsed.isFreemail === true, 'Expected isFreemail = true for gmail.com');
      assert(parsed.isResendShared === false, 'Expected isResendShared = false');
    });

    await test('parseAddress detects common freemail domains', async () => {
      const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
      for (const d of domains) {
        const parsed = parseAddress(`test@${d}`);
        assert(parsed.isFreemail === true, `Expected ${d} to be identified as freemail`);
      }
      const custom = parseAddress('orders@srilakshmisarees.com');
      assert(custom.isFreemail === false, 'Expected custom domain to not be freemail');
      assert(custom.domain === 'srilakshmisarees.com', 'Expected domain srilakshmisarees.com');
    });

    // ----------------------------------------------------
    // Section 2: Provider Selection Priority
    // ----------------------------------------------------
    console.log('\n[Suite 2/5] Provider Selection Priority');

    await test('getMailerProvider selects "none" when no credentials exist', async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.BREVO_API_KEY;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.MAILER_PROVIDER;

      assert(getMailerProvider() === 'none', `Expected 'none', got '${getMailerProvider()}'`);
      assert(isMailerConfigured() === false, 'Expected isMailerConfigured = false');
    });

    await test('getMailerProvider selects "resend" when RESEND_API_KEY is present', async () => {
      process.env.RESEND_API_KEY = 're_test_key_12345';
      delete process.env.BREVO_API_KEY;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      assert(getMailerProvider() === 'resend', `Expected 'resend', got '${getMailerProvider()}'`);
      assert(isMailerConfigured() === true, 'Expected isMailerConfigured = true');
    });

    await test('getMailerProvider prioritizes "resend" over "brevo" and "smtp"', async () => {
      process.env.RESEND_API_KEY = 're_test_key_12345';
      process.env.BREVO_API_KEY = 'xkeysib_test_key_67890';
      process.env.SMTP_USER = 'orders@srilakshmisarees.com';
      process.env.SMTP_PASS = 'smtp_secret_pass';

      assert(getMailerProvider() === 'resend', `Expected 'resend', got '${getMailerProvider()}'`);
    });

    await test('getMailerProvider respects explicit MAILER_PROVIDER override when valid credentials exist', async () => {
      process.env.RESEND_API_KEY = 're_test_key_12345';
      process.env.BREVO_API_KEY = 'xkeysib_test_key_67890';
      process.env.MAILER_PROVIDER = 'brevo';

      assert(getMailerProvider() === 'brevo', `Expected explicit override to 'brevo', got '${getMailerProvider()}'`);
      delete process.env.MAILER_PROVIDER;
    });

    await test('getSenderEmail provides safe defaults for Resend without quotes', async () => {
      delete process.env.EMAIL_FROM;
      process.env.RESEND_API_KEY = 're_test_key';
      assert(getSenderEmail() === 'Sri Lakshmi Sarees <onboarding@resend.dev>', `Got '${getSenderEmail()}'`);

      // Accidental enclosing quotes in env
      process.env.EMAIL_FROM = '"Sri Lakshmi Sarees <orders@srilakshmisarees.com>"';
      assert(getSenderEmail() === 'Sri Lakshmi Sarees <orders@srilakshmisarees.com>', `Expected stripped quotes, got '${getSenderEmail()}'`);
    });

    // ----------------------------------------------------
    // Section 3: Error Classification Precision
    // ----------------------------------------------------
    console.log('\n[Suite 3/5] Error Classification Precision');

    await test('Network timeouts are classified as NETWORK_CONNECTION', async () => {
      const err = new Error('connect ETIMEDOUT 142.250.190.46:587');
      err.code = 'ETIMEDOUT';
      const classified = classifyEmailError(err, 'smtp');
      assert(classified.step === 'NETWORK_CONNECTION', `Expected NETWORK_CONNECTION, got ${classified.step}`);
      assert(classified.raw === err.message, 'Raw error must match original');
    });

    await test('Resend 401 / bad key is classified as AUTHENTICATION', async () => {
      const err = new Error('API key is invalid');
      err.status = 401;
      const classified = classifyEmailError(err, 'resend');
      assert(classified.step === 'AUTHENTICATION', `Expected AUTHENTICATION, got ${classified.step}`);
      assert(classified.raw === 'API key is invalid', 'Raw error must match original');
      assert(classified.message.includes('RESEND_API_KEY'), 'Diagnostic should mention RESEND_API_KEY');
    });

    await test('Resend freemail domain unverified is accurately classified as SENDER_DOMAIN_UNVERIFIED', async () => {
      const rawResendMsg = 'The gmail.com domain is not verified. Please, add and verify your domain.';
      const err = new Error(rawResendMsg);
      err.status = 403;
      const classified = classifyEmailError(err, 'resend', {
        from: 'Sri Lakshmi Sarees <bhavanivejandla6@gmail.com>',
        recipient: 'bhavanivejandla6@gmail.com',
      });

      assert(classified.step === 'SENDER_DOMAIN_UNVERIFIED', `Expected SENDER_DOMAIN_UNVERIFIED, got ${classified.step}`);
      assert(classified.raw === rawResendMsg, `Raw error was overridden! Got: ${classified.raw}`);
      assert(classified.message.includes('public email domains'), 'Diagnostic should specifically explain public freemail domain restriction');
      assert(classified.message.includes('@gmail.com'), 'Diagnostic should reference @gmail.com');
    });

    await test('Resend custom domain unverified is accurately classified as SENDER_DOMAIN_UNVERIFIED', async () => {
      const rawResendMsg = 'The srilakshmisarees.com domain is not verified. Please, add and verify your domain.';
      const err = new Error(rawResendMsg);
      err.status = 403;
      const classified = classifyEmailError(err, 'resend', {
        from: 'Sri Lakshmi Sarees <orders@srilakshmisarees.com>',
        recipient: 'bhavanivejandla6@gmail.com',
      });

      assert(classified.step === 'SENDER_DOMAIN_UNVERIFIED', `Expected SENDER_DOMAIN_UNVERIFIED, got ${classified.step}`);
      assert(classified.raw === rawResendMsg, 'Raw error must match original');
      assert(classified.message.includes('DNS records'), 'Diagnostic should explain DNS records (SPF, DKIM, DMARC)');
    });

    await test('Resend test sender recipient restriction is classified as TEST_SENDER_RECIPIENT_RESTRICTION', async () => {
      const rawResendMsg = 'You can only send testing emails to your own email address (gowtham@example.com). To send to other domains, please add and verify your domain at resend.com/domains';
      const err = new Error(rawResendMsg);
      err.status = 403;
      const classified = classifyEmailError(err, 'resend', {
        from: 'Sri Lakshmi Sarees <onboarding@resend.dev>',
        recipient: 'bhavanivejandla6@gmail.com',
      });

      assert(classified.step === 'TEST_SENDER_RECIPIENT_RESTRICTION', `Expected TEST_SENDER_RECIPIENT_RESTRICTION, got ${classified.step}`);
      assert(classified.raw === rawResendMsg, 'Raw error must match original');
      assert(classified.message.includes('onboarding@resend.dev'), 'Diagnostic should mention test sender');
      assert(classified.message.includes('bhavanivejandla6@gmail.com'), 'Diagnostic should mention target recipient');
    });

    await test('Resend rate limit is classified as RATE_LIMIT and not domain error', async () => {
      const rawMsg = 'Too many requests, rate limit exceeded';
      const err = new Error(rawMsg);
      err.status = 429;
      const classified = classifyEmailError(err, 'resend');

      assert(classified.step === 'RATE_LIMIT', `Expected RATE_LIMIT, got ${classified.step}`);
      assert(classified.raw === rawMsg, 'Raw error must match original');
      assert(!classified.step.includes('DOMAIN'), 'Rate limit should NOT be classified as domain error');
    });

    await test('Unrelated 403 errors are NOT forced into synthetic domain messages', async () => {
      const rawMsg = 'Account suspended pending compliance review';
      const err = new Error(rawMsg);
      err.status = 403;
      const classified = classifyEmailError(err, 'resend', {
        from: 'Sri Lakshmi Sarees <onboarding@resend.dev>',
        recipient: 'bhavanivejandla6@gmail.com',
      });

      assert(classified.step === 'DOMAIN_AUTHORIZATION', `Expected DOMAIN_AUTHORIZATION, got ${classified.step}`);
      assert(classified.raw === rawMsg, 'Raw error must match original');
      assert(classified.message.includes(rawMsg), 'Diagnostic must preserve the real error text');
      assert(!classified.message.includes('free Resend tier without custom domain verification'), 'Must not inject assumed boilerplate');
    });

    // ----------------------------------------------------
    // Section 4: Safe Order Notification Dispatch (No real customer emails)
    // ----------------------------------------------------
    console.log('\n[Suite 4/5] Safe Order Notification Dispatch');

    await test('sendOrderNotificationEmail returns simulated result when unconfigured', async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.BREVO_API_KEY;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const mockOrder = {
        orderNumber: 'SLS-TEST-MOCK-1',
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        finalTotal: 4999,
      };

      const res = await sendOrderNotificationEmail(mockOrder);
      assert(res.success === false, 'Expected success = false');
      assert(res.simulated === true, 'Expected simulated = true');
      assert(res.reason === 'MAILER_NOT_CONFIGURED', 'Expected MAILER_NOT_CONFIGURED');
    });

    await test('sendOrderNotificationEmail handles provider failure safely without throw', async () => {
      process.env.RESEND_API_KEY = 're_mock_test_key';
      process.env.EMAIL_FROM = 'Sri Lakshmi Sarees <bhavanivejandla6@gmail.com>';

      // Mock global fetch to return Resend unverified domain error
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: false,
        status: 403,
        json: async () => ({
          statusCode: 403,
          name: 'validation_error',
          message: 'The gmail.com domain is not verified. Please, add and verify your domain.',
        }),
      });

      try {
        const mockOrder = {
          orderNumber: 'SLS-TEST-MOCK-2',
          paymentMethod: 'Prepaid',
          paymentStatus: 'Paid',
          finalTotal: 12999,
        };

        const res = await sendOrderNotificationEmail(mockOrder);
        assert(res.success === false, 'Expected success = false');
        assert(res.step === 'SENDER_DOMAIN_UNVERIFIED', `Expected SENDER_DOMAIN_UNVERIFIED, got ${res.step}`);
        assert(
          res.providerError === 'The gmail.com domain is not verified. Please, add and verify your domain.',
          `Provider error was lost! Got: ${res.providerError}`
        );
        assert(res.sender.includes('bhavanivejandla6@gmail.com'), 'Expected sender to be captured');
        assert(res.recipient === getNotificationEmail(), 'Expected recipient to be captured');
      } finally {
        global.fetch = originalFetch;
      }
    });

    await test('sendOrderNotificationEmail captures mock successful send with provider metadata', async () => {
      process.env.RESEND_API_KEY = 're_mock_test_key';
      delete process.env.EMAIL_FROM;

      // Mock global fetch to return Resend success
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'res_mock_msg_98765',
        }),
      });

      try {
        const mockOrder = {
          orderNumber: 'SLS-TEST-MOCK-3',
          paymentMethod: 'Prepaid',
          paymentStatus: 'Paid',
          finalTotal: 8999,
        };

        const res = await sendOrderNotificationEmail(mockOrder);
        assert(res.success === true, 'Expected success = true');
        assert(res.provider === 'resend', 'Expected provider = resend');
        assert(res.messageId === 'res_mock_msg_98765', `Expected messageId, got ${res.messageId}`);
        assert(res.sender === 'Sri Lakshmi Sarees <onboarding@resend.dev>', `Expected sender, got ${res.sender}`);
      } finally {
        global.fetch = originalFetch;
      }
    });

    // ----------------------------------------------------
    // Section 5: Brevo Alternative Provider Verification
    // ----------------------------------------------------
    console.log('\n[Suite 5/5] Brevo Alternative Provider Verification');

    await test('Brevo provider dispatches successfully via HTTPS mock', async () => {
      delete process.env.RESEND_API_KEY;
      process.env.BREVO_API_KEY = 'xkeysib_mock_key';
      process.env.BREVO_SENDER_EMAIL = 'bhavanivejandla6@gmail.com';

      const originalFetch = global.fetch;
      global.fetch = async (url) => {
        assert(String(url).includes('api.brevo.com'), 'Should call Brevo HTTPS REST API');
        return {
          ok: true,
          status: 201,
          json: async () => ({
            messageId: '<brevo-mock-id-12345@smtp-relay.brevo.com>',
          }),
        };
      };

      try {
        const mockOrder = {
          orderNumber: 'SLS-TEST-MOCK-4',
          paymentMethod: 'COD',
          paymentStatus: 'Pending',
          finalTotal: 3499,
        };

        const res = await sendOrderNotificationEmail(mockOrder);
        assert(res.success === true, 'Expected success = true');
        assert(res.provider === 'brevo', `Expected provider = brevo, got ${res.provider}`);
        assert(res.messageId.includes('brevo-mock-id'), 'Expected Brevo messageId');
      } finally {
        global.fetch = originalFetch;
      }
    });

  } finally {
    // Restore original environment
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  }

  console.log('\n======================================================');
  console.log(`🏁 Mailer Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMailerTests().catch((err) => {
  console.error('Fatal error in mailer test suite:', err);
  process.exit(1);
});
