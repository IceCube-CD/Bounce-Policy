import React from 'react';

export interface PresidentialChatterClip {
  id: string;
  label: string;
  text: string;
  audioUrl: string;
}

export const PRESIDENTIAL_CHATTER_CLIPS: PresidentialChatterClip[] = [
  {
    id: 'bing-bong',
    label: 'BING BONG',
    text: '*CHATTER* "BING BING, BONG BONG, BING BING BONG!"',
    audioUrl: './audio/chatter_bing_bong.mp3',
  },
  {
    id: 'where-am-i',
    label: 'WHERE AM I?',
    text: '*CHATTER* "WHERE AM I?"',
    audioUrl: './audio/chatter_where_am_i.mp3',
  },
  {
    id: 'the-best',
    label: 'THE BEST',
    text: '*CHATTER* "THE BEST, BELIEVE ME!"',
    audioUrl: './audio/chatter_the_best.mp3',
  },
];

interface PixelEventSummonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSummonNuke: () => void;
  onSummonBombing: () => void;
  onSummonRaid: () => void;
  onTriggerChatter: (clipId?: string) => void;
}

export const PixelEventSummonModal: React.FC<PixelEventSummonModalProps> = ({
  isOpen,
  onClose,
  onSummonNuke,
  onSummonBombing,
  onSummonRaid,
  onTriggerChatter,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 select-none"
      style={{
        background:
          'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.55) 0%, rgba(2, 6, 23, 0.82) 100%)',
        backdropFilter: 'blur(2px)',
        imageRendering: 'pixelated',
      }}
      onClick={onClose}
    >
      {/* Little High-Fidelity Pixel Window */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          imageRendering: 'pixelated',
          boxShadow:
            '0 0 0 3px #05070B, 0 0 0 6px #991B1B, 0 0 0 9px #05070B, inset 0 0 0 2px #1E293B, 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 40px rgba(220, 38, 38, 0.28)',
        }}
        className="relative w-full max-w-[400px] bg-[#0B0F19] text-[#F8FAFC] overflow-hidden"
      >
        {/* Subtle CRT Scanlines Overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-20 opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, transparent 1px, transparent 3px)',
          }}
        />

        {/* Top Specular Glass Reflection */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-12 z-10 opacity-20"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Pixel Corner Rivets */}
        <div className="pointer-events-none absolute top-1.5 left-1.5 w-2 h-2 bg-[#F59E0B] border border-[#05070B] z-30" />
        <div className="pointer-events-none absolute top-1.5 right-1.5 w-2 h-2 bg-[#F59E0B] border border-[#05070B] z-30" />
        <div className="pointer-events-none absolute bottom-1.5 left-1.5 w-2 h-2 bg-[#F59E0B] border border-[#05070B] z-30" />
        <div className="pointer-events-none absolute bottom-1.5 right-1.5 w-2 h-2 bg-[#F59E0B] border border-[#05070B] z-30" />

        {/* Header Bar */}
        <div
          style={{
            boxShadow: 'inset 0 -2px 0 0 #05070B, inset 0 2px 0 0 #EF4444',
          }}
          className="relative z-10 flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#450A0A] via-[#7F1D1D] to-[#450A0A]"
        >
          <div className="flex items-center gap-2.5">
            {/* Pixel Warning Beacon Sprite */}
            <svg
              viewBox="0 0 16 16"
              className="w-5 h-5 shrink-0"
              style={{ shapeRendering: 'crispEdges' }}
            >
              <rect x="6" y="1" width="4" height="2" fill="#FDE047" />
              <rect x="5" y="3" width="6" height="2" fill="#EF4444" />
              <rect x="4" y="5" width="8" height="6" fill="#DC2626" />
              <rect x="5" y="6" width="2" height="4" fill="#FCA5A5" />
              <rect x="3" y="11" width="10" height="2" fill="#991B1B" />
              <rect x="2" y="13" width="12" height="2" fill="#475569" />
            </svg>
            <div>
              <div
                style={{ textShadow: '2px 2px 0 #05070B' }}
                className="font-mono font-black text-xs tracking-[0.16em] uppercase text-[#FEF08A]"
              >
                CRISIS & CHATTER MENU
              </div>
              <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-[#FECACA]">
                SELECT EVENT OR TEST VOICE CHATTER
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              boxShadow:
                'inset 1px 1px 0 0 #FCA5A5, inset -1px -1px 0 0 #450A0A, 0 0 0 2px #05070B',
            }}
            className="px-2 py-0.5 bg-[#991B1B] hover:bg-[#B91C1C] active:translate-y-0.5 text-[#FEF2F2] font-mono font-black text-[10px] tracking-wider uppercase cursor-pointer"
          >
            [B] ✕
          </button>
        </div>

        {/* Event Cards List */}
        <div className="relative z-10 p-3.5 space-y-2.5 bg-[#090D16]">
          {/* 1. Tactical Nuclear Strike */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSummonNuke();
            }}
            style={{
              boxShadow:
                'inset 2px 2px 0 0 #334155, inset -2px -2px 0 0 #020617, 0 0 0 2px #05070B',
            }}
            className="w-full group flex items-center justify-between gap-3 p-2.5 bg-[#111827] hover:bg-[#1E293B] border border-[#EF4444]/60 hover:border-[#F87171] transition-colors cursor-pointer text-left active:translate-y-0.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Pixel Art Nuke Mushroom Cloud Emblem */}
              <div
                style={{
                  boxShadow:
                    'inset 1px 1px 0 0 #FCA5A5, inset -1px -1px 0 0 #450A0A, 0 0 0 2px #05070B',
                }}
                className="w-11 h-11 shrink-0 bg-[#450A0A] flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="w-8 h-8"
                  style={{ shapeRendering: 'crispEdges' }}
                >
                  <rect x="4" y="1" width="8" height="2" fill="#FEF08A" />
                  <rect x="2" y="3" width="12" height="3" fill="#F97316" />
                  <rect x="3" y="4" width="10" height="1" fill="#FFFBEB" />
                  <rect x="3" y="6" width="10" height="2" fill="#DC2626" />
                  <rect x="6" y="8" width="4" height="4" fill="#EA580C" />
                  <rect x="7" y="8" width="2" height="4" fill="#FDE047" />
                  <rect x="4" y="12" width="8" height="1" fill="#F97316" />
                  <rect x="2" y="13" width="12" height="2" fill="#7F1D1D" />
                </svg>
              </div>
              <div className="min-w-0">
                <div
                  style={{ textShadow: '1px 1px 0 #000' }}
                  className="font-mono font-black text-xs tracking-wider uppercase text-[#FCA5A5] group-hover:text-[#FEF08A] truncate"
                >
                  1. TACTICAL NUKE
                </div>
                <div className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wide">
                  DEFCON 1 · DIPLOMACY 0%
                </div>
              </div>
            </div>

            <span
              style={{
                boxShadow:
                  'inset 1px 1px 0 0 #FCA5A5, inset -1px -1px 0 0 #7F1D1D, 0 0 0 2px #05070B',
              }}
              className="shrink-0 px-2.5 py-1.5 bg-[#DC2626] group-hover:bg-[#EF4444] text-white font-mono font-black text-[10px] tracking-widest uppercase"
            >
              LAUNCH
            </span>
          </button>

          {/* 2. White House Terrorist Bombing */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSummonBombing();
            }}
            style={{
              boxShadow:
                'inset 2px 2px 0 0 #334155, inset -2px -2px 0 0 #020617, 0 0 0 2px #05070B',
            }}
            className="w-full group flex items-center justify-between gap-3 p-2.5 bg-[#111827] hover:bg-[#1E293B] border border-[#F59E0B]/60 hover:border-[#FBBF24] transition-colors cursor-pointer text-left active:translate-y-0.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Pixel Art White House Bombing Emblem */}
              <div
                style={{
                  boxShadow:
                    'inset 1px 1px 0 0 #FDE68A, inset -1px -1px 0 0 #451A03, 0 0 0 2px #05070B',
                }}
                className="w-11 h-11 shrink-0 bg-[#451A03] flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="w-8 h-8"
                  style={{ shapeRendering: 'crispEdges' }}
                >
                  <rect x="11" y="1" width="2" height="2" fill="#FEF08A" />
                  <rect x="10" y="2" width="2" height="2" fill="#F97316" />
                  <rect x="9" y="4" width="2" height="2" fill="#D97706" />
                  <rect x="4" y="6" width="7" height="7" fill="#1E293B" />
                  <rect x="3" y="7" width="9" height="5" fill="#334155" />
                  <rect x="5" y="7" width="2" height="2" fill="#94A3B8" />
                  <rect x="2" y="13" width="11" height="2" fill="#EA580C" />
                </svg>
              </div>
              <div className="min-w-0">
                <div
                  style={{ textShadow: '1px 1px 0 #000' }}
                  className="font-mono font-black text-xs tracking-wider uppercase text-[#FCD34D] group-hover:text-[#FEF08A] truncate"
                >
                  2. TERRORIST ATTACK
                </div>
                <div className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wide">
                  BOMBING · SECURITY 0%
                </div>
              </div>
            </div>

            <span
              style={{
                boxShadow:
                  'inset 1px 1px 0 0 #FDE68A, inset -1px -1px 0 0 #78350F, 0 0 0 2px #05070B',
              }}
              className="shrink-0 px-2.5 py-1.5 bg-[#D97706] group-hover:bg-[#F59E0B] text-[#05070B] font-mono font-black text-[10px] tracking-widest uppercase"
            >
              LAUNCH
            </span>
          </button>

          {/* 3. White House & Oval Office Public Raid */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSummonRaid();
            }}
            style={{
              boxShadow:
                'inset 2px 2px 0 0 #334155, inset -2px -2px 0 0 #020617, 0 0 0 2px #05070B',
            }}
            className="w-full group flex items-center justify-between gap-3 p-2.5 bg-[#111827] hover:bg-[#1E293B] border border-[#38BDF8]/60 hover:border-[#7DD3FC] transition-colors cursor-pointer text-left active:translate-y-0.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Pixel Art Public Raid / Torch Emblem */}
              <div
                style={{
                  boxShadow:
                    'inset 1px 1px 0 0 #BAE6FD, inset -1px -1px 0 0 #0C4A6E, 0 0 0 2px #05070B',
                }}
                className="w-11 h-11 shrink-0 bg-[#0C4A6E] flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="w-8 h-8"
                  style={{ shapeRendering: 'crispEdges' }}
                >
                  <rect x="7" y="1" width="2" height="2" fill="#FEF08A" />
                  <rect x="6" y="3" width="4" height="2" fill="#F97316" />
                  <rect x="5" y="5" width="6" height="2" fill="#EF4444" />
                  <rect x="7" y="4" width="2" height="3" fill="#FEF08A" />
                  <rect x="6" y="7" width="4" height="2" fill="#475569" />
                  <rect x="7" y="9" width="2" height="5" fill="#92400E" />
                  <rect x="6" y="14" width="4" height="1" fill="#78350F" />
                </svg>
              </div>
              <div className="min-w-0">
                <div
                  style={{ textShadow: '1px 1px 0 #000' }}
                  className="font-mono font-black text-xs tracking-wider uppercase text-[#7DD3FC] group-hover:text-[#E0F2FE] truncate"
                >
                  3. WHITE HOUSE RAID
                </div>
                <div className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wide">
                  PUBLIC MOB · APPROVAL 0%
                </div>
              </div>
            </div>

            <span
              style={{
                boxShadow:
                  'inset 1px 1px 0 0 #BAE6FD, inset -1px -1px 0 0 #0369A1, 0 0 0 2px #05070B',
              }}
              className="shrink-0 px-2.5 py-1.5 bg-[#0284C7] group-hover:bg-[#0EA5E9] text-white font-mono font-black text-[10px] tracking-widest uppercase"
            >
              LAUNCH
            </span>
          </button>

          {/* Divider */}
          <div className="border-t border-[#1E293B] pt-2">
            {/* 4. Test Random Presidential Chatter */}
            <div
              style={{
                boxShadow:
                  'inset 2px 2px 0 0 #334155, inset -2px -2px 0 0 #020617, 0 0 0 2px #05070B',
              }}
              className="p-2.5 bg-[#111827] border border-[#10B981]/60 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Pixel Art Speech Bubble / Megaphone Emblem */}
                  <div
                    style={{
                      boxShadow:
                        'inset 1px 1px 0 0 #6EE7B7, inset -1px -1px 0 0 #064E3B, 0 0 0 2px #05070B',
                    }}
                    className="w-10 h-10 shrink-0 bg-[#064E3B] flex items-center justify-center"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className="w-7 h-7"
                      style={{ shapeRendering: 'crispEdges' }}
                    >
                      <rect x="2" y="2" width="12" height="8" fill="#FEF08A" />
                      <rect x="3" y="3" width="10" height="6" fill="#0F172A" />
                      <rect x="4" y="5" width="2" height="2" fill="#34D399" />
                      <rect x="7" y="5" width="2" height="2" fill="#34D399" />
                      <rect x="10" y="5" width="2" height="2" fill="#34D399" />
                      <rect x="4" y="10" width="3" height="2" fill="#FEF08A" />
                      <rect x="3" y="12" width="2" height="2" fill="#FEF08A" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div
                      style={{ textShadow: '1px 1px 0 #000' }}
                      className="font-mono font-black text-xs tracking-wider uppercase text-[#6EE7B7] truncate"
                    >
                      4. RANDOM CHATTER
                    </div>
                    <div className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wide">
                      PLAYS VOICE + *CHATTER* BUBBLE
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerChatter();
                  }}
                  style={{
                    boxShadow:
                      'inset 1px 1px 0 0 #A7F3D0, inset -1px -1px 0 0 #065F46, 0 0 0 2px #05070B',
                  }}
                  className="shrink-0 px-2.5 py-1.5 bg-[#059669] hover:bg-[#10B981] active:translate-y-0.5 text-white font-mono font-black text-[10px] tracking-widest uppercase cursor-pointer"
                >
                  TEST CHATTER
                </button>
              </div>

              {/* Quick Direct Line Buttons for each of the 3 uploaded clips */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {PRESIDENTIAL_CHATTER_CLIPS.map((clip) => (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onTriggerChatter(clip.id);
                    }}
                    style={{
                      boxShadow:
                        'inset 1px 1px 0 0 #475569, inset -1px -1px 0 0 #020617, 0 0 0 1px #05070B',
                    }}
                    className="px-1.5 py-1 bg-[#1E293B] hover:bg-[#334155] active:translate-y-0.5 text-[#FEF08A] font-mono font-bold text-[9px] tracking-wider uppercase truncate cursor-pointer text-center"
                  >
                    ▶ {clip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="relative z-10 flex items-center justify-between px-4 py-1.5 bg-[#05070B] border-t border-[#1E293B] font-mono text-[9px] text-[#64748B] tracking-widest uppercase">
          <span>PRESS [B] TO TOGGLE</span>
          <span>ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
};
