import React from 'react';

export const BrandIntroduction: React.FC = () => {
  return (
    <div className="brand-introduction">
      {/* Subtle Heritage Pre-title Accent */}
      <div className="brand-pretitle">
        <span className="brand-pretitle-line" aria-hidden="true" />
        <span className="brand-pretitle-text">Heritage Handloom Silk</span>
        <span className="brand-pretitle-line" aria-hidden="true" />
      </div>

      {/* Main Brand Name - Grand Visual Focal Point */}
      <h1 className="brand-title">
        SRI LAKSHMI SAREES
      </h1>

      {/* Main Tagline */}
      <p className="brand-tagline">
        Elegance Woven in Every Thread
      </p>

      {/* Supporting Text */}
      <p className="brand-supporting">
        Discover timeless sarees for every celebration.
      </p>
    </div>
  );
};
