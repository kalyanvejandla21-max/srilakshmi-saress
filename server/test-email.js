/**
 * Sri Lakshmi Sarees - Email Notification Diagnostic & Verification Script
 *
 * Usage:
 *   node test-email.js
 *
 * Tests SMTP credentials, transporter connectivity, and dispatches a
 * test order notification to the configured business email (bhavanivejandla6@gmail.com).
 */

import dotenv from 'dotenv';
dotenv.config();

import {
  isMailerConfigured,
  getNotificationEmail,
  sendTestNotificationEmail,
} from './src/mailer.js';

async function main() {
  console.log('========================================================');
  console.log(' Sri Lakshmi Sarees - Email Notification Diagnostic Tool');
  console.log('========================================================\n');

  const targetEmail = getNotificationEmail();
  console.log(`Configured Business Inbox: ${targetEmail}`);
  console.log(`SMTP Host:                ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
  console.log(`SMTP Port:                ${process.env.SMTP_PORT || '587 (default)'}`);
  console.log(`SMTP User Configured:     ${process.env.SMTP_USER ? 'YES (' + process.env.SMTP_USER + ')' : 'NO'}`);
  console.log(`SMTP Pass Configured:     ${process.env.SMTP_PASS ? 'YES (configured securely)' : 'NO'}\n`);

  if (!isMailerConfigured()) {
    console.warn('⚠️  STATUS: SMTP credentials are not yet configured in environment variables.');
    console.warn('To enable live email dispatch:');
    console.warn('  1. In local server/.env or Render Dashboard, set:');
    console.warn('     SMTP_USER=your_sender_gmail@gmail.com');
    console.warn('     SMTP_PASS=your_16_char_google_app_password');
    console.warn('     NOTIFICATION_EMAIL=bhavanivejandla6@gmail.com');
    console.warn('\nNote: Orders will continue to be safely created and persisted even when email is pending setup.\n');
    process.exit(0);
  }

  console.log('Verifying connection and sending test order notification...');
  const result = await sendTestNotificationEmail(targetEmail);

  if (result.success) {
    console.log('\n✅ SUCCESS: Order notification email sent successfully!');
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Delivered To: ${result.recipient}`);
    console.log('Please check your inbox (and spam/promotions folder if first time).\n');
  } else {
    console.error('\n❌ FAILED: Could not deliver email.');
    console.error(`Error details: ${result.error || result.reason}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during diagnostic test:', err);
  process.exit(1);
});
