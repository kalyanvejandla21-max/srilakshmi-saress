import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getStoredCoupons } from '../../services/api';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    isCartOpen,
    setIsCartOpen,
    subtotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountAmount,
    finalTotal
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const shippingFee = subtotal > 0 && subtotal < 2999 ? 150 : 0;

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCodeInput) {
      applyCoupon(couponCodeInput, getStoredCoupons());
      setCouponCodeInput('');
    }
  };

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 110 }}>
      <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)} />
      <div className="cart-drawer">
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} color="var(--color-maroon)" />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)' }}>
              Your Shopping Bag ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h3>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="icon-button">
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-gold-light)', borderBottom: '1px solid var(--color-border)', fontSize: '0.8125rem' }}>
          {subtotal >= 2999 ? (
            <span style={{ color: 'var(--color-gold-dark)', fontWeight: 600 }}>
              🎉 Congratulations! You unlocked FREE Express Shipping across India!
            </span>
          ) : (
            <span style={{ color: 'var(--color-text)' }}>
              Add <strong>₹{(2999 - subtotal).toLocaleString('en-IN')}</strong> more to get <strong>FREE Express Shipping!</strong>
            </span>
          )}
        </div>

        {/* Cart Item List */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <ShoppingBag size={48} color="var(--color-text-light)" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
                Your Cart is Empty
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Explore our handwoven Kanjivaram silk, cotton, and bridal saree collections.
              </p>
              <button
                className="btn-primary"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/shop');
                }}
              >
                Shop Saree Collection
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--color-border)'
                  }}
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />

                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', color: 'var(--color-maroon)', fontWeight: 600, lineHeight: 1.3 }}>
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          style={{ color: 'var(--color-text-light)', padding: '2px' }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gold-dark)', marginTop: '2px' }}>
                        {item.product.fabric}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border-dark)', borderRadius: 'var(--radius-sm)' }}>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={{ padding: '2px 8px', fontSize: '0.875rem' }}
                        >
                          -
                        </button>
                        <span style={{ padding: '2px 8px', fontSize: '0.875rem', fontWeight: 600 }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{ padding: '2px 8px', fontSize: '0.875rem' }}
                        >
                          +
                        </button>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Summary */}
        {cart.length > 0 && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--bg-primary)' }}>
            {/* Coupon Code Section */}
            <div style={{ marginBottom: '1rem' }}>
              {appliedCoupon ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-gold-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-gold-dark)', fontWeight: 600 }}>
                    <Tag size={14} /> Coupon {appliedCoupon.code} Applied (-₹{discountAmount.toLocaleString('en-IN')})
                  </div>
                  <button onClick={removeCoupon} style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Coupon Code (e.g. LAKSHMI10)"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    style={{ flexGrow: 1, padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid var(--color-border-dark)', borderRadius: 'var(--radius-sm)' }}
                  />
                  <button type="submit" className="btn-gold" style={{ padding: '0.5rem 0.875rem', fontSize: '0.75rem' }}>
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Price Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: 600 }}>
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                <span>Estimated Shipping</span>
                <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', paddingTop: '0.5rem', borderTop: '1px dashed var(--color-border-dark)' }}>
                <span>Total Amount</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '0.875rem', justifyContent: 'center' }}
              onClick={handleCheckoutClick}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={14} color="var(--color-gold)" /> Guaranteed 100% Authentic Handwoven Quality
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
