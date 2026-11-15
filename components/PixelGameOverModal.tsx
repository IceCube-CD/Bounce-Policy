import React from 'react';

export type GameOverEmblemKind = 'nuke' | 'bombing' | 'raid';

interface PixelGameOverModalProps {
  emblem: GameOverEmblemKind;
  subtitle: string;
  incidentLabel: string;
  incidentValue: string;
  reasonValue: string;
  portrait: React.ReactNode;
  headerStrip?: React.ReactNode;
  onRestart: () => void;
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
  '0 0 64px 4px rgba(220, 38, 38, 0.24)',
].join(', ');

const PIXEL_BAY_SHADOW = [
  'inset 0 6px 14px rgba(0, 0, 0, 0.85)',
  'inset 2px 2px 0 0 #04060B',
  'inset -2px -2px 0 0 #26324B',
  '0 0 0 2px #090D16',
  '0 3px 0 0 rgba(0, 0, 0, 0.55)',
].join(', ');

// 5x7 Pixel Bitmap Font glyphs for crisp authentic "GAME OVER" bitmap lettering
const PIXEL_FONT_5X7: Record<string, string[]> = {
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
};

function PixelBitmapGameOverTitle() {
  const word = 'GAME OVER';
  const pixels: { x: number; y: number; row: number }[] = [];
  let cursorX = 2;

  for (const ch of word) {
    const glyph = PIXEL_FONT_5X7[ch] || PIXEL_FONT_5X7[' '];
    const width = glyph[0].length;
    glyph.forEach((rowStr, ry) => {
      for (let rx = 0; rx < width; rx++) {
        if (rowStr[rx] === '1') {
          pixels.push({ x: cursorX + rx, y: ry + 2, row: ry });
        }
      }
    });
    cursorX += width + (ch === ' ' ? 2 : 2);
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
      aria-label="GAME OVER"
      className="w-full max-w-[236px] h-auto pixelated mx-auto"
      style={{
        filter:
          'drop-shadow(0 2px 0 #05070C) drop-shadow(0 0 12px rgba(239, 68, 68, 0.45))',
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
      {/* 5-tone 32-bit vertical bevel fill */}
      {pixels.map((p, i) => {
        const fill =
          p.row === 0
            ? '#FEF08A'
            : p.row === 1
              ? '#FCA5A5'
              : p.row <= 3
                ? '#EF4444'
                : p.row === 4
                  ? '#DC2626'
                  : '#991B1B';
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
      <rect x={2} y={2} width={2} height={2} fill="#DC2626" />
      <rect x={4} y={2} width={2} height={1} fill="#B45309" />
      <rect x={2} y={4} width={1} height={2} fill="#B45309" />
    </svg>
  );
}

function PixelHazardRibbon() {
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
            <rect x={x} y={0} width={4} height={4} fill="#DC2626" />
            <rect x={x + 1} y={0} width={3} height={2} fill="#EF4444" />
            <rect x={x + 4} y={0} width={4} height={4} fill="#EAB308" />
            <rect x={x + 4} y={0} width={3} height={2} fill="#FEF08A" />
          </g>
        );
      })}
    </svg>
  );
}

// High-Fidelity 32x28 Pixel Crisis Emblem Dioramas
function HighFidelityCrisisEmblem({ kind }: { kind: GameOverEmblemKind }) {
  if (kind === 'nuke') {
    return (
      <svg viewBox="0 0 32 28" shapeRendering="crispEdges" className="w-full h-full pixelated">
        {/* Crimson fallout sky */}
        <rect x={0} y={0} width={32} height={28} fill="#160608" />
        <rect x={0} y={14} width={32} height={10} fill="#2A0909" />
        <rect x={3} y={4} width={1} height={1} fill="#FACC15" />
        <rect x={27} y={6} width={1} height={1} fill="#F97316" />
        {/* Mushroom cloud cap */}
        <rect x={7} y={3} width={18} height={3} fill="#7F1D1D" />
        <rect x={5} y={5} width={22} height={6} fill="#B91C1C" />
        <rect x={7} y={4} width={18} height={6} fill="#EA580C" />
        <rect x={10} y={5} width={12} height={4} fill="#FACC15" />
        <rect x={13} y={6} width={6} height={2} fill="#FEF9C3" />
        <rect x={6} y={11} width={20} height={2} fill="#450A0A" />
        {/* Stem & shockwave ring */}
        <rect x={12} y={12} width={8} height={10} fill="#7C2D12" />
        <rect x={13} y={12} width={6} height={10} fill="#EA580C" />
        <rect x={15} y={12} width={2} height={10} fill="#FEF08A" />
        <rect x={8} y={15} width={16} height={2} fill="#F8FAFC" />
        {/* Scorched White House silhouette & ground */}
        <rect x={0} y={22} width={32} height={6} fill="#090D16" />
        <rect x={4} y={20} width={24} height={3} fill="#450A0A" />
        <rect x={9} y={21} width={14} height={2} fill="#F97316" />
      </svg>
    );
  }

  if (kind === 'bombing') {
    return (
      <svg viewBox="0 0 32 28" shapeRendering="crispEdges" className="w-full h-full pixelated">
        {/* Night sky */}
        <rect x={0} y={0} width={32} height={28} fill="#140709" />
        {/* Smoke plumes */}
        <rect x={6} y={2} width={20} height={5} fill="#1C1917" />
        <rect x={10} y={1} width={12} height={4} fill="#292524" />
        {/* Roaring pixel flames across roof & wings */}
        <rect x={4} y={5} width={24} height={7} fill="#991B1B" />
        <rect x={7} y={4} width={18} height={7} fill="#DC2626" />
        <rect x={10} y={5} width={12} height={6} fill="#EA580C" />
        <rect x={13} y={6} width={6} height={4} fill="#FACC15" />
        <rect x={15} y={7} width={2} height={2} fill="#FEF9C3" />
        {/* White House facade & columns */}
        <rect x={3} y={12} width={26} height={11} fill="#090D16" />
        <rect x={4} y={13} width={24} height={9} fill="#CBD5E1" />
        <rect x={10} y={10} width={12} height={3} fill="#E2E8F0" />
        {/* Columns & scorched center portico */}
        <rect x={7} y={13} width={2} height={9} fill="#64748B" />
        <rect x={11} y={13} width={2} height={9} fill="#475569" />
        <rect x={19} y={13} width={2} height={9} fill="#475569" />
        <rect x={23} y={13} width={2} height={9} fill="#64748B" />
        {/* Portico Blast Core */}
        <rect x={12} y={15} width={8} height={7} fill="#991B1B" />
        <rect x={13} y={16} width={6} height={6} fill="#EA580C" />
        <rect x={14} y={18} width={4} height={4} fill="#FACC15" />
        {/* Lawn */}
        <rect x={0} y={23} width={32} height={5} fill="#14532D" />
        <rect x={11} y={23} width={10} height={3} fill="#450A0A" />
      </svg>
    );
  }

  // 'raid' emblem: White House / Oval Office stormed by crowd
  return (
    <svg viewBox="0 0 32 28" shapeRendering="crispEdges" className="w-full h-full pixelated">
      <rect x={0} y={0} width={32} height={28} fill="#0F131F" />
      {/* White House facade */}
      <rect x={3} y={4} width={26} height={13} fill="#090D16" />
      <rect x={4} y={5} width={24} height={11} fill="#E2E8F0" />
      <rect x={11} y={2} width={10} height={3} fill="#CBD5E1" />
      {/* Broken dark open doors & broken windows */}
      <rect x={6} y={7} width={3} height={4} fill="#1E293B" />
      <rect x={23} y={7} width={3} height={4} fill="#1E293B" />
      <rect x={13} y={9} width={6} height={7} fill="#05070C" />
      <rect x={10} y={6} width={2} height={10} fill="#94A3B8" />
      <rect x={20} y={6} width={2} height={10} fill="#94A3B8" />
      {/* Protest flags & signs */}
      <rect x={6} y={13} width={5} height={3} fill="#FEF08A" />
      <rect x={21} y={12} width={5} height={3} fill="#FEF08A" />
      <rect x={14} y={5} width={4} height={3} fill="#DC2626" />
      {/* Mob silhouettes */}
      <rect x={0} y={17} width={32} height={11} fill="#090D16" />
      <rect x={2} y={18} width={4} height={7} fill="#DC2626" />
      <rect x={8} y={17} width={4} height={8} fill="#F59E0B" />
      <rect x={14} y={18} width={4} height={7} fill="#2563EB" />
      <rect x={20} y={17} width={4} height={8} fill="#EF4444" />
      <rect x={26} y={18} width={4} height={7} fill="#16A34A" />
      {/* Heads */}
      <rect x={3} y={15} width={2} height={3} fill="#E5A278" />
      <rect x={9} y={14} width={2} height={3} fill="#C9835B" />
      <rect x={15} y={15} width={2} height={3} fill="#F2BE9A" />
      <rect x={21} y={14} width={2} height={3} fill="#8D5232" />
      <rect x={27} y={15} width={2} height={3} fill="#E5A278" />
    </svg>
  );
}

function PixelDangerDiamondIcon() {
  return (
    <svg viewBox="0 0 11 11" shapeRendering="crispEdges" className="w-3.5 h-3.5 pixelated shrink-0">
      <rect x={4} y={0} width={3} height={1} fill="#090D16" />
      <rect x={3} y={1} width={5} height={2} fill="#090D16" />
      <rect x={2} y={3} width={7} height={2} fill="#090D16" />
      <rect x={1} y={5} width={9} height={3} fill="#090D16" />
      <rect x={0} y={8} width={11} height={3} fill="#090D16" />
      <rect x={4} y={1} width={3} height={2} fill="#DC2626" />
      <rect x={3} y={3} width={5} height={2} fill="#EF4444" />
      <rect x={2} y={5} width={7} height={3} fill="#DC2626" />
      <rect x={1} y={8} width={9} height={2} fill="#991B1B" />
      <rect x={5} y={3} width={1} height={4} fill="#FEF08A" />
      <rect x={5} y={8} width={1} height={1} fill="#FEF08A" />
    </svg>
  );
}

function PixelReloadArrowIcon() {
  return (
    <svg viewBox="0 0 14 14" shapeRendering="crispEdges" className="w-4 h-4 pixelated shrink-0">
      {/* Crisp 14x14 Circular Reset Arrow */}
      <rect x={4} y={2} width={5} height={2} fill="#090D16" />
      <rect x={2} y={3} width={3} height={2} fill="#090D16" />
      <rect x={2} y={5} width={2} height={4} fill="#090D16" />
      <rect x={2} y={9} width={3} height={2} fill="#090D16" />
      <rect x={4} y={10} width={6} height={2} fill="#090D16" />
      <rect x={9} y={9} width={3} height={2} fill="#090D16" />
      <rect x={10} y={7} width={2} height={3} fill="#090D16" />
      {/* Arrowhead pointing right-down on upper right */}
      <rect x={9} y={1} width={1} height={5} fill="#090D16" />
      <rect x={10} y={2} width={1} height={4} fill="#090D16" />
      <rect x={11} y={3} width={1} height={2} fill="#090D16" />
      <rect x={8} y={5} width={4} height={1} fill="#090D16" />
    </svg>
  );
}

export const PixelGameOverModal: React.FC<PixelGameOverModalProps> = React.memo(({
  emblem,
  subtitle,
  incidentLabel,
  incidentValue,
  reasonValue,
  portrait,
  headerStrip,
  onRestart,
}) => {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-[200] flex items-center justify-center p-3 sm:p-4"
      style={{
        imageRendering: 'pixelated',
        background:
          'radial-gradient(circle at 50% 48%, rgba(153, 27, 27, 0.22) 0%, rgba(9, 13, 22, 0.78) 52%, rgba(3, 5, 10, 0.94) 100%)',
      }}
    >
      {/* Subtle Retro CRT Scanline Overlay across modal backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 2px, transparent 2px, transparent 4px)',
        }}
      />

      {/* High-Fidelity 32-Bit Pixel Command Plaque with Top-Down Metallic Shader & Ambient Crisis Shadow */}
      <div
        className="relative w-full max-w-[436px] p-4 sm:p-5 flex flex-col items-center gap-2.5 sm:gap-3 text-center"
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

        {/* Stepped Pixel Caution Ribbon */}
        <PixelHazardRibbon />

        {/* Optional DEFCON Strip (used only on Tactical Nuke) */}
        {headerStrip}

        {/* Centered Top Header Monitor Bay: Diorama Emblem + Bitmap "GAME OVER" + Centered Red Subtitle Box */}
        <div
          className="w-full px-4 py-2.5 sm:py-3 flex flex-col items-center justify-center text-center gap-1.5 relative overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at 50% 34%, rgba(220, 38, 38, 0.26) 0%, rgba(127, 29, 29, 0.12) 45%, #070B14 100%)',
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

          {/* Centered Crisis Diorama Emblem flanked by subtle bevel rules */}
          <div className="relative flex items-center justify-center gap-3">
            <div className="hidden sm:block w-10 h-0.5 bg-gradient-to-r from-transparent to-[#DC2626] shadow-[0_1px_0_#090D16]" />
            <div
              className="relative box-content w-[64px] h-[56px] shrink-0 bg-[#140608] border-2 border-[#DC2626] flex items-center justify-center"
              style={{
                boxShadow:
                  'inset 1px 1px 0 0 #FCA5A5, 0 0 0 2px #090D16, 0 6px 16px rgba(0,0,0,0.8), 0 0 20px rgba(220,38,38,0.4)',
              }}
            >
              <HighFidelityCrisisEmblem kind={emblem} />
            </div>
            <div className="hidden sm:block w-10 h-0.5 bg-gradient-to-l from-transparent to-[#DC2626] shadow-[0_1px_0_#090D16]" />
          </div>

          {/* Centered Bitmap GAME OVER & Centered Red Subtitle Box (no square dots) */}
          <div className="relative w-full flex flex-col items-center justify-center text-center">
            <PixelBitmapGameOverTitle />
            <div
              className="mt-1.5 inline-flex items-center justify-center border-2 border-[#DC2626] px-3 py-1"
              style={{
                background: 'linear-gradient(180deg, #450A0A 0%, #1F060A 100%)',
                boxShadow:
                  'inset 1px 1px 0 0 #F87171, inset -1px -1px 0 0 #450A0A, 0 0 0 1px #090D16, 0 3px 0 0 #090D16, 0 0 16px rgba(220,38,38,0.38)',
              }}
            >
              <span className="font-mono font-bold text-[10px] sm:text-[11px] tracking-[0.16em] text-[#FEF08A] uppercase drop-shadow-[1px_1px_0_#090D16]">
                {subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Recessed Pixel Divider Bar (no dangling square dots) */}
        <div
          className="w-full h-1 bg-[#090D16] flex items-center"
          style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.06)' }}
        >
          <span className="w-full h-0.5 bg-gradient-to-r from-[#090D16] via-[#B45309] to-[#090D16]" />
        </div>

        {/* Recessed Incident & Reason Plaque with Inner Depth Shading */}
        <div
          className="w-full p-2.5 sm:p-3 flex items-center justify-between gap-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0D1424 0%, #070B14 100%)',
            boxShadow: PIXEL_BAY_SHADOW,
          }}
        >
          <div className="flex items-center gap-3 min-w-0 text-left">
            <div
              className="w-12 h-11 bg-[#131B2E] border-2 border-[#7C5318] p-1 flex items-center justify-center shrink-0"
              style={{
                boxShadow:
                  'inset 1px 1px 0 0 #FDE047, 0 0 0 1px #090D16, 0 3px 6px rgba(0,0,0,0.65)',
              }}
            >
              {portrait}
            </div>
            <div className="min-w-0">
              <div className="font-mono font-bold text-[9px] tracking-[0.16em] text-[#94A3B8] uppercase">
                {incidentLabel}
              </div>
              <div className="font-mono font-bold text-sm sm:text-base tracking-[0.08em] text-[#F8FAFC] uppercase truncate drop-shadow-[1px_1px_0_#090D16] mt-0.5">
                {incidentValue}
              </div>
            </div>
          </div>

          <div
            className="border-2 border-[#DC2626] px-2.5 py-1.5 text-center shrink-0 flex flex-col items-center"
            style={{
              background: 'linear-gradient(180deg, #3B090F 0%, #1B0609 100%)',
              boxShadow:
                'inset 1px 1px 0 0 #FCA5A5, 0 0 0 1px #090D16, 0 2px 0 0 #090D16, 0 0 14px rgba(220,38,38,0.28)',
            }}
          >
            <div className="flex items-center gap-1 font-mono font-bold text-[9px] tracking-[0.14em] text-[#FCA5A5] uppercase">
              <PixelDangerDiamondIcon />
              <span>REASON</span>
            </div>
            <div className="font-mono font-bold text-xs tracking-[0.08em] text-[#FEF08A] uppercase mt-0.5 drop-shadow-[1px_1px_0_#090D16]">
              {reasonValue}
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
            onRestart();
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
          <PixelReloadArrowIcon />
          <span>Restart Administration</span>
        </button>
      </div>
    </div>
  );
});
