import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Sparkles, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { Product } from '../../types';
import './TryTheLook.css';

interface LookPiece {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface StylistLook {
  id: string;
  name: string;
  tagline: string;
  modelImage: string;
  sareeColor: string;
  sareeProductId: string;
  pieces: LookPiece[];
  hotspots: {
    id: string;
    label: string;
    x: number; // percentage from left
    y: number; // percentage from top
    pieceIndex: number;
  }[];
}

interface TryTheLookProps {
  products: Product[];
}

export const TryTheLook: React.FC<TryTheLookProps> = ({ products }) => {
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();
  const [activeLookIndex, setActiveLookIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAutoPaused, setIsAutoPaused] = useState(false);

  const LOOKS: StylistLook[] = [
    {
      id: 'look-1',
      name: 'Royal Crimson Muhurtham Look',
      tagline: 'Bridal Kanjivaram draped with hand-embroidered raw silk blouse and temple gold jewellery.',
      modelImage: '/images/cat-wedding.jpg',
      sareeColor: '#8B202F',
      sareeProductId: 'prod-4',
      pieces: [
        { id: 'p1-1', name: 'Royal Bridal Red Temple Pallu Silk Saree', category: 'Handloom Saree', price: 24999, image: '/images/cat-wedding.jpg' },
        { id: 'p1-2', name: 'Zardozi Hand-Embroidered Raw Silk Blouse', category: 'Custom Blouse', price: 4499, image: '/images/cat-silk.jpg' },
        { id: 'p1-3', name: 'Antique Temple Lakshmi Nakshi Choker & Jhumkas', category: 'Heritage Jewellery', price: 6999, image: '/images/cat-festive.jpg' },
        { id: 'p1-4', name: 'Kemp Stone Handcrafted Gold Vaddanam Belt', category: 'Waist Belt', price: 3499, image: '/images/hero-banner.jpg' },
      ],
      hotspots: [
        { id: 'hs-1', label: 'Temple Zari Pallu', x: 42, y: 38, pieceIndex: 0 },
        { id: 'hs-2', label: 'Raw Silk Blouse', x: 52, y: 28, pieceIndex: 1 },
        { id: 'hs-3', label: 'Nakshi Choker', x: 50, y: 20, pieceIndex: 2 },
        { id: 'hs-4', label: 'Handcrafted Vaddanam', x: 48, y: 52, pieceIndex: 3 },
      ],
    },
    {
      id: 'look-2',
      name: 'Emerald Brocade Splendour',
      tagline: 'Lush green Kanjivaram paired with antique metallic accents and contrast ruby blouse.',
      modelImage: '/images/cat-silk.jpg',
      sareeColor: '#1A5D3A',
      sareeProductId: 'prod-2',
      pieces: [
        { id: 'p2-1', name: 'Emerald Green Kanjivaram Brocade Silk Saree', category: 'Handloom Saree', price: 16999, image: '/images/cat-silk.jpg' },
        { id: 'p2-2', name: 'Contrast Maroon Zari Brocade Blouse', category: 'Custom Blouse', price: 3899, image: '/images/hero-banner.jpg' },
        { id: 'p2-3', name: 'Kasu Mala Heritage Gold Coin Necklace', category: 'Heritage Jewellery', price: 5499, image: '/images/cat-festive.jpg' },
        { id: 'p2-4', name: 'Antique Gold Finish Temple Bangles (Set of 4)', category: 'Bangles', price: 2999, image: '/images/cat-wedding.jpg' },
      ],
      hotspots: [
        { id: 'hs-5', label: 'Brocade Body & Pallu', x: 44, y: 44, pieceIndex: 0 },
        { id: 'hs-6', label: 'Contrast Brocade Blouse', x: 50, y: 30, pieceIndex: 1 },
        { id: 'hs-7', label: 'Kasu Mala Necklace', x: 49, y: 22, pieceIndex: 2 },
        { id: 'hs-8', label: 'Temple Bangles', x: 38, y: 55, pieceIndex: 3 },
      ],
    },
    {
      id: 'look-3',
      name: 'Banarasi Kadwa Evening Grace',
      tagline: 'Silver kadwa weave on royal magenta silk with silver filigree neckpiece.',
      modelImage: '/images/cat-festive.jpg',
      sareeColor: '#6B1D4B',
      sareeProductId: 'prod-5',
      pieces: [
        { id: 'p3-1', name: 'Banarasi Silver Kadwa Brocade Silk Saree', category: 'Handloom Saree', price: 15499, image: '/images/cat-festive.jpg' },
        { id: 'p3-2', name: 'Silver Zari Tissue Sleeveless Blouse', category: 'Designer Blouse', price: 3299, image: '/images/cat-designer.jpg' },
        { id: 'p3-3', name: 'Fine Silver Filigree Choker & Chandbalis', category: 'Silver Jewellery', price: 4999, image: '/images/cat-wedding.jpg' },
        { id: 'p3-4', name: 'Hand-Embroidered Zardozi Potli Bag', category: 'Accessories', price: 2199, image: '/images/hero-banner.jpg' },
      ],
      hotspots: [
        { id: 'hs-9', label: 'Silver Kadwa Weave', x: 45, y: 48, pieceIndex: 0 },
        { id: 'hs-10', label: 'Silver Tissue Blouse', x: 51, y: 29, pieceIndex: 1 },
        { id: 'hs-11', label: 'Filigree Choker', x: 49, y: 21, pieceIndex: 2 },
        { id: 'hs-12', label: 'Zardozi Potli', x: 62, y: 58, pieceIndex: 3 },
      ],
    },
    {
      id: 'look-4',
      name: 'Pastel Chanderi Daytime Poise',
      tagline: 'Breathable Chanderi cotton-silk paired with ivory hand-blocked blouse and silver hasli.',
      modelImage: '/images/cat-cotton.jpg',
      sareeColor: '#4A6984',
      sareeProductId: 'prod-3',
      pieces: [
        { id: 'p4-1', name: 'Pastel Blue Chanderi Handloom Cotton Saree', category: 'Handloom Saree', price: 4299, image: '/images/cat-cotton.jpg' },
        { id: 'p4-2', name: 'Ivory Hand-Blocked Cotton Blouse', category: 'Artisan Blouse', price: 1899, image: '/images/cat-dailywear.jpg' },
        { id: 'p4-3', name: 'Tribal German Silver Hasli Neckpiece', category: 'Silver Jewellery', price: 2499, image: '/images/cat-designer.jpg' },
        { id: 'p4-4', name: 'Handcrafted Pure Leather Mojaris', category: 'Footwear', price: 2299, image: '/images/cat-silk.jpg' },
      ],
      hotspots: [
        { id: 'hs-13', label: 'Chanderi Zari Border', x: 46, y: 42, pieceIndex: 0 },
        { id: 'hs-14', label: 'Hand-Blocked Blouse', x: 50, y: 28, pieceIndex: 1 },
        { id: 'hs-15', label: 'Silver Hasli', x: 49, y: 19, pieceIndex: 2 },
        { id: 'hs-16', label: 'Artisan Mojaris', x: 47, y: 78, pieceIndex: 3 },
      ],
    },
  ];

  // Auto-advance lookbook every 5 seconds if not paused by hover/interaction
  useEffect(() => {
    if (isAutoPaused) return;
    const timer = setInterval(() => {
      setActiveLookIndex((prev) => (prev + 1) % LOOKS.length);
      setActiveHotspot(null);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPaused, LOOKS.length]);

  const currentLook = LOOKS[activeLookIndex];
  const totalLookPrice = currentLook.pieces.reduce((sum, p) => sum + p.price, 0);

  const handleAddFullLook = () => {
    setIsAdding(true);
    const targetProduct = products.find(p => p.id === currentLook.sareeProductId) || products[0];

    if (targetProduct) {
      addToCart(targetProduct, 1);
      showToast(`Added "${currentLook.name}" ensemble to your cart!`, 'success');
      setTimeout(() => {
        setIsAdding(false);
        setIsCartOpen(true);
      }, 350);
    } else {
      setIsAdding(false);
    }
  };

  const handlePrevLook = () => {
    setIsAutoPaused(true);
    setActiveLookIndex((prev) => (prev === 0 ? LOOKS.length - 1 : prev - 1));
    setActiveHotspot(null);
  };

  const handleNextLook = () => {
    setIsAutoPaused(true);
    setActiveLookIndex((prev) => (prev === LOOKS.length - 1 ? 0 : prev + 1));
    setActiveHotspot(null);
  };

  return (
    <section
      id="try-the-look"
      className="try-look-section"
      aria-label="Interactive Head to Toe Lookbook"
      onMouseEnter={() => setIsAutoPaused(true)}
      onMouseLeave={() => setIsAutoPaused(false)}
    >
      <div className="try-look-container">
        {/* Editorial Section Header */}
        <div className="try-look-header">
          <div className="try-look-eyebrow">
            <span className="eyebrow-accent">✦</span>
            <span>STYLED HEAD TO TOE</span>
            <span className="eyebrow-accent">✦</span>
          </div>

          <h2 className="try-look-title">
            Try the <span className="title-highlight">Look.</span>
          </h2>

          <p className="try-look-desc">
            Complete handloom ensembles curated by master stylists. Tap a piece or hotspot to inspect each artisanal detail.
          </p>
        </div>

        {/* Look Selector Tabs / Navigation with Animated Progress Bar */}
        <div className="try-look-tabs-row" role="tablist">
          {LOOKS.map((look, idx) => (
            <button
              key={look.id}
              role="tab"
              aria-selected={idx === activeLookIndex}
              className={`look-tab-btn ${idx === activeLookIndex ? 'is-active' : ''}`}
              onClick={() => {
                setIsAutoPaused(true);
                setActiveLookIndex(idx);
                setActiveHotspot(null);
              }}
            >
              <span className="look-tab-number">0{idx + 1}</span>
              <span className="look-tab-name">{look.name.split(' ')[0]} {look.name.split(' ')[1]}</span>
              {idx === activeLookIndex && !isAutoPaused && (
                <span className="look-tab-progress-bar" />
              )}
            </button>
          ))}
        </div>

        {/* Main Stage Grid: Interactive Model (Left/Center) + Pieces Breakdown (Right) */}
        <div className="try-look-stage-grid">
          {/* Left/Center Interactive Model View */}
          <div className="look-model-stage">
            {/* Arrows */}
            <button
              className="look-stage-nav-btn nav-prev"
              onClick={handlePrevLook}
              aria-label="Previous styled look"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="look-stage-nav-btn nav-next"
              onClick={handleNextLook}
              aria-label="Next styled look"
            >
              <ChevronRight size={20} />
            </button>

            {/* Model Card Frame with Smooth Fade/Scale Entrance */}
            <div className="look-model-card" key={`model-stage-${currentLook.id}`}>
              <img
                src={currentLook.modelImage}
                alt={currentLook.name}
                className="look-model-img"
              />

              {/* Gradient Scrim */}
              <div className="look-model-gradient" />

              {/* Hotspot Pins with Pulsing Wave Rings */}
              {currentLook.hotspots.map((hs) => (
                <button
                  key={hs.id}
                  className={`look-hotspot-pin ${activeHotspot === hs.pieceIndex ? 'is-active' : ''}`}
                  style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                  onClick={() => setActiveHotspot(activeHotspot === hs.pieceIndex ? null : hs.pieceIndex)}
                  aria-label={`Inspect ${hs.label}`}
                >
                  <span className="hotspot-pulse-ring-outer" />
                  <span className="hotspot-pulse-ring-inner" />
                  <span className="hotspot-core-dot" />
                  <span className="hotspot-tooltip">{hs.label}</span>
                </button>
              ))}

              {/* Floating Bottom Look Title */}
              <div className="look-model-bottom-badge">
                <span className="model-badge-tag">Styled Look • 0{activeLookIndex + 1}</span>
                <h3 className="model-badge-title">{currentLook.name}</h3>
                <p className="model-badge-tagline">{currentLook.tagline}</p>
              </div>
            </div>
          </div>

          {/* Right Sliding Wardrobe Breakdown Panel */}
          <div className="look-wardrobe-panel">
            <div className="wardrobe-panel-header">
              <span className="wardrobe-count">{currentLook.pieces.length} Curated Pieces</span>
              <h3 className="wardrobe-heading">Ensemble Details</h3>
            </div>

            {/* List of Pieces with Staggered Entrance */}
            <div className="wardrobe-pieces-list" key={`wardrobe-list-${currentLook.id}`}>
              {currentLook.pieces.map((piece, pIdx) => (
                <div
                  key={piece.id}
                  className={`wardrobe-piece-item ${activeHotspot === pIdx ? 'is-highlighted' : ''}`}
                  style={{ animationDelay: `${pIdx * 80}ms` }}
                  onClick={() => setActiveHotspot(activeHotspot === pIdx ? null : pIdx)}
                  onMouseEnter={() => setActiveHotspot(pIdx)}
                  onMouseLeave={() => setActiveHotspot(null)}
                >
                  <div className="piece-thumbnail-box">
                    <img src={piece.image} alt={piece.name} className="piece-thumbnail-img" />
                    {activeHotspot === pIdx && <span className="piece-active-badge"><Sparkles size={11} /></span>}
                  </div>

                  <div className="piece-text-info">
                    <span className="piece-category">{piece.category}</span>
                    <h4 className="piece-name">{piece.name}</h4>
                    <span className="piece-price">₹{piece.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total & Action */}
            <div className="wardrobe-footer">
              <div className="wardrobe-total-row">
                <div className="total-label-box">
                  <span className="total-label">Complete Look Total</span>
                  <span className="total-note">Saree + Blouse + Accents</span>
                </div>
                <div className="total-price-box">
                  <span className="total-price">₹{totalLookPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                className="add-full-look-btn"
                onClick={handleAddFullLook}
                disabled={isAdding}
                id="add-full-look-to-bag"
              >
                {isAdding ? (
                  <>
                    <Check size={18} />
                    <span>Adding Ensemble...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>Add Full Look to Bag</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TryTheLook;
