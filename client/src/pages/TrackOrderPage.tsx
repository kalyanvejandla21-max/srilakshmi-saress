import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, AlertCircle, ExternalLink, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { fetchOrderFromServer, TrackOrderResult } from '../services/api';

export const TrackOrderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderQuery, setOrderQuery] = useState(searchParams.get('order') || '');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const defaultOrderNo = searchParams.get('order');
    if (defaultOrderNo) {
      searchOrder(defaultOrderNo, '');
    }
  }, [searchParams]);

  const searchOrder = async (ordNum: string, phone: string) => {
    const cleanOrd = ordNum.trim().toUpperCase();
    if (!cleanOrd) return;

    setIsLoading(true);
    setSearched(false);

    try {
      const result: TrackOrderResult | null = await fetchOrderFromServer(cleanOrd, phone);
      if (result && result.order) {
        setFoundOrder(result.order);
        setIsVerified(result.isVerified);
        setVerificationMessage(result.message || null);
      } else {
        setFoundOrder(null);
        setIsVerified(false);
        setVerificationMessage(null);
      }
    } catch {
      setFoundOrder(null);
      setIsVerified(false);
      setVerificationMessage(null);
    } finally {
      setIsLoading(false);
      setSearched(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderQuery) {
      searchOrder(orderQuery, phoneQuery);
    }
  };

  const stages: { label: OrderStatus; desc: string }[] = [
    { label: 'Order Placed', desc: 'Order details received securely' },
    { label: 'Payment Confirmed', desc: 'Prepaid payment verified or COD recorded' },
    { label: 'Processing', desc: 'Saree quality inspected and hand-packed' },
    { label: 'Ready for Pickup', desc: 'Handed over to courier partner' },
    { label: 'In Transit', desc: 'En route to your local hub' },
    { label: 'Out for Delivery', desc: 'Courier agent on the way to your doorstep' },
    { label: 'Delivered', desc: 'Delivered safely' }
  ];

  const getCurrentStageIndex = (status: OrderStatus) => {
    const idx = stages.findIndex((s) => s.label === status);
    return idx >= 0 ? idx : 1; // Default stage
  };

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '850px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Live Shipment Tracker
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-maroon)', marginTop: '0.25rem' }}>
            Track Your Saree Order
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
            Enter your order number and mobile phone number to trace live dispatch and delivery updates.
          </p>
        </div>

        {/* Search Card Form */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)', marginBottom: '2.5rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Order Number *</label>
              <input
                type="text"
                placeholder="e.g. SLS-847291"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Registered Phone Number</label>
              <input
                type="tel"
                placeholder="10-digit Mobile Number"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                maxLength={10}
                className="form-input"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ padding: '0.75rem 1.5rem', height: '44px', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Searching...
                </>
              ) : (
                <>
                  <Search size={18} /> Track Order
                </>
              )}
            </button>
          </form>
        </div>

        {/* Search Results Display */}
        {searched && (
          <div>
            {!foundOrder ? (
              <div style={{ backgroundColor: '#FFFFFF', padding: '3rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <AlertCircle size={44} color="var(--color-danger)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
                  No Order Found Matching "{orderQuery}"
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Please verify your order number from your confirmation SMS/Email, or contact customer support on WhatsApp for quick assistance.
                </p>
              </div>
            ) : (
              <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
                {/* Header Summary */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', color: 'var(--color-maroon)' }}>
                      Order #{foundOrder.orderNumber}
                    </h3>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Placed on {new Date(foundOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-maroon-light)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', color: 'var(--color-maroon)', fontWeight: 700, fontSize: '0.875rem' }}>
                    Status: {foundOrder.orderStatus}
                  </div>
                </div>

                {/* Privacy Warning Banner if unverified */}
                {!isVerified && (
                  <div style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FCD34D',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#92400E'
                  }}>
                    <Lock size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Privacy Protected View:</strong> Exact delivery address and invoices are concealed. Enter the registered 10-digit mobile number above to unlock full invoice details.
                    </div>
                  </div>
                )}

                {/* Progress Stepper */}
                <div className="tracking-stepper-container">
                  <div className="tracking-stepper">
                    {stages.map((stg, i) => {
                      const currentIdx = getCurrentStageIndex(foundOrder.orderStatus);
                      const isDone = i <= currentIdx;
                      const isCurrent = i === currentIdx;

                      return (
                        <div key={i} className={`tracking-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                          <div className="tracking-step-icon">
                            {isDone ? <CheckCircle2 size={18} /> : i + 1}
                          </div>
                          <div className="tracking-step-info">
                            <span className="tracking-step-label">
                              {stg.label}
                            </span>
                            <span className="tracking-step-desc">
                              {stg.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Courier & AWB Details */}
                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <div>
                    <strong style={{ color: 'var(--color-maroon)' }}>Courier Partner:</strong>
                    <div>{foundOrder.courierName || 'Shiprocket Express Courier'}</div>
                  </div>

                  <div>
                    <strong style={{ color: 'var(--color-maroon)' }}>Tracking / AWB Number:</strong>
                    <div>{foundOrder.awbNumber || 'Assigning AWB...'}</div>
                  </div>

                  <div>
                    <strong style={{ color: 'var(--color-maroon)' }}>Destination Hub:</strong>
                    <div>
                      {foundOrder.shippingAddress?.fullName ? `${foundOrder.shippingAddress.fullName}, ` : ''}
                      {foundOrder.shippingAddress?.city || 'Regional Center'}
                    </div>
                  </div>
                </div>

                {/* Items in shipment */}
                {foundOrder.items && foundOrder.items.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-maroon)', marginBottom: '0.75rem' }}>
                      Shipment Contents:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {foundOrder.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {item.image && (
                              <img src={item.image} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                            )}
                            <span>{item.productName} × {item.quantity}</span>
                          </div>
                          {isVerified && item.lineTotal ? (
                            <span style={{ fontWeight: 700 }}>₹{item.lineTotal.toLocaleString('en-IN')}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
