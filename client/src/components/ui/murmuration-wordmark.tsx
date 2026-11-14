import React, { useEffect, useRef, useState, useCallback } from 'react';
import './murmuration-wordmark.css';

export interface MurmurationPalette {
  skyTop?: string;
  skyLow?: string;
  sun?: string;
  ink?: string;
}

export interface MurmurationWordmarkProps {
  /** Optional callback fired when intro finishes its sequence or user skips */
  onComplete?: () => void;
  /** Full brand phrase (default: 'SRI LAKSHMI SAREES') */
  word?: string;
  /** Color palette configuration for monochromatic styling */
  palette?: MurmurationPalette;
  /** Whether to show landscape reeds (default: false) */
  reeds?: boolean;
  /** Whether mouse/touch interaction affects flock (default: false) */
  interactive?: boolean;
  /** Optional override for line 1 text (default: 'SRI LAKSHMI') */
  textLine1?: string;
  /** Optional override for line 2 text (default: 'SAREES') */
  textLine2?: string;
}

interface Bird {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  hasTarget: boolean;
  size: number;
  wingPhase: number;
  wingSpeed: number;
  maxSpeed: number;
  color: string;
  scatterVx: number;
  scatterVy: number;
}

// Cubic ease out
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
// Quad ease in
const easeInQuad = (t: number): number => t * t;

/**
 * MurmurationWordmark
 * Clean, cinematic monochrome opening introduction overlay for Sri Lakshmi Sarees.
 * Thousands of pure white birds (#FFFFFF / #F5F5F5) fly in organic murmuration
 * against an obsidian black background (#000000), converge dramatically into
 * "SRI LAKSHMI SAREES", hold the formation, and smoothly scatter into the website.
 */
export const MurmurationWordmark: React.FC<MurmurationWordmarkProps> = ({
  onComplete,
  word = 'SRI LAKSHMI SAREES',
  palette = {
    skyTop: '#000000',
    skyLow: '#000000',
    sun: '#000000',
    ink: '#F5F5F5',
  },
  reeds = false,
  interactive = false,
  textLine1,
  textLine2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const animFrameIdRef = useRef<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isCompletedRef = useRef<boolean>(false);

  // Derive lines from word or explicit overrides
  const resolvedLine1 = textLine1 || (word === 'SRI LAKSHMI SAREES' ? 'SRI LAKSHMI' : word.split(' ').slice(0, 2).join(' '));
  const resolvedLine2 = textLine2 || (word === 'SRI LAKSHMI SAREES' ? 'SAREES' : word.split(' ').slice(2).join(' '));

  // Safe trigger for completion
  const handleFinish = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    try {
      sessionStorage.setItem('sriLakshmiIntroSeen', 'true');
    } catch {
      // Ignore in strict private mode
    }

    setIsExiting(true);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 800);
    timersRef.current.push(timer);
  }, [onComplete]);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(media.matches);

    if (media.matches) {
      const t = setTimeout(() => {
        handleFinish();
      }, 1600);
      timersRef.current.push(t);
    }
  }, [handleFinish]);

  // Main Canvas Murmuration Animation
  useEffect(() => {
    if (isReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const isMobile = width < 768;
    // Responsive bird counts for high density & smooth 60fps
    const BIRD_COUNT = isMobile ? 850 : 2400;

    // Premium Monochrome White Palette
    const baseInk = palette.ink || '#F5F5F5';
    const WHITE_PALETTE = [
      '#FFFFFF',
      '#FDFDFD',
      '#F8F8F8',
      baseInk,
      '#ECECEC',
      '#E5E5E5',
    ];

    // 1. Text Target Sampling for Two Lines: "SRI LAKSHMI" & "SAREES"
    const sampleTextTargets = (w: number, h: number, count: number): { x: number; y: number }[] => {
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const octx = offscreen.getContext('2d');
      if (!octx) return [];

      octx.fillStyle = '#000000';
      octx.fillRect(0, 0, w, h);

      // Line 1 Font: Bold Serif Royal
      const line1Size = Math.round(isMobile ? Math.min(w * 0.115, 46) : Math.min(w * 0.082, 84));
      octx.font = `700 ${line1Size}px "Playfair Display", Georgia, serif`;
      octx.fillStyle = '#FFFFFF';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';

      // Line 2 Font: Wide Spaced Modern Sans
      const line2Size = Math.round(isMobile ? Math.min(w * 0.058, 22) : Math.min(w * 0.042, 42));
      const lineGap = line1Size * 0.58;

      const totalH = line1Size + lineGap + line2Size;
      const centerY = h * 0.48;
      const line1Y = centerY - totalH / 2 + line1Size / 2;
      const line2Y = line1Y + line1Size / 2 + lineGap + line2Size / 2;

      // Draw Line 1 with tracking
      const drawTrackedText = (
        context: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        spacing: number
      ) => {
        const letters = text.split('');
        let totalWidth = 0;
        const letterWidths = letters.map((l) => {
          const lw = context.measureText(l).width;
          totalWidth += lw + spacing;
          return lw;
        });
        totalWidth -= spacing;

        let startX = x - totalWidth / 2;
        letters.forEach((l, idx) => {
          context.fillText(l, startX + letterWidths[idx] / 2, y);
          startX += letterWidths[idx] + spacing;
        });
      };

      // Draw Line 1: SRI LAKSHMI
      drawTrackedText(octx, resolvedLine1, w / 2, line1Y, isMobile ? 3 : 8);

      // Draw Line 2: SAREES
      octx.font = `600 ${line2Size}px "Plus Jakarta Sans", system-ui, sans-serif`;
      drawTrackedText(octx, resolvedLine2, w / 2, line2Y, isMobile ? 8 : 18);

      // Sample pixels
      const imgData = octx.getImageData(0, 0, w, h).data;
      const candidates: { x: number; y: number }[] = [];
      const step = isMobile ? 2 : 3;

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const index = (y * w + x) * 4;
          if (imgData[index] > 128) {
            candidates.push({ x, y });
          }
        }
      }

      if (candidates.length === 0) return [];

      // Evenly distribute points among birds
      const targets: { x: number; y: number }[] = [];
      const stride = candidates.length / count;
      for (let i = 0; i < count; i++) {
        const idx = Math.floor((i * stride) % candidates.length);
        targets.push({
          x: candidates[idx].x + (Math.random() - 0.5) * 1.5,
          y: candidates[idx].y + (Math.random() - 0.5) * 1.5,
        });
      }

      return targets;
    };

    let targets = sampleTextTargets(width, height, BIRD_COUNT);

    // 2. Initialize Bird Flock
    const birds: Bird[] = [];
    const spawnCenterX = width * 0.5;
    const spawnCenterY = height * 0.48;

    for (let i = 0; i < BIRD_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Math.min(width, height) * 0.45;
      const target = targets[i] || { x: spawnCenterX, y: spawnCenterY };

      // Outward angle for dispersion
      const scatterAngle = Math.atan2(target.y - spawnCenterY, target.x - spawnCenterX) + (Math.random() - 0.5) * 0.8;
      const scatterSpd = 5.5 + Math.random() * 7.5;

      birds.push({
        x: spawnCenterX + Math.cos(angle) * radius,
        y: spawnCenterY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 4.5,
        vy: (Math.random() - 0.5) * 4.5,
        targetX: target.x,
        targetY: target.y,
        hasTarget: true,
        size: isMobile ? 1.8 + Math.random() * 1.2 : 2.2 + Math.random() * 1.6,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.16 + Math.random() * 0.12,
        maxSpeed: 4.8 + Math.random() * 2.5,
        color: WHITE_PALETTE[i % WHITE_PALETTE.length],
        scatterVx: Math.cos(scatterAngle) * scatterSpd,
        scatterVy: Math.sin(scatterAngle) * scatterSpd,
      });
    }

    // 3. Animation Timeline (Seconds)
    // 0.0s - 2.0s: Free Flight swirling across the black screen
    // 2.0s - 4.0s: Dramatic convergence into "SRI LAKSHMI SAREES"
    // 4.0s - 5.6s: Hold brand name clearly and boldly
    // 5.6s - 6.8s: Smooth scatter / dispersion into distance
    // 6.8s+: Smooth fade exit into the website
    const startTime = performance.now();
    const FREE_FLIGHT_DURATION = 2.0;
    const CONVERGE_DURATION = 2.0;
    const HOLD_DURATION = 1.6;
    const SCATTER_DURATION = 1.2;
    const SCATTER_START = FREE_FLIGHT_DURATION + CONVERGE_DURATION + HOLD_DURATION; // 5.6s
    const TOTAL_SEQUENCE_TIME = SCATTER_START + SCATTER_DURATION; // 6.8s

    let isRunning = true;
    let hasTriggeredFinish = false;

    // Draw single pure white bird silhouette (V-wing in flight)
    const drawBird = (
      bctx: CanvasRenderingContext2D,
      bird: Bird,
      formationWeight: number
    ) => {
      const { x, y, vx, vy, size, wingPhase, color } = bird;

      const heading = Math.atan2(vy, vx);
      const wingSpan = size * (1.6 + formationWeight * 0.35);
      const flap = Math.sin(wingPhase) * (size * 0.95);

      bctx.save();
      bctx.translate(x, y);
      bctx.rotate(heading);

      // Pure white with high contrast against black
      bctx.fillStyle = formationWeight > 0.7 ? '#FFFFFF' : color;
      bctx.beginPath();
      // Left Wing
      bctx.moveTo(-size * 0.6, 0);
      bctx.quadraticCurveTo(0, flap * 0.5, wingSpan, flap);
      // Center Body
      bctx.lineTo(size * 0.8, 0);
      // Right Wing
      bctx.lineTo(wingSpan, -flap);
      bctx.quadraticCurveTo(0, -flap * 0.5, -size * 0.6, 0);
      bctx.closePath();
      bctx.fill();

      bctx.restore();
    };

    // 4. Main Render Loop
    const loop = (now: number) => {
      if (!isRunning) return;

      const elapsed = (now - startTime) / 1000;

      // Clean, deep monochrome black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Determine Timeline State
      const isFreeFlight = elapsed < FREE_FLIGHT_DURATION;
      const isConverging = elapsed >= FREE_FLIGHT_DURATION && elapsed < (FREE_FLIGHT_DURATION + CONVERGE_DURATION);
      const isHolding = elapsed >= (FREE_FLIGHT_DURATION + CONVERGE_DURATION) && elapsed < SCATTER_START;
      const isScattering = elapsed >= SCATTER_START;

      let formationProgress = 0;
      if (isConverging) {
        formationProgress = Math.min(1, (elapsed - FREE_FLIGHT_DURATION) / CONVERGE_DURATION);
      } else if (isHolding) {
        formationProgress = 1;
      } else if (isScattering) {
        formationProgress = Math.max(0, 1 - (elapsed - SCATTER_START) / 0.35);
      }
      const formationWeight = easeOutCubic(formationProgress);

      const scatterProgress = isScattering
        ? Math.min(1, (elapsed - SCATTER_START) / SCATTER_DURATION)
        : 0;

      // Flocking flow field forces during free flight
      const time = elapsed * 1.5;
      const swirlX = Math.cos(time * 0.4) * width * 0.16;
      const swirlY = Math.sin(time * 0.5) * height * 0.13;

      // Update & Draw Each Bird
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i];
        b.wingPhase += isScattering ? 0.28 : b.wingSpeed;

        if (isScattering) {
          // Phase 4: Smooth Scatter / Dispersal Outward
          const scatterEase = easeInQuad(scatterProgress);
          b.vx += b.scatterVx * (0.08 + scatterEase * 0.15);
          b.vy += b.scatterVy * (0.08 + scatterEase * 0.15);
          b.x += b.vx;
          b.y += b.vy;
        } else if (formationWeight < 0.98) {
          // Phase 1: Free Flight Swirl Currents
          const angle =
            Math.sin(b.x * 0.003 + time * 0.5) * Math.cos(b.y * 0.003 + time * 0.4) * Math.PI * 2;
          const flowForceX = Math.cos(angle) * 0.38;
          const flowForceY = Math.sin(angle) * 0.38;

          const dxToCenter = (spawnCenterX + swirlX) - b.x;
          const dyToCenter = (spawnCenterY + swirlY) - b.y;
          const distToCenter = Math.hypot(dxToCenter, dyToCenter) + 0.1;
          const centerPull = 0.085;

          b.vx += flowForceX + (dxToCenter / distToCenter) * centerPull;
          b.vy += flowForceY + (dyToCenter / distToCenter) * centerPull;
        }

        // Target Attraction Force (Ramps up during converge phase)
        if (!isScattering && formationWeight > 0.01) {
          const dx = b.targetX - b.x;
          const dy = b.targetY - b.y;

          // Magnetic attraction towards letter targets
          const springStrength = 0.075 * formationWeight;
          b.vx += dx * springStrength;
          b.vy += dy * springStrength;

          // Damping for crisp wordmark lock
          const damping = 0.86 - formationWeight * 0.09;
          b.vx *= damping;
          b.vy *= damping;

          // Subtle living micro-flutter during hold phase
          if (formationWeight > 0.95) {
            b.x = b.targetX + Math.sin(b.wingPhase) * 0.45;
            b.y = b.targetY + Math.cos(b.wingPhase) * 0.35;
          }
        } else if (!isScattering) {
          // Normal free flight damping
          b.vx *= 0.96;
          b.vy *= 0.96;
          const currentSpeed = Math.hypot(b.vx, b.vy);
          if (currentSpeed > b.maxSpeed) {
            b.vx = (b.vx / currentSpeed) * b.maxSpeed;
            b.vy = (b.vy / currentSpeed) * b.maxSpeed;
          }
        }

        // Apply velocity when not firmly locked
        if (!isHolding) {
          b.x += b.vx;
          b.y += b.vy;
        }

        // Boundary wrap during early free flight only
        if (formationWeight < 0.2 && !isScattering) {
          if (b.x < -40) b.x = width + 40;
          if (b.x > width + 40) b.x = -40;
          if (b.y < -40) b.y = height + 40;
          if (b.y > height + 40) b.y = -40;
        }

        drawBird(ctx, b, formationWeight);
      }

      // Smooth trigger for exit fade during scatter phase
      if (isScattering && scatterProgress > 0.45 && !hasTriggeredFinish) {
        hasTriggeredFinish = true;
        handleFinish();
      }

      // Check if sequence completed
      if (elapsed >= TOTAL_SEQUENCE_TIME) {
        if (!hasTriggeredFinish) handleFinish();
      } else {
        animFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    // Resize Handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      targets = sampleTextTargets(width, height, BIRD_COUNT);
      birds.forEach((b, i) => {
        if (targets[i]) {
          b.targetX = targets[i].x;
          b.targetY = targets[i].y;
        }
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isReducedMotion, handleFinish, resolvedLine1, resolvedLine2, palette]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`murmuration-intro-overlay ${isExiting ? 'is-exiting' : ''}`}
      role="region"
      aria-label="Sri Lakshmi Sarees Opening Introduction"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Cinematic Monochrome Film Grain Overlay */}
      <div className="murmuration-film-grain" aria-hidden="true" />

      {/* Flocking Canvas or Reduced Motion Fallback */}
      {!isReducedMotion ? (
        <canvas ref={canvasRef} className="murmuration-canvas" />
      ) : (
        <div className="murmuration-reduced-content">
          <div className="murmuration-reduced-line1">{resolvedLine1}</div>
          <div className="murmuration-reduced-line2">{resolvedLine2}</div>
        </div>
      )}
    </div>
  );
};

export default MurmurationWordmark;
