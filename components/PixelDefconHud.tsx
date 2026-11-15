import React from 'react';

export type DefconLevel = 5 | 4 | 3 | 2 | 1;

export interface DefconStepMeta {
  level: DefconLevel;
  label: string;
  title: string;
  activeBg: string;
  activeBorder: string;
  textHex: string;
}

export const DEFCON_HUD_STEPS: DefconStepMeta[] = [
  {
    level: 5,
    label: 'DEFCON 5',
    title: 'LOWEST READINESS',
    activeBg: '#1D4ED8',
    activeBorder: '#93C5FD',
    textHex: '#DBEAFE',
  },
  {
    level: 4,
    label: 'DEFCON 4',
    title: 'ELEVATED WATCH',
    activeBg: '#15803D',
    activeBorder: '#86EFAC',
    textHex: '#DCFCE7',
  },
  {
    level: 3,
    label: 'DEFCON 3',
    title: 'ROUND HOUSE ALERT',
    activeBg: '#CA8A04',
    activeBorder: '#FEF08A',
    textHex: '#FEF9C3',
  },
  {
    level: 2,
    label: 'DEFCON 2',
    title: 'CRITICAL SECURITY',
    activeBg: '#EA580C',
    activeBorder: '#FDBA74',
    textHex: '#FFEDD5',
  },
  {
    level: 1,
    label: 'DEFCON 1',
    title: 'NUCLEAR STRIKE',
    activeBg: '#DC2626',
    activeBorder: '#FEF08A',
    textHex: '#FEF08A',
  },
];

export function getDefconFromSecurity(security: number): DefconLevel {
  const clamped = Math.max(0, Math.min(100, security));
  if (clamped <= 0) return 1;
  if (clamped < 25) return 2;
  if (clamped < 50) return 3;
  if (clamped < 75) return 4;
  return 5;
}

export function getDefconMeta(level: DefconLevel): DefconStepMeta {
  return DEFCON_HUD_STEPS.find((s) => s.level === level) || DEFCON_HUD_STEPS[1];
}

const PIXEL_PLAQUE_SHADOW = [
  'inset 2px 2px 0 0 #EBC14B',
  'inset -2px -2px 0 0 #8F6118',
  '0 0 0 2px #090D16',
  '0 0 0 4px #C88F2A',
  '0 0 0 6px #090D16',
  '4px 6px 0 4px rgba(0, 0, 0, 0.55)',
].join(', ');

export const PixelDefconHud: React.FC<{ security: number }> = React.memo(({ security }) => {
  const clampedSec = Math.max(0, Math.min(100, Math.round(security)));
  const defconLevel = getDefconFromSecurity(clampedSec);
  const currentDefconIndex = 5 - defconLevel; // 5 -> 0, 4 -> 1, 3 -> 2, 2 -> 3, 1 -> 4

  return (
    <div
      className="relative pointer-events-none select-none"
      style={{ imageRendering: 'pixelated' }}
    >
      <div
        className="relative bg-[#131B2E] px-2.5 py-1.5 flex flex-col gap-1"
        style={{ boxShadow: PIXEL_PLAQUE_SHADOW }}
      >
        {/* 4 Corner Pixel Rivets */}
        <span className="absolute top-1 left-1 w-1 h-1 bg-[#FEF08A]" />
        <span className="absolute top-1 right-1 w-1 h-1 bg-[#FEF08A]" />
        <span className="absolute bottom-1 left-1 w-1 h-1 bg-[#FEF08A]" />
        <span className="absolute bottom-1 right-1 w-1 h-1 bg-[#FEF08A]" />

        <div className="flex items-center gap-1 bg-[#090D16] p-1 border-2 border-[#7C5318]">
          {DEFCON_HUD_STEPS.map((step, idx) => {
            const isLit = idx <= currentDefconIndex;
            const isCurrent = idx === currentDefconIndex;
            return (
              <div
                key={step.level}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 font-mono font-bold text-[9px] sm:text-[10px] tracking-wider uppercase whitespace-nowrap transition-none"
                style={{
                  backgroundColor: isLit ? step.activeBg : '#0F172A',
                  color: isLit ? step.textHex : '#475569',
                  boxShadow: isCurrent
                    ? `inset 1px 1px 0 0 ${step.activeBorder}, 0 0 0 1px #090D16`
                    : 'inset 1px 1px 0 0 #1E293B',
                }}
              >
                {step.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export interface DefconToastData {
  id: number;
  level: DefconLevel;
  previousLevel: DefconLevel;
  security: number;
}

export const PixelDefconNotification: React.FC<{
  toast: DefconToastData | null;
}> = React.memo(({ toast }) => {
  if (!toast) return null;

  const meta = getDefconMeta(toast.level);
  const escalated = toast.level < toast.previousLevel;

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="pointer-events-none select-none animate-[defconPopIn_220ms_cubic-bezier(0.22,1,0.36,1)]"
      style={{ imageRendering: 'pixelated' }}
    >
      <style>{`
        @keyframes defconPopIn {
          0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        className="relative bg-[#131B2E] px-3 py-1.5 flex items-center gap-2"
        style={{ boxShadow: PIXEL_PLAQUE_SHADOW }}
      >
        {/* 4 Corner Pixel Rivets */}
        <span className="absolute top-1 left-1 w-1 h-1 bg-[#FEF08A]" />
        <span className="absolute top-1 right-1 w-1 h-1 bg-[#FEF08A]" />
        <span className="absolute bottom-1 left-1 w-1 h-1 bg-[#FEF08A]" />
        <span className="absolute bottom-1 right-1 w-1 h-1 bg-[#FEF08A]" />

        <span
          className="px-1.5 py-0.5 font-mono font-bold text-[10px] tracking-wider uppercase whitespace-nowrap shrink-0"
          style={{
            backgroundColor: meta.activeBg,
            color: meta.textHex,
            boxShadow: `inset 1px 1px 0 0 ${meta.activeBorder}, 0 0 0 1px #090D16`,
          }}
        >
          {meta.label}
        </span>

        <div className="flex flex-col leading-tight font-mono min-w-0">
          <span className="text-[10px] font-bold tracking-[0.06em] text-[#FEF08A] uppercase whitespace-nowrap">
            {escalated ? 'ALERT ESCALATED' : 'ALERT UPDATED'} · {meta.title}
          </span>
          <span className="text-[9px] text-[#CBD5E1] uppercase tracking-wider whitespace-nowrap tabular-nums">
            DIPLOMACY {Math.round(toast.security)}%
          </span>
        </div>
      </div>
    </div>
  );
});
