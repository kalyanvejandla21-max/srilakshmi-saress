import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, PhoneCall } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[Sri Lakshmi Sarees] Uncaught application rendering error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary, #FAF7F2)',
            padding: '2rem 1rem',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md, 12px)',
              border: '1px solid var(--color-border, #E8DFD5)',
              boxShadow: '0 10px 25px -5px rgba(92, 6, 28, 0.08), 0 8px 10px -6px rgba(92, 6, 28, 0.04)',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}
          >
            {/* Sri Lakshmi Sarees Emblem */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-gold-light, #FBF7EE)',
                border: '2px solid var(--color-gold, #C5A059)',
                color: 'var(--color-maroon, #5C061C)',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={36} color="var(--color-maroon, #5C061C)" />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--color-gold-dark, #997A35)',
                }}
              >
                Sri Lakshmi Sarees
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: '1.75rem',
                  color: 'var(--color-maroon, #5C061C)',
                  marginTop: '0.25rem',
                  marginBottom: '0.5rem',
                  fontWeight: 700,
                }}
              >
                Something Went Unexpectedly Wrong
              </h1>
            </div>

            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--color-text-muted, #6B7280)',
                lineHeight: 1.6,
                marginBottom: '2rem',
              }}
            >
              We apologize for the inconvenience. An unexpected display issue occurred while preparing this page.
              Your cart items and preferences are safely preserved. Please refresh the page or return to the store to continue exploring our saree collections.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                justifyContent: 'center',
                marginBottom: '2rem',
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={16} />
                Try Refreshing Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Home size={16} />
                Return to Home
              </button>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--color-border, #E8DFD5)',
                paddingTop: '1.25rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-light, #9CA3AF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <PhoneCall size={14} color="var(--color-gold, #C5A059)" />
              <span>Need immediate assistance? Reach our customer desk at +91 72072 77006</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
