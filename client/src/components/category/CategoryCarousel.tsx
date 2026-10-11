import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import './CategoryCarousel.css';

export interface CategoryItem {
  title: string;
  count: string;
  img: string;
  link: string;
}

interface CategoryCarouselProps {
  categories: CategoryItem[];
}

const CLONE_SETS = 5; // 5 repetitions for seamless infinite sliding buffer
const DEFAULT_AUTO_PLAY_MS = 4500;

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ categories }) => {
  const N = categories.length;
  const BASE_INDEX = 2 * N; // Start in the middle set (index 12 for 6 items)

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const [currentIndex, setCurrentIndex] = useState<number>(BASE_INDEX);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  // Gesture refs
  const isPointerDown = useRef<boolean>(false);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const currentDrag = useRef<number>(0);
  const isSwipingHorizontal = useRef<boolean>(false);
  const hasMovedSignificantDistance = useRef<boolean>(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Responsive container width measurement
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Determine visible cards count based on measured container width
  const getVisibleCards = (width: number): number => {
    if (width >= 1260) return 6;      // Desktop wide: all 6 cards visible
    if (width >= 1024) return 4.2;    // Narrow desktop: 4 full cards + peek
    if (width >= 768) return 3.2;     // Tablet: 3 full cards + peek
    if (width >= 600) return 2.25;    // Small tablet: 2 full cards + peek
    if (width >= 440) return 1.5;     // Large mobile: 1.5 cards
    if (width >= 360) return 1.35;    // Standard mobile (iPhone): 1.35 cards
    return 1.25;                      // Small mobile (320px): 1.25 cards
  };

  const visibleCards = getVisibleCards(containerWidth);
  const gap = containerWidth >= 1024 ? 18 : containerWidth >= 640 ? 14 : 12;

  // Exact card width calculation so that visible cards and gaps fit containerWidth precisely
  const fullGaps = Math.max(0, Math.floor(visibleCards - 0.001));
  const cardWidth = Math.max(160, (containerWidth - fullGaps * gap) / visibleCards);
  const cardStep = cardWidth + gap;

  // Seamless infinite clones array
  const extendedCategories: CategoryItem[] = [];
  for (let s = 0; s < CLONE_SETS; s++) {
    extendedCategories.push(...categories);
  }

  // Navigation handlers
  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, []);

  // Handle seamless index normalization at transition boundaries
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== trackRef.current || e.propertyName !== 'transform') return;

    if (currentIndex >= 3 * N || currentIndex < 2 * N) {
      const activeCatIdx = ((currentIndex % N) + N) % N;
      const targetNormalizedIndex = activeCatIdx + BASE_INDEX;

      // Instantly normalize index without animation
      setIsTransitioning(false);
      setCurrentIndex(targetNormalizedIndex);
    }
  };

  // Re-enable transition after instantaneous normalization
  useEffect(() => {
    if (!isTransitioning) {
      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [isTransitioning]);

  // Autoplay timer
  useEffect(() => {
    if (isReducedMotion || isHovered || isFocused || isPointerDown.current) {
      return;
    }

    const intervalId = setInterval(() => {
      handleNext();
    }, DEFAULT_AUTO_PLAY_MS);

    return () => clearInterval(intervalId);
  }, [isReducedMotion, isHovered, isFocused, handleNext]);

  // Pointer / Drag / Swipe handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left mouse button / primary touch only
    isPointerDown.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    currentDrag.current = 0;
    isSwipingHorizontal.current = false;
    hasMovedSignificantDistance.current = false;
    setIsTransitioning(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;

    if (!isSwipingHorizontal.current) {
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isSwipingHorizontal.current = true;
        hasMovedSignificantDistance.current = true;
      } else if (Math.abs(deltaY) > 8) {
        // User scrolling vertically, release carousel drag
        isPointerDown.current = false;
        setIsTransitioning(true);
        setDragOffset(0);
        return;
      }
    }

    if (isSwipingHorizontal.current) {
      hasMovedSignificantDistance.current = true;
      currentDrag.current = deltaX;
      setDragOffset(deltaX);
    }
  };

  const handlePointerUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;

    const offset = currentDrag.current;
    setIsTransitioning(true);
    setDragOffset(0);

    if (isSwipingHorizontal.current) {
      const threshold = Math.min(cardWidth * 0.18, 48);
      if (offset < -threshold) {
        const count = Math.max(1, Math.round(-offset / cardStep));
        setCurrentIndex((prev) => prev + count);
      } else if (offset > threshold) {
        const count = Math.max(1, Math.round(offset / cardStep));
        setCurrentIndex((prev) => prev - count);
      }
    }

    isSwipingHorizontal.current = false;

    // Prevent accidental link clicking immediately following a drag
    setTimeout(() => {
      hasMovedSignificantDistance.current = false;
    }, 120);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (hasMovedSignificantDistance.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Pagination navigation
  const activeCategoryIndex = ((currentIndex % N) + N) % N;

  const handleDotClick = (targetCatIndex: number) => {
    let diff = targetCatIndex - activeCategoryIndex;
    if (diff > N / 2) diff -= N;
    if (diff < -N / 2) diff += N;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + diff);
  };

  const translateX = -(currentIndex * cardStep) + dragOffset;

  return (
    <div
      className="category-carousel-container"
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      role="region"
      aria-roledescription="carousel"
      aria-label="Saree Category Carousel"
      tabIndex={0}
    >
      {/* Subtle Navigation Arrow: Previous */}
      <button
        type="button"
        className="category-carousel-arrow category-carousel-arrow-prev"
        onClick={handlePrev}
        aria-label="Previous saree categories"
        title="Previous categories"
      >
        <ChevronLeft size={22} />
      </button>

      {/* Subtle Navigation Arrow: Next */}
      <button
        type="button"
        className="category-carousel-arrow category-carousel-arrow-next"
        onClick={handleNext}
        aria-label="Next saree categories"
        title="Next categories"
      >
        <ChevronRight size={22} />
      </button>

      {/* Carousel Viewport */}
      <div
        className="category-carousel-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          ref={trackRef}
          className="category-carousel-track"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translate3d(${translateX}px, 0, 0)`,
            transition:
              isTransitioning && !isReducedMotion
                ? 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)'
                : 'none',
            gap: `${gap}px`,
          }}
        >
          {extendedCategories.map((cat, idx) => {
            const originalCatIdx = idx % N;
            const isSlideActive = originalCatIdx === activeCategoryIndex;

            return (
              <Link
                key={idx}
                to={cat.link}
                onClick={handleCardClick}
                className={`category-card ${isSlideActive ? 'category-card-active' : ''}`}
                style={{
                  width: `${cardWidth}px`,
                }}
                tabIndex={0}
                aria-label={`Category: ${cat.title}, ${cat.count}`}
              >
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="category-card-img"
                  draggable={false}
                  loading="eager"
                />
                <div className="category-card-overlay">
                  <span className="category-card-count">
                    {cat.count}
                  </span>
                  <h3 className="category-card-title">
                    {cat.title}
                  </h3>
                  <div className="category-card-cta">
                    Explore Category <ArrowRight size={14} className="category-card-cta-icon" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Subtle Position Indicator / Pagination Dots */}
      <div className="category-carousel-pagination" role="tablist" aria-label="Category Slides">
        {categories.map((cat, idx) => {
          const isActive = idx === activeCategoryIndex;
          return (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to ${cat.title}`}
              className={`category-carousel-dot ${isActive ? 'active' : ''}`}
              onClick={() => handleDotClick(idx)}
              title={cat.title}
            />
          );
        })}
      </div>
    </div>
  );
};
