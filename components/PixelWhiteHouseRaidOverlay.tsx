import React, { useEffect, useState } from 'react';
import lawnMapUrl from '../assets/images/white_house_south_lawn_map.jpg';
import officeMapUrl from '../assets/images/oval_office_map.jpg';
import { PixelGameOverModal } from './PixelGameOverModal';
import { renderPixelGridRle } from '../utils/pixelGridCache';

interface PixelWhiteHouseRaidOverlayProps {
  active: boolean;
  launchId?: number;
  startedAtMs?: number;
  onClose: () => void;
  onRestartGame?: () => void;
}

// Timeline synced to playWhiteHouseRaidSound():
// 0ms..4500ms  : Angry crowd storms Pennsylvania Ave, jumps the White House fence, and charges into the portico
// 4500ms..9800ms: Flash cut inside the President's Office — doors break open, mob floods open corridors & raids the office
// 9800ms+      : Game Over + "0% APPROVAL" reason plaque (rendered strictly above all scene/NPC layers)
const OFFICE_ENTER_MS = 4500;
const GAME_OVER_MS = 9800;

const PIXEL_PLAQUE_SHADOW = [
  'inset 2px 2px 0 0 #EBC14B',
  'inset -2px -2px 0 0 #8F6118',
  '0 0 0 2px #090D16',
  '0 0 0 4px #C88F2A',
  '0 0 0 6px #090D16',
  '4px 6px 0 4px rgba(0, 0, 0, 0.65)',
].join(', ');

// High-Fidelity 24x30 32-Bit Pixel Protester / Raider Frames (multi-tone hair/cap, shaded face, 4-tone jacket, jeans & boots)
const RAIDER_HF_RUN_A: string[] = [
  '.......oooooooooo.......',
  '......ohyyyyyyyyho......',
  '.....ohyyggggggyyho.....',
  '.....ohggggggggggho.....',
  '....ohgsffffffffsgho....',
  '....ohgSfBBWWBBfSgho....',
  '....ooSSsffffffsSSoo....',
  '.....oSSsssmmssSSSo.....',
  '......oSSddddddSSo......',
  '.......oooooooooo.......',
  '.....oollUUUUUUlloo.....',
  '....olUUuuuuuuuuUUlo....',
  '...olUuuuuuwwuuuuuUlo...',
  '..oSoluuuuuttuuuuuolSo..',
  '..oSSouuuunnnnuuuuoSSo..',
  '..oddonnnunnnnunnnoddo..',
  '...oo.onnnnnnnnnnno.oo..',
  '......oNNNNNNNNNNNo.....',
  '......ooonnnnnnnooo.....',
  '......opppQ..Qpppo......',
  '......opppQ..Qpppo......',
  '.....oppppQ..Qppppo.....',
  '.....opppQ....Qpppo.....',
  '....opppp......ppppo....',
  '....oKKaKo....oKaKKo....',
  '....oKKKKo....oKKKKo....',
  '....oooooo....oooooo....',
  '........................',
];

const RAIDER_HF_RUN_B: string[] = [
  '.......oooooooooo.......',
  '......ohyyyyyyyyho......',
  '.....ohyyggggggyyho.....',
  '.....ohggggggggggho.....',
  '....ohgsffffffffsgho....',
  '....ohgSfBBWWBBfSgho....',
  '....ooSSsffffffsSSoo....',
  '.....oSSsssmmssSSSo.....',
  '......oSSddddddSSo......',
  '.......oooooooooo.......',
  '.....oollUUUUUUlloo.....',
  '....olUUuuuuuuuuUUlo....',
  '...olUuuuuuwwuuuuuUlo...',
  '...oooluuuuttuuuuulooo..',
  '.....ouuuunnnnuuuuoSSo..',
  '.....onnnunnnnunnnoddo..',
  '.....onnnnnnnnnnnno.oo..',
  '......oNNNNNNNNNNNo.....',
  '......ooonnnnnnnooo.....',
  '.......opppQQpppo.......',
  '......opppQ..Qpppo......',
  '.....opppQ....Qpppo.....',
  '.....opppQ....Qpppo.....',
  '.....oppp......pppo.....',
  '.....oKKao....oaKKo.....',
  '.....oKKKo....oKKKo.....',
  '.....ooooo....ooooo.....',
  '........................',
];

const RAIDER_HF_JUMP: string[] = [
  '.......oooooooooo.......',
  '......ohyyyyyyyyho......',
  '.....ohyyggggggyyho.....',
  '.....ohggggggggggho.....',
  '....ohgsffffffffsgho....',
  '....ohgSfBBWWBBfSgho....',
  '....ooSSsffffffsSSoo....',
  '.....oSSsssmmssSSSo.....',
  '......oSSddddddSSo......',
  '..oSo..oooooooooo..oSo..',
  '..oSSoollUUUUUUllooSSo..',
  '...ooolUUuuuuuuuuUUlooo.',
  '.....oUuuuuwwuuuuuUo....',
  '.....onnnuttttuunnno....',
  '.....oNNNNnnnnNNNNNo....',
  '......oppppQQQQpppo.....',
  '....oopppQ....Qpppoo....',
  '...oopppQ......Qpppoo...',
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

interface RaiderStyle {
  h: string;
  g: string;
  y: string;
  U: string;
  u: string;
  l: string;
  n: string;
  N: string;
  w: string;
  t: string;
  p: string;
  Q: string;
  f: string;
  s: string;
  S: string;
  d: string;
}

const RAIDER_STYLES: RaiderStyle[] = [
  // 0: Crimson Hoodie + Fair Skin + Dark Hair
  { h: '#111827', g: '#1F2937', y: '#374151', l: '#F87171', U: '#EF4444', u: '#DC2626', n: '#991B1B', N: '#7F1D1D', w: '#F8FAFC', t: '#E2E8F0', p: '#1E3A8A', Q: '#172554', f: '#FAD2B4', s: '#E5A278', S: '#C9835B', d: '#9A5B3A' },
  // 1: Royal Blue Jacket + Tan Skin + Chestnut Hair
  { h: '#451A03', g: '#78350F', y: '#92400E', l: '#60A5FA', U: '#3B82F6', u: '#2563EB', n: '#1D4ED8', N: '#1E3A8A', w: '#FEF08A', t: '#CBD5E1', p: '#334155', Q: '#1E293B', f: '#E5A882', s: '#CC8A63', S: '#AD6B46', d: '#854D2E' },
  // 2: Amber Parka + Knit Beanie + Medium-Deep Skin
  { h: '#991B1B', g: '#DC2626', y: '#EF4444', l: '#FCD34D', U: '#F59E0B', u: '#D97706', n: '#B45309', N: '#78350F', w: '#1E293B', t: '#0F172A', p: '#292524', Q: '#1C1917', f: '#C98A63', s: '#AE6D47', S: '#8D5232', d: '#693B22' },
  // 3: Emerald Bomber + Blonde Hair + Fair Skin
  { h: '#B45309', g: '#D97706', y: '#FACC15', l: '#4ADE80', U: '#22C55E', u: '#16A34A', n: '#15803D', N: '#14532D', w: '#F8FAFC', t: '#CBD5E1', p: '#1E293B', Q: '#0F172A', f: '#FCE0C8', s: '#EAB892', S: '#CC9169', d: '#9F6945' },
  // 4: Purple Street Jacket + Deep Skin
  { h: '#090D16', g: '#1E293B', y: '#334155', l: '#A78BFA', U: '#8B5CF6', u: '#7C3AED', n: '#5B21B6', N: '#4C1D95', w: '#F8FAFC', t: '#E2E8F0', p: '#374151', Q: '#1F2937', f: '#9C6140', s: '#824B2D', S: '#683920', d: '#4D2815' },
  // 5: Burnt Orange Flannel + Gray Cap
  { h: '#334155', g: '#64748B', y: '#94A3B8', l: '#FB923C', U: '#F97316', u: '#EA580C', n: '#C2410C', N: '#7C2D12', w: '#FEF9C3', t: '#FDE047', p: '#1E3A8A', Q: '#172554', f: '#F2BE9A', s: '#D69A76', S: '#B87854', d: '#8F5738' },
];

const RAIDER_PALETTES: Record<string, string>[] = RAIDER_STYLES.map((st) => ({
  o: '#090D16',
  h: st.h,
  g: st.g,
  y: st.y,
  f: st.f,
  s: st.s,
  S: st.S,
  d: st.d,
  B: '#0F172A',
  W: '#F8FAFC',
  m: '#7F1D1D',
  l: st.l,
  U: st.U,
  u: st.u,
  n: st.n,
  N: st.N,
  w: st.w,
  t: st.t,
  p: st.p,
  Q: st.Q,
  K: '#111827',
  a: '#64748B',
}));

const PixelProtesterSprite = React.memo(({
  styleIdx,
  frame,
  isJumping = false,
  hasSign = false,
  signText = 'OUT!',
  flipX = false,
  hideShadow = false,
}: {
  styleIdx: number;
  frame: number;
  isJumping?: boolean;
  hasSign?: boolean;
  signText?: string;
  flipX?: boolean;
  hideShadow?: boolean;
}) => {
  const palette = RAIDER_PALETTES[styleIdx % RAIDER_PALETTES.length];
  const rows = isJumping ? RAIDER_HF_JUMP : frame % 2 === 0 ? RAIDER_HF_RUN_A : RAIDER_HF_RUN_B;

  return (
    <div className="relative w-full h-full">
      {hasSign && (
        <div
          className="absolute -top-8 left-1/2 pointer-events-none flex flex-col items-center"
          style={{
            transform: `translateX(-50%) translateY(${frame % 2 === 0 ? '-1px' : '1px'})`,
          }}
        >
          <div
            className="px-1.5 py-0.5 border-2 border-[#090D16] font-mono font-bold text-[8px] leading-none text-[#991B1B] whitespace-nowrap"
            style={{
              background: 'linear-gradient(180deg, #FEF9C3 0%, #FDE68A 100%)',
              boxShadow:
                'inset 1px 1px 0 0 #FFFFFF, inset -1px -1px 0 0 #D97706, 2px 2px 0 #090D16',
            }}
          >
            {signText}
          </div>
          {/* Wooden picket stick down to raider's grip */}
          <div className="w-[3px] h-3 bg-[#78350F] border-x border-[#090D16]" />
        </div>
      )}
      <svg
        viewBox="0 0 24 28"
        shapeRendering="crispEdges"
        className="w-full h-full pixelated overflow-visible"
        style={{
          transform: flipX ? 'scaleX(-1)' : undefined,
          filter: hideShadow ? undefined : 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.55))',
        }}
      >
        {!hideShadow && <rect x={5} y={26} width={14} height={2} fill="#090D16" opacity={0.55} />}
        {renderPixelGridRle(rows, palette)}
      </svg>
    </div>
  );
});

function PixelRaidFistIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className}>
      <rect x={3} y={2} width={10} height={12} fill="#090D16" />
      <rect x={4} y={3} width={8} height={6} fill="#DC2626" />
      <rect x={5} y={4} width={2} height={3} fill="#FEF08A" />
      <rect x={8} y={4} width={2} height={3} fill="#FEF08A" />
      <rect x={4} y={8} width={8} height={2} fill="#991B1B" />
      <rect x={5} y={10} width={6} height={3} fill="#F97316" />
    </svg>
  );
}

function PixelWhiteHouseRaidIcon({ className = 'w-10 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 18" shapeRendering="crispEdges" className={className}>
      <rect x={2} y={3} width={16} height={9} fill="#090D16" />
      <rect x={3} y={4} width={14} height={7} fill="#E2E8F0" />
      <rect x={7} y={2} width={6} height={2} fill="#CBD5E1" />
      <rect x={5} y={5} width={2} height={5} fill="#94A3B8" />
      <rect x={9} y={5} width={2} height={6} fill="#7F1D1D" />
      <rect x={13} y={5} width={2} height={5} fill="#94A3B8" />
      {/* Crowd Silhouettes */}
      <rect x={2} y={12} width={16} height={4} fill="#090D16" />
      <rect x={3} y={11} width={3} height={4} fill="#DC2626" />
      <rect x={7} y={10} width={3} height={5} fill="#F59E0B" />
      <rect x={11} y={11} width={3} height={4} fill="#3B82F6" />
      <rect x={15} y={11} width={3} height={4} fill="#EF4444" />
    </svg>
  );
}

// High-Fidelity 32-Bit Pixel Oval Office Destruction Overlay (240x135 grid matching president_office_day_map)
function OvalOfficeDestructionSvg({ officeElapsedMs }: { officeElapsedMs: number }) {
  const animTick = Math.floor(officeElapsedMs / 90);
  const flicker = animTick % 2;
  const stage2 = officeElapsedMs > 450; // Windows, portraits, & desk ransacked
  const stage3 = officeElapsedMs > 1250; // Fire, overturned chair/globe, heavy clutter

  return (
    <svg
      viewBox="0 0 240 135"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className="absolute inset-0 w-full h-full pixelated pointer-events-none"
    >
      {/* 1. Kicked-Open & Splintered Grand Mahogany Double Doors (bottom center x=97..143, y=105..135) */}
      <g>
        {/* Deep Corridor Breach Void & Brass Threshold */}
        <rect x={102} y={109} width={36} height={26} fill="#05070C" />
        <rect x={106} y={110} width={28} height={8} fill="#111827" />
        <rect x={102} y={133} width={36} height={2} fill="#78350F" />
        {/* Left Broken Door Leaf Knocked Back & Crooked */}
        <rect x={94} y={108} width={10} height={27} fill="#090D16" />
        <rect x={95} y={109} width={8} height={25} fill="#451A03" />
        <rect x={96} y={111} width={6} height={8} fill="#78350F" />
        <rect x={101} y={120} width={2} height={2} fill="#FACC15" />
        {/* Right Broken Door Leaf Knocked Back */}
        <rect x={136} y={108} width={10} height={27} fill="#090D16" />
        <rect x={137} y={109} width={8} height={25} fill="#451A03" />
        <rect x={138} y={111} width={6} height={8} fill="#78350F" />
        <rect x={137} y={120} width={2} height={2} fill="#FACC15" />
        {/* Splintered Wood Planks & Door Debris on Hardwood Floor */}
        <rect x={106} y={103} width={7} height={2} fill="#78350F" />
        <rect x={108} y={104} width={4} height={1} fill="#B45309" />
        <rect x={125} y={101} width={8} height={2} fill="#92400E" />
        <rect x={115} y={106} width={5} height={2} fill="#451A03" />
      </g>

      {/* 2. Shattered Windows, Torn Curtains, Slashed Portraits & Ransacked Desk */}
      {stage2 && (
        <g>
          {/* Left Window Shattered Glass, Torn Gold Drape & Jagged Cracks (x=78..94, y=12..40) */}
          <rect x={80} y={18} width={11} height={14} fill="#090D16" opacity={0.62} />
          <rect x={76} y={14} width={4} height={20} fill="#92400E" />
          <rect x={77} y={16} width={2} height={16} fill="#FACC15" opacity={0.65} />
          <rect x={82} y={20} width={3} height={4} fill="#93C5FD" opacity={0.8} />
          <rect x={87} y={26} width={3} height={5} fill="#BFDBFE" opacity={0.8} />
          {/* Right Window Shattered Glass, Torn Gold Drape & Jagged Cracks (x=146..162, y=12..40) */}
          <rect x={149} y={18} width={11} height={14} fill="#090D16" opacity={0.62} />
          <rect x={160} y={14} width={4} height={20} fill="#92400E" />
          <rect x={161} y={16} width={2} height={16} fill="#FACC15" opacity={0.65} />
          <rect x={151} y={21} width={4} height={4} fill="#93C5FD" opacity={0.8} />
          <rect x={155} y={27} width={3} height={4} fill="#BFDBFE" opacity={0.8} />
          {/* Fallen Glass Shards Below Windows */}
          <rect x={78} y={48} width={2} height={1} fill="#E0F2FE" />
          <rect x={85} y={50} width={2} height={1} fill="#93C5FD" />
          <rect x={90} y={49} width={2} height={1} fill="#E0F2FE" />
          <rect x={148} y={49} width={2} height={1} fill="#E0F2FE" />
          <rect x={154} y={50} width={2} height={1} fill="#93C5FD" />
          <rect x={159} y={48} width={2} height={1} fill="#E0F2FE" />

          {/* Crooked / Defaced Center Portrait above Fireplace */}
          <rect x={111} y={4} width={18} height={21} fill="#090D16" opacity={0.45} />
          <rect x={113} y={7} width={14} height={2} fill="#DC2626" />
          <rect x={115} y={12} width={10} height={2} fill="#DC2626" />
          <rect x={114} y={16} width={12} height={2} fill="#090D16" />

          {/* Knocked-Over Bust & Trophy near Side Tables */}
          <rect x={51} y={45} width={5} height={3} fill="#CBD5E1" />
          <rect x={52} y={46} width={2} height={1} fill="#64748B" />
          <rect x={184} y={45} width={5} height={3} fill="#CBD5E1" />
          <rect x={186} y={46} width={2} height={1} fill="#FACC15" />

          {/* Ransacked Resolute Desk: Spilled Ink, Protest Banner & Knocked Books */}
          <rect x={102} y={45} width={36} height={10} fill="#FEF08A" opacity={0.92} />
          <rect x={103} y={46} width={34} height={8} fill="#DC2626" />
          <rect x={108} y={48} width={24} height={4} fill="#FEF9C3" />
          <rect x={110} y={49} width={4} height={2} fill="#991B1B" />
          <rect x={116} y={49} width={6} height={2} fill="#991B1B" />
          <rect x={124} y={49} width={6} height={2} fill="#991B1B" />
          {/* Spilled Ink Puddle on Desk */}
          <rect x={126} y={42} width={6} height={3} fill="#090D16" />
        </g>
      )}

      {/* 3. Overturned Furniture, Rolled Globe, Broken Lamp & Burning Wastebaskets */}
      {stage3 && (
        <g>
          {/* Knocked-Over Wooden Guest Chair beside Resolute Desk (x=84, y=54) */}
          <rect x={83} y={53} width={9} height={6} fill="#090D16" />
          <rect x={84} y={54} width={7} height={4} fill="#78350F" />
          <rect x={85} y={55} width={5} height={2} fill="#991B1B" />

          {/* Knocked-Off Pixel Globe & Torn World Map on Blue Rug beside Coffee Table */}
          <rect x={129} y={89} width={7} height={7} fill="#090D16" />
          <rect x={130} y={90} width={5} height={5} fill="#2563EB" />
          <rect x={131} y={91} width={2} height={2} fill="#22C55E" />
          <rect x={133} y={93} width={2} height={1} fill="#22C55E" />
          <rect x={114} y={95} width={7} height={5} fill="#FEF9C3" />
          <rect x={115} y={96} width={3} height={2} fill="#15803D" />

          {/* Burning Wastebasket / Document Fires on Open Floor (west & east open rug edges) */}
          <g>
            {/* West Floor Fire (x=66, y=68) */}
            <rect x={65} y={66} width={9} height={8} fill="#1C1917" opacity={0.8} />
            <rect x={66} y={67 - flicker} width={7} height={7} fill="#991B1B" />
            <rect x={67} y={68 - flicker} width={5} height={5} fill="#EA580C" />
            <rect x={68} y={69} width={3} height={3} fill="#FACC15" />

            {/* East Floor Fire near Fireplace/Rug (x=166, y=66) */}
            <rect x={165} y={64} width={9} height={8} fill="#1C1917" opacity={0.8} />
            <rect x={166} y={65 + flicker} width={7} height={7} fill="#991B1B" />
            <rect x={167} y={66 + flicker} width={5} height={5} fill="#EA580C" />
            <rect x={168} y={67} width={3} height={3} fill="#FACC15" />
          </g>

          {/* Heavy Scatter of Ransacked Papers & Books Across Rug & Oak Floor */}
          {[
            { x: 74, y: 78, w: 5, h: 3, c: '#F8FAFC' },
            { x: 103, y: 69, w: 5, h: 3, c: '#F8FAFC' },
            { x: 124, y: 64, w: 6, h: 3, c: '#FEF9C3' },
            { x: 96, y: 74, w: 4, h: 3, c: '#E2E8F0' },
            { x: 138, y: 77, w: 5, h: 3, c: '#F8FAFC' },
            { x: 116, y: 101, w: 5, h: 3, c: '#F8FAFC' },
            { x: 84, y: 88, w: 4, h: 3, c: '#E2E8F0' },
            { x: 152, y: 84, w: 5, h: 3, c: '#FEF9C3' },
            { x: 60, y: 98, w: 5, h: 3, c: '#F8FAFC' },
            { x: 176, y: 96, w: 5, h: 3, c: '#E2E8F0' },
            { x: 100, y: 62, w: 4, h: 3, c: '#15803D' },
            { x: 134, y: 61, w: 4, h: 3, c: '#B91C1C' },
            { x: 146, y: 70, w: 4, h: 3, c: '#CA8A04' },
          ].map((item, idx) => (
            <g key={idx}>
              <rect x={item.x} y={item.y} width={item.w} height={item.h} fill="#090D16" />
              <rect
                x={item.x + 1}
                y={item.y + 1}
                width={Math.max(1, item.w - 2)}
                height={Math.max(1, item.h - 2)}
                fill={item.c}
              />
            </g>
          ))}

          {/* Continuously Flying Papers & Sparks Tossed into the Air */}
          {[
            { bx: 118, by: 44, dx: -36, dy: -18, spd: 0.9 },
            { bx: 122, by: 45, dx: 38, dy: -16, spd: 1.1 },
            { bx: 108, by: 52, dx: -46, dy: 14, spd: 0.85 },
            { bx: 132, by: 52, dx: 44, dy: 16, spd: 1.0 },
            { bx: 120, by: 42, dx: -16, dy: -26, spd: 1.2 },
            { bx: 124, by: 42, dx: 18, dy: -24, spd: 0.95 },
            { bx: 70, by: 64, dx: -8, dy: -22, spd: 1.3 },
            { bx: 168, by: 63, dx: 10, dy: -22, spd: 1.25 },
          ].map((fp, idx) => {
            const cycle = ((officeElapsedMs - 900) * fp.spd * 0.00075 + idx * 0.17) % 1;
            const px = Math.round(fp.bx + fp.dx * cycle);
            const py = Math.round(fp.by + fp.dy * cycle + cycle * cycle * 24);
            const isSpark = idx >= 6;
            return (
              <rect
                key={idx}
                x={px}
                y={py}
                width={isSpark ? 2 : 3}
                height={2}
                fill={isSpark ? (flicker === 0 ? '#FACC15' : '#EA580C') : '#F8FAFC'}
                opacity={Math.max(0.25, 1 - cycle * 0.55)}
              />
            );
          })}
        </g>
      )}
    </svg>
  );
}

interface LawnRaiderSpec {
  id: number;
  startX: number;
  startY: number;
  fenceX: number;
  doorX: number;
  jumpStartMs: number;
  jumpDurMs: number;
  styleIdx: number;
  hasSign: boolean;
  signText: string;
}

const LAWN_RAIDERS: LawnRaiderSpec[] = [
  { id: 0, startX: 20, startY: 88, fenceX: 24, doorX: 46, jumpStartMs: 850, jumpDurMs: 650, styleIdx: 0, hasSign: true, signText: 'OUT!' },
  { id: 1, startX: 33, startY: 92, fenceX: 35, doorX: 49, jumpStartMs: 980, jumpDurMs: 650, styleIdx: 1, hasSign: false, signText: '' },
  { id: 2, startX: 45, startY: 89, fenceX: 46, doorX: 50, jumpStartMs: 900, jumpDurMs: 680, styleIdx: 2, hasSign: true, signText: '0%!' },
  { id: 3, startX: 56, startY: 93, fenceX: 55, doorX: 52, jumpStartMs: 1120, jumpDurMs: 650, styleIdx: 3, hasSign: false, signText: '' },
  { id: 4, startX: 66, startY: 87, fenceX: 64, doorX: 54, jumpStartMs: 1020, jumpDurMs: 650, styleIdx: 4, hasSign: true, signText: 'RAID!' },
  { id: 5, startX: 76, startY: 91, fenceX: 73, doorX: 56, jumpStartMs: 1200, jumpDurMs: 660, styleIdx: 5, hasSign: false, signText: '' },
  { id: 6, startX: 27, startY: 95, fenceX: 29, doorX: 47, jumpStartMs: 1320, jumpDurMs: 650, styleIdx: 2, hasSign: false, signText: '' },
  { id: 7, startX: 49, startY: 96, fenceX: 49, doorX: 51, jumpStartMs: 1380, jumpDurMs: 650, styleIdx: 0, hasSign: true, signText: 'RESIGN' },
  { id: 8, startX: 61, startY: 95, fenceX: 60, doorX: 53, jumpStartMs: 1460, jumpDurMs: 650, styleIdx: 1, hasSign: false, signText: '' },
  { id: 9, startX: 39, startY: 94, fenceX: 42, doorX: 48, jumpStartMs: 1520, jumpDurMs: 650, styleIdx: 3, hasSign: false, signText: '' },
];

interface PointXY {
  x: number;
  y: number;
}

interface OfficeRaiderSpec {
  id: number;
  entryMs: number;
  // Multi-waypoint path strictly inside Oval Office walkable floor lanes (avoids resolute-desk, sofas, coffee-table, fireplace, & walls)
  waypoints: PointXY[];
  styleIdx: number;
  hasSign: boolean;
  signText: string;
}

// Oval Office safe open lanes (verified against defaultScenes.ts):
// - West floor lane: x=20..32, y=44..85
// - East floor lane: x=68..79, y=44..85
// - Front of Resolute Desk open rug: x=28..72, y=50..55 (desk ends at y=48, sofas start at y=57)
// - South-West / South-East corners behind sofas: x=19..38 / x=62..81, y=77..86
const OFFICE_RAIDERS: OfficeRaiderSpec[] = [
  // Bursting from kicked-open South Double Doors -> stepping immediately left/right around sofas into open lanes
  {
    id: 0,
    entryMs: 60,
    waypoints: [
      { x: 45, y: 80 },
      { x: 31, y: 78 },
      { x: 30, y: 53 },
      { x: 46, y: 52 },
    ],
    styleIdx: 0,
    hasSign: true,
    signText: 'OUT!',
  },
  {
    id: 1,
    entryMs: 180,
    waypoints: [
      { x: 55, y: 80 },
      { x: 69, y: 78 },
      { x: 70, y: 53 },
      { x: 55, y: 52 },
    ],
    styleIdx: 2,
    hasSign: true,
    signText: '0%!',
  },
  {
    id: 2,
    entryMs: 320,
    waypoints: [
      { x: 43, y: 81 },
      { x: 25, y: 79 },
      { x: 24, y: 56 },
      { x: 36, y: 52 },
    ],
    styleIdx: 1,
    hasSign: false,
    signText: '',
  },
  {
    id: 3,
    entryMs: 480,
    waypoints: [
      { x: 57, y: 81 },
      { x: 75, y: 79 },
      { x: 74, y: 56 },
      { x: 63, y: 52 },
    ],
    styleIdx: 4,
    hasSign: true,
    signText: 'RAID!',
  },
  {
    id: 4,
    entryMs: 640,
    waypoints: [
      { x: 44, y: 82 },
      { x: 28, y: 80 },
      { x: 27, y: 65 },
    ],
    styleIdx: 3,
    hasSign: false,
    signText: '',
  },
  {
    id: 5,
    entryMs: 780,
    waypoints: [
      { x: 56, y: 82 },
      { x: 72, y: 80 },
      { x: 72, y: 65 },
    ],
    styleIdx: 5,
    hasSign: true,
    signText: 'RESIGN',
  },
  {
    id: 6,
    entryMs: 960,
    waypoints: [
      { x: 42, y: 82 },
      { x: 32, y: 81 },
    ],
    styleIdx: 0,
    hasSign: false,
    signText: '',
  },
  {
    id: 7,
    entryMs: 1120,
    waypoints: [
      { x: 58, y: 82 },
      { x: 67, y: 81 },
    ],
    styleIdx: 1,
    hasSign: false,
    signText: '',
  },
  // Flanking through the West Wall Doorway (x=13, y=49 -> open West floor lane -> in front of desk)
  {
    id: 8,
    entryMs: 380,
    waypoints: [
      { x: 13, y: 49 },
      { x: 23, y: 50 },
      { x: 29, y: 46 },
    ],
    styleIdx: 2,
    hasSign: true,
    signText: 'NO MORE',
  },
  {
    id: 9,
    entryMs: 880,
    waypoints: [
      { x: 13, y: 50 },
      { x: 22, y: 58 },
      { x: 22, y: 74 },
    ],
    styleIdx: 4,
    hasSign: false,
    signText: '',
  },
  {
    id: 10,
    entryMs: 1320,
    waypoints: [
      { x: 56, y: 82 },
      { x: 75, y: 80 },
      { x: 76, y: 47 },
      { x: 68, y: 45 },
    ],
    styleIdx: 3,
    hasSign: false,
    signText: '',
  },
];

function evaluateWaypointPath(
  waypoints: PointXY[],
  elapsedSec: number,
  speedPctPerSec = 26
): { x: number; y: number; flipX: boolean; arrived: boolean } {
  if (waypoints.length === 0) return { x: 50, y: 52, flipX: false, arrived: true };
  if (waypoints.length === 1) return { ...waypoints[0], flipX: false, arrived: true };

  let remDist = Math.max(0, elapsedSec) * speedPctPerSec;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y) || 0.001;
    if (remDist <= segLen) {
      const p = remDist / segLen;
      return {
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p,
        flipX: b.x < a.x,
        arrived: false,
      };
    }
    remDist -= segLen;
  }

  const last = waypoints[waypoints.length - 1];
  const prev = waypoints[waypoints.length - 2];
  return {
    x: last.x,
    y: last.y,
    flipX: last.x < prev.x,
    arrived: true,
  };
}

export const PixelWhiteHouseRaidOverlay: React.FC<PixelWhiteHouseRaidOverlayProps> = React.memo(({
  active,
  launchId = 0,
  startedAtMs = 0,
  onClose,
  onRestartGame,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      return;
    }

    let rafId = 0;
    const origin = startedAtMs > 0 ? startedAtMs : performance.now();
    let lastCommit = origin;
    setElapsedMs(Math.max(0, performance.now() - origin));

    const tick = (now: number) => {
      const dt = Math.max(0, now - origin);
      // Full native framerate during crowd rush & office raid; gentle 12fps background flicker once Game Over settles
      if (dt < GAME_OVER_MS + 400 || now - lastCommit >= 85) {
        lastCommit = now;
        setElapsedMs(dt);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, launchId, startedAtMs]);

  if (!active) return null;

  const isInsideOffice = elapsedMs >= OFFICE_ENTER_MS;
  const officeElapsedMs = Math.max(0, elapsedMs - OFFICE_ENTER_MS);
  const showGameOver = elapsedMs >= GAME_OVER_MS;
  const runFrame = Math.floor(elapsedMs / 95);

  const transitionFlashOpacity =
    elapsedMs >= OFFICE_ENTER_MS && elapsedMs <= OFFICE_ENTER_MS + 420
      ? Math.max(0, 1 - (elapsedMs - OFFICE_ENTER_MS) / 420)
      : 0;

  // Screen shake when double doors slam open & crowd raids desk
  const shakeIntensity =
    isInsideOffice && officeElapsedMs < 2600
      ? Math.max(0, 1 - officeElapsedMs / 2600) * 9
      : 0;
  const shakeX = shakeIntensity > 0 ? Math.sin(elapsedMs * 0.12) * shakeIntensity : 0;
  const shakeY = shakeIntensity > 0 ? Math.cos(elapsedMs * 0.15) * shakeIntensity : 0;

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
      {/* Bounded z-10 Scene & NPC Layer so NPCs never overlap the Game Over Modal */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {/* PHASE 1: White House South Lawn — Crowd Jumps Fence & Storms Building */}
        {!isInsideOffice && (
          <>
            <img
              src={lawnMapUrl}
              alt="White House South Lawn Public Raid"
              draggable={false}
              className="absolute inset-0 w-full h-full object-fill pixelated pointer-events-none"
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0) 40%, rgba(127, 29, 29, 0.35) 100%)',
              }}
            />

            {/* Emergency Police & Smoke Flare Strobe Shader Across South Lawn */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  Math.floor(elapsedMs / 240) % 2 === 0
                    ? 'radial-gradient(circle at 22% 72%, rgba(220,38,38,0.24) 0%, transparent 48%)'
                    : 'radial-gradient(circle at 78% 72%, rgba(37,99,235,0.22) 0%, transparent 48%)',
              }}
            />

            {/* Pixel Smoke Flares Tossed Onto Lawn */}
            {[
              { x: 32, y: 63, drift: -1 },
              { x: 67, y: 61, drift: 1 },
            ].map((fl, fIdx) => {
              const puff = (Math.floor(elapsedMs / 130) + fIdx) % 3;
              return (
                <div
                  key={fIdx}
                  className="absolute pointer-events-none z-20"
                  style={{
                    left: `${fl.x}%`,
                    top: `${fl.y}%`,
                    width: '4.5%',
                    aspectRatio: '16 / 16',
                    transform: 'translate(-50%, -80%)',
                  }}
                >
                  <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className="w-full h-full pixelated">
                    <rect x={6} y={13} width={4} height={2} fill="#090D16" />
                    <rect x={7} y={12} width={2} height={2} fill="#DC2626" />
                    <rect x={7} y={11} width={2} height={1} fill="#FEF08A" />
                    <rect x={5 + puff * fl.drift} y={7} width={5} height={4} fill="#EF4444" opacity={0.65} />
                    <rect x={4 + puff * fl.drift * 2} y={3} width={7} height={5} fill="#991B1B" opacity={0.48} />
                  </svg>
                </div>
              );
            })}

            {LAWN_RAIDERS.map((r) => {
              const jumpEndMs = r.jumpStartMs + r.jumpDurMs;
              let x = r.startX;
              let y = r.startY;
              let lift = 0;
              let jumping = false;

              if (elapsedMs < r.jumpStartMs) {
                const p = elapsedMs / r.jumpStartMs;
                x = r.startX + p * (r.fenceX - r.startX);
                y = r.startY + p * (74.5 - r.startY);
              } else if (elapsedMs < jumpEndMs) {
                const p = (elapsedMs - r.jumpStartMs) / r.jumpDurMs;
                x = r.fenceX;
                y = 74.5 + p * (54.5 - 74.5);
                lift = Math.sin(p * Math.PI) * 10.5;
                jumping = true;
              } else {
                const runDur = Math.max(800, OFFICE_ENTER_MS - jumpEndMs - 150);
                const p = Math.min(1, (elapsedMs - jumpEndMs) / runDur);
                x = r.fenceX + p * (r.doorX - r.fenceX);
                y = 54.5 + p * (19 - 54.5);
              }

              if (y <= 18.2) return null;
              const justLanded = elapsedMs >= jumpEndMs && elapsedMs <= jumpEndMs + 280;

              return (
                <React.Fragment key={r.id}>
                  <div
                    className="absolute pointer-events-none bg-[#090D16]"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${Math.max(1.8, 3.1 - lift * 0.1)}%`,
                      height: '1%',
                      opacity: Math.max(0.25, 0.5 - lift * 0.02),
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                  {justLanded && (
                    <div
                      className="absolute pointer-events-none bg-[#CBD5E1]"
                      style={{
                        left: `${r.fenceX}%`,
                        top: '55%',
                        width: '3.2%',
                        height: '1.2%',
                        opacity: 0.65,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  )}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${x}%`,
                      top: `${y - lift}%`,
                      width: '5.2%',
                      aspectRatio: '24 / 28',
                      transform: 'translate(-50%, -88%)',
                      zIndex: Math.round(y),
                    }}
                  >
                    <PixelProtesterSprite
                      styleIdx={r.styleIdx}
                      frame={runFrame + r.id}
                      isJumping={jumping}
                      hasSign={r.hasSign}
                      signText={r.signText}
                      hideShadow={true}
                    />
                  </div>
                </React.Fragment>
              );
            })}
          </>
        )}

        {/* PHASE 2: Inside President's Office — Mob Floods Walkable Lanes & Wrecks the Office */}
        {isInsideOffice && (
          <>
            <img
              src={officeMapUrl}
              alt="Oval Office Raided"
              draggable={false}
              className="absolute inset-0 w-full h-full object-fill pixelated pointer-events-none"
            />

            {/* Atmospheric Security Strobe & Broken-Window Light Shaft Shaders */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 54%, rgba(0,0,0,0) 35%, rgba(127, 29, 29, 0.42) 100%)',
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(155deg, transparent 22%, rgba(254, 249, 195, 0.1) 34%, transparent 48%, rgba(254, 249, 195, 0.08) 62%, transparent 74%)',
              }}
            />

            {/* Flickering Firelight Radial Glow Shaders Over West & East Document Fires */}
            {officeElapsedMs > 1250 && (
              <>
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: '29%',
                    top: '51%',
                    width: '18%',
                    height: '22%',
                    transform: 'translate(-50%, -50%)',
                    background:
                      runFrame % 2 === 0
                        ? 'radial-gradient(circle, rgba(249,115,22,0.42) 0%, rgba(220,38,38,0.18) 50%, transparent 75%)'
                        : 'radial-gradient(circle, rgba(250,204,21,0.34) 0%, rgba(234,88,12,0.16) 50%, transparent 75%)',
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: '71%',
                    top: '49%',
                    width: '18%',
                    height: '22%',
                    transform: 'translate(-50%, -50%)',
                    background:
                      runFrame % 2 === 0
                        ? 'radial-gradient(circle, rgba(250,204,21,0.34) 0%, rgba(234,88,12,0.16) 50%, transparent 75%)'
                        : 'radial-gradient(circle, rgba(249,115,22,0.42) 0%, rgba(220,38,38,0.18) 50%, transparent 75%)',
                  }}
                />
              </>
            )}

            <OvalOfficeDestructionSvg officeElapsedMs={officeElapsedMs} />

            {OFFICE_RAIDERS.map((r) => {
              if (officeElapsedMs < r.entryMs) return null;
              const elapsedSec = (officeElapsedMs - r.entryMs) / 1000;
              const pos = evaluateWaypointPath(r.waypoints, elapsedSec, 28);

              let x = pos.x;
              let y = pos.y;
              let hopLift = 0;
              let flipX = pos.flipX;

              if (pos.arrived) {
                const chaosT = elapsedSec + r.id * 0.7;
                x = pos.x + Math.sin(chaosT * 2.8) * 1.1;
                y = pos.y + Math.cos(chaosT * 2.2) * 0.75;
                hopLift = Math.max(0, Math.sin(chaosT * 7.5)) * 2.8;
                flipX = Math.cos(chaosT * 2.1) < 0;
              }

              return (
                <div
                  key={r.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${x}%`,
                    top: `${y - hopLift}%`,
                    width: '5.8%',
                    aspectRatio: '24 / 28',
                    transform: 'translate(-50%, -88%)',
                    zIndex: Math.round(y),
                  }}
                >
                  <PixelProtesterSprite
                    styleIdx={r.styleIdx}
                    frame={runFrame + r.id}
                    isJumping={hopLift > 1.6}
                    hasSign={r.hasSign}
                    signText={r.signText}
                    flipX={flipX}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Scene Cut Flash when Doors Burst Open */}
      {transitionFlashOpacity > 0.01 && (
        <div
          className="absolute inset-0 bg-[#FEF9C3] pointer-events-none z-40"
          style={{ opacity: transitionFlashOpacity }}
        />
      )}

      {/* High-Fidelity Shader-Styled Top Alert Plaque (no square dots, no DEFCON/SEC bars) */}
      {!showGameOver && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
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
              <PixelRaidFistIcon className="w-full h-full" />
            </div>
            <span
              className="relative font-mono font-bold text-xs sm:text-sm tracking-[0.14em] text-[#FEF08A] uppercase whitespace-nowrap"
              style={{
                textShadow: '0 2px 0 #090D16, 0 0 12px rgba(250, 204, 21, 0.45)',
              }}
            >
              {isInsideOffice ? 'OVAL OFFICE RAIDED' : 'WHITE HOUSE RAID'}
            </span>
          </div>
        </div>
      )}

      {/* High-Fidelity 32-Bit Pixel GAME OVER Modal (strictly z-[200] above all scene/NPC layers) */}
      {showGameOver && (
        <PixelGameOverModal
          emblem="raid"
          subtitle="WHITE HOUSE RAIDED"
          incidentLabel="INCIDENT"
          incidentValue="PUBLIC UPRISING"
          reasonValue="0% APPROVAL"
          portrait={
            <div className="w-8 h-9">
              <PixelProtesterSprite styleIdx={0} frame={0} hideShadow={true} />
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
