import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlagKind, WorldMapCountry } from '../data/worldMapEvents';
import { PixelGameOverModal } from './PixelGameOverModal';
import { renderPixelGridRle } from '../utils/pixelGridCache';

interface PixelTacticalNukeOverlayProps {
  active: boolean;
  launchId?: number;
  startedAtMs?: number;
  country: WorldMapCountry | null;
  sceneId: string;
  onClose: () => void;
  onRestartGame?: () => void;
}

// Phase 0: 5 DEFCON levels x 1000ms (0.8s alarm + 0.2s pause between each) = 5000ms before tactical-nuke.mp3 starts
const DEFCON_STEP_MS = 1000;
const DEFCON_INTRO_MS = DEFCON_STEP_MS * 5; // 5000ms
// Relative to tactical-nuke.mp3 start (5000ms): explosion audio hits at 5.50s (10500ms total)
const BOMB_DROP_START_MS = DEFCON_INTRO_MS + 3700; // 8700ms (1.8s drop)
const DETONATION_MS = DEFCON_INTRO_MS + 5500; // 10500ms (synced to exact audio boom)

const DEFCON_STEPS: {
  level: 5 | 4 | 3 | 2 | 1;
  label: string;
  activeBg: string;
  activeBorder: string;
  textHex: string;
}[] = [
  {
    level: 5,
    label: 'DEFCON 5',
    activeBg: '#1D4ED8',
    activeBorder: '#93C5FD',
    textHex: '#DBEAFE',
  },
  {
    level: 4,
    label: 'DEFCON 4',
    activeBg: '#15803D',
    activeBorder: '#86EFAC',
    textHex: '#DCFCE7',
  },
  {
    level: 3,
    label: 'DEFCON 3',
    activeBg: '#CA8A04',
    activeBorder: '#FEF08A',
    textHex: '#FEF9C3',
  },
  {
    level: 2,
    label: 'DEFCON 2',
    activeBg: '#EA580C',
    activeBorder: '#FDBA74',
    textHex: '#FFEDD5',
  },
  {
    level: 1,
    label: 'DEFCON 1',
    activeBg: '#DC2626',
    activeBorder: '#FEF08A',
    textHex: '#FEF08A',
  },
];

// Shared 32-Bit Pixel Plaque Box Shadow (matches PixelDayHud & PixelWorldMapModal)
const PIXEL_PLAQUE_SHADOW = [
  'inset 2px 2px 0 0 #EBC14B',
  'inset -2px -2px 0 0 #8F6118',
  '0 0 0 2px #090D16',
  '0 0 0 4px #C88F2A',
  '0 0 0 6px #090D16',
  '4px 6px 0 4px rgba(0, 0, 0, 0.65)',
].join(', ');

function PixelCountryFlag({
  flag,
  className = 'w-10 h-7',
}: {
  flag: FlagKind;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 15 10"
      shapeRendering="crispEdges"
      className={`${className} border-2 border-[#090D16] shrink-0`}
    >
      {flag === 'usa' && (
        <>
          <rect x={0} y={0} width={15} height={10} fill="#F8FAFC" />
          <rect x={0} y={0} width={15} height={2} fill="#DC2626" />
          <rect x={0} y={4} width={15} height={2} fill="#DC2626" />
          <rect x={0} y={8} width={15} height={2} fill="#DC2626" />
          <rect x={0} y={0} width={7} height={6} fill="#1D4ED8" />
          <rect x={1} y={1} width={1} height={1} fill="#F8FAFC" />
          <rect x={3} y={1} width={1} height={1} fill="#F8FAFC" />
          <rect x={5} y={1} width={1} height={1} fill="#F8FAFC" />
          <rect x={2} y={3} width={1} height={1} fill="#F8FAFC" />
          <rect x={4} y={3} width={1} height={1} fill="#F8FAFC" />
        </>
      )}
      {flag === 'mexico' && (
        <>
          <rect x={0} y={0} width={5} height={10} fill="#15803D" />
          <rect x={5} y={0} width={5} height={10} fill="#F8FAFC" />
          <rect x={10} y={0} width={5} height={10} fill="#DC2626" />
          <rect x={6} y={4} width={3} height={2} fill="#92400E" />
        </>
      )}
      {flag === 'russia' && (
        <>
          <rect x={0} y={0} width={15} height={3} fill="#F8FAFC" />
          <rect x={0} y={3} width={15} height={4} fill="#2563EB" />
          <rect x={0} y={7} width={15} height={3} fill="#DC2626" />
        </>
      )}
      {flag === 'iran' && (
        <>
          <rect x={0} y={0} width={15} height={3} fill="#16A34A" />
          <rect x={0} y={3} width={15} height={4} fill="#F8FAFC" />
          <rect x={0} y={7} width={15} height={3} fill="#DC2626" />
          <rect x={6} y={4} width={3} height={2} fill="#DC2626" />
          <rect x={7} y={3} width={1} height={4} fill="#DC2626" />
        </>
      )}
      {flag === 'china' && (
        <>
          <rect x={0} y={0} width={15} height={10} fill="#DC2626" />
          <rect x={2} y={2} width={2} height={2} fill="#FACC15" />
          <rect x={5} y={1} width={1} height={1} fill="#FACC15" />
          <rect x={6} y={2} width={1} height={1} fill="#FACC15" />
          <rect x={6} y={4} width={1} height={1} fill="#FACC15" />
          <rect x={5} y={5} width={1} height={1} fill="#FACC15" />
        </>
      )}
      {flag === 'north-korea' && (
        <>
          <rect x={0} y={0} width={15} height={2} fill="#1D4ED8" />
          <rect x={0} y={2} width={15} height={1} fill="#F8FAFC" />
          <rect x={0} y={3} width={15} height={4} fill="#DC2626" />
          <rect x={0} y={7} width={15} height={1} fill="#F8FAFC" />
          <rect x={0} y={8} width={15} height={2} fill="#1D4ED8" />
          <rect x={3} y={3} width={3} height={4} fill="#F8FAFC" />
          <rect x={4} y={4} width={1} height={2} fill="#DC2626" />
        </>
      )}
    </svg>
  );
}

function PixelRadiationBadge({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className}>
      <rect x={4} y={0} width={8} height={16} fill="#090D16" />
      <rect x={0} y={4} width={16} height={8} fill="#090D16" />
      <rect x={2} y={2} width={12} height={12} fill="#090D16" />
      <rect x={4} y={1} width={8} height={14} fill="#FACC15" />
      <rect x={1} y={4} width={14} height={8} fill="#FACC15" />
      <rect x={2} y={2} width={12} height={12} fill="#FACC15" />
      <rect x={3} y={3} width={3} height={3} fill="#090D16" />
      <rect x={10} y={3} width={3} height={3} fill="#090D16" />
      <rect x={6} y={10} width={4} height={3} fill="#090D16" />
      <rect x={7} y={7} width={2} height={2} fill="#DC2626" />
    </svg>
  );
}

// High-Fidelity 32-Bit Pixel Thermonuclear Warhead Sprite (16x34 grid, centered at x=0, y=0)
const PIXEL_NUKE_BOMB_ROWS: string[] = [
  '.oo..........oo.',
  '.oRo..oooo..oRo.',
  '.oRRoKGGGGKoRRo.',
  '.oRFoKGGGGKoFRo.',
  '.oRFoKLGGDKoFRo.',
  '.oFFoKLGGDKoFFo.',
  '..oooKLGGDKooo..',
  '....oKLGGDKo....',
  '...oKLLGGDDKo...',
  '...oKLLGGDDKo...',
  '...oKLGGGGDKo...',
  '...oKYYYYYYKo...',
  '...oKYooYYoKo...',
  '...oKYYYYYYKo...',
  '...oKLGGGGDKo...',
  '...oKLLGGDDKo...',
  '...oKLLGGDDKo...',
  '...oKLGGGGDKo...',
  '...oKGGGGDDKo...',
  '...oKRRRRRRKo...',
  '...oKRRRRRRKo...',
  '....oKGGGGKo....',
  '....oKLLGDKo....',
  '....oKLLGDKo....',
  '....oKGGGGKo....',
  '.....oKGGKo.....',
  '.....oKRRKo.....',
  '.....oKRRKo.....',
  '......oOOo......',
  '......oOOo......',
  '......oYYo......',
  '.......oWo......',
  '.......oWo......',
  '........o.......',
];

const BOMB_PALETTE: Record<string, string> = {
  o: '#090D16',
  K: '#1E293B',
  G: '#475569',
  L: '#94A3B8',
  D: '#0F172A',
  Y: '#FACC15',
  W: '#FEF08A',
  R: '#DC2626',
  F: '#991B1B',
  O: '#F97316',
};

const HighFidelityPixelBomb = React.memo(({ flickerFrame }: { flickerFrame: number }) => {
  const flameH = flickerFrame === 0 ? 20 : 26;
  const smokeY = flickerFrame === 0 ? -40 : -46;
  return (
    <g>
      {/* Multi-Stage Pixel Rocket Exhaust Plume & Plasma Wake */}
      <rect x={-4} y={smokeY - 14} width={8} height={8} fill="#1E293B" opacity={0.65} />
      <rect x={-3} y={smokeY - 6} width={6} height={7} fill="#334155" opacity={0.8} />
      <rect x={-2} y={smokeY} width={4} height={6} fill="#64748B" opacity={0.9} />
      <rect x={-4} y={-17 - flameH} width={8} height={flameH} fill="#991B1B" opacity={0.8} />
      <rect x={-3} y={-17 - Math.round(flameH * 0.85)} width={6} height={Math.round(flameH * 0.85)} fill="#DC2626" />
      <rect x={-2} y={-17 - Math.round(flameH * 0.65)} width={4} height={Math.round(flameH * 0.65)} fill="#F97316" />
      <rect x={-1} y={-17 - Math.round(flameH * 0.4)} width={2} height={Math.round(flameH * 0.4)} fill="#FEF9C3" />

      {/* Crisp RLE-Cached Pixel Bomb Body */}
      <g transform="translate(-8, -17)">
        {renderPixelGridRle(PIXEL_NUKE_BOMB_ROWS, BOMB_PALETTE)}
      </g>

      {/* Pixel Mach Re-Entry Shockwave Cones at Nosecone */}
      <rect x={-8 - flickerFrame} y={11} width={3} height={1} fill="#FEF9C3" opacity={0.95} />
      <rect x={6 + flickerFrame} y={11} width={3} height={1} fill="#FEF9C3" opacity={0.95} />
      <rect x={-11 - flickerFrame} y={7} width={2} height={1} fill="#FACC15" opacity={0.85} />
      <rect x={9 + flickerFrame} y={7} width={2} height={1} fill="#FACC15" opacity={0.85} />
    </g>
  );
});

// 4x4 Ordered Bayer Dithering Matrix (normalized -0.5 .. +0.5) for authentic 32-bit arcade pixel shading
const BAYER_4X4 = [
  -0.46875, 0.03125, -0.34375, 0.15625,
  0.28125, -0.21875, 0.40625, -0.09375,
  -0.28125, 0.21875, -0.40625, 0.09375,
  0.46875, -0.03125, 0.34375, -0.15625,
];

function hexToAbgr(hex: string, alpha = 255): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return ((alpha & 0xff) << 24) | ((b & 0xff) << 16) | ((g & 0xff) << 8) | (r & 0xff);
}

// 16-Step 32-Bit Arcade Thermal Fire & Soot Palette (from dark soot rim -> blood crimson -> tangerine -> solar gold -> blinding white core)
const THERMAL_RAMP_HEX = [
  '#140607', // 0: deepest soot outline
  '#210B0D', // 1: dark ash shadow
  '#331114', // 2: heavy smoke charcoal
  '#4A1215', // 3: scorched umber-crimson
  '#691518', // 4: dark blood red
  '#8C1C1C', // 5: deep crimson fold
  '#B4251E', // 6: rich vermilion
  '#D9381E', // 7: scarlet flame
  '#EA580C', // 8: blazing orange
  '#F97316', // 9: tangerine fire
  '#FB923C', // 10: bright amber
  '#FACC15', // 11: solar gold
  '#FDE047', // 12: incandescent yellow
  '#FEF08A', // 13: pale lemon heat
  '#FEF9C3', // 14: white-gold plasma
  '#FFFFFF', // 15: pure nuclear core
];

const THERMAL_RAMP_ABGR = THERMAL_RAMP_HEX.map((h) => hexToAbgr(h, 255));
const OUTLINE_ABGR = hexToAbgr('#0D0304', 255);
const VAPOR_SHADOW_ABGR = hexToAbgr('#94A3B8', 220);
const VAPOR_MID_ABGR = hexToAbgr('#E2E8F0', 240);
const VAPOR_HIGHLIGHT_ABGR = hexToAbgr('#FFFFFF', 255);

function createNukeRng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CANVAS_W = 320;
const CANVAS_H = 180;
const GROUND_Y = 148;

interface CloudLobe {
  x: number;
  y: number;
  r: number;
  heatBias: number;
  lightDx: number;
  lightDy: number;
}

// High-Fidelity 32-Bit Arcade Volumetric Pixel Explosion Canvas (320x180 Bayer-Dithered Pixel Shader)
const HighFidelityPixelExplosionCanvas = React.memo(function HighFidelityPixelExplosionCanvas({
  detProgress,
  launchId,
}: {
  detProgress: number;
  launchId: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const densityBufRef = useRef<Float32Array | null>(null);
  const heatBufRef = useRef<Float32Array | null>(null);

  // Pre-seed organic lobe offsets & flying debris trajectories per launch
  const sceneSeeds = useMemo(() => {
    const rand = createNukeRng((launchId || 1) * 1597334677 + 91);

    // 26 Crown Cauliflower Lobes (arranged in 3 concentric tiers for authentic boiling mushroom cap)
    const crownSeeds = Array.from({ length: 26 }, (_, i) => {
      const tier = i < 7 ? 0 : i < 17 ? 1 : 2;
      const countInTier = tier === 0 ? 7 : tier === 1 ? 10 : 9;
      const idxInTier = tier === 0 ? i : tier === 1 ? i - 7 : i - 17;
      const normX = (idxInTier / Math.max(1, countInTier - 1)) * 2 - 1; // -1 .. +1
      return {
        tier,
        normX,
        jitterX: (rand() - 0.5) * 7,
        jitterY: (rand() - 0.5) * 5,
        radiusMul: 0.85 + rand() * 0.32,
        phase: rand() * Math.PI * 2,
        heatOffset: (rand() - 0.5) * 0.14,
      };
    });

    // 14 Stem Column Lobes (organic hourglass column + rising vortex puffs)
    const stemSeeds = Array.from({ length: 14 }, (_, i) => {
      const t = i / 13; // 0 (bottom) .. 1 (top neck)
      return {
        t,
        sideOffset: (i % 2 === 0 ? -1 : 1) * (2.5 + rand() * 5.5),
        radiusMul: 0.88 + rand() * 0.28,
        phase: rand() * Math.PI * 2,
      };
    });

    // 18 Rolling Pyroclastic Ground Surge Lobes (9 left, 9 right)
    const groundSeeds = Array.from({ length: 18 }, (_, i) => {
      const dir = i < 9 ? -1 : 1;
      const idx = i % 9;
      return {
        dir,
        idx,
        speedMul: 0.55 + (idx / 8) * 0.65 + (rand() - 0.5) * 0.1,
        radiusBase: 10 + (1 - idx / 9) * 8 + rand() * 4,
        bouncePhase: rand() * Math.PI * 2,
      };
    });

    // 36 Flying Burning Debris & Plasma Sparks with Pixel Smoke Trails
    const debris = Array.from({ length: 36 }, () => {
      const angle = -Math.PI * (0.12 + rand() * 0.76);
      const speed = 55 + rand() * 115;
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 55 + rand() * 45,
        size: rand() > 0.6 ? 2 : 1,
        hot: rand() > 0.35,
      };
    });

    return { crownSeeds, stemSeeds, groundSeeds, debris };
  }, [launchId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!densityBufRef.current) {
      densityBufRef.current = new Float32Array(CANVAS_W * CANVAS_H);
    }
    if (!heatBufRef.current) {
      heatBufRef.current = new Float32Array(CANVAS_W * CANVAS_H);
    }

    const densityBuf = densityBufRef.current;
    const heatBuf = heatBufRef.current;
    densityBuf.fill(0);
    heatBuf.fill(0);

    const imgData = ctx.createImageData(CANVAS_W, CANVAS_H);
    const out32 = new Uint32Array(imgData.data.buffer);

    // Quantize animation to 20fps pixel-art keyframe steps for authentic 32-bit arcade feel
    const p = Math.round(detProgress * 64) / 64;
    const rise = Math.min(1, Math.pow(p, 0.72) * 1.08);
    const cooling = Math.max(0, (p - 0.25) * 0.52);

    // Center of mushroom cap rises from ground zero (y=136) up to y=52
    const capCx = 160;
    const capCy = 136 - rise * 84;
    const capRx = 26 + rise * 48; // Horizontal spread of mushroom crown
    const capRy = 14 + rise * 22; // Vertical thickness of mushroom crown

    const lobes: CloudLobe[] = [];

    // 1. Initial Blinding Hemispherical Trinity Plasma Dome (p < 0.38)
    if (p < 0.38) {
      const domeT = p / 0.38;
      const domeR = 24 + domeT * 48;
      lobes.push({
        x: 160,
        y: GROUND_Y - domeT * 18,
        r: domeR,
        heatBias: 1.25 - domeT * 0.55,
        lightDx: 0,
        lightDy: -0.35,
      });
    }

    // 2. Towering Stem Column Lobes (hourglass curve from ground root to cap underside)
    const stemTopY = capCy + capRy * 0.35;
    const stemSpan = Math.max(8, GROUND_Y - stemTopY);
    for (const s of sceneSeeds.stemSeeds) {
      const sy = GROUND_Y - s.t * stemSpan;
      // Hourglass profile: wide at base (t=0), narrow at waist (t=0.55), flared at cap neck (t=1)
      const waistFactor = 1 - 0.42 * Math.sin(s.t * Math.PI);
      const scrollWave = Math.sin(p * 14 - s.t * 5 + s.phase) * 2.5;
      const sx = 160 + s.sideOffset * waistFactor + scrollWave;
      const sr = (11 + rise * 8) * waistFactor * s.radiusMul;
      // Stem is hottest in the central core and near the cap neck
      const stemHeat = 0.72 + (1 - Math.abs(s.sideOffset) / 8) * 0.28 - cooling * 0.45;
      lobes.push({
        x: sx,
        y: sy,
        r: sr,
        heatBias: stemHeat,
        lightDx: s.sideOffset > 0 ? -0.35 : 0.35,
        lightDy: -0.25,
      });
    }

    // 3. Cauliflower Mushroom Crown Lobes (3 tiers with toroidal roll animation)
    for (const c of sceneSeeds.crownSeeds) {
      const angle = c.normX * (Math.PI * 0.58);
      const tierYOffset = c.tier === 0 ? -capRy * 0.48 : c.tier === 1 ? 0 : capRy * 0.45;
      const tierWidthMul = c.tier === 0 ? 0.76 : c.tier === 1 ? 1.04 : 0.92;
      const rollBoil = Math.sin(p * 11 + c.phase) * 2.8;

      const lx =
        capCx +
        Math.sin(angle) * capRx * tierWidthMul +
        c.jitterX * (0.5 + rise * 0.5) +
        rollBoil * 0.6;
      const ly =
        capCy +
        tierYOffset +
        (1 - Math.cos(angle)) * capRy * 0.38 +
        c.jitterY +
        Math.cos(p * 11 + c.phase) * 2.0;

      const baseR = c.tier === 0 ? 15 : c.tier === 1 ? 18 : 14;
      const lr = baseR * (0.58 + rise * 0.52) * c.radiusMul;

      // Inner/upper lobes glow incandescent white-gold; outer/lower rim lobes cool into crimson & dark soot
      const distFromCore = Math.hypot((lx - capCx) / capRx, (ly - (capCy - 4)) / capRy);
      const crownHeat =
        1.08 - distFromCore * 0.36 + c.heatOffset - cooling * (c.tier === 2 ? 0.65 : 0.38);

      lobes.push({
        x: lx,
        y: ly,
        r: lr,
        heatBias: crownHeat,
        lightDx: -c.normX * 0.32,
        lightDy: c.tier === 2 ? 0.35 : -0.38,
      });
    }

    // 4. Rolling Pyroclastic Ground Surge Clouds (racing outward left & right)
    const surgeSpread = 16 + Math.pow(p, 0.78) * 122;
    for (const g of sceneSeeds.groundSeeds) {
      const gx = 160 + g.dir * surgeSpread * g.speedMul;
      const gy =
        GROUND_Y -
        2 -
        Math.abs(Math.sin(p * 9 + g.bouncePhase)) * 5 +
        (g.idx / 9) * 3;
      const gr = g.radiusBase * (0.65 + p * 0.55);
      const groundHeat = Math.max(0.22, 0.88 - (g.idx / 9) * 0.48 - cooling * 0.55);
      lobes.push({
        x: gx,
        y: gy,
        r: gr,
        heatBias: groundHeat,
        lightDx: -g.dir * 0.45,
        lightDy: -0.35,
      });
    }

    // Rasterize all volumetric cloud lobes into densityBuf & heatBuf
    for (let i = 0; i < lobes.length; i++) {
      const L = lobes[i];
      const r = L.r;
      if (r <= 1) continue;
      const invR = 1 / r;
      const minX = Math.max(1, Math.floor(L.x - r));
      const maxX = Math.min(CANVAS_W - 2, Math.ceil(L.x + r));
      const minY = Math.max(1, Math.floor(L.y - r));
      const maxY = Math.min(GROUND_Y + 8, Math.ceil(L.y + r));

      for (let y = minY; y <= maxY; y++) {
        const dy = (y - L.y) * invR;
        const dy2 = dy * dy;
        const rowOffset = y * CANVAS_W;
        for (let x = minX; x <= maxX; x++) {
          const dx = (x - L.x) * invR;
          const d2 = dx * dx + dy2;
          if (d2 >= 1) continue;

          // Smooth spherical falloff with 3D internal plasma shading toward core/light vector
          const falloff = 1 - d2;
          const weight = falloff * falloff;
          const directional = (dx * L.lightDx + dy * L.lightDy) * 0.45;
          const localHeat = (L.heatBias + falloff * 0.48 + directional) * weight;

          const idx = rowOffset + x;
          densityBuf[idx] += weight;
          heatBuf[idx] += localHeat;
        }
      }
    }

    // Pass 2: Convert densityBuf + heatBuf into Bayer-4x4 Dithered 32-Bit Pixel Art with 1px Dark Outline
    const CLOUD_THRESHOLD = 0.24;
    for (let y = 1; y < GROUND_Y + 6; y++) {
      const rowOffset = y * CANVAS_W;
      const bayerRow = (y & 3) << 2;
      for (let x = 1; x < CANVAS_W - 1; x++) {
        const idx = rowOffset + x;
        const dens = densityBuf[idx];
        if (dens < CLOUD_THRESHOLD) continue;

        // 1px crisp dark pixel-art outline around the outer silhouette and deep folds
        const isEdge =
          densityBuf[idx - 1] < CLOUD_THRESHOLD ||
          densityBuf[idx + 1] < CLOUD_THRESHOLD ||
          densityBuf[idx - CANVAS_W] < CLOUD_THRESHOLD ||
          densityBuf[idx + CANVAS_W] < CLOUD_THRESHOLD;

        if (isEdge) {
          out32[idx] = OUTLINE_ABGR;
          continue;
        }

        const avgHeat = heatBuf[idx] / dens;
        // Boost core brilliance where multiple lobes overlap tightly
        const coreBoost = Math.min(0.32, (dens - 0.8) * 0.14);
        const normHeat = Math.max(0, Math.min(1, (avgHeat + coreBoost - 0.32) / 1.15));

        const dither = BAYER_4X4[bayerRow | (x & 3)];
        const rampPos = normHeat * (THERMAL_RAMP_ABGR.length - 1) + dither * 1.15;
        const colorIdx = Math.max(
          1,
          Math.min(THERMAL_RAMP_ABGR.length - 1, Math.round(rampPos))
        );
        out32[idx] = THERMAL_RAMP_ABGR[colorIdx];
      }
    }

    // Pass 3: Double Wilson Vapor Condensation Rings (32-bit pixel dithered mist rings around stem & crown)
    if (p > 0.08 && p < 0.92) {
      const rings = [
        {
          cy: Math.round(stemTopY + 12),
          rx: Math.round(28 + p * 46),
          ry: 5,
        },
        {
          cy: Math.round(capCy - 4),
          rx: Math.round(38 + p * 58),
          ry: 6,
        },
      ];

      for (const ring of rings) {
        const minX = Math.max(2, 160 - ring.rx - 2);
        const maxX = Math.min(CANVAS_W - 3, 160 + ring.rx + 2);
        const minY = Math.max(2, ring.cy - ring.ry - 2);
        const maxY = Math.min(GROUND_Y - 2, ring.cy + ring.ry + 2);

        for (let y = minY; y <= maxY; y++) {
          const dy = (y - ring.cy) / ring.ry;
          const bayerRow = (y & 3) << 2;
          for (let x = minX; x <= maxX; x++) {
            const dx = (x - 160) / ring.rx;
            const ellip = Math.sqrt(dx * dx + dy * dy);
            // Front half of ring (dy >= -0.15) draws in front of cloud; back half only draws where air is clear
            const ringBand = 1 - Math.abs(ellip - 0.86) / 0.22;
            if (ringBand <= 0) continue;
            const dither = BAYER_4X4[bayerRow | (x & 3)];
            if (ringBand + dither * 0.45 < 0.35) continue;

            const idx = y * CANVAS_W + x;
            const inFront = dy >= -0.1;
            if (!inFront && densityBuf[idx] >= CLOUD_THRESHOLD) continue;

            out32[idx] =
              ringBand > 0.72
                ? VAPOR_HIGHLIGHT_ABGR
                : ringBand > 0.48
                  ? VAPOR_MID_ABGR
                  : VAPOR_SHADOW_ABGR;
          }
        }
      }
    }

    // Pass 4: Supersonic Spherical Shockwave Ring Expanding Across the Sky
    if (p < 0.65) {
      const shockT = p / 0.65;
      const shockRx = Math.round(24 + shockT * 155);
      const shockRy = Math.round(18 + shockT * 110);
      const shockCy = GROUND_Y - 12;

      for (let deg = 0; deg < 360; deg += 1) {
        const rad = (deg * Math.PI) / 180;
        const sx = Math.round(160 + Math.cos(rad) * shockRx);
        const sy = Math.round(shockCy + Math.sin(rad) * shockRy);
        if (sx < 1 || sx >= CANVAS_W - 1 || sy < 1 || sy >= GROUND_Y) continue;
        if ((sx + sy) % 2 === 0 || shockT < 0.35) {
          const idx = sy * CANVAS_W + sx;
          out32[idx] = shockT < 0.25 ? THERMAL_RAMP_ABGR[15] : THERMAL_RAMP_ABGR[12];
          if (sy > 2) {
            out32[(sy - 1) * CANVAS_W + sx] = THERMAL_RAMP_ABGR[9];
          }
        }
      }
    }

    // Pass 5: Scorched Ground Crater, Dithered Magma Fissures & Reflected Thermal Glow
    for (let y = GROUND_Y; y < CANVAS_H; y++) {
      const depth = (y - GROUND_Y) / (CANVAS_H - GROUND_Y);
      const bayerRow = (y & 3) << 2;
      const rowOffset = y * CANVAS_W;
      for (let x = 0; x < CANVAS_W; x++) {
        const idx = rowOffset + x;
        const distCenter = Math.abs(x - 160) / 160;
        const dither = BAYER_4X4[bayerRow | (x & 3)];

        // Glowing ground crater directly beneath the stem
        const craterHeat =
          (1 - distCenter * 1.25) * (1 - depth * 0.85) * (1.15 - cooling * 0.5) +
          dither * 0.18;

        // Lava fissure cracks radiating across the scorched ground
        const fissureWave = Math.sin(x * 0.28 + y * 0.65) * Math.cos(x * 0.11 - y * 0.4);
        const isFissure =
          fissureWave > 0.72 && distCenter < 0.45 + p * 0.45 && depth < 0.75;

        if (isFissure) {
          out32[idx] = distCenter < 0.25 ? THERMAL_RAMP_ABGR[13] : THERMAL_RAMP_ABGR[9];
        } else if (craterHeat > 0.12) {
          const cIdx = Math.max(
            0,
            Math.min(12, Math.round(craterHeat * 11))
          );
          out32[idx] = THERMAL_RAMP_ABGR[cIdx];
        } else {
          out32[idx] = OUTLINE_ABGR;
        }
      }
    }

    // Pass 6: Flying Burning Debris Chunks & Arcing Pixel Sparks
    for (let i = 0; i < sceneSeeds.debris.length; i++) {
      const d = sceneSeeds.debris[i];
      const t = p * 1.65;
      const dx = Math.round(160 + d.vx * t);
      const dy = Math.round(GROUND_Y - 8 + d.vy * t + 0.5 * d.gravity * t * t);
      if (dx < 2 || dx >= CANVAS_W - 2 || dy < 2 || dy >= GROUND_Y) continue;

      // Short pixel smoke/ember wake behind each flying debris chunk
      for (let tail = 3; tail >= 1; tail--) {
        const tt = Math.max(0, t - tail * 0.035);
        const tx = Math.round(160 + d.vx * tt);
        const ty = Math.round(GROUND_Y - 8 + d.vy * tt + 0.5 * d.gravity * tt * tt);
        if (tx >= 1 && tx < CANVAS_W - 1 && ty >= 1 && ty < GROUND_Y) {
          out32[ty * CANVAS_W + tx] =
            tail === 1 ? THERMAL_RAMP_ABGR[8] : THERMAL_RAMP_ABGR[3];
        }
      }

      const headColor = d.hot ? THERMAL_RAMP_ABGR[14] : THERMAL_RAMP_ABGR[10];
      out32[dy * CANVAS_W + dx] = headColor;
      if (d.size === 2) {
        out32[dy * CANVAS_W + (dx + 1)] = THERMAL_RAMP_ABGR[11];
        out32[(dy + 1) * CANVAS_W + dx] = THERMAL_RAMP_ABGR[7];
        out32[(dy + 1) * CANVAS_W + (dx + 1)] = OUTLINE_ABGR;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [detProgress, sceneSeeds]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ imageRendering: 'pixelated' }}
      className="absolute inset-0 w-full h-full pixelated pointer-events-none"
    />
  );
});

export const PixelTacticalNukeOverlay: React.FC<PixelTacticalNukeOverlayProps> = React.memo(({
  active,
  launchId = 0,
  startedAtMs = 0,
  country,
  sceneId,
  onClose,
  onRestartGame,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    if (!active || !country) {
      setElapsedMs(0);
      return;
    }

    let rafId = 0;
    const origin = startedAtMs > 0 ? startedAtMs : performance.now();
    setElapsedMs(Math.max(0, performance.now() - origin));

    const tick = (now: number) => {
      const dt = Math.max(0, now - origin);
      setElapsedMs(dt);
      if (dt <= 19500) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, country, launchId, startedAtMs]);

  if (!active || !country) return null;

  const displayName =
    country.id === 'north-korea' ? 'NORTH KOREA' : country.name.toUpperCase();

  const isOutdoorScene =
    sceneId === 'white-house-south-lawn' || sceneId === 'presidential-rally-stage';

  // Phase 0 (0ms..5000ms): DEFCON bar steps 5 -> 4 -> 3 -> 2 -> 1 every 1.0s (0.8s alarm + 0.2s gap)
  const isDefconEscalating = elapsedMs < DEFCON_INTRO_MS;
  const currentDefconIndex = isDefconEscalating
    ? Math.min(4, Math.floor(elapsedMs / DEFCON_STEP_MS))
    : 4; // Index 4 = DEFCON 1

  // Phase 1 (5000ms..10500ms): tactical-nuke.mp3 starts, siren pulses, bomb drops (8700ms..10500ms)
  // Phase 2 (10500ms+): Detonation impact!
  const isDetonated = elapsedMs >= DETONATION_MS;
  const detTimeMs = Math.max(0, elapsedMs - DETONATION_MS);
  const detProgress = Math.min(1, detTimeMs / 3400);
  const showGameOver = isDetonated && elapsedMs >= DETONATION_MS + 3700;

  // Red alarm strobe starts only after the 5.0s DEFCON bar finishes and tactical-nuke.mp3 begins
  const sirenPulse =
    !isDefconEscalating && !isDetonated
      ? 0.2 + 0.26 * Math.max(0, Math.sin(((elapsedMs - DEFCON_INTRO_MS) / 1000) * Math.PI * 2.2))
      : 0;

  // Descending high-fidelity pixel nuclear bomb (8700ms -> 10500ms)
  const warheadActive = elapsedMs >= BOMB_DROP_START_MS && elapsedMs < DETONATION_MS;
  const warheadProg = warheadActive
    ? Math.min(1, Math.max(0, (elapsedMs - BOMB_DROP_START_MS) / (DETONATION_MS - BOMB_DROP_START_MS)))
    : 0;
  const warheadDropCurve = Math.pow(warheadProg, 1.35);
  const warheadX = 120;
  const warheadY = Math.round(-22 + warheadDropCurve * 105);
  const bombFlickerFrame = Math.floor(elapsedMs / 55) % 2;

  // Blinding flash at detonation (10500ms -> 11200ms)
  const whiteFlashOpacity =
    elapsedMs >= DETONATION_MS && elapsedMs <= DETONATION_MS + 700
      ? Math.max(0, 1 - (elapsedMs - DETONATION_MS) / 700)
      : 0;

  // Heavy structural screen shake during explosion
  const shakeIntensity =
    elapsedMs >= DETONATION_MS && elapsedMs <= DETONATION_MS + 3350
      ? Math.max(0, 1 - (elapsedMs - DETONATION_MS) / 3350) * 14
      : 0;
  const shakeX =
    shakeIntensity > 0 ? Math.sin(elapsedMs * 0.11) * shakeIntensity : 0;
  const shakeY =
    shakeIntensity > 0 ? Math.cos(elapsedMs * 0.13) * shakeIntensity : 0;

  const countdownSec = Math.max(0, (DETONATION_MS - elapsedMs) / 1000).toFixed(1);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-[995] pointer-events-auto overflow-hidden select-none"
      style={{
        imageRendering: 'pixelated',
        transform:
          shakeIntensity > 0
            ? `translate(${shakeX.toFixed(1)}px, ${shakeY.toFixed(1)}px)`
            : undefined,
      }}
    >
      {/* 1. Klaxon Warning Red Screen Strobe (Starts after DEFCON reaches 1) */}
      {!isDefconEscalating && !isDetonated && (
        <div
          className="absolute inset-0 bg-red-600 pointer-events-none"
          style={{ opacity: sirenPulse }}
        />
      )}

      {/* 2. Detonation Thermal Sky Backdrop + Falling Pixel Bomb + 32-Bit Volumetric Pixel Mushroom Cloud */}
      {isDetonated && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isOutdoorScene
              ? showGameOver
                ? 'radial-gradient(circle at 50% 48%, rgba(185,28,28,0.88) 0%, rgba(127,29,29,0.94) 55%, rgba(28,6,6,0.98) 100%)'
                : 'radial-gradient(circle at 50% 54%, rgba(254,240,138,0.58) 0%, rgba(234,88,12,0.64) 38%, rgba(153,27,27,0.82) 74%, rgba(20,4,5,0.94) 100%)'
              : showGameOver
                ? 'radial-gradient(circle at 50% 48%, rgba(185,28,28,0.92) 0%, rgba(127,29,29,0.96) 55%, rgba(28,6,6,0.99) 100%)'
                : 'radial-gradient(circle at 50% 54%, rgba(254,240,138,0.72) 0%, rgba(220,38,38,0.82) 42%, rgba(127,29,29,0.90) 74%, rgba(20,4,5,0.96) 100%)',
          }}
        />
      )}

      {warheadActive && (
        <svg
          viewBox="0 0 240 135"
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
          className="absolute inset-0 w-full h-full pixelated pointer-events-none"
        >
          <g transform={`translate(${warheadX}, ${warheadY})`}>
            <HighFidelityPixelBomb flickerFrame={bombFlickerFrame} />
          </g>
        </svg>
      )}

      {isDetonated && (
        <HighFidelityPixelExplosionCanvas detProgress={detProgress} launchId={launchId} />
      )}

      {/* 3. Blinding White-Yellow Thermal Flash Curtain at Impact */}
      {whiteFlashOpacity > 0.01 && (
        <div
          className="absolute inset-0 bg-[#FEF9C3] pointer-events-none"
          style={{ opacity: whiteFlashOpacity }}
        />
      )}

      {/* 4. Simple, Clean High-Fidelity Pixel Top Bar (DEFCON Escalation Bar -> Incoming Nuke Plaque) */}
      {!showGameOver && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div
            className="relative bg-[#131B2E] px-4 py-2.5 flex flex-col items-center gap-2"
            style={{ boxShadow: PIXEL_PLAQUE_SHADOW }}
          >
            {/* 4 Corner Pixel Rivets (same as PixelDayHud) */}
            <span className="absolute top-1 left-1 w-1 h-1 bg-[#FEF08A]" />
            <span className="absolute top-1 right-1 w-1 h-1 bg-[#FEF08A]" />
            <span className="absolute bottom-1 left-1 w-1 h-1 bg-[#FEF08A]" />
            <span className="absolute bottom-1 right-1 w-1 h-1 bg-[#FEF08A]" />

            {/* High-Fidelity 5-Segment Pixel DEFCON Bar (steps 5 -> 4 -> 3 -> 2 -> 1 every 1.0s) */}
            <div className="flex items-center gap-1 bg-[#090D16] p-1 border-2 border-[#7C5318]">
              {DEFCON_STEPS.map((step, idx) => {
                const isLit = idx <= currentDefconIndex;
                const isCurrent = idx === currentDefconIndex;
                return (
                  <div
                    key={step.level}
                    className="px-2 py-1 font-mono font-bold text-[10px] tracking-wider uppercase transition-none"
                    style={{
                      backgroundColor: isLit ? step.activeBg : '#0F172A',
                      color: isLit ? step.textHex : '#475569',
                      boxShadow: isCurrent
                        ? `inset 1px 1px 0 0 ${step.activeBorder}, 0 0 0 1px #090D16`
                        : 'inset 1px 1px 0 0 #1E293B',
                    }}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>

            {/* Incoming Nuke Info Row (Appears once DEFCON 1 is reached at 5.0s and tactical-nuke.mp3 starts) */}
            {!isDefconEscalating && (
              <div className="flex items-center gap-3 pt-0.5">
                <div className="w-7 h-7 shrink-0 bg-[#0B101D] p-1 border-2 border-[#7C5318] flex items-center justify-center">
                  <PixelRadiationBadge className="w-full h-full" />
                </div>
                <PixelCountryFlag flag={country.flag} className="w-9 h-6" />
                <span className="font-mono font-bold text-xs sm:text-sm tracking-[0.1em] text-[#FEF08A] uppercase whitespace-nowrap drop-shadow-[1px_1px_0_#090D16]">
                  {isDetonated ? `${displayName} · IMPACT` : `${displayName} · NUKE INCOMING`}
                </span>
                {!isDetonated && (
                  <span className="px-2 py-0.5 bg-[#DC2626] border border-[#090D16] font-mono font-bold text-xs tabular-nums text-[#FEF08A]">
                    {countdownSec}S
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. High-Fidelity 32-Bit Pixel GAME OVER Modal */}
      {showGameOver && (
        <PixelGameOverModal
          emblem="nuke"
          subtitle="NUCLEAR STRIKE"
          incidentLabel="LAUNCHED BY"
          incidentValue={displayName}
          reasonValue="0% DIPLOMACY"
          portrait={<PixelCountryFlag flag={country.flag} className="w-10 h-7" />}
          headerStrip={
            <div className="flex items-center gap-1 bg-[#090D16] p-1 border-2 border-[#7C5318]">
              {DEFCON_STEPS.map((step) => {
                const isDefcon1 = step.level === 1;
                return (
                  <div
                    key={step.level}
                    className="px-2 py-0.5 font-mono font-bold text-[9px] tracking-wider uppercase"
                    style={{
                      backgroundColor: isDefcon1 ? '#DC2626' : '#0F172A',
                      color: isDefcon1 ? '#FEF08A' : '#334155',
                    }}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
          }
          onRestart={() => {
            if (onRestartGame) {
              onRestartGame();
            } else {
              onClose();
            }
          }}
        />
      )}
    </div>
  );
});
