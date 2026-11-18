import React, { useState } from 'react';
import { Play, X, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './MuseReels.css';

interface ReelItem {
  id: string;
  reelNumber: string;
  duration: string;
  title: string;
  location: string;
  image: string;
  link: string;
}

const REELS: ReelItem[] = [
  {
    id: 'reel-1',
    reelNumber: 'REEL 01',
    duration: '0:28',
    title: 'Pachai Pattu',
    location: 'Loom-room, Kanchipuram',
    image: '/images/cat-silk.jpg',
    link: '/shop?category=Silk+Sarees',
  },
  {
    id: 'reel-2',
    reelNumber: 'REEL 02',
    duration: '0:18',
    title: 'Gali Sindoor',
    location: 'Old-city haveli, Varanasi',
    image: '/images/cat-wedding.jpg',
    link: '/shop?category=Wedding+Sarees',
  },
  {
    id: 'reel-3',
    reelNumber: 'REEL 03',
    duration: '0:22',
    title: 'Ponni Kanjivaram',
    location: 'Temple corridors, Thanjavur',
    image: '/images/hero-banner.jpg',
    link: '/shop?category=Silk+Sarees',
  },
  {
    id: 'reel-4',
    reelNumber: 'REEL 04',
    duration: '0:15',
    title: 'Marina Morning',
    location: 'Breeze on the coromandel',
    image: '/images/cat-cotton.jpg',
    link: '/shop?category=Cotton+Sarees',
  },
  {
    id: 'reel-5',
    reelNumber: 'REEL 05',
    duration: '0:30',
    title: 'Kaali Banarasi',
    location: 'Ghats, Varanasi',
    image: '/images/cat-festive.jpg',
    link: '/shop?category=Festive+Sarees',
  },
];

export const MuseReels: React.FC = () => {
  const [activeReel, setActiveReel] = useState<ReelItem | null>(null);

  return (
    <section id="the-muse" className="muse-reels-section" aria-label="Silk in Motion The Muse Reels">
      <div className="muse-reels-container">
        {/* Header */}
        <div className="muse-reels-header">
          <div className="muse-reels-eyebrow">
            <span className="eyebrow-accent">✦</span>
            <span>THE MUSE REELS</span>
            <span className="eyebrow-accent">✦</span>
          </div>

          <h2 className="muse-reels-title">
            Silk, <span className="title-highlight">in motion.</span>
          </h2>

          <p className="muse-reels-desc">
            Visual poetry capturing the fluid drape and handloom soul of pure silk.
          </p>
        </div>

        {/* Reels Perspective Row */}
        <div className="muse-reels-track">
          {REELS.map((reel, idx) => (
            <div
              key={reel.id}
              className={`muse-reel-card ${idx === 2 ? 'is-featured' : ''}`}
              onClick={() => setActiveReel(reel)}
              role="button"
              tabIndex={0}
              aria-label={`Play ${reel.title} Reel (${reel.duration})`}
            >
              {/* 9:16 Vertical Card Frame */}
              <div className="muse-reel-frame">
                <img src={reel.image} alt={reel.title} className="muse-reel-img" />
                <div className="muse-reel-scrim" />

                {/* Top Badge: REEL 01 • 0:28 */}
                <div className="muse-reel-badge">
                  <span className="reel-badge-dot">●</span>
                  <span>{reel.reelNumber}</span>
                  <span className="reel-badge-sep">|</span>
                  <span>{reel.duration}</span>
                </div>

                {/* Center Glowing Play Button */}
                <div className="muse-reel-play-btn" aria-hidden="true">
                  <Play size={22} fill="#FFFFFF" color="#FFFFFF" className="play-triangle" />
                </div>

                {/* Bottom Title & Origin */}
                <div className="muse-reel-meta">
                  <h3 className="muse-reel-name">{reel.title}</h3>
                  <span className="muse-reel-loc">{reel.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reel Cinema Modal Preview */}
      {activeReel && (
        <div className="reel-modal-overlay" role="dialog" aria-modal="true">
          <div className="reel-modal-backdrop" onClick={() => setActiveReel(null)} />

          <div className="reel-modal-dialog">
            <button
              className="reel-modal-close"
              onClick={() => setActiveReel(null)}
              aria-label="Close Reel Cinema"
            >
              <X size={20} />
            </button>

            <div className="reel-modal-screen">
              <img
                src={activeReel.image}
                alt={activeReel.title}
                className="reel-modal-media"
              />
              <div className="reel-modal-flare" />

              <div className="reel-modal-info">
                <span className="modal-reel-badge">{activeReel.reelNumber} • {activeReel.duration}</span>
                <h3 className="modal-reel-title">{activeReel.title}</h3>
                <p className="modal-reel-loc">{activeReel.location}</p>

                <Link
                  to={activeReel.link}
                  className="modal-reel-shop-btn"
                  onClick={() => setActiveReel(null)}
                >
                  <ShoppingBag size={17} />
                  <span>Shop This Saree</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MuseReels;

