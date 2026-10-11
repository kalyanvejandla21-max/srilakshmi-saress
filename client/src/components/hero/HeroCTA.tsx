import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const HeroCTA: React.FC = () => {
  const handleStoryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const storySection = document.getElementById('our-story');
    if (storySection) {
      storySection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollBy({ top: 600, behavior: 'smooth' });
    }
  };

  return (
    <div className="hero-cta-group">
      {/* Primary Action Button */}
      <Link
        to="/shop"
        className="hero-primary-btn"
        id="hero-explore-collection-btn"
      >
        <span>Explore Collection</span>
        <ArrowRight size={17} className="btn-arrow" />
      </Link>

      {/* Secondary Story Text Link */}
      <a
        href="#our-story"
        onClick={handleStoryClick}
        className="hero-secondary-link"
        id="hero-discover-story-link"
      >
        Discover Our Story
      </a>
    </div>
  );
};
