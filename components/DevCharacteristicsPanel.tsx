import React from 'react';
import { RotateCcw } from 'lucide-react';
import { CharacteristicKey, NationCharacteristics } from '../types/engine';
import { CHARACTERISTIC_META } from '../data/defaultBills';
import { getDefconFromSecurity, getDefconMeta } from './PixelDefconHud';

interface DevCharacteristicsPanelProps {
  characteristics: NationCharacteristics;
  onChangeCharacteristic: (key: CharacteristicKey, value: number) => void;
  onResetCharacteristics: () => void;
  title?: string;
  subtitle?: string;
}

const PRESET_VALUES = [0, 15, 35, 60, 85, 100];

export const DevCharacteristicsPanel: React.FC<DevCharacteristicsPanelProps> = ({
  characteristics,
  onChangeCharacteristic,
  onResetCharacteristics,
  title = 'Nation Levels (Dev Controls)',
  subtitle = 'Drag sliders, type values, or click presets to test DEFCON & crisis triggers.',
}) => {
  const securityVal = Math.max(0, Math.min(100, Math.round(characteristics.security ?? 50)));
  const defconLevel = getDefconFromSecurity(securityVal);
  const defconMeta = getDefconMeta(defconLevel);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-100">{title}</h2>
          <p className="text-[11px] text-slate-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onResetCharacteristics}
          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md cursor-pointer shrink-0 whitespace-nowrap"
        >
          <RotateCcw className="w-3 h-3" />
          Reset 50
        </button>
      </div>

      <div className="space-y-3 bg-slate-950/75 border border-slate-800 rounded-lg p-3">
        {CHARACTERISTIC_META.map((meta) => {
          const val = Math.max(
            0,
            Math.min(100, Math.round(characteristics[meta.key] ?? 50))
          );
          const isSecurity = meta.key === 'security';

          return (
            <div key={meta.key} className="space-y-1.5 pb-2.5 last:pb-0 border-b border-slate-800/70 last:border-b-0">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ backgroundColor: meta.barColor }}
                  />
                  <span className="font-semibold text-slate-200 truncate">
                    {meta.label}
                  </span>
                  {isSecurity && (
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: defconMeta.activeBg,
                        color: defconMeta.textHex,
                        border: `1px solid ${defconMeta.activeBorder}`,
                      }}
                    >
                      {defconMeta.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-mono tabular-nums shrink-0">
                  <button
                    type="button"
                    onClick={() => onChangeCharacteristic(meta.key, Math.max(0, val - 5))}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 cursor-pointer"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={val}
                    aria-label={`${meta.label} value`}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (Number.isNaN(raw)) return;
                      onChangeCharacteristic(meta.key, Math.max(0, Math.min(100, raw)));
                    }}
                    className="w-12 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded px-1 py-0.5 text-center text-[11px] font-bold text-slate-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onChangeCharacteristic(meta.key, Math.min(100, val + 5))}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={val}
                aria-label={`${meta.label} slider`}
                onChange={(e) =>
                  onChangeCharacteristic(meta.key, Number(e.target.value))
                }
                className="w-full h-1.5 accent-amber-400 cursor-pointer bg-slate-800 rounded-lg"
              />

              <div className="flex items-center justify-between gap-1">
                {PRESET_VALUES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChangeCharacteristic(meta.key, preset)}
                    className={`flex-1 py-0.5 text-[9px] font-mono rounded border transition-colors cursor-pointer ${
                      val === preset
                        ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-bold'
                        : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
