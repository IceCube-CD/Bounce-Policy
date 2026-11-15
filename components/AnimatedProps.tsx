import React, { useEffect, useState } from 'react';
import { AnimatedPropItem, PropKind } from '../types/engine';
import { renderPixelGridRle } from '../utils/pixelGridCache';

export const PROP_LIBRARY: Array<{
  kind: PropKind;
  label: string;
  defaultW: number;
  defaultH: number;
}> = [
  { kind: 'fire-flames', label: 'Fireplace Flames', defaultW: 3.55, defaultH: 11.8 },
  { kind: 'candle-flame', label: 'Mantel Candle Flame', defaultW: 1.6, defaultH: 4.5 },
  { kind: 'warm-glow', label: 'Warm Amber Glow', defaultW: 8.0, defaultH: 10.0 },
  { kind: 'emerald-glow', label: 'Emerald Lamp Glow', defaultW: 6.5, defaultH: 8.5 },
  { kind: 'clock-pendulum', label: 'Clock Pendulum', defaultW: 2.2, defaultH: 7.5 },
  { kind: 'sparkle-glint', label: 'Gold Crest Glint', defaultW: 2.8, defaultH: 4.5 },
];

const FIRE_PALETTE: Record<string, string> = {
  '.': 'transparent',
  c: '#291512',
  b: '#5C2214',
  r: '#991B1B',
  R: '#DC2626',
  o: '#EA580C',
  O: '#F97316',
  a: '#F59E0B',
  y: '#FDE047',
  w: '#FEF9C3',
};

const FLAME_FRAMES: string[][] = [
  [
    '.........w..........',
    '....................',
    '.......y............',
    '......ao............',
    '..............a.....',
    '.....oao............',
    '....RaaO.....r......',
    '....oOya....oa......',
    '...rOyyar..oao......',
    '...oOyyyo.oaOo......',
    '..rOyyyyooOyaO......',
    '..oOywwyOOyyya......',
    '.roaywwyaOyyyao.....',
    '.rOyywwyyayyyyar....',
    '.oOyywwyyyywwyyo....',
    '.oayywwwyywwwwyo....',
    'rOayywwwwywwwwyao...',
    'rOaywwwwwwwwwwyyr...',
    'roayywwwwwwwwyyyo...',
    'rROayyywwwwyyyOor...',
    '.roOaaayyyyyaaOor...',
    '.rbOoooaaaaaaoOcr...',
    '.ccbbbbroooobbbcc...',
    '..ccccccrrrrccccc...',
    '....................',
    '....................',
  ],
  [
    '..............w.....',
    '.......y............',
    '......a.............',
    '.............o......',
    '.....ro......a......',
    '.....oaO....ya......',
    '....rOya...oao......',
    '....oOyyo.OyaO......',
    '...roayyooOyyar.....',
    '...oOyyyyayyyyo.....',
    '..rOyywwyOyyyyao....',
    '..oOywwwyOyyyyyo....',
    '.rOaywwwyayywwyor...',
    '.oOyywwwwyywwwyyr...',
    '.oayywwwwywwwwyyo...',
    'roayywwwwwwwwwyyo...',
    'rOaywwwwwwwwwwyyr...',
    'rOayywwwwwwwwyyyo...',
    '.oOayywwwwwwyyyor...',
    '.rROayyywwyyyOoor...',
    '.rboOaaayyyaaaOcr...',
    '.ccbbbooooooobbbc...',
    '..cccccrrooorcccc...',
    '....................',
    '....................',
    '....................',
  ],
  [
    '....w...............',
    '....................',
    '............y.......',
    '.......a....o.......',
    '......oa............',
    '.....oay....r.......',
    '....rOya...oa.......',
    '....oOyyo.oao.......',
    '...rOyyyooOya.......',
    '..rOyyyyyOyyyo......',
    '..oOywwwyOyyyao.....',
    '.rOyywwwyayyyyor....',
    '.oOyywwwyayywwyo....',
    '.oayywwwwyywwwyor...',
    'rOayywwwwwwwwwyyo...',
    'rOaywwwwwwwwwwyyor..',
    'rOayywwwwwwwwyyyor..',
    '.oOayywwwwwwyyyoo...',
    '.rROayyywwyyyOoor...',
    '.rroOaaayyyaaOoor...',
    '.ccboooaaaaaaoobc...',
    '.ccbbbbrroooorbbc...',
    '..ccccccrrrrccccc...',
    '....................',
    '....................',
    '....................',
  ],
  [
    '...........w........',
    '....................',
    '....y...............',
    '............ao......',
    '......r....oao......',
    '.....oa....ya.......',
    '....rOao..oao.......',
    '...roOya.oOyo.......',
    '...oOyyyoOyyo.......',
    '..rOyyyyOyyyao......',
    '..oOywwyOyyyyor.....',
    '.rOaywwyayywwyo.....',
    '.oOyywwyayywwwyo....',
    '.oayywwwyywwwwyor...',
    'rOayywwwwwwwwwyyo...',
    'rOaywwwwwwwwwwyyr...',
    'roayywwwwwwwwyyyo...',
    '.oOayyywwwwyyyOor...',
    '.rROaaaawwaaaaOor...',
    '.rroOoooaaaaooOor...',
    '.ccbbbooooooobbbc...',
    '..cccccrrooorcccc...',
    '....................',
    '....................',
    '....................',
    '....................',
  ],
  [
    '........w...........',
    '.............y......',
    '......a.............',
    '.....o......ao......',
    '....ro.....ya.......',
    '....oao...oao.......',
    '...rOya..oOyo.......',
    '...oOyyo.Oyyar......',
    '..rOyyyyoOyyyo......',
    '..oOyywwOyyyyor.....',
    '.rOyywwwayyyyao.....',
    '.oOyywwwayywwyo.....',
    '.oayywwwyywwwyor....',
    'rOayywwwwwwwwyyo....',
    'rOaywwwwwwwwwwyyr...',
    'rOayywwwwwwwwyyyo...',
    '.oOayywwwwwwyyyor...',
    '.rROayyywwyyyOoor...',
    '.rroOaaayyyaaOoor...',
    '.rbboooaaaaaaoobc...',
    '.ccbbbbrroooorbbc...',
    '..ccccccrrrrccccc...',
    '....................',
    '....................',
    '....................',
    '....................',
  ],
  [
    '.............w......',
    '.....y..............',
    '..........a.........',
    '.....a....o.........',
    '....oa....yo........',
    '....oao..oao........',
    '...rOya.oOyo........',
    '..roOyyoOyyar.......',
    '..oOyyyyOyyyo.......',
    '..oOyywwOyyyao......',
    '.rOyywwwayyyyor.....',
    '.oOyywwwayywwyo.....',
    '.oayywwwyywwwyor....',
    'rOayywwwwwwwwyyo....',
    'rOaywwwwwwwwwwyyr...',
    'rOayywwwwwwwwyyyo...',
    '.oOayywwwwwwyyyor...',
    '.rROayyywwyyyOoor...',
    '.rroOaaayyyaaOoor...',
    '.ccboooaaaaaaoobc...',
    '.ccbbbbrroooorbbc...',
    '..ccccccrrrrccccc...',
    '....................',
    '....................',
    '....................',
    '....................',
  ],
];

const CANDLE_FRAMES: string[][] = [
  [
    '....w...',
    '...ay...',
    '..oayo..',
    '..aywo..',
    '..aywo..',
    '...oo...',
    '...ww...',
    '...wc...',
    '...wc...',
    '...cc...',
    '..gggg..',
    '........',
  ],
  [
    '...w....',
    '...ya...',
    '..oayo..',
    '..owyo..',
    '..aywo..',
    '...oo...',
    '...ww...',
    '...wc...',
    '...wc...',
    '...cc...',
    '..gggg..',
    '........',
  ],
  [
    '.....w..',
    '...ay...',
    '..oayo..',
    '..aywo..',
    '..owyo..',
    '...oo...',
    '...ww...',
    '...wc...',
    '...wc...',
    '...cc...',
    '..gggg..',
    '........',
  ],
];

const PENDULUM_PALETTE: Record<string, string> = {
  '.': 'transparent',
  o: '#1A120B',
  g: '#B47B09',
  y: '#FACC15',
  w: '#FEF08A',
};

const PENDULUM_FRAMES: string[][] = [
  [
    '....oo....',
    '....og....',
    '...ogy....',
    '...og.....',
    '..ogy.....',
    '..og......',
    '.ogy......',
    '.oyyo.....',
    'oywyyo....',
    'oyggyo....',
    '.oooo.....',
    '..........',
  ],
  [
    '....oo....',
    '....og....',
    '....og....',
    '....ogy...',
    '....og....',
    '....ogy...',
    '....og....',
    '...oyyo...',
    '..oywyyo..',
    '..oyggyo..',
    '...oooo...',
    '..........',
  ],
  [
    '....oo....',
    '....go....',
    '....ygo...',
    '.....go...',
    '....ygo...',
    '.....go...',
    '.....ygo..',
    '....oyyo..',
    '...oywyyo.',
    '...oyggyo.',
    '....oooo..',
    '..........',
  ],
  [
    '....oo....',
    '....og....',
    '....og....',
    '....ogy...',
    '....og....',
    '....ogy...',
    '....og....',
    '...oyyo...',
    '..oywyyo..',
    '..oyggyo..',
    '...oooo...',
    '..........',
  ],
];

const SPARKLE_FRAMES: string[][] = [
  [
    '........',
    '........',
    '....y...',
    '...ywy..',
    '....y...',
    '........',
    '........',
    '........',
  ],
  [
    '........',
    '....y...',
    '..y.w.y.',
    '.ywwwwwy',
    '..y.w.y.',
    '....y...',
    '........',
    '........',
  ],
  [
    '........',
    '........',
    '....a...',
    '...aya..',
    '....a...',
    '........',
    '........',
    '........',
  ],
  [
    '........',
    '........',
    '........',
    '........',
    '........',
    '........',
    '........',
    '........',
  ],
];

const EXTRA_PALETTE: Record<string, string> = {
  ...FIRE_PALETTE,
  ...PENDULUM_PALETTE,
  w: '#FEF9C3',
  g: '#D97706',
};

export const AnimatedPropRenderer: React.FC<{ item: AnimatedPropItem }> = React.memo(({ item }) => {
  const [frame, setFrame] = useState(0);
  const speed = item.speed ?? 1;

  useEffect(() => {
    const baseMs =
      item.kind === 'clock-pendulum' ? 320 : item.kind === 'sparkle-glint' ? 240 : 115;
    const ms = Math.max(45, Math.round(baseMs / Math.max(0.25, speed)));
    const interval = setInterval(() => {
      setFrame((f) => f + 1);
    }, ms);
    return () => clearInterval(interval);
  }, [item.kind, speed]);

  if (item.visible === false) return null;

  const transformParts: string[] = [];
  if (item.skewY) transformParts.push(`skewY(${item.skewY}deg)`);
  if (item.flipX) transformParts.push('scaleX(-1)');
  const transformCss = transformParts.length ? transformParts.join(' ') : undefined;

  const crop = item.crop;
  const clipPathCss =
    crop && (crop.top > 0 || crop.right > 0 || crop.bottom > 0 || crop.left > 0)
      ? `inset(${crop.top}% ${crop.right}% ${crop.bottom}% ${crop.left}%)`
      : undefined;

  const renderInner = () => {
    if (item.kind === 'warm-glow') {
      return (
        <div className="w-full h-full pointer-events-none" style={{ transform: transformCss }}>
          <div
            className="w-full h-full rounded-full transition-opacity duration-150"
            style={{
              background:
                'radial-gradient(circle, rgba(253,224,71,0.52) 0%, rgba(251,146,60,0.38) 42%, rgba(251,146,60,0.12) 68%, transparent 100%)',
              opacity: frame % 2 === 0 ? 0.92 : 0.65,
            }}
          />
        </div>
      );
    }

    if (item.kind === 'emerald-glow') {
      return (
        <div className="w-full h-full pointer-events-none" style={{ transform: transformCss }}>
          <div
            className="w-full h-full rounded-full transition-opacity duration-300"
            style={{
              background:
                'radial-gradient(circle, rgba(74,222,128,0.55) 0%, rgba(16,185,129,0.28) 45%, rgba(16,185,129,0.08) 72%, transparent 100%)',
              opacity: frame % 2 === 0 ? 0.9 : 0.62,
            }}
          />
        </div>
      );
    }

    if (item.kind === 'fire-flames') {
      const grid = FLAME_FRAMES[frame % FLAME_FRAMES.length];
      return (
        <div className="relative w-full h-full pointer-events-none" style={{ transform: transformCss }}>
          <div
            className="absolute -left-[180%] -right-[35%] -top-[25%] -bottom-[35%] rounded-full transition-opacity duration-100"
            style={{
              background:
                'radial-gradient(ellipse at 65% 58%, rgba(251,146,60,0.42) 0%, rgba(234,88,12,0.18) 45%, transparent 78%)',
              opacity: frame % 2 === 0 ? 0.95 : 0.72,
            }}
          />
          <svg
            viewBox="0 0 20 26"
            shapeRendering="crispEdges"
            className="relative w-full h-full drop-shadow-[0_0_4px_rgba(251,146,60,0.65)]"
          >
            {renderPixelGridRle(grid, FIRE_PALETTE)}
          </svg>
        </div>
      );
    }

    if (item.kind === 'candle-flame') {
      const grid = CANDLE_FRAMES[frame % CANDLE_FRAMES.length];
      return (
        <div className="relative w-full h-full pointer-events-none" style={{ transform: transformCss }}>
          <div
            className="absolute -inset-[80%] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(253,224,71,0.36) 0%, rgba(245,158,11,0.12) 55%, transparent 90%)',
              opacity: frame % 2 === 0 ? 0.9 : 0.7,
            }}
          />
          <svg viewBox="0 0 8 12" shapeRendering="crispEdges" className="relative w-full h-full">
            {renderPixelGridRle(grid, EXTRA_PALETTE)}
          </svg>
        </div>
      );
    }

    if (item.kind === 'clock-pendulum') {
      const grid = PENDULUM_FRAMES[frame % PENDULUM_FRAMES.length];
      return (
        <div className="relative w-full h-full pointer-events-none" style={{ transform: transformCss }}>
          <svg viewBox="0 0 10 12" shapeRendering="crispEdges" className="w-full h-full">
            {renderPixelGridRle(grid, PENDULUM_PALETTE)}
          </svg>
        </div>
      );
    }

    const grid = SPARKLE_FRAMES[frame % SPARKLE_FRAMES.length];
    return (
      <div className="relative w-full h-full pointer-events-none" style={{ transform: transformCss }}>
        <svg viewBox="0 0 8 8" shapeRendering="crispEdges" className="w-full h-full">
          {renderPixelGridRle(grid, EXTRA_PALETTE)}
        </svg>
      </div>
    );
  };

  return (
    <div
      className="w-full h-full pointer-events-none"
      style={clipPathCss ? { clipPath: clipPathCss } : undefined}
    >
      {renderInner()}
    </div>
  );
});
