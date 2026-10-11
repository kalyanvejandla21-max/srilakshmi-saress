import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/product/ProductCard';

export const WishlistPage: React.FC = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Saved Sarees
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-maroon)', marginTop: '0.25rem' }}>
            My Wishlist ({wishlist.length})
          </h1>
        </div>

        {wishlist.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: '4rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <Heart size={48} color="var(--color-text-light)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
              Your Wishlist is Currently Empty
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Save your favorite Kanjivaram silk, Chanderi cotton, or bridal sarees by clicking the heart icon on any product card.
            </p>
            <Link to="/shop" className="btn-primary">
              Explore Saree Catalogue
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
