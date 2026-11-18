import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { Product } from '../../types';
import './BridalCoverflow.css';

interface BridalItem {
  id: string;
  name: string;
  subtitle: string;
  weave: string;
  price: number;
  originalPrice?: number;
  image: string;
  productId: string;
}

interface BridalCoverflowProps {
  products: Product[];
}

const BRIDAL_PIECES: BridalItem[] = [
  {
    id: 'bridal-1',
    name: 'Manjal Kalyanam Pattu',
    subtitle: 'Pure Zari Golden Yellow Bridal Saree',
    weave: 'Handwoven Kanchipuram Korvai',
    price: 24999,
    originalPrice: 29999,
    image: '/images/cat-dailywear.jpg',
    productId: 'prod-4',
  },
  {
    id: 'bridal-2',
    name: 'Vermillion Muhurtham Classic',
    subtitle: 'Auspicious Bridal Red Temple Border',
    weave: 'Heavy Bridal Mulberry Silk',
    price: 26500,
    originalPrice: 32000,
    image: '/images/cat-wedding.jpg',
    productId: 'prod-4',
  },
  {
    id: 'bridal-3',
    name: 'Emerald Maragatha Pattu',
    subtitle: 'Royal Green with Antique Gold Zari',
    weave: 'Traditional Temple Border Silk',
    price: 22800,
    originalPrice: 27500,
    image: '/images/cat-silk.jpg',
    productId: 'prod-2',
  },
  {
    id: 'bridal-4',
    name: 'Silver Kadwa Banarasi Bride',
    subtitle: 'Silver Brocade Floral Jaal',
    weave: 'Pure Katan Silk Brocade',
    price: 21999,
    originalPrice: 26000,
    image: '/images/cat-festive.jpg',
    productId: 'prod-5',
  },
  {
    id: 'bridal-5',
    name: 'Pastel Rani Muhurtham Weave',
    subtitle: 'Dual-Tone Magenta & Gold Sheen',
    weave: 'Master Weaver Signature Series',
    price: 28999,
    originalPrice: 34500,
    image: '/images/hero-banner.jpg',
    productId: 'prod-1',
  },
];

export const BridalCoverflow: React.FC<BridalCoverflowProps> = ({ products }) => {
  const [activeIndex, setActiveIndex] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const dragStartXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  // Automatic Rotation every 4.8s when not interacted/hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % BRIDAL_PIECES.length);
    }, 4800);

    return () => clearInterval(timer);
  }, [isPaused]);

  const currentPiece = BRIDAL_PIECES[activeIndex];

  const handlePrev = () => {
    setIsPaused(true);
    setActiveIndex((prev) => (prev === 0 ? BRIDAL_PIECES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsPaused(true);
    setActiveIndex((prev) => (prev === BRIDAL_PIECES.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    setIsAdding(true);
    const targetProduct = products.find((p) => p.id === currentPiece.productId) || products[0];

    if (targetProduct) {
      addToCart(targetProduct, 1);
      showToast(`Added "${currentPiece.name}" to your cart!`, 'success');
      setTimeout(() => {
        setIsAdding(false);
        setIsCartOpen(true);
      }, 350);
    } else {
      setIsAdding(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setIsPaused(true);
    dragStartXRef.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const dx = e.clientX - dragStartXRef.current;
    if (dx > 40) {
      handlePrev();
    } else if (dx < -40) {
      handleNext();
    }
  };

  return (
    <section
      id="bridal-collection"
      className="bridal-coverflow-section"
      aria-label="The Bridal Collection Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="bridal-coverflow-container">
        {/* Header */}
        <div className="bridal-coverflow-header">
          <div className="bridal-coverflow-eyebrow">
            <span className="eyebrow-accent">✦</span>
            <span>AUSPICIOUS MUHURTHAM</span>
            <span className="eyebrow-accent">✦</span>
          </div>

          <h2 className="bridal-coverflow-title">
            The Bridal <span className="title-highlight">Collection</span>
          </h2>

          <p className="bridal-coverflow-desc">
            Heirloom bridal silks woven with pure silver-core zari for sacred ceremonies.
          </p>
        </div>

        {/* 3D Arched Coverflow Arc */}
        <div
          className="bridal-coverflow-viewport"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          tabIndex={0}
          role="region"
          aria-label="Bridal Coverflow Carousel"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
          }}
        >
          {/* Navigation Arrows */}
          <button className="bridal-nav-btn nav-prev" onClick={handlePrev} aria-label="Previous Bridal Saree">
            <ChevronLeft size={22} />
          </button>
          <button className="bridal-nav-btn nav-next" onClick={handleNext} aria-label="Next Bridal Saree">
            <ChevronRight size={22} />
          </button>

          {/* 3D Perspective Stage */}
          <div className="bridal-coverflow-stage">
            {BRIDAL_PIECES.map((piece, idx) => {
              const offset = idx - activeIndex;
              const absOffset = Math.abs(offset);

              // 3D curved calculation
              const rotateY = offset * -28;
              const translateX = offset * 180;
              const translateZ = -absOffset * 85;
              const scale = 1 - absOffset * 0.12;
              const opacity = absOffset > 2 ? 0 : 1 - absOffset * 0.28;
              const zIndex = 20 - absOffset;

              return (
                <div
                  key={piece.id}
                  className={`bridal-arch-card ${offset === 0 ? 'is-active' : ''}`}
                  style={{
                    transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                    opacity: opacity,
                    zIndex: zIndex,
                  }}
                  onClick={() => {
                    setIsPaused(true);
                    setActiveIndex(idx);
                  }}
                >
                  <div className="bridal-arch-frame">
                    <img src={piece.image} alt={piece.name} className="bridal-arch-img" draggable={false} />
                    <div className="bridal-arch-gradient" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Bridal Piece Details Beneath Arc (Smooth Fade Animation) */}
        <div className="bridal-active-details" key={`bridal-details-${currentPiece.id}`}>
          <span className="bridal-active-weave">{currentPiece.weave}</span>
          <h3 className="bridal-active-title">{currentPiece.name}</h3>
          <p className="bridal-active-sub">{currentPiece.subtitle}</p>
          <div className="bridal-active-price">
            ₹{currentPiece.price.toLocaleString('en-IN')}
            {currentPiece.originalPrice && (
              <span className="bridal-original-price">
                ₹{currentPiece.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            className="bridal-add-btn"
            onClick={handleAddToCart}
            disabled={isAdding}
            id="bridal-coverflow-add-btn"
          >
            {isAdding ? (
              <>
                <Check size={18} />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag size={18} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default BridalCoverflow;
