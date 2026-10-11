import React from 'react';

// Color definitions matching the design requirements
const COLORS = {
  rosePetal: '#D99AA7',       // Main flower petals: muted rose pink
  champagnePetal: '#D7B56D',  // Secondary flower petals: soft champagne gold
  outline: '#701C35',         // Petal outlines: deep burgundy
  centerGold: '#B78B43',      // Flower centres: antique gold
  centerInner: '#FFF9F2',     // Inner highlight: warm ivory
  stemStroke: '#701C35',      // Stems & vines
  leafFill: 'rgba(215, 181, 109, 0.35)', // Foliage fill
  leafStroke: '#701C35'       // Foliage outline
};

interface TaperedFlowerProps {
  petals?: number;
  size?: number; // Outer petal length
  petalWidth?: number;
  baseRadius?: number;
  petalFill?: string;
  outlineColor?: string;
  centerColor?: string;
  centerRadius?: number;
  swayClass?: string;
  delay?: string;
  rotation?: number;
  opacity?: number;
}

/**
 * TaperedFlower: Authentic botanical flower head with tapered petals,
 * fine burgundy outlines, inner petal vein accents, and circular antique gold centre.
 */
export const TaperedFlower: React.FC<TaperedFlowerProps> = ({
  petals = 5,
  size = 46,
  petalWidth = 14,
  baseRadius = 8,
  petalFill = COLORS.rosePetal,
  outlineColor = COLORS.outline,
  centerColor = COLORS.centerGold,
  centerRadius = 8.5,
  swayClass = 'sway-1',
  rotation = 0,
  opacity = 1
}) => {
  const angleStep = 360 / petals;
  const petalList = Array.from({ length: petals }, (_, i) => i * angleStep);

  // Cubic bezier for individual tapered petal: wide belly with pointed tip
  const petalPathD = `M 0,-${baseRadius} C -${petalWidth},-${baseRadius + size * 0.35} -${petalWidth * 0.88},-${baseRadius + size * 0.78} 0,-${baseRadius + size} C ${petalWidth * 0.88},-${baseRadius + size * 0.78} ${petalWidth},-${baseRadius + size * 0.35} 0,-${baseRadius} Z`;
  const veinPathD = `M 0,-${baseRadius + 2} L 0,-${baseRadius + size * 0.72}`;

  return (
    <g
      className={`flower-head-sway ${swayClass}`}
      transform={`rotate(${rotation})`}
      style={{ opacity }}
    >
      {/* Individual Tapered Petals */}
      {petalList.map((angle, idx) => (
        <g key={idx} transform={`rotate(${angle})`}>
          <path
            d={petalPathD}
            fill={petalFill}
            stroke={outlineColor}
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          {/* Subtle central petal vein */}
          <path
            d={veinPathD}
            stroke={outlineColor}
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.45"
          />
        </g>
      ))}

      {/* Small Circular Center with Stamen Accents */}
      <circle
        cx="0"
        cy="0"
        r={centerRadius}
        fill={centerColor}
        stroke={outlineColor}
        strokeWidth="1.2"
      />
      {/* Inner stamen ring */}
      <circle
        cx="0"
        cy="0"
        r={centerRadius * 0.58}
        fill="none"
        stroke={outlineColor}
        strokeWidth="0.85"
        strokeDasharray="1.2 1.6"
        opacity="0.75"
      />
      {/* Tiny central core */}
      <circle
        cx="0"
        cy="0"
        r={centerRadius * 0.28}
        fill={COLORS.centerInner}
      />
    </g>
  );
};

interface ClusterProps {
  x: number | string;
  y: number | string;
  clusterRotation?: number;
  scale?: number;
  staggerClass?: string;
  edgeOrigin?: 'top' | 'bottom' | 'left' | 'right' | 'corner';
}

/**
 * FloralCluster: A layered botanical arrangement combining:
 * 1. Background stems & leaves rooted outside the edge
 * 2. Secondary smaller champagne gold flower heads
 * 3. Prominent central rose pink flower head in front
 * 4. Delicate floral buds
 */
const FloralCluster: React.FC<ClusterProps> = ({
  clusterRotation = 0,
  scale = 1,
  staggerClass = 'stagger-1'
}) => {
  return (
    <g
      className={`floral-cluster-intro ${staggerClass}`}
      transform={`rotate(${clusterRotation}) scale(${scale})`}
    >
      {/* Stems & Leaves rooted at base (0,0) */}
      <g className="cluster-stems" opacity="0.95">
        {/* Main stem arching outward */}
        <path
          d="M 0,0 C 15,-25 35,-45 42,-75 C 48,-100 35,-120 18,-135"
          fill="none"
          stroke={COLORS.stemStroke}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Left branch */}
        <path
          d="M 12,-20 C -15,-40 -35,-55 -45,-85"
          fill="none"
          stroke={COLORS.stemStroke}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        {/* Right branch */}
        <path
          d="M 28,-40 C 45,-55 70,-65 85,-80"
          fill="none"
          stroke={COLORS.stemStroke}
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Tapered foliage leaves */}
        <path
          d="M 18,-30 C 35,-32 45,-20 50,-10 C 38,-12 25,-22 18,-30 Z"
          fill={COLORS.leafFill}
          stroke={COLORS.leafStroke}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M 8,-45 C -12,-52 -25,-42 -28,-30 C -15,-35 -3,-40 8,-45 Z"
          fill={COLORS.leafFill}
          stroke={COLORS.leafStroke}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M 32,-60 C 52,-70 65,-65 72,-55 C 58,-58 45,-58 32,-60 Z"
          fill={COLORS.leafFill}
          stroke={COLORS.leafStroke}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M -5,-70 C -25,-75 -35,-65 -38,-50 C -25,-58 -12,-62 -5,-70 Z"
          fill={COLORS.leafFill}
          stroke={COLORS.leafStroke}
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Delicate floral buds */}
        <ellipse
          cx="86"
          cy="-82"
          rx="5"
          ry="9"
          transform="rotate(35 86 -82)"
          fill={COLORS.champagnePetal}
          stroke={COLORS.outline}
          strokeWidth="1.1"
        />
        <ellipse
          cx="-46"
          cy="-87"
          rx="4.5"
          ry="8"
          transform="rotate(-40 -46 -87)"
          fill={COLORS.rosePetal}
          stroke={COLORS.outline}
          strokeWidth="1.1"
        />
      </g>

      {/* Layer 1: Secondary Champagne Gold Flower (Left branch, smaller, deeper) */}
      <g transform="translate(-40, -82)">
        <TaperedFlower
          petals={5}
          size={32}
          petalWidth={10.5}
          baseRadius={6.5}
          petalFill={COLORS.champagnePetal}
          swayClass="sway-2"
          rotation={-18}
          opacity={0.92}
        />
      </g>

      {/* Layer 2: Secondary Champagne Gold Flower (Right branch, medium) */}
      <g transform="translate(62, -72)">
        <TaperedFlower
          petals={6}
          size={35}
          petalWidth={11}
          baseRadius={7}
          petalFill={COLORS.champagnePetal}
          swayClass="sway-3"
          rotation={24}
          opacity={0.95}
        />
      </g>

      {/* Layer 3: Prominent Central Rose Pink Flower Head (Foreground, focal point) */}
      <g transform="translate(18, -135)">
        <TaperedFlower
          petals={5}
          size={46}
          petalWidth={14.5}
          baseRadius={8.5}
          petalFill={COLORS.rosePetal}
          swayClass="sway-1"
          rotation={6}
          centerRadius={9}
        />
      </g>
    </g>
  );
};

/**
 * CornerCluster: Richly fanning floral bouquet tailored specifically for frame corners.
 */
const CornerCluster: React.FC<{ rotation?: number; staggerClass?: string }> = ({
  rotation = 0,
  staggerClass = 'stagger-corner'
}) => {
  return (
    <g
      className={`floral-cluster-intro ${staggerClass}`}
      transform={`rotate(${rotation})`}
    >
      {/* Corner Stems */}
      <g opacity="0.95">
        {/* Main diagonal stem into frame */}
        <path
          d="M 0,0 C 25,-40 65,-75 110,-115"
          fill="none"
          stroke={COLORS.stemStroke}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Side lateral branches */}
        <path
          d="M 30,-30 C 55,-40 85,-45 125,-45"
          fill="none"
          stroke={COLORS.stemStroke}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M 30,-30 C 35,-60 40,-95 45,-135"
          fill="none"
          stroke={COLORS.stemStroke}
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* Corner Leaves */}
        <path
          d="M 40,-50 C 65,-58 80,-52 90,-40 C 72,-42 55,-46 40,-50 Z"
          fill={COLORS.leafFill}
          stroke={COLORS.leafStroke}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M 50,-40 C 58,-65 52,-82 40,-92 C 42,-74 46,-56 50,-40 Z"
          fill={COLORS.leafFill}
          stroke={COLORS.leafStroke}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M 70,-75 C 92,-90 105,-85 112,-72 C 98,-78 84,-77 70,-75 Z"
          fill={COLORS.leafFill}
          stroke={COLORS.leafStroke}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>

      {/* Flower 1: Upper Lateral (Champagne Gold) */}
      <g transform="translate(45, -135)">
        <TaperedFlower
          petals={5}
          size={34}
          petalWidth={11}
          baseRadius={7}
          petalFill={COLORS.champagnePetal}
          swayClass="sway-4"
          rotation={-15}
          opacity={0.92}
        />
      </g>

      {/* Flower 2: Side Lateral (Champagne Gold) */}
      <g transform="translate(125, -45)">
        <TaperedFlower
          petals={6}
          size={33}
          petalWidth={10.5}
          baseRadius={6.5}
          petalFill={COLORS.champagnePetal}
          swayClass="sway-5"
          rotation={35}
          opacity={0.92}
        />
      </g>

      {/* Flower 3: Central Corner Blossom (Prominent Rose Pink) */}
      <g transform="translate(110, -115)">
        <TaperedFlower
          petals={5}
          size={48}
          petalWidth={15}
          baseRadius={9}
          petalFill={COLORS.rosePetal}
          swayClass="sway-1"
          rotation={12}
          centerRadius={9.5}
        />
      </g>
    </g>
  );
};

/**
 * FlowerBorder: Full responsive SVG frame placing botanical clusters
 * along the Top, Bottom, Left, and Right edges, and the 4 corners,
 * growing inward towards the center while keeping the center spacious.
 */
export const FlowerBorder: React.FC = () => {
  return (
    <div className="flower-border-container" aria-hidden="true">
      <svg
        className="flower-border-svg"
        viewBox="0 0 1400 850"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ===================== CORNER CLUSTERS ===================== */}
        {/* Top-Left Corner */}
        <g transform="translate(0, 0)">
          <CornerCluster rotation={45} staggerClass="stagger-top-left" />
        </g>

        {/* Top-Right Corner */}
        <g transform="translate(1400, 0)">
          <CornerCluster rotation={135} staggerClass="stagger-top-right" />
        </g>

        {/* Bottom-Right Corner */}
        <g transform="translate(1400, 850)">
          <CornerCluster rotation={225} staggerClass="stagger-bottom-right" />
        </g>

        {/* Bottom-Left Corner */}
        <g transform="translate(0, 850)">
          <CornerCluster rotation={315} staggerClass="stagger-bottom-left" />
        </g>

        {/* ===================== TOP EDGE CLUSTERS ===================== */}
        {/* Growing inward downward from y=0 */}
        <g transform="translate(420, 0)">
          <FloralCluster
            x={420}
            y={0}
            clusterRotation={180}
            scale={0.95}
            staggerClass="stagger-top-1"
          />
        </g>
        <g transform="translate(980, 0)">
          <FloralCluster
            x={980}
            y={0}
            clusterRotation={180}
            scale={0.95}
            staggerClass="stagger-top-2"
          />
        </g>

        {/* ===================== BOTTOM EDGE CLUSTERS ===================== */}
        {/* Growing inward upward from y=850 */}
        <g transform="translate(450, 850)">
          <FloralCluster
            x={450}
            y={850}
            clusterRotation={0}
            scale={0.95}
            staggerClass="stagger-bottom-1"
          />
        </g>
        <g transform="translate(950, 850)">
          <FloralCluster
            x={950}
            y={850}
            clusterRotation={0}
            scale={0.95}
            staggerClass="stagger-bottom-2"
          />
        </g>

        {/* ===================== LEFT EDGE CLUSTERS ===================== */}
        {/* Growing inward to the right from x=0 */}
        <g transform="translate(0, 425)" className="flower-side-cluster">
          <FloralCluster
            x={0}
            y={425}
            clusterRotation={90}
            scale={0.92}
            staggerClass="stagger-left-1"
          />
        </g>

        {/* ===================== RIGHT EDGE CLUSTERS ===================== */}
        {/* Growing inward to the left from x=1400 */}
        <g transform="translate(1400, 425)" className="flower-side-cluster">
          <FloralCluster
            x={1400}
            y={425}
            clusterRotation={270}
            scale={0.92}
            staggerClass="stagger-right-1"
          />
        </g>
      </svg>
    </div>
  );
};
