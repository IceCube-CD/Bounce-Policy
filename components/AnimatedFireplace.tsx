import React, { useEffect, useState } from 'react';
import { renderPixelGridRle } from '../utils/pixelGridCache';

interface AnimatedFireplaceProps {
  variant?: 'east' | 'north';
}

// High-fidelity 8-tone 32-bit fire & ember palette
const FIRE_PALETTE: Record<string, string> = {
  '.': 'transparent',
  c: '#291512', // charred log dark
  b: '#5C2214', // glowing log bark
  r: '#991B1B', // deep crimson flame edge
  R: '#DC2626', // bright scarlet flame
  o: '#EA580C', // rich fire orange
  O: '#F97316', // vivid tangerine
  a: '#F59E0B', // warm amber
  y: '#FDE047', // bright yellow flame core
  w: '#FEF9C3', // white-hot incandescent core
};

// 20 columns x 26 rows: 6 smooth looping frames with rising embers & dancing tongues
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

export const AnimatedFireplace: React.FC<AnimatedFireplaceProps> = React.memo(({ variant = 'east' }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % FLAME_FRAMES.length);
    }, 115);
    return () => clearInterval(interval);
  }, []);

  const grid = FLAME_FRAMES[frame];

  if (variant === 'north') {
    // Subtle flickering ember glow peeking from the north hearth behind the chair
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: '47.8%',
          top: '27.1%',
          width: '4.4%',
          height: '4.2%',
        }}
      >
        <div
          className="w-full h-full rounded-full transition-opacity duration-100"
          style={{
            background:
              'radial-gradient(circle, rgba(253,224,71,0.48) 0%, rgba(251,146,60,0.4) 45%, transparent 90%)',
            opacity: frame % 2 === 0 ? 0.92 : 0.68,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '85.35%',
        top: '55.4%',
        width: '3.55%',
        height: '11.8%',
      }}
    >
      {/* Warm flickering ambient firelight spilled onto the marble hearth & parquet floor */}
      <div
        className="absolute -left-[195%] -right-[35%] -top-[25%] -bottom-[38%] rounded-full transition-opacity duration-100"
        style={{
          background:
            'radial-gradient(ellipse at 65% 58%, rgba(251,146,60,0.42) 0%, rgba(234,88,12,0.18) 45%, transparent 78%)',
          opacity: frame % 2 === 0 ? 0.95 : 0.72,
        }}
      />

      {/* Crisp 20x26 High-Fidelity Pixel Flame Sprite */}
      <svg
        viewBox="0 0 20 26"
        shapeRendering="crispEdges"
        className="relative w-full h-full drop-shadow-[0_0_4px_rgba(251,146,60,0.65)]"
      >
        {renderPixelGridRle(grid, FIRE_PALETTE)}
      </svg>
    </div>
  );
});
