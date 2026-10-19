import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isOutOfStock = product.stock <= 0;
  const isWished = isInWishlist(product.id);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discountPercentage || 0;

  return (
    <div className="product-card">
      {/* Badges */}
      <div className="product-card-badges">
        {isOutOfStock ? (
          <span className="badge badge-stock-out">Out of Stock</span>
        ) : (
          <>
            {discountPercent > 0 && (
              <span className="badge badge-sale">{discountPercent}% OFF</span>
            )}
            {product.isDemo && (
              <span className="badge" style={{ backgroundColor: '#D97706', color: '#FFFFFF' }}>Demo</span>
            )}
            {product.isNewArrival && <span className="badge badge-new">New</span>}
            {product.isBestSeller && <span className="badge badge-bestseller">Best Seller</span>}
          </>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        className={`product-card-wishlist ${isWished ? 'active' : ''}`}
        onClick={() => toggleWishlist(product)}
        aria-label="Add to Wishlist"
      >
        <Heart size={18} fill={isWished ? 'var(--color-maroon)' : 'none'} />
      </button>

      {/* Image Container */}
      <div className="product-card-image-wrapper">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.images[0] || '/images/hero-banner.jpg'}
            alt={product.name}
            className="product-card-image"
            loading="lazy"
          />
        </Link>

        {/* Quick Actions Hover Overlay */}
        {!isOutOfStock && (
          <div className="product-card-quick-add">
            <button
              onClick={() => addToCart(product, 1)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', color: '#FFFFFF' }}
            >
              <ShoppingBag size={16} /> Quick Add
            </button>
            {onQuickView && (
              <button
                onClick={() => onQuickView(product)}
                style={{ padding: '0 0.5rem', color: '#FFFFFF', borderLeft: '1px solid rgba(255,255,255,0.3)' }}
                title="Quick View"
              >
                <Eye size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="product-card-content">
        <div className="product-card-category">{product.category}</div>
        <Link to={`/product/${product.slug}`}>
          <h3 className="product-card-title">{product.name}</h3>
        </Link>

        {/* Rating preview */}
        {product.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <Star size={14} fill="var(--color-gold)" color="var(--color-gold)" />
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{product.rating}</span>
            <span>({product.reviewsCount || 0})</span>
          </div>
        )}

        {/* Pricing Row */}
        <div className="product-card-price-row">
          <span className="product-price-current">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="product-price-original">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="product-price-discount">
              Save ₹{(product.originalPrice! - product.price).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Mobile-Friendly Add To Cart (Touch Screens) */}
        {!isOutOfStock && (
          <button
            className="product-card-mobile-btn"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product, 1);
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={14} /> Add
          </button>
        )}
      </div>
    </div>
  );
};
