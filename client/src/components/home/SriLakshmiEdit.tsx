import * as React from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, X, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { INITIAL_PRODUCTS } from '../../services/api';
import './SriLakshmiEdit.css';

export interface SareeRailItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  fabric: string;
  color: string;
  image: string;
  tag: string;
  details: string[];
}

export interface SriLakshmiEditProps {
  products?: Product[];
}

const VB_W = 200;
const VB_H = 310;
const ASPECT = VB_W / VB_H;
const HOOK_TOP = 4;
const RAIL_R = 4.6;
const REST = -70;
const PERSPECTIVE = 1100;
const GAP = 0.035;
const MAX_H = 400;
const MIN_WIDE_H = 200;
const CAROUSEL_H = 340;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lambert(angle: number) {
  const r = (angle * Math.PI) / 180;
  const diffuse = Math.max(0, Math.sin(r) * 0.42 + Math.cos(r) * 0.91);
  return 0.66 + 0.34 * diffuse;
}

function footprint(h: number, angle: number, sideW = 0.38) {
  const e = clamp(1 - angle / REST, 0, 1);
  const ease = e * e * (3 - 2 * e);
  return h * ASPECT * (sideW + (0.94 - sideW) * ease);
}

const HOOK = "M100,36 L100,-0.4 C100,-3.4 102.2,-4.2 103.9,-2.8 C104.9,-2 105.4,-1.2 105.6,-0.2";
const HOOK_HI = "M99.5,30 L99.5,-0.2 C99.5,-2.4 101,-3.2 102.4,-2.6";
const BAR = "M32,58 Q66,37 100,35 Q134,37 168,58";
const BAR_HI = "M34,55.5 Q67,34.5 100,32.5 Q133,34.5 166,55.5";

function Defs({ uid }: { uid: string }) {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute" focusable="false" style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <linearGradient id={`${uid}-brass`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#C5A059" />
          <stop offset="0.3" stopColor="#FFF2D6" />
          <stop offset="0.6" stopColor="#C5A059" />
          <stop offset="1" stopColor="#7E5F20" />
        </linearGradient>
        <linearGradient id={`${uid}-gold-bar`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FAF0D7" />
          <stop offset="0.35" stopColor="#D4AF37" />
          <stop offset="0.75" stopColor="#A47E3B" />
          <stop offset="1" stopColor="#4A340E" />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-20%" y="-5%" width="140%" height="110%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>
    </svg>
  );
}

function Hook({ uid }: { uid: string }) {
  return (
    <>
      <path d={HOOK} fill="none" stroke="black" strokeOpacity="0.28" strokeWidth="3.4" strokeLinecap="round" transform="translate(0.9 1.1)" />
      <path d={HOOK} fill="none" stroke={`url(#${uid}-brass)`} strokeWidth="2.8" strokeLinecap="round" />
      <path d={HOOK_HI} fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="105.9" cy="0.6" rx="1.9" ry="0.9" fill="#7E5F20" />
      <rect x="96" y="27" width="8" height="9" rx="2" fill={`url(#${uid}-brass)`} />
      <rect x="97.2" y="28.2" width="2" height="6.6" rx="1" fill="#FFFFFF" fillOpacity="0.6" />
    </>
  );
}

function SareeHanger({ uid }: { uid: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMin meet"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
    >
      <path d={BAR} fill="none" stroke="black" strokeOpacity="0.22" strokeWidth="9.5" strokeLinecap="round" transform="translate(0.6 1.6)" />
      <path d={BAR} fill="none" stroke={`url(#${uid}-gold-bar)`} strokeWidth="8" strokeLinecap="round" />
      <path d={BAR_HI} fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="32" cy="58" r="4.2" fill={`url(#${uid}-brass)`} />
      <circle cx="168" cy="58" r="4.2" fill={`url(#${uid}-brass)`} />
      <Hook uid={uid} />
    </svg>
  );
}

type Sim = {
  x: number[];
  vx: number[];
  tx: number[];
  px: number[];
  turn: number[];
  vturn: number[];
  tturn: number[];
  swing: number[];
  vswing: number[];
  tag: number[];
  vtag: number[];
  drag: number;
  grab: number;
  free: number;
  last: number;
  raf: number;
};

function emptySim(): Sim {
  return {
    x: [],
    vx: [],
    tx: [],
    px: [],
    turn: [],
    vturn: [],
    tturn: [],
    swing: [],
    vswing: [],
    tag: [],
    vtag: [],
    drag: -1,
    grab: 0,
    free: 0,
    last: 0,
    raf: 0,
  };
}

export const SriLakshmiEdit: React.FC<SriLakshmiEditProps> = ({ products = [] }) => {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const slots = React.useRef<(HTMLButtonElement | null)[]>([]);
  const swings = React.useRef<(HTMLSpanElement | null)[]>([]);
  const turns = React.useRef<(HTMLSpanElement | null)[]>([]);
  const shades = React.useRef<(HTMLSpanElement | null)[]>([]);
  const shadows = React.useRef<(HTMLSpanElement | null)[]>([]);
  const tags = React.useRef<(HTMLSpanElement | null)[]>([]);
  const sim = React.useRef<Sim>(emptySim());

  // Curate 5–7 REAL signature sarees from the store
  const items: SareeRailItem[] = React.useMemo(() => {
    const source = products && products.length > 0 ? products : INITIAL_PRODUCTS;
    const active = source.filter((p) => p.isActive !== false);
    const featured = active.filter((p) => p.isFeatured || p.isBestSeller || p.category.includes('Silk'));
    const pool = featured.length >= 6 ? featured : active;
    const selected = (pool.length >= 5 ? pool : INITIAL_PRODUCTS).slice(0, 7);

    return selected.map((p) => {
      const discount =
        p.originalPrice && p.originalPrice > p.price
          ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
          : p.discountPercentage || 0;

      const craft = p.fabric?.split(' ')[0] || p.category.replace(' Sarees', '');

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice,
        discountPercentage: discount,
        fabric: p.fabric || 'Pure Mulberry Silk',
        color: p.color || 'Royal Maroon & Gold',
        image: p.images && p.images.length > 0 ? p.images[0] : '/images/hero-banner.jpg',
        tag: `₹${p.price.toLocaleString('en-IN')}`,
        details: [
          craft,
          p.pattern ? p.pattern.slice(0, 32) : 'Traditional Zari Weave',
          p.occasion ? p.occasion.slice(0, 24) : 'Wedding & Celebrations',
          p.blouseIncluded ? 'Blouse Piece Included' : 'Running Blouse',
          'Pure Silk Certified',
        ],
      };
    });
  }, [products]);

  const count = items.length;

  const [size, setSize] = React.useState({ width: 0, h: 320, carousel: false });
  const [active, setActive] = React.useState<number | null>(null);
  const [focusIndex, setFocusIndex] = React.useState<number>(0);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [reduced, setReduced] = React.useState<boolean>(false);
  const [playing, setPlaying] = React.useState<boolean>(true);
  const [lifted, setLifted] = React.useState<number | null>(null);

  const returnFocus = React.useRef<number | null>(null);
  const pendingOpen = React.useRef<number>(-1);
  const pointer = React.useRef({
    id: -1,
    index: -1,
    x: 0,
    y: 0,
    t: 0,
    moved: false,
    kind: '',
    swipe: 0,
    lastX: 0,
    lastT: 0,
    v: 0,
  });

  const sideWidths = React.useMemo(() => items.map(() => 0.38), [items]);
  const live = React.useRef({
    active: null as number | null,
    size,
    reduced,
    count,
    openIndex: null as number | null,
    carouselIndex: 0,
    sideWidths,
  });
  live.current = { ...live.current, active, size, reduced, count, openIndex, sideWidths };

  const carouselIndex = size.carousel ? (active ?? live.current.carouselIndex) : null;

  // Reduced motion preference
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // Responsive stage measurement
  React.useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = (width: number) => {
      const sideW = live.current.sideWidths.reduce((sum, w) => sum + w, 0) / Math.max(1, live.current.sideWidths.length);
      const restK = footprint(1, REST, sideW) + GAP;
      const activeK = footprint(1, 0, sideW) + GAP;
      const fit = (width - 32) / (count * restK + (activeK - restK));
      const carousel = fit < MIN_WIDE_H;
      const h = carousel ? Math.min(CAROUSEL_H, Math.max(240, width * 0.85)) : Math.min(MAX_H, Math.max(260, fit));
      setSize((old) =>
        Math.abs(old.width - width) < 0.5 && old.carousel === carousel && Math.abs(old.h - h) < 0.5
          ? old
          : { width, h: Math.round(h), carousel }
      );
    };

    measure(stage.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const box = entries[0];
      if (box) measure(box.contentRect.width);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [count]);

  const targets = React.useCallback(
    (h: number, width: number, carousel: boolean, front: number | null) => {
      const feet = items.map((_, i) => footprint(h, i === front ? 0 : REST, sideWidths[i]) + h * GAP);
      if (carousel) {
        const centre = front ?? 0;
        const xs = feet.map(() => 0);
        xs[centre] = width / 2;
        for (let i = centre + 1; i < feet.length; i++) xs[i] = (xs[i - 1] ?? 0) + ((feet[i - 1] ?? 0) + (feet[i] ?? 0)) / 2;
        for (let i = centre - 1; i >= 0; i--) xs[i] = (xs[i + 1] ?? 0) - ((feet[i + 1] ?? 0) + (feet[i] ?? 0)) / 2;
        return xs;
      }
      const total = feet.reduce((sum, f) => sum + f, 0);
      let cursor = (width - total) / 2;
      return feet.map((f) => {
        const x = cursor + f / 2;
        cursor += f;
        return x;
      });
    },
    [items, sideWidths]
  );

  const paint = React.useCallback((i: number) => {
    const s = sim.current;
    const { h } = live.current.size;
    const w = h * ASPECT;
    const slot = slots.current[i];
    if (!slot) return;
    const angle = s.turn[i] ?? REST;
    const swing = s.swing[i] ?? 0;

    slot.style.transform = `translate3d(${((s.x[i] ?? 0) - w / 2).toFixed(2)}px,0,0)`;

    const sw = swings.current[i];
    if (sw) sw.style.transform = `rotate(${swing.toFixed(3)}deg)`;

    const tu = turns.current[i];
    if (tu) {
      tu.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${angle.toFixed(2)}deg)`;
    }

    const sh = shades.current[i];
    if (sh) {
      sh.style.setProperty('--shade', (1 - lambert(angle)).toFixed(3));
    }

    const shadow = shadows.current[i];
    if (shadow) {
      shadow.style.transform = `translate3d(${(w * 0.05).toFixed(1)}px, ${(h * 0.035).toFixed(1)}px, 0) scaleX(${Math.max(
        0.14,
        Math.abs(Math.cos((angle * Math.PI) / 180))
      ).toFixed(3)})`;
    }

    const tag = tags.current[i];
    if (tag) {
      tag.style.transform = `rotate(${(-10 + (s.tag[i] ?? 0)).toFixed(2)}deg)`;
    }
  }, []);

  const step = React.useCallback(
    (now: number) => {
      const s = sim.current;
      const n = live.current.count;
      const dt = s.last ? Math.min(0.034, (now - s.last) / 1000) : 1 / 60;
      s.last = now;
      const { h, width, carousel } = live.current.size;
      let busy = false;
      const sub = 2;
      const sdt = dt / sub;

      for (let k = 0; k < sub; k++) {
        for (let i = 0; i < n; i++) {
          const before = s.vx[i] ?? 0;
          if (i !== s.drag) {
            const restoring = now > s.free;
            const stiff = restoring ? 130 : 0;
            const damp = restoring ? 2 * Math.sqrt(130) * 0.86 : 3.2;
            const ax = -stiff * ((s.x[i] ?? 0) - (s.tx[i] ?? 0)) - damp * before;
            s.vx[i] = before + ax * sdt;
            s.x[i] = (s.x[i] ?? 0) + (s.vx[i] ?? 0) * sdt;
          }
          const accel = ((s.vx[i] ?? 0) - before) / sdt;
          const ta = -150 * ((s.turn[i] ?? 0) - (s.tturn[i] ?? 0)) - 2 * Math.sqrt(150) * 0.78 * (s.vturn[i] ?? 0);
          s.vturn[i] = (s.vturn[i] ?? 0) + ta * sdt;
          s.turn[i] = (s.turn[i] ?? 0) + (s.vturn[i] ?? 0) * sdt;

          const sa = -24 * (s.swing[i] ?? 0) - 2.1 * (s.vswing[i] ?? 0) - clamp(accel, -6000, 6000) * 0.0045;
          s.vswing[i] = (s.vswing[i] ?? 0) + sa * sdt;
          s.swing[i] = clamp((s.swing[i] ?? 0) + (s.vswing[i] ?? 0) * sdt, -12, 12);

          const tagA = -46 * ((s.tag[i] ?? 0) - (s.swing[i] ?? 0) * 0.6) - 3.4 * (s.vtag[i] ?? 0) - (s.vswing[i] ?? 0) * 0.9;
          s.vtag[i] = (s.vtag[i] ?? 0) + tagA * sdt;
          s.tag[i] = clamp((s.tag[i] ?? 0) + (s.vtag[i] ?? 0) * sdt, -30, 30);
        }

        // Multi-pass collision resolution
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < n - 1; i++) {
            const a = s.x[i] ?? 0;
            const b = s.x[i + 1] ?? 0;
            const minGap =
              (footprint(h, s.turn[i] ?? REST, live.current.sideWidths[i]) +
                footprint(h, s.turn[i + 1] ?? REST, live.current.sideWidths[i + 1])) /
              2 +
              h * 0.012;
            const overlap = minGap - (b - a);
            if (overlap <= 0) continue;
            if (i === s.drag) s.x[i + 1] = b + overlap;
            else if (i + 1 === s.drag) s.x[i] = a - overlap;
            else {
              s.x[i] = a - overlap / 2;
              s.x[i + 1] = b + overlap / 2;
            }
            const va = s.vx[i] ?? 0;
            const vb = s.vx[i + 1] ?? 0;
            if (va > vb) {
              const shared = (va + vb) / 2;
              if (i !== s.drag) s.vx[i] = shared;
              if (i + 1 !== s.drag) s.vx[i + 1] = shared;
            }
          }
        }

        if (!carousel && n > 0) {
          const edge = h * 0.06;
          const first = edge + footprint(h, s.turn[0] ?? REST, live.current.sideWidths[0]) / 2;
          const last = width - edge - footprint(h, s.turn[n - 1] ?? REST, live.current.sideWidths[n - 1]) / 2;
          if ((s.x[0] ?? 0) < first) {
            s.x[0] = first;
            s.vx[0] = Math.abs(s.vx[0] ?? 0) * 0.3;
          }
          if ((s.x[n - 1] ?? 0) > last) {
            s.x[n - 1] = last;
            s.vx[n - 1] = -Math.abs(s.vx[n - 1] ?? 0) * 0.3;
          }
        }
      }

      for (let i = 0; i < n; i++) {
        paint(i);
        if (
          Math.abs(s.vx[i] ?? 0) > 0.4 ||
          (now > s.free && Math.abs((s.x[i] ?? 0) - (s.tx[i] ?? 0)) > 0.25) ||
          Math.abs((s.turn[i] ?? 0) - (s.tturn[i] ?? 0)) > 0.05 ||
          Math.abs(s.vturn[i] ?? 0) > 0.05 ||
          Math.abs(s.swing[i] ?? 0) > 0.02 ||
          Math.abs(s.vswing[i] ?? 0) > 0.05 ||
          Math.abs(s.tag[i] ?? 0) > 0.05 ||
          Math.abs(s.vtag[i] ?? 0) > 0.08
        ) {
          busy = true;
        }
      }

      if (s.drag >= 0 || now < s.free) busy = true;

      if (busy) {
        s.raf = requestAnimationFrame(step);
      } else {
        s.raf = 0;
        s.last = 0;
        for (let i = 0; i < n; i++) {
          if (now > s.free) s.x[i] = s.tx[i] ?? 0;
          s.swing[i] = 0;
          s.vswing[i] = 0;
          s.tag[i] = 0;
          s.vtag[i] = 0;
          paint(i);
        }
      }
    },
    [paint]
  );

  const kick = React.useCallback(() => {
    const s = sim.current;
    if (live.current.reduced) {
      for (let i = 0; i < live.current.count; i++) {
        s.x[i] = s.tx[i] ?? 0;
        s.turn[i] = s.tturn[i] ?? REST;
        s.vx[i] = 0;
        s.vturn[i] = 0;
        s.swing[i] = 0;
        s.vswing[i] = 0;
        paint(i);
      }
      return;
    }
    if (!s.raf) {
      s.last = 0;
      s.raf = requestAnimationFrame(step);
    }
  }, [paint, step]);

  const impulse = React.useCallback(
    (i: number, amount: number) => {
      const s = sim.current;
      if (live.current.reduced || i < 0 || i >= live.current.count) return;
      s.vswing[i] = (s.vswing[i] ?? 0) + amount;
      kick();
    },
    [kick]
  );

  React.useLayoutEffect(() => {
    if (!size.width) return;
    const s = sim.current;
    const front = size.carousel ? (active ?? live.current.carouselIndex) : active;
    const xs = targets(size.h, size.width, size.carousel, front);
    const fresh = s.x.length !== count;

    for (let i = 0; i < count; i++) {
      s.tx[i] = (xs[i] ?? 0) + (size.carousel ? pointer.current.swipe : 0);
      s.tturn[i] = i === front ? 0 : REST;
      if (fresh || reduced) {
        s.x[i] = s.tx[i] ?? 0;
        s.vx[i] = 0;
        s.px[i] = 0;
        s.turn[i] = s.tturn[i] ?? REST;
        s.vturn[i] = 0;
        s.swing[i] = s.swing[i] ?? 0;
        s.vswing[i] = s.vswing[i] ?? 0;
        s.tag[i] = 0;
        s.vtag[i] = 0;
      }
    }
    if (fresh) {
      s.x.length = count;
      for (let i = 0; i < count; i++) paint(i);
    }
    kick();
  }, [size, active, count, reduced, targets, paint, kick]);

  // Initial greeting impulse
  const brushed = React.useRef(false);
  React.useEffect(() => {
    if (!size.width || brushed.current || reduced) return;
    brushed.current = true;
    const timers = items.map((_, i) => window.setTimeout(() => impulse(i, 46 - i * 2.5), 120 + i * 55));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [size.width, reduced, items, impulse]);

  React.useEffect(() => () => {
    cancelAnimationFrame(sim.current.raf);
    sim.current.raf = 0;
  }, []);

  React.useLayoutEffect(() => {
    if (openIndex !== null || lifted !== null || returnFocus.current === null) return;
    const index = returnFocus.current;
    returnFocus.current = null;
    slots.current[index]?.focus({ preventScroll: true });
  }, [openIndex, lifted]);

  const choose = React.useCallback(
    (index: number | null) => {
      setActive((old) => {
        if (old === index) return old;
        if (index !== null) {
          impulse(index - 1, -30);
          impulse(index + 1, 30);
        }
        if (old !== null && old !== index) {
          impulse(old - 1, 14);
          impulse(old + 1, -14);
        }
        if (index !== null) live.current.carouselIndex = index;
        return index;
      });
    },
    [impulse]
  );

  const stop = React.useCallback(() => setPlaying(false), []);

  // Autoplay loop
  React.useEffect(() => {
    if (!playing || reduced || openIndex !== null || count === 0 || !size.width) return;
    const interval = 2800;
    const first = window.setTimeout(function advance() {
      const current = live.current.active;
      choose(current === null ? 0 : (current + 1) % live.current.count);
      timer = window.setTimeout(advance, interval);
    }, active === null ? 1200 : interval);
    let timer = first;
    return () => window.clearTimeout(timer);
  }, [playing, reduced, openIndex, count, size.width, choose, active]);

  const open = React.useCallback(
    (index: number) => {
      stop();
      setActive(index);
      setOpenIndex(index);
    },
    [stop]
  );

  const close = React.useCallback(() => {
    setOpenIndex(null);
  }, []);

  function nearest(clientX: number, clientY: number) {
    const stage = stageRef.current;
    if (!stage) return null;
    const box = stage.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    const { h } = live.current.size;
    if (y < 0 || y > h + 46) return null;
    const s = sim.current;
    let best = null as number | null;
    let distance = Infinity;
    for (let i = 0; i < live.current.count; i++) {
      const half = footprint(h, s.turn[i] ?? REST, live.current.sideWidths[i]) / 2 + 6;
      const d = Math.abs(x - (s.x[i] ?? 0));
      if (d < half && d < distance) {
        best = i;
        distance = d;
      }
    }
    return best;
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const p = pointer.current;
    const s = sim.current;
    const stage = stageRef.current;
    if (p.id === event.pointerId && stage) {
      const dx = event.clientX - p.x;
      const now = performance.now();
      if (!p.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(event.clientY - p.y)) {
        p.moved = true;
        stop();
        if (stage.isConnected) stage.setPointerCapture(event.pointerId);
        if (!live.current.size.carousel && p.index >= 0) {
          s.drag = p.index;
          s.grab = event.clientX - stage.getBoundingClientRect().left - (s.x[p.index] ?? 0);
        }
      }
      if (p.moved) {
        const v = (event.clientX - p.lastX) / Math.max(1, now - p.lastT);
        p.v = p.v * 0.6 + v * 0.4;
        p.lastX = event.clientX;
        p.lastT = now;
        if (s.drag >= 0) {
          const x = event.clientX - stage.getBoundingClientRect().left - s.grab;
          s.vx[s.drag] = p.v * 1000;
          s.x[s.drag] = x;
          s.free = now + 900;
          kick();
        } else if (live.current.size.carousel) {
          p.swipe = dx;
          const xs = targets(
            live.current.size.h,
            live.current.size.width,
            true,
            live.current.active ?? live.current.carouselIndex
          );
          for (let i = 0; i < live.current.count; i++) s.tx[i] = (xs[i] ?? 0) + dx;
          kick();
        }
      }
      return;
    }
    if (event.pointerType !== 'mouse' || live.current.size.carousel || live.current.openIndex !== null) return;
    const hit = nearest(event.clientX, event.clientY);
    const current = live.current.active;
    if (current !== null && hit !== current) {
      const box = stage?.getBoundingClientRect();
      const keep = box
        ? Math.abs(event.clientX - box.left - (s.x[current] ?? 0)) < footprint(live.current.size.h, 0) / 2 + 16
        : false;
      if (keep && (hit === null || Math.abs(event.clientY - (box?.top ?? 0)) < live.current.size.h + 40)) return;
    }
    if (hit !== null) {
      stop();
      choose(hit);
    }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const hit = nearest(event.clientX, event.clientY);
    const now = performance.now();
    pendingOpen.current = -1;
    pointer.current = {
      id: event.pointerId,
      index: hit ?? -1,
      x: event.clientX,
      y: event.clientY,
      t: now,
      moved: false,
      kind: event.pointerType,
      swipe: 0,
      lastX: event.clientX,
      lastT: now,
      v: 0,
    };
  };

  const finishPointer = (event: React.PointerEvent, cancelled: boolean) => {
    const p = pointer.current;
    if (p.id !== event.pointerId) return;
    const s = sim.current;
    const stage = stageRef.current;
    if (stage?.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    pointer.current = { ...p, id: -1 };
    if (s.drag >= 0) {
      s.drag = -1;
      s.free = performance.now() + 700;
      kick();
      return;
    }
    if (p.moved && live.current.size.carousel) {
      const dx = event.clientX - p.x;
      const current = live.current.active ?? live.current.carouselIndex;
      const step = Math.abs(dx) > 40 || Math.abs(p.v) > 0.45 ? (dx < 0 ? 1 : -1) : 0;
      pointer.current.swipe = 0;
      choose(clamp(current + step, 0, live.current.count - 1));
      for (let i = 0; i < live.current.count; i++) impulse(i, clamp(-p.v * 22, -30, 30));
      return;
    }
    if (cancelled || p.moved || p.index < 0) return;
    stop();
    const touch = p.kind !== 'mouse';
    if (touch && live.current.active !== p.index) choose(p.index);
    else pendingOpen.current = p.index;
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    stop();
    const from = active ?? focusIndex;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? count - 1
          : clamp(from + (event.key === 'ArrowRight' ? 1 : -1), 0, count - 1);
    setFocusIndex(next);
    choose(next);
    slots.current[next]?.focus({ preventScroll: true });
  };

  const current = active === null ? null : items[active];
  const h = size.h;
  const boxW = h * ASPECT;
  const railY = Math.round(h * 0.07) + 12;
  const railR = Math.max(3.2, Math.round((RAIL_R / VB_H) * h * 10) / 10);

  return (
    <section
      className="sri-lakshmi-rail-section"
      aria-label="The Sri Lakshmi Edit Luxury Saree Showcase"
      data-slot="saree-rail-hero"
      data-mode={size.carousel ? 'carousel' : 'rail'}
    >
      <Defs uid={uid} />
      <div className="sri-lakshmi-rail-backdrop" />

      {/* Luxury Section Header */}
      <header className="sri-lakshmi-rail-header">
        <div className="sri-lakshmi-rail-eyebrow">
          <Sparkles size={14} color="var(--color-gold-dark)" />
          <span>Curated For You</span>
          <Sparkles size={14} color="var(--color-gold-dark)" />
        </div>

        <h2 className="sri-lakshmi-rail-title">The Sri Lakshmi Edit</h2>

        <div className="sri-lakshmi-rail-divider">
          <div className="sri-lakshmi-rail-divider-line" />
          <div className="sri-lakshmi-rail-divider-gem" />
          <div className="sri-lakshmi-rail-divider-line right" />
        </div>

        <p className="sri-lakshmi-rail-subtitle">
          A curated selection of sarees chosen for every celebration, every moment, and every version of you.
        </p>

        <div className="sri-lakshmi-rail-cue">
          <span className="sri-lakshmi-rail-cue-dot" />
          <span>Move mouse across rail or drag to inspect sarees</span>
        </div>
      </header>

      {/* Physics-driven Saree Rail Stage */}
      <div
        ref={stageRef}
        className="sri-lakshmi-rail-stage"
        style={{ height: Math.round(railY + h + 24), overflowX: 'clip' }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={(e) => finishPointer(e, false)}
        onPointerCancel={(e) => finishPointer(e, true)}
        onPointerLeave={(e) => {
          if (
            e.pointerType === 'mouse' &&
            pointer.current.id < 0 &&
            !size.carousel &&
            !document.activeElement?.matches('[data-garment]:focus-visible')
          ) {
            choose(null);
          }
        }}
        onKeyDown={onKeyDown}
        role="region"
        aria-roledescription="clothing rail"
        aria-label="Interactive Saree Rail Showcase"
      >
        {/* Antique Gold Architectural Rail */}
        <div
          aria-hidden="true"
          className="sri-lakshmi-rail-bar"
          style={{ top: railY - railR, height: railR * 2 }}
        >
          <div className="sri-lakshmi-rail-bar-shadow" style={{ top: railR * 2 + 1 }} />
          <div className="sri-lakshmi-rail-bar-tube" />
          <div className="sri-lakshmi-rail-bar-highlight" />

          {/* Left and Right Brass Wall Mount Finials */}
          <div className="sri-lakshmi-rail-finial left">
            <span className="sri-lakshmi-rail-finial-gem" />
            <span className="sri-lakshmi-rail-finial-gem" />
          </div>
          <div className="sri-lakshmi-rail-finial right">
            <span className="sri-lakshmi-rail-finial-gem" />
            <span className="sri-lakshmi-rail-finial-gem" />
          </div>
        </div>

        {/* Sarees hanging on the rail */}
        {items.map((saree, i) => {
          const turned = active === i;
          return (
            <button
              key={saree.id}
              ref={(node) => {
                slots.current[i] = node;
              }}
              type="button"
              data-garment={i}
              data-front={turned ? 'true' : undefined}
              tabIndex={i === (active ?? focusIndex) ? 0 : -1}
              aria-label={`${saree.name} - ${saree.tag}`}
              aria-pressed={turned}
              className="sri-lakshmi-rail-slot"
              style={{
                top: railY - (HOOK_TOP / VB_H) * h,
                width: boxW,
                height: h,
                zIndex: turned ? 30 : 10 + i,
                visibility: lifted === i ? 'hidden' : undefined,
                transform: `translate3d(${((sim.current.x[i] ?? 0) - boxW / 2).toFixed(2)}px,0,0)`,
              }}
              onFocus={() => {
                setFocusIndex(i);
                if (pointer.current.id < 0) {
                  stop();
                  choose(i);
                }
              }}
              onClick={(e) => {
                const pending = pendingOpen.current;
                pendingOpen.current = -1;
                if (e.detail === 0 || pending === i) open(i);
              }}
            >
              {/* Pendulum Swing Pivot */}
              <span
                ref={(node) => {
                  swings.current[i] = node;
                }}
                className="sri-lakshmi-rail-swing"
              >
                {/* Dynamic Floor Shadow */}
                <span
                  ref={(node) => {
                    shadows.current[i] = node;
                  }}
                  className="sri-lakshmi-rail-shadow"
                >
                  <span className="sri-lakshmi-rail-shadow-shape" />
                </span>

                {/* 3D Rotational Canvas */}
                <span
                  ref={(node) => {
                    turns.current[i] = node;
                  }}
                  className="sri-lakshmi-rail-turn"
                  style={{ transform: `perspective(${PERSPECTIVE}px) rotateY(${REST}deg)` }}
                >
                  <span className="sri-lakshmi-rail-face front">
                    {/* Antique Brass Saree Hanger */}
                    <SareeHanger uid={uid} />

                    {/* Saree Drape Canvas */}
                    <div className="sri-lakshmi-rail-canvas">
                      <div className="sri-lakshmi-rail-image-wrap">
                        <img
                          src={saree.image}
                          alt={saree.name}
                          draggable={false}
                          className="sri-lakshmi-rail-image"
                          loading="lazy"
                        />
                        <span className="sri-lakshmi-rail-badge-craft">{saree.fabric.split(' ')[0]}</span>
                        {saree.discountPercentage && saree.discountPercentage > 0 ? (
                          <span className="sri-lakshmi-rail-badge-sale">{saree.discountPercentage}% OFF</span>
                        ) : null}
                        {/* Dynamic Lambertian Shading */}
                        <span
                          ref={(node) => {
                            shades.current[i] = node;
                          }}
                          className="sri-lakshmi-rail-shade-overlay"
                        />
                      </div>
                    </div>
                  </span>
                </span>

                {/* Swinging Hang-Tag with price */}
                <span
                  ref={(node) => {
                    tags.current[i] = node;
                  }}
                  className="sri-lakshmi-rail-tag"
                >
                  <span className="sri-lakshmi-rail-tag-string" />
                  <span className="sri-lakshmi-rail-tag-body">
                    <span className="sri-lakshmi-rail-tag-eyelet" />
                    {saree.tag}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Carousel Indicators */}
      {size.carousel && count > 1 && (
        <div className="sri-lakshmi-rail-dots">
          {items.map((saree, i) => (
            <button
              key={saree.id}
              type="button"
              aria-label={`View ${saree.name}`}
              className={`sri-lakshmi-rail-dot ${carouselIndex === i ? 'active' : ''}`}
              onClick={() => {
                stop();
                choose(i);
              }}
            />
          ))}
        </div>
      )}

      {/* Dynamic Caption & Primary Actions */}
      <div className="sri-lakshmi-rail-caption-wrap">
        <div className="sri-lakshmi-rail-caption-box">
          <p className="sri-lakshmi-rail-caption-name">
            {current ? current.name : 'Select or Hover Over a Saree'}
          </p>
          {current && (
            <div className="sri-lakshmi-rail-caption-price-row">
              <span className="sri-lakshmi-rail-caption-price">₹{current.price.toLocaleString('en-IN')}</span>
              {current.originalPrice && current.originalPrice > current.price && (
                <span className="sri-lakshmi-rail-caption-orig">
                  ₹{current.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          )}
          <p className="sri-lakshmi-rail-caption-desc">
            {current ? current.description : 'Authentic Indian handlooms crafted with pure mulberry silk and golden zari.'}
          </p>
        </div>

        {/* Action Row */}
        <div className="sri-lakshmi-rail-action-row">
          {active !== null && (
            <button
              type="button"
              className="sri-lakshmi-rail-inspect-btn"
              onClick={() => open(active)}
            >
              <span>Inspect 3D Saree</span>
              <ChevronRight size={16} />
            </button>
          )}

          <Link to="/shop" className="sri-lakshmi-rail-primary-cta">
            <span>Explore the Collection</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      {/* Luxury Saree Inspection Modal (Lifting off the rail) */}
      {openIndex !== null && items[openIndex] && (
        <SareeDetailModal
          uid={uid}
          saree={items[openIndex]}
          index={openIndex}
          total={count}
          reduced={reduced}
          source={() => turns.current[openIndex]?.getBoundingClientRect() ?? null}
          onLift={(lift) => setLifted(lift ? openIndex : null)}
          onClose={() => {
            const index = openIndex;
            returnFocus.current = index;
            close();
            impulse(index, (index % 2 ? 1 : -1) * 44);
          }}
        />
      )}
    </section>
  );
};

interface SareeDetailModalProps {
  uid: string;
  saree: SareeRailItem;
  index: number;
  total: number;
  reduced: boolean;
  source: () => DOMRect | null;
  onLift: (lifted: boolean) => void;
  onClose: () => void;
}

function SareeDetailModal({
  uid,
  saree,
  index,
  total,
  reduced,
  source,
  onLift,
  onClose,
}: SareeDetailModalProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const figureRef = React.useRef<HTMLDivElement | null>(null);
  const spinRef = React.useRef<HTMLDivElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();

  const [side, setSide] = React.useState<'front' | 'back'>('front');
  const [shown, setShown] = React.useState(false);
  const angle = React.useRef({
    value: 0,
    target: 0,
    velocity: 0,
    raf: 0,
    last: 0,
    dragging: false,
    startX: 0,
    startAngle: 0,
  });
  const closing = React.useRef(false);

  const spin = React.useCallback(() => {
    const a = angle.current;
    const node = spinRef.current;
    const loop = (now: number) => {
      const dt = a.last ? Math.min(0.034, (now - a.last) / 1000) : 1 / 60;
      a.last = now;
      const accel = -90 * (a.value - a.target) - 2 * Math.sqrt(90) * 0.82 * a.velocity;
      a.velocity += accel * dt;
      a.value += a.velocity * dt;
      if (node) node.style.transform = `rotateY(${a.value.toFixed(2)}deg)`;
      if (Math.abs(a.value - a.target) < 0.05 && Math.abs(a.velocity) < 0.05) {
        a.value = a.target;
        if (node) node.style.transform = `rotateY(${a.value}deg)`;
        a.raf = 0;
        a.last = 0;
        return;
      }
      a.raf = requestAnimationFrame(loop);
    };
    if (reduced) {
      a.value = a.target;
      if (node) node.style.transform = `rotateY(${a.value}deg)`;
      return;
    }
    if (!a.raf) a.raf = requestAnimationFrame(loop);
  }, [reduced]);

  const turnTo = React.useCallback(
    (next: 'front' | 'back') => {
      const a = angle.current;
      const base = Math.round(a.value / 360) * 360;
      a.target = base + (next === 'back' ? 180 : 0);
      if (Math.abs(a.target - a.value) > 180) a.target -= 360 * Math.sign(a.target - a.value);
      setSide(next);
      spin();
    },
    [spin]
  );

  React.useLayoutEffect(() => {
    const figure = figureRef.current;
    const from = source();
    closeRef.current?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    let animation: Animation | null = null;

    if (figure && from && !reduced && from.width > 0) {
      const to = figure.getBoundingClientRect();
      const scale = from.height / to.height;
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top - to.top;
      const lift = Math.min(90, Math.abs(dy) * 0.25 + 30);
      onLift(true);
      animation = figure.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          {
            transform: `translate(${dx * 0.4}px, ${dy * 0.4 - lift}px) scale(${((scale + 1) / 2) * 1.03}) rotate(${dx > 0 ? -2.5 : 2.5
              }deg)`,
            offset: 0.5,
          },
          { transform: 'none' },
        ],
        { duration: 680, easing: 'cubic-bezier(.22,.85,.3,1)' }
      );
    }
    const raf = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(raf);
      animation?.cancel();
      document.body.style.overflow = overflow;
      cancelAnimationFrame(angle.current.raf);
      onLift(false);
    };
  }, [source, reduced, onLift]);

  const dismiss = React.useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setShown(false);
    const figure = figureRef.current;
    const to = source();
    if (!figure || !to || reduced || to.width === 0) {
      onClose();
      return;
    }
    const from = figure.getBoundingClientRect();
    const scale = to.height / from.height;
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top - from.top;
    const animation = figure.animate(
      [
        { transform: 'none' },
        { transform: `translate(${dx * 0.6}px, ${dy * 0.6 - 30}px) scale(${(scale + 1) / 2})`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      ],
      { duration: 560, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' }
    );
    animation.onfinish = () => onClose();
  }, [source, reduced, onClose]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.contains(event.target as Node)) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        turnTo(side === 'front' ? 'back' : 'front');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dismiss, turnTo, side]);

  const stage = (
    <div ref={figureRef} className="sri-lakshmi-modal-stage-col" style={{ width: '100%', maxWidth: '320px' }}>
      <div
        className="sri-lakshmi-modal-turnable"
        style={{ perspective: '1400px' }}
        onPointerDown={(event) => {
          const a = angle.current;
          a.dragging = true;
          a.startX = event.clientX;
          a.startAngle = a.value;
          cancelAnimationFrame(a.raf);
          a.raf = 0;
          a.last = 0;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const a = angle.current;
          if (!a.dragging) return;
          a.value = clamp(a.startAngle + (event.clientX - a.startX) * 0.45, a.startAngle - 220, a.startAngle + 220);
          if (spinRef.current) spinRef.current.style.transform = `rotateY(${a.value.toFixed(2)}deg)`;
        }}
        onPointerUp={() => {
          const a = angle.current;
          if (!a.dragging) return;
          a.dragging = false;
          const facing = ((a.value % 360) + 360) % 360;
          turnTo(facing > 90 && facing < 270 ? 'back' : 'front');
        }}
        onPointerCancel={() => {
          angle.current.dragging = false;
          turnTo(side);
        }}
      >
        <div ref={spinRef} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
          {(['front', 'back'] as const).map((face) => (
            <div
              key={face}
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: face === 'back' ? 'rotateY(180deg)' : undefined,
              }}
            >
              <SareeHanger uid={uid} />
              <div className="sri-lakshmi-rail-canvas" style={{ top: '14%', bottom: 0 }}>
                <div className="sri-lakshmi-rail-image-wrap">
                  <img
                    src={saree.image}
                    alt={saree.name}
                    className="sri-lakshmi-rail-image"
                    style={{ transform: face === 'back' ? 'scaleX(-1)' : undefined }}
                  />
                  <span className="sri-lakshmi-rail-badge-craft">{saree.fabric.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${uid}-detail-title`}
      className="sri-lakshmi-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="sri-lakshmi-modal-card">
        {/* Close Button */}
        <button
          ref={closeRef}
          type="button"
          onClick={dismiss}
          className="sri-lakshmi-modal-close"
          aria-label="Close saree inspection"
        >
          <X size={18} />
        </button>

        {/* 3D Spin Stage Column */}
        {stage}

        {/* Content Column */}
        <div className="sri-lakshmi-modal-content-col">
          <span className="sri-lakshmi-modal-serial">
            SLS EDIT {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>

          <h3 id={`${uid}-detail-title`} className="sri-lakshmi-modal-title">
            {saree.name}
          </h3>

          <div className="sri-lakshmi-rail-caption-price-row" style={{ justifyContent: 'flex-start' }}>
            <span className="sri-lakshmi-rail-caption-price" style={{ fontSize: '1.5rem', color: 'var(--color-maroon)' }}>
              ₹{saree.price.toLocaleString('en-IN')}
            </span>
            {saree.originalPrice && saree.originalPrice > saree.price && (
              <span className="sri-lakshmi-rail-caption-orig" style={{ fontSize: '1.125rem' }}>
                ₹{saree.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            {saree.discountPercentage && saree.discountPercentage > 0 && (
              <span className="badge badge-sale">{saree.discountPercentage}% OFF</span>
            )}
          </div>

          <p className="sri-lakshmi-modal-desc">{saree.description}</p>

          {/* Saree Craft & Weave Attributes */}
          <div className="sri-lakshmi-modal-pills">
            {saree.details.map((detail, idx) => (
              <span key={idx} className="sri-lakshmi-modal-pill">
                ✦ {detail}
              </span>
            ))}
          </div>

          {/* Front / Back Flip Controls */}
          <div className="sri-lakshmi-modal-flip-row" role="group" aria-label="Saree View Angle">
            {(['front', 'back'] as const).map((face) => (
              <button
                key={face}
                type="button"
                className={`sri-lakshmi-modal-flip-btn ${side === face ? 'active' : ''}`}
                onClick={() => turnTo(face)}
              >
                {face === 'front' ? 'Pallu View' : 'Pleat View'}
              </button>
            ))}
          </div>

          {/* Direct Buy / Detail Navigation */}
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-gold"
              style={{ flex: 1, minWidth: '180px' }}
              onClick={() => {
                dismiss();
                navigate(`/product/${saree.slug}`);
              }}
            >
              <span>View Saree & Order</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SriLakshmiEdit;
