import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { BUSINESS_CONFIG } from '../config/businessConfig';

export const PolicyPage: React.FC = () => {
  const { policyType } = useParams<{ policyType: string }>();
  const activeType = policyType || 'shipping';

  const policyContent: Record<string, { title: string; body: JSX.Element }> = {
    shipping: {
      title: 'Shipping & Delivery Policy',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              1. Delivery Coverage & Shipping Charges
            </h3>
            <p>
              {BUSINESS_CONFIG.brandName} delivers across all serviceable postal PIN codes in India. We offer <strong>FREE Standard Express Shipping</strong> on all domestic orders valued at <strong>₹{BUSINESS_CONFIG.policies.freeShippingThreshold.toLocaleString('en-IN')} or above</strong>.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              For orders below ₹{BUSINESS_CONFIG.policies.freeShippingThreshold.toLocaleString('en-IN')}, a flat delivery fee of <strong>₹{BUSINESS_CONFIG.policies.standardShippingFee}</strong> is applied at checkout to cover courier logistics and protective packaging.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              2. Order Dispatch & Delivery Timelines
            </h3>
            <p>
              Each saree undergoes quality check and careful folding before packing. Orders are dispatched within <strong>{BUSINESS_CONFIG.policies.dispatchTimeline}</strong> from our operating facility.
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <li><strong>Metro & Major Cities:</strong> {BUSINESS_CONFIG.policies.metroDeliveryDays} from dispatch date.</li>
              <li><strong>Regional & Non-Metro Locations:</strong> {BUSINESS_CONFIG.policies.regionalDeliveryDays} from dispatch date.</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              3. Courier Partners & Tracking
            </h3>
            <p>
              Shipments are fulfilled through {BUSINESS_CONFIG.policies.courierPartners}. Once your order is dispatched, a real-time Air Waybill (AWB) tracking link is generated and sent via SMS and Email. You can also monitor delivery status anytime on our <Link to="/track-order" style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>Track Order page</Link>.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              4. Damaged or Tampered Shipments
            </h3>
            <p>
              If the outer courier parcel appears noticeably damaged, opened, or tampered with at the time of delivery, please report it to the courier delivery executive immediately and contact our customer support team. If you accept the parcel, please record a clear unboxing video and take photographs of the packaging and any damaged contents. Any such issue must be reported within <strong>48 hours</strong> of delivery through our <Link to="/contact" style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>Contact Us page</Link> or by emailing <a href={`mailto:${BUSINESS_CONFIG.contact.email}`} style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>{BUSINESS_CONFIG.contact.email}</a> with your Order Number and evidence, subject to review under our return and exchange policy.
            </p>
          </div>
        </div>
      )
    },

    returns: {
      title: 'Returns, Exchanges & Refund Policy',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              1. {BUSINESS_CONFIG.policies.returnWindowDays}-Day Return & Exchange Window
            </h3>
            <p>
              We want you to be delighted with your saree. If you receive a damaged, defective, or mismatched item, you may request a return or exchange within <strong>{BUSINESS_CONFIG.policies.returnWindowDays} calendar days</strong> from the date of confirmed delivery.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              2. Eligibility Criteria for Returns
            </h3>
            <p>To qualify for a refund or replacement, the item must fulfill the following conditions:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <li>The saree must be unworn, unwashed, unaltered, and free from perfume, body odor, or stains.</li>
              <li>All original brand tags, fold lines, and protective packaging (muslin wrap / box) must remain intact.</li>
              <li>Blouse fabric must remain unstitched and unsevered from the running saree length.</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              3. How to Submit a Return or Exchange Request
            </h3>
            <p>
              To initiate a return, contact our support team within {BUSINESS_CONFIG.policies.returnWindowDays} days of receiving your parcel:
            </p>
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', margin: '0.5rem 0' }}>
              <div><strong>Email Support:</strong> <a href={`mailto:${BUSINESS_CONFIG.contact.email}`} style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>{BUSINESS_CONFIG.contact.email}</a></div>
              <div><strong>Phone / WhatsApp:</strong> <a href={`tel:${BUSINESS_CONFIG.contact.phone?.replace(/[^0-9+]/g, '')}`} style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>{BUSINESS_CONFIG.contact.phoneDisplay}</a></div>
              <div style={{ marginTop: '0.375rem', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                Please mention your <strong>Order Number</strong> and attach a clear photograph or unboxing video highlighting the issue.
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              4. Reverse Pickup & Inspection
            </h3>
            <p>
              Upon verification, our logistics partner will arrange a doorstep reverse pickup from your delivery address. Once the saree is received at our facility and passes physical inspection, your refund or replacement will be processed within <strong>3 to 5 business days</strong>.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              5. Refund Crediting Mode
            </h3>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <li><strong>Prepaid Orders (Cards, Net Banking, UPI):</strong> Refunds are credited directly back to the original source payment account within 5 to 7 banking working days.</li>
              <li><strong>Cash on Delivery (COD) Orders:</strong> Refunds are credited via secure NEFT / IMPS bank transfer or UPI transfer upon receiving your verified bank account details.</li>
            </ul>
          </div>
        </div>
      )
    },

    cancellation: {
      title: 'Order Cancellation Policy',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              1. Customer Cancellation Before Dispatch
            </h3>
            <p>
              You may cancel an order free of charge at any time before it has been dispatched from our studio. To cancel, please email <a href={`mailto:${BUSINESS_CONFIG.contact.email}`} style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>{BUSINESS_CONFIG.contact.email}</a> or reach out through our <Link to="/contact" style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>Contact Us</Link> page with your Order Number prior to shipment.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              2. Cancellation After Dispatch
            </h3>
            <p>
              Once an order has been picked up by the courier and an AWB has been issued, it cannot be cancelled in transit. In such cases, you may accept delivery and initiate a standard return under our 7-day return policy, or refuse delivery at your doorstep.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              3. Refund for Cancelled Orders
            </h3>
            <p>
              For prepaid orders successfully cancelled prior to dispatch, a 100% full refund is initiated immediately and credited to your original payment mode within <strong>3 to 5 banking working days</strong>.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              4. Merchant Cancellation Rights
            </h3>
            <p>
              {BUSINESS_CONFIG.brandName} reserves the right to cancel an order under unforeseen circumstances, including unexpected inventory stockout, delivery unserviceability to a specific pin code, or failed payment security verification. In any such rare event, the customer will be notified immediately and issued a 100% full refund.
            </p>
          </div>
        </div>
      )
    },

    privacy: {
      title: 'Privacy & Data Protection Policy',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              1. Information We Collect
            </h3>
            <p>
              We collect only the essential personal details required to process, fulfill, and deliver your saree orders: customer name, shipping address, contact phone number, and email address. We do not sell, rent, or trade your personal information to third-party marketing entities.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              2. Payment Credentials & Transaction Security
            </h3>
            <p>
              {BUSINESS_CONFIG.brandName} does <strong>NOT</strong> collect, view, or store your debit/credit card numbers, CVVs, net banking credentials, or UPI PINs on our servers. All financial transactions are securely handled through <strong>256-Bit SSL encrypted Razorpay payment gateway</strong> conforming to strict RBI and PCI-DSS compliance standards.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              3. Logistics & Third-Party Sharing
            </h3>
            <p>
              Your delivery name, shipping address, and phone number are shared solely with our authorized logistics integration partner (Shiprocket and assigned courier carriers) for the strict purpose of completing doorstep delivery and tracking notifications.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              4. Customer Inquiries & Dispute Handling
            </h3>
            <p>
              For privacy queries, order discrepancies, or customer grievances, consumers may reach our customer management desk:
            </p>
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', margin: '0.5rem 0' }}>
              <div><strong>Support Desk:</strong> Family Management Team</div>
              <div><strong>Email:</strong> <a href={`mailto:${BUSINESS_CONFIG.contact.email}`} style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>{BUSINESS_CONFIG.contact.email}</a></div>
              <div><strong>Phone:</strong> <a href={`tel:${BUSINESS_CONFIG.contact.phone?.replace(/[^0-9+]/g, '')}`} style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>{BUSINESS_CONFIG.contact.phoneDisplay}</a></div>
              <div><strong>Dispatch Facility:</strong> {BUSINESS_CONFIG.contact.fullAddress}</div>
              <div style={{ marginTop: '0.375rem', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                {BUSINESS_CONFIG.grievanceOfficer.notice}
              </div>
            </div>
          </div>
        </div>
      )
    },

    terms: {
      title: 'Terms of Service',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              1. Platform Ownership & Agreement
            </h3>
            <p>
              This website is operated by <strong>{BUSINESS_CONFIG.brandName}</strong>, a family-run enterprise. Throughout the site, the terms "we", "us", and "our" refer to {BUSINESS_CONFIG.brandName}. By accessing this site or purchasing an item, you agree to be bound by these Terms of Service.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              2. Product Accuracy & Handloom Characteristics
            </h3>
            <p>
              We strive to display the colors, fabrics, and designs of our sarees as accurately as possible. However, handwoven textiles (pure silk, mulmul cotton, and handloom blends) may exhibit minor natural variations in thread texture, weave slubs, and color depth. Furthermore, slight color variations may occur due to device screen settings and studio lighting. These are hallmarks of genuine handwoven craftsmanship.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              3. Pricing & Taxes
            </h3>
            <p>
              All prices displayed on {BUSINESS_CONFIG.brandName} are in <strong>Indian Rupees (INR)</strong> and are inclusive of applicable taxes. Shipping fees, if applicable, are clearly calculated and displayed at checkout before payment confirmation.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
              4. Governing Law & Dispute Resolution
            </h3>
            <p>
              These Terms of Service and any transactional agreements shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with purchases made on this website shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
          </div>
        </div>
      )
    }
  };

  const current = policyContent[activeType] || policyContent.shipping;

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '850px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: 'clamp(1.5rem, 4vw, 3rem)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', color: 'var(--color-maroon)', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            {current.title}
          </h1>

          <div style={{ fontSize: '0.9375rem', color: 'var(--color-text)', lineHeight: 1.8 }}>
            {current.body}
          </div>

          {/* Policy Navigation Tabs */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/policy/shipping"
              className={activeType === 'shipping' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
            >
              Shipping Policy
            </Link>
            <Link
              to="/policy/returns"
              className={activeType === 'returns' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
            >
              Return Policy
            </Link>
            <Link
              to="/policy/cancellation"
              className={activeType === 'cancellation' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
            >
              Cancellation Policy
            </Link>
            <Link
              to="/policy/privacy"
              className={activeType === 'privacy' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
            >
              Privacy Policy
            </Link>
            <Link
              to="/policy/terms"
              className={activeType === 'terms' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
