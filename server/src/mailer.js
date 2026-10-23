/**
 * Sri Lakshmi Sarees - Order Email Notification Service
 * Sends automated, secure order alerts to the configured business inbox.
 *
 * Multi-Provider Architecture:
 * 1. Resend (HTTPS REST API - Port 443): Highly recommended for cloud platforms (Render, Vercel).
 *    Never blocked by cloud firewall SMTP port restrictions. Set RESEND_API_KEY.
 * 2. Brevo (HTTPS REST API - Port 443): Alternative cloud transactional provider.
 *    Set BREVO_API_KEY and optionally BREVO_SENDER_EMAIL.
 * 3. Direct SMTP (Nodemailer - Port 587/465): For local development or non-firewalled VPS.
 *    Set SMTP_USER and SMTP_PASS (with Gmail App Password).
 *
 * Security & Reliability Safeguards:
 * - Credentials read strictly from backend environment variables.
 * - Sensitive customer payment secrets and raw passwords are never included.
 * - Safe error handling: Email failures do not corrupt order state or throw unhandled exceptions.
 * - Accurate status reporting: Orders are only marked Paid if verified by gateway.
 */

import nodemailer from 'nodemailer';

// Business notification inbox (defaults to official store inbox)
export const getNotificationEmail = () => {
  return (process.env.NOTIFICATION_EMAIL || 'bhavanivejandla6@gmail.com').trim();
};

/**
 * Parse an email address or RFC 5322 string like 'Display Name <user@domain.com>'.
 * Detects domain and checks whether domain is a public freemail domain.
 */
export const parseAddress = (input) => {
  if (!input || typeof input !== 'string') {
    return { name: '', email: '', domain: '', isFreemail: false, isResendShared: false, formatted: '' };
  }
  let str = input.trim();
  // Strip accidental outer quotes, e.g. '"Sri Lakshmi Sarees <...>"'
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  const match = str.match(/^(?:(.*)<)?([^<>@\s]+@[^<>@\s]+)>?$/);
  let name = '';
  let email = '';
  if (match) {
    name = (match[1] || '').trim().replace(/^["']|["']$/g, '');
    email = match[2].trim().toLowerCase();
  } else {
    email = str.toLowerCase();
  }
  const domain = email.split('@')[1] || '';
  const freemailDomains = [
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'yahoo.co.in',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'live.com',
    'aol.com',
  ];
  const isFreemail = freemailDomains.includes(domain);
  const isResendShared = domain === 'resend.dev';
  return {
    name,
    email,
    domain,
    isFreemail,
    isResendShared,
    formatted: name ? `"${name}" <${email}>` : email,
  };
};

/**
 * Detect active mailer provider based on environment variables.
 * Allows explicit override via MAILER_PROVIDER if desired, or defaults to priority: resend > brevo > smtp > none
 *
 * @returns {'resend' | 'brevo' | 'smtp' | 'none'}
 */
export const getMailerProvider = () => {
  const explicit = (process.env.MAILER_PROVIDER || process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'resend' && process.env.RESEND_API_KEY?.trim()) return 'resend';
  if (explicit === 'brevo' && process.env.BREVO_API_KEY?.trim()) return 'brevo';
  if (explicit === 'smtp' && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()) return 'smtp';

  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    return 'resend';
  }
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()) {
    return 'brevo';
  }
  if (
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_USER.trim() &&
    process.env.SMTP_PASS.trim()
  ) {
    return 'smtp';
  }
  return 'none';
};

/**
 * Check if at least one email dispatch provider is configured.
 */
export const isMailerConfigured = () => {
  return getMailerProvider() !== 'none';
};

/**
 * Resolve the sender address string for the active provider.
 * Strips accidental outer quotes and provides secure provider-appropriate defaults.
 */
export const getSenderEmail = () => {
  const provider = getMailerProvider();
  let rawFrom = (process.env.EMAIL_FROM || '').trim();
  if ((rawFrom.startsWith('"') && rawFrom.endsWith('"')) || (rawFrom.startsWith("'") && rawFrom.endsWith("'"))) {
    rawFrom = rawFrom.slice(1, -1).trim();
  }

  if (provider === 'resend') {
    return rawFrom || 'Sri Lakshmi Sarees <onboarding@resend.dev>';
  }
  if (provider === 'brevo') {
    const sender = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || getNotificationEmail()).trim();
    return rawFrom || `"Sri Lakshmi Sarees" <${sender}>`;
  }
  if (provider === 'smtp') {
    const user = (process.env.SMTP_USER || 'orders@srilakshmisarees.com').trim();
    return rawFrom || `"Sri Lakshmi Sarees" <${user}>`;
  }
  return rawFrom || 'no-reply@srilakshmisarees.com';
};

/**
 * Build a reusable nodemailer transporter instance for SMTP fallback.
 */
export const createTransporter = () => {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : '';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

/**
 * Format currency in Indian Rupees
 */
const formatInr = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

/**
 * Generate HTML & Plain text email bodies for an order notification.
 */
export const generateOrderEmailContent = (order) => {
  const orderNumber = order.orderNumber || order.id || 'N/A';
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const paymentMethod = order.paymentMethod || 'COD';
  const paymentStatus = order.paymentStatus || 'Pending';
  const isPaid = paymentStatus.toLowerCase() === 'paid';
  const isCod = paymentMethod.toUpperCase() === 'COD';

  let paymentBadgeColor = '#92400e'; // Amber
  let paymentBadgeBg = '#fef3c7';
  let paymentStatusText = `Pending (${isCod ? 'Cash on Delivery - Collect ₹' + (order.finalTotal || 0) : 'Awaiting Payment'})`;

  if (isPaid) {
    paymentBadgeColor = '#065f46'; // Green
    paymentBadgeBg = '#d1fae5';
    const txnId = order.cashfreePaymentId || order.razorpayPaymentId || '';
    paymentStatusText = `Paid & Verified via Gateway${txnId ? ` (ID: ${txnId})` : ''}`;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.shippingAddress || {};
  const customerName = address.fullName || 'Valued Customer';
  const customerPhone = address.phone || 'Not Provided';
  const customerEmail = order.guestEmail || address.email || 'Not Provided';

  const addressLines = [
    address.houseNo,
    address.street,
    address.locality,
    address.landmark ? `Near ${address.landmark}` : '',
    `${address.city || ''}${address.state ? ', ' + address.state : ''}`,
    address.pincode ? `PIN: ${address.pincode}` : '',
    'India',
  ].filter(Boolean).join(', ');

  // Table rows for items
  const itemsHtml = items.map((item) => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 10px 12px; font-size: 14px; color: #1F2937;">
        <strong>${item.productName || 'Silk Saree'}</strong>
        ${item.productId ? `<br><span style="font-size: 11px; color: #6B7280;">ID: ${item.productId}</span>` : ''}
      </td>
      <td style="padding: 10px 12px; font-size: 14px; color: #1F2937; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 10px 12px; font-size: 14px; color: #1F2937; text-align: right;">${formatInr(item.price)}</td>
      <td style="padding: 10px 12px; font-size: 14px; color: #1F2937; text-align: right; font-weight: 600;">${formatInr(item.lineTotal || (item.price * (item.quantity || 1)))}</td>
    </tr>
  `).join('');

  const itemsText = items.map((i, idx) =>
    `  ${idx + 1}. ${i.productName} x ${i.quantity} = ${formatInr(i.lineTotal || (i.price * i.quantity))}`
  ).join('\n');

  const subject = `[New Order] #${orderNumber} - ${formatInr(order.finalTotal)} (${paymentMethod} - ${paymentStatus})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order #${orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F5F0; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #E5E0D8;">

          <!-- Brand Header -->
          <tr>
            <td style="background-color: #5C061C; padding: 24px; text-align: center; border-bottom: 3px solid #D4AF37;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">
                Sri Lakshmi Sarees
              </h1>
              <p style="margin: 4px 0 0; color: #F5E6C8; font-size: 13px; letter-spacing: 0.3px;">
                Handwoven Pure Silk & Traditional Sarees • Dispatch Alert
              </p>
            </td>
          </tr>

          <!-- Notification Title Banner -->
          <tr>
            <td style="padding: 20px 24px 16px; background-color: #FFFDF9; border-bottom: 1px solid #EFEAE2;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div>
                  <h2 style="margin: 0; font-size: 18px; color: #5C061C; font-weight: 700;">
                    🎉 New Order Received!
                  </h2>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #6B7280;">
                    Order Number: <strong style="color: #111827;">#${orderNumber}</strong> • ${orderDate}
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Payment Status Callout -->
          <tr>
            <td style="padding: 16px 24px;">
              <div style="background-color: ${paymentBadgeBg}; border: 1px solid ${paymentBadgeColor}33; border-radius: 6px; padding: 12px 16px;">
                <p style="margin: 0; font-size: 13px; color: ${paymentBadgeColor}; font-weight: 600;">
                  Payment Method: <span style="text-transform: uppercase;">${paymentMethod}</span> &nbsp;|&nbsp; Status: <span>${paymentStatusText}</span>
                </p>
              </div>
            </td>
          </tr>

          <!-- Ordered Items Table -->
          <tr>
            <td style="padding: 8px 24px 16px;">
              <h3 style="margin: 0 0 12px; font-size: 15px; color: #5C061C; border-bottom: 2px solid #F3EDE4; padding-bottom: 6px;">
                Order Items (${items.reduce((sum, i) => sum + (i.quantity || 1), 0)} Sarees)
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #F9FAFB; border-bottom: 1px solid #E5E7EB; text-align: left;">
                    <th style="padding: 8px 12px; font-size: 12px; color: #6B7280; text-transform: uppercase;">Item</th>
                    <th style="padding: 8px 12px; font-size: 12px; color: #6B7280; text-transform: uppercase; text-align: center;">Qty</th>
                    <th style="padding: 8px 12px; font-size: 12px; color: #6B7280; text-transform: uppercase; text-align: right;">Price</th>
                    <th style="padding: 8px 12px; font-size: 12px; color: #6B7280; text-transform: uppercase; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Breakdown -->
          <tr>
            <td style="padding: 0 24px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FBF9F6; border-radius: 6px; padding: 12px 16px;">
                <tr>
                  <td style="font-size: 13px; color: #4B5563; padding: 4px 0;">Subtotal:</td>
                  <td style="font-size: 13px; color: #1F2937; text-align: right; font-weight: 500;">${formatInr(order.subtotal)}</td>
                </tr>
                ${order.discount ? `
                <tr>
                  <td style="font-size: 13px; color: #059669; padding: 4px 0;">Discount (${order.couponCode || 'Promo'}):</td>
                  <td style="font-size: 13px; color: #059669; text-align: right; font-weight: 500;">-${formatInr(order.discount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="font-size: 13px; color: #4B5563; padding: 4px 0;">Shipping:</td>
                  <td style="font-size: 13px; color: #1F2937; text-align: right; font-weight: 500;">${order.shippingCharge === 0 ? 'FREE Express' : formatInr(order.shippingCharge)}</td>
                </tr>
                <tr style="border-top: 1px solid #E5E0D8;">
                  <td style="font-size: 15px; color: #5C061C; font-weight: 700; padding: 8px 0 4px;">Grand Total:</td>
                  <td style="font-size: 16px; color: #5C061C; text-align: right; font-weight: 700; padding: 8px 0 4px;">${formatInr(order.finalTotal)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer & Delivery Information -->
          <tr>
            <td style="padding: 8px 24px 24px;">
              <h3 style="margin: 0 0 12px; font-size: 15px; color: #5C061C; border-bottom: 2px solid #F3EDE4; padding-bottom: 6px;">
                Customer & Shipping Address
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; padding: 14px 16px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6B7280; width: 120px;">Customer Name:</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #111827; font-weight: 600;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6B7280;">Phone Number:</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #111827; font-weight: 600;">
                    <a href="tel:${String(customerPhone).replace(/[^0-9+]/g, '')}" style="color: #5C061C; text-decoration: none;">
                      ${customerPhone}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #6B7280;">Email Address:</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #111827;">${customerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0 2px; font-size: 13px; color: #6B7280; vertical-align: top;">Delivery Address:</td>
                  <td style="padding: 6px 0 2px; font-size: 13px; color: #1F2937; line-height: 1.5;">${addressLines}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dispatch Instructions Footer -->
          <tr>
            <td style="background-color: #FBF9F6; padding: 16px 24px; border-top: 1px solid #EFEAE2; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6B7280;">
                Next Step: Prepare parcel at Sri Lakshmi Sarees dispatch facility and schedule courier pickup via Shiprocket / Admin Portal.
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #9CA3AF;">
                Sri Lakshmi Sarees Automated Order Dispatch Service • Privacy Compliant
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
========================================
SRI LAKSHMI SAREES - NEW ORDER ALERT
========================================

Order Number: #${orderNumber}
Order Date: ${orderDate}
Payment Method: ${paymentMethod}
Payment Status: ${paymentStatusText}

ITEMS ORDERED:
${itemsText}

FINANCIAL BREAKDOWN:
- Subtotal: ${formatInr(order.subtotal)}
${order.discount ? `- Discount (${order.couponCode || 'Promo'}): -${formatInr(order.discount)}\n` : ''}- Shipping: ${order.shippingCharge === 0 ? 'FREE' : formatInr(order.shippingCharge)}
- Grand Total: ${formatInr(order.finalTotal)}

CUSTOMER & SHIPPING DETAILS:
- Name: ${customerName}
- Phone: ${customerPhone}
- Email: ${customerEmail}
- Delivery Address: ${addressLines}

========================================
Please prepare parcel for shipment.
========================================
  `.trim();

  return { subject, html, text };
};

/**
 * Dispatch an email via Resend HTTPS REST API (Port 443).
 */
async function sendViaResend({ recipient, subject, html, text }) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = getSenderEmail();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      html,
      text,
    }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const errorMsg =
      data.message ||
      (typeof data.error === 'string' ? data.error : data.error?.message) ||
      `Resend API returned HTTP ${response.status}`;
    const err = new Error(errorMsg);
    err.provider = 'resend';
    err.status = response.status;
    err.resendName = data.name || data.type;
    err.resendCode = data.statusCode || response.status;
    err.from = from;
    err.recipient = recipient;
    err.rawResponse = data;
    throw err;
  }

  return {
    success: true,
    messageId: data.id,
    provider: 'resend',
  };
}

/**
 * Dispatch an email via Brevo HTTPS REST API (Port 443).
 */
async function sendViaBrevo({ recipient, subject, html, text }) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || getNotificationEmail()).trim();
  const fromName = 'Sri Lakshmi Sarees';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: senderEmail },
      to: [{ email: recipient }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const errorMsg = data.message || `Brevo API returned HTTP ${response.status}`;
    const err = new Error(errorMsg);
    err.provider = 'brevo';
    err.status = response.status;
    err.from = senderEmail;
    err.recipient = recipient;
    throw err;
  }

  return {
    success: true,
    messageId: data.messageId,
    provider: 'brevo',
  };
}

/**
 * Dispatch an email via Direct SMTP (Nodemailer).
 */
async function sendViaSmtp({ recipient, subject, html, text }) {
  const transporter = createTransporter();
  const senderEmail = (process.env.SMTP_USER || 'orders@srilakshmisarees.com').trim();
  const from = process.env.EMAIL_FROM
    ? process.env.EMAIL_FROM.trim()
    : `"Sri Lakshmi Sarees" <${senderEmail}>`;

  const info = await transporter.sendMail({
    from,
    to: recipient,
    subject,
    text,
    html,
  });

  return {
    success: true,
    messageId: info.messageId,
    provider: 'smtp',
  };
}

/**
 * Classify errors safely into actionable diagnostic messages without leaking secrets.
 * Preserves the actual provider error while providing clear diagnostic context.
 */
export function classifyEmailError(error, provider, context = {}) {
  const msg = error?.message || String(error);
  const code = error?.code || '';
  const status = error?.status;
  const from = context.from || getSenderEmail();
  const recipient = context.recipient || getNotificationEmail();
  const parsedSender = parseAddress(from);

  // 1. Connection / Port Restrictions (Render SMTP blocks or general network timeouts)
  if (
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    msg.toLowerCase().includes('timeout') ||
    msg.toLowerCase().includes('timed out') ||
    msg.toLowerCase().includes('fetch failed')
  ) {
    return {
      step: 'NETWORK_CONNECTION',
      message:
        provider === 'smtp'
          ? 'Outbound SMTP connection timed out. Cloud hosting environments (like Render) block direct outbound SMTP traffic on ports 587, 465, and 25. To enable delivery, configure an HTTPS transactional provider (set RESEND_API_KEY in Render Environment).'
          : `Outbound HTTPS network connection failed while reaching ${provider} API. Check network connectivity.`,
      raw: msg,
    };
  }

  // 2. SMTP 535 Bad Credentials
  if (msg.includes('535') || error?.responseCode === 535) {
    return {
      step: 'AUTHENTICATION',
      message:
        'SMTP authentication failed (535). If using Gmail, verify you are using a 16-character Google App Password (not your primary account password) with 2-Step Verification enabled.',
      raw: msg,
    };
  }

  // 3. Resend Specific Errors
  if (provider === 'resend') {
    const lower = msg.toLowerCase();

    // 3a. Authentication (401 or invalid key)
    if (status === 401 || lower.includes('api key') || lower.includes('unauthorized')) {
      return {
        step: 'AUTHENTICATION',
        message: 'Invalid or missing RESEND_API_KEY. Verify the API key in your Render Environment settings.',
        raw: msg,
      };
    }

    // 3b. Test sender recipient restriction (using onboarding@resend.dev but recipient is not registered Resend account email)
    if (
      (parsedSender.isResendShared || lower.includes('testing emails to your own email address') || lower.includes('only send testing')) &&
      (lower.includes('own email address') || lower.includes('testing emails') || lower.includes('to your own'))
    ) {
      return {
        step: 'TEST_SENDER_RECIPIENT_RESTRICTION',
        message:
          `Resend test sender restriction: When sending from '${parsedSender.email}', Resend only permits delivering to the email address registered with your Resend account. To deliver order alerts to '${recipient}', you must either: 1) Register/use the Resend account registered under '${recipient}', or 2) Verify a custom domain in Resend and send from your verified domain.`,
        raw: msg,
      };
    }

    // 3c. Unverified sender domain
    if (lower.includes('domain is not verified') || lower.includes('not verified') || lower.includes('verify your domain')) {
      if (parsedSender.isFreemail) {
        return {
          step: 'SENDER_DOMAIN_UNVERIFIED',
          message:
            `Resend cannot send from public email domains like '@${parsedSender.domain}'. Resend requires sending from either 'onboarding@resend.dev' (for testing to your registered Resend account email) or a custom domain that you own. Remove EMAIL_FROM in Render settings to use 'onboarding@resend.dev', or configure a verified custom domain.`,
          raw: msg,
        };
      }
      return {
        step: 'SENDER_DOMAIN_UNVERIFIED',
        message:
          `The sender domain '${parsedSender.domain || 'specified in EMAIL_FROM'}' is not verified in Resend. Please add and verify your domain DNS records (SPF, DKIM, DMARC) in the Resend dashboard at https://resend.com/domains.`,
        raw: msg,
      };
    }

    // 3d. Rate limiting or quota
    if (status === 429 || lower.includes('rate limit') || lower.includes('quota')) {
      return {
        step: 'RATE_LIMIT',
        message: `Resend sending rate limit or quota exceeded: ${msg}`,
        raw: msg,
      };
    }

    // 3e. Other 403 Forbidden
    if (status === 403) {
      return {
        step: 'DOMAIN_AUTHORIZATION',
        message: `Resend authorization rejected: ${msg}`,
        raw: msg,
      };
    }

    // 3f. Other 422 Validation Error
    if (status === 422 || lower.includes('validation')) {
      return {
        step: 'PAYLOAD_VALIDATION',
        message: `Resend payload validation error: ${msg}`,
        raw: msg,
      };
    }
  }

  // 4. Brevo Specific Errors
  if (provider === 'brevo') {
    const lower = msg.toLowerCase();
    if (status === 401 || lower.includes('key not found') || lower.includes('unauthorized')) {
      return {
        step: 'AUTHENTICATION',
        message: 'Invalid BREVO_API_KEY. Verify the API key in your Render Environment settings.',
        raw: msg,
      };
    }
    if (status === 400 && (lower.includes('sender') || lower.includes('unverified'))) {
      return {
        step: 'SENDER_DOMAIN_UNVERIFIED',
        message: `Brevo sender not verified: ${msg}. Add and verify your sender email in the Brevo dashboard under Settings > Senders.`,
        raw: msg,
      };
    }
  }

  return {
    step: 'DELIVERY_DISPATCH',
    message: msg,
    raw: msg,
  };
}

/**
 * Send order notification email to the configured business inbox.
 *
 * @param {Object} order - Full order object
 * @param {Object} [options] - Additional options (e.g. triggerSource, recipient)
 * @returns {Promise<{ success: boolean, simulated?: boolean, messageId?: string, provider?: string, error?: string, providerError?: string, step?: string, recipient?: string, sender?: string, orderNumber?: string }>}
 */
export const sendOrderNotificationEmail = async (order, options = {}) => {
  const recipient = (options.recipient || getNotificationEmail()).trim();
  const orderNumber = order?.orderNumber || order?.id || 'UNKNOWN';
  const provider = getMailerProvider();
  const from = getSenderEmail();

  if (provider === 'none') {
    console.info(
      `[Mailer] No email provider configured. Notification for order #${orderNumber} (${order.paymentMethod} - ${order.paymentStatus}) logged safely. To enable live delivery on Render, set RESEND_API_KEY in environment.`
    );
    return {
      success: false,
      reason: 'MAILER_NOT_CONFIGURED',
      simulated: true,
      recipient,
      sender: from,
      orderNumber,
    };
  }

  try {
    const { subject, html, text } = generateOrderEmailContent(order);
    console.info(`[Mailer] Dispatching order alert for #${orderNumber} to ${recipient} via [${provider.toUpperCase()}] (from: ${from})...`);

    let result;
    if (provider === 'resend') {
      result = await sendViaResend({ recipient, subject, html, text });
    } else if (provider === 'brevo') {
      result = await sendViaBrevo({ recipient, subject, html, text });
    } else {
      result = await sendViaSmtp({ recipient, subject, html, text });
    }

    console.info(`[Mailer] Order alert delivered successfully via ${provider}! MessageID: ${result.messageId}`);
    return {
      success: true,
      messageId: result.messageId,
      provider,
      sender: from,
      recipient,
      orderNumber,
    };
  } catch (error) {
    const classified = classifyEmailError(error, provider, { from, recipient });
    console.error(`[Mailer] Failed to send order notification for #${orderNumber} via ${provider}:`, classified.message);
    if (classified.raw && classified.raw !== classified.message) {
      console.error(`[Mailer] Provider raw response:`, classified.raw);
    }
    return {
      success: false,
      error: classified.message,
      providerError: classified.raw,
      step: classified.step,
      provider,
      sender: from,
      recipient,
      orderNumber,
    };
  }
};

/**
 * Send a verification / test email to confirm live delivery without placing a payment.
 *
 * @param {string} [targetEmail] - Optional target email address (defaults to business notification email)
 * @returns {Promise<{ success: boolean, messageId?: string, provider?: string, details?: any, error?: string, step?: string }>}
 */
export const sendTestNotificationEmail = async (targetEmail) => {
  const recipient = (targetEmail || getNotificationEmail()).trim();
  const provider = getMailerProvider();

  if (provider === 'none') {
    return {
      success: false,
      reason: 'MAILER_NOT_CONFIGURED',
      message:
        'No email provider configured. On Render, set RESEND_API_KEY (recommended HTTPS API) or SMTP credentials in Environment Variables.',
      recipient,
      provider: 'none',
    };
  }

  // If SMTP mode is selected, test TCP socket connection first
  if (provider === 'smtp') {
    const transporter = createTransporter();
    try {
      await transporter.verify();
    } catch (verifyErr) {
      const classified = classifyEmailError(verifyErr, 'smtp');
      console.error('[Mailer] SMTP connection verification failed:', classified.message);
      return {
        success: false,
        step: classified.step,
        error: classified.message,
        details: classified.raw,
        provider: 'smtp',
        recipient,
      };
    }
  }

  // Build mock verified test order
  const mockOrder = {
    id: `ord-test-${Date.now()}`,
    orderNumber: `SLS-TEST-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
    paymentMethod: 'Prepaid',
    paymentStatus: 'Paid',
    razorpayPaymentId: 'pay_test_verification_dummy_id',
    orderStatus: 'Payment Confirmed',
    subtotal: 12999,
    discount: 1300,
    couponCode: 'LAKSHMI10',
    shippingCharge: 0,
    finalTotal: 11699,
    items: [
      {
        productId: 'prod-test-01',
        productName: 'Royal Kanchipuram Pure Zari Silk Saree (Test Item)',
        price: 12999,
        quantity: 1,
        lineTotal: 12999,
      },
    ],
    shippingAddress: {
      fullName: 'Order Notification Test Recipient',
      phone: '9876543210',
      email: recipient,
      houseNo: 'Dispatch Studio Hub',
      street: 'Tekupalli Entrance',
      locality: 'Mopidevi',
      landmark: 'Near Temple Road',
      city: 'Mopidevi',
      state: 'Andhra Pradesh',
      pincode: '521125',
    },
  };

  const result = await sendOrderNotificationEmail(mockOrder, { recipient });
  return result;
};
