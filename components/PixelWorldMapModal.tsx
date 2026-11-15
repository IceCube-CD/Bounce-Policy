import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WORLD_MAP_COUNTRIES, WorldMapCountry, FlagKind } from '../data/worldMapEvents';

interface PixelWorldMapModalProps {
  onClose: () => void;
}

const PIXEL_FONT_3X5: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  C: ['111', '100', '100', '100', '111'],
  E: ['111', '100', '110', '100', '111'],
  I: ['111', '010', '010', '010', '111'],
  K: ['101', '101', '110', '101', '101'],
  M: ['101', '111', '111', '101', '101'],
  N: ['101', '111', '111', '111', '101'],
  O: ['111', '101', '101', '101', '111'],
  R: ['110', '101', '110', '101', '101'],
  S: ['111', '100', '111', '001', '111'],
  X: ['101', '101', '010', '101', '101'],
};

function renderPixelMapLabel(
  text: string,
  centerX: number,
  topY: number,
  fill: string
) {
  const letters = text.split('');
  const totalWidth = letters.length * 4 - 1;
  const startX = Math.round(centerX - totalWidth / 2);

  return (
    <g pointerEvents="none">
      <rect
        x={startX - 2}
        y={topY - 1}
        width={totalWidth + 4}
        height={7}
        fill="#090D16"
        opacity={0.88}
      />
      {letters.map((ch, idx) => {
        const glyph = PIXEL_FONT_3X5[ch];
        if (!glyph) return null;
        const gx = startX + idx * 4;
        return glyph.map((row, ry) =>
          row.split('').map((bit, rx) =>
            bit === '1' ? (
              <rect
                key={`${idx}-${ry}-${rx}`}
                x={gx + rx}
                y={topY + ry}
                width={1}
                height={1}
                fill={fill}
              />
            ) : null
          )
        );
      })}
    </g>
  );
}

function PixelGlobeIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" shapeRendering="crispEdges" className={className}>
      <rect x={4} y={1} width={6} height={1} fill="#090D16" />
      <rect x={2} y={2} width={2} height={1} fill="#090D16" />
      <rect x={10} y={2} width={2} height={1} fill="#090D16" />
      <rect x={1} y={3} width={1} height={8} fill="#090D16" />
      <rect x={12} y={3} width={1} height={8} fill="#090D16" />
      <rect x={2} y={11} width={2} height={1} fill="#090D16" />
      <rect x={10} y={11} width={2} height={1} fill="#090D16" />
      <rect x={4} y={12} width={6} height={1} fill="#090D16" />
      <rect x={4} y={2} width={6} height={10} fill="#1E4E79" />
      <rect x={2} y={3} width={10} height={8} fill="#1E4E79" />
      <rect x={3} y={3} width={2} height={2} fill="#38BDF8" />
      <rect x={3} y={5} width={2} height={3} fill="#D9A84E" />
      <rect x={4} y={8} width={2} height={2} fill="#B88635" />
      <rect x={7} y={3} width={3} height={2} fill="#E5BE67" />
      <rect x={8} y={5} width={3} height={3} fill="#D9A84E" />
      <rect x={7} y={7} width={2} height={3} fill="#B88635" />
      <rect x={10} y={9} width={1} height={2} fill="#D9A84E" />
    </svg>
  );
}

function renderFlagPixels(flag: FlagKind) {
  return (
    <>
      {flag === 'usa' && (
        <>
          <rect x={0} y={0} width={15} height={10} fill="#F8FAFC" />
          <rect x={0} y={0} width={15} height={2} fill="#DC2626" />
          <rect x={0} y={4} width={15} height={2} fill="#DC2626" />
          <rect x={0} y={8} width={15} height={2} fill="#DC2626" />
          <rect x={0} y={0} width={7} height={6} fill="#1D4ED8" />
          <rect x={1} y={1} width={1} height={1} fill="#F8FAFC" />
          <rect x={3} y={1} width={1} height={1} fill="#F8FAFC" />
          <rect x={5} y={1} width={1} height={1} fill="#F8FAFC" />
          <rect x={2} y={3} width={1} height={1} fill="#F8FAFC" />
          <rect x={4} y={3} width={1} height={1} fill="#F8FAFC" />
          <rect x={1} y={4} width={1} height={1} fill="#F8FAFC" />
          <rect x={3} y={4} width={1} height={1} fill="#F8FAFC" />
          <rect x={5} y={4} width={1} height={1} fill="#F8FAFC" />
        </>
      )}
      {flag === 'mexico' && (
        <>
          <rect x={0} y={0} width={5} height={10} fill="#15803D" />
          <rect x={5} y={0} width={5} height={10} fill="#F8FAFC" />
          <rect x={10} y={0} width={5} height={10} fill="#DC2626" />
          <rect x={6} y={4} width={3} height={2} fill="#92400E" />
        </>
      )}
      {flag === 'russia' && (
        <>
          <rect x={0} y={0} width={15} height={3} fill="#F8FAFC" />
          <rect x={0} y={3} width={15} height={4} fill="#2563EB" />
          <rect x={0} y={7} width={15} height={3} fill="#DC2626" />
        </>
      )}
      {flag === 'iran' && (
        <>
          <rect x={0} y={0} width={15} height={3} fill="#16A34A" />
          <rect x={0} y={3} width={15} height={4} fill="#F8FAFC" />
          <rect x={0} y={7} width={15} height={3} fill="#DC2626" />
          <rect x={6} y={4} width={3} height={2} fill="#DC2626" />
          <rect x={7} y={3} width={1} height={4} fill="#DC2626" />
        </>
      )}
      {flag === 'china' && (
        <>
          <rect x={0} y={0} width={15} height={10} fill="#DC2626" />
          <rect x={2} y={2} width={2} height={2} fill="#FACC15" />
          <rect x={5} y={1} width={1} height={1} fill="#FACC15" />
          <rect x={6} y={2} width={1} height={1} fill="#FACC15" />
          <rect x={6} y={4} width={1} height={1} fill="#FACC15" />
          <rect x={5} y={5} width={1} height={1} fill="#FACC15" />
        </>
      )}
      {flag === 'north-korea' && (
        <>
          <rect x={0} y={0} width={15} height={2} fill="#1D4ED8" />
          <rect x={0} y={2} width={15} height={1} fill="#F8FAFC" />
          <rect x={0} y={3} width={15} height={4} fill="#DC2626" />
          <rect x={0} y={7} width={15} height={1} fill="#F8FAFC" />
          <rect x={0} y={8} width={15} height={2} fill="#1D4ED8" />
          <rect x={3} y={3} width={3} height={4} fill="#F8FAFC" />
          <rect x={4} y={4} width={1} height={2} fill="#DC2626" />
        </>
      )}
    </>
  );
}

function renderPixelTerrainTexture(country: WorldMapCountry) {
  const x = country.centerX;
  const y = country.centerY;
  return (
    <g pointerEvents="none" opacity={0.45}>
      <rect x={x - 10} y={y - 6} width={2} height={1} fill={country.highlightColor} />
      <rect x={x - 11} y={y - 5} width={4} height={1} fill={country.shadowColor} />
      <rect x={x + 6} y={y - 7} width={2} height={1} fill={country.highlightColor} />
      <rect x={x + 5} y={y - 6} width={4} height={1} fill={country.shadowColor} />
      <rect x={x - 8} y={y + 8} width={1} height={1} fill={country.shadowColor} />
      <rect x={x - 6} y={y + 9} width={1} height={1} fill={country.shadowColor} />
      <rect x={x + 8} y={y + 6} width={1} height={1} fill={country.highlightColor} />
      <rect x={x + 10} y={y + 7} width={1} height={1} fill={country.shadowColor} />
    </g>
  );
}

export const PixelWorldMapModal: React.FC<PixelWorldMapModalProps> = ({ onClose }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeHighlightId = hoveredId || selectedId;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          imageRendering: 'pixelated',
          boxShadow: [
            'inset 2px 2px 0 0 #EBC14B',
            'inset -2px -2px 0 0 #7C5318',
            '0 0 0 2px #090D16',
            '0 0 0 5px #C88F2A',
            '0 0 0 7px #090D16',
            '0 24px 50px rgba(0, 0, 0, 0.85)',
          ].join(', '),
        }}
        className="w-full max-w-5xl bg-[#0F172A] text-slate-100 overflow-hidden flex flex-col"
      >
        {/* Minimal Map Header */}
        <div className="bg-[#131C31] border-b-2 border-[#7C5318] px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 shrink-0 bg-[#090D16] border-2 border-[#C88F2A] p-1 flex items-center justify-center">
              <PixelGlobeIcon className="w-full h-full" />
            </div>
            <h2 className="text-sm sm:text-base font-bold tracking-wide text-[#FEF08A] font-mono truncate">
              Cabinet World Map
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#090D16] hover:bg-rose-950 text-slate-200 hover:text-rose-200 border border-slate-700 hover:border-rose-500 text-xs font-mono font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>
        </div>

        {/* Map Only Viewport */}
        <div className="bg-[#070B13] p-3 sm:p-4">
          <div className="relative w-full aspect-video border-2 border-[#7C5318] bg-[#091C2E] overflow-hidden shadow-inner">
            <svg
              viewBox="0 0 160 90"
              shapeRendering="crispEdges"
              className="w-full h-full block"
              role="img"
              aria-label="Simplified pixel world map showing expanded borders for America, Mexico, Russia, Iran, China, and Korea"
            >
              {/* Deep Navy-Teal Ocean Backdrop */}
              <rect x={0} y={0} width={160} height={90} fill="#091C2E" />

              {/* Subtle Pixel Latitude / Longitude Grid Lines */}
              {[16, 32, 48, 64, 80, 96, 112, 128, 144].map((gx) => (
                <rect key={`gx-${gx}`} x={gx} y={0} width={0.4} height={90} fill="#102C46" />
              ))}
              {[15, 30, 45, 60, 75].map((gy) => (
                <rect key={`gy-${gy}`} x={0} y={gy} width={160} height={0.4} fill="#102C46" />
              ))}

              {/* Ocean Wave Glints */}
              <rect x={22} y={76} width={4} height={1} fill="#143A5C" />
              <rect x={63} y={64} width={5} height={1} fill="#143A5C" />
              <rect x={112} y={74} width={6} height={1} fill="#143A5C" />
              <rect x={140} y={65} width={4} height={1} fill="#143A5C" />
              <rect x={5} y={40} width={3} height={1} fill="#143A5C" />

              {/* Bottom-Left Pixel Brass Compass Rose */}
              <g transform="translate(8, 68)" pointerEvents="none">
                <rect x={5} y={1} width={3} height={11} fill="#090D16" />
                <rect x={1} y={5} width={11} height={3} fill="#090D16" />
                <rect x={3} y={3} width={7} height={7} fill="#090D16" />
                <rect x={6} y={0} width={1} height={13} fill="#C88F2A" />
                <rect x={0} y={6} width={13} height={1} fill="#C88F2A" />
                <rect x={4} y={4} width={5} height={5} fill="#8F6118" />
                <rect x={5} y={5} width={3} height={3} fill="#FEF08A" />
                <rect x={6} y={1} width={1} height={5} fill="#FEF08A" />
              </g>

              {/* Shallow Coastal Pixel Water Halo */}
              {WORLD_MAP_COUNTRIES.map((country) => (
                <polygon
                  key={`halo-${country.id}`}
                  points={country.polygonPoints}
                  fill="none"
                  stroke="#143D60"
                  strokeWidth={3.2}
                  strokeLinejoin="miter"
                />
              ))}

              {/* 6 Expanded Country Territories */}
              {WORLD_MAP_COUNTRIES.map((country) => {
                const isSelected = country.id === selectedId;
                const isHovered = country.id === hoveredId;
                const fillColor =
                  isSelected || isHovered ? country.hoverColor : country.baseColor;

                return (
                  <g
                    key={country.id}
                    role="button"
                    tabIndex={0}
                    aria-label={country.name}
                    onClick={() =>
                      setSelectedId((prev) => (prev === country.id ? null : country.id))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId((prev) => (prev === country.id ? null : country.id));
                      }
                    }}
                    onMouseEnter={() => setHoveredId(country.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="cursor-pointer focus:outline-none"
                  >
                    <polygon
                      points={country.polygonPoints}
                      fill={fillColor}
                      stroke="#090D16"
                      strokeWidth={1.1}
                      strokeLinejoin="miter"
                    />
                    {renderPixelTerrainTexture(country)}
                  </g>
                );
              })}

              {/* Highlight Gold Pixel Border for Hovered / Selected Country */}
              {activeHighlightId &&
                (() => {
                  const activeCountry = WORLD_MAP_COUNTRIES.find(
                    (c) => c.id === activeHighlightId
                  );
                  if (!activeCountry) return null;
                  return (
                    <polygon
                      points={activeCountry.polygonPoints}
                      fill="none"
                      stroke="#FEF08A"
                      strokeWidth={0.95}
                      strokeLinejoin="miter"
                      pointerEvents="none"
                    />
                  );
                })()}

              {/* Pixel Flag + Bitmap Country Nameplates Inside Each Expanded Country */}
              {WORLD_MAP_COUNTRIES.map((country) => {
                const isActive = country.id === activeHighlightId;
                const flagX = Math.round(country.centerX - 6);
                const flagY = Math.round(country.centerY - 5);

                return (
                  <g key={`badge-${country.id}`} pointerEvents="none">
                    <rect
                      x={flagX - 1}
                      y={flagY - 1}
                      width={14}
                      height={10}
                      fill={isActive ? '#FEF08A' : '#090D16'}
                    />
                    <svg
                      x={flagX}
                      y={flagY}
                      width={12}
                      height={8}
                      viewBox="0 0 15 10"
                      preserveAspectRatio="none"
                      shapeRendering="crispEdges"
                    >
                      {renderFlagPixels(country.flag)}
                    </svg>
                    {renderPixelMapLabel(
                      country.mapLabel,
                      country.centerX,
                      flagY + 10,
                      isActive ? '#FEF08A' : '#F8FAFC'
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
