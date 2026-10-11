import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      const isSuccess = login(email, password);
      if (isSuccess) {
        if (email.toLowerCase() === 'admin@srilakshmisarees.com') {
          navigate('/admin');
        } else {
          navigate('/account');
        }
      }
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@srilakshmisarees.com');
    setPassword('admin123');
  };

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '480px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src="/saree-logo.svg" alt="" style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem' }} />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--color-maroon)' }}>
              Sign In to Your Account
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Access order history, track shipments, and manage saved addresses.
            </p>
          </div>

          {/* Quick Demo Credentials Box for Admin testing */}
          <div style={{ backgroundColor: 'var(--color-gold-light)', padding: '0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gold)', marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-gold-dark)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
              <ShieldCheck size={16} /> Admin Portal Credentials
            </div>
            <div>Email: <strong>admin@srilakshmisarees.com</strong></div>
            <div>Password: <strong>admin123</strong></div>
            <button
              type="button"
              onClick={fillAdminCredentials}
              style={{ marginTop: '0.5rem', color: 'var(--color-maroon)', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}
            >
              Click here to Auto-fill Admin Credentials
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.875rem', justifyContent: 'center' }}>
              Sign In <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-maroon)', fontWeight: 600 }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
