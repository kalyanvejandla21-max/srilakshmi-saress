import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { loginAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated as Administrator, navigate straight to /admin
  useEffect(() => {
    if (isAdmin) {
      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAdmin, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter the administrator password.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const success = await loginAdmin(password.trim());
      if (success) {
        navigate('/admin', { replace: true });
      } else {
        setErrorMessage('Invalid administrator password. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#F8F5F0',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #EAE3D9',
          boxShadow: '0 8px 30px rgba(92, 6, 28, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Brand Luxury Header */}
        <div
          style={{
            backgroundColor: '#5C061C',
            padding: '2.25rem 2rem 2rem',
            textAlign: 'center',
            borderBottom: '3px solid #D4AF37',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '2px solid #D4AF37',
            }}
          >
            <ShieldCheck size={28} color="#5C061C" />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              color: '#FFFFFF',
              margin: 0,
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            Sri Lakshmi Sarees
          </h1>
          <p
            style={{
              margin: '0.35rem 0 0',
              color: '#F5E6C8',
              fontSize: '0.8125rem',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Store Administration Portal
          </p>
        </div>

        {/* Login Body */}
        <div style={{ padding: '2rem' }}>
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                marginBottom: '1.5rem',
                lineHeight: 1.4,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="admin-password"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}
              >
                Administrator Password
              </label>

              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Lock size={18} />
                </div>

                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoFocus
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.75rem 0.75rem 2.625rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '0.9375rem',
                    backgroundColor: '#FAFAFA',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5C061C';
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(92, 6, 28, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.boxShadow = 'none';
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6B7280',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                backgroundColor: '#5C061C',
                color: '#FFFFFF',
                border: '1px solid #D4AF37',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isLoading ? 0.75 : 1,
                boxShadow: '0 2px 6px rgba(92, 6, 28, 0.25)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = '#4A0516';
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = '#5C061C';
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Admin Login <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Secure Environment Notice */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #F3EDE4',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#9CA3AF',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Lock size={12} color="#D4AF37" /> Secure 256-bit Encrypted Session
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

