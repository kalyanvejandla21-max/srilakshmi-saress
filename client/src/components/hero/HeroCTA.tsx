import React from 'react';
import { ArrowRight } from 'lucide-react';

export const HeroCTA: React.FC = () => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollBy({ top: 600, behavior: 'smooth' });
    }
  };

  return (
    <div className="hero-cta-group">
      {/* Primary Action Button - Try the Look */}
      <a
        href="#try-the-look"
        onClick={(e) => scrollToSection(e, 'try-the-look')}
        className="hero-primary-btn"
        id="hero-try-look-btn"
      >
        <span>Try the Look</span>
        <ArrowRight size={17} className="btn-arrow" />
      </a>

      {/* Secondary Story Text Link - Browse the Rack */}
      <a
        href="#the-rack"
        onClick={(e) => scrollToSection(e, 'the-rack')}
        className="hero-secondary-link"
        id="hero-browse-rack-link"
      >
        Browse the Rack →
      </a>
    </div>
  );
};
