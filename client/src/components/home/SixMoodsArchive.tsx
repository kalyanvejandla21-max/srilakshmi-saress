import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import './SixMoodsArchive.css';

interface MoodCard {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  link: string;
}

const MOODS: MoodCard[] = [
  {
    id: 'mood-wedding',
    title: 'Wedding Edit',
    subtitle: 'Royal Muhurtham Silks',
    category: 'Wedding Sarees',
    image: '/images/cat-wedding.jpg',
    link: '/shop?category=Wedding+Sarees',
  },
  {
    id: 'mood-kanchi',
    title: 'Kanchipuram Icons',
    subtitle: 'Korvai Temple Zari',
    category: 'Silk Sarees',
    image: '/images/cat-silk.jpg',
    link: '/shop?category=Silk+Sarees',
  },
  {
    id: 'mood-banarasi',
    title: 'Banarasi Heirlooms',
    subtitle: 'Silver Kadwa Brocade',
    category: 'Silk Sarees',
    image: '/images/cat-festive.jpg',
    link: '/shop?category=Silk+Sarees',
  },
  {
    id: 'mood-festive',
    title: 'Festive & Puja',
    subtitle: 'Auspicious Celebrations',
    category: 'Festive Sarees',
    image: '/images/cat-dailywear.jpg',
    link: '/shop?category=Festive+Sarees',
  },
  {
    id: 'mood-zari',
    title: 'Pure Zari Classics',
    subtitle: 'Silver-Core Gold Sheen',
    category: 'Silk Sarees',
    image: '/images/hero-banner.jpg',
    link: '/shop?category=Silk+Sarees',
  },
  {
    id: 'mood-organza',
    title: 'Bridal Edit',
    subtitle: 'Intricate Zardozi & Resham',
    category: 'Designer Sarees',
    image: '/images/cat-designer.jpg',
    link: '/shop?category=Designer+Sarees',
  },
];

export const SixMoodsArchive: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeMood, setActiveMood] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="archive"
      ref={sectionRef}
      className={`six-moods-section ${isVisible ? 'is-visible' : ''}`}
      aria-label="Six Moods Timeless Drapes Saree Archive"
    >
      <div className="six-moods-container">
        {/* Editorial Section Header */}
        <div className="six-moods-header">
          <div className="six-moods-eyebrow">
            <span className="eyebrow-accent">✦</span>
            <span>THE SRI LAKSHMI ARCHIVE</span>
            <span className="eyebrow-accent">✦</span>
          </div>

          <h2 className="six-moods-title">
            Six Moods. <span className="title-highlight">Timeless Drapes</span>
          </h2>

          <p className="six-moods-desc">
            Six definitive expressions of South Indian handloom artistry, each sculpted for eternal celebrations.
          </p>
        </div>

        {/* 6 Architectural Temple-Arch Cards */}
        <div className="six-moods-grid">
          {MOODS.map((mood, idx) => (
            <Link
              to={mood.link}
              key={mood.id}
              className={`mood-arch-card ${activeMood === mood.id ? 'is-active' : ''}`}
              style={{
                transitionDelay: `${idx * 120}ms`,
                animationDelay: `${idx * -0.7}s`,
              }}
              onMouseEnter={() => setActiveMood(mood.id)}
              onMouseLeave={() => setActiveMood(null)}
              aria-label={`View ${mood.title} collection`}
            >
              {/* Outer Temple Arch Silhouette Frame */}
              <div className="mood-arch-frame">
                {/* SVG Pointed Temple Arch Overlay Outline */}
                <svg className="mood-arch-outline" viewBox="0 0 200 320" fill="none" preserveAspectRatio="none">
                  {/* Pointed temple arch path */}
                  <path
                    d="M 10 310 L 10 90 C 10 40, 50 15, 100 8 C 150 15, 190 40, 190 90 L 190 310 Z"
                    stroke="rgba(197, 160, 89, 0.45)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 14 306 L 14 92 C 14 44, 52 20, 100 13 C 148 20, 186 44, 186 92 L 186 306 Z"
                    stroke="rgba(197, 160, 89, 0.25)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                </svg>

                {/* Arched Image Container */}
                <div className="mood-arch-media">
                  <img
                    src={mood.image}
                    alt={mood.title}
                    className="mood-arch-img"
                    loading="lazy"
                  />
                  <div className="mood-arch-vignette" />
                </div>

                {/* Subtle Floating Zari Seal */}
                <div className="mood-arch-seal" aria-hidden="true">
                  <Sparkles size={14} />
                </div>
              </div>

              {/* Mood Label Beneath Arch */}
              <div className="mood-arch-info">
                <span className="mood-arch-category">{mood.subtitle}</span>
                <h3 className="mood-arch-name">{mood.title}</h3>
                <span className="mood-arch-cta">
                  Explore Weave <ArrowRight size={13} className="cta-arrow" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

