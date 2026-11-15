import React, { useEffect, useMemo, useRef, useState } from 'react';
import lawnMapUrl from '../assets/images/white_house_south_lawn_map.jpg';
import { PixelGameOverModal } from './PixelGameOverModal';
import { renderPixelGridRle } from '../utils/pixelGridCache';

interface PixelWhiteHouseBombingOverlayProps {
  active: boolean;
  launchId?: number;
  startedAtMs?: number;
  onClose: () => void;
  onRestartGame?: () => void;
}

// Timeline synced to playTerroristBombSound():
// 0ms..950ms    : Terrorist sprints from street up to the White House wrought-iron fence
// 950ms..1650ms : Terrorist leaps high over the White House fence onto the South Lawn
// 1650ms..4000ms: Terrorist sprints across South Lawn up to White House South Portico
// 4000ms..6200ms: Bomb planted at South Portico (ticks down 2.2s -> 0.0s) while attacker flees
// 6200ms+       : White House explosion, fire, debris, screen shake
// 9500ms+       : Game Over + "0% SECURITY" reason plaque
const FENCE_APPROACH_MS = 950;
const FENCE_LAND_MS = 1650;
const PORTICO_REACH_MS = 4000;
const DETONATION_MS = 6200;
const GAME_OVER_MS = 9500;

const PIXEL_PLAQUE_SHADOW = [
  'inset 2px 2px 0 0 #EBC14B',
  'inset -2px -2px 0 0 #8F6118',
  '0 0 0 2px #090D16',
  '0 0 0 4px #C88F2A',
  '0 0 0 6px #090D16',
  '4px 6px 0 4px rgba(0, 0, 0, 0.65)',
].join(', ');

// High-Fidelity 24x34 32-Bit Pixel Terrorist Sprite (Multi-tone Balaclava + Tactical Vest + Red Explosive Rig + Boots)
const TERRORIST_HF_A: string[] = [
  '.......oooooooooo.......',
  '......okKkkkkkkkKo......',
  '.....okKKKKKKKKKKko.....',
  '....okKkkkkbbkkkkKko....',
  '....okkkkkoooookkkko....',
  '....okkkoWssSssWokko....',
  '....okkkokdSSSdokkkko...',
  '....okkkkkkkkkkkkkko....',
  '.....okkkrrrrrrkkko.....',
  '......okkkkkkkkkko......',
  '.......oooooooooo.......',
  '.....oovVVvvvvVVvoo.....',
  '....ovVllVVvvVVllVvo....',
  '...ovVlVRRVvvVRRVlVvo...',
  '..oSovVVRRVeVeRRVVvoSo..',
  '..oSSoVVVReeeRRVVVoSSo..',
  '..oddoVVVVvvvvVVVVoddo..',
  '...oo.oNVVVvvVVVNo.oo...',
  '......oNNVvvvvVNNo......',
  '......oNNRRRRRRNNo......',
  '......ooonnnnnnooo......',
  '......opppQ..Qpppo......',
  '......opppQ..Qpppo......',
  '.....oppppQ..Qppppo.....',
  '.....opkppQ..Qppkpo.....',
  '.....oppppQ..Qppppo.....',
  '......oppQ....Qppo......',
  '......oKKa....aKKo......',
  '......oKKKo..oKKKo......',
  '......ooooo..ooooo......',
];

const TERRORIST_HF_B: string[] = [
  '.......oooooooooo.......',
  '......okKkkkkkkkKo......',
  '.....okKKKKKKKKKKko.....',
  '....okKkkkkbbkkkkKko....',
  '....okkkkkoooookkkko....',
  '....okkkoWssSssWokko....',
  '....okkkokdSSSdokkkko...',
  '....okkkkkkkkkkkkkko....',
  '.....okkkrrrrrrkkko.....',
  '......okkkkkkkkkko......',
  '.......oooooooooo.......',
  '.....oovVVvvvvVVvoo.....',
  '....ovVllVVvvVVllVvo....',
  '...ovVlVRRVvvVRRVlVvo...',
  '...ooovVVRRVeVeRRVVvoSo.',
  '.....oVVVReeeRRVVVoSSo..',
  '.....oVVVVvvvvVVVVoddo..',
  '.....oNVVVvvvvVVVNo.oo..',
  '......oNNVvvvvVNNo......',
  '......oNNRRRRRRNNo......',
  '......ooonnnnnnooo......',
  '.......opppQQpppo.......',
  '......opppQ..Qpppo......',
  '.....opppQ....Qpppo.....',
  '....opkpQ......Qpkpo....',
  '....oppp........pppo....',
  '....oKKa........aKKo....',
  '....oKKKo......oKKKo....',
  '....ooooo......ooooo....',
  '........................',
];

const TERRORIST_HF_JUMP: string[] = [
  '.......oooooooooo.......',
  '......okKkkkkkkkKo......',
  '.....okKKKKKKKKKKko.....',
  '....okKkkkkbbkkkkKko....',
  '....okkkkkoooookkkko....',
  '....okkkoWssSssWokko....',
  '....okkkokdSSSdokkkko...',
  '....okkkkkkkkkkkkkko....',
  '.....okkkrrrrrrkkko.....',
  '......okkkkkkkkkko......',
  '..oSo..oooooooooo..oSo..',
  '..oSSoovVVvvvvVVvooSSo..',
  '...ooovVllVVvvVVllVvoo..',
  '.....oVVRRVvvVRRVVo.....',
  '.....oVVVReeeRRVVVo.....',
  '.....oNVVVvvvvVVVNo.....',
  '......oNNRRRRRRNNo......',
  '......opppQQQQpppo......',
  '....oopppQ....Qpppoo....',
  '...oopkpo......opkpoo...',
  '...oKKao........oaKKo...',
  '...ooooo........ooooo...',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

const TERRORIST_PALETTE: Record<string, string> = {
  o: '#090D16',
  k: '#1E293B',
  K: '#0F172A',
  b: '#334155',
  W: '#F8FAFC',
  s: '#E5A278',
  S: '#C9835B',
  d: '#A66342',
  r: '#475569',
  v: '#365314', // dark olive tactical vest
  V: '#4D7C0F', // mid olive vest
  l: '#65A30D', // vest highlight
  N: '#1A2E05', // deep vest shadow
  n: '#142204',
  R: '#DC2626', // red explosive harness/strap
  e: '#FACC15', // brass detonator buckle
  p: '#292524', // dark charcoal cargo pants
  Q: '#1C1917',
  a: '#64748B', // boot lace/buckle highlight
};

const PixelTerroristSprite = React.memo(({
  runFrame,
  carryingBomb,
  flipX,
  isJumping = false,
  hideShadow = false,
}: {
  runFrame: number;
  carryingBomb: boolean;
  flipX: boolean;
  isJumping?: boolean;
  hideShadow?: boolean;
}) => {
  const rows = isJumping
    ? TERRORIST_HF_JUMP
    : runFrame % 2 === 0
      ? TERRORIST_HF_A
      : TERRORIST_HF_B;
  return (
    <svg
      viewBox="0 0 24 30"
      shapeRendering="crispEdges"
      className="w-full h-full pixelated overflow-visible"
      style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
    >
      {/* Ground Shadow */}
      {!hideShadow && <rect x={5} y={28} width={14} height={2} fill="#090D16" opacity={0.55} />}
      {renderPixelGridRle(rows, TERRORIST_PALETTE)}
      {/* Carried Realistic Tactical C4 Explosive Satchel */}
      {carryingBomb && (
        <g transform={isJumping ? 'translate(15, 12)' : 'translate(15, 15)'}>
          <rect x={0} y={0} width={9} height={7} fill="#090D16" />
          <rect x={1} y={1} width={7} height={5} fill="#365314" />
          <rect x={1} y={1} width={7} height={2} fill="#4D7C0F" />
          <rect x={2} y={1} width={1} height={5} fill="#1E293B" />
          <rect x={6} y={1} width={1} height={5} fill="#1E293B" />
          {/* Coiled wire & armed LED */}
          <rect x={3} y={2} width={3} height={2} fill="#0F172A" />
          <rect x={4} y={2} width={1} height={1} fill="#38BDF8" />
          <rect x={3} y={4} width={2} height={1} fill="#DC2626" />
          <rect x={5} y={3} width={1} height={1} fill={runFrame % 2 === 0 ? '#EF4444' : '#FEF08A'} />
        </g>
      )}
    </svg>
  );
});

// High-Detail Realistic 32x24 Tactical C4 Satchel Explosive with Metallic Clamps, Coiled Wires & Digital Detonator
const PixelSatchelBomb = React.memo(({ blinkOn }: { blinkOn: boolean }) => {
  return (
    <svg viewBox="0 0 32 24" shapeRendering="crispEdges" className="w-full h-full pixelated overflow-visible">
      {/* Ground Contact Shadow */}
      <rect x={3} y={20} width={26} height={3} fill="#05070C" opacity={0.75} />
      <rect x={5} y={21} width={22} height={2} fill="#000000" opacity={0.55} />

      {/* Heavy Nylon Carrying Handle / Shoulder Strap */}
      <rect x={10} y={1} width={12} height={2} fill="#090D16" />
      <rect x={9} y={2} width={2} height={3} fill="#090D16" />
      <rect x={21} y={2} width={2} height={3} fill="#090D16" />
      <rect x={11} y={2} width={10} height={1} fill="#334155" />
      <rect x={10} y={3} width={1} height={2} fill="#475569" />
      <rect x={21} y={3} width={1} height={2} fill="#475569" />

      {/* Outer Heavy Ballistic Satchel Outline */}
      <rect x={3} y={5} width={26} height={16} fill="#090D16" />
      <rect x={2} y={7} width={28} height={12} fill="#090D16" />

      {/* Dark Charcoal / Olive Tactical Bag Body with Top-Down Shading */}
      <rect x={4} y={6} width={24} height={14} fill="#1E293B" />
      <rect x={4} y={6} width={24} height={4} fill="#334155" />
      <rect x={5} y={7} width={22} height={2} fill="#475569" />
      <rect x={4} y={17} width={24} height={3} fill="#0F172A" />

      {/* Two Molded Olive-Drab C4 Explosive Bricks Peeking Under Open Flap */}
      <rect x={6} y={9} width={8} height={9} fill="#365314" />
      <rect x={7} y={10} width={6} height={3} fill="#4D7C0F" />
      <rect x={6} y={16} width={8} height={2} fill="#1A2E05" />

      <rect x={18} y={9} width={8} height={9} fill="#365314" />
      <rect x={19} y={10} width={6} height={3} fill="#4D7C0F" />
      <rect x={18} y={16} width={8} height={2} fill="#1A2E05" />

      {/* Heavy Black Kevlar Compression Straps & Brushed Steel Buckles */}
      <rect x={8} y={6} width={3} height={14} fill="#090D16" />
      <rect x={9} y={7} width={1} height={12} fill="#1E293B" />
      <rect x={8} y={12} width={3} height={3} fill="#94A3B8" />
      <rect x={9} y={13} width={1} height={1} fill="#F8FAFC" />

      <rect x={21} y={6} width={3} height={14} fill="#090D16" />
      <rect x={22} y={7} width={1} height={12} fill="#1E293B" />
      <rect x={21} y={12} width={3} height={3} fill="#94A3B8" />
      <rect x={22} y={13} width={1} height={1} fill="#F8FAFC" />

      {/* Exposed Red, Blue, & Yellow Detonator Wiring Loom */}
      <rect x={10} y={8} width={3} height={1} fill="#DC2626" />
      <rect x={12} y={7} width={2} height={2} fill="#EF4444" />
      <rect x={19} y={8} width={3} height={1} fill="#2563EB" />
      <rect x={18} y={9} width={2} height={2} fill="#3B82F6" />
      <rect x={11} y={17} width={3} height={1} fill="#EAB308" />
      <rect x={18} y={17} width={3} height={1} fill="#DC2626" />

      {/* Center Brushed-Metal Digital Timer & Blasting Cap Module */}
      <rect x={12} y={8} width={8} height={10} fill="#090D16" />
      <rect x={13} y={9} width={6} height={8} fill="#475569" />
      <rect x={13} y={9} width={6} height={1} fill="#94A3B8" />
      {/* Backlit Digital LCD Screen */}
      <rect x={14} y={10} width={4} height={3} fill="#020617" />
      <rect x={14} y={11} width={1} height={1} fill="#EF4444" />
      <rect x={16} y={11} width={2} height={1} fill="#DC2626" />
      {/* Keypad & Armed Blinking LED */}
      <rect x={14} y={14} width={1} height={1} fill="#94A3B8" />
      <rect x={16} y={14} width={1} height={1} fill="#94A3B8" />
      <rect x={18} y={14} width={1} height={1} fill="#94A3B8" />
      <rect x={14} y={15} width={2} height={1} fill={blinkOn ? '#FCA5A5' : '#7F1D1D'} />
      <rect x={17} y={15} width={1} height={1} fill={blinkOn ? '#FEF08A' : '#EF4444'} />

      {/* Metallic Blasting Cap Antenna / Receiver Tip */}
      <rect x={15} y={4} width={2} height={4} fill="#090D16" />
      <rect x={15} y={4} width={1} height={4} fill="#CBD5E1" />
      <rect x={15} y={3} width={2} height={2} fill={blinkOn ? '#EF4444' : '#7F1D1D'} />
    </svg>
  );
});

function PixelAlertShieldIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className}>
      <rect x={3} y={1} width={10} height={2} fill="#090D16" />
      <rect x={2} y={3} width={12} height={6} fill="#090D16" />
      <rect x={3} y={9} width={10} height={3} fill="#090D16" />
      <rect x={5} y={12} width={6} height={2} fill="#090D16" />
      <rect x={7} y={14} width={2} height={1} fill="#090D16" />
      <rect x={4} y={2} width={8} height={8} fill="#DC2626" />
      <rect x={3} y={3} width={10} height={6} fill="#DC2626" />
      <rect x={5} y={10} width={6} height={2} fill="#991B1B" />
      <rect x={7} y={12} width={2} height={2} fill="#991B1B" />
      <rect x={7} y={4} width={2} height={4} fill="#FEF08A" />
      <rect x={7} y={9} width={2} height={2} fill="#FEF08A" />
    </svg>
  );
}

function PixelWhiteHouseBlastIcon({ className = 'w-10 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 18" shapeRendering="crispEdges" className={className}>
      {/* Smoke & Fire */}
      <rect x={5} y={1} width={10} height={3} fill="#7F1D1D" />
      <rect x={3} y={3} width={14} height={4} fill="#DC2626" />
      <rect x={6} y={2} width={8} height={4} fill="#F97316" />
      <rect x={8} y={3} width={4} height={3} fill="#FEF08A" />
      {/* White House Portico */}
      <rect x={2} y={8} width={16} height={7} fill="#090D16" />
      <rect x={3} y={9} width={14} height={5} fill="#E2E8F0" />
      <rect x={6} y={7} width={8} height={2} fill="#CBD5E1" />
      <rect x={5} y={9} width={1} height={5} fill="#94A3B8" />
      <rect x={8} y={9} width={1} height={5} fill="#94A3B8" />
      <rect x={11} y={9} width={1} height={5} fill="#94A3B8" />
      <rect x={14} y={9} width={1} height={5} fill="#94A3B8" />
      {/* Blast Core */}
      <rect x={7} y={10} width={6} height={4} fill="#EA580C" />
      <rect x={8} y={11} width={4} height={3} fill="#FACC15" />
      <rect x={2} y={15} width={16} height={2} fill="#15803D" />
    </svg>
  );
}

// High-Fidelity 12-Tone 32-Bit Fire, Smoke & Blast Palette
const BOMB_FIRE_PALETTE: Record<string, string> = {
  '.': 'transparent',
  k: '#1C1917', // deep soot charcoal
  s: '#292524', // dark smoke
  S: '#44403C', // mid warm smoke
  d: '#450A0A', // charred ember dark
  r: '#7F1D1D', // deep crimson
  R: '#B91C1C', // bright crimson
  o: '#EA580C', // fire orange
  O: '#F97316', // vivid tangerine
  a: '#F59E0B', // amber
  y: '#FDE047', // bright yellow
  w: '#FEF9C3', // hot cream
  W: '#FFFFFF', // incandescent white
  g: '#64748B', // blasted stone
  G: '#CBD5E1', // bright masonry
};

// 6 Hand-Crafted 20x28 32-Bit Pixel Fire + Curling Smoke Frames (organic flame tongues & drifting sparks)
const WH_FIRE_FRAMES: string[][] = [
  [
    '.......kks..........',
    '......kssSk.........',
    '.....kssSSk...w.....',
    '......kssk..........',
    '........y.....a.....',
    '......oao...........',
    '.....RaaO....r......',
    '.....oOya...oa......',
    '....rOyyar.oao......',
    '...roOyyyo.oaOo.....',
    '...rOyyyyooOyaO.....',
    '..rROywwyOOyyya.....',
    '..roaywwyaOyyyao....',
    '..rOyywwyyayyyyar...',
    '.roOyywwyyyywwyyo...',
    '.rOayywwwyywwwwyo...',
    '.rOayywwwwywwwwyao..',
    'rROaywwwwwwwwwwyyr..',
    'roOayywwwwwwwwyyyo..',
    'dROOayyywwwwyyyOor..',
    'droOaaayyyyyyaaOor..',
    '.drrooooaaaaaaoOor..',
    '.ddrrRroooooorrrrd..',
    '..ddrrrrrrrrrrrrdd..',
    '...ddddddddddddd....',
    '....................',
  ],
  [
    '..........ksk.......',
    '....w....kssSk......',
    '........kssSSk......',
    '......y..kssk.......',
    '.....a..........o...',
    '..............oa....',
    '.....ro......yO.....',
    '.....oaO....oao.....',
    '....rOya...OyaO.....',
    '....oOyyo.oOyyar....',
    '...roayyooOyyyyo....',
    '...oOyyyyayyyyao....',
    '..rOyywwyOyyyyyo....',
    '..oOywwwyayywwyor...',
    '.rOaywwwyyyywwyyr...',
    '.oOyywwwwyywwwyyo...',
    '.oayywwwwywwwwyyo...',
    'rOayywwwwwwwwwyyor..',
    'rOaywwwwwwwwwwyyyr..',
    '.oOayywwwwwwyyyor...',
    '.rROayyywwyyyOoor...',
    '.droOaaayyyaaaOord..',
    '.drrrooooooooorrrd..',
    '..ddrrrrrrrrrrrdd...',
    '...dddddddddddddd...',
    '....................',
  ],
  [
    '.....ksk............',
    '....kssSk.....w.....',
    '...kssSSk...........',
    '....kssk....y.......',
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
    '.dRroooaaaaaaooRrd..',
    '.ddrrrrrooooorrrdd..',
    '..dddrrrrrrrrrddd...',
    '...ddddddddddddd....',
    '....................',
  ],
  [
    '..........kks.......',
    '.........kssSk......',
    '...w.....kssSk......',
    '..........kk........',
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
    '.oOyywwyyyywwyor....',
    '.oayywwwyywwwyyo....',
    'rOayywwwwywwwwyo....',
    'rOaywwwwwwwwwwyyr...',
    '.oayywwwwwwwwyyyo...',
    '.rOayyywwwwyyyOor...',
    '.rROaaayyyyyyaOor...',
    '.drroooaaaaaaooord..',
    '..drrrrooooooorrd...',
    '..dddrrrrrrrrrddd...',
    '...ddddddddddddd....',
    '....................',
  ],
  [
    '........ksk.........',
    '.......kssSk........',
    '......kssSSk........',
    '.......kssk....w....',
    '......a......y......',
    '......ro.....a......',
    '.....oaO....ro......',
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
    '.droOaaayyyaaaOord..',
    '.ddrrrooooooooorrd..',
    '..ddrrrrrrrrrrrdd...',
    '...ddddddddddddd....',
    '....................',
  ],
  [
    '......ksk...........',
    '.....kssSk..........',
    '....kssSSk..........',
    '.....kssk.....y.....',
    '...w..........o.....',
    '.......ao...........',
    '......oao....r......',
    '.....OyaO...oa......',
    '....rOyyor.oao......',
    '...roOyyyoOyaO......',
    '...oOyyyyyOyyo......',
    '..rOyywwyOyyyao.....',
    '..oaywwwyayyyyor....',
    '.rOyywwwyyyywwyo....',
    '.oOyywwwwyywwwyor...',
    '.oayywwwwywwwwyyo...',
    'rOayywwwwwwwwwyyor..',
    'rOaywwwwwwwwwwyyyr..',
    '.oOayywwwwwwyyyor...',
    '.rROayyywwyyyOoor...',
    '.rroOaaayyyaaOoor...',
    '.dRroooaaaaaaoord...',
    '..drrrrrooooorrrd...',
    '..dddrrrrrrrrrddd...',
    '...ddddddddddddd....',
    '....................',
  ],
];

// 3 Hand-Crafted 48x34 32-Bit Volumetric Pixel Explosion Plume Sprites (no boxy rects, no thin geometric circles)
const BLAST_PLUME_FRAMES: string[][] = [
  // Stage 0: Initial Superheated Fireball Flash & Boiling Plumes
  [
    '................................................',
    '..................rrrrrrrrrr....................',
    '..............rrrrROOOOOOOORrrrr................',
    '...........rrrROOOaaayyyyyaaaOOORrr.............',
    '.........rrROOayyywwwwWWWWwwwwyyyOORr...........',
    '.......rrROayywWWWWWWWWWWWWWWWWWWwyOORr.........',
    '......rROaywWWWWWWWWWWWWWWWWWWWWWWWwaORr........',
    '.....rROaywWWWWWWWWWWWWWWWWWWWWWWWWWWaORr.......',
    '....rROaywWWWWWWWWWWWWWWWWWWWWWWWWWWWWaORr......',
    '...rROaywWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWaORr.....',
    '...rOaywWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWaOr.....',
    '..rROaywWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWaORr....',
    '..rOaywWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWaOr....',
    '..rOaywWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWaOr....',
    '..rROaywWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWaORr....',
    '...rOaywWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWaOr.....',
    '...rROaywWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWaORr.....',
    '....rROayyWWWWWWWWWWWWWWWWWWWWWWWWWWWWyaORr.....',
    '.....rROayyywwwwWWWWWWWWWWWWWWWWwwwwyyaORr......',
    '......rrROaaayyyyywwwwWWWWwwwwyyyyyaaORrr.......',
    '........rrrROOOaaaayyyyyyyyyyaaaaOOORrr.........',
    '...........rrrrROOOOOaaaaaaaOOOOORrrr...........',
    '...............drrrrrrrrrrrrrrrrrd..............',
    '................................................',
  ],
  // Stage 1: Expanding Convective Orange-Gold Fireball Cloud with Dark Soot Cauliflower Rim
  [
    '...............kkkkk.......kkkkk................',
    '............kkkssSSskk...kkssSSskkk.............',
    '..........kkssSSSssddrrrrddssSSSSskk............',
    '........kkssSSddrrRROOOOOORRRrddSSskkk..........',
    '.......kssSddrrROOOaayyyyyaaOOORrrdSssk.........',
    '.....kksSdrRROOaayywwwWWWWwwwyyaOOORrdSSk.......',
    '....kssSdrROaaywwWWWWWWWWWWWWWWwyaOORrdSsk......',
    '...kssSdrROaywWWWWWWWWWWWWWWWWWWWwaOORrdSsk.....',
    '..kssSdrROaywWWWWWWWWWWWWWWWWWWWWWwaOORrdSsk....',
    '..ksSdrROaywwWWWWWWWWWWWWWWWWWWWWWWwaOORrdSk....',
    '.kksSdrROaywWWWWWWWWWWWWWWWWWWWWWWWWwaORrdSkk...',
    '.ksSdrROOaywWWWWWWWWWWWWWWWWWWWWWWWWwaOORrdSk...',
    '.ksSdrROaywwWWWWWWWWWWWWWWWWWWWWWWWwwaOORrdSk...',
    '.kksSdrROayywwWWWWWWWWWWWWWWWWWWWwwwyaOORrdSk...',
    '..ksSdrROOayyywwwWWWWWWWWWWWWWWwwwyyaOOORrdSk...',
    '..kksSdrrROaayyyyywwwwWWWWwwwwyyyyyaOORrrdSkk...',
    '...kksSdrrROOOaaaayyyyyyyyyyyyaaaaOOORrrdSsk....',
    '....kssSddrrROOOOOOaaaaaaaaaaOOOOOORrrddSSk.....',
    '.....kkssSdddrrrRROOOOOOOOOOOORRRrrrdddSsk......',
    '.......kkkssSddddrrrrrrrrrrrrrrrrddddSskk.......',
    '..........kkksssSSddddddddddddddSSssskkk........',
    '..............kkkkkkkkkkkkkkkkkkkkkk............',
    '................................................',
    '................................................',
  ],
  // Stage 2: Towering Dark Billowing Smoke Plume with Molten Underbelly & Glowing Cracks
  [
    '.............kkkkkk.........kkkkkk..............',
    '..........kkksssSSskkk...kkkssSSSskkk...........',
    '........kkssSSSSSSssskk.kksssSSSSSSsskk.........',
    '......kkssSSssssssSSskk.kssSSssssssSSsskk.......',
    '.....kssSSsskkkkssSSsskkkssSSsskkkkssSSssk......',
    '....kssSSskkkkkkkssSSsssssSSskkkkkkkssSSssk.....',
    '...kssSSskkkddddkkssSSSSSSSskkkddddkkssSSssk....',
    '...ksSSskkddrrrrddkssSSSSSskkddrrrrddkssSSsk....',
    '..kssSSskddrrRRRrddkkssssskkddrrRRRrddkssSSsk...',
    '..kssSskkdrrROOORrrdkkkkkkddrrROOORrrdkksSSsk...',
    '.kkssSskdrrROOyaOORrddddddrrROOayOORrdkkssSskk..',
    '.kssSSskdrROOaywaOORrrrrrrROOaywaOORrdksSSsssk..',
    '.kssSskkdrROaywWwaOORRRRRROOaywWwaOORrdksSSssk..',
    '.kkssSkkdrROaywWWwaOOOOOOOOaywWWwaOORrdkssSskk..',
    '..kssSskdrrROaywwwyaaaaaaaaywwwyaOORrdkkssSsk...',
    '..kssSSskdrrROOayyyyyyyyyyyyyyaOOORrdkksSSssk...',
    '...kssSSskddrrROOOaaaaaaaaaaOOORrrddkkssSSsk....',
    '....kkssSSskddrrRROOOOOOOOOORRRrddkssSSsskk.....',
    '.....kkssSSskkddrrrRRRRRRRRrrrddkkssSSsskk......',
    '.......kkkssSSskkddddrrrrrddddkkssSSsskk........',
    '..........kkkssSSsskkkkkkkkkssSSsskkk...........',
    '.............kkkkksssssssssskkkkk...............',
    '................................................',
    '................................................',
  ],
];

// 52x12 Hand-Crafted Pixel Ground Scorch & Masonry Rubble Crater Sprite
const CRATER_SPRITE: string[] = [
  '.................ddddrrrrrrrrdddd...................',
  '...........ddddddrrrrRRRRRRRRrrrrdddddd.............',
  '.......ddddrrrrrRROOOooooooooOOORRRrrrrdddd.........',
  '....dddrrrrrRROOOoaaayyyyyyyyaaaoOOORRrrrrrddd......',
  '..ddkkkkdrrROOoayywwwwWWWWWWwwwwyyaoOORrrdkkkkdd....',
  '.dkkkkkkdrROOaywwWWGGGGWWWWGGGGWWwyaOORrdkkkkkkkd...',
  '.dkkGGkkdrROaywWGGGggWWWWWWWWggGGGwyaORrdkkGGkkkd...',
  '..ddkkkkdrrROoayywwGGGGWWWWGGGGwwyaoOORrdkkkkkdd....',
  '....dddrrrrRROOoooaaayyyyyyyyaaaoooOORrrrrrddd......',
  '.......ddddrrrrrRRROOOOOOOOOOOORRRrrrrdddd..........',
  '...........ddddddrrrrrrrrrrrrrrrrdddddd.............',
  '.................kkkkkkkkkkkkkkkk...................',
];

// 22x12 Curling Shockwave Dust & Spark Puff Sprite (flips horizontally for left/right waves)
const DUST_WAVE_SPRITE: string[] = [
  '........kkkkkk..........',
  '.....kkkssSSsskk........',
  '...kkssSSSssSSssk.......',
  '..kssSSddrrrrdSSsk......',
  '.ksSSdrROOaaOORdSsk.....',
  'ksSSdrROaywwyaORdSsk....',
  'ksSdrROOaywWWyaORdSsk...',
  'ksSdrROoaaayyaOORdSsk...',
  '.ksSddrRROOOOORrdSsk....',
  '..kssSdddrrrrdddSsk.....',
  '...kkksssSSSSssskk......',
  '.......kkkkkkkk.........',
];

interface WhiteHouseFireCluster {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  delay: number;
  frameOffset: number;
  fps: number;
}

interface BlastDebrisChunk {
  bx: number;
  by: number;
  vx: number;
  vy: number;
  gravity: number;
  w: number;
  h: number;
  color: string;
  edgeColor: string;
  phase: number;
}

function createSeededRng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateRandomizedBlastLayout(seed: number) {
  const rand = createSeededRng(seed * 2654435761 + 1337);

  // Randomized hand-crafted pixel fire clusters spreading from portico outward across both wings
  const fireNodes: WhiteHouseFireCluster[] = [];
  const addCluster = (
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    minScale: number,
    maxScale: number,
    delayScale: number
  ) => {
    const x = xMin + rand() * (xMax - xMin);
    const y = yMin + rand() * (yMax - yMin);
    const normDist = Math.abs(x - 120) / 115;
    const sc = minScale + rand() * (maxScale - minScale);
    fireNodes.push({
      x,
      y,
      scaleX: sc * (0.9 + rand() * 0.22),
      scaleY: sc * (0.92 + rand() * 0.24),
      flipX: rand() > 0.5,
      delay: Math.min(0.84, Math.max(0.03, normDist * delayScale + rand() * 0.14)),
      frameOffset: Math.floor(rand() * WH_FIRE_FRAMES.length),
      fps: 8 + rand() * 4.5,
    });
  };

  // Dense core flames engulfing South Portico & columns
  for (let i = 0; i < 8; i++) addCluster(95, 145, 9, 28, 0.85, 1.25, 0.26);
  // Inner colonnades & wing roofs
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) addCluster(52, 96, 10, 25, 0.72, 1.08, 0.62);
    else addCluster(144, 188, 10, 25, 0.72, 1.08, 0.62);
  }
  // Outer West & East Wings and lawn hedges
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) addCluster(8, 54, 10, 23, 0.65, 1.02, 0.82);
    else addCluster(186, 232, 10, 23, 0.65, 1.02, 0.82);
  }

  // Secondary smaller curling smoke/fire wisps behind the main explosion
  const subPlumes = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + (rand() - 0.5) * 0.55;
    const radius = 14 + rand() * 14;
    return {
      ox: Math.cos(angle) * radius * 1.35,
      oy: Math.sin(angle) * radius * 0.65 - 4,
      scale: 0.45 + rand() * 0.28,
      flipX: rand() > 0.5,
      delay: 0.04 + rand() * 0.14,
    };
  });

  // Randomized jagged pixel masonry debris & sparks
  const chunkPalettes = [
    { c: '#FEF9C3', e: '#F97316' },
    { c: '#FDE047', e: '#EA580C' },
    { c: '#F97316', e: '#991B1B' },
    { c: '#E2E8F0', e: '#475569' },
    { c: '#CBD5E1', e: '#334155' },
  ];
  const debrisParticles: BlastDebrisChunk[] = Array.from({ length: 26 }, () => {
    const angle = rand() * Math.PI * 2;
    const speed = 32 + rand() * 76;
    const pal = chunkPalettes[Math.floor(rand() * chunkPalettes.length)];
    const isChunk = rand() > 0.58;
    return {
      bx: 120 + (rand() - 0.5) * 14,
      by: 37 + (rand() - 0.5) * 8,
      vx: Math.cos(angle) * speed * 1.25,
      vy: Math.sin(angle) * speed * 0.72 - 16 - rand() * 20,
      gravity: 24 + rand() * 34,
      w: isChunk ? 3 : 2,
      h: isChunk ? 2 : 1,
      color: pal.c,
      edgeColor: pal.e,
      phase: rand() * Math.PI * 2,
    };
  });

  return { fireNodes, subPlumes, debrisParticles };
}

interface BombSpriteBank {
  fires: HTMLCanvasElement[];
  blastPlumes: HTMLCanvasElement[];
  crater: HTMLCanvasElement;
  dustWave: HTMLCanvasElement;
}

let cachedBombSpriteBank: BombSpriteBank | null = null;

function bakePixelSpriteCanvas(
  rows: string[],
  palette: Record<string, string>
): HTMLCanvasElement {
  const h = rows.length;
  const w = rows[0]?.length || 1;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const color = palette[ch];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, end - x, 1);
      }
      x = end;
    }
  }
  return canvas;
}

function getBombSpriteBank(): BombSpriteBank {
  if (!cachedBombSpriteBank) {
    cachedBombSpriteBank = {
      fires: WH_FIRE_FRAMES.map((rows) => bakePixelSpriteCanvas(rows, BOMB_FIRE_PALETTE)),
      blastPlumes: BLAST_PLUME_FRAMES.map((rows) => bakePixelSpriteCanvas(rows, BOMB_FIRE_PALETTE)),
      crater: bakePixelSpriteCanvas(CRATER_SPRITE, BOMB_FIRE_PALETTE),
      dustWave: bakePixelSpriteCanvas(DUST_WAVE_SPRITE, BOMB_FIRE_PALETTE),
    };
  }
  return cachedBombSpriteBank;
}

// High-Fidelity 32-Bit Pixel Explosion & Spreading White House Fire (240x135 Crisp Pixel Canvas)
const WhiteHouseBombExplosionCanvas = React.memo(function WhiteHouseBombExplosionCanvas({
  detonationOriginMs,
  launchId,
}: {
  detonationOriginMs: number;
  launchId: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layout = useMemo(() => generateRandomizedBlastLayout(launchId || 1), [launchId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bank = getBombSpriteBank();
    let rafId = 0;
    let lastDraw = 0;

    const draw = (now: number) => {
      const detTimeMs = Math.max(0, now - detonationOriginMs);
      const detProgress = Math.min(1, detTimeMs / 3200);
      const isSettled = detTimeMs > GAME_OVER_MS - DETONATION_MS + 400;

      // Full native framerate during blast & spread; smooth 15fps fire crackle once Game Over modal is settled
      if (isSettled && now - lastDraw < 66) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      lastDraw = now;

      ctx.clearRect(0, 0, 240, 135);
      ctx.imageSmoothingEnabled = false;

      const spread = Math.min(1, detProgress * 1.45);
      const smokeRise = Math.min(1, detProgress * 1.15);
      const waveProg = Math.min(1, detProgress / 0.55);

      const craterScale = 0.72 + spread * 0.88;
      const mainScale = 0.88 + spread * 0.82;
      const mainPlumeIdx = detProgress < 0.16 ? 0 : detProgress < 0.42 ? 1 : 2;
      const waveDist = Math.round(18 + waveProg * 78);

      // 1. Ground Scorch & Masonry Crater Pixel Sprite at South Portico
      ctx.save();
      ctx.globalAlpha = Math.max(0.45, 0.95 - detProgress * 0.3);
      ctx.translate(120, 41);
      ctx.scale(craterScale, craterScale * 0.9);
      ctx.drawImage(bank.crater, -26, -6);
      ctx.restore();

      // 2. Curling Pixel Dust & Fire Shockwave Plumes Racing Left & Right
      if (waveProg < 0.96) {
        const waveY = Math.round(39 - waveProg * 3);
        const waveAlpha = Math.max(0, 1 - waveProg * 1.04);

        ctx.save();
        ctx.globalAlpha = waveAlpha;
        ctx.translate(120 - waveDist, waveY);
        ctx.scale(1.1, 1.1);
        ctx.drawImage(bank.dustWave, -11, -6);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = waveAlpha;
        ctx.translate(120 + waveDist, waveY);
        ctx.scale(-1.1, 1.1);
        ctx.drawImage(bank.dustWave, -11, -6);
        ctx.restore();
      }

      // 3. Secondary Randomized Billowing Blast Plumes
      const plumeIdx = detProgress < 0.3 ? 1 : 2;
      const subPlumeSprite = bank.blastPlumes[plumeIdx];
      for (let i = 0; i < layout.subPlumes.length; i++) {
        const sp = layout.subPlumes[i];
        if (detProgress < sp.delay) continue;
        const localGrow = Math.min(1, (detProgress - sp.delay) / 0.25);
        const sc = sp.scale * (0.65 + localGrow * 0.65);

        ctx.save();
        ctx.globalAlpha = Math.max(0.32, 0.78 - detProgress * 0.38);
        ctx.translate(
          Math.round(120 + sp.ox * (0.6 + spread * 0.6)),
          Math.round(37 + sp.oy - smokeRise * 7)
        );
        ctx.scale(sp.flipX ? -sc : sc, sc);
        ctx.drawImage(subPlumeSprite, -24, -12);
        ctx.restore();
      }

      // 4. Main Center 32-Bit Pixel Explosion Fireball -> Billowing Smoke Cloud
      ctx.save();
      ctx.globalAlpha = Math.max(0.62, 1 - detProgress * 0.3);
      ctx.translate(120, Math.round(39 - smokeRise * 12));
      ctx.scale(mainScale, mainScale);
      ctx.drawImage(bank.blastPlumes[mainPlumeIdx], -24, -12);
      ctx.restore();

      // 5. Randomized Spreading Multi-Frame 32-Bit Pixel Fire + Curling Smoke Across White House
      const detSec = detTimeMs / 1000;
      for (let idx = 0; idx < layout.fireNodes.length; idx++) {
        const node = layout.fireNodes[idx];
        if (detProgress < node.delay) continue;
        const grow = Math.min(1, (detProgress - node.delay) / 0.16);
        const frameIdx =
          (Math.floor(detSec * node.fps) + node.frameOffset) % bank.fires.length;

        ctx.save();
        ctx.translate(Math.round(node.x), Math.round(node.y));
        ctx.scale(node.scaleX * grow * (node.flipX ? -1 : 1), node.scaleY * grow);
        ctx.drawImage(bank.fires[frameIdx], -10, -24);
        ctx.restore();
      }

      // 6. Randomized Jagged Pixel Masonry Chunks & Hot Sparks
      if (detProgress < 0.99) {
        const fade = Math.max(0, 1 - detProgress * 0.85);
        if (fade > 0.05) {
          ctx.globalAlpha = fade;
          for (let i = 0; i < layout.debrisParticles.length; i++) {
            const p = layout.debrisParticles[i];
            const px = Math.round(p.bx + p.vx * detProgress);
            const py = Math.round(
              p.by + p.vy * detProgress + 0.5 * p.gravity * detProgress * detProgress
            );
            ctx.fillStyle = p.edgeColor;
            ctx.fillRect(px, py, p.w, p.h);
            ctx.fillStyle = p.color;
            ctx.fillRect(px, py, Math.max(1, p.w - 1), 1);
          }
          ctx.globalAlpha = 1;
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [detonationOriginMs, layout]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={135}
      className="absolute inset-0 w-full h-full pixelated pointer-events-none"
    />
  );
});

export const PixelWhiteHouseBombingOverlay: React.FC<PixelWhiteHouseBombingOverlayProps> = React.memo(({
  active,
  launchId = 0,
  startedAtMs = 0,
  onClose,
  onRestartGame,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [originMs, setOriginMs] = useState<number>(0);

  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      setOriginMs(0);
      return;
    }

    let rafId = 0;
    const origin = startedAtMs > 0 ? startedAtMs : performance.now();
    setOriginMs(origin);
    setElapsedMs(Math.max(0, performance.now() - origin));

    const tick = (now: number) => {
      const dt = Math.max(0, now - origin);
      setElapsedMs(dt);
      // Stop ticking React once Game Over modal is up & shake/flash finished; canvas keeps crackling fire at 0% React cost
      if (dt < GAME_OVER_MS + 100) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, launchId, startedAtMs]);

  if (!active) return null;

  const isDetonated = elapsedMs >= DETONATION_MS;
  const showGameOver = isDetonated && elapsedMs >= GAME_OVER_MS;

  // Terrorist pathing: street -> jump over White House wrought-iron fence -> front portico lawn -> escape
  let terroristX = 50;
  let terroristY = 31;
  let jumpLiftPct = 0;
  let isJumping = false;
  let terroristFlipX = false;
  let terroristVisible = !isDetonated;
  let carryingBomb = true;

  if (elapsedMs < FENCE_APPROACH_MS) {
    const p = elapsedMs / FENCE_APPROACH_MS;
    terroristX = 44.5 + p * (46 - 44.5);
    terroristY = 90 + p * (74.5 - 90);
    terroristFlipX = false;
    carryingBomb = true;
  } else if (elapsedMs < FENCE_LAND_MS) {
    const p = (elapsedMs - FENCE_APPROACH_MS) / (FENCE_LAND_MS - FENCE_APPROACH_MS);
    terroristX = 46 + p * (47 - 46);
    terroristY = 74.5 + p * (54.5 - 74.5);
    jumpLiftPct = Math.sin(p * Math.PI) * 11;
    isJumping = true;
    terroristFlipX = false;
    carryingBomb = true;
  } else if (elapsedMs < PORTICO_REACH_MS) {
    const p = (elapsedMs - FENCE_LAND_MS) / (PORTICO_REACH_MS - FENCE_LAND_MS);
    terroristX = 47 + p * (50 - 47);
    terroristY = 54.5 + p * (31 - 54.5);
    terroristFlipX = false;
    carryingBomb = true;
  } else if (elapsedMs < DETONATION_MS) {
    const p = (elapsedMs - PORTICO_REACH_MS) / (DETONATION_MS - PORTICO_REACH_MS);
    terroristX = 50 + p * 20;
    terroristY = 31 + p * 28;
    terroristFlipX = false;
    carryingBomb = false;
  } else {
    terroristVisible = false;
    carryingBomb = false;
  }

  const bombPlanted = elapsedMs >= PORTICO_REACH_MS && !isDetonated;
  const countdownSec = Math.max(0, (DETONATION_MS - elapsedMs) / 1000).toFixed(1);
  const blinkRateMs = Math.max(90, 320 - Math.max(0, elapsedMs - PORTICO_REACH_MS) * 0.11);
  const bombBlinkOn = Math.floor(elapsedMs / blinkRateMs) % 2 === 0;
  const runFrame = Math.floor(elapsedMs / 95);

  const sirenPulse = !isDetonated
    ? 0.12 + 0.18 * Math.max(0, Math.sin((elapsedMs / 1000) * Math.PI * 2.5))
    : 0;

  const whiteFlashOpacity =
    elapsedMs >= DETONATION_MS && elapsedMs <= DETONATION_MS + 650
      ? Math.max(0, 1 - (elapsedMs - DETONATION_MS) / 650)
      : 0;

  const shakeIntensity =
    elapsedMs >= DETONATION_MS && elapsedMs <= DETONATION_MS + 3000
      ? Math.max(0, 1 - (elapsedMs - DETONATION_MS) / 3000) * 14
      : 0;
  const shakeX = shakeIntensity > 0 ? Math.sin(elapsedMs * 0.12) * shakeIntensity : 0;
  const shakeY = shakeIntensity > 0 ? Math.cos(elapsedMs * 0.14) * shakeIntensity : 0;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-[996] pointer-events-auto overflow-hidden select-none bg-[#090D16]"
      style={{
        imageRendering: 'pixelated',
        transform:
          shakeIntensity > 0
            ? `translate(${shakeX.toFixed(1)}px, ${shakeY.toFixed(1)}px)`
            : undefined,
      }}
    >
      {/* 1. White House South Lawn 32-Bit Pixel Backdrop */}
      <img
        src={lawnMapUrl}
        alt="White House South Lawn Terrorist Attack"
        draggable={false}
        className="absolute inset-0 w-full h-full object-fill pixelated pointer-events-none"
      />

      {/* 2. Red Alert Strobe */}
      {!isDetonated && (
        <div
          className="absolute inset-0 bg-red-600 pointer-events-none"
          style={{ opacity: sirenPulse }}
        />
      )}

      {/* 3. Running / Fence-Jumping / Planting Pixel Terrorist + Ground Shadow */}
      {terroristVisible && (
        <>
          {/* Independent ground shadow (stays on ground track while terrorist arcs over the fence) */}
          <div
            className="absolute pointer-events-none z-10 bg-[#090D16]"
            style={{
              left: `${terroristX}%`,
              top: `${terroristY}%`,
              width: `${Math.max(1.8, 3.1 - jumpLiftPct * 0.11)}%`,
              height: '1%',
              opacity: Math.max(0.25, 0.55 - jumpLiftPct * 0.025),
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: `${terroristX}%`,
              top: `${terroristY - jumpLiftPct}%`,
              width: '6%',
              aspectRatio: '24 / 30',
              transform: 'translate(-50%, -88%)',
            }}
          >
            <PixelTerroristSprite
              runFrame={runFrame}
              carryingBomb={carryingBomb}
              flipX={terroristFlipX}
              isJumping={isJumping}
              hideShadow={true}
            />
          </div>
        </>
      )}

      {/* 4. Planted Realistic Tactical C4 Bomb with Pulsing Danger Shader Glow & Beveled Countdown */}
      {bombPlanted && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: '50%',
            top: '31%',
            width: '8.2%',
            aspectRatio: '32 / 24',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Pulsing Red Danger Halo Shader Under Bomb */}
          <div
            className="absolute -inset-3 pointer-events-none"
            style={{
              background: bombBlinkOn
                ? 'radial-gradient(circle, rgba(239,68,68,0.65) 0%, rgba(220,38,38,0.22) 55%, transparent 75%)'
                : 'radial-gradient(circle, rgba(153,27,27,0.4) 0%, rgba(127,29,29,0.12) 50%, transparent 75%)',
            }}
          />
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 border-2 border-[#DC2626] font-mono font-bold text-xs tabular-nums text-[#FEF08A] whitespace-nowrap"
            style={{
              background: 'linear-gradient(180deg, #450A0A 0%, #1B0609 100%)',
              boxShadow:
                'inset 1px 1px 0 0 #FCA5A5, 0 0 0 1px #090D16, 0 3px 0 0 #090D16, 0 0 12px rgba(220,38,38,0.55)',
            }}
          >
            {countdownSec}S
          </div>
          <div className="relative w-full h-full">
            <PixelSatchelBomb blinkOn={bombBlinkOn} />
          </div>
        </div>
      )}

      {/* 5. Detonation Scorch Glow + Pixel Fireball & Masonry Debris */}
      {isDetonated && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: showGameOver
                ? 'radial-gradient(circle at 50% 34%, rgba(185,28,28,0.82) 0%, rgba(127,29,29,0.92) 55%, rgba(28,6,6,0.97) 100%)'
                : 'radial-gradient(circle at 50% 31%, rgba(254,240,138,0.62) 0%, rgba(234,88,12,0.58) 38%, rgba(153,27,27,0.7) 74%, rgba(28,6,6,0.82) 100%)',
            }}
          />
          <WhiteHouseBombExplosionCanvas
            detonationOriginMs={(originMs || performance.now()) + DETONATION_MS}
            launchId={launchId}
          />
        </>
      )}

      {/* 6. Blinding Thermal Flash Curtain */}
      {whiteFlashOpacity > 0.01 && (
        <div
          className="absolute inset-0 bg-[#FEF9C3] pointer-events-none"
          style={{ opacity: whiteFlashOpacity }}
        />
      )}

      {/* 7. High-Fidelity Shader-Styled Top Alert Plaque ("TERRORIST ATTACK" only, no SEC/DEFCON bars) */}
      {!showGameOver && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div
            className="relative px-4 py-2.5 flex items-center gap-3 overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, #1B2642 0%, #131B2E 52%, #0C1220 100%)',
              boxShadow: `${PIXEL_PLAQUE_SHADOW}, 0 14px 28px rgba(0, 0, 0, 0.78), 0 0 28px rgba(220, 38, 38, 0.34)`,
            }}
          >
            {/* Diagonal Monitor Glass Sheen & Scanline Texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(125deg, rgba(255,255,255,0.08) 0%, transparent 45%, rgba(220,38,38,0.12) 100%)',
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)',
              }}
            />

            <div
              className="relative w-7 h-7 shrink-0 p-1 border-2 border-[#DC2626] flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #1E090D 0%, #090D16 100%)',
                boxShadow:
                  'inset 1px 1px 0 0 #FCA5A5, 0 0 10px rgba(220,38,38,0.45)',
              }}
            >
              <PixelAlertShieldIcon className="w-full h-full" />
            </div>
            <span
              className="relative font-mono font-bold text-xs sm:text-sm tracking-[0.14em] text-[#FEF08A] uppercase whitespace-nowrap"
              style={{
                textShadow: '0 2px 0 #090D16, 0 0 12px rgba(250, 204, 21, 0.45)',
              }}
            >
              TERRORIST ATTACK
            </span>
            {bombPlanted && (
              <span
                className="relative px-2 py-0.5 border-2 border-[#090D16] font-mono font-bold text-xs tabular-nums text-[#FEF08A]"
                style={{
                  background: 'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)',
                  boxShadow:
                    'inset 1px 1px 0 0 #FCA5A5, 0 0 12px rgba(239,68,68,0.55)',
                }}
              >
                {countdownSec}S
              </span>
            )}
          </div>
        </div>
      )}

      {/* 7b. Trump Mid-Attack Reaction Quote synced to 1.85s voice line */}
      {!isDetonated && elapsedMs >= 1850 && elapsedMs <= 5800 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 max-w-[92%]">
          <div
            className="px-4 py-2 flex items-center justify-center gap-2.5 bg-[#131B2E] text-center"
            style={{ boxShadow: PIXEL_PLAQUE_SHADOW }}
          >
            <span className="font-mono font-bold text-[10px] sm:text-xs tracking-[0.12em] text-[#FCA5A5] uppercase whitespace-nowrap shrink-0">
              TRUMP:
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm text-[#FEF08A]">
              &ldquo;This is Sleepy Joe&apos;s fault, he allowed all the criminals in.&rdquo;
            </span>
          </div>
        </div>
      )}

      {/* 8. High-Fidelity 32-Bit Pixel GAME OVER Modal */}
      {showGameOver && (
        <PixelGameOverModal
          emblem="bombing"
          subtitle="WHITE HOUSE BOMBED"
          incidentLabel="INCIDENT"
          incidentValue="TERRORIST ATTACK"
          reasonValue="0% SECURITY"
          portrait={
            <div className="w-8 h-9">
              <PixelTerroristSprite runFrame={0} carryingBomb={true} flipX={false} hideShadow={true} />
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
