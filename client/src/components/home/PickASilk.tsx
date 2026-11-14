import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, Plus, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { Product } from '../../types';
import './PickASilk.css';

interface SwatchCard {
  id: string;
  name: string;
  weave: string;
  colorName: string;
  cardBg: string;
  textColor: string;
  price: number;
  image: string;
  productId: string;
}

interface PickASilkProps {
  products: Product[];
}

const SWATCHES: SwatchCard[] = [
  {
    id: 'swatch-1',
    name: 'KOORAI CHECK',
    weave: 'Handloom Korvai',
    colorName: 'Emerald Temple Green',
    cardBg: 'linear-gradient(145deg, #10B958 0%, #067A35 100%)',
    textColor: '#FFFFFF',
    price: 18499,
    image: '/images/cat-silk.jpg',
    productId: 'prod-2',
  },
  {
    id: 'swatch-2',
    name: 'MURSHIDABAD MAROON',
    weave: 'Pure Mulberry Silk',
    colorName: 'Crimson Temple Maroon',
    cardBg: 'linear-gradient(145deg, #E62035 0%, #8E0E1C 100%)',
    textColor: '#FFFFFF',
    price: 24999,
    image: '/images/cat-wedding.jpg',
    productId: 'prod-4',
  },
  {
    id: 'swatch-3',
    name: 'MONSOON TEAL',
    weave: 'Chanderi Zari Blend',
    colorName: 'Deep Peacock Cyan',
    cardBg: 'linear-gradient(145deg, #0299BA 0%, #035B70 100%)',
    textColor: '#FFFFFF',
    price: 16999,
    image: '/images/cat-cotton.jpg',
    productId: 'prod-3',
  },
  {
    id: 'swatch-4',
    name: 'SINDOOR ORANGE',
    weave: 'Kadwa Brocade',
    colorName: 'Auspicious Saffron Vermillion',
    cardBg: 'linear-gradient(145deg, #F97A0A 0%, #B84700 100%)',
    textColor: '#FFFFFF',
    price: 19500,
    image: '/images/cat-dailywear.jpg',
    productId: 'prod-7',
  },
  {
    id: 'swatch-5',
    name: 'MAGENTA SHO SILK',
    weave: 'Kanchipuram Silk',
    colorName: 'Royal Rani Violet',
    cardBg: 'linear-gradient(145deg, #8A25B1 0%, #4D0967 100%)',
    textColor: '#FFFFFF',
    price: 28800,
    image: '/images/hero-banner.jpg',
    productId: 'prod-1',
  },
  {
    id: 'swatch-6',
    name: 'BENARES GOLD',
    weave: 'Silver Kadwa Weave',
    colorName: 'Heirloom Metallic Honey Gold',
    cardBg: 'linear-gradient(145deg, #F0AE13 0%, #A26B00 100%)',
    textColor: '#FFFFFF',
    price: 22500,
    image: '/images/cat-festive.jpg',
    productId: 'prod-5',
  },
  {
    id: 'swatch-7',
    name: 'PALACE CHECK',
    weave: 'Embroidered Organza',
    colorName: 'Blush Rose Gold',
    cardBg: 'linear-gradient(145deg, #D4285B 0%, #820F32 100%)',
    textColor: '#FFFFFF',
    price: 21999,
    image: '/images/cat-designer.jpg',
    productId: 'prod-6',
  },
];

export const PickASilk: React.FC<PickASilkProps> = ({ products }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const autoDriftSpeedRef = useRef(0.85); // Continuous visible automatic drift (~51px/s)
  const animFrameRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentOffsetRef = useRef(0);

  const CARD_WIDTH = 250;
  const GAP = 28;
  const TOTAL_STEP = CARD_WIDTH + GAP;
  const TOTAL_CYCLE = SWATCHES.length * TOTAL_STEP;

  // Keep ref updated
  useEffect(() => {
    currentOffsetRef.current = scrollOffset;
  }, [scrollOffset]);

  // CONTINUOUS AUTOMATIC ROTATION & MOMENTUM PHYSICS LOOP
  useEffect(() => {
    let isRunning = true;

    const loop = () => {
      if (!isRunning) return;

      if (!isDraggingRef.current) {
        if (Math.abs(velocityRef.current) > 0.08) {
          // Coasting with release momentum
          setScrollOffset((prev) => {
            let next = prev + velocityRef.current;
            if (next >= TOTAL_CYCLE) next -= TOTAL_CYCLE;
            if (next < 0) next += TOTAL_CYCLE;
            return next;
          });
          velocityRef.current *= 0.94;
        } else {
          velocityRef.current = 0;
          if (!isUserInteracting) {
            // AUTOMATIC CONTINUOUS DRIFT (visible immediately!)
            setScrollOffset((prev) => {
              let next = prev + autoDriftSpeedRef.current;
              if (next >= TOTAL_CYCLE) next -= TOTAL_CYCLE;
              return next;
            });
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isUserInteracting, TOTAL_CYCLE]);

  const scheduleResume = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 2400);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setIsUserInteracting(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);

    startXRef.current = e.clientX;
    dragStartOffsetRef.current = currentOffsetRef.current;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;

    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dx = e.clientX - lastXRef.current;

    velocityRef.current = -(dx / dt) * 16;
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;

    const totalDx = e.clientX - startXRef.current;
    let nextOffset = dragStartOffsetRef.current - totalDx;
    while (nextOffset >= TOTAL_CYCLE) nextOffset -= TOTAL_CYCLE;
    while (nextOffset < 0) nextOffset += TOTAL_CYCLE;

    setScrollOffset(nextOffset);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }

    scheduleResume();
  };

  const handleQuickAdd = (swatch: SwatchCard, e: React.MouseEvent) => {
    e.stopPropagation();
    const matchedProduct = products.find((p) => p.id === swatch.productId) || products[0];
    if (matchedProduct) {
      addToCart(matchedProduct, 1);
      setAddedId(swatch.id);
      showToast(`Added ${swatch.name} to bag!`, 'success');
      setTimeout(() => {
        setAddedId(null);
        setIsCartOpen(true);
      }, 400);
    }
  };

  const handleWishlistToggle = (swatch: SwatchCard, e: React.MouseEvent) => {
    e.stopPropagation();
    const matchedProduct = products.find((p) => p.id === swatch.productId) || products[0];
    if (matchedProduct) {
      toggleWishlist(matchedProduct);
    }
  };

  return (
    <section
      id="pick-a-silk"
      className="pick-silk-section"
      aria-label="Interactive 3D Color Deck"
      onMouseEnter={() => setIsUserInteracting(true)}
      onMouseLeave={scheduleResume}
    >
      <div className="pick-silk-container">
        {/* Header */}
        <div className="pick-silk-header">
          <div className="pick-silk-eyebrow">
            <span className="eyebrow-accent">✦</span>
            <span>PALETTE & TEXTURE</span>
            <span className="eyebrow-accent">✦</span>
          </div>

          <h2 className="pick-silk-title">
            Pick a <span className="title-highlight">Silk</span>
          </h2>

          <p className="pick-silk-desc">
            Explore pure handloom colors in continuous 3D motion. Drag horizontally or watch the palette glide.
          </p>
        </div>

        {/* 3D Arc Deck Carousel Viewport */}
        <div
          ref={containerRef}
          className="pick-silk-viewport"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          tabIndex={0}
          role="region"
          aria-label="3D Silk Swatch Carousel"
        >
          <div className="pick-silk-perspective-scene" ref={trackRef}>
            {/* Duplicated 3 times (-1, 0, 1) for seamless continuous wrapping */}
            {[-1, 0, 1].map((setIndex) =>
              SWATCHES.map((swatch, idx) => {
                const itemGlobalIndex = setIndex * SWATCHES.length + idx;
                const itemPos = itemGlobalIndex * TOTAL_STEP - scrollOffset;

                const containerWidth = containerRef.current?.clientWidth || 1200;
                const centerDist = itemPos - containerWidth / 2 + CARD_WIDTH / 2;
                const normDist = centerDist / (containerWidth * 0.55);

                // 3D rotation, depth, scale, and visibility calculations
                const rotateY = Math.max(-35, Math.min(35, normDist * 28));
                const translateZ = Math.max(-160, (1 - Math.min(1, Math.abs(normDist))) * 60 - 50);
                const scale = Math.max(0.84, 1 - Math.abs(normDist) * 0.18);
                const opacity = Math.max(0.35, 1 - Math.abs(normDist) * 0.65);

                const matchedProduct = products.find((p) => p.id === swatch.productId);
                const isWished = matchedProduct ? isInWishlist(matchedProduct.id) : false;

                return (
                  <div
                    key={`${setIndex}-${swatch.id}`}
                    className="swatch-3d-card"
                    style={{
                      left: `${containerWidth / 2 - CARD_WIDTH / 2}px`,
                      transform: `translate3d(${centerDist}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                      opacity: opacity,
                      zIndex: Math.round(100 - Math.abs(centerDist) / 10),
                      background: swatch.cardBg,
                    }}
                  >
                    {/* Top Wishlist Heart */}
                    <button
                      className={`swatch-wish-btn ${isWished ? 'is-wished' : ''}`}
                      onClick={(e) => handleWishlistToggle(swatch, e)}
                      aria-label="Add to wishlist"
                    >
                      <Heart size={15} fill={isWished ? '#8B202F' : 'none'} color={isWished ? '#8B202F' : '#FFFFFF'} />
                    </button>

                    {/* Massive Bold Condensed Typography Stamped at Top */}
                    <div className="swatch-title-box">
                      <h3 className="swatch-title-text">{swatch.name}</h3>
                      <span className="swatch-weave-tag">{swatch.weave}</span>
                    </div>

                    {/* Saree Model Image in Center */}
                    <div className="swatch-model-box">
                      <img src={swatch.image} alt={swatch.name} className="swatch-model-img" draggable={false} />
                      <div className="swatch-model-glow" />
                    </div>

                    {/* Bottom Bar: Price + Circular Add Button */}
                    <div className="swatch-card-footer">
                      <div className="swatch-price-box">
                        <span className="swatch-color-label">{swatch.colorName}</span>
                        <span className="swatch-price-val">₹{swatch.price.toLocaleString('en-IN')}</span>
                      </div>

                      <button
                        className="swatch-plus-btn"
                        onClick={(e) => handleQuickAdd(swatch, e)}
                        aria-label={`Add ${swatch.name} to bag`}
                      >
                        {addedId === swatch.id ? <Check size={16} /> : <Plus size={18} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Drag Hint at Bottom */}
        <div className="pick-silk-drag-hint" aria-hidden="true">
          <span className="hint-pulse">✦</span>
          <span>Continuously drifting • Drag horizontally to rotate swatches with momentum</span>
          <span className="hint-pulse">✦</span>
        </div>
      </div>
    </section>
  );
};

export default PickASilk;
