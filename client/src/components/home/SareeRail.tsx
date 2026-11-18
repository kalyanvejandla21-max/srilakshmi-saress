import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShoppingBag, Heart, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Product } from '../../types';
import { INITIAL_PRODUCTS } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { SriLakshmiButton } from '../ui/SriLakshmiButton';
import './SareeRail.css';

interface SareeRailProps {
  products?: Product[];
}

interface SareeItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  fabric: string;
  images: string[];
}

const CATEGORY_PILLS = [
  { id: 'all', label: 'All pieces', count: 28 },
  { id: 'silk', label: 'Silk Sarees', count: 14 },
  { id: 'half-saree', label: 'Half Sarees', count: 6 },
  { id: 'full-blouse', label: 'Full-Sleeve Blouses', count: 4 },
  { id: 'half-blouse', label: 'Half-Sleeve Blouses', count: 4 },
  { id: 'zari', label: 'Zari & Dupattas', count: 8 },
];

export const SareeRail: React.FC<SareeRailProps> = ({ products = [] }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Focused Inspector State (as seen in frames 24–27 in reference video)
  const [inspectedSaree, setInspectedSaree] = useState<SareeItem | null>(null);
  const [inspectedView, setInspectedView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [includeBlouse, setIncludeBlouse] = useState<boolean>(true);
  const [isAddingToBag, setIsAddingToBag] = useState<boolean>(false);

  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  // 1. Select REAL signature sarees from catalog
  const sarees: SareeItem[] = useMemo(() => {
    const source = products && products.length > 0 ? products : INITIAL_PRODUCTS;
    const active = source.filter((p) => p.isActive !== false);

    let filtered = active;
    if (selectedCategory === 'silk') {
      filtered = active.filter((p) => p.category.includes('Silk'));
    } else if (selectedCategory === 'half-saree') {
      filtered = active.filter((p) => p.category.includes('Wedding') || p.category.includes('Designer'));
    } else if (selectedCategory === 'full-blouse' || selectedCategory === 'half-blouse') {
      filtered = active.filter((p) => p.blouseIncluded || p.category.includes('Silk'));
    } else if (selectedCategory === 'zari') {
      filtered = active.filter((p) => p.pattern?.toLowerCase().includes('zari') || p.category.includes('Festive'));
    }

    const pool = filtered.length >= 4 ? filtered : active;
    const selected = pool.slice(0, 8);

    return selected.map((p) => {
      const discount =
        p.originalPrice && p.originalPrice > p.price
          ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
          : p.discountPercentage || 0;

      const craft = p.fabric ? p.fabric.split(' ')[0] : p.category.replace(' Sarees', '');

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice,
        discountPercentage: discount,
        fabric: craft || 'Pure Silk',
        images: p.images && p.images.length > 0 ? p.images : ['/images/hero-banner.jpg', '/images/cat-silk.jpg'],
      };
    });
  }, [products, selectedCategory]);

  const N = sarees.length;

  // Responsive item width and spacing
  const getLayout = (width: number) => {
    if (width >= 1200) return { itemWidth: 280, gap: 32 };
    if (width >= 768) return { itemWidth: 250, gap: 24 };
    return { itemWidth: 216, gap: 16 };
  };

  const { itemWidth, gap } = getLayout(containerWidth);
  const stepWidth = itemWidth + gap;
  const setWidth = N * stepWidth;

  // Physics and Animation Refs
  const offsetRef = useRef<number>(-setWidth);
  const autoSpeedRef = useRef<number>(1.15); // Obvious, visible continuous drift (~70px/sec)
  const isInteractingRef = useRef<boolean>(false);
  const isInViewportRef = useRef<boolean>(true);
  const momentumVelocityRef = useRef<number>(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Pointer Gesture Refs
  const isPointerDownRef = useRef<boolean>(false);
  const pointerStartXRef = useRef<number>(0);
  const pointerStartYRef = useRef<number>(0);
  const dragStartOffsetRef = useRef<number>(0);
  const lastPointerXRef = useRef<number>(0);
  const lastPointerTimeRef = useRef<number>(0);
  const isGestureLockedRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);

  // Triple set for completely seamless, infinite wrapping without visual jumps
  const sets = useMemo(() => [0, 1, 2], []);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(media.matches);

    const listener = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Intersection Observer
  useEffect(() => {
    if (!sectionRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        isInViewportRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  // Apply smooth offset transform directly to DOM
  const applyTransform = useCallback((x: number) => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
    }
  }, []);

  // Continuous physics loop
  useEffect(() => {
    if (setWidth <= 0 || isReducedMotion) return;

    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;

      if (isInViewportRef.current && !inspectedSaree) {
        if (!isPointerDownRef.current) {
          if (Math.abs(momentumVelocityRef.current) > 0.05) {
            offsetRef.current += momentumVelocityRef.current;
            momentumVelocityRef.current *= 0.94;
          } else {
            momentumVelocityRef.current = 0;
            if (!isInteractingRef.current) {
              offsetRef.current -= autoSpeedRef.current;
            }
          }

          if (offsetRef.current <= -setWidth * 2) {
            offsetRef.current += setWidth;
          } else if (offsetRef.current >= 0) {
            offsetRef.current -= setWidth;
          }

          applyTransform(offsetRef.current);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [setWidth, isReducedMotion, applyTransform, inspectedSaree]);

  // Pointer interactions
  const handlePointerDown = (e: React.PointerEvent) => {
    if (inspectedSaree) return;
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    isGestureLockedRef.current = false;
    isInteractingRef.current = true;

    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

    pointerStartXRef.current = e.clientX;
    pointerStartYRef.current = e.clientY;
    dragStartOffsetRef.current = offsetRef.current;
    lastPointerXRef.current = e.clientX;
    lastPointerTimeRef.current = performance.now();
    momentumVelocityRef.current = 0;

    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || isGestureLockedRef.current) return;

    const dx = e.clientX - pointerStartXRef.current;
    const dy = e.clientY - pointerStartYRef.current;

    if (!hasMovedRef.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) {
        isGestureLockedRef.current = true;
        isPointerDownRef.current = false;
        return;
      }
      if (Math.abs(dx) > 4) {
        hasMovedRef.current = true;
      }
    }

    if (hasMovedRef.current) {
      e.preventDefault();
      const currentX = e.clientX;
      const currentTime = performance.now();
      const dt = Math.max(1, currentTime - lastPointerTimeRef.current);
      const instantVelocity = (currentX - lastPointerXRef.current) / dt;

      momentumVelocityRef.current = instantVelocity * 16;
      lastPointerXRef.current = currentX;
      lastPointerTimeRef.current = currentTime;

      offsetRef.current = dragStartOffsetRef.current + dx;

      if (offsetRef.current <= -setWidth * 2) {
        offsetRef.current += setWidth;
        dragStartOffsetRef.current += setWidth;
      } else if (offsetRef.current >= 0) {
        offsetRef.current -= setWidth;
        dragStartOffsetRef.current -= setWidth;
      }

      applyTransform(offsetRef.current);
    }
  };

  const scheduleResume = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2400);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }

    scheduleResume();
  };

  const handleSareeClick = (e: React.MouseEvent, saree: SareeItem) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Open Focused Inspector Mode!
    e.preventDefault();
    setInspectedSaree(saree);
    setInspectedView('FRONT');
  };

  const handleInspectorPrev = () => {
    if (!inspectedSaree) return;
    const currentIndex = sarees.findIndex((s) => s.id === inspectedSaree.id);
    const prevIndex = currentIndex <= 0 ? sarees.length - 1 : currentIndex - 1;
    setInspectedSaree(sarees[prevIndex]);
    setInspectedView('FRONT');
  };

  const handleInspectorNext = () => {
    if (!inspectedSaree) return;
    const currentIndex = sarees.findIndex((s) => s.id === inspectedSaree.id);
    const nextIndex = currentIndex >= sarees.length - 1 ? 0 : currentIndex + 1;
    setInspectedSaree(sarees[nextIndex]);
    setInspectedView('FRONT');
  };

  const handleInspectorAddToBag = () => {
    if (!inspectedSaree) return;
    setIsAddingToBag(true);

    const matchedProduct = products.find((p) => p.id === inspectedSaree.id) || products[0];
    if (matchedProduct) {
      addToCart(matchedProduct, 1);
      showToast(`Added "${inspectedSaree.name}" to your bag!`, 'success');
      setTimeout(() => {
        setIsAddingToBag(false);
        setIsCartOpen(true);
      }, 350);
    } else {
      setIsAddingToBag(false);
    }
  };

  return (
    <section
      id="the-rack"
      ref={sectionRef}
      className={`saree-rail-section ${inspectedSaree ? 'inspector-active' : ''}`}
      aria-label="Interactive Saree Rail Collection"
    >
      {/* SVG Filters for Antique Gold Sheen & Hanger Shadow */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <linearGradient id="rail-brass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8EB" />
            <stop offset="25%" stopColor="#EAD292" />
            <stop offset="50%" stopColor="#C5A059" />
            <stop offset="75%" stopColor="#A47E3B" />
            <stop offset="100%" stopColor="#6E4D1B" />
          </linearGradient>
          <filter id="hanger-emboss-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#1A0D00" floodOpacity="0.35" />
          </filter>
        </defs>
      </svg>

      {/* Editorial Header */}
      <div className="saree-rail-header">
        <div className="saree-rail-eyebrow">
          <span className="saree-rail-eyebrow-dash" />
          <span>SIGNATURE COLLECTION</span>
          <span className="saree-rail-eyebrow-dash" />
        </div>

        <h2 className="saree-rail-title">Every Saree, on the rail.</h2>

        <p className="saree-rail-subtitle">
          Heirloom handlooms draped on the boutique rail. Select any piece to inspect.
        </p>

        {/* Category Filter Pills (as visible in reference video frames 28–34) */}
        <div className="saree-rail-category-pills" role="tablist">
          {CATEGORY_PILLS.map((pill) => (
            <button
              key={pill.id}
              role="tab"
              aria-selected={selectedCategory === pill.id}
              className={`rail-category-pill ${selectedCategory === pill.id ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(pill.id)}
            >
              <span>{pill.label}</span>
              <span className="pill-count">{pill.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Saree Rail Track Area */}
      <div className="saree-rail-track-outer">
        {/* Continuous Antique Brass Rail Bar */}
        <div className="saree-rail-brass-bar-wrap" aria-hidden="true">
          <div className="saree-rail-brass-bar">
            <div className="saree-rail-brass-highlight" />
          </div>
          <div className="saree-rail-wall-bracket left">
            <span className="saree-rail-wall-bracket-bolt" />
            <span className="saree-rail-wall-bracket-bolt" />
          </div>
          <div className="saree-rail-wall-bracket right">
            <span className="saree-rail-wall-bracket-bolt" />
            <span className="saree-rail-wall-bracket-bolt" />
          </div>
        </div>

        {/* Viewport for Dragging & Gliding */}
        <div
          ref={containerRef}
          className={`saree-rail-viewport ${inspectedSaree ? 'is-blurred' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onMouseEnter={() => {
            isInteractingRef.current = true;
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
          }}
          onMouseLeave={scheduleResume}
          tabIndex={0}
          role="region"
          aria-label="Interactive Saree Rail"
        >
          <div
            ref={trackRef}
            className="saree-rail-track"
            style={{
              gap: `${gap}px`,
              paddingLeft: `${gap}px`,
            }}
          >
            {sets.map((setIndex) =>
              sarees.map((saree, i) => {
                const uniqueKey = `rail-set-${setIndex}-saree-${saree.id || i}`;
                return (
                  <div
                    key={uniqueKey}
                    className="saree-rail-garment-col"
                    style={{
                      width: `${itemWidth}px`,
                      animationDelay: `${i * -0.8}s`,
                    }}
                    onClick={(e) => handleSareeClick(e, saree)}
                    tabIndex={setIndex === 1 ? 0 : -1}
                    role="button"
                    aria-label={`Inspect ${saree.name} - ₹${saree.price.toLocaleString('en-IN')}`}
                  >
                    {/* UNIFIED HANGING SAREE OBJECT (Hook + Hanger + Saree move as ONE physical object) */}
                    <div className="hanging-saree">
                      {/* Antique Brass Hanger Hook & Shoulders */}
                      <div className="hanging-hanger-wrap">
                        <svg viewBox="0 0 240 76" className="hanging-hanger-svg" aria-hidden="true">
                          {/* Top hook loop curving over the rail */}
                          <path
                            d="M120,40 L120,24 C120,13 127,7 134,10 C139,13 137,20 131,21"
                            fill="none"
                            stroke="url(#rail-brass-grad)"
                            strokeWidth="3.8"
                            strokeLinecap="round"
                          />
                          {/* Swivel collar neck */}
                          <rect x="116" y="38" width="8" height="5" rx="1.5" fill="#D4AF37" stroke="#8C6D23" strokeWidth="0.8" />
                          
                          {/* Curved luxury hanger shoulders */}
                          <path
                            d="M14,70 Q66,44 120,42 Q174,44 226,70"
                            fill="none"
                            stroke="url(#rail-brass-grad)"
                            strokeWidth="6.5"
                            strokeLinecap="round"
                            filter="url(#hanger-emboss-shadow)"
                          />
                          {/* Horizontal crossbar where fabric folds */}
                          <path
                            d="M24,70 L216,70"
                            fill="none"
                            stroke="url(#rail-brass-grad)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            opacity="0.85"
                          />
                          {/* Left & Right finial end-caps */}
                          <circle cx="14" cy="70" r="4.5" fill="#D4AF37" stroke="#6E4D1B" strokeWidth="1" />
                          <circle cx="226" cy="70" r="4.5" fill="#D4AF37" stroke="#6E4D1B" strokeWidth="1" />
                        </svg>
                      </div>

                      {/* Saree Drape Garment Frame - Immediately connected under hanger shoulders! */}
                      <div className="hanging-saree-body">
                        {/* Fabric drape fold crest directly beneath hanger bar */}
                        <div className="hanging-saree-crest" aria-hidden="true" />

                        <div className="saree-rail-photo-wrap">
                          <img
                            src={saree.images[0]}
                            alt={saree.name}
                            className="saree-rail-photo"
                            loading="lazy"
                            draggable={false}
                          />

                          {/* Craft Pill */}
                          <span className="saree-rail-fabric-pill">{saree.fabric}</span>

                          {/* Discount Pill if on sale */}
                          {saree.discountPercentage && saree.discountPercentage > 0 ? (
                            <span className="saree-rail-discount-pill">
                              {saree.discountPercentage}% OFF
                            </span>
                          ) : null}

                          {/* Swinging Boutique Price Tag */}
                          <div className="saree-rail-tag-assembly" aria-hidden="true">
                            <div className="saree-rail-tag-string" />
                            <div className="saree-rail-tag-card">
                              ₹{saree.price.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Editorial Label Beneath Saree */}
                    <div className="saree-rail-editorial-label">
                      <span className="saree-rail-label-category">{saree.category}</span>
                      <h3 className="saree-rail-label-title" title={saree.name}>
                        {saree.name}
                      </h3>
                      <div className="saree-rail-label-price-row">
                        <span className="saree-rail-label-price">
                          ₹{saree.price.toLocaleString('en-IN')}
                        </span>
                        {saree.originalPrice && saree.originalPrice > saree.price && (
                          <span className="saree-rail-label-original-price">
                            ₹{saree.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <span className="saree-rail-label-action">
                        Inspect Piece ✦
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FOCUSED INSPECTOR SPOTLIGHT OVERLAY (Frames 24–27) */}
      {/* ======================================================== */}
      {inspectedSaree && (
        <div className="rail-inspector-overlay" role="dialog" aria-modal="true" aria-label="Saree Inspector">
          {/* Backdrop click to dismiss */}
          <div className="rail-inspector-backdrop" onClick={() => setInspectedSaree(null)} />

          <div className="rail-inspector-stage">
            {/* Close Button */}
            <button
              className="inspector-close-btn"
              onClick={() => setInspectedSaree(null)}
              aria-label="Close Inspector"
            >
              <X size={20} />
            </button>

            {/* Left / Right Nav Arrows */}
            <button
              className="inspector-arrow-btn arrow-prev"
              onClick={handleInspectorPrev}
              aria-label="Previous Saree on Rail"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="inspector-arrow-btn arrow-next"
              onClick={handleInspectorNext}
              aria-label="Next Saree on Rail"
            >
              <ChevronRight size={24} />
            </button>

            {/* Brass Hanger in Spotlight */}
            <div className="inspector-hanger-assembly">
              <svg viewBox="0 0 240 76" className="inspector-hanger-svg" aria-hidden="true">
                <path
                  d="M120,40 L120,24 C120,13 127,7 134,10 C139,13 137,20 131,21"
                  fill="none"
                  stroke="url(#rail-brass-grad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <rect x="116" y="38" width="8" height="5" rx="1.5" fill="#D4AF37" stroke="#8C6D23" strokeWidth="0.8" />
                <path
                  d="M14,70 Q66,44 120,42 Q174,44 226,70"
                  fill="none"
                  stroke="url(#rail-brass-grad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  filter="url(#hanger-emboss-shadow)"
                />
                <circle cx="14" cy="70" r="4.5" fill="#D4AF37" stroke="#6E4D1B" strokeWidth="1" />
                <circle cx="226" cy="70" r="4.5" fill="#D4AF37" stroke="#6E4D1B" strokeWidth="1" />
              </svg>

              {/* Suspended Garment Frame with 3D Flip */}
              <div className={`inspector-garment-frame ${inspectedView === 'BACK' ? 'is-flipped' : ''}`}>
                <img
                  src={
                    inspectedView === 'BACK' && inspectedSaree.images.length > 1
                      ? inspectedSaree.images[1]
                      : inspectedSaree.images[0]
                  }
                  alt={inspectedSaree.name}
                  className="inspector-garment-img"
                />
                <div className="inspector-garment-shadow" />
              </div>
            </div>

            {/* Control Bar Beneath Saree (as in frames 24–27) */}
            <div className="inspector-control-card">
              <span className="inspector-fabric-tag">{inspectedSaree.fabric} • Handloom</span>
              <h3 className="inspector-title">{inspectedSaree.name}</h3>
              <div className="inspector-price">
                ₹{inspectedSaree.price.toLocaleString('en-IN')}
                {inspectedSaree.originalPrice && inspectedSaree.originalPrice > inspectedSaree.price && (
                  <span className="inspector-original-price">
                    ₹{inspectedSaree.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Front / Back Toggle Pills */}
              <div className="inspector-view-toggles" role="group" aria-label="View Angle">
                <button
                  type="button"
                  className={`view-pill ${inspectedView === 'FRONT' ? 'is-active' : ''}`}
                  onClick={() => setInspectedView('FRONT')}
                >
                  FRONT
                </button>
                <button
                  type="button"
                  className={`view-pill ${inspectedView === 'BACK' ? 'is-active' : ''}`}
                  onClick={() => setInspectedView('BACK')}
                >
                  BACK
                </button>
              </div>

              {/* Blouse Option */}
              <div className="inspector-option-row">
                <label className="inspector-blouse-checkbox">
                  <input
                    type="checkbox"
                    checked={includeBlouse}
                    onChange={(e) => setIncludeBlouse(e.target.checked)}
                  />
                  <span>Unstitched Running Blouse Included (0.8m)</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="inspector-actions-row">
                <button
                  className="inspector-add-btn"
                  onClick={handleInspectorAddToBag}
                  disabled={isAddingToBag}
                >
                  {isAddingToBag ? (
                    <>
                      <Check size={18} />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>

                <button
                  className={`inspector-wish-btn ${isInWishlist(inspectedSaree.id) ? 'is-wished' : ''}`}
                  onClick={() => {
                    const matched = products.find((p) => p.id === inspectedSaree.id);
                    if (matched) toggleWishlist(matched);
                  }}
                  aria-label="Add to Wishlist"
                >
                  <Heart
                    size={20}
                    fill={isInWishlist(inspectedSaree.id) ? '#8B202F' : 'none'}
                    color={isInWishlist(inspectedSaree.id) ? '#8B202F' : '#333333'}
                  />
                </button>
              </div>

              {/* Full Details Link */}
              <Link to={`/product/${inspectedSaree.slug}`} className="inspector-detail-link">
                View Full Product Specifications →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Section CTA */}
      <div className="saree-rail-footer">
        <SriLakshmiButton
          to="/shop"
          variant="primary"
          size="lg"
        >
          Explore Full Collection
        </SriLakshmiButton>
      </div>
    </section>
  );
};

export default SareeRail;
