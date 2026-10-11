import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, ShieldCheck, Truck, RefreshCw, Lock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const Footer: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const { showToast } = useToast();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      showToast('Thank you for subscribing to Sri Lakshmi Sarees updates!', 'success');
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="main-footer">
      {/* Trust Badges Bar */}
      <div style={{ borderBottom: '1px solid #332F2C', paddingBottom: '3rem', marginBottom: '3.5rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(197, 160, 89, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600 }}>100% Authentic Silk</h4>
                <p style={{ color: '#9E9A93', fontSize: '0.8125rem' }}>Handwoven by Master Artisans</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(197, 160, 89, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)' }}>
                <Truck size={24} />
              </div>
              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600 }}>Insured Express Delivery</h4>
                <p style={{ color: '#9E9A93', fontSize: '0.8125rem' }}>Free shipping on orders over ₹2,999</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(197, 160, 89, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)' }}>
                <RefreshCw size={24} />
              </div>
              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600 }}>Easy 7-Day Returns</h4>
                <p style={{ color: '#9E9A93', fontSize: '0.8125rem' }}>Hassle-free reverse pickup policy</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(197, 160, 89, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)' }}>
                <Lock size={24} />
              </div>
              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600 }}>Secure Online Checkout</h4>
                <p style={{ color: '#9E9A93', fontSize: '0.8125rem' }}>Razorpay SSL Encrypted Payments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img src="/saree-logo.svg" alt="Sri Lakshmi Sarees" style={{ width: '36px', height: '36px' }} />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#FFFFFF', fontWeight: 700 }}>
                Sri Lakshmi Sarees
              </span>
            </div>
            <p style={{ color: '#B5B0A6', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Sri Lakshmi Sarees celebrates Indian textile heritage with pure handloom Kanjivaram silk, Chanderi cotton, bridal red temple weaves, and contemporary designer sarees crafted by traditional master weavers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem', color: '#B5B0A6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <MapPin size={16} color="var(--color-gold)" />
                <span>108 Silk Weaver Street, Kanchipuram, Tamil Nadu 631501</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Phone size={16} color="var(--color-gold)" />
                <span>+91 98765 43210</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Mail size={16} color="var(--color-gold)" />
                <span>support@srilakshmisarees.com</span>
              </div>
            </div>
          </div>

          {/* Saree Categories */}
          <div>
            <h4 className="footer-heading">Collections</h4>
            <ul className="footer-links">
              <li><Link to="/shop?category=Silk+Sarees">Kanjivaram Silk Sarees</Link></li>
              <li><Link to="/shop?category=Cotton+Sarees">Cotton & Chanderi Sarees</Link></li>
              <li><Link to="/shop?category=Wedding+Sarees">Bridal Wedding Sarees</Link></li>
              <li><Link to="/shop?category=Festive+Sarees">Festive Banarasi Sarees</Link></li>
              <li><Link to="/shop?category=Designer+Sarees">Designer Sheer Organza</Link></li>
              <li><Link to="/shop?category=Daily+Wear+Sarees">Daily Wear Handlooms</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="footer-heading">Customer Care</h4>
            <ul className="footer-links">
              <li><Link to="/track-order">Track Your Order</Link></li>
              <li><Link to="/account">My Account & Orders</Link></li>
              <li><Link to="/policy/shipping">Shipping & Delivery Policy</Link></li>
              <li><Link to="/policy/returns">Returns & Exchange Request</Link></li>
              <li><Link to="/policy/cancellation">Cancellation Policy</Link></li>
              <li><Link to="/policy/privacy">Privacy & Data Security</Link></li>
              <li><Link to="/policy/terms">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h4 className="footer-heading">Stay Connected</h4>
            <p style={{ color: '#B5B0A6', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Subscribe to receive exclusive access to new saree weavers' drops and festive discounts.
            </p>
            <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #44403C',
                  backgroundColor: '#262320',
                  color: '#FFFFFF',
                  fontSize: '0.875rem'
                }}
              />
              <button type="submit" className="btn-gold" style={{ width: '100%', padding: '0.75rem' }}>
                Subscribe Now
              </button>
            </form>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', color: '#B5B0A6' }}>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <Facebook size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Copyright */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} Sri Lakshmi Sarees. Handcrafted with passion in India.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span>Verified Secure Payments: Razorpay | UPI | Visa | Mastercard | COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
