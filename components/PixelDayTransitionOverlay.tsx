import React, { useEffect, useRef } from 'react';
import { renderPixelGridRle } from '../utils/pixelGridCache';

export interface DayTransitionState {
  active: boolean;
  mode?: 'inauguration' | 'sleep';
  fromDay: number;
  toDay: number;
  deliveredCount: number;
  headerText?: string;
  titleText?: string;
  subText?: string;
}

const PIXEL_FRAME_SHADOW = [
  'inset 2px 2px 0 0 #FDE047',
  'inset -2px -2px 0 0 #92400E',
  'inset 4px 4px 0 0 #B45309',
  'inset -4px -4px 0 0 #451A03',
  '0 0 0 2px #090D16',
  '0 0 0 4px #D97706',
  '0 0 0 6px #090D16',
  '0 20px 48px 10px rgba(0, 0, 0, 0.88)',
  '0 0 64px 4px rgba(234, 179, 8, 0.24)',
].join(', ');

const PIXEL_BAY_SHADOW = [
  'inset 0 6px 14px rgba(0, 0, 0, 0.85)',
  'inset 2px 2px 0 0 #04060B',
  'inset -2px -2px 0 0 #26324B',
  '0 0 0 2px #090D16',
  '0 3px 0 0 rgba(0, 0, 0, 0.55)',
].join(', ');

// Complete 5x7 Pixel Bitmap Font for crisp authentic bitmap titles ("DAY 1 BEGINS", "DAY 1 > DAY 2")
const PIXEL_FONT_5X7: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  '0': ['01110', '10011', '10101', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '11110', '10001', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '>': ['00100', '00110', '11111', '11111', '11111', '00110', '00100'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
};

function PixelBitmapBannerTitle({ text }: { text: string }) {
  const upper = text.toUpperCase();
  const pixels: { x: number; y: number; row: number }[] = [];
  let cursorX = 2;

  for (const ch of upper) {
    const glyph = PIXEL_FONT_5X7[ch] || PIXEL_FONT_5X7[' '];
    const width = glyph[0].length;
    glyph.forEach((rowStr, ry) => {
      for (let rx = 0; rx < width; rx++) {
        if (rowStr[rx] === '1') {
          pixels.push({ x: cursorX + rx, y: ry + 2, row: ry });
        }
      }
    });
    cursorX += width + 2;
  }

  const totalWidth = cursorX + 1;
  const outlineOffsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [1, 1],
    [1, 2],
    [0, 2],
  ];

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 12`}
      shapeRendering="crispEdges"
      aria-label={text}
      className="w-full max-w-[310px] h-auto pixelated mx-auto"
      style={{
        filter:
          'drop-shadow(0 2px 0 #05070C) drop-shadow(0 0 14px rgba(250, 204, 21, 0.48))',
      }}
    >
      {/* Full 1px arcade sprite outline & 2px deep drop shadow */}
      {pixels.map((p, i) =>
        outlineOffsets.map(([dx, dy], oi) => (
          <rect
            key={`ol-${i}-${oi}`}
            x={p.x + dx}
            y={p.y + dy}
            width={1}
            height={1}
            fill={dy === 2 ? '#05070C' : '#090D16'}
          />
        ))
      )}
      {/* 5-tone 32-bit vertical gold bevel fill */}
      {pixels.map((p, i) => {
        const fill =
          p.row === 0
            ? '#FFFFFF'
            : p.row === 1
              ? '#FEF08A'
              : p.row <= 3
                ? '#FACC15'
                : p.row === 4
                  ? '#EAB308'
                  : '#CA8A04';
        return <rect key={`fg-${i}`} x={p.x} y={p.y} width={1} height={1} fill={fill} />;
      })}
    </svg>
  );
}

function PixelCornerBracket({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const flipX = corner === 'tr' || corner === 'br' ? -1 : 1;
  const flipY = corner === 'bl' || corner === 'br' ? -1 : 1;
  const posClass =
    corner === 'tl'
      ? 'top-1 left-1'
      : corner === 'tr'
        ? 'top-1 right-1'
        : corner === 'bl'
          ? 'bottom-1 left-1'
          : 'bottom-1 right-1';

  return (
    <svg
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      className={`absolute ${posClass} w-3 h-3 pixelated pointer-events-none z-20`}
      style={{
        transform: `scale(${flipX}, ${flipY})`,
        filter: 'drop-shadow(1px 1px 0 #090D16)',
      }}
    >
      <rect x={0} y={0} width={7} height={2} fill="#FEF08A" />
      <rect x={0} y={2} width={2} height={5} fill="#FEF08A" />
      <rect x={2} y={2} width={2} height={2} fill="#F59E0B" />
      <rect x={4} y={2} width={2} height={1} fill="#B45309" />
      <rect x={2} y={4} width={1} height={2} fill="#B45309" />
    </svg>
  );
}

function PixelExecutiveRibbon() {
  return (
    <svg
      viewBox="0 0 120 4"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className="w-full h-1.5 pixelated border border-[#090D16] shadow-[0_2px_6px_rgba(0,0,0,0.65)]"
    >
      <rect x={0} y={0} width={120} height={4} fill="#090D16" />
      {Array.from({ length: 15 }).map((_, idx) => {
        const x = idx * 8;
        return (
          <g key={idx}>
            <rect x={x} y={0} width={4} height={4} fill="#1D4ED8" />
            <rect x={x + 1} y={0} width={3} height={2} fill="#60A5FA" />
            <rect x={x + 4} y={0} width={4} height={4} fill="#EAB308" />
            <rect x={x + 4} y={0} width={3} height={2} fill="#FEF08A" />
          </g>
        );
      })}
    </svg>
  );
}

const SPRITE_PALETTE: Record<string, string> = {
  '.': 'transparent',
  o: '#090D16',
  y: '#FACC15',
  w: '#FEF08A',
  a: '#EA580C',
  s: '#FFFFFF',
  e: '#CBD5E1',
  k: '#DC2626',
  B: '#1D4ED8',
  u: '#3B82F6',
  f: '#F2BE9A',
};

// 14x14 Pixel Sealed Policy Bill Scroll Sprite
const BILL_SEAL_SPRITE_14 = [
  '..ooooooooo...',
  '.ossssssssso..',
  '.oseeeeeeeso..',
  '.osoooooooeso.',
  '.oseeeeeeeso..',
  '.osooooeeeso..',
  '.oseeeeeeesoo.',
  '.oseeekkooeso.',
  '.oseekkkkkeso.',
  '.oseekywkkeso.',
  '.oseekkkkkeso.',
  '.oseeekkooeso.',
  '..oooooooooo..',
  '..............',
];

// 14x14 Pixel Trump Portrait / Sun Portrait
const TRUMP_PORTRAIT_14 = [
  '...oooooooo...',
  '..oyyyyyyywo..',
  '.oyywwwwwwyyo.',
  '.oyffffffffyo.',
  '.ofBsoffosBfo.',
  '.offffffffffo.',
  '..offkkkkffo..',
  '...oooooooo...',
  '..oBBBBBBBBo..',
  '.oBBBskksBBBo.',
  '.oBBBskksBBBo.',
  '.oBBBskksBBBo.',
  '..oooooooooo..',
  '..............',
];

const SUN_SPRITE_14 = [
  '......oo......',
  '..o..oyyo..o..',
  '..oyo.oo.oyo..',
  '...o.oyyo.o...',
  '.oo.oywwyo.oo.',
  'oyyooywwyooayo',
  '.oo.oywwyo.oo.',
  'oyyooywyyooayo',
  '.oo.oyyyyo.oo.',
  '...o.oyyo.o...',
  '..oao.oo.oao..',
  '..o..oaao..o..',
  '......oo......',
  '..............',
];

function PixelPlayChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" className="w-3.5 h-3.5 pixelated shrink-0">
      <rect x={2} y={1} width={2} height={10} fill="#090D16" />
      <rect x={4} y={2} width={2} height={8} fill="#090D16" />
      <rect x={6} y={3} width={2} height={6} fill="#090D16" />
      <rect x={8} y={4} width={2} height={4} fill="#090D16" />
      <rect x={10} y={5} width={1} height={2} fill="#090D16" />
    </svg>
  );
}

/**
 * 180x54 32-Bit Pixel Art Scene Diorama rendered inside the recessed monitor bay:
 * - 'inauguration': Oval Office Arched Windows at Golden Dawn, U.S. Flags, Resolute Desk & Trump entering with raised fist
 * - 'sleep': White House Sunrise over the North Portico, Rising Pixel Sunbeams & Waving U.S. Flag
 */
const PixelTransitionDioramaCanvas: React.FC<{ mode: 'inauguration' | 'sleep' }> = React.memo(
  ({ mode }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = 180;
      const H = 54;
      let rafId = 0;
      const startMs = performance.now();

      const BAYER_4X4 = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ];

      const drawDitherBand = (
        y0: number,
        y1: number,
        topHex: string,
        botHex: string
      ) => {
        const span = Math.max(1, y1 - y0);
        for (let y = y0; y < y1; y++) {
          const p = (y - y0) / span;
          ctx.fillStyle = topHex;
          ctx.fillRect(0, y, W, 1);
          ctx.fillStyle = botHex;
          const bRow = BAYER_4X4[y & 3];
          for (let x = 0; x < W; x++) {
            if (p > (bRow[x & 3] + 0.5) / 16) {
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      };

      const render = (now: number) => {
        const t = (now - startMs) / 1000;
        ctx.imageSmoothingEnabled = false;

        if (mode === 'inauguration') {
          drawDitherBand(0, 24, '#172554', '#1E3A8A');
          drawDitherBand(24, 38, '#1E3A8A', '#0F172A');

          ctx.fillStyle = '#78350F';
          ctx.fillRect(0, 36, W, 3);
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(0, 37, W, 1);
          drawDitherBand(39, H, '#1E3A8A', '#0F172A');

          ctx.fillStyle = '#FACC15';
          ctx.fillRect(34, 45, 112, 1);
          ctx.fillRect(28, 50, 124, 1);
          ctx.fillStyle = '#1D4ED8';
          ctx.fillRect(36, 46, 108, 4);

          const winCenters = [58, 90, 122];
          for (const wx of winCenters) {
            ctx.fillStyle = '#090D16';
            ctx.fillRect(wx - 10, 4, 20, 31);
            ctx.fillStyle = '#EAB308';
            ctx.fillRect(wx - 9, 5, 18, 29);
            ctx.fillStyle = '#38BDF8';
            ctx.fillRect(wx - 7, 7, 14, 13);
            ctx.fillStyle = '#BAE6FD';
            ctx.fillRect(wx - 7, 20, 14, 7);
            ctx.fillStyle = '#FEF08A';
            ctx.fillRect(wx - 7, 27, 14, 5);
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(wx, 7, 1, 25);
            ctx.fillRect(wx - 7, 15, 14, 1);
            ctx.fillRect(wx - 7, 23, 14, 1);
          }

          for (const dx of [38, 72, 108, 140]) {
            ctx.fillStyle = '#090D16';
            ctx.fillRect(dx - 4, 3, 8, 34);
            ctx.fillStyle = '#991B1B';
            ctx.fillRect(dx - 3, 4, 6, 32);
            ctx.fillStyle = '#DC2626';
            ctx.fillRect(dx - 2, 4, 2, 32);
            ctx.fillStyle = '#FACC15';
            ctx.fillRect(dx - 3, 22, 6, 2);
          }

          for (const fx of [22, 154]) {
            ctx.fillStyle = '#090D16';
            ctx.fillRect(fx, 5, 3, 33);
            ctx.fillStyle = '#FACC15';
            ctx.fillRect(fx + 1, 4, 1, 33);
            ctx.fillStyle = fx < 90 ? '#DC2626' : '#1D4ED8';
            ctx.fillRect(fx + 2, 7, 8, 13);
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(fx + 2, 9, 8, 1);
            ctx.fillRect(fx + 2, 12, 8, 1);
            ctx.fillRect(fx + 2, 15, 8, 1);
            ctx.fillStyle = '#1E3A8A';
            ctx.fillRect(fx + 2, 7, 4, 5);
          }

          const deskX = 64;
          const deskY = 32;
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillRect(deskX - 3, deskY + 16, 58, 4);

          ctx.fillStyle = '#090D16';
          ctx.fillRect(deskX - 1, deskY - 1, 54, 18);
          ctx.fillStyle = '#78350F';
          ctx.fillRect(deskX, deskY, 52, 16);
          ctx.fillStyle = '#92400E';
          ctx.fillRect(deskX + 2, deskY + 2, 48, 12);
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(deskX, deskY, 52, 2);
          ctx.fillStyle = '#B45309';
          ctx.fillRect(deskX + 2, deskY + 4, 48, 1);
          ctx.fillStyle = '#451A03';
          ctx.fillRect(deskX + 18, deskY + 5, 16, 10);
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(deskX + 22, deskY + 7, 8, 6);
          ctx.fillStyle = '#FEF08A';
          ctx.fillRect(deskX + 24, deskY + 8, 4, 4);

          ctx.fillStyle = '#090D16';
          ctx.fillRect(deskX + 6, deskY - 5, 12, 5);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(deskX + 7, deskY - 4, 10, 3);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(deskX + 11, deskY - 3, 3, 2);

          const bob = Math.round(Math.abs(Math.sin(t * 4.5)) * 2);
          const tx = 84;
          const ty = deskY - 16 - bob;
          ctx.fillStyle = '#090D16';
          ctx.fillRect(tx, ty, 12, 16);
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(tx + 1, ty + 1, 10, 4);
          ctx.fillStyle = '#FEF08A';
          ctx.fillRect(tx + 2, ty + 1, 8, 2);
          ctx.fillStyle = '#F2BE9A';
          ctx.fillRect(tx + 2, ty + 5, 8, 5);
          ctx.fillStyle = '#1E3A8A';
          ctx.fillRect(tx + 1, ty + 10, 10, 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(tx + 5, ty + 10, 2, 4);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(tx + 5, ty + 12, 2, 4);
          ctx.fillStyle = '#090D16';
          ctx.fillRect(tx + 11, ty + 3, 5, 8);
          ctx.fillStyle = '#F2BE9A';
          ctx.fillRect(tx + 12, ty + 4, 3, 3);
          ctx.fillStyle = '#1E3A8A';
          ctx.fillRect(tx + 12, ty + 7, 3, 3);
        } else {
          const riseP = Math.min(1, t / 1.4);
          drawDitherBand(0, 16, '#090D16', '#1E1B4B');
          drawDitherBand(16, 32, '#1E1B4B', '#9A3412');
          drawDitherBand(32, 45, '#9A3412', '#F59E0B');

          const sunY = Math.round(39 - riseP * 13);
          ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
          ctx.fillRect(62, sunY - 13, 56, 26);
          ctx.fillStyle = '#EA580C';
          ctx.fillRect(74, sunY - 8, 32, 16);
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(77, sunY - 6, 26, 12);
          ctx.fillStyle = '#FEF08A';
          ctx.fillRect(80, sunY - 4, 20, 9);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(84, sunY - 2, 12, 5);

          ctx.fillStyle = '#052E16';
          ctx.fillRect(0, 44, W, 10);
          ctx.fillStyle = '#14532D';
          ctx.fillRect(0, 45, W, 9);
          ctx.fillStyle = '#166534';
          ctx.fillRect(0, 47, W, 5);

          const whX = 42;
          const whY = 20;
          ctx.fillStyle = '#090D16';
          ctx.fillRect(whX - 1, whY + 5, 98, 20);
          ctx.fillRect(whX + 25, whY, 46, 25);

          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(whX, whY + 6, 96, 18);
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(whX + 26, whY + 2, 44, 22);

          ctx.fillStyle = '#090D16';
          ctx.fillRect(whX + 28, whY - 2, 40, 3);
          ctx.fillRect(whX + 34, whY - 4, 28, 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(whX + 30, whY - 1, 36, 2);
          ctx.fillRect(whX + 36, whY - 3, 24, 2);

          for (let i = 0; i < 6; i++) {
            const cx = whX + 30 + i * 7;
            ctx.fillStyle = '#94A3B8';
            ctx.fillRect(cx, whY + 5, 2, 18);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(cx, whY + 5, 1, 18);
          }

          for (const wx of [whX + 5, whX + 13, whX + 20, whX + 74, whX + 81, whX + 89]) {
            for (const wy of [whY + 9, whY + 15]) {
              ctx.fillStyle = '#090D16';
              ctx.fillRect(wx - 1, wy - 1, 5, 5);
              ctx.fillStyle = '#FACC15';
              ctx.fillRect(wx, wy, 3, 3);
              ctx.fillStyle = '#FEF08A';
              ctx.fillRect(wx, wy, 2, 2);
            }
          }

          const flagWave = Math.floor(t * 6) % 2;
          ctx.fillStyle = '#090D16';
          ctx.fillRect(89, whY - 12, 2, 9);
          ctx.fillStyle = '#CBD5E1';
          ctx.fillRect(90, whY - 11, 1, 8);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(91, whY - 11, 9, 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(91, whY - 9, 9, 1);
          ctx.fillRect(91, whY - 7, 9, 1);
          ctx.fillStyle = '#1E3A8A';
          ctx.fillRect(91, whY - 11, 4, 4);
          if (flagWave === 1) {
            ctx.fillStyle = '#DC2626';
            ctx.fillRect(99, whY - 10, 2, 5);
          }
        }

        const sp = Math.floor(t * 5) % 2;
        for (const [sx, sy] of [
          [12, 10],
          [168, 12],
          [18, 26],
          [162, 24],
        ]) {
          ctx.fillStyle = sp === 0 ? '#FEF08A' : '#FACC15';
          ctx.fillRect(sx, sy, 2, 2);
          if (sp === 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(sx - 1, sy, 4, 1);
            ctx.fillRect(sx, sy - 1, 1, 4);
          }
        }

        rafId = requestAnimationFrame(render);
      };

      render(startMs);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, [mode]);

    return (
      <canvas
        ref={canvasRef}
        width={180}
        height={54}
        style={{ imageRendering: 'pixelated' }}
        className="w-full h-[88px] sm:h-[98px] block pixelated"
      />
    );
  }
);

export const PixelDayTransitionOverlay: React.FC<{
  transition: DayTransitionState;
  onDismiss: () => void;
}> = React.memo(({ transition, onDismiss }) => {
  const isInauguration =
    transition.mode === 'inauguration' ||
    Boolean(transition.titleText && transition.titleText.includes('OVAL OFFICE'));

  const bitmapHeadline = isInauguration
    ? 'DAY 1 BEGINS'
    : `DAY ${transition.fromDay} > DAY ${transition.toDay}`;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onDismiss}
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 select-none cursor-pointer"
      style={{
        imageRendering: 'pixelated',
        background:
          'radial-gradient(circle at 50% 48%, rgba(217, 119, 6, 0.24) 0%, rgba(9, 13, 22, 0.82) 52%, rgba(3, 5, 10, 0.95) 100%)',
      }}
    >
      {/* Subtle Retro CRT Scanline Overlay across modal backdrop (same as Endgame) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 2px, transparent 2px, transparent 4px)',
        }}
      />

      {/* High-Fidelity 32-Bit Pixel Command Plaque with Top-Down Metallic Shader & Ambient Glow Shadow (same as Endgame) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="relative w-full max-w-[446px] p-4 sm:p-5 flex flex-col items-center gap-2.5 sm:gap-3 text-center cursor-pointer"
        style={{
          background:
            'linear-gradient(180deg, #1B2642 0%, #131B2E 48%, #0C1220 100%)',
          boxShadow: PIXEL_FRAME_SHADOW,
        }}
      >
        <PixelCornerBracket corner="tl" />
        <PixelCornerBracket corner="tr" />
        <PixelCornerBracket corner="bl" />
        <PixelCornerBracket corner="br" />

        {/* Stepped Pixel Presidential Ribbon */}
        <PixelExecutiveRibbon />

        {/* Centered Top Header Monitor Bay: Diorama Scene + 5x7 Bitmap Title */}
        <div
          className="w-full px-4 py-3 flex flex-col items-center justify-center text-center gap-2.5 relative overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at 50% 34%, rgba(234, 179, 8, 0.22) 0%, rgba(30, 58, 138, 0.16) 45%, #070B14 100%)',
            boxShadow: PIXEL_BAY_SHADOW,
          }}
        >
          {/* Subtle Diagonal Monitor Glass Specular Shader */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(132deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 28%, transparent 52%, rgba(0,0,0,0.28) 100%)',
            }}
          />

          {/* Subtle scanline texture inside header bay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)',
            }}
          />

          {/* Framed 32-Bit Animated Pixel Diorama Screen */}
          <div
            className="relative w-full bg-[#090D16] border-2 border-[#D97706] overflow-hidden"
            style={{
              boxShadow:
                'inset 1px 1px 0 0 #FEF08A, 0 0 0 2px #090D16, 0 6px 16px rgba(0,0,0,0.8), 0 0 20px rgba(234,179,8,0.32)',
            }}
          >
            <PixelTransitionDioramaCanvas mode={isInauguration ? 'inauguration' : 'sleep'} />
          </div>

          {/* Centered 5x7 Bitmap Headline */}
          <div className="relative w-full flex flex-col items-center justify-center text-center pt-0.5">
            <PixelBitmapBannerTitle text={bitmapHeadline} />
          </div>
        </div>

        {/* Clean Recessed Pixel Divider Bar */}
        <div
          className="w-full h-1 bg-[#090D16] flex items-center"
          style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.06)' }}
        >
          <span className="w-full h-0.5 bg-gradient-to-r from-[#090D16] via-[#B45309] to-[#090D16]" />
        </div>

        {/* Recessed Clock & Bills Plaque with Inner Depth Shading */}
        <div
          className="w-full p-2.5 sm:p-3 flex items-center justify-between gap-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0D1424 0%, #070B14 100%)',
            boxShadow: PIXEL_BAY_SHADOW,
          }}
        >
          <div className="flex items-center gap-3 min-w-0 text-left">
            <div
              className="w-12 h-11 bg-[#131B2E] border-2 border-[#7C5318] p-1.5 flex items-center justify-center shrink-0"
              style={{
                boxShadow:
                  'inset 1px 1px 0 0 #FDE047, 0 0 0 1px #090D16, 0 3px 6px rgba(0,0,0,0.65)',
              }}
            >
              <svg viewBox="0 0 14 14" shapeRendering="crispEdges" className="w-full h-full">
                {renderPixelGridRle(
                  isInauguration ? TRUMP_PORTRAIT_14 : SUN_SPRITE_14,
                  SPRITE_PALETTE
                )}
              </svg>
            </div>
            <div className="font-mono font-bold text-base sm:text-lg tracking-[0.1em] text-[#FEF08A] uppercase truncate drop-shadow-[1px_1px_0_#090D16]">
              09:00 AM
            </div>
          </div>

          <div
            className="border-2 border-[#22C55E] px-3 py-1.5 text-center shrink-0 flex items-center gap-2"
            style={{
              background: 'linear-gradient(180deg, #064E3B 0%, #022C22 100%)',
              boxShadow:
                'inset 1px 1px 0 0 #86EFAC, 0 0 0 1px #090D16, 0 2px 0 0 #090D16, 0 0 14px rgba(34,197,94,0.28)',
            }}
          >
            <div className="w-4 h-4 shrink-0">
              <svg viewBox="0 0 14 14" shapeRendering="crispEdges" className="w-full h-full">
                {renderPixelGridRle(BILL_SEAL_SPRITE_14, SPRITE_PALETTE)}
              </svg>
            </div>
            <div className="font-mono font-bold text-xs sm:text-sm tracking-[0.08em] text-[#FEF08A] uppercase drop-shadow-[1px_1px_0_#090D16]">
              +{transition.deliveredCount} NEW BILLS
            </div>
          </div>
        </div>

        {/* High-Fidelity 32-Bit Pixel Action Button with Specular Gradient & Cast Shadow */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            onDismiss();
          }}
          style={{
            background:
              'linear-gradient(180deg, #FDE047 0%, #EAB308 55%, #CA8A04 100%)',
            boxShadow: [
              'inset 2px 2px 0 0 #FEF9C3',
              'inset -2px -2px 0 0 #A16207',
              '0 0 0 2px #090D16',
              '0 4px 0 0 #090D16',
              '0 10px 22px rgba(0, 0, 0, 0.72)',
            ].join(', '),
          }}
          className="w-full mt-0.5 py-2.5 sm:py-3 px-4 hover:brightness-110 active:translate-y-0.5 text-[#090D16] font-mono font-bold text-xs sm:text-sm uppercase tracking-[0.15em] cursor-pointer flex items-center justify-center gap-2.5 transition-[filter,transform] duration-75"
        >
          <PixelPlayChevronIcon />
          <span>Begin Day {transition.toDay}</span>
        </button>
      </div>
    </div>
  );
});
