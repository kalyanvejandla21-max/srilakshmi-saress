import React from 'react';

export const BrandIntroduction: React.FC = () => {
  return (
    <div className="brand-introduction">
      {/* Subtle Heritage Pre-title Accent */}
      <div className="brand-pretitle">
        <span className="brand-pretitle-line" aria-hidden="true" />
        <span className="brand-pretitle-text">A Century of Textile Artistry</span>
        <span className="brand-pretitle-line" aria-hidden="true" />
      </div>

      {/* Main Brand Name - Grand Visual Focal Point */}
      <h1 className="brand-title">
        SRI LAKSHMI SAREES
      </h1>

      {/* Editorial Main Headline */}
      <p className="brand-tagline" style={{ fontStyle: 'normal' }}>
        Tradition, draped beautifully.
      </p>

      {/* Editorial Supporting Text */}
      <p className="brand-supporting">
        Discover heirloom handloom sarees woven with pure mulberry silk, authentic zari, and generations of artisan passion.
      </p>
    </div>
  );
};
