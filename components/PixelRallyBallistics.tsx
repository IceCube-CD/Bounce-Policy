import React, { useEffect, useState } from 'react';
import { renderPixelGridRle } from '../utils/pixelGridCache';

interface PixelRallyBallisticsProps {
  active: boolean;
}

// 32-Bit Pixel Ballistics Palette (Copper/Brass Jacket + Hot Tracer + Muzzle Flash + Crimson Graze)
const BALLISTICS_PALETTE: Record<string, string> = {
  '.': 'transparent',
  o: '#18181B', // dark crisp pixel outline
  W: '#FFFFFF', // incandescent white tip/core
  w: '#FEF9C3', // hot cream
  y: '#FEF08A', // bright tracer gold
  Y: '#FACC15', // rich brass/gold highlight
  O: '#F97316', // vivid orange flame
  c: '#EA580C', // copper jacket mid
  C: '#9A3412', // dark shaded copper
  r: '#DC2626', // muzzle flash outer crimson
  s: '#CBD5E1', // hot gunsmoke highlight
  g: '#64748B', // gunsmoke shadow
};

// High-Detail 9x20 32-Bit Pixel Sniper Bullet Sprite (pointing UP; rotated along flight angle)
const PIXEL_BULLET_SPRITE: string[] = [
  '....o....',
  '...oWo...',
  '...owWo..',
  '..oWwYo..',
  '..oYwYo..',
  '.oYYcCCo.',
  '.oYccCCo.',
  '.oYccCCo.',
  '.oYccCCo.',
  '.oYYcCCo.',
  '.oYccCCo.',
  '..oYYYo..',
  '..oOYOo..',
  '..oOYOo..',
  '...OyO...',
  '...oOo...',
  '....O....',
  '....y....',
  '....w....',
  '.........',
];

// High-Detail 19x13 32-Bit Pixel Muzzle Flash & Gunsmoke Puff Sprite at Front Edge
const PIXEL_MUZZLE_SPRITE: string[] = [
  '.........w.........',
  '........wWw........',
  '.....y..wWw..y.....',
  '....yO.wWWWw.Oy....',
  '..r..OywWWWyO..r...',
  '...rOYwWWWWwYOr....',
  '.s..rOYwWWWwYOr..s.',
  'gs.rOOYwWWwYOOOr.sg',
  '.ggrOOYYwWwYYOOrgg.',
  '..grrOOYYYYYOOrrg..',
  '...drrOOOOOOOrrd...',
  '....rrroooooorr....',
  '.....rrrrrrrrr.....',
];

const MUZZLE_PALETTE: Record<string, string> = {
  ...BALLISTICS_PALETTE,
  d: '#7F1D1D',
};

// Single high-velocity sniper shot (coordinates in 320x180 crisp 32-bit pixel grid)
const SINGLE_SHOT = {
  travelDurationMs: 115,
  startX: 126.4, // 39.5% of 320
  startY: 180,   // bottom front edge
  impactX: 155.8, // 48.7% of 320 (Trump's right ear)
  impactY: 58.7,  // 32.6% of 180
  endX: 165.1,    // 51.6% of 320
  endY: 18.9,     // 10.5% of 180
};

const SHOT_DX = SINGLE_SHOT.endX - SINGLE_SHOT.startX;
const SHOT_DY = SINGLE_SHOT.endY - SINGLE_SHOT.startY;
const SHOT_ANGLE_DEG = (Math.atan2(SHOT_DX, -SHOT_DY) * 180) / Math.PI;

export const PixelRallyBallistics: React.FC<PixelRallyBallisticsProps> = React.memo(({ active }) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      return;
    }

    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const dt = now - start;
      setElapsedMs(dt);
      if (dt <= 920) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  if (!active) return null;

  const travelProg = Math.min(1, elapsedMs / SINGLE_SHOT.travelDurationMs);
  const isProjectileInFlight = elapsedMs <= SINGLE_SHOT.travelDurationMs + 30;

  const currX = SINGLE_SHOT.startX + SHOT_DX * travelProg;
  const currY = SINGLE_SHOT.startY + SHOT_DY * travelProg;

  // Stepped supersonic vapor wake lingering cleanly for ~420ms
  const wakeOpacity =
    elapsedMs < SINGLE_SHOT.travelDurationMs
      ? 0.85
      : Math.max(0, 0.85 * (1 - (elapsedMs - SINGLE_SHOT.travelDurationMs) / 420));

  // Crisp pixel muzzle flash at front-bottom barrel origin (first 95ms)
  const muzzleFlashOpacity = elapsedMs <= 95 ? Math.max(0, 1 - elapsedMs / 95) : 0;

  // Impact occurs when round reaches Trump's right ear (~75% of flight)
  const impactDelay = SINGLE_SHOT.travelDurationMs * 0.75;
  const impactT = elapsedMs - impactDelay;
  const showImpact = impactT >= 0 && impactT <= 380;
  const impactProgress = showImpact ? Math.min(1, impactT / 380) : 0;
  const impactAlpha = showImpact ? Math.max(0, 1 - impactProgress * 0.92) : 0;

  // Build crisp stepped 32-bit pixel trail segments along flight path
  const trailSteps = 18;
  const wakeDriftX = Math.max(0, elapsedMs - SINGLE_SHOT.travelDurationMs) * 0.008;

  return (
    <div className="absolute inset-0 z-[990] pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 320 180"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="w-full h-full pixelated"
      >
        {/* 1. Crisp 32-Bit Pixel Muzzle Flash & Gunsmoke Puff at Front Bottom Edge */}
        {muzzleFlashOpacity > 0.02 && (
          <g
            transform={`translate(${Math.round(SINGLE_SHOT.startX)}, 179) rotate(${SHOT_ANGLE_DEG.toFixed(1)}) scale(1.25) translate(-9.5, -13)`}
            opacity={muzzleFlashOpacity}
          >
            {renderPixelGridRle(PIXEL_MUZZLE_SPRITE, MUZZLE_PALETTE)}
          </g>
        )}

        {/* 2. Stepped Pixel Supersonic Vapor & Tracer Wake */}
        {wakeOpacity > 0.02 && (
          <g opacity={wakeOpacity}>
            {Array.from({ length: trailSteps }, (_, idx) => {
              const t = (idx + 1) / trailSteps;
              if (t > travelProg) return null;
              const wx = Math.round(SINGLE_SHOT.startX + SHOT_DX * t + wakeDriftX * t);
              const wy = Math.round(SINGLE_SHOT.startY + SHOT_DY * t);
              const isHot = idx >= trailSteps - 5;
              return (
                <React.Fragment key={`wake-${idx}`}>
                  <rect
                    x={wx - 1}
                    y={wy}
                    width={2}
                    height={2}
                    fill={isHot ? '#FEF08A' : '#CBD5E1'}
                    opacity={isHot ? 0.72 : 0.42}
                  />
                  <rect
                    x={wx}
                    y={wy - 1}
                    width={1}
                    height={2}
                    fill="#FFFFFF"
                    opacity={0.75}
                  />
                </React.Fragment>
              );
            })}
          </g>
        )}

        {/* 3. High-Fidelity 32-Bit Pixel Copper/Brass Bullet + Supersonic Mach Pixels */}
        {isProjectileInFlight && (
          <g
            transform={`translate(${Math.round(currX)}, ${Math.round(currY)}) rotate(${SHOT_ANGLE_DEG.toFixed(1)})`}
          >
            {/* Supersonic stepped Mach V-cone pixels flanking bullet nose */}
            <rect x={-5} y={-2} width={1} height={2} fill="#F8FAFC" opacity={0.65} />
            <rect x={-4} y={-4} width={1} height={2} fill="#FFFFFF" opacity={0.8} />
            <rect x={4} y={-2} width={1} height={2} fill="#F8FAFC" opacity={0.65} />
            <rect x={3} y={-4} width={1} height={2} fill="#FFFFFF" opacity={0.8} />
            {/* Crisp RLE-Cached 9x20 32-Bit Pixel Bullet Sprite */}
            <g transform="translate(-4.5, -10) scale(0.95)">
              {renderPixelGridRle(PIXEL_BULLET_SPRITE, BALLISTICS_PALETTE)}
            </g>
          </g>
        )}

        {/* 4. Crisp Pixel Ear-Graze Impact Flash, Stepped Shockwave & Crimson Droplets */}
        {showImpact && (
          <g opacity={impactAlpha}>
            {/* Stepped pixel shockwave diamond around ear */}
            {(() => {
              const r = Math.round(2 + impactProgress * 7);
              const ix = Math.round(SINGLE_SHOT.impactX);
              const iy = Math.round(SINGLE_SHOT.impactY);
              return (
                <g opacity={0.8 * (1 - impactProgress)}>
                  <rect x={ix - r} y={iy - 1} width={1} height={2} fill="#FFFFFF" />
                  <rect x={ix + r} y={iy - 1} width={1} height={2} fill="#FFFFFF" />
                  <rect x={ix - 1} y={iy - r} width={2} height={1} fill="#FFFFFF" />
                  <rect x={ix - 1} y={iy + r} width={2} height={1} fill="#FFFFFF" />
                  <rect x={ix - Math.round(r * 0.7)} y={iy - Math.round(r * 0.7)} width={1} height={1} fill="#FEF08A" />
                  <rect x={ix + Math.round(r * 0.7)} y={iy - Math.round(r * 0.7)} width={1} height={1} fill="#FEF08A" />
                  <rect x={ix - Math.round(r * 0.7)} y={iy + Math.round(r * 0.7)} width={1} height={1} fill="#FEF08A" />
                  <rect x={ix + Math.round(r * 0.7)} y={iy + Math.round(r * 0.7)} width={1} height={1} fill="#FEF08A" />
                </g>
              );
            })()}

            {/* Brief incandescent pixel snap flash */}
            {impactT < 85 && (
              <g>
                <rect
                  x={Math.round(SINGLE_SHOT.impactX - 2)}
                  y={Math.round(SINGLE_SHOT.impactY - 2)}
                  width={4}
                  height={4}
                  fill="#FEF08A"
                />
                <rect
                  x={Math.round(SINGLE_SHOT.impactX - 1)}
                  y={Math.round(SINGLE_SHOT.impactY - 1)}
                  width={2}
                  height={2}
                  fill="#FFFFFF"
                />
              </g>
            )}

            {/* Pixelated crimson ear-graze blood droplets spraying outward */}
            <rect
              x={Math.round(SINGLE_SHOT.impactX - 1 - impactProgress * 5.5)}
              y={Math.round(SINGLE_SHOT.impactY - 1 - impactProgress * 2.5)}
              width={2}
              height={2}
              fill="#DC2626"
            />
            <rect
              x={Math.round(SINGLE_SHOT.impactX - 2 - impactProgress * 7.5)}
              y={Math.round(SINGLE_SHOT.impactY + 1 + impactProgress * 2.0)}
              width={1}
              height={2}
              fill="#991B1B"
            />
            <rect
              x={Math.round(SINGLE_SHOT.impactX - impactProgress * 3.5)}
              y={Math.round(SINGLE_SHOT.impactY - 2 - impactProgress * 4.5)}
              width={1}
              height={1}
              fill="#EF4444"
            />
            <rect
              x={Math.round(SINGLE_SHOT.impactX + 1 - impactProgress * 2.0)}
              y={Math.round(SINGLE_SHOT.impactY + 1 + impactProgress * 3.0)}
              width={2}
              height={1}
              fill="#B91C1C"
            />
          </g>
        )}
      </svg>
    </div>
  );
});
