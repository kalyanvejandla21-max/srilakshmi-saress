import React from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronRight, ShoppingBag, Heart, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const { itemsCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();

  if (!isOpen) return null;

  const categories = [
    { title: 'Home', link: '/' },
    { title: 'Shop All Sarees', link: '/shop' },
    { title: 'Kanjivaram Silk Sarees', link: '/shop?category=Silk+Sarees' },
    { title: 'Cotton & Handloom Sarees', link: '/shop?category=Cotton+Sarees' },
    { title: 'Bridal & Wedding Collection', link: '/shop?category=Wedding+Sarees' },
    { title: 'Festive Collection', link: '/shop?category=Festive+Sarees' },
    { title: 'Designer Sarees', link: '/shop?category=Designer+Sarees' },
    { title: 'Daily Wear Sarees', link: '/shop?category=Daily+Wear+Sarees' },
    { title: 'New Arrivals', link: '/shop?category=New+Arrivals' },
    { title: 'Best Sellers', link: '/shop?category=Best+Sellers' },
    { title: 'Sale', link: '/shop?category=Sale', isSale: true },
    { title: 'Track Order', link: '/track-order' },
    { title: 'About Us', link: '/about' },
    { title: 'Contact Us', link: '/contact' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120 }}>
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '85%',
          maxWidth: '320px',
          backgroundColor: '#FFFFFF',
          zIndex: 121,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-primary)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)', fontWeight: 700 }}>
            Sri Lakshmi Sarees
          </div>
          <button onClick={onClose} className="icon-button">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1rem', flexGrow: 1, overflowY: 'auto' }}>
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.link}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.875rem 0.5rem',
                borderBottom: '1px solid var(--color-border)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: cat.isSale ? 'var(--color-danger)' : 'var(--color-text)'
              }}
            >
              <span>{cat.title}</span>
              <ChevronRight size={16} color="var(--color-text-light)" />
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '1.5rem 0 0.5rem 0',
                padding: '0.75rem',
                backgroundColor: 'var(--color-gold-light)',
                color: 'var(--color-gold-dark)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.875rem'
              }}
            >
              <ShieldCheck size={18} /> Admin Dashboard Portal
            </Link>
          )}
        </div>

        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--bg-primary)', display: 'flex', justifyContent: 'space-around' }}>
          <Link to="/wishlist" onClick={onClose} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
            <Heart size={20} color="var(--color-maroon)" /> Wishlist ({wishlistCount})
          </Link>

          <button
            onClick={() => {
              onClose();
              setIsCartOpen(true);
            }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <ShoppingBag size={20} color="var(--color-maroon)" /> Cart ({itemsCount})
          </button>

          <Link to={user ? '/account' : '/login'} onClick={onClose} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
            <User size={20} color="var(--color-maroon)" /> {user ? 'Account' : 'Login'}
          </Link>
        </div>
      </div>
    </div>
  );
};
