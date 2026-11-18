import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Award } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { QuickViewModal } from '../components/product/QuickViewModal';
import { AtelierHero } from '../components/hero/AtelierHero';
import { HeritageTicker } from '../components/home/HeritageTicker';
import { SixMoodsArchive } from '../components/home/SixMoodsArchive';
import { TryTheLook } from '../components/home/TryTheLook';
import { PickASilk } from '../components/home/PickASilk';
import { SareeRail } from '../components/home/SareeRail';
import { FeelTheDrape } from '../components/home/FeelTheDrape';
import { BridalCoverflow } from '../components/home/BridalCoverflow';
import { MuseReels } from '../components/home/MuseReels';
import { CategoryCarousel } from '../components/category/CategoryCarousel';
import { SriLakshmiButton } from '../components/ui/SriLakshmiButton';
import { Product } from '../types';
import { getStoredProducts, fetchProductsFromServer } from '../services/api';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProductsFromServer().then((data) => {
      if (data && data.length > 0) setProducts(data);
    });
  }, []);

  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 4);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);

  const categories = [
    { title: 'Silk Sarees', count: 'Kanjivaram & Banarasi', img: '/images/cat-silk.jpg', link: '/shop?category=Silk+Sarees' },
    { title: 'Cotton Sarees', count: 'Chanderi & Handloom', img: '/images/cat-cotton.jpg', link: '/shop?category=Cotton+Sarees' },
    { title: 'Wedding Sarees', count: 'Bridal Temple Weaves', img: '/images/cat-wedding.jpg', link: '/shop?category=Wedding+Sarees' },
    { title: 'Festive Sarees', count: 'Royal Silver Brocade', img: '/images/cat-festive.jpg', link: '/shop?category=Festive+Sarees' },
    { title: 'Designer Sarees', count: 'Organza & Zardozi', img: '/images/cat-designer.jpg', link: '/shop?category=Designer+Sarees' },
    { title: 'Daily Wear', count: 'Soft Mulmul Print', img: '/images/cat-dailywear.jpg', link: '/shop?category=Daily+Wear+Sarees' },
  ];

  return (
    <div>
      {/* 1. ATELIER HERO (Woven for the Divine - Reference Video Scene 1) */}
      <AtelierHero />

      {/* 2. RUNNING TICKER RIBBON (From Reference Video: "TRY THE LOOK • PURE ZARI • THE RACK • BRIDAL • THE LOOMS") */}
      <HeritageTicker />

      {/* 3. SIX MOODS. TIMELESS DRAPES (Scene 2: 6 Architectural Temple Arches) */}
      <SixMoodsArchive />

      {/* 4. TRY THE LOOK (Scene 3: Interactive Head-to-Toe Lookbook & Wardrobe Builder) */}
      <TryTheLook products={products} />

      {/* 5. PICK A SILK (Scene 4: 3D Curved Perspective Color Deck Swatch Arc) */}
      <PickASilk products={products} />

      {/* 6. THE RACK / EVERY SAREE ON THE RAIL (Scene 5: Physical Rail with Focused Inspector Mode) */}
      <SareeRail products={products} />

      {/* 7. FEEL THE DRAPE (Scene 6: Multicolored Title, 3-Column Motion Grid & Center Visual) */}
      <FeelTheDrape />

      {/* 8. THE BRIDAL COLLECTION (Scene 7: 3D Arched Coverflow Showcase) */}
      <BridalCoverflow products={products} />

      {/* 9. SILK, IN MOTION / THE MUSE REELS (Scene 8: 9:16 Vertical Video Reels Carousel) */}
      <MuseReels />

      {/* 10. SHOP BY CATEGORY */}
      <section className="section-padding" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Handcrafted Collections
            </span>
            <h2 className="section-title">
              Curated Collections
            </h2>
            <div style={{ width: '50px', height: '1.5px', backgroundColor: 'var(--color-gold)', margin: '1rem auto 0' }} />
          </div>

          <CategoryCarousel categories={categories} />
        </div>
      </section>

      {/* 11. NEW ARRIVALS (Redesigned Editorial Product Grid) */}
      <section className="section-padding" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div className="section-header-row">
            <div>
              <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Fresh Off The Loom
              </span>
              <h2 className="section-title">
                New Arrivals
              </h2>
            </div>
            <Link to="/shop?category=New+Arrivals" className="section-header-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="product-grid">
            {newArrivals.map((prod) => (
              <ProductCard key={prod.id} product={prod} onQuickView={setQuickViewProduct} />
            ))}
          </div>
        </div>
      </section>

      {/* 12. FESTIVE & WEDDING EDITORIAL CAMPAIGN */}
      <section className="campaign-banner">
        <div className="campaign-banner-backdrop" />
        <div className="container campaign-banner-container">
          <div className="campaign-banner-content">
            <span style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Royal Bridal Edition
            </span>
            <h2 className="campaign-banner-title">
              The Muhurtham Bridal Edit
            </h2>
            <p className="campaign-banner-desc">
              Auspicious vermillion reds and pure silver-gold zari weaves for your sacred day.
            </p>
            <SriLakshmiButton
              to="/shop?category=Wedding+Sarees"
              variant="gold"
              size="lg"
              className="campaign-banner-btn"
            >
              Explore Collection
            </SriLakshmiButton>
          </div>
        </div>
      </section>

      {/* 13. BEST SELLERS (Redesigned Editorial Product Grid) */}
      <section className="section-padding" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container">
          <div className="section-header-row">
            <div>
              <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Timeless Icons
              </span>
              <h2 className="section-title">
                Heirloom Best Sellers
              </h2>
            </div>
            <Link to="/shop?category=Best+Sellers" className="section-header-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="product-grid">
            {bestSellers.map((prod) => (
              <ProductCard key={prod.id} product={prod} onQuickView={setQuickViewProduct} />
            ))}
          </div>
        </div>
      </section>

      {/* 14. BRAND STORY & ARTISAN LEGACY */}
      <section id="our-story" className="section-padding" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="brand-story-grid">
            <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img src="/images/cat-silk.jpg" alt="Sri Lakshmi Sarees Craftsmanship" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div>
              <span style={{ color: 'var(--color-gold-dark)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Heritage
              </span>
              <h2 className="section-title" style={{ marginTop: '0.35rem', marginBottom: '1.25rem' }}>
                Preserved for Generations
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Rooted in South Indian textile heritage, each saree is curated for authentic zari, thread purity, and master handloom artistry passed down through generations.
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

      {/* Quick View Modal */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
};

export default HomePage;
