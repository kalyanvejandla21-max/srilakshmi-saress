import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Package, Truck, LogOut, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStoredOrders } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Order } from '../types';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders] = useState<Order[]>(getStoredOrders);
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [selectedItemName, setSelectedItemName] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemName || !returnReason) {
      showToast('Please select item and enter return reason.', 'error');
      return;
    }

    showToast(`Return request submitted for "${selectedItemName}". We will arrange reverse pickup!`, 'success');
    setReturnModalOrder(null);
    setReturnReason('');
    setSelectedItemName('');
  };

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
      <div className="container">
        {/* User Header */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-maroon)' }}>
              <UserIcon size={32} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--color-maroon)' }}>
                Namaste, {user.name}
              </h1>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{user.email} • {user.role === 'admin' ? 'Administrator Account' : 'Customer Account'}</div>
            </div>
          </div>

          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Order History Section */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-maroon)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={22} color="var(--color-gold-dark)" /> My Saree Orders ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Package size={44} color="var(--color-text-light)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
                You have not placed any saree orders yet.
              </p>
              <Link to="/shop" className="btn-primary">
                Explore Saree Catalogue
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {orders.map((ord) => (
                <div key={ord.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '1.5rem', backgroundColor: 'var(--bg-primary)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <strong style={{ fontSize: '1.125rem', color: 'var(--color-maroon)' }}>Order #{ord.orderNumber}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ backgroundColor: '#FFFFFF', padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        {ord.orderStatus}
                      </span>
                      <Link to={`/track-order?order=${ord.orderNumber}`} className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                        <Truck size={14} /> Track
                      </Link>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    {ord.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={item.image} alt="" style={{ width: '45px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{item.productName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700 }}>₹{item.lineTotal.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--color-border-dark)', paddingTop: '0.75rem' }}>
                    <button
                      onClick={() => setReturnModalOrder(ord)}
                      style={{ fontSize: '0.8125rem', color: 'var(--color-gold-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <RefreshCw size={14} /> Request Return / Exchange
                    </button>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
                      Total Amount: ₹{ord.finalTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Return / Exchange Request Modal */}
        {returnModalOrder && (
          <div className="modal-overlay" onClick={() => setReturnModalOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', color: 'var(--color-maroon)', marginBottom: '1rem' }}>
                Submit Return / Exchange Request
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                Order #{returnModalOrder.orderNumber} • 7-Day Return Policy
              </p>

              <form onSubmit={handleReturnSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Saree Item *</label>
                  <select
                    value={selectedItemName}
                    onChange={(e) => setSelectedItemName(e.target.value)}
                    required
                    className="form-select"
                  >
                    <option value="">-- Choose Saree from Order --</option>
                    {returnModalOrder.items.map((item, idx) => (
                      <option key={idx} value={item.productName}>
                        {item.productName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Return / Exchange *</label>
                  <textarea
                    rows={3}
                    placeholder="Describe issue (e.g., color mismatch, damaged in transit, defective zari)"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    required
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setReturnModalOrder(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Return Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
