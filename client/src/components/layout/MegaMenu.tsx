import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

interface MegaMenuProps {
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ onClose }) => {
  const categories = [
    { title: 'Silk Sarees', desc: 'Pure Kanjivaram, Banarasi & Mysore Silk', link: '/shop?category=Silk+Sarees', img: '/images/cat-silk.jpg' },
    { title: 'Cotton Sarees', desc: 'Lightweight Chanderi, Mulmul & Handloom', link: '/shop?category=Cotton+Sarees', img: '/images/cat-cotton.jpg' },
    { title: 'Wedding Collection', desc: 'Regal Bridal Reds & Heavy Zari Motifs', link: '/shop?category=Wedding+Sarees', img: '/images/cat-wedding.jpg' },
    { title: 'Festive Wear', desc: 'Vibrant Brocades & Sparkling Borders', link: '/shop?category=Festive+Sarees', img: '/images/cat-festive.jpg' },
    { title: 'Designer Sarees', desc: 'Organza Sheers, Scallops & Zardozi', link: '/shop?category=Designer+Sarees', img: '/images/cat-designer.jpg' },
    { title: 'Daily Wear', desc: 'Breathable Pastel Handlooms for Comfort', link: '/shop?category=Daily+Wear+Sarees', img: '/images/cat-dailywear.jpg' },
  ];

  return (
    <div className="mega-menu" onMouseLeave={onClose}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)' }}>
                Explore Saree Collections
              </h4>
              <Link to="/shop" onClick={onClose} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-gold-dark)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View All Categories <ArrowRight size={14} />
              </Link>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {categories.map((cat, idx) => (
                <Link
                  key={idx}
                  to={cat.link}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    gap: '0.875rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-primary)',
                    transition: 'all var(--transition-fast)',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--color-border-dark)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <img
                    src={cat.img}
                    alt={cat.title}
                    style={{ width: '56px', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-maroon)' }}>
                      {cat.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      {cat.desc}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundImage: 'url(/images/hero-banner.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              color: '#FFFFFF'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(92, 6, 28, 0.95), rgba(92, 6, 28, 0.3))'
              }}
            />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-gold)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Sparkles size={12} /> Craftsmanship Highlight
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#FFFFFF', marginTop: '0.375rem', marginBottom: '0.5rem' }}>
                Pure Mulberry Silk Weaves
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#E8E2D9', marginBottom: '1rem' }}>
                Handpicked traditional silk sarees featuring classic zari borders and rich pallu weaves.
              </p>
              <Link
                to="/shop?category=Silk+Sarees"
                onClick={onClose}
                className="btn-gold"
                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
              >
                Shop Silk Collection
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
