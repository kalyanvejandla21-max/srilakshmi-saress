import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, AlertCircle, ExternalLink } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { getStoredOrders, fetchOrderFromServer } from '../services/api';

export const TrackOrderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderQuery, setOrderQuery] = useState(searchParams.get('order') || '');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const defaultOrderNo = searchParams.get('order');
    if (defaultOrderNo) {
      searchOrder(defaultOrderNo, '');
    }
  }, [searchParams]);

  const searchOrder = async (ordNum: string, phone: string) => {
    const cleanOrd = ordNum.trim().toUpperCase();
    
    // First attempt to fetch from backend API
    let matched: Order | null = null;
    try {
      matched = await fetchOrderFromServer(cleanOrd);
    } catch {
      matched = null;
    }

    // Fall back to client localStorage if not found on server
    if (!matched) {
      const orders = getStoredOrders();
      matched = orders.find((o) => {
        const matchNo = o.orderNumber.toUpperCase() === cleanOrd || o.id === ordNum;
        if (phone.trim()) {
          return matchNo && o.shippingAddress.phone.includes(phone.trim());
        }
        return matchNo;
      }) || null;
    }

    setFoundOrder(matched);
    setSearched(true);
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
            Enter your order number to trace live dispatch and courier status.
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
              <label className="form-label">Registered Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="10-digit Mobile Number"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                className="form-input"
              />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', height: '44px' }}>
              <Search size={18} /> Track Order
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
                  No Order Found Matching "#{orderQuery}"
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Please check your order confirmation SMS/Email or contact support if you need assistance.
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
                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <strong style={{ color: 'var(--color-maroon)' }}>Courier Partner:</strong>
                    <div>{foundOrder.courierName || 'Shiprocket Express Courier'}</div>
                  </div>

                  <div>
                    <strong style={{ color: 'var(--color-maroon)' }}>Tracking / AWB Number:</strong>
                    <div>{foundOrder.awbNumber || 'Assigning AWB...'}</div>
                  </div>

                  <div>
                    <strong style={{ color: 'var(--color-maroon)' }}>Delivery Address:</strong>
                    <div>{foundOrder.shippingAddress.fullName}, {foundOrder.shippingAddress.city}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
