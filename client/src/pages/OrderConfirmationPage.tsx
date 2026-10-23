import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { CheckCircle, Truck, AlertTriangle, Clock, RefreshCw, Loader2, Phone } from 'lucide-react';
import { Order } from '../types';
import { useCart } from '../context/CartContext';
import { verifyCashfreePaymentApi, fetchOrderFromServer } from '../services/api';
import { BUSINESS_CONFIG } from '../config/businessConfig';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const { clearCart } = useCart();

  const [order, setOrder] = useState<Order | undefined>(location.state?.order);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyOrFetchOrder = async () => {
      if (!orderNumber) return;

      // If order was passed in navigation state and is already confirmed (Paid or COD), we're good
      if (order && (order.paymentStatus === 'Paid' || order.paymentMethod === 'COD')) {
        return;
      }

      // If order is Prepaid and unverified, or order was not in navigation state (e.g. redirected from Cashfree return_url)
      setIsVerifying(true);
      setVerifyError(null);

      try {
        // Authoritative server-side verification: server directly queries Cashfree API
        const verifiedOrder = await verifyCashfreePaymentApi(orderNumber);
        if (isMounted) {
          setOrder(verifiedOrder);
          clearCart();
          setIsVerifying(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        // If verification with Cashfree didn't confirm payment, fetch current order record to inspect state
        try {
          const fetched = await fetchOrderFromServer(orderNumber);
          if (fetched && fetched.order) {
            setOrder(fetched.order);
            if (fetched.order.paymentStatus === 'Paid' || fetched.order.paymentMethod === 'COD') {
              clearCart();
              setIsVerifying(false);
              return;
            }
          }
        } catch {
          // Ignore fetch fallback error
        }

        setIsVerifying(false);
        setVerifyError(
          err.message ||
            'Payment verification is pending or was not confirmed by the gateway. If your account was debited, our team will verify your transaction shortly.'
        );
      }
    };

    verifyOrFetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  const handleManualReverify = async () => {
    if (!orderNumber) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const verifiedOrder = await verifyCashfreePaymentApi(orderNumber);
      setOrder(verifiedOrder);
      clearCart();
      setIsVerifying(false);
    } catch (err: any) {
      setIsVerifying(false);
      setVerifyError(err.message || 'Payment could not be verified at this moment. Please check back shortly.');
    }
  };

  const isConfirmed = order && (order.paymentStatus === 'Paid' || order.paymentMethod === 'COD');

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '3rem 2rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {isVerifying ? (
            <div style={{ padding: '2rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-maroon-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  color: 'var(--color-maroon)',
                }}
              >
                <Loader2 size={36} className="spin" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
                Verifying Payment with Cashfree...
              </h2>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Please wait a moment while our server securely confirms your transaction status directly with the bank.
              </p>
            </div>
          ) : isConfirmed ? (
            <>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-maroon-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  color: 'var(--color-maroon)',
                }}
              >
                <CheckCircle size={36} />
              </div>

              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-gold-dark)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Thank You for Shopping with {BUSINESS_CONFIG.brandName}!
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2.25rem',
                  color: 'var(--color-maroon)',
                  marginTop: '0.25rem',
                  marginBottom: '0.5rem',
                }}
              >
                Order Confirmed!
              </h1>
              <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                Your order number is <strong style={{ color: 'var(--color-maroon)' }}>#{orderNumber}</strong>. We have
                sent confirmation details to your contact info.
              </p>

              {/* Order Details Card */}
              {order && (
                <div
                  style={{
                    textAlign: 'left',
                    backgroundColor: 'var(--bg-primary)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '2rem',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginBottom: '1.25rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Payment Status</div>
                      <div style={{ fontWeight: 700, color: 'var(--color-maroon)' }}>
                        {order.paymentMethod} ({order.paymentStatus})
                        {order.cashfreePaymentId && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                            Cashfree Ref: {order.cashfreePaymentId}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Shipping Address</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {order.shippingAddress?.fullName}, {order.shippingAddress?.city},{' '}
                        {order.shippingAddress?.pincode}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-maroon)', marginBottom: '0.75rem' }}>
                    Items Ordered:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(order.items || []).map((item, idx) => (
                      <div
                        key={idx}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img
                            src={item.image}
                            alt=""
                            style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <span>
                            {item.productName} × {item.quantity}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700 }}>₹{item.lineTotal.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      borderTop: '1px dashed var(--color-border-dark)',
                      paddingTop: '0.75rem',
                      marginTop: '1rem',
                      color: 'var(--color-maroon)',
                    }}
                  >
                    <span>Total Amount Paid / Due:</span>
                    <span>₹{(order.finalTotal || 0).toLocaleString('en-IN')}</span>
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
            </>
          ) : (
            <>
              {/* Payment Verification Pending or Failed State */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  color: '#92400E',
                }}
              >
                <Clock size={36} />
              </div>

              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-gold-dark)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Payment Verification Pending
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2rem',
                  color: 'var(--color-maroon)',
                  marginTop: '0.25rem',
                  marginBottom: '0.5rem',
                }}
              >
                Awaiting Gateway Confirmation
              </h1>
              <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Order <strong style={{ color: 'var(--color-maroon)' }}>#{orderNumber}</strong> has been received, but
                authoritative server payment confirmation from Cashfree has not finalized yet.
              </p>

              {verifyError && (
                <div
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    textAlign: 'left',
                    color: '#92400E',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <AlertTriangle size={18} /> Note on Your Transaction:
                  </div>
                  {verifyError}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  alignItems: 'center',
                  marginBottom: '2rem',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                <div>If your bank debited the funds, please allow a few minutes for bank settlement.</div>
                <div>You can re-check the status at any time or contact our customer support team.</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" onClick={handleManualReverify} className="btn-primary" disabled={isVerifying}>
                  <RefreshCw size={18} /> Refresh Payment Status
                </button>
                <Link to={`/track-order?order=${orderNumber}`} className="btn-secondary">
                  <Truck size={18} /> Track Order
                </Link>
                <a href={`tel:${BUSINESS_CONFIG.contact.phone}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={18} /> Call Support
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
