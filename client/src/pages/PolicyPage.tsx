import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, FileText } from 'lucide-react';

export const PolicyPage: React.FC = () => {
  const { policyType } = useParams<{ policyType: string }>();

  const policyContent: Record<string, { title: string; body: JSX.Element }> = {
    shipping: {
      title: 'Shipping & Delivery Policy',
      body: (
        <div>
          <h3>Free Shipping Threshold</h3>
          <p>Sri Lakshmi Sarees offers <strong>FREE Express Shipping</strong> across all pin codes in India on orders valued at ₹2,999 or above. For orders under ₹2,999, a flat shipping fee of ₹150 is charged.</p>

          <h3>Dispatch Timeline</h3>
          <p>Orders are dispatched within 24 to 48 working hours from our main Kanchipuram studio. Once dispatched, estimated delivery time is 3 to 5 business days for metro cities, and 4 to 7 days for regional locations.</p>

          <h3>Shipment Tracking & Courier Partners</h3>
          <p>All shipments are fulfilled through our verified logistics integration with <strong>Shiprocket</strong>, utilizing premium courier partners (Delhivery, Blue Dart, DTDC, Xpressbees). You will receive an AWB tracking link via SMS and Email as soon as your package is dispatched.</p>
        </div>
      )
    },
    returns: {
      title: 'Returns, Exchanges & Refund Policy',
      body: (
        <div>
          <h3>7-Day Return Window</h3>
          <p>We take extreme care to ensure thread purity, zari weave perfection, and color matching. If you receive a damaged, defective, or incorrect saree, you can submit a Return / Exchange request within <strong>7 days</strong> of delivery.</p>

          <h3>Eligibility Conditions</h3>
          <p>The saree must be unworn, unwashed, unused, and returned in its original folding condition with all original tags and muslin packaging intact.</p>

          <h3>Reverse Pickup Procedure</h3>
          <p>Once your return request is approved by our admin team, our courier partner will pick up the package directly from your door step. Upon receipt and quality inspection at our studio, refunds or replacements will be processed within 3 business days.</p>
        </div>
      )
    },
    cancellation: {
      title: 'Order Cancellation Policy',
      body: (
        <div>
          <h3>Cancellation Before Shipment</h3>
          <p>Orders can be cancelled free of charge anytime before shipment dispatch. Once the order status is updated to 'Picked Up', cancellation requests cannot be processed directly; however, you may initiate a return upon receipt.</p>

          <h3>Refund Processing for Cancelled Orders</h3>
          <p>For prepaid online orders, cancelled before shipment, 100% full refund will be credited back to your original payment source within 3-5 bank working days.</p>
        </div>
      )
    },
    privacy: {
      title: 'Privacy & Data Protection Policy',
      body: (
        <div>
          <h3>Customer Data Privacy</h3>
          <p>Sri Lakshmi Sarees respects your personal privacy. We never sell, rent, or lease customer contact lists or email addresses to third parties.</p>

          <h3>Payment Credentials Security</h3>
          <p>We do NOT store credit card numbers, debit card PINs, CVVs, or UPI PINs on our servers. All online transactions are processed directly through 256-Bit SSL encrypted Razorpay payment gateway.</p>
        </div>
      )
    },
    terms: {
      title: 'Terms of Service',
      body: (
        <div>
          <h3>Intellectual Property & Authentic Craftsmanship</h3>
          <p>All saree photography, catalog descriptions, brand logos, and original textile designs belong exclusively to Sri Lakshmi Sarees.</p>

          <h3>Handwoven Fabric Characteristics</h3>
          <p>Handwoven silk and cotton sarees naturally possess slight thread variations and weave irregularities. These are authentic hallmarks of genuine handloom weaving, not manufacturing defects.</p>
        </div>
      )
    }
  };

  const current = policyContent[policyType || 'shipping'] || policyContent.shipping;

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '850px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '3rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--color-maroon)', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            {current.title}
          </h1>

          <div style={{ fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.8 }}>
            {current.body}
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/policy/shipping" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              Shipping Policy
            </Link>
            <Link to="/policy/returns" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              Return Policy
            </Link>
            <Link to="/policy/cancellation" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              Cancellation Policy
            </Link>
            <Link to="/policy/privacy" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              Privacy Policy
            </Link>
            <Link to="/policy/terms" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
