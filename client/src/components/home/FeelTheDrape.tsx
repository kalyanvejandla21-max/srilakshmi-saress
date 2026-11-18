import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Play, Volume2, VolumeX } from 'lucide-react';
import { SriLakshmiButton } from '../ui/SriLakshmiButton';
import './FeelTheDrape.css';

export const FeelTheDrape: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPlayingMotion, setIsPlayingMotion] = useState(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="feel-the-drape"
      ref={sectionRef}
      className={`feel-the-drape-section ${isRevealed ? 'revealed' : ''}`}
      aria-label="Feel the Drape Editorial Gallery"
    >
      <div className="feel-the-drape-container">
        {/* Editorial Heading with Multicolored Letters as seen in Reference Video */}
        <div className="feel-the-drape-header">
          <div className="feel-the-drape-eyebrow">
            <span className="feel-the-drape-dash" />
            <span>SILK IN MOTION</span>
            <span className="feel-the-drape-dash" />
          </div>

          <h2 className="feel-the-drape-title">
            Feel the{' '}
            <span className="multicolor-drape">
              <span className="drape-letter l1">d</span>
              <span className="drape-letter l2">r</span>
              <span className="drape-letter l3">a</span>
              <span className="drape-letter l4">p</span>
              <span className="drape-letter l5">e</span>
            </span>
          </h2>

          <p className="feel-the-drape-subtitle">
            The weight, sheen, and graceful fall of pure handloom silk.
          </p>
        </div>

        {/* 3-Column Asymmetric Motion Layout (Video Frames 40–44) */}
        <div className="feel-the-drape-motion-grid">
          {/* Left Column (3 Stacked Parallax Cards) */}
          <div className="motion-col left-col">
            <Link to="/shop?category=Silk+Sarees" className="motion-card card-top">
              <img src="/images/cat-silk.jpg" alt="Pure Kanjivaram Silk" className="motion-card-img" />
              <div className="motion-card-caption">
                <span className="caption-tag">Kanchipuram Silk</span>
                <span className="caption-title">Royal Emerald Korvai</span>
              </div>
            </Link>

            <Link to="/shop?category=Wedding+Sarees" className="motion-card card-mid">
              <img src="/images/cat-wedding.jpg" alt="Bridal Muhurtham Silk" className="motion-card-img" />
              <div className="motion-card-caption">
                <span className="caption-tag">Bridal Muhurtham</span>
                <span className="caption-title">Vermillion Temple Zari</span>
              </div>
            </Link>

            <div className="motion-promo-card card-bot">
              <span className="promo-badge">✦ ATELIER WEAVE</span>
              <h4 className="promo-title">Pure Zari Heirlooms</h4>
              <p className="promo-desc">Woven for sacred celebrations</p>
            </div>
          </div>

          {/* Center Stage: Large Motion Showcase Visual */}
          <div className="motion-center-stage">
            <div className="center-visual-frame">
              {/* Animated Drape Visual */}
              <img
                src="/images/hero-banner.jpg"
                alt="Silk in Motion - Sri Lakshmi Sarees"
                className={`center-visual-media ${isPlayingMotion ? 'is-animating' : ''}`}
              />

              {/* Shimmer Silk Light Flare Effect */}
              <div className="center-visual-sheen" />

              {/* Top Badge */}
              <div className="center-stage-badge">
                <Sparkles size={14} />
                <span>ATELIER IN MOTION</span>
              </div>

              {/* Floating Sound / Play Indicator */}
              <button
                className="center-visual-play-btn"
                onClick={() => setIsPlayingMotion(!isPlayingMotion)}
                aria-label={isPlayingMotion ? 'Pause silk flow animation' : 'Play silk flow animation'}
              >
                {isPlayingMotion ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>

            {/* Direct CTA Button right below center visual (as seen in video!) */}
            <div className="center-stage-action">
              <SriLakshmiButton
                to="/shop"
                variant="gold"
                size="lg"
                id="feel-the-drape-cta"
              >
                Purchase the Collection
              </SriLakshmiButton>
            </div>
          </div>

          {/* Right Column (3 Stacked Parallax Cards) */}
          <div className="motion-col right-col">
            <Link to="/shop?category=Festive+Sarees" className="motion-card card-top">
              <img src="/images/cat-festive.jpg" alt="Banarasi Silver Brocade" className="motion-card-img" />
              <div className="motion-card-caption">
                <span className="caption-tag">Banarasi Brocade</span>
                <span className="caption-title">Silver Kadwa Buta</span>
              </div>
            </Link>

            <Link to="/shop?category=Designer+Sarees" className="motion-card card-mid">
              <img src="/images/cat-designer.jpg" alt="Designer Organza Saree" className="motion-card-img" />
              <div className="motion-card-caption">
                <span className="caption-tag">Designer Organza</span>
                <span className="caption-title">Blush Pink Zardozi</span>
              </div>
            </Link>

            <Link to="/shop?category=Cotton+Sarees" className="motion-card card-bot">
              <img src="/images/cat-cotton.jpg" alt="Chanderi Handloom Cotton" className="motion-card-img" />
              <div className="motion-card-caption">
                <span className="caption-tag">Handloom Cotton</span>
                <span className="caption-title">Powder Blue Chanderi</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeelTheDrape;
