import React from 'react';

export type InteractPromptKind =
  | 'door'
  | 'map'
  | 'character'
  | 'phone'
  | 'desk'
  | 'helicopter'
  | 'interact';
export type InteractKeyLabel = 'E' | 'R' | 'F';

interface PixelInteractButtonProps {
  label: string;
  actionText: string;
  kind: InteractPromptKind;
  keyLabel?: InteractKeyLabel;
  onClick: () => void;
}

interface PixelDialogueBoxProps {
  label: string;
  description: string;
  kind: InteractPromptKind;
  onPostToTwittly: () => void;
  onClose: () => void;
}

const PIXEL_ICON_PALETTE: Record<string, string> = {
  '.': 'transparent',
  o: '#090D16', // crisp dark pixel outline
  g: '#FACC15', // bright gold
  y: '#FEF08A', // highlight gold
  b: '#B45309', // deep brass
  m: '#78350F', // mahogany dark
  w: '#92400E', // mahogany mid
  r: '#D97706', // amber wood highlight
  c: '#38BDF8', // sky cyan
  C: '#BAE6FD', // bright cyan glint
  B: '#0284C7', // deep ocean blue
  d: '#1E293B', // dark slate / receiver body
  D: '#334155', // mid slate highlight
  s: '#F1F5F9', // white highlight / shirt
  f: '#E5A278', // warm skin tone
  e: '#CBD5E1', // silver / parchment
  E: '#34D399', // hotline emerald
  k: '#DC2626', // red hotline lamp
};

// 14x14 Pixel Door Sprite
const DOOR_SPRITE = [
  '..oooooooooo..',
  '.orrrrrrrrrro.',
  '.ormmmmmmmmro.',
  '.ormwmmmmwmro.',
  '.ormwmmmmwmro.',
  '.ormwmmmmwmro.',
  '.ormwmgmmwmro.',
  '.ormwmgmmwmro.',
  '.ormwmmmmwmro.',
  '.ormmmmmmmmro.',
  '.ormwmmmmwmro.',
  '.ormwmmmmwmro.',
  '.oooooooooooo.',
  'bbbbbbbbbbbbbb',
];

// 14x14 Pixel World Map / Globe Sprite
const MAP_SPRITE = [
  '....oooooo....',
  '..oocCCCCcoo..',
  '.ocCBggggBCco.',
  '.oCBBgBBggBCo.',
  'ocBBgBBBBgBBco',
  'oCBBggggggBBCo',
  'oCBBBBggBBBBCo',
  'oCBgggBBggBBCo',
  '.oCBgggggBBCo.',
  '.ocCBBBBBBCco.',
  '..oocCCCCcoo..',
  '....oooooo....',
  '...oggggggo...',
  '..obbbbbbbbo..',
];

// 14x14 Pixel Secret Service Agent Badge / Aviator Sprite
const GUARD_SPRITE = [
  '...oooooooo...',
  '..oddddddddo..',
  '.odffffffffdo.',
  '.offfffffffoo.',
  '.oddddddddddo.',
  '.odCddodCdddo.',
  '.oddddddddddo.',
  '..offfffffoo..',
  '..oossssssoo..',
  '.odddssssdddo.',
  '.oddddsdsdddo.',
  '.oddddsdsdddo.',
  '..oooooooooo..',
  '..............',
];

// 14x14 Pixel Executive Desk Phone Sprite
const PHONE_SPRITE = [
  '..............',
  '..oooooooooo..',
  '.oDDDDDDDDDDo.',
  '.oddooooooodo.',
  '.ooo.oDDo.ooo.',
  '....oDDDDoo...',
  '...oDddddDdo..',
  '..oDdkEgEgDdo.',
  '..oddddddDddo.',
  '..odDeDeDeDdo.',
  '.oDDDDDDDDDDdo',
  '.oddddddddddo.',
  '.oooooooooooo.',
  '..............',
];

// 14x14 Pixel Executive Brief / Inspect Sprite
const INSPECT_SPRITE = [
  '..oooooooooo..',
  '.osssssssssso.',
  '.oseeeeeeeeso.',
  '.osoooooooeso.',
  '.oseeeeeeeeso.',
  '.osoooooeoeso.',
  '.oseeeeeeeeso.',
  '.osoooooeoeso.',
  '.oseeeeeeeeso.',
  '.oseeeoggieso.',
  '.oseeeoggoeso.',
  '.oseeeeeeeeso.',
  '..oooooooooo..',
  '..............',
];

// 14x14 Pixel Resolute Desk Bill & Wax Seal Sprite
const DESK_SPRITE = [
  '..ooooooooo...',
  '.ossssssssso..',
  '.oseeeeeeeso..',
  '.osoooooooeso.',
  '.oseeeeeeeso..',
  '.osooooeeeso..',
  '.oseeeeeeesoo.',
  '.oseeekkooeso.',
  '.oseekkkkkeso.',
  '.oseekgykkeso.',
  '.oseekkkkkeso.',
  '.oseeekkooeso.',
  '..oooooooooo..',
  '..............',
];

// 14x14 Pixel Marine One Helicopter Sprite
const HELICOPTER_SPRITE = [
  '..............',
  '.gggggggggggg.',
  '......oo......',
  '....oossoo....',
  '..ooossssoooo.',
  '.oCCoddddoooDo',
  '.odCoddddoDDDo',
  '.odddddggddddo',
  '..ooooooooooo.',
  '...oo.....oo..',
  '..oooo...oooo.',
  '..............',
  '..............',
  '..............',
];

function getSpriteGrid(kind: InteractPromptKind): string[] {
  switch (kind) {
    case 'door':
      return DOOR_SPRITE;
    case 'map':
      return MAP_SPRITE;
    case 'character':
      return GUARD_SPRITE;
    case 'phone':
      return PHONE_SPRITE;
    case 'desk':
      return DESK_SPRITE;
    case 'helicopter':
      return HELICOPTER_SPRITE;
    default:
      return INSPECT_SPRITE;
  }
}

export function PixelSprite14({
  kind,
  className = 'w-6 h-6',
}: {
  kind: InteractPromptKind;
  className?: string;
}) {
  const grid = getSpriteGrid(kind);
  return (
    <svg viewBox="0 0 14 14" shapeRendering="crispEdges" className={className} aria-hidden="true">
      {grid.map((row, y) =>
        row.split('').map((cell, x) => {
          const fill = PIXEL_ICON_PALETTE[cell];
          if (!fill || fill === 'transparent') return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

const KEY_GLYPHS: Record<InteractKeyLabel, string[]> = {
  E: ['11111', '10000', '11110', '10000', '11111'],
  R: ['11110', '10001', '11110', '10100', '10011'],
  F: ['11111', '10000', '11110', '10000', '10000'],
};

function getThemeColors(kind: InteractPromptKind) {
  if (kind === 'character') {
    return {
      hiEdge: '#67E8F9',
      loEdge: '#0E7490',
      frameEdge: '#06B6D4',
      rivetColor: '#CFFAFE',
      actionColor: 'text-[#67E8F9]',
      slotBorder: 'border-[#0E7490]',
      arrowFill: '#67E8F9',
      keyFace: '#22D3EE',
      keyHi: '#CFFAFE',
      keyShade: '#0891B2',
      focusClass: 'focus-visible:outline-cyan-300',
    };
  }
  if (kind === 'phone') {
    return {
      hiEdge: '#6EE7B7',
      loEdge: '#047857',
      frameEdge: '#10B981',
      rivetColor: '#D1FAE5',
      actionColor: 'text-[#6EE7B7]',
      slotBorder: 'border-[#047857]',
      arrowFill: '#6EE7B7',
      keyFace: '#34D399',
      keyHi: '#D1FAE5',
      keyShade: '#059669',
      focusClass: 'focus-visible:outline-emerald-300',
    };
  }
  return {
    hiEdge: '#EBC14B',
    loEdge: '#8F6118',
    frameEdge: '#C88F2A',
    rivetColor: '#FEF08A',
    actionColor: 'text-[#FEF08A]',
    slotBorder: 'border-[#7C5318]',
    arrowFill: '#FEF08A',
    keyFace: '#FACC15',
    keyHi: '#FEF9C3',
    keyShade: '#B45309',
    focusClass: 'focus-visible:outline-amber-300',
  };
}

function PixelKeycap({
  keyLabel,
  face,
  hi,
  shade,
}: {
  keyLabel: InteractKeyLabel;
  face: string;
  hi: string;
  shade: string;
}) {
  const glyph = KEY_GLYPHS[keyLabel] || KEY_GLYPHS.E;

  return (
    <div
      className="relative w-7 h-7 shrink-0 flex items-center justify-center transition-transform duration-75 group-hover:-translate-y-[1px] group-active:translate-y-[1px]"
      style={{
        backgroundColor: face,
        boxShadow: [
          `inset 2px 2px 0 0 ${hi}`,
          `inset -2px -2px 0 0 ${shade}`,
          '0 0 0 2px #090D16',
          '0 2px 0 2px #090D16',
        ].join(', '),
      }}
    >
      <svg viewBox="0 0 5 5" shapeRendering="crispEdges" className="w-3.5 h-3.5" aria-hidden="true">
        {glyph.map((row, y) =>
          row.split('').map((bit, x) =>
            bit === '1' ? (
              <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#090D16" />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}

function PixelRightArrow({ fill }: { fill: string }) {
  return (
    <svg
      viewBox="0 0 5 7"
      shapeRendering="crispEdges"
      className="w-2.5 h-3.5 shrink-0 transition-transform duration-100 group-hover:translate-x-0.5"
      aria-hidden="true"
    >
      <rect x={0} y={0} width={1} height={7} fill={fill} />
      <rect x={1} y={1} width={1} height={5} fill={fill} />
      <rect x={2} y={2} width={1} height={3} fill={fill} />
      <rect x={3} y={3} width={1} height={1} fill={fill} />
    </svg>
  );
}

function PixelBirdTiny() {
  return (
    <svg viewBox="0 0 9 8" shapeRendering="crispEdges" className="w-3.5 h-3 shrink-0" aria-hidden="true">
      <rect x={5} y={1} width={2} height={1} fill="#FFFFFF" />
      <rect x={4} y={2} width={4} height={1} fill="#FFFFFF" />
      <rect x={8} y={2} width={1} height={1} fill="#BAE6FD" />
      <rect x={1} y={3} width={2} height={1} fill="#FFFFFF" />
      <rect x={4} y={3} width={4} height={1} fill="#FFFFFF" />
      <rect x={1} y={4} width={6} height={1} fill="#FFFFFF" />
      <rect x={2} y={5} width={4} height={1} fill="#E0F2FE" />
      <rect x={3} y={6} width={2} height={1} fill="#BAE6FD" />
    </svg>
  );
}

export const PixelInteractButton: React.FC<PixelInteractButtonProps> = ({
  label,
  actionText,
  kind,
  keyLabel = 'E',
  onClick,
}) => {
  const theme = getThemeColors(kind);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        imageRendering: 'pixelated',
        boxShadow: [
          `inset 2px 2px 0 0 ${theme.hiEdge}`,
          `inset -2px -2px 0 0 ${theme.loEdge}`,
          '0 0 0 2px #090D16',
          `0 0 0 4px ${theme.frameEdge}`,
          '0 0 0 6px #090D16',
          '4px 6px 0 4px rgba(0, 0, 0, 0.6)',
        ].join(', '),
      }}
      className={`group relative bg-[#131B2E] hover:bg-[#19243D] active:translate-y-[2px] px-3.5 py-2 flex items-center gap-3 transition-transform duration-75 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 ${theme.focusClass}`}
    >
      {/* 4 Corner Pixel Rivets */}
      <span className="absolute top-1 left-1 w-1 h-1 pointer-events-none" style={{ backgroundColor: theme.rivetColor }} />
      <span className="absolute top-1 right-1 w-1 h-1 pointer-events-none" style={{ backgroundColor: theme.rivetColor }} />
      <span className="absolute bottom-1 left-1 w-1 h-1 pointer-events-none" style={{ backgroundColor: theme.rivetColor }} />
      <span className="absolute bottom-1 right-1 w-1 h-1 pointer-events-none" style={{ backgroundColor: theme.rivetColor }} />

      {/* 32-Bit Pixel Keycap [E / R / F] */}
      <PixelKeycap
        keyLabel={keyLabel}
        face={theme.keyFace}
        hi={theme.keyHi}
        shade={theme.keyShade}
      />

      {/* 14x14 Pixel Context Icon */}
      <div className={`w-7 h-7 shrink-0 bg-[#0B101D] p-1 border-2 ${theme.slotBorder} flex items-center justify-center`}>
        <PixelSprite14 kind={kind} className="w-full h-full" />
      </div>

      {/* Crisp Action + Target Name */}
      <div className="flex flex-col items-start text-left leading-none gap-1 font-mono pr-1">
        <span
          className={`text-[10px] font-bold tracking-[0.14em] uppercase ${theme.actionColor} drop-shadow-[1px_1px_0_#090D16] whitespace-nowrap`}
        >
          {actionText}
        </span>
        <span className="text-xs font-bold tracking-[0.04em] text-[#F8FAFC] drop-shadow-[1px_1px_0_#090D16] whitespace-nowrap">
          {label}
        </span>
      </div>

      {/* Pixel Pointer Chevron */}
      <PixelRightArrow fill={theme.arrowFill} />
    </button>
  );
};

export const PixelDialogueBox: React.FC<PixelDialogueBoxProps> = ({
  label,
  description,
  kind,
  onPostToTwittly,
  onClose,
}) => {
  const theme = getThemeColors(kind);

  return (
    <div
      style={{
        imageRendering: 'pixelated',
        boxShadow: [
          `inset 2px 2px 0 0 ${theme.hiEdge}`,
          `inset -2px -2px 0 0 ${theme.loEdge}`,
          '0 0 0 2px #090D16',
          `0 0 0 4px ${theme.frameEdge}`,
          '0 0 0 6px #090D16',
          '4px 8px 0 4px rgba(0, 0, 0, 0.72)',
        ].join(', '),
      }}
      className="relative bg-[#111829] px-4 py-3.5 select-none"
    >
      {/* 4 Corner Pixel Rivets */}
      <span className="absolute top-1 left-1 w-1 h-1 pointer-events-none" style={{ backgroundColor: theme.rivetColor }} />
      <span className="absolute top-1 right-1 w-1 h-1 pointer-events-none" style={{ backgroundColor: theme.rivetColor }} />
      <span className="absolute bottom-1 left-1 w-1 h-1 pointer-events-none" style={{ backgroundColor: theme.rivetColor }} />
      <span className="absolute bottom-1 right-1 w-1 h-1 pointer-events-none" style={{ backgroundColor: theme.rivetColor }} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 shrink-0 bg-[#090D16] p-1.5 border-2 ${theme.slotBorder} flex items-center justify-center`}>
            <PixelSprite14 kind={kind} className="w-full h-full" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className={`text-xs font-mono font-bold tracking-[0.08em] uppercase ${theme.actionColor} drop-shadow-[1px_1px_0_#090D16]`}>
              {label}
            </div>
            <p className="text-xs sm:text-sm text-[#F8FAFC] leading-relaxed font-medium">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={onPostToTwittly}
            style={{
              boxShadow: [
                'inset 2px 2px 0 0 #7DD3FC',
                'inset -2px -2px 0 0 #0369A1',
                '0 0 0 2px #090D16',
                '2px 3px 0 1px #05070D',
              ].join(', '),
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1DA1F2] hover:bg-[#38BDF8] active:translate-y-[1px] text-[#FFFFFF] text-[11px] font-mono font-bold tracking-wide transition-transform duration-75 whitespace-nowrap cursor-pointer"
          >
            <PixelBirdTiny />
            Post Twittly
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              boxShadow: [
                'inset 2px 2px 0 0 #475569',
                'inset -2px -2px 0 0 #0F172A',
                '0 0 0 2px #090D16',
                '2px 3px 0 1px #05070D',
              ].join(', '),
            }}
            className="inline-flex items-center px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] active:translate-y-[1px] text-[#F1F5F9] text-[11px] font-mono font-bold tracking-wide transition-transform duration-75 whitespace-nowrap cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
