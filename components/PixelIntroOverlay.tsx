import React, { useCallback, useEffect, useRef, useState } from 'react';

interface PixelIntroOverlayProps {
  onStartGame: () => void;
}

const PIXEL_FONT_5X7: Record<string, string[]> = {
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  ' ': ['00', '00', '00', '00', '00', '00', '00'],
};

const STARTUP_AUDIO_URL = './audio/game_startup.mp3';

let rawStartupArrayBuffer: ArrayBuffer | null = null;
let cachedStartupBuffer: AudioBuffer | null = null;

if (typeof window !== 'undefined') {
  fetch(STARTUP_AUDIO_URL)
    .then((res) => res.arrayBuffer())
    .then((buf) => {
      rawStartupArrayBuffer = buf;
      const OfflineCtx =
        window.OfflineAudioContext ||
        (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
          .webkitOfflineAudioContext;
      if (OfflineCtx) {
        return new OfflineCtx(2, 44100, 44100).decodeAudioData(buf.slice(0));
      }
      return null;
    })
    .then((decoded) => {
      if (decoded) cachedStartupBuffer = decoded;
    })
    .catch(() => {});
}

function playStartupChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (AudioCtx && (cachedStartupBuffer || rawStartupArrayBuffer)) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const playDecoded = (buffer: AudioBuffer) => {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.92, ctx.currentTime);
        src.connect(gain);
        gain.connect(ctx.destination);
        src.onended = () => {
          ctx.close().catch(() => {});
        };
        src.start(0);
      };

      if (cachedStartupBuffer) {
        playDecoded(cachedStartupBuffer);
        return;
      }

      if (rawStartupArrayBuffer) {
        ctx
          .decodeAudioData(rawStartupArrayBuffer.slice(0))
          .then((decoded) => {
            cachedStartupBuffer = decoded;
            playDecoded(decoded);
          })
          .catch(() => {
            const fallback = new Audio(STARTUP_AUDIO_URL);
            fallback.volume = 0.92;
            fallback.play().catch(() => {});
          });
        return;
      }
    }

    const audio = new Audio(STARTUP_AUDIO_URL);
    audio.volume = 0.92;
    audio.play().catch(() => {});
  } catch {
    // Audio playback optional
  }
}

function PixelBitmapWord({
  word,
  palette,
  bounceLetters = false,
  glowColor,
}: {
  word: string;
  palette: [string, string, string, string, string];
  bounceLetters?: boolean;
  glowColor: string;
}) {
  const letters = word.split('');
  const outlineOffsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [1, 1],
    [0, 2],
    [1, 2],
  ];

  return (
    <div
      className="inline-flex items-center justify-center gap-1 sm:gap-1.5 select-none"
      aria-label={word}
      style={{
        filter: `drop-shadow(0 4px 0 #000000) drop-shadow(0 0 18px ${glowColor})`,
      }}
    >
      {letters.map((ch, idx) => {
        const glyph = PIXEL_FONT_5X7[ch] || PIXEL_FONT_5X7[' '];
        const w = glyph[0].length;
        const fgPixels: { x: number; y: number; row: number }[] = [];
        const fgSet = new Set<string>();

        glyph.forEach((rowStr, ry) => {
          for (let rx = 0; rx < w; rx++) {
            if (rowStr[rx] === '1') {
              const px = rx + 1;
              const py = ry + 1;
              fgPixels.push({ x: px, y: py, row: ry });
              fgSet.add(`${px},${py}`);
            }
          }
        });

        const outlineMap = new Map<string, { x: number; y: number; isDeep: boolean }>();
        for (const p of fgPixels) {
          for (const [dx, dy] of outlineOffsets) {
            const ox = p.x + dx;
            const oy = p.y + dy;
            const key = `${ox},${oy}`;
            if (!fgSet.has(key)) {
              const existing = outlineMap.get(key);
              const isDeep = dy === 2;
              if (!existing || (!existing.isDeep && isDeep)) {
                outlineMap.set(key, { x: ox, y: oy, isDeep });
              }
            }
          }
        }

        return (
          <svg
            key={`${ch}-${idx}`}
            viewBox={`0 0 ${w + 3} 10`}
            shapeRendering="crispEdges"
            className={`pixelated h-9 sm:h-12 w-auto ${
              bounceLetters ? 'intro-letter-bounce' : ''
            }`}
            style={
              bounceLetters
                ? { animationDelay: `${(idx * 0.085).toFixed(3)}s` }
                : undefined
            }
          >
            {Array.from(outlineMap.values()).map((o, oi) => (
              <rect
                key={`ol-${oi}`}
                x={o.x}
                y={o.y}
                width={1}
                height={1}
                fill={o.isDeep ? '#000000' : '#080B12'}
              />
            ))}
            {fgPixels.map((p, pi) => {
              const fill =
                p.row === 0
                  ? palette[0]
                  : p.row === 1
                    ? palette[1]
                    : p.row <= 3
                      ? palette[2]
                      : p.row <= 5
                        ? palette[3]
                        : palette[4];
              return (
                <rect
                  key={`fg-${pi}`}
                  x={p.x}
                  y={p.y}
                  width={1}
                  height={1}
                  fill={fill}
                />
              );
            })}
          </svg>
        );
      })}
    </div>
  );
}

/**
 * Minimal unboxed 320x180 pure-black pixel art sky & Washington horizon backdrop:
 * twinkling stars, crescent moon, lit White House silhouette with waving U.S. flag,
 * and bouncing golden dollar coins along the dark lower skyline.
 */
function PixelNightHorizonCanvas({ isLaunching }: { isLaunching: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLaunchingRef = useRef<boolean>(isLaunching);
  const launchStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    isLaunchingRef.current = isLaunching;
    if (isLaunching && launchStartedAtRef.current === null) {
      launchStartedAtRef.current = performance.now();
    }
  }, [isLaunching]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const H = 180;
    const groundY = 148;
    const computeCanvasWidth = () => {
      if (typeof window === 'undefined') return 320;
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      return Math.max(220, Math.min(540, Math.round(H * aspect)));
    };

    let W = computeCanvasWidth();
    canvas.width = W;
    canvas.height = H;

    const starSpecs = [
      { u: 0.06, y: 14, ph: 0.4 },
      { u: 0.14, y: 28, ph: 1.3 },
      { u: 0.21, y: 12, ph: 2.2 },
      { u: 0.29, y: 24, ph: 0.9 },
      { u: 0.36, y: 10, ph: 1.8 },
      { u: 0.44, y: 20, ph: 2.9 },
      { u: 0.52, y: 13, ph: 0.6 },
      { u: 0.61, y: 26, ph: 1.5 },
      { u: 0.69, y: 16, ph: 2.5 },
      { u: 0.77, y: 23, ph: 1.1 },
      { u: 0.85, y: 38, ph: 0.3 },
      { u: 0.93, y: 15, ph: 2.1 },
      { u: 0.09, y: 54, ph: 1.7 },
      { u: 0.19, y: 44, ph: 0.7 },
      { u: 0.33, y: 38, ph: 2.4 },
      { u: 0.48, y: 42, ph: 1.2 },
      { u: 0.64, y: 40, ph: 2.8 },
      { u: 0.78, y: 48, ph: 0.5 },
      { u: 0.89, y: 60, ph: 2.0 },
      { u: 0.12, y: 84, ph: 1.1 },
      { u: 0.91, y: 88, ph: 1.9 },
    ];

    const coinSpecs = [
      { u: 0.11, phase: 0.2, speed: 2.8, maxLift: 24, size: 7 },
      { u: 0.35, phase: 1.5, speed: 2.4, maxLift: 22, size: 7 },
      { u: 0.65, phase: 2.3, speed: 2.5, maxLift: 22, size: 7 },
      { u: 0.89, phase: 0.8, speed: 3.0, maxLift: 24, size: 7 },
    ];

    // Helper to bake string-grid pixel art sprites onto an offscreen canvas once
    const bakeSpriteGrid = (
      grid: string[],
      palette: Record<string, string>
    ): HTMLCanvasElement => {
      const h = grid.length;
      const w = grid[0]?.length || 1;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const sctx = c.getContext('2d');
      if (sctx) {
        sctx.imageSmoothingEnabled = false;
        for (let y = 0; y < h; y++) {
          const row = grid[y];
          for (let x = 0; x < row.length; x++) {
            const fill = palette[row[x]];
            if (fill && fill !== 'transparent') {
              sctx.fillStyle = fill;
              sctx.fillRect(x, y, 1, 1);
            }
          }
        }
      }
      return c;
    };

    const TRUMP_RUN_A = [
      '......oooooo......',
      '.....ohyyyyYo.....',
      '....ohHyyyyYYo....',
      '....oHHhyyyyyYo...',
      '....oossfffssso...',
      '....oossffwofso...',
      '..z.odssfffddso...',
      '.....oodsssddo....',
      '..oooo.onUUwno....',
      '.orRRroNUUuwuoo...',
      '.orrrronUUuuuUuo..',
      '...oNnuuUUUUussfo.',
      '..onnnUUUUuuusso..',
      '..oossNNNNNnoo....',
      '...ooopppppqo.....',
      '.....opppqqqpo....',
      '....opppo.oppqo...',
      '...opppo...oppqo..',
      '..opppo.....oppqo.',
      '..oKKo.......oKKo.',
      '.oKgKo.......oKgKo',
      '.ooooo.......ooooo',
    ];

    const TRUMP_RUN_B = [
      '......oooooo......',
      '.....ohyyyyYo.....',
      '....ohHyyyyYYo....',
      '....oHHhyyyyyYo...',
      '....oossfffssso...',
      '....oossffwofso...',
      '....odssfffddso...',
      '.....oodsssddo....',
      '.oooo..onUUwno....',
      'orrRro.NUUuwuo....',
      '..ooooNNUUUUuuo...',
      '.....oNnuUUUUuso..',
      '.....onnnUUUussfo.',
      '.....ooNNNNNnooo..',
      '......opppppqo....',
      '......opppqqqo....',
      '......opppqqo.....',
      '.....opppooppo....',
      '.....opppo.oppo...',
      '.....oKKo...oKKo..',
      '.....oKgKo..oKgKo.',
      '.....ooooo..ooooo.',
    ];

    const TRUMP_PALETTE: Record<string, string> = {
      '.': 'transparent',
      o: '#07090F',
      H: '#B45309',
      h: '#D97706',
      y: '#FACC15',
      Y: '#FEF08A',
      d: '#C9835B',
      s: '#E5A278',
      f: '#F2BE9A',
      w: '#F8FAFC',
      z: '#7DD3FC',
      r: '#DC2626',
      R: '#F87171',
      N: '#0F172A',
      n: '#172554',
      u: '#1E3A8A',
      U: '#3B82F6',
      p: '#0F172A',
      q: '#1E293B',
      K: '#090D16',
      g: '#64748B',
    };

    const trumpSprites: [HTMLCanvasElement, HTMLCanvasElement] = [
      bakeSpriteGrid(TRUMP_RUN_A, TRUMP_PALETTE),
      bakeSpriteGrid(TRUMP_RUN_B, TRUMP_PALETTE),
    ];

    const CHASER_RUN_A = [
      '.....oooooo.....',
      '....ohhhhhho....',
      '....ohggggggo...',
      '....ohssfffsso..',
      '....ossffwofso..',
      '....odssffddso..',
      '.....oodssddo...',
      '....oonUUUUnoo..',
      '...onnuUUUUuuo..',
      '..onnnUUUUuusfo.',
      '..ooonNNNNNuooo.',
      '....oossNNNNno..',
      '.....oopppppqo..',
      '....opppqqqppo..',
      '...opppo..oppqo.',
      '..opppo....oppqo',
      '..oKKo......oKKo',
      '.oKgKo......oKgK',
      '.ooooo......oooo',
    ];

    const CHASER_RUN_B = [
      '.....oooooo.....',
      '....ohhhhhho....',
      '....ohggggggo...',
      '....ohssfffsso..',
      '....ossffwofso..',
      '....odssffddso..',
      '.....oodssddo...',
      '....oonUUUUnoo..',
      '....onnuUUUUuo..',
      '....onnUUUUusfo.',
      '....ooonNNNNnoo.',
      '.....ooNNNNNno..',
      '......opppppqo..',
      '.....opppqqqpo..',
      '.....opppooppo..',
      '.....opppo.oppo.',
      '.....oKKo...oKKo',
      '.....oKgKo..oKgK',
      '.....ooooo..oooo',
    ];

    interface ChaserStyle {
      lag: number;
      dy: number;
      phaseOffset: number;
      sprites: [HTMLCanvasElement, HTMLCanvasElement];
      prop: 'sign-yellow' | 'fist' | 'megaphone' | 'camera' | 'sign-red';
    }

    const chaserConfigs: Array<{
      lag: number;
      dy: number;
      phaseOffset: number;
      palette: Record<string, string>;
      prop: ChaserStyle['prop'];
    }> = [
      {
        lag: 28,
        dy: 0,
        phaseOffset: 0,
        prop: 'sign-yellow',
        palette: {
          '.': 'transparent',
          o: '#07090F',
          h: '#1E293B',
          g: '#334155',
          d: '#C9835B',
          s: '#E5A278',
          f: '#F2BE9A',
          w: '#F8FAFC',
          N: '#7F1D1D',
          n: '#991B1B',
          u: '#B91C1C',
          U: '#EF4444',
          p: '#1E293B',
          q: '#334155',
          K: '#090D16',
        },
      },
      {
        lag: 49,
        dy: 2,
        phaseOffset: 1,
        prop: 'fist',
        palette: {
          '.': 'transparent',
          o: '#07090F',
          h: '#451A03',
          g: '#78350F',
          d: '#A66342',
          s: '#C9835B',
          f: '#E5A278',
          w: '#F8FAFC',
          N: '#0F172A',
          n: '#1E293B',
          u: '#334155',
          U: '#64748B',
          p: '#0F172A',
          q: '#1E293B',
          K: '#090D16',
        },
      },
      {
        lag: 70,
        dy: -1,
        phaseOffset: 0,
        prop: 'megaphone',
        palette: {
          '.': 'transparent',
          o: '#07090F',
          h: '#0F172A',
          g: '#475569',
          d: '#C9835B',
          s: '#E5A278',
          f: '#FDE6D2',
          w: '#F8FAFC',
          N: '#052E16',
          n: '#14532D',
          u: '#16A34A',
          U: '#4ADE80',
          p: '#1E293B',
          q: '#334155',
          K: '#090D16',
        },
      },
      {
        lag: 91,
        dy: 2,
        phaseOffset: 1,
        prop: 'camera',
        palette: {
          '.': 'transparent',
          o: '#07090F',
          h: '#1E293B',
          g: '#38BDF8',
          d: '#B06A47',
          s: '#D6946B',
          f: '#F2BE9A',
          w: '#F8FAFC',
          N: '#451A03',
          n: '#78350F',
          u: '#B45309',
          U: '#F59E0B',
          p: '#1E293B',
          q: '#334155',
          K: '#090D16',
        },
      },
      {
        lag: 112,
        dy: 0,
        phaseOffset: 0,
        prop: 'sign-red',
        palette: {
          '.': 'transparent',
          o: '#07090F',
          h: '#991B1B',
          g: '#EF4444', // red MAGA/protest cap
          d: '#8C4E32',
          s: '#B06A47',
          f: '#CC845D',
          w: '#F8FAFC',
          N: '#1E3A8A',
          n: '#1D4ED8',
          u: '#2563EB',
          U: '#60A5FA',
          p: '#1E293B',
          q: '#334155',
          K: '#090D16',
        },
      },
    ];

    const chasers: ChaserStyle[] = chaserConfigs.map((cfg) => ({
      lag: cfg.lag,
      dy: cfg.dy,
      phaseOffset: cfg.phaseOffset,
      prop: cfg.prop,
      sprites: [
        bakeSpriteGrid(CHASER_RUN_A, cfg.palette),
        bakeSpriteGrid(CHASER_RUN_B, cfg.palette),
      ],
    }));

    // 11x11 Smooth curved 32-bit pixel Crescent Moon (transparent backdrop, no black cutout box)
    const MOON_GRID = [
      '....wwy....',
      '..wwyyyd...',
      '.wwyyyd....',
      '.wyyyd.....',
      'wwyyd......',
      'wwyyd......',
      'wwyyd......',
      '.wyyyd.....',
      '.wwyyyd....',
      '..wwyyyd...',
      '....wwy....',
    ];
    const MOON_PALETTE: Record<string, string> = {
      '.': 'transparent',
      w: '#FEF9C3',
      y: '#FDE047',
      d: '#CA8A04',
    };
    const moonSprite = bakeSpriteGrid(MOON_GRID, MOON_PALETTE);

    // 20x20 Unboxed 32-bit Victory Pixel Trump (raised fist, crimson tie, dark outline)
    const TRUMP_VICTORY_GRID = [
      '......oooooo........',
      '.....ohyyyyYo.......',
      '....ohHyyyyYYo......',
      '....oHHhyyyyyYo.....',
      '....oossfffssso.oooo',
      '....oossffwofsoosffo',
      '....odssfffddso.osso',
      '.oooooodsssddo.oUUUo',
      'ossfo.onUUwnooUUUUo.',
      'osso.onUUuwuUUUUoo..',
      '.ooonnUUUrRUUUUoo...',
      '...onnnUUrrUUUuo....',
      '...onnnUUrRUUUuo....',
      '....ooNNNNNNNno.....',
      '.....oopppppqo......',
      '....opppq.opqqo.....',
      '...opppo...oppqo....',
      '...oKKo.....oKKo....',
      '..oKgKo.....oKgKo...',
      '..ooooo.....ooooo...',
    ];
    const victoryTrumpSprite = bakeSpriteGrid(TRUMP_VICTORY_GRID, TRUMP_PALETTE);

    // 22x10 Crisp 32-bit Signed Policy Bill Scroll for Trump to bounce on
    const POLICY_BILL_GRID = [
      '.oooooooooooooooooooo.',
      'oBBBBBBBBBBBBBBBBBBBBo',
      'oWWWWWWWWWWWWWWWWWWWCo',
      'oWWkkkkkWWkkkkkkkWWCCo',
      'oWWWWWWWWWWWWWWWWWWCCo',
      'oWWkkkkkkWWWWrrrrWWCCo',
      'oWWWWWWWWWWWWrrYrrWCCo',
      'oWWkkkkkkWWWWrrrrWWCCo',
      'oCSSSSSSSSSSSSSSSSSSSo',
      '.oooooooooooooooooooo.',
    ];
    const POLICY_BILL_PALETTE: Record<string, string> = {
      '.': 'transparent',
      o: '#07090F',
      B: '#1D4ED8',
      W: '#FFFFFF',
      C: '#E2E8F0',
      S: '#94A3B8',
      k: '#334155',
      r: '#DC2626',
      Y: '#FACC15',
    };
    const policyBillSprite = bakeSpriteGrid(POLICY_BILL_GRID, POLICY_BILL_PALETTE);

    // Pre-bake static 4x4 Bayer-dithered sky + sculpted grass curb + high-fidelity 32-bit pixel bricks
    const buildStaticBg = (width: number): HTMLCanvasElement => {
      const bg = document.createElement('canvas');
      bg.width = width;
      bg.height = H;
      const bgCtx = bg.getContext('2d');
      if (!bgCtx) return bg;

      bgCtx.imageSmoothingEnabled = false;

      // 1. Tall, ultra-smooth 4x4 ordered Bayer-dithered sky transition rising high into black (#04050A)
      const BAYER_4X4 = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ];
      const skyBands = [
        { y0: 0, y1: 24, top: '#04050A', bot: '#04050A' },
        { y0: 24, y1: 68, top: '#04050A', bot: '#060A15' },
        { y0: 68, y1: 112, top: '#060A15', bot: '#0A1224' },
        { y0: 112, y1: groundY, top: '#0A1224', bot: '#121E38' },
      ];
      for (const band of skyBands) {
        const span = band.y1 - band.y0;
        for (let y = band.y0; y < band.y1; y++) {
          const p = (y - band.y0) / span;
          bgCtx.fillStyle = band.top;
          bgCtx.fillRect(0, y, width, 1);
          bgCtx.fillStyle = band.bot;
          const bRow = BAYER_4X4[y & 3];
          for (let x = 0; x < width; x++) {
            const threshold = (bRow[x & 3] + 0.5) / 16;
            if (p > threshold) {
              bgCtx.fillRect(x, y, 1, 1);
            }
          }
        }
      }

      // 2. Crisp 32-bit transparent-edge crescent moon (upper right)
      const moonX = Math.max(24, width - 48);
      bgCtx.drawImage(moonSprite, moonX, 16);

      // 3. Sculpted 32-bit grass ridge bordering the stone bricks
      bgCtx.fillStyle = '#052E16';
      bgCtx.fillRect(0, groundY - 2, width, 6);
      bgCtx.fillStyle = '#14532D';
      bgCtx.fillRect(0, groundY - 1, width, 4);
      const bladeCount = Math.ceil(width / 2);
      for (let i = 0; i < bladeCount; i++) {
        const n = Math.sin(i * 12.9898) * 43758.5453;
        const frac = n - Math.floor(n);
        const h = frac > 0.72 ? 3 : frac > 0.35 ? 2 : 1;
        const gx = i * 2;
        bgCtx.fillStyle = h === 3 ? '#22C55E' : '#166534';
        bgCtx.fillRect(gx, groundY - h - 1, 1, h + 1);
        bgCtx.fillStyle = '#15803D';
        bgCtx.fillRect(gx + 1, groundY - Math.max(1, h - 1), 1, h);
        if (frac > 0.94) {
          bgCtx.fillStyle = i % 2 === 0 ? '#FDE047' : '#93C5FD';
          bgCtx.fillRect(gx, groundY - h - 1, 1, 1);
        }
      }

      // 4. High-Fidelity 32-Bit Weathered Stone Brick Promenade (y = groundY+3 .. H)
      const brickTop = groundY + 3;
      bgCtx.fillStyle = '#04060B';
      bgCtx.fillRect(0, brickTop, width, H - brickTop);

      const brickH = 7;
      const brickW = 16;
      const stoneFaces = ['#1D283D', '#233049', '#192336', '#283550'];
      const stoneHighlights = ['#475569', '#52637D', '#3B4963', '#64748B'];
      const stoneShadows = ['#0D1320', '#101726', '#0A0F1A', '#131C2E'];

      for (let row = 0; row < 5; row++) {
        const by = brickTop + row * brickH;
        const offsetX = row % 2 === 1 ? -(brickW / 2) : 0;
        for (let col = 0; col <= Math.ceil(width / brickW) + 1; col++) {
          const bx = offsetX + col * brickW;
          const seed = Math.abs(Math.sin((row * 31 + col * 17) * 19.37)) * 997;
          const toneIdx = Math.floor(seed) % stoneFaces.length;
          const bw = brickW - 1;
          const bh = brickH - 1;

          bgCtx.fillStyle = stoneFaces[toneIdx];
          bgCtx.fillRect(bx + 1, by + 1, bw - 2, bh - 1);
          bgCtx.fillRect(bx, by + 2, bw, bh - 3);

          bgCtx.fillStyle = stoneHighlights[toneIdx];
          bgCtx.fillRect(bx + 1, by + 1, bw - 3, 1);
          bgCtx.fillRect(bx, by + 2, 1, bh - 4);
          bgCtx.fillStyle = '#94A3B8';
          bgCtx.fillRect(bx + 1, by + 1, 2, 1);

          bgCtx.fillStyle = stoneShadows[toneIdx];
          bgCtx.fillRect(bx + 1, by + bh - 1, bw - 2, 1);
          bgCtx.fillRect(bx + bw - 1, by + 2, 1, bh - 3);

          const px1 = bx + 3 + (Math.floor(seed * 3) % (bw - 6));
          const py1 = by + 2 + (Math.floor(seed * 5) % (bh - 4));
          bgCtx.fillStyle = stoneShadows[toneIdx];
          bgCtx.fillRect(px1, py1, 2, 1);
          bgCtx.fillStyle = stoneHighlights[toneIdx];
          bgCtx.fillRect(px1, py1 + 1, 1, 1);

          if (Math.floor(seed * 7) % 4 === 0) {
            bgCtx.fillStyle = '#070A12';
            bgCtx.fillRect(bx + 6, by + 1, 1, 2);
            bgCtx.fillRect(bx + 7, by + 3, 1, 2);
          }

          if (row === 0 && Math.floor(seed * 11) % 3 !== 0) {
            bgCtx.fillStyle = '#14532D';
            bgCtx.fillRect(bx + 2, by + 1, 3, 1);
            bgCtx.fillStyle = '#166534';
            bgCtx.fillRect(bx + 8, by + 1, 2, 1);
          }
        }
      }

      for (const lx of [Math.round(width * 0.19), Math.round(width * 0.81)]) {
        bgCtx.fillStyle = 'rgba(250, 204, 21, 0.08)';
        bgCtx.fillRect(lx - 22, brickTop, 44, 18);
        bgCtx.fillStyle = 'rgba(253, 224, 71, 0.11)';
        bgCtx.fillRect(lx - 12, brickTop, 24, 10);
      }
      return bg;
    };

    let staticBg = buildStaticBg(W);
    const handleResize = () => {
      const nextW = computeCanvasWidth();
      if (nextW !== W) {
        W = nextW;
        canvas.width = W;
        canvas.height = H;
        staticBg = buildStaticBg(W);
      }
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    const started = performance.now();

    const drawPixelCoin = (cx: number, cy: number, size: number) => {
      const x = Math.round(cx - size / 2);
      const y = Math.round(cy - size / 2);

      ctx.fillStyle = '#05070C';
      ctx.fillRect(x + 1, y - 1, size - 2, size + 2);
      ctx.fillRect(x - 1, y + 1, size + 2, size - 2);

      ctx.fillStyle = '#92400E';
      ctx.fillRect(x + 1, y, size - 2, size);
      ctx.fillRect(x, y + 1, size, size - 2);

      ctx.fillStyle = '#EAB308';
      ctx.fillRect(x + 2, y + 1, size - 4, size - 2);
      ctx.fillRect(x + 1, y + 2, size - 2, size - 4);

      ctx.fillStyle = '#FEF9C3';
      ctx.fillRect(x + 2, y + 1, Math.max(2, size - 5), 1);
      ctx.fillRect(x + 1, y + 2, 1, Math.max(2, size - 5));

      ctx.fillStyle = '#78350F';
      ctx.fillRect(Math.round(cx), y + 2, 1, size - 4);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(Math.round(cx) - 1, y + 2, 1, size - 4);
    };

    const drawLantern = (lx: number, flicker: boolean) => {
      ctx.fillStyle = '#090D16';
      ctx.fillRect(lx - 1, groundY - 19, 3, 19);
      ctx.fillStyle = '#334155';
      ctx.fillRect(lx, groundY - 18, 1, 18);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(lx - 1, groundY - 2, 3, 2);
      ctx.fillStyle = '#090D16';
      ctx.fillRect(lx - 2, groundY - 24, 5, 6);
      ctx.fillStyle = '#92400E';
      ctx.fillRect(lx - 1, groundY - 24, 3, 1);
      ctx.fillStyle = flicker ? '#FEF08A' : '#FACC15';
      ctx.fillRect(lx - 1, groundY - 23, 3, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(lx, groundY - 22, 1, 2);
    };

    const drawRunningTrump = (cx: number, strideFrame: number, bob: number) => {
      const sprite = trumpSprites[strideFrame];
      const sx = Math.round(cx) - 9;
      const sy = groundY + 4 - sprite.height - bob;

      // Ground contact shadow + stride dust puff
      ctx.fillStyle = 'rgba(0,0,0,0.52)';
      ctx.fillRect(sx + 4, groundY + 4, 10, 2);
      if (strideFrame === 0) {
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(sx - 1, groundY + 3, 2, 2);
        ctx.fillStyle = '#64748B';
        ctx.fillRect(sx - 3, groundY + 4, 1, 1);
      }

      ctx.drawImage(sprite, sx, sy);
    };

    const drawChaser = (
      cx: number,
      style: ChaserStyle,
      strideFrame: number,
      bob: number,
      t: number
    ) => {
      const sprite = style.sprites[strideFrame];
      const baseGround = groundY + 4 + style.dy;
      const sx = Math.round(cx) - 8;
      const sy = baseGround - sprite.height - bob;

      // Ground contact shadow & dust puff
      ctx.fillStyle = 'rgba(0,0,0,0.48)';
      ctx.fillRect(sx + 3, baseGround, 9, 2);
      if (strideFrame === 0) {
        ctx.fillStyle = '#64748B';
        ctx.fillRect(sx, baseGround - 1, 2, 1);
      }

      // Draw crisp outlined pre-baked character sprite
      ctx.drawImage(sprite, sx, sy);

      // Draw detailed pixel-outlined prop right in their leading hand
      if (style.prop === 'sign-yellow' || style.prop === 'sign-red') {
        const px = sx + 12;
        const py = sy - 7;
        // Outlined stick
        ctx.fillStyle = '#07090F';
        ctx.fillRect(px, py + 5, 3, 7);
        ctx.fillStyle = '#92400E';
        ctx.fillRect(px + 1, py + 5, 1, 7);
        // Outlined placard board
        ctx.fillStyle = '#07090F';
        ctx.fillRect(px - 3, py, 9, 7);
        ctx.fillStyle = style.prop === 'sign-yellow' ? '#FEF08A' : '#F8FAFC';
        ctx.fillRect(px - 2, py + 1, 7, 5);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(px - 1, py + 2, 5, 1);
        ctx.fillRect(px - 1, py + 4, 3, 1);
      } else if (style.prop === 'megaphone') {
        const mx = sx + 13;
        const my = sy + 6;
        ctx.fillStyle = '#07090F';
        ctx.fillRect(mx - 1, my - 1, 6, 6);
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(mx, my + 1, 2, 2);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(mx + 2, my, 2, 4);
      } else if (style.prop === 'camera') {
        const kx = sx + 12;
        const ky = sy + 6;
        ctx.fillStyle = '#07090F';
        ctx.fillRect(kx - 1, ky - 1, 6, 5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(kx, ky, 4, 3);
        ctx.fillStyle = Math.sin(t * 9.5) > 0.78 ? '#FFFFFF' : '#38BDF8';
        ctx.fillRect(kx + 3, ky + 1, 2, 2);
      }
    };

    const wrapTrackX = (raw: number) => {
      const span = W + 170;
      return ((((raw % span) + span) % span) - 135);
    };

    const ORB_SPECS = [
      { baseAngle: -Math.PI * 0.78, delay: 0.0, core: '#FCA5A5', rim: '#EF4444', glow: 'rgba(239,68,68,0.34)' },
      { baseAngle: -Math.PI * 0.22, delay: 0.14, core: '#FEF9C3', rim: '#FACC15', glow: 'rgba(250,204,21,0.38)' },
      { baseAngle: Math.PI * 0.22, delay: 0.28, core: '#93C5FD', rim: '#3B82F6', glow: 'rgba(59,130,246,0.34)' },
      { baseAngle: Math.PI * 0.78, delay: 0.42, core: '#FFFFFF', rim: '#CBD5E1', glow: 'rgba(248,250,252,0.34)' },
    ];

    const SPARK_DIRS = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2 + 0.18;
      return {
        dx: Math.cos(a),
        dy: Math.sin(a),
        speed: 44 + (i % 3) * 18,
        color:
          i % 4 === 0
            ? '#FEF9C3'
            : i % 4 === 1
              ? '#FACC15'
              : i % 4 === 2
                ? '#60A5FA'
                : '#F87171',
      };
    });


    const drawPixelOrb = (
      ox: number,
      oy: number,
      size: number,
      core: string,
      rim: string
    ) => {
      const x = Math.round(ox - size / 2);
      const y = Math.round(oy - size / 2);
      if (size <= 2) {
        ctx.fillStyle = core;
        ctx.fillRect(x, y, size, size);
        return;
      }
      ctx.fillStyle = '#05070C';
      ctx.fillRect(x + 1, y - 1, size - 2, size + 2);
      ctx.fillRect(x - 1, y + 1, size + 2, size - 2);
      ctx.fillStyle = rim;
      ctx.fillRect(x + 1, y, size - 2, size);
      ctx.fillRect(x, y + 1, size, size - 2);
      ctx.fillStyle = core;
      ctx.fillRect(x + 1, y + 1, Math.max(1, size - 2), Math.max(1, size - 2));
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 1, y + 1, 1, 1);
    };

    let launchFreezeT: number | null = null;

    const renderFrame = (now: number) => {
      const t = Math.max(0, (now - started) / 1000);
      const launching = isLaunchingRef.current;
      if (launching && launchFreezeT === null) {
        launchFreezeT = t;
      }
      const tLaunch =
        launching && launchStartedAtRef.current !== null
          ? Math.max(0, (now - launchStartedAtRef.current) / 1000)
          : 0;

      ctx.imageSmoothingEnabled = false;

      // Blit pre-baked high 4x4 dither sky + moon + grass + weathered stone bricks
      ctx.drawImage(staticBg, 0, 0);

      // Twinkling 1px/2px crisp stars spread across the entire viewport width
      const starBoost = launching ? Math.min(1, tLaunch * 1.4) : 0;
      for (const st of starSpecs) {
        const sx = Math.round(st.u * W);
        const pulse = 0.5 + 0.5 * Math.sin(t * (2.4 + starBoost * 4) + st.ph);
        ctx.fillStyle =
          pulse > 0.78 - starBoost * 0.25
            ? '#FFFFFF'
            : pulse > 0.45
              ? '#FEF08A'
              : '#94A3B8';
        ctx.fillRect(sx, st.y, 1, 1);
        if (pulse > 0.88) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
          ctx.fillRect(sx - 1, st.y, 3, 1);
          ctx.fillRect(sx, st.y - 1, 1, 3);
        }
      }

      // Two flickering street lanterns on far sides
      const flicker = Math.sin(t * 7.5) > -0.6;
      drawLantern(Math.round(W * 0.19), flicker);
      drawLantern(Math.round(W * 0.81), !flicker || Math.sin(t * 5.2) > -0.8);

      // Bouncing gold coins aloft (soar upward into sparkle on launch)
      const coinAscent = launching ? Math.pow(tLaunch, 1.9) * 140 : 0;
      for (const c of coinSpecs) {
        const cycle = Math.abs(Math.sin(t * c.speed + c.phase));
        const lift = Math.pow(cycle, 0.7) * c.maxLift + coinAscent;
        const cy = groundY - 24 - lift;
        if (cy > -12) {
          drawPixelCoin(Math.round(c.u * W), cy, c.size);
        }
      }

      // Infinite Loop Chase (accelerates seamlessly off-screen right on launch)
      const speedPx = 68;
      const globalBeat = Math.floor(t * (launching ? 18 : 10));
      const sprintDelta = launching
        ? tLaunch * speedPx + Math.pow(tLaunch, 1.75) * 320
        : 0;
      const startLeadX = Math.round(W * 0.74);
      const baseLead =
        startLeadX + (launching && launchFreezeT !== null ? launchFreezeT : t) * speedPx;

      const getRunnerX = (lag: number) =>
        launching ? wrapTrackX(baseLead - lag) + sprintDelta : wrapTrackX(baseLead - lag);

      const trumpX = getRunnerX(0);
      const trumpFrame = globalBeat % 2;
      const trumpBob = trumpFrame === 0 ? 1 : 0;

      const runners: Array<{
        dy: number;
        draw: () => void;
      }> = chasers.map((ch) => ({
        dy: ch.dy,
        draw: () => {
          const cx = getRunnerX(ch.lag);
          if (cx >= -28 && cx <= W + 28) {
            const f = (globalBeat + ch.phaseOffset) % 2;
            drawChaser(cx, ch, f, f === 0 ? 1 : 0, t);
          }
        },
      }));
      runners.push({
        dy: 1,
        draw: () => {
          if (trumpX >= -28 && trumpX <= W + 28) {
            drawRunningTrump(trumpX, trumpFrame, trumpBob);
          }
        },
      });
      runners.sort((a, b) => a.dy - b.dy);
      for (const r of runners) r.draw();

      // Startup Launch Sequence synced to the Windows 7 Chime (0.0s .. 2.98s)
      if (launching) {
        const centerX = Math.round(W / 2);
        const centerY = 44;

        // Subtle atmospheric night dim to spotlight the launch sequence
        const dimAlpha =
          tLaunch < 0.35
            ? (tLaunch / 0.35) * 0.58
            : tLaunch < 2.25
              ? 0.58
              : Math.max(0, 0.58 * (1 - (tLaunch - 2.25) / 0.6));
        if (dimAlpha > 0.01) {
          ctx.fillStyle = `rgba(4, 5, 10, ${dimAlpha.toFixed(3)})`;
          ctx.fillRect(0, 0, W, H);
        }

        // Phase 1 (0.0s .. 1.15s): Four glowing pixel stars spiral into convergence
        if (tLaunch < 1.18) {
          ORB_SPECS.forEach((orb) => {
            const localT = Math.max(0, tLaunch - orb.delay);
            const dur = Math.max(0.25, 1.12 - orb.delay);
            const p = Math.min(1, localT / dur);
            if (p <= 0) return;

            const ease = 1 - Math.pow(1 - p, 2.3);
            const radius = (1 - ease) * 92;
            const angle = orb.baseAngle + ease * Math.PI * 1.45;
            const ox = centerX + Math.cos(angle) * radius;
            const oy = centerY + Math.sin(angle) * (radius * 0.64);

            // 5-step shrinking pixel star comet tail
            for (let step = 5; step >= 1; step--) {
              const tp = Math.max(0, p - step * 0.045);
              const tEase = 1 - Math.pow(1 - tp, 2.3);
              const tr = (1 - tEase) * 92;
              const ta = orb.baseAngle + tEase * Math.PI * 1.45;
              const tx = centerX + Math.cos(ta) * tr;
              const ty = centerY + Math.sin(ta) * (tr * 0.64);
              ctx.fillStyle = step <= 2 ? orb.core : orb.rim;
              const sz = step <= 2 ? 2 : 1;
              ctx.fillRect(Math.round(tx), Math.round(ty), sz, sz);
            }

            drawPixelOrb(ox, oy, 5, orb.core, orb.rim);
          });
        }

        // Phase 2 & 3 (1.10s .. 2.98s): Pixel sparks + Trump bouncing on the Policy Bill & popping coins
        if (tLaunch >= 1.1) {
          const postT = tLaunch - 1.1;

          // Gravity-arcing crisp pixel sparks from the 4-star collision
          if (postT < 0.95) {
            for (let i = 0; i < SPARK_DIRS.length; i++) {
              const sp = SPARK_DIRS[i];
              const dist = postT * sp.speed * (1 - postT * 0.22);
              const px = Math.round(centerX + sp.dx * dist);
              const py = Math.round(centerY + sp.dy * dist * 0.78 + 26 * postT * postT);
              ctx.fillStyle = postT < 0.16 ? '#FFFFFF' : sp.color;
              const size = postT < 0.4 ? 2 : 1;
              ctx.fillRect(px, py, size, size);
            }
          }

          // Pop-in scale for the Policy Bill trampoline + Victory Trump
          const popP = Math.min(1, postT / 0.24);
          const popEase =
            popP < 0.65
              ? (popP / 0.65) * 1.12
              : 1.12 - ((popP - 0.65) / 0.35) * 0.12;
          const spriteScale = 2 * popEase;

          // Arcade bounce curve: Trump leaps cleanly off the Policy Bill twice
          const bounceCycle = Math.abs(Math.sin(postT * 4.8));
          const billFlex = bounceCycle < 0.22 ? Math.round((0.22 - bounceCycle) * 12) : 0;

          const billW = Math.round(policyBillSprite.width * spriteScale);
          const billH = Math.round(policyBillSprite.height * spriteScale);
          const billX = Math.round(centerX - billW / 2);
          const billY = Math.round(centerY + 8 + billFlex);
          ctx.drawImage(policyBillSprite, billX, billY, billW, billH);

          // Victory Trump bouncing right above the Policy Bill
          const trumpLift = Math.round(Math.pow(bounceCycle, 0.72) * 10);
          const trumpW = Math.round(victoryTrumpSprite.width * spriteScale);
          const trumpH = Math.round(victoryTrumpSprite.height * spriteScale);
          const trumpX = Math.round(centerX - trumpW / 2);
          const trumpY = Math.round(billY - trumpH + 2 - trumpLift);
          ctx.drawImage(victoryTrumpSprite, trumpX, trumpY, trumpW, trumpH);

          // Two crisp gold $ coins popping out on left & right as Trump bounces
          const coinP = Math.min(1, postT / 0.55);
          const coinSpread = 28 + Math.round(coinP * 10);
          const coinBounce = Math.round(Math.abs(Math.sin(postT * 5.6 + 0.5)) * 12);
          drawPixelCoin(centerX - coinSpread, billY - 6 - coinBounce, 7);
          drawPixelCoin(centerX + coinSpread, billY - 6 - Math.round(Math.abs(Math.sin(postT * 5.6 + 1.9)) * 12), 7);
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    renderFrame(performance.now());
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={180}
      className="absolute inset-0 w-full h-full pointer-events-none pixelated opacity-95"
    />
  );
}

export const PixelIntroOverlay: React.FC<PixelIntroOverlayProps> = React.memo(
  ({ onStartGame }) => {
    const [launchPhase, setLaunchPhase] = useState<'idle' | 'launching' | 'exiting'>('idle');
    const [showSubtitle, setShowSubtitle] = useState(false);
    const launchStartedRef = useRef(false);
    const timersRef = useRef<number[]>([]);
    const maskedOverlayRef = useRef<HTMLDivElement | null>(null);
    const irisRingRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      return () => {
        timersRef.current.forEach((id) => window.clearTimeout(id));
        timersRef.current = [];
      };
    }, []);

    const isLaunching = launchPhase !== 'idle';
    const isExiting = launchPhase === 'exiting';

    useEffect(() => {
      if (!isExiting) return;

      let irisRaf = 0;
      const DURATION = 860;
      const startTime = performance.now();

      const tickIris = (now: number) => {
        const p = Math.min(1, (now - startTime) / DURATION);
        // Opens deliberately in the center first so the expanding black circle reveals the Oval Office inside, then sweeps wide
        const ease =
          p < 0.35
            ? Math.pow(p / 0.35, 2) * 0.14
            : 0.14 + Math.pow((p - 0.35) / 0.65, 1.45) * 0.86;
        const maxR =
          Math.hypot(window.innerWidth / 2, window.innerHeight / 2) + 48;
        const r = ease * maxR;

        if (maskedOverlayRef.current) {
          const grad = `radial-gradient(circle at 50% 50%, transparent ${r.toFixed(1)}px, #000000 ${(r + 1.5).toFixed(1)}px)`;
          maskedOverlayRef.current.style.maskImage = grad;
          maskedOverlayRef.current.style.webkitMaskImage = grad;
        }

        if (irisRingRef.current) {
          const diam = Math.max(0, r * 2);
          irisRingRef.current.style.width = `${diam.toFixed(1)}px`;
          irisRingRef.current.style.height = `${diam.toFixed(1)}px`;
          irisRingRef.current.style.opacity =
            p > 0.9 ? `${Math.max(0, (1 - p) / 0.1).toFixed(2)}` : '1';
        }

        if (p < 1) {
          irisRaf = requestAnimationFrame(tickIris);
        }
      };

      tickIris(startTime);
      return () => {
        if (irisRaf) cancelAnimationFrame(irisRaf);
      };
    }, [isExiting]);

    const handleBegin = useCallback(() => {
      if (launchStartedRef.current) return;
      launchStartedRef.current = true;
      playStartupChime();

      setLaunchPhase('launching');
      const tSub = window.setTimeout(() => setShowSubtitle(true), 1180);
      const tExit = window.setTimeout(() => setLaunchPhase('exiting'), 2120);
      const tDone = window.setTimeout(() => onStartGame(), 2980);
      timersRef.current.push(tSub, tExit, tDone);
    }, [onStartGame]);

    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleBegin();
        }
      };
      window.addEventListener('keydown', handleKey, true);
      return () => window.removeEventListener('keydown', handleKey, true);
    }, [handleBegin]);

    return (
      <>
        <div
          ref={maskedOverlayRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bouncing-policy-title"
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[220] bg-[#04050A] flex flex-col items-center justify-center p-6 overflow-hidden select-none"
        >
          {/* Full-screen Animated Starry Pixel Sky, High-Fidelity Bricks, Chase & Startup Crest */}
          <PixelNightHorizonCanvas isLaunching={isLaunching} />

          {/* Higher-Positioned Unboxed Pixel Title, Tagline & Start Button */}
          <div
            style={{
              opacity: isLaunching ? 0 : 1,
              transform: isLaunching ? 'translateY(-14px) scale(1.03)' : 'translateY(0) scale(1)',
              transition:
                'opacity 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
              pointerEvents: isLaunching ? 'none' : 'auto',
            }}
            className="relative z-10 flex flex-col items-center text-center max-w-xl gap-5 pb-32 sm:pb-40"
          >
            <div
              id="bouncing-policy-title"
              className="flex flex-col items-center gap-2.5 sm:gap-3"
            >
              <PixelBitmapWord
                word="BOUNCING"
                bounceLetters
                palette={['#FEF9C3', '#FDE047', '#FACC15', '#D97706', '#92400E']}
                glowColor="rgba(250, 204, 21, 0.42)"
              />
              <PixelBitmapWord
                word="POLICY"
                palette={['#FFFFFF', '#E2E8F0', '#CBD5E1', '#64748B', '#334155']}
                glowColor="rgba(148, 163, 184, 0.28)"
              />
            </div>

            <p
              className="font-mono font-bold text-sm sm:text-base text-[#FEF08A] leading-relaxed max-w-md"
              style={{
                textWrap: 'balance',
                textShadow:
                  '1px 1px 0 #000000, -1px -1px 0 #000000, 0 2px 0 #000000, 0 0 16px rgba(250, 204, 21, 0.25)',
              }}
            >
              Will you bounce the economy and greatness back — or get impeached?
            </p>

            <div className="pt-1">
              <button
                type="button"
                disabled={isLaunching}
                onClick={handleBegin}
                style={{
                  background:
                    'linear-gradient(180deg, #FDE047 0%, #EAB308 55%, #CA8A04 100%)',
                  boxShadow: [
                    'inset 2px 2px 0 0 #FEF9C3',
                    'inset -2px -2px 0 0 #A16207',
                    '0 0 0 2px #000000',
                    '0 4px 0 0 #000000',
                    '0 0 24px rgba(250, 204, 21, 0.25)',
                  ].join(', '),
                }}
                className="min-h-[44px] px-8 py-3 hover:brightness-110 active:translate-y-0.5 text-[#090D16] font-mono font-bold text-xs sm:text-sm uppercase tracking-[0.18em] cursor-pointer whitespace-nowrap transition-[filter,transform] duration-75"
              >
                Start Game
              </button>
            </div>
          </div>

          {/* Exact-Center Unboxed Pixel Label in the Middle of the Screen */}
          {isLaunching && (
            <div
              aria-hidden="true"
              style={{
                opacity: showSubtitle ? 1 : 0,
                transform: showSubtitle ? 'translateY(0)' : 'translateY(8px)',
                transition:
                  'opacity 340ms cubic-bezier(0.22, 1, 0.36, 1), transform 340ms cubic-bezier(0.22, 1, 0.36, 1)',
                textShadow:
                  '1px 1px 0 #000000, -1px -1px 0 #000000, 0 2px 0 #000000, 0 0 18px rgba(250, 204, 21, 0.45)',
              }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center z-20 px-4"
            >
              <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-[0.24em] pl-[0.24em] text-[#FEF9C3] text-center whitespace-nowrap">
                Entering the Oval Office
              </span>
            </div>
          )}
        </div>

        {/* Expanding Black Circle Ring Opening From Screen Center to Reveal the Oval Office */}
        {isExiting && (
          <div
            ref={irisRingRef}
            aria-hidden="true"
            style={{
              width: '0px',
              height: '0px',
              boxSizing: 'content-box',
              border: '14px solid #000000',
              boxShadow: '0 0 0 3px #000000, inset 0 0 0 1px rgba(250, 204, 21, 0.32)',
            }}
            className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-[225]"
          />
        )}
      </>
    );
  }
);
