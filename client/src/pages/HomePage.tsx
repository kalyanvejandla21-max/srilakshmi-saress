import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, HeartHandshake, Award, Star, Truck, CheckCircle2 } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { QuickViewModal } from '../components/product/QuickViewModal';
import { FloralHero } from '../components/hero/FloralHero';
import { CategoryCarousel } from '../components/category/CategoryCarousel';
import { Product } from '../types';
import { getStoredProducts } from '../services/api';

export const HomePage: React.FC = () => {
  const [products] = useState<Product[]>(getStoredProducts);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 4);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);

  const categories = [
    { title: 'Silk Sarees', count: 'Kanjivaram & Banarasi', img: '/images/cat-silk.jpg', link: '/shop?category=Silk+Sarees' },
    { title: 'Cotton Sarees', count: 'Chanderi & Handloom', img: '/images/cat-cotton.jpg', link: '/shop?category=Cotton+Sarees' },
    { title: 'Wedding Sarees', count: 'Bridal Temple Weaves', img: '/images/cat-wedding.jpg', link: '/shop?category=Wedding+Sarees' },
    { title: 'Festive Sarees', count: 'Royal Silver Brocade', img: '/images/cat-festive.jpg', link: '/shop?category=Festive+Sarees' },
    { title: 'Designer Sarees', count: 'Organza & Zardozi', img: '/images/cat-designer.jpg', link: '/shop?category=Designer+Sarees' },
    { title: 'Daily Wear', count: 'Soft Mulmul Print', img: '/images/cat-dailywear.jpg', link: '/shop?category=Daily+Wear+Sarees' },
  ];

  const testimonials = [
    {
      name: 'Dr. Meenakshi Sundaram',
      location: 'Chennai, Tamil Nadu',
      comment: 'The Mulberry Kanjivaram silk saree I ordered for my daughter’s wedding was breathtaking. Authentic zari, heavy pallu, and received in pristine boxed packaging!',
      rating: 5,
      date: 'Verified Buyer'
    },
    {
      name: 'Ananya Deshmukh',
      location: 'Mumbai, Maharashtra',
      comment: 'Sri Lakshmi Sarees has revived my love for genuine handloom cottons. The Chanderi tissue saree drapes so effortlessly and gracefully.',
      rating: 5,
      date: 'Verified Buyer'
    },
    {
      name: 'Radhika Reddy',
      location: 'Hyderabad, Telangana',
      comment: 'Super fast delivery and incredible customer service on WhatsApp. The color matches the pictures 100%! Highly recommended.',
      rating: 5,
      date: 'Verified Buyer'
    }
  ];

  return (
    <div>
      {/* 1. ANIMATED FLORAL HERO (Originkit Flower Border & Central Brand Introduction) */}
      <FloralHero />

      {/* C. SHOP BY CATEGORY */}
      <section className="section-padding" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem' }}>
            <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Handcrafted Collections
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--color-maroon)', marginTop: '0.25rem' }}>
              Shop By Saree Fabric & Occasion
            </h2>
            <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--color-gold)', margin: '0.75rem auto 0' }} />
          </div>

          <CategoryCarousel categories={categories} />
        </div>
      </section>

      {/* D. NEW ARRIVALS */}
      <section className="section-padding" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div className="section-header-row">
            <div>
              <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Fresh Weaves
              </span>
              <h2 className="section-title">
                New Arrivals
              </h2>
            </div>
            <Link to="/shop?category=New+Arrivals" className="section-header-link">
              View All New Arrivals <ArrowRight size={16} />
            </Link>
          </div>

          <div className="product-grid">
            {newArrivals.map((prod) => (
              <ProductCard key={prod.id} product={prod} onQuickView={setQuickViewProduct} />
            ))}
          </div>
        </div>
      </section>

      {/* F. FESTIVE & WEDDING CAMPAIGN */}
      <section className="campaign-banner">
        <div className="campaign-banner-backdrop" />
        <div className="container campaign-banner-container">
          <div className="campaign-banner-content">
            <span style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Royal Bridal Edition
            </span>
            <h2 className="campaign-banner-title">
              The Wedding & Muhurtham Bridal Collection
            </h2>
            <p className="campaign-banner-desc">
              Auspicious vermillion reds, heavy korvai temple borders, and pure silver-gold zari weaves designed to make your grand wedding unforgettable.
            </p>
            <Link to="/shop?category=Wedding+Sarees" className="btn-gold campaign-banner-btn">
              Explore Bridal Sarees <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* E. BEST SELLERS */}
      <section className="section-padding" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container">
          <div className="section-header-row">
            <div>
              <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Customer Favorites
              </span>
              <h2 className="section-title">
                Best Selling Sarees
              </h2>
            </div>
            <Link to="/shop?category=Best+Sellers" className="section-header-link">
              View All Best Sellers <ArrowRight size={16} />
            </Link>
          </div>

          <div className="product-grid">
            {bestSellers.map((prod) => (
              <ProductCard key={prod.id} product={prod} onQuickView={setQuickViewProduct} />
            ))}
          </div>
        </div>
      </section>

      {/* H. BRAND STORY */}
      <section id="our-story" className="section-padding" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="brand-story-grid">
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img src="/images/cat-silk.jpg" alt="Sri Lakshmi Sarees Craftsmanship" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div>
              <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Our Story & Legacy
              </span>
              <h2 className="section-title" style={{ marginTop: '0.25rem', marginBottom: '1.25rem' }}>
                Crafted with Passion, Preserved for Generations
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '1rem' }}>
                Sri Lakshmi Sarees was born out of an abiding reverence for Indian textile heritage and the timeless art of handloom weaving.
              </p>
              <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Each saree in our collection is curated for thread purity, zari authenticity, color vibrancy, and flawless drape. We work directly with master weaving families to bring you heirloom quality fashion.
              </p>

              <div className="brand-features-grid">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Award size={24} color="var(--color-gold)" />
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-maroon)' }}>Pure Silk Certified</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>100% Genuine Mulberry Silk</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <HeartHandshake size={24} color="var(--color-gold)" />
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-maroon)' }}>Fair Artisan Support</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Direct Weaver Sourcing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* I. CUSTOMER TESTIMONIALS */}
      <section className="section-padding" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem' }}>
            <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Words from Our Patrons
            </span>
            <h2 className="section-title" style={{ marginTop: '0.25rem' }}>
              Customer Love & Reviews
            </h2>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((test, idx) => (
              <div
                key={idx}
                className="testimonial-card"
              >
                <div>
                  <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--color-gold)', marginBottom: '1rem' }}>
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="var(--color-gold)" color="var(--color-gold)" />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--color-text)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    "{test.comment}"
                  </p>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-maroon)', fontSize: '0.9375rem' }}>{test.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{test.location} • {test.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
};
