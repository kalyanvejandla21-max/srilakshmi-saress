/**
 * Sri Lakshmi Sarees - Order Email Notification Service
 * Sends automated, secure order alerts to the configured business inbox.
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
 * Check if SMTP credentials are fully provided in backend environment.
 */
export const isMailerConfigured = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(user && pass && user.trim() && pass.trim());
};

/**
 * Build a reusable nodemailer transporter instance.
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
    // Sensible connection timeouts
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
    paymentStatusText = `Paid & Verified via Gateway${order.razorpayPaymentId ? ` (ID: ${order.razorpayPaymentId})` : ''}`;
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
  const itemsHtml = items.map((item, idx) => `
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
 * Send order notification email to the configured business inbox.
 *
 * @param {Object} order - Full order object
 * @param {Object} [options] - Additional options (e.g. triggerSource, customRecipient)
 * @returns {Promise<{ success: boolean, simulated?: boolean, messageId?: string, error?: string }>}
 */
export const sendOrderNotificationEmail = async (order, options = {}) => {
  const recipient = (options.recipient || getNotificationEmail()).trim();
  const orderNumber = order?.orderNumber || order?.id || 'UNKNOWN';

  // Safeguard: Check if SMTP is configured
  if (!isMailerConfigured()) {
    console.info(
      `[Mailer] SMTP not configured. Notification for order #${orderNumber} (${order.paymentMethod} - ${order.paymentStatus}) logged safely. To enable live delivery, set SMTP_USER and SMTP_PASS in environment.`
    );
    return {
      success: false,
      reason: 'SMTP_NOT_CONFIGURED',
      simulated: true,
      recipient,
      orderNumber,
    };
  }

  try {
    const transporter = createTransporter();
    const { subject, html, text } = generateOrderEmailContent(order);

    const senderEmail = (process.env.SMTP_USER || 'orders@srilakshmisarees.com').trim();
    const from = process.env.EMAIL_FROM
      ? process.env.EMAIL_FROM.trim()
      : `"Sri Lakshmi Sarees" <${senderEmail}>`;

    console.info(`[Mailer] Dispatching order alert for #${orderNumber} to ${recipient}...`);

    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject,
      text,
      html,
    });

    console.info(`[Mailer] Order alert sent successfully! MessageID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      recipient,
      orderNumber,
    };
  } catch (error) {
    // Safe error logging: Do NOT log passwords or secrets
    console.error(`[Mailer] Failed to send order notification for #${orderNumber}:`, error.message);
    return {
      success: false,
      error: error.message,
      recipient,
      orderNumber,
    };
  }
};

/**
 * Send a verification / test email to confirm live SMTP delivery without placing a payment.
 *
 * @param {string} [targetEmail] - Optional target email address (defaults to business notification email)
 * @returns {Promise<{ success: boolean, messageId?: string, details?: any, error?: string }>}
 */
export const sendTestNotificationEmail = async (targetEmail) => {
  const recipient = (targetEmail || getNotificationEmail()).trim();

  if (!isMailerConfigured()) {
    return {
      success: false,
      reason: 'SMTP_NOT_CONFIGURED',
      message: 'SMTP credentials (SMTP_USER / SMTP_PASS) are not set in the environment variables.',
      recipient,
    };
  }

  const transporter = createTransporter();

  // 1. Verify SMTP connection first
  try {
    await transporter.verify();
  } catch (verifyErr) {
    console.error('[Mailer] Transporter verification failed:', verifyErr.message);
    return {
      success: false,
      step: 'TRANSPORTER_VERIFICATION',
      error: verifyErr.message,
      recipient,
    };
  }

  // 2. Build mock verified test order
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
