import React from 'react';
import { Sparkles } from 'lucide-react';
import { SriLakshmiButton } from '../ui/SriLakshmiButton';
import './AtelierHero.css';

export const AtelierHero: React.FC = () => {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="atelier-hero-section" id="hero" aria-label="Sri Lakshmi Sarees Grand Atelier">
      {/* Background Media with Parallax / Ken-Burns Zoom */}
      <div className="atelier-hero-media-wrap">
        <img
          src="/images/hero-banner.jpg"
          alt="Sri Lakshmi Sarees Grand Atelier"
          className="atelier-hero-bg-img"
        />
        <div className="atelier-hero-shimmer-sweep" />
        <div className="atelier-hero-scrim" />
      </div>

      {/* Floating Content Card (Reference Video Scene 1) */}
      <div className="atelier-hero-content-container">
        <div className="atelier-hero-text-block">
          {/* Badge */}
          <div className="atelier-hero-badge">
            <span className="badge-sparkle">✦</span>
            <span>KANCHIPURAM • PURE ZARI • HANDWOVEN SILK</span>
          </div>

          {/* Headline */}
          <h1 className="atelier-hero-headline">
            Woven for the Divine.
          </h1>

          {/* Subtext */}
          <p className="atelier-hero-subtext">
            Sri Lakshmi Sarees brings the sacred temple looms of South India home.
            Pure Kanjivaram & Banarasi silks in heirloom colours, bordered in real gold zari and finished by master hands.
          </p>

          {/* Dual Action Buttons */}
          <div className="atelier-hero-actions">
            <SriLakshmiButton
              href="#try-the-look"
              onClick={(e) => scrollTo(e as any, 'try-the-look')}
              variant="primary"
              size="lg"
              id="hero-try-look-pill"
            >
              Try the Look
            </SriLakshmiButton>

            <SriLakshmiButton
              href="#the-rack"
              onClick={(e) => scrollTo(e as any, 'the-rack')}
              variant="outline"
              size="lg"
              id="hero-browse-rack-pill"
            >
              Browse the Rack
            </SriLakshmiButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AtelierHero;

