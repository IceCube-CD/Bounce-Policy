import React from 'react';
import { renderPixelGridRle } from '../utils/pixelGridCache';

interface PixelDayHudProps {
  day: number;
  hour: number; // 0..23
}

const ICON_PALETTE: Record<string, string> = {
  '.': 'transparent',
  o: '#121624', // dark outline
  y: '#FACC15', // sun gold
  w: '#FEF08A', // bright sun core
  a: '#EA580C', // amber sun ray
  m: '#CBD5E1', // silver moon
  M: '#F8FAFC', // bright moon edge
  s: '#64748B', // moon shadow
  k: '#F59E0B', // dusk lantern gold
};

// 14x14 Day Sun Sprite
const SUN_ICON = [
  '......oo......',
  '..o..oYYo..o..'.replace(/Y/g, 'y'),
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

// 14x14 Night Crescent Moon Sprite
const MOON_ICON = [
  '..............',
  '.....ooooo....',
  '...ooMMmmoo...',
  '..oMMmmsoo....',
  '.oMmmsso......',
  '.oMmsso....o..',
  '.oMmsso...oMo.',
  '.oMmmsso...o..',
  '.oMMmmso......',
  '..oMMmmsoo..o.',
  '...ooMMmmmooo.',
  '.....ooooooo..',
  '..............',
  '..............',
];

function formatHour(hour24: number): string {
  const h = ((Math.floor(hour24) % 24) + 24) % 24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:00 ${suffix}`;
}

export const PixelDayHud: React.FC<PixelDayHudProps> = React.memo(({ day, hour }) => {
  const normalizedHour = ((Math.floor(hour) % 24) + 24) % 24;
  const isNight = normalizedHour < 6 || normalizedHour >= 19;
  const iconGrid = isNight ? MOON_ICON : SUN_ICON;

  return (
    <div
      className="relative pointer-events-none select-none"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Stepped 32-bit Pixel Art Plaque Border */}
      <div
        className="relative bg-[#131B2E] px-3.5 py-2 flex items-center gap-3"
        style={{
          boxShadow: [
            // Inner gold highlight bevel
            'inset 2px 2px 0 0 #EBC14B',
            'inset -2px -2px 0 0 #8F6118',
            // Crisp dark pixel border + outer brass frame
            '0 0 0 2px #090D16',
            '0 0 0 4px #C88F2A',
            '0 0 0 6px #090D16',
            // Hard pixel drop shadow
            '4px 6px 0 4px rgba(0, 0, 0, 0.55)',
          ].join(', '),
        }}
      >
        {/* 4 Corner Pixel Rivets */}
        <span className="absolute top-1 left-1 w-1 h-1 bg-[#FEF08A]" />
        <span className="absolute top-1 right-1 w-1 h-1 bg-[#FEF08A]" />
        <span className="absolute bottom-1 left-1 w-1 h-1 bg-[#FEF08A]" />
        <span className="absolute bottom-1 right-1 w-1 h-1 bg-[#FEF08A]" />

        {/* 14x14 Pixel Sun / Moon Sprite */}
        <div className="w-7 h-7 shrink-0 bg-[#0B101D] p-1 border-2 border-[#7C5318]">
          <svg viewBox="0 0 14 14" shapeRendering="crispEdges" className="w-full h-full">
            {renderPixelGridRle(iconGrid, ICON_PALETTE)}
          </svg>
        </div>

        {/* Strictly DAY and HOUR readout */}
        <div className="flex flex-col leading-none gap-1 font-mono tabular-nums pr-0.5">
          <span className="text-[11px] font-bold tracking-[0.14em] text-[#FEF08A] drop-shadow-[1px_1px_0_#090D16]">
            DAY {day}
          </span>
          <span className="text-xs font-bold tracking-[0.08em] text-[#F8FAFC] drop-shadow-[1px_1px_0_#090D16]">
            {formatHour(normalizedHour)}
          </span>
        </div>
      </div>
    </div>
  );
});
