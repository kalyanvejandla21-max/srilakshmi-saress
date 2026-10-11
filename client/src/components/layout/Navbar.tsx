import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { MegaMenu } from './MegaMenu';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { itemsCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAdmin } = useAuth();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="main-header">
      <div className="container header-container">
        {/* Mobile Hamburger Button */}
        <button
          className="icon-button mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          id="mobile-menu-btn"
        >
          <Menu size={24} />
        </button>

        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <img src="/saree-logo.svg" alt="Sri Lakshmi Sarees" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ lineHeight: 1 }}>Sri Lakshmi</span>
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-gold-dark)', marginTop: '2px' }}>
              SAREES
            </span>
          </div>
        </Link>

        {/* Desktop Main Navigation Links */}
        <nav className="desktop-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>

          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsMegaMenuOpen(true)}
          >
            <Link
              to="/shop"
              className={`nav-link ${location.pathname.startsWith('/shop') ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              Shop All
              <ChevronDown size={14} />
            </Link>
          </div>

          <Link to="/shop?category=Silk+Sarees" className="nav-link">
            Silk Sarees
          </Link>

          <Link to="/shop?category=Cotton+Sarees" className="nav-link">
            Cotton Sarees
          </Link>

          <Link to="/shop?category=Wedding+Sarees" className="nav-link">
            Wedding Collection
          </Link>

          <Link to="/shop?category=Festive+Sarees" className="nav-link">
            Festive Collection
          </Link>

          <Link to="/shop?category=New+Arrivals" className="nav-link">
            New Arrivals
          </Link>

          <Link to="/shop?category=Best+Sellers" className="nav-link">
            Best Sellers
          </Link>

          <Link to="/shop?category=Sale" className="nav-link" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
            Sale
          </Link>
        </nav>

        {/* Header Quick Actions */}
        <div className="header-actions">
          {/* Admin Dashboard Badge Link if logged in as Admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="desktop-admin-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                backgroundColor: 'var(--color-gold-light)',
                color: 'var(--color-gold-dark)',
                padding: '0.375rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid var(--color-gold)'
              }}
            >
              <ShieldCheck size={14} /> Admin Portal
            </Link>
          )}

          {/* Search Trigger */}
          <button
            className="icon-button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Search Sarees"
            id="nav-search-btn"
          >
            <Search size={20} />
          </button>

          {/* User Account / Login */}
          <Link
            to={user ? (isAdmin ? '/admin' : '/account') : '/login'}
            className="icon-button"
            aria-label="Account"
            id="nav-account-btn"
          >
            <User size={20} />
          </Link>

          {/* Wishlist Icon */}
          <Link to="/wishlist" className="icon-button" aria-label="Wishlist" id="nav-wishlist-btn">
            <Heart size={20} />
            {wishlistCount > 0 && <span className="icon-badge">{wishlistCount}</span>}
          </Link>

          {/* Cart Icon */}
          <button
            className="icon-button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Shopping Cart"
            id="nav-cart-btn"
          >
            <ShoppingBag size={20} />
            {itemsCount > 0 && <span className="icon-badge">{itemsCount}</span>}
          </button>
        </div>
      </div>

      {/* Mega Menu Dropdown */}
      {isMegaMenuOpen && <MegaMenu onClose={() => setIsMegaMenuOpen(false)} />}

      {/* Search Modal Bar */}
      {isSearchOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--color-border)',
            padding: '1.25rem 0',
            boxShadow: 'var(--shadow-md)',
            zIndex: 45
          }}
        >
          <div className="container">
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '600px', margin: '0 auto' }}>
              <input
                type="text"
                placeholder="Search Kanjivaram, Cotton, Chanderi, Wedding sarees, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                autoFocus
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                Search
              </button>
              <button type="button" onClick={() => setIsSearchOpen(false)} className="icon-button">
                <X size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
