import React, { useEffect, useState } from 'react';
import { FlowerBorder } from './FlowerBorder';
import { BrandIntroduction } from './BrandIntroduction';
import { HeroCTA } from './HeroCTA';
import './FloralHero.css';

export const FloralHero: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger smooth introductory sequence on mount
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className={`floral-hero-section ${isLoaded ? 'intro-active' : ''}`}
      aria-label="Welcome to Sri Lakshmi Sarees"
    >
      {/* 1. Animated Botanical Flower Border growing inward from frame edges */}
      <FlowerBorder />

      {/* 2. Spacious Central Hero Content with generous whitespace */}
      <div className="floral-hero-content-wrapper">
        <div className="floral-hero-center-card">
          <BrandIntroduction />
          <HeroCTA />
        </div>
      </div>
    </section>
  );
};

export default FloralHero;
