import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import './murmuration-wordmark.css';

export interface MurmurationWordmarkProps {
  /** Optional callback fired when intro finishes its sequence or user skips */
  onComplete?: () => void;
  /** Primary brand text line 1 (default: 'SRI LAKSHMI') */
  textLine1?: string;
  /** Secondary brand text line 2 (default: 'SAREES') */
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
  goldShine: boolean;
}

// Ease out cubic
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * MurmurationWordmark
 * Cinematic opening introduction overlay for Sri Lakshmi Sarees.
 * Thousands of birds murmurate organically in free flight before converging
 * into the luxury two-line brand wordmark "SRI LAKSHMI SAREES".
 */
export const MurmurationWordmark: React.FC<MurmurationWordmarkProps> = ({
  onComplete,
  textLine1 = 'SRI LAKSHMI',
  textLine2 = 'SAREES',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const animFrameIdRef = useRef<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isCompletedRef = useRef<boolean>(false);

  // Safe trigger for completion
  const handleFinish = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    // Set session storage flag so it won't replay on page navigation
    try {
      sessionStorage.setItem('sriLakshmiIntroSeen', 'true');
    } catch {
      // Ignore in strict private mode
    }

    setIsExiting(true);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 750);
    timersRef.current.push(timer);
  }, [onComplete]);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(media.matches);

    if (media.matches) {
      // Short display for reduced motion, then finish
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
    // Responsive bird counts
    const BIRD_COUNT = isMobile ? 850 : 2400;

    // Palette: Deep Ink Burgundy, Royal Crimson, Antique Gold, Warm Ivory
    const PALETTE = [
      '#1C070D',
      '#3D0916',
      '#6A1024',
      '#C5A059',
      '#E6CA65',
      '#FAF8F5',
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

      // Line 1 Font: Serif Royal
      const line1Size = Math.round(isMobile ? Math.min(w * 0.11, 40) : Math.min(w * 0.076, 76));
      octx.font = `600 ${line1Size}px "Playfair Display", Georgia, serif`;
      octx.fillStyle = '#FFFFFF';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';

      // Line 2 Font: Wide Spaced Sans
      const line2Size = Math.round(isMobile ? Math.min(w * 0.055, 20) : Math.min(w * 0.038, 38));
      const lineGap = line1Size * 0.62;

      const totalH = line1Size + lineGap + line2Size;
      const centerY = h * 0.47;
      const line1Y = centerY - totalH / 2 + line1Size / 2;
      const line2Y = line1Y + line1Size / 2 + lineGap + line2Size / 2;

      // Draw Line 1 with manual tracking
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
      drawTrackedText(octx, textLine1, w / 2, line1Y, isMobile ? 3 : 7);

      // Draw Line 2: SAREES
      octx.font = `600 ${line2Size}px "Plus Jakarta Sans", system-ui, sans-serif`;
      drawTrackedText(octx, textLine2, w / 2, line2Y, isMobile ? 6 : 14);

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
    const spawnCenterY = height * 0.45;

    for (let i = 0; i < BIRD_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Math.min(width, height) * 0.45;
      const target = targets[i] || { x: spawnCenterX, y: spawnCenterY };

      // Distribute luxury colors
      const isGold = i % 5 === 0 || i % 7 === 0;
      const color = isGold
        ? PALETTE[3 + (i % 3)] // Antique gold / warm ivory
        : PALETTE[i % 3]; // Deep burgundy inks

      birds.push({
        x: spawnCenterX + Math.cos(angle) * radius,
        y: spawnCenterY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        targetX: target.x,
        targetY: target.y,
        hasTarget: true,
        size: isMobile ? 1.8 + Math.random() * 1.2 : 2.2 + Math.random() * 1.6,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.16 + Math.random() * 0.12,
        maxSpeed: 4.5 + Math.random() * 2.5,
        color,
        goldShine: isGold,
      });
    }

    // 3. Animation Timeline (Seconds)
    const startTime = performance.now();
    const FREE_FLIGHT_DURATION = 2.2; // Organic flocking
    const CONVERGE_DURATION = 2.0; // Birds form the words
    const HOLD_DURATION = 1.8; // Hold completed wordmark
    const TOTAL_SEQUENCE_TIME = FREE_FLIGHT_DURATION + CONVERGE_DURATION + HOLD_DURATION; // ~6.0s

    let isRunning = true;

    // Draw single bird silhouette (V-wing in flight)
    const drawBird = (
      bctx: CanvasRenderingContext2D,
      bird: Bird,
      formationWeight: number
    ) => {
      const { x, y, vx, vy, size, wingPhase, color, goldShine } = bird;

      // Heading angle from velocity
      const heading = Math.atan2(vy, vx);
      const wingSpan = size * (1.6 + formationWeight * 0.4);
      const flap = Math.sin(wingPhase) * (size * 0.95);

      bctx.save();
      bctx.translate(x, y);
      bctx.rotate(heading);

      bctx.fillStyle = formationWeight > 0.5 && goldShine ? '#E6CA65' : color;
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

      // Clear Canvas with subtle fade trail
      ctx.clearRect(0, 0, width, height);

      // Determine Formation Progress (0 to 1)
      let formationProgress = 0;
      if (elapsed > FREE_FLIGHT_DURATION) {
        formationProgress = Math.min(1, (elapsed - FREE_FLIGHT_DURATION) / CONVERGE_DURATION);
      }
      const formationWeight = easeOutCubic(formationProgress);

      // Flocking flow field forces
      const time = elapsed * 1.5;
      const swirlX = Math.cos(time * 0.4) * width * 0.15;
      const swirlY = Math.sin(time * 0.5) * height * 0.12;

      // Update & Draw Each Bird
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i];
        b.wingPhase += b.wingSpeed;

        if (formationWeight < 0.98) {
          // Free Flight Physics (Organic Murmuration Swirl)
          const angle =
            Math.sin(b.x * 0.003 + time * 0.5) * Math.cos(b.y * 0.003 + time * 0.4) * Math.PI * 2;
          const flowForceX = Math.cos(angle) * 0.35;
          const flowForceY = Math.sin(angle) * 0.35;

          // Pull towards dynamic flock center
          const dxToCenter = (spawnCenterX + swirlX) - b.x;
          const dyToCenter = (spawnCenterY + swirlY) - b.y;
          const distToCenter = Math.hypot(dxToCenter, dyToCenter) + 0.1;
          const centerPull = 0.08;

          b.vx += flowForceX + (dxToCenter / distToCenter) * centerPull;
          b.vy += flowForceY + (dyToCenter / distToCenter) * centerPull;
        }

        // Target Attraction Force (Ramps up during converge phase)
        if (formationWeight > 0.01) {
          const dx = b.targetX - b.x;
          const dy = b.targetY - b.y;
          const dist = Math.hypot(dx, dy);

          // Spring force towards letter target
          const springStrength = 0.065 * formationWeight;
          b.vx += dx * springStrength;
          b.vy += dy * springStrength;

          // Higher damping when approaching wordmark for crisp lock
          const damping = 0.88 - formationWeight * 0.08;
          b.vx *= damping;
          b.vy *= damping;

          // Subtle alive micro-flutter even when settled
          if (formationWeight > 0.95) {
            b.x = b.targetX + Math.sin(b.wingPhase) * 0.45;
            b.y = b.targetY + Math.cos(b.wingPhase) * 0.35;
          }
        } else {
          // Normal flight damping & speed clamp
          b.vx *= 0.96;
          b.vy *= 0.96;
          const currentSpeed = Math.hypot(b.vx, b.vy);
          if (currentSpeed > b.maxSpeed) {
            b.vx = (b.vx / currentSpeed) * b.maxSpeed;
            b.vy = (b.vy / currentSpeed) * b.maxSpeed;
          }
        }

        // Apply velocity
        if (formationWeight < 0.95) {
          b.x += b.vx;
          b.y += b.vy;
        }

        // Boundary wrap during free flight
        if (formationWeight < 0.2) {
          if (b.x < -40) b.x = width + 40;
          if (b.x > width + 40) b.x = -40;
          if (b.y < -40) b.y = height + 40;
          if (b.y > height + 40) b.y = -40;
        }

        drawBird(ctx, b, formationWeight);
      }

      // Add radiant gold sheen over formed wordmark during hold phase
      if (formationWeight > 0.75) {
        const glowOpacity = Math.min(0.45, (formationWeight - 0.75) * 1.8);
        ctx.save();
        const radGrad = ctx.createRadialGradient(
          width / 2,
          height * 0.47,
          20,
          width / 2,
          height * 0.47,
          width * 0.4
        );
        radGrad.addColorStop(0, `rgba(230, 202, 101, ${glowOpacity * 0.35})`);
        radGrad.addColorStop(0.5, `rgba(197, 160, 89, ${glowOpacity * 0.15})`);
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // Check if sequence completed
      if (elapsed >= TOTAL_SEQUENCE_TIME) {
        handleFinish();
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
  }, [isReducedMotion, handleFinish, textLine1, textLine2]);

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
    >
      {/* Ambient Backdrop Sheen */}
      <div className="murmuration-backdrop-glow" aria-hidden="true" />

      {/* Cinematic Film Grain Overlay */}
      <div className="murmuration-film-grain" aria-hidden="true" />

      {/* Subtle Top Crest Eyebrow */}
      <div className="murmuration-top-crest" aria-hidden="true">
        <span>HERITAGE ATELIER</span>
        <span className="murmuration-crest-dot">✦</span>
        <span>ESTD 1984</span>
      </div>

      {/* Flocking Canvas or Reduced Motion Fallback */}
      {!isReducedMotion ? (
        <canvas ref={canvasRef} className="murmuration-canvas" />
      ) : (
        <div className="murmuration-reduced-content">
          <div className="murmuration-reduced-line1">{textLine1}</div>
          <div className="murmuration-reduced-line2">{textLine2}</div>
        </div>
      )}

      {/* Accessible Skip Button */}
      <button
        type="button"
        className="murmuration-skip-btn"
        onClick={handleFinish}
        aria-label="Skip cinematic introduction"
      >
        <span>Skip Intro</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default MurmurationWordmark;

