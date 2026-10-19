import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Truck, ShieldCheck, RefreshCw, Star, CheckCircle, MapPin, Share2 } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { Product } from '../types';
import { getStoredProducts, fetchProductsFromServer } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'reviews'>('details');

  useEffect(() => {
    fetchProductsFromServer().then((data) => {
      if (data && data.length > 0) setProducts(data);
    });
  }, []);

  const product = products.find((p) => p.slug === slug || p.id === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!product) {
    return (
      <div className="section-padding" style={{ textAlign: 'center', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-maroon)' }}>
          Saree Not Found
        </h2>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
          The requested saree may have been archived or moved.
        </p>
        <Link to="/shop" className="btn-primary">
          Back to Catalogue
        </Link>
      </div>
    );
  }

  const isWished = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(pincode)) {
      setPincodeResult(`Delivery available to ${pincode}! Estimated delivery within 3 - 5 business days via Express Courier.`);
    } else {
      setPincodeResult('Please enter a valid 6-digit Indian PIN Code.');
    }
  };

  const handleBuyNow = () => {
    if (addToCart(product, quantity)) {
      navigate('/checkout');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Product link copied to clipboard!', 'success');
  };

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: 'inherit' }}>Home</Link> /{' '}
          <Link to="/shop" style={{ color: 'inherit' }}>Shop</Link> /{' '}
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} style={{ color: 'inherit' }}>{product.category}</Link> /{' '}
          <strong style={{ color: 'var(--color-maroon)' }}>{product.name}</strong>
        </div>

        {/* Product Details Main Grid */}
        <div className="pdp-layout">
          {/* Gallery View */}
          <div className="pdp-gallery-column">
            <div className="pdp-main-image-wrapper">
              <img
                src={product.images[selectedImage] || product.images[0]}
                alt={product.name}
                className="pdp-main-image"
              />
            </div>

            {product.images.length > 1 && (
              <div className="pdp-thumbnails">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`pdp-thumb-btn ${selectedImage === idx ? 'active' : ''}`}
                    aria-label={`View saree photo ${idx + 1}`}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Specifications & Purchase Panel */}
          <div className="pdp-info-column">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-gold-dark)', fontWeight: 700 }}>
                    {product.category} • SKU: {product.sku}
                  </span>
                  {product.isDemo && (
                    <span style={{ fontSize: '0.6875rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                      Demo Saree
                    </span>
                  )}
                </div>
                <h1 className="pdp-title">
                  {product.name}
                </h1>
              </div>

              <button onClick={handleShare} className="icon-button" title="Share Saree Link" aria-label="Share product">
                <Share2 size={20} />
              </button>
            </div>

            {/* Ratings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', color: 'var(--color-gold)' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="var(--color-gold)" color="var(--color-gold)" />
                ))}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{product.rating || 4.9}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>({product.reviewsCount || 12} Verified Reviews)</span>
            </div>

            {/* Price Box */}
            <div className="pdp-price-box">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.875rem', flexWrap: 'wrap' }}>
                <span className="pdp-price-current">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="pdp-price-original">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="pdp-price-discount">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Inclusive of all taxes. Free Express Delivery across India.
              </div>
            </div>

            {/* Fabric & Technical Highlights */}
            <div className="pdp-specs-grid">
              <div><strong>Fabric:</strong> {product.fabric}</div>
              <div><strong>Color:</strong> {product.color}</div>
              <div><strong>Pattern:</strong> {product.pattern}</div>
              <div><strong>Occasion:</strong> {product.occasion}</div>
              <div><strong>Length:</strong> {product.sareeLength}</div>
              <div><strong>Blouse:</strong> {product.blouseIncluded ? 'Included' : 'Not Included'}</div>
            </div>

            {/* Stock Availability */}
            <div style={{ marginBottom: '1.25rem' }}>
              {isOutOfStock ? (
                <span style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.9375rem' }}>
                  Currently Out of Stock
                </span>
              ) : (
                <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CheckCircle size={16} /> In Stock ({product.stock} Sarees Available for Immediate Shipment)
                </span>
              )}
            </div>

            {/* Quantity & CTA Buttons */}
            {!isOutOfStock && (
              <div className="pdp-actions-container">
                <div className="pdp-action-row">
                  <div className="pdp-quantity-selector">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="pdp-qty-btn"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="pdp-qty-value">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="pdp-qty-btn"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="btn-primary pdp-add-cart-btn"
                    onClick={() => addToCart(product, quantity)}
                  >
                    <ShoppingBag size={18} /> Add to Cart
                  </button>

                  <button
                    className="btn-secondary pdp-wishlist-btn"
                    onClick={() => toggleWishlist(product)}
                    title="Wishlist"
                    aria-label="Add to wishlist"
                  >
                    <Heart size={18} fill={isWished ? 'var(--color-maroon)' : 'none'} />
                  </button>
                </div>

                <button
                  className="btn-gold pdp-buy-now-btn"
                  onClick={handleBuyNow}
                >
                  Buy Now with Express Checkout
                </button>
              </div>
            )}

            {/* Pincode Delivery Serviceability Checker */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-maroon)', marginBottom: '0.75rem' }}>
                <MapPin size={16} /> Check Delivery Availability
              </div>
              <form onSubmit={handlePincodeCheck} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Enter 6-Digit PIN Code"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                  style={{ flexGrow: 1, minWidth: '160px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', border: '1px solid var(--color-border-dark)', borderRadius: 'var(--radius-sm)' }}
                />
                <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                  Check
                </button>
              </form>
              {pincodeResult && (
                <div style={{ fontSize: '0.8125rem', marginTop: '0.5rem', color: pincodeResult.includes('available') ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {pincodeResult}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed Product Information (Description, Care, Shipping, Reviews) */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem', marginBottom: '3.5rem' }}>
          <div className="pdp-tabs-nav">
            <button
              onClick={() => setActiveTab('details')}
              className={`pdp-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            >
              Description & Craftsmanship
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`pdp-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
            >
              Shipping & Return Policy
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pdp-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            >
              Customer Reviews ({product.reviewsCount || 12})
            </button>
          </div>

          {activeTab === 'details' && (
            <div>
              <p style={{ fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                {product.description}
              </p>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
                Care & Handling Instructions
              </h4>
              <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                {product.careInstructions}
              </p>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>
              <div>
                <strong style={{ color: 'var(--color-text)' }}>Shipping:</strong> Orders are dispatched within 24–48 hours. Free shipping on all prepaid orders above ₹2,999.
              </div>
              <div>
                <strong style={{ color: 'var(--color-text)' }}>Returns:</strong> Easy 7-day hassle-free return window for damaged, defective, or mis-described items. Reverse pickup arranged by courier partner.
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--color-maroon)' }}>
                  <Star size={16} fill="var(--color-gold)" color="var(--color-gold)" /> 5.0 / 5.0 Rating
                </div>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>
                  "Absolutely stunning drape and vibrant zari finish. Looks even richer in person!"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>
              You May Also Love
            </h2>
            <div className="product-grid">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
