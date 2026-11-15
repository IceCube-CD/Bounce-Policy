import React from 'react';
import { Direction } from './PixelCharacter';
import { BodyguardVariant } from '../types/engine';
import { renderPixelGridRle } from '../utils/pixelGridCache';

interface PixelBodyguardProps {
  direction: Direction;
  variant?: BodyguardVariant;
  cheering?: boolean;
  scared?: boolean;
  cheerText?: string;
  jumpSeed?: string | number;
  className?: string;
}

const HOP_KEYFRAMES = [
  'rally-crowd-hop-a',
  'rally-crowd-hop-b',
  'rally-crowd-hop-c',
] as const;

function getCrowdHopTiming(seedInput: string) {
  let h = 2166136261;
  for (let i = 0; i < seedInput.length; i++) {
    h ^= seedInput.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u1 = ((h >>> 0) % 1000) / 1000;
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  const u2 = ((h >>> 0) % 1000) / 1000;
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  const u3 = ((h >>> 0) % 1000) / 1000;
  h = Math.imul(h ^ (h >>> 16), 668265263);
  const u4 = ((h >>> 0) % 1000) / 1000;

  const animationName = HOP_KEYFRAMES[Math.floor(u1 * HOP_KEYFRAMES.length)];
  const durationSec = +(1.75 + u2 * 1.45).toFixed(2);
  const delaySec = +(-(u3 * durationSec)).toFixed(2);
  const commentDurationSec = +(4.2 + u4 * 2.3).toFixed(2);
  const commentDelaySec = +(-(u1 * commentDurationSec)).toFixed(2);
  const urgentDurationSec = +(2.0 + u2 * 0.85).toFixed(2);
  const urgentDelaySec = +(-(u3 * urgentDurationSec * 0.45)).toFixed(2);

  return {
    animationName,
    durationSec,
    delaySec,
    commentDurationSec,
    commentDelaySec,
    urgentDurationSec,
    urgentDelaySec,
  };
}

const DARK_HAIR_PALETTE: Record<string, string> = {
  '.': 'transparent',
  o: '#0B0E17', // crisp dark pixel outline
  // Cropped dark hair (3 tones)
  h: '#151924',
  g: '#262E40',
  y: '#3B465E',
  // Skin tones (warm fair-medium)
  d: '#A66342',
  S: '#C9835B',
  s: '#E5A278',
  f: '#F2BE9A',
  // Aviator Sunglasses & Glint
  B: '#07090F',
  G: '#1E3A5F',
  L: '#60A5FA',
  // Earpiece & Coiled Cord
  E: '#F1F5F9',
  e: '#94A3B8',
  // Charcoal-Black Tailored Secret Service Suit (5 tones)
  N: '#0A0D14',
  n: '#141926',
  u: '#1F2638',
  l: '#2E3850',
  U: '#414F6E',
  // Crisp White Dress Shirt
  w: '#F8FAFC',
  c: '#CBD5E1',
  // Dark Slate Silk Tie
  T: '#0F172A',
  t: '#334155',
  r: '#475569',
  // Gold Secret Service Lapel Pin & Belt Buckle
  P: '#FACC15',
  // Tailored Trousers & Polished Shoes
  p: '#181E2C',
  Q: '#0F131D',
  K: '#232329',
  a: '#64748B',
};

const BUZZ_CUT_PALETTE: Record<string, string> = {
  ...DARK_HAIR_PALETTE,
  // Short salt-and-pepper / steel buzz cut
  h: '#334155',
  g: '#64748B',
  y: '#94A3B8',
  // Slightly warmer tan complexion
  d: '#8C4E32',
  S: '#B06A47',
  s: '#CC845D',
  f: '#DE9A74',
};

// Red MAGA Cap + Navy Patriotic Jacket + Red/White Trim + Denim Jeans
const MAGA_CAP_PALETTE: Record<string, string> = {
  ...DARK_HAIR_PALETTE,
  // Crimson Red Cap with White Front Lettering ('y' = white cap text highlight)
  h: '#991B1B',
  g: '#DC2626',
  y: '#F8FAFC',
  // Eyes instead of black aviators
  B: '#1E293B',
  G: '#F8FAFC',
  L: '#3B82F6',
  // Ears / no earpiece
  E: '#E5A278',
  e: '#C9835B',
  // Royal Navy Patriotic Jacket
  N: '#0F172A',
  n: '#1E3A8A',
  u: '#1D4ED8',
  l: '#2563EB',
  U: '#3B82F6',
  // Red/White/Blue Inner Shirt
  w: '#F8FAFC',
  T: '#B91C1C',
  t: '#DC2626',
  r: '#EF4444',
  P: '#FACC15',
  // Classic Blue Jeans & Boots
  p: '#1E40AF',
  Q: '#172554',
  K: '#451A03',
  a: '#78350F',
};

// Rally Supporter with Red Cap + Crimson Jacket + Raised USA Sign
const RALLY_SIGN_PALETTE: Record<string, string> = {
  ...MAGA_CAP_PALETTE,
  // Crimson & White Rally Jacket
  N: '#7F1D1D',
  n: '#991B1B',
  u: '#B91C1C',
  l: '#DC2626',
  U: '#EF4444',
  // Navy shirt & gold star
  T: '#1E3A8A',
  t: '#1D4ED8',
  r: '#3B82F6',
  // Khaki/Tan Pants
  p: '#A16207',
  Q: '#713F12',
};

// Blonde VIP Rally Supporter (Golden Hair + Patriotic Red Blazer)
const RALLY_BLONDE_PALETTE: Record<string, string> = {
  ...DARK_HAIR_PALETTE,
  // Golden Blonde Hair
  h: '#B45309',
  g: '#D97706',
  y: '#FACC15',
  // Warm Fair Skin
  d: '#C9835B',
  S: '#E5A278',
  s: '#F2BE9A',
  f: '#FDE6D2',
  // Bright Eyes
  B: '#1E293B',
  G: '#F8FAFC',
  L: '#2563EB',
  E: '#FACC15', // Gold earrings
  e: '#D97706',
  // Crimson Red Tailored Outfit
  N: '#881337',
  n: '#9F1239',
  u: '#BE123C',
  l: '#E11D48',
  U: '#F43F5E',
  // White silk blouse & blue scarf
  w: '#FFFFFF',
  T: '#1D4ED8',
  t: '#2563EB',
  r: '#60A5FA',
  P: '#FACC15',
  // Navy Skirt/Trousers & Red Heels
  p: '#1E293B',
  Q: '#0F172A',
  K: '#991B1B',
  a: '#DC2626',
};

// Press Cameraman / Photographer (Dark Cap, Olive/Slate Press Vest, Camera Lens)
const PRESS_CAMERAMAN_PALETTE: Record<string, string> = {
  ...DARK_HAIR_PALETTE,
  h: '#0F172A',
  g: '#1E293B',
  y: '#38BDF8', // PRESS badge on cap
  // Camera viewfinder / glasses
  B: '#090D16',
  G: '#334155',
  L: '#38BDF8',
  // Press Vest (Charcoal & Olive Tactical Utility Vest)
  N: '#1C1917',
  n: '#292524',
  u: '#44403C',
  l: '#57534E',
  U: '#78716C',
  // Sky-blue PRESS Pass Lanyard
  w: '#E2E8F0',
  T: '#0284C7',
  t: '#38BDF8',
  r: '#BAE6FD',
  P: '#FACC15',
  p: '#1E293B',
  Q: '#0F172A',
};

// 28x42 Standing Attention Bodyguard / Rally NPC
const GUARD_DOWN = [
  '........oooooooooo..........',
  '.......ohyyyyyyyyggo........',
  '......ohyyyygggggggho.......',
  '......ohgggggggggggho.......',
  '......ohgggggggggghho.......',
  '......ohggsfffffsghho.......',
  '......ohgSfffffffSSho.......',
  '......oBSBBBBBBBBBSBo.......',
  '.....oEoBGLLBGLLBGBo........',
  '.....oEoBBBBBBBBBBBo........',
  '.....o.oSSsssssssSSo........',
  '.....oeoSsSssddssSSo........',
  '......ooSSdddddddSSo........',
  '.......oSSdSdddSdSSo........',
  '.......eooSSSSSSSooo........',
  '......eoolwtwtwlnooo........',
  '....oolUUUlwtwlUUUlloo......',
  '...olUUuuunwtrwnuuuUUlo.....',
  '..olUuuuuunwtrwnuPPuuUuo....',
  '..ouuuuuuunnTtrnuuuuuuuo....',
  '..ouuuuuuunnttlnuuuuuuuo....',
  '..ouuuuuunnnTttunuuuuuuo....',
  '..onnnnuunnnutrunuuunnno....',
  '..onnnnuunnnuttunuuunnno....',
  '..onnnnuunnnutTunuuunnno....',
  '..onnnnunooSSssSSoonnnno....',
  '..onnnnuonSssssssSnunnno....',
  '..onnnnNooSSddddSSoNnnno....',
  '...onnnNNNooPPPPooNNNno.....',
  '....ooonnnNNNNNNNNnnno......',
  '.......onnnnNNNNnnno........',
  '.......oppppQQQQpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '......oKKaKKo..oKKaKKo......',
  '......oKKKKKo..oKKKKKo......',
  '......ooooooo..ooooooo......',
  '............................',
];

const GUARD_UP = [
  '........oooooooooo..........',
  '.......ohyyyyyyyyggo........',
  '......ohyyyygggggggho.......',
  '......ohgggggggggggho.......',
  '......ohgggggggggghho.......',
  '......ohggggggggghhho.......',
  '......ohggggggggghhho.......',
  '......ohgggggggghhhho.......',
  '.....oEohgggggghhhho........',
  '.....oEohghgggghhhho........',
  '.....o.oohhhhhhhhhoo........',
  '.....oeo.ooSSSSSoo..........',
  '......oo..oSSSSSo...........',
  '.......oooollllllooo........',
  '.....oolUUuuuuuuuUUloo......',
  '...oolUUuuuuuuuuuuuUUloo....',
  '..olUUuuuuuunnnuuuuuuuUlo...',
  '..olUuuuuuuunnnuuuuuuuUuo...',
  '..ouuuuuuuuunnnuuuuuuuuuo...',
  '..ouuuuuuuunnnnnuuuuuuuuo...',
  '..ouuuuuuuunnnnnuuuuuuuuo...',
  '..onnnnuuuunnnnnuuuunnno....',
  '..onnnnuuuunnnnnuuuunnno....',
  '..onnnnuuuunnnnnuuuunnno....',
  '..onnnnuuunNNNNNnuuunnno....',
  '..onnnnuuunNNNNNnuuunnno....',
  '..onnnnuuunNNNNNnuuunnno....',
  '..onnnnunNNNNNNNNNnunnno....',
  '...ooonnnnnNNNNNnnnnooo.....',
  '.......onnnnNNNNnnno........',
  '.......oppppQQQQpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '.......oppppQ..Qpppo........',
  '......oKKaKKo..oKKaKKo......',
  '......oKKKKKo..oKKKKKo......',
  '......ooooooo..ooooooo......',
  '............................',
];

const GUARD_RIGHT = [
  '........oooooooooo..........',
  '.......ohyyyyyyyyggo........',
  '......ohyyyygggggggho.......',
  '......ohgggggggggggho.......',
  '......ohggyyyygggggho.......',
  '......ohggsfffffffgho.......',
  '......ohgSffffffffSho.......',
  '......ohgSBBBBBBBBBBBo......',
  '......oEoSBBGLLBBBBBo.......',
  '......oEoSssBBBBBBSSo.......',
  '.......oeossssssssSSo.......',
  '.......oeossssssdSSo........',
  '........oossssddddSo........',
  '........o.ooSSSSSSo.........',
  '.........eooSSSSSo..........',
  '.......ooolllwtooo..........',
  '......oolUUuuwtrno..........',
  '.....olUUuuuuuwttno.........',
  '....olUuuuuulPPwtno.........',
  '....ouuuuuuulluuttno........',
  '....ouuuuuuulluuttnno.......',
  '....onnnnuuulluuttnno.......',
  '....onnnnuuulluuttnno.......',
  '....onnnnuuuuuuuttnno.......',
  '....onnnnuuuuuuuntnno.......',
  '....onnnnuuuuuuuntno........',
  '....onnnsssoNNNNNtno........',
  '....oonnSSsoNNNNNno.........',
  '......oooooNNNNNnno.........',
  '.......onnnNNNNNno..........',
  '.......oppppQQQQpo..........',
  '.......oppppQQQQpo..........',
  '.......oppppQ.Qppo..........',
  '.......oppppQ.Qppo..........',
  '.......oppppQ.Qppo..........',
  '.......oppppQ.Qppo..........',
  '.......oppppQ.Qppo..........',
  '.......oppppQ.Qppo..........',
  '.......oKKaKKoKKaKKo........',
  '.......oKKKKKoKKKKKo........',
  '.......ooooooooooooo........',
  '............................',
];

function getGuardGrid(direction: Direction): string[] {
  if (direction === 'up') return GUARD_UP;
  if (direction === 'right' || direction === 'left') return GUARD_RIGHT;
  return GUARD_DOWN;
}

function getPaletteForVariant(variant: BodyguardVariant): Record<string, string> {
  switch (variant) {
    case 'buzz-cut':
      return BUZZ_CUT_PALETTE;
    case 'maga-cap-red':
      return MAGA_CAP_PALETTE;
    case 'rally-sign-usa':
      return RALLY_SIGN_PALETTE;
    case 'rally-blonde-vip':
      return RALLY_BLONDE_PALETTE;
    case 'press-cameraman':
      return PRESS_CAMERAMAN_PALETTE;
    case 'dark-hair':
    default:
      return DARK_HAIR_PALETTE;
  }
}

export const PixelBodyguard: React.FC<PixelBodyguardProps> = React.memo(({
  direction,
  variant = 'dark-hair',
  cheering = false,
  scared = false,
  cheerText,
  jumpSeed,
  className = '',
}) => {
  const palette = getPaletteForVariant(variant);
  const grid = getGuardGrid(direction);
  const flipX = direction === 'left';
  const hasUsaSign = variant === 'rally-sign-usa' && !scared;
  const hasMiniFlag = variant === 'rally-blonde-vip' && !scared;
  const hasCamera = variant === 'press-cameraman';
  const isJumping = cheering && !scared;
  const hopTiming = getCrowdHopTiming(
    String(jumpSeed ?? `${variant}-${direction}`)
  );

  // Scared cries & rushing guard tactical calls use crimson emergency shader; supporter cheers use executive gold-navy shader
  const isCrimsonAlert = scared || (!cheering && Boolean(cheerText));

  return (
    <div
      className={`relative pointer-events-none select-none ${className}`}
      style={{
        aspectRatio: '28 / 42',
      }}
    >
      {/* Ground Contact Shadow stays grounded while character hops */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          bottom: '2.5%',
          width: '66%',
          height: '11%',
          background:
            'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.28) 55%, transparent 80%)',
        }}
      />

      {/* Plain Pixel Comment Text — floats upward & becomes less transparent, staggered so crowd never looks overcrowded */}
      {cheerText && (
        <div
          className={`absolute -top-3 left-1/2 z-30 pointer-events-none whitespace-nowrap font-mono font-bold uppercase ${
            isCrimsonAlert ? 'text-[#FECACA]' : 'text-[#FEF08A]'
          }`}
          style={{
            fontSize: '8.5px',
            letterSpacing: '0.06em',
            textShadow: isCrimsonAlert
              ? '1px 1px 0 #090D16, -1px -1px 0 #090D16, 1px -1px 0 #090D16, -1px 1px 0 #090D16, 0 2px 0 #090D16, 0 0 8px rgba(239, 68, 68, 0.65)'
              : '1px 1px 0 #090D16, -1px -1px 0 #090D16, 1px -1px 0 #090D16, -1px 1px 0 #090D16, 0 2px 0 #090D16, 0 0 8px rgba(250, 204, 21, 0.5)',
            animationName: isCrimsonAlert
              ? 'rally-text-float-urgent'
              : 'rally-text-float',
            animationDuration: `${
              isCrimsonAlert
                ? hopTiming.urgentDurationSec
                : hopTiming.commentDurationSec
            }s`,
            animationDelay: `${
              isCrimsonAlert
                ? hopTiming.urgentDelaySec
                : hopTiming.commentDelaySec
            }s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            willChange: 'transform, opacity',
          }}
        >
          {cheerText}
        </div>
      )}

      {/* Independent Staggered Crowd Hop Wrapper */}
      <div
        className="relative w-full h-full"
        style={
          isJumping
            ? {
                animationName: hopTiming.animationName,
                animationDuration: `${hopTiming.durationSec}s`,
                animationDelay: `${hopTiming.delaySec}s`,
                animationIterationCount: 'infinite',
                willChange: 'transform',
              }
            : undefined
        }
      >
        {/* Crisp 28x42 32-Bit Pixel Sprite */}
        <svg
          viewBox="0 0 28 42"
          shapeRendering="crispEdges"
          className="relative block w-full h-full drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)] transition-transform duration-150"
          style={{
            transform: `${flipX ? 'scaleX(-1)' : ''} ${
              scared ? 'translateY(14%) scaleY(0.76)' : ''
            }`.trim() || undefined,
          }}
        >
          {renderPixelGridRle(grid, palette)}

          {/* Extra Pixel Prop: Raised Patriotic "USA" Sign for 'rally-sign-usa' */}
          {hasUsaSign && (
            <g>
              {/* Wooden stick */}
              <rect x={22} y={7} width={2} height={14} fill="#78350F" />
              <rect x={21} y={7} width={1} height={14} fill="#0B0E17" />
              {/* Sign board border */}
              <rect x={16} y={0} width={12} height={8} fill="#0B0E17" />
              {/* Sign board interior (Navy top, White middle, Red bottom) */}
              <rect x={17} y={1} width={10} height={2} fill="#1D4ED8" />
              <rect x={17} y={3} width={10} height={3} fill="#F8FAFC" />
              <rect x={17} y={6} width={10} height={1} fill="#DC2626" />
              {/* Crisp pixel lettering detail */}
              <rect x={18} y={3} width={2} height={2} fill="#B91C1C" />
              <rect x={21} y={3} width={2} height={2} fill="#1E3A8A" />
              <rect x={24} y={3} width={2} height={2} fill="#B91C1C" />
            </g>
          )}

          {/* Extra Pixel Prop: Waving Mini U.S. Flag for 'rally-blonde-vip' */}
          {hasMiniFlag && (
            <g>
              <rect x={22} y={8} width={1} height={11} fill="#FACC15" />
              <rect x={23} y={8} width={5} height={4} fill="#DC2626" />
              <rect x={23} y={9} width={5} height={1} fill="#F8FAFC" />
              <rect x={23} y={11} width={5} height={1} fill="#F8FAFC" />
              <rect x={23} y={8} width={2} height={2} fill="#1E3A8A" />
            </g>
          )}

          {/* Extra Pixel Prop: Broadcast Camera on Shoulder for 'press-cameraman' */}
          {hasCamera && (
            <g>
              <rect x={19} y={11} width={7} height={5} fill="#0F172A" />
              <rect x={20} y={12} width={5} height={3} fill="#334155" />
              <rect x={26} y={12} width={2} height={3} fill="#38BDF8" />
              <rect x={21} y={10} width={2} height={1} fill="#EF4444" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
});
