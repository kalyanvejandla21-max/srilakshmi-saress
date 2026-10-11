import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { CheckCircle, Truck, Package, Calendar, ArrowRight } from 'lucide-react';
import { Order } from '../types';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const order: Order | undefined = location.state?.order;

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '3rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--color-maroon)' }}>
            <CheckCircle size={36} />
          </div>

          <span style={{ fontSize: '0.8125rem', color: 'var(--color-gold-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Thank You for Shopping with Sri Lakshmi Sarees!
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--color-maroon)', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
            Order Confirmed!
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
            Your order number is <strong style={{ color: 'var(--color-maroon)' }}>#{orderNumber}</strong>. We have sent confirmation details to your contact info.
          </p>

          {/* Order Details Card */}
          {order && (
            <div style={{ textAlign: 'left', backgroundColor: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Payment Status</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-maroon)' }}>{order.paymentMethod} ({order.paymentStatus})</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Shipping Address</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.shippingAddress.fullName}, {order.shippingAddress.city}, {order.shippingAddress.pincode}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-maroon)', marginBottom: '0.75rem' }}>
                Items Ordered:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={item.image} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      <span>{item.productName} × {item.quantity}</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>₹{item.lineTotal.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, borderTop: '1px dashed var(--color-border-dark)', paddingTop: '0.75rem', marginTop: '1rem', color: 'var(--color-maroon)' }}>
                <span>Total Amount Paid / Due:</span>
                <span>₹{order.finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/track-order?order=${orderNumber}`} className="btn-primary">
              <Truck size={18} /> Track Order Status
            </Link>
            <Link to="/shop" className="btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
