/**
 * Sri Lakshmi Sarees - Email Notification Diagnostic & Verification Script
 *
 * Usage:
 *   node test-email.js
 *
 * Tests provider configuration, API/transporter connectivity, and dispatches a
 * test order notification to the configured business email (bhavanivejandla6@gmail.com).
 */

import dotenv from 'dotenv';
dotenv.config();

import {
  isMailerConfigured,
  getMailerProvider,
  getNotificationEmail,
  getSenderEmail,
  sendTestNotificationEmail,
} from './src/mailer.js';

async function main() {
  console.log('========================================================');
  console.log(' Sri Lakshmi Sarees - Email Notification Diagnostic Tool');
  console.log('========================================================\n');

  const provider = getMailerProvider();
  const targetEmail = getNotificationEmail();

  console.log(`Configured Business Inbox: ${targetEmail}`);
  console.log(`Active Provider:          ${provider.toUpperCase()}`);
  console.log(`Sender Address:           ${getSenderEmail()}`);

  if (provider === 'smtp') {
    console.log(`SMTP Host:                ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
    console.log(`SMTP Port:                ${process.env.SMTP_PORT || '587 (default)'}`);
    console.log(`SMTP User Configured:     ${process.env.SMTP_USER ? 'YES (' + process.env.SMTP_USER + ')' : 'NO'}`);
    console.log(`SMTP Pass Configured:     ${process.env.SMTP_PASS ? 'YES (configured securely)' : 'NO'}\n`);
  } else if (provider === 'resend') {
    console.log(`Resend API Key:           YES (Configured securely - HTTPS Port 443)\n`);
  } else if (provider === 'brevo') {
    console.log(`Brevo API Key:            YES (Configured securely - HTTPS Port 443)\n`);
  }

  if (!isMailerConfigured()) {
    console.warn('⚠️  STATUS: No email provider configured in environment variables.');
    console.warn('To enable live email dispatch on Render:');
    console.warn('  Option 1 (Recommended for Render HTTPS):');
    console.warn('     RESEND_API_KEY=re_your_api_key');
    console.warn('  Option 2 (Brevo HTTPS):');
    console.warn('     BREVO_API_KEY=xkeysib_your_api_key');
    console.warn('  Option 3 (Direct SMTP):');
    console.warn('     SMTP_USER=your_sender_gmail@gmail.com');
    console.warn('     SMTP_PASS=your_16_char_google_app_password');
    console.warn('\nNote: Orders will continue to be safely created and persisted even when email is pending setup.\n');
    process.exit(0);
  }

  console.log(`Verifying connection and sending test order notification via [${provider.toUpperCase()}]...`);
  const result = await sendTestNotificationEmail(targetEmail);

  if (result.success) {
    console.log('\n✅ SUCCESS: Order notification email sent successfully!');
    console.log(`Provider:     ${result.provider || provider}`);
    console.log(`Message ID:   ${result.messageId}`);
    console.log(`Delivered To: ${result.recipient}`);
    console.log('Please check your inbox (and spam/promotions folder if first time).\n');
  } else {
    console.error('\n❌ FAILED: Could not deliver email.');
    console.error(`Step:         ${result.step || 'DELIVERY'}`);
    console.error(`Error details: ${result.error || result.reason}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during diagnostic test:', err);
  process.exit(1);
});
