import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { QuickViewModal } from '../components/product/QuickViewModal';
import { Product, SareeCategory } from '../types';
import { getStoredProducts, fetchProductsFromServer } from '../services/api';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProductsFromServer().then((data) => {
      if (data && data.length > 0) setProducts(data);
    });
  }, []);

  // Filter States from URL or defaults
  const activeCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';
  
  const [selectedFabric, setSelectedFabric] = useState<string>('All');
  const [selectedColor, setSelectedColor] = useState<string>('All');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract unique fabrics, colors, occasions
  const fabrics = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.fabric))).filter(Boolean);
    return ['All', ...list];
  }, [products]);

  const colors = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.color))).filter(Boolean);
    return ['All', ...list];
  }, [products]);

  const occasions = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.occasion))).filter(Boolean);
    return ['All', ...list];
  }, [products]);

  const categories: string[] = [
    'All',
    'Silk Sarees',
    'Cotton Sarees',
    'Wedding Sarees',
    'Festive Sarees',
    'Designer Sarees',
    'Daily Wear Sarees',
    'New Arrivals',
    'Best Sellers',
    'Sale'
  ];

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesFabric = p.fabric.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesFabric && !matchesCategory) return false;
      }

      // Category filter
      if (activeCategory !== 'All') {
        if (activeCategory === 'New Arrivals' && !p.isNewArrival) return false;
        if (activeCategory === 'Best Sellers' && !p.isBestSeller) return false;
        if (activeCategory === 'Sale' && (!p.originalPrice || p.originalPrice <= p.price)) return false;
        if (activeCategory !== 'New Arrivals' && activeCategory !== 'Best Sellers' && activeCategory !== 'Sale') {
          if (p.category !== activeCategory) return false;
        }
      }

      // Fabric filter
      if (selectedFabric !== 'All' && p.fabric !== selectedFabric) return false;

      // Color filter
      if (selectedColor !== 'All' && !p.color.includes(selectedColor)) return false;

      // Occasion filter
      if (selectedOccasion !== 'All' && !p.occasion.includes(selectedOccasion)) return false;

      // Price filter
      if (p.price > maxPrice) return false;

      // Stock filter
      if (onlyInStock && p.stock <= 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      if (sortBy === 'name-az') return a.name.localeCompare(b.name);
      return 0; // featured default
    });
  }, [products, activeCategory, searchQuery, selectedFabric, selectedColor, selectedOccasion, maxPrice, onlyInStock, sortBy]);

  const clearAllFilters = () => {
    setSearchParams({});
    setSelectedFabric('All');
    setSelectedColor('All');
    setSelectedOccasion('All');
    setMaxPrice(30000);
    setOnlyInStock(false);
    setSortBy('featured');
  };

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
      <div className="container">
        {/* Header Breadcrumb & Title */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Home / Shop / <strong style={{ color: 'var(--color-maroon)' }}>{activeCategory}</strong>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-maroon)' }}>
            {activeCategory === 'All' ? 'Complete Saree Catalogue' : activeCategory}
          </h1>
          {searchQuery && (
            <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Showing results for: <strong>"{searchQuery}"</strong>
            </div>
          )}
        </div>

        {/* Filter Bar Controls */}
        <div className="shop-toolbar">
          <div className="shop-toolbar-left">
            <button
              className="btn-secondary shop-filter-trigger"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              id="shop-filter-toggle-btn"
            >
              <SlidersHorizontal size={16} /> Filters
              {(activeCategory !== 'All' || selectedFabric !== 'All' || onlyInStock || maxPrice < 30000) && (
                <span className="filter-active-dot" />
              )}
            </button>
            <span className="shop-results-count">
              Showing <strong>{filteredProducts.length}</strong> Sarees
            </span>
          </div>

          <div className="shop-toolbar-right">
            <span className="shop-sort-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select shop-sort-select"
              id="shop-sort-dropdown"
            >
              <option value="featured">Featured Weaves</option>
              <option value="newest">New Arrivals First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-az">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <div className="mobile-filter-drawer-overlay" onClick={() => setIsMobileFilterOpen(false)}>
            <div className="mobile-filter-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-filter-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SlidersHorizontal size={18} color="var(--color-maroon)" />
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)' }}>
                    Filter Sarees
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={clearAllFilters}
                    style={{ fontSize: '0.75rem', color: 'var(--color-gold-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <RotateCcw size={12} /> Clear All
                  </button>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="icon-button" aria-label="Close filters">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="mobile-filter-body">
                {/* Category Filter */}
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSearchParams(cat === 'All' ? {} : { category: cat })}
                        style={{
                          fontSize: '0.8125rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          border: activeCategory === cat ? '1px solid var(--color-maroon)' : '1px solid var(--color-border)',
                          backgroundColor: activeCategory === cat ? 'var(--color-maroon)' : '#FFFFFF',
                          color: activeCategory === cat ? '#FFFFFF' : 'var(--color-text)',
                          fontWeight: activeCategory === cat ? 700 : 500
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fabric Filter */}
                <div className="form-group">
                  <label className="form-label">Fabric</label>
                  <select
                    value={selectedFabric}
                    onChange={(e) => setSelectedFabric(e.target.value)}
                    className="form-select"
                  >
                    {fabrics.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Max Price Slider */}
                <div className="form-group">
                  <label className="form-label">
                    Max Price: <strong>₹{maxPrice.toLocaleString('en-IN')}</strong>
                  </label>
                  <input
                    type="range"
                    min="2000"
                    max="30000"
                    step="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-maroon)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    <span>₹2,000</span>
                    <span>₹30,000</span>
                  </div>
                </div>

                {/* In Stock Only Checkbox */}
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', paddingTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="mobile-stock-only"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    style={{ accentColor: 'var(--color-maroon)', width: '18px', height: '18px' }}
                  />
                  <label htmlFor="mobile-stock-only" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                    In Stock Sarees Only
                  </label>
                </div>
              </div>

              <div className="mobile-filter-footer">
                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.875rem', justifyContent: 'center' }}
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  Show {filteredProducts.length} Results
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="shop-layout">
          {/* Desktop Sidebar Filter Controls */}
          <aside className="shop-sidebar">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'var(--color-maroon)' }}>
                Filter Sarees
              </h3>
              <button
                onClick={clearAllFilters}
                style={{ fontSize: '0.75rem', color: 'var(--color-gold-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <RotateCcw size={12} /> Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSearchParams(cat === 'All' ? {} : { category: cat })}
                    style={{
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: activeCategory === cat ? 'var(--color-maroon-light)' : 'transparent',
                      color: activeCategory === cat ? 'var(--color-maroon)' : 'var(--color-text)',
                      fontWeight: activeCategory === cat ? 700 : 400
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Fabric Filter */}
            <div className="form-group">
              <label className="form-label">Fabric</label>
              <select
                value={selectedFabric}
                onChange={(e) => setSelectedFabric(e.target.value)}
                className="form-select"
              >
                {fabrics.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Max Price Slider */}
            <div className="form-group">
              <label className="form-label">
                Max Price: <strong>₹{maxPrice.toLocaleString('en-IN')}</strong>
              </label>
              <input
                type="range"
                min="2000"
                max="30000"
                step="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-maroon)' }}
              />
            </div>

            {/* In Stock Only Checkbox */}
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="stock-only"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                style={{ accentColor: 'var(--color-maroon)', width: '16px', height: '16px' }}
              />
              <label htmlFor="stock-only" style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                In Stock Sarees Only
              </label>
            </div>
          </aside>

          {/* Product Grid / Empty State */}
          <main>
            {filteredProducts.length === 0 ? (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '4rem 2rem', textAlign: 'center' }}>
                <Filter size={48} color="var(--color-text-light)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
                  No Sarees Found Matching Your Filters
                </h3>
                <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                  Try relaxing your price range or clearing fabric filters to view more handloom options.
                </p>
                <button className="btn-primary" onClick={clearAllFilters}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
};
