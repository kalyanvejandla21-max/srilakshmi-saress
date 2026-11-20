import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SriLakshmiButton } from '../ui/SriLakshmiButton';
import './AtelierHero.css';

interface CampaignBanner {
  id: string;
  badge: string;
  headline: string;
  subtext: string;
  image: string;
  imageAlt: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaTarget: string; // anchor id e.g. 'the-rack'
  imagePositionDesktop: string;
  imagePositionMobile: string;
  scrimVariant: 'kanchipuram' | 'bridal' | 'banarasi';
}

const CAMPAIGN_BANNERS: CampaignBanner[] = [
  {
    id: 'kanchipuram-atelier',
    badge: 'KANCHIPURAM • PURE ZARI • HANDWOVEN SILK',
    headline: 'Woven for the Divine.',
    subtext: 'Sacred temple looms handwoven in pure zari and heirloom silk.',
    image: '/images/hero-banner.jpg',
    imageAlt: 'Sri Lakshmi Sarees Grand Atelier Kanjivaram Silk',
    primaryCtaText: 'Shop Kanjivaram',
    primaryCtaLink: '/shop?category=Silk+Sarees',
    secondaryCtaText: 'Browse the Rack',
    secondaryCtaTarget: 'the-rack',
    imagePositionDesktop: 'center 25%',
    imagePositionMobile: '68% 18%',
    scrimVariant: 'kanchipuram',
  },
  {
    id: 'bridal-muhurtham',
    badge: 'ROYAL MUHURTHAM • BRIDAL EDIT',
    headline: 'Heirlooms of Auspicious Grace.',
    subtext: 'Pure mulberry silks woven with authentic silver-core gold zari for your sacred celebration.',
    image: '/images/cat-wedding.jpg',
    imageAlt: 'Royal Muhurtham Bridal Silk Saree Sri Lakshmi Sarees',
    primaryCtaText: 'Explore Bridal',
    primaryCtaLink: '/shop?category=Wedding+Sarees',
    secondaryCtaText: 'Try the Look',
    secondaryCtaTarget: 'try-the-look',
    imagePositionDesktop: 'center 22%',
    imagePositionMobile: '72% 16%',
    scrimVariant: 'bridal',
  },
  {
    id: 'banarasi-kadwa',
    badge: 'BANARASI HEIRLOOMS • KADWA WEAVE',
    headline: 'Woven in Silver & Light.',
    subtext: 'Hand-loomed brocade floral jaals sculpted for majestic festive celebrations.',
    image: '/images/cat-festive.jpg',
    imageAlt: 'Banarasi Silver Brocade Silk Saree Sri Lakshmi Sarees',
    primaryCtaText: 'Explore Banarasi',
    primaryCtaLink: '/shop?category=Festive+Sarees',
    secondaryCtaText: 'The Archive',
    secondaryCtaTarget: 'archive',
    imagePositionDesktop: 'center 26%',
    imagePositionMobile: '70% 18%',
    scrimVariant: 'banarasi',
  },
];

const SLIDE_DURATION_MS = 4800; // 4.8 seconds per slide

export const AtelierHero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preload all banner images on mount to guarantee instant zero-flicker transitions
  useEffect(() => {
    CAMPAIGN_BANNERS.forEach((banner) => {
      const img = new Image();
      img.src = banner.image;
    });
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % CAMPAIGN_BANNERS.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + CAMPAIGN_BANNERS.length) % CAMPAIGN_BANNERS.length);
  }, []);

  // Continuous auto-rotation timer
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, SLIDE_DURATION_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, goToNext]);

  // Smooth scroll helper for internal anchor buttons
  const scrollToAnchor = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    setTouchStartX(null);
    setIsPaused(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'ArrowLeft') {
      goToPrev();
    }
  };

  return (
    <section
      className="atelier-hero-section"
      id="hero"
      aria-label="Sri Lakshmi Sarees Fashion Campaign Carousel"
      role="region"
      aria-roledescription="carousel"
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
    >
      {/* Visual Slide Stack: All slides coexist with opacity/scale crossfade */}
      <div className="atelier-hero-slides-viewport">
        {CAMPAIGN_BANNERS.map((banner, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={banner.id}
              className={`atelier-hero-slide ${isActive ? 'is-active' : 'is-idle'}`}
              aria-hidden={!isActive}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${CAMPAIGN_BANNERS.length}: ${banner.headline}`}
            >
              {/* Background Media with Parallax / Ken-Burns Breathing Scale */}
              <div className="atelier-hero-media-wrap">
                <img
                  src={banner.image}
                  alt={banner.imageAlt}
                  className={`atelier-hero-bg-img ${isActive ? 'is-animating' : ''}`}
                  style={{
                    objectPosition: banner.imagePositionDesktop,
                  }}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
                {/* Subtle Ambient Shimmer Light Wave */}
                <div className="atelier-hero-shimmer-sweep" />
                {/* Multi-tier Gradient Scrim */}
                <div className={`atelier-hero-scrim scrim-${banner.scrimVariant}`} />
              </div>

              {/* Editorial Typography & CTA Content Container */}
              <div className="atelier-hero-content-container">
                <div className="atelier-hero-text-block">
                  {/* Luxury Badge */}
                  <div className="atelier-hero-badge">
                    <span className="badge-sparkle">✦</span>
                    <span>{banner.badge}</span>
                  </div>

                  {/* Grand Headline */}
                  <h1 className="atelier-hero-headline">{banner.headline}</h1>

                  {/* Editorial Subtext */}
                  <p className="atelier-hero-subtext">{banner.subtext}</p>

                  {/* Dual Action Buttons */}
                  <div className="atelier-hero-actions">
                    <SriLakshmiButton
                      to={banner.primaryCtaLink}
                      variant="primary"
                      size="lg"
                      id={`hero-primary-cta-${banner.id}`}
                    >
                      {banner.primaryCtaText}
                    </SriLakshmiButton>

                    <SriLakshmiButton
                      href={`#${banner.secondaryCtaTarget}`}
                      onClick={(e) => scrollToAnchor(e as any, banner.secondaryCtaTarget)}
                      variant="outline"
                      size="lg"
                      id={`hero-secondary-cta-${banner.id}`}
                    >
                      {banner.secondaryCtaText}
                    </SriLakshmiButton>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AtelierHero;
