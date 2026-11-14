import React from 'react';
import './HeritageTicker.css';

interface TickerItem {
  tag: string;
  text: string;
}

const TICKER_ITEMS: TickerItem[] = [
  { tag: 'TRY THE LOOK', text: 'Eight Kanjivaram looks, styled head to toe' },
  { tag: 'PURE ZARI', text: 'Silver-core zari woven into every temple border' },
  { tag: 'THE RACK', text: 'Browse the full rail of pure handloom silks' },
  { tag: 'BRIDAL', text: 'Heirloom bridal silks for the day that matters' },
  { tag: 'THE LOOMS', text: 'Handwoven in Kanchipuram, one saree at a time' },
  { tag: 'AUTHENTIC WEAVE', text: 'Silk Mark certified pure mulberry silk' },
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

