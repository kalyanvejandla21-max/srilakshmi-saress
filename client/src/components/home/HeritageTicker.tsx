import React from 'react';
import './HeritageTicker.css';

interface TickerItem {
  tag: string;
  text: string;
}

const TICKER_ITEMS: TickerItem[] = [
  { tag: 'HERITAGE ATELIER', text: 'Kanchipuram Temple Looms' },
  { tag: 'PURE ZARI', text: 'Silver & Gold Core Weave' },
  { tag: 'BRIDAL COUTURE', text: 'Heirloom Silks for Generations' },
  { tag: 'AUTHENTIC WEAVE', text: 'Silk Mark Certified Mulberry' },
  { tag: 'CURATED ENSEMBLES', text: 'Styled Head to Toe' },
  { tag: 'TIMELESS DRAPE', text: 'Handwoven by Master Artisans' },
];

export const HeritageTicker: React.FC = () => {
  return (
    <div className="heritage-ticker-bar" aria-label="Brand announcements and heritage highlights">
      <div className="heritage-ticker-track">
        {/* Track duplicated 3 times for seamless infinite loop */}
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
          <div className="heritage-ticker-pill" key={idx}>
            <span className="ticker-diamond" aria-hidden="true">✦</span>
            <span className="ticker-tag">{item.tag}</span>
            <span className="ticker-text">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

