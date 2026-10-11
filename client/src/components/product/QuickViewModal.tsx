import React, { useState } from 'react';
import { X, ShoppingBag, Heart, ShieldCheck, Truck, Star } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isWished = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '850px', padding: '1.5rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
          className="icon-button"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Product Gallery */}
          <div>
            <div style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', marginBottom: '0.75rem' }}>
              <img
                src={product.images[selectedImage] || product.images[0]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    style={{
                      width: '60px',
                      height: '75px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: selectedImage === idx ? '2px solid var(--color-maroon)' : '1px solid var(--color-border)'
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-gold-dark)', fontWeight: 700 }}>
              {product.category} • SKU: {product.sku}
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-maroon)', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              {product.name}
            </h2>

            {/* Price section */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span style={{ fontSize: '1rem', color: 'var(--color-text-light)', textDecoration: 'line-through' }}>
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {product.description}
            </p>

            {/* Fabric & Specs */}
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.8125rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div><strong>Fabric:</strong> {product.fabric}</div>
              <div><strong>Color:</strong> {product.color}</div>
              <div><strong>Occasion:</strong> {product.occasion}</div>
              <div><strong>Length:</strong> {product.sareeLength}</div>
            </div>

            {/* Stock status */}
            <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              {isOutOfStock ? (
                <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>Out of Stock</span>
              ) : (
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ In Stock ({product.stock} Sarees Available)
                </span>
              )}
            </div>

            {/* Add to Cart Actions */}
            {!isOutOfStock && (
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border-dark)', borderRadius: 'var(--radius-sm)' }}>
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{ padding: '0.5rem 0.875rem', fontSize: '1rem', fontWeight: 700 }}
                  >
                    -
                  </button>
                  <span style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    style={{ padding: '0.5rem 0.875rem', fontSize: '1rem', fontWeight: 700 }}
                  >
                    +
                  </button>
                </div>

                <button
                  className="btn-primary"
                  style={{ flexGrow: 1 }}
                  onClick={() => {
                    addToCart(product, quantity);
                    onClose();
                  }}
                >
                  <ShoppingBag size={18} /> Add to Cart
                </button>

                <button
                  className="btn-secondary"
                  style={{ padding: '0.75rem' }}
                  onClick={() => toggleWishlist(product)}
                >
                  <Heart size={18} fill={isWished ? 'var(--color-maroon)' : 'none'} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
