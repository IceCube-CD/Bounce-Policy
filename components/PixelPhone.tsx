import React, { useState } from 'react';
import { TwittlyPost, TwittlyTag } from '../types/engine';
import { PRESET_GAME_EVENTS } from '../data/defaultNews';
import { REACTION_MOODS } from '../data/defaultBills';

type PhoneAppId = 'home' | 'twittly' | 'wetube';

interface PixelPhoneProps {
  day: number;
  hour: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  posts: TwittlyPost[];
  unreadCount: number;
  onMarkRead: () => void;
  onCreateEvent: (payload: {
    content: string;
    tag: TwittlyTag;
    author?: string;
    handle?: string;
    avatarColor?: string;
  }) => void;
  onToggleLike: (postId: string) => void;
  onToggleRepost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  fullscreen?: boolean;
}

const FONT_3X5: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  ':': ['0', '1', '0', '1', '0'],
};

function renderPixelTime(text: string, startX: number, startY: number, fill: string) {
  const rects: React.ReactNode[] = [];
  let cx = startX;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const glyph = FONT_3X5[ch];
    if (!glyph) continue;
    const gw = glyph[0].length;
    for (let r = 0; r < glyph.length; r++) {
      for (let c = 0; c < gw; c++) {
        if (glyph[r][c] === '1') {
          rects.push(
            <rect
              key={`${i}-${r}-${c}`}
              x={cx + c}
              y={startY + r}
              width={1}
              height={1}
              fill={fill}
            />
          );
        }
      }
    }
    cx += gw + 1;
  }
  return rects;
}

function formatCompactHour(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const suffix = normalized < 12 ? 'AM' : 'PM';
  const h12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${h12}:00 ${suffix}`;
}

function PixelBirdIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" className={className}>
      {/* Crisp pixel bird silhouette */}
      <rect x={6} y={2} width={3} height={1} fill="#FFFFFF" />
      <rect x={5} y={3} width={5} height={1} fill="#FFFFFF" />
      <rect x={10} y={3} width={1} height={1} fill="#BAE6FD" />
      <rect x={2} y={4} width={2} height={1} fill="#FFFFFF" />
      <rect x={5} y={4} width={5} height={1} fill="#FFFFFF" />
      <rect x={2} y={5} width={8} height={1} fill="#FFFFFF" />
      <rect x={3} y={6} width={6} height={1} fill="#FFFFFF" />
      <rect x={3} y={7} width={5} height={1} fill="#FFFFFF" />
      <rect x={2} y={8} width={5} height={1} fill="#E0F2FE" />
      <rect x={4} y={9} width={3} height={1} fill="#BAE6FD" />
      <rect x={8} y={4} width={1} height={1} fill="#0C4A6E" />
    </svg>
  );
}

function PixelPlayIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" className={className}>
      <rect x={4} y={2} width={1} height={8} fill="#FFFFFF" />
      <rect x={5} y={3} width={1} height={6} fill="#FFFFFF" />
      <rect x={6} y={4} width={2} height={4} fill="#FFFFFF" />
      <rect x={8} y={5} width={1} height={2} fill="#FFFFFF" />
    </svg>
  );
}

function PixelVerifiedBadge() {
  return (
    <svg
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      className="w-2.5 h-2.5 inline-block shrink-0"
      aria-label="Verified"
    >
      <rect x={2} y={1} width={4} height={6} fill="#1DA1F2" />
      <rect x={1} y={2} width={6} height={4} fill="#1DA1F2" />
      <rect x={5} y={2} width={1} height={1} fill="#FFFFFF" />
      <rect x={4} y={3} width={1} height={1} fill="#FFFFFF" />
      <rect x={2} y={4} width={1} height={1} fill="#FFFFFF" />
      <rect x={3} y={4} width={1} height={1} fill="#FFFFFF" />
    </svg>
  );
}

function PixelSquareTile({
  fill,
  hi,
  shade,
  children,
}: {
  fill: string;
  hi: string;
  shade: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative w-full aspect-square">
      <svg viewBox="0 0 12 12" shapeRendering="crispEdges" className="w-full h-full block">
        <rect x={1} y={11} width={10} height={1} fill="rgba(4,8,18,0.55)" />
        <rect x={1} y={0} width={10} height={11} fill={fill} />
        <rect x={0} y={1} width={12} height={9} fill={fill} />
        <rect x={1} y={0} width={10} height={1} fill={hi} />
        <rect x={1} y={10} width={10} height={1} fill={shade} />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center pb-[6%] pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}

const PLACEHOLDER_SQUARES = [
  { fill: '#F59E0B', hi: '#FDE68A', shade: '#B45309' },
  { fill: '#10B981', hi: '#6EE7B7', shade: '#047857' },
  { fill: '#8B5CF6', hi: '#C4B5FD', shade: '#5B21B6' },
  { fill: '#06B6D4', hi: '#67E8F9', shade: '#0E7490' },
  { fill: '#F97316', hi: '#FDBA74', shade: '#C2410C' },
  { fill: '#E2E8F0', hi: '#FFFFFF', shade: '#94A3B8' },
  { fill: '#EC4899', hi: '#F9A8D4', shade: '#BE185D' },
  { fill: '#64748B', hi: '#CBD5E1', shade: '#334155' },
];

const DOCK_PLACEHOLDERS = [
  { fill: '#22C55E', hi: '#86EFAC', shade: '#15803D' },
  { fill: '#38BDF8', hi: '#BAE6FD', shade: '#0284C7' },
  { fill: '#FACC15', hi: '#FEF08A', shade: '#CA8A04' },
  { fill: '#F43F5E', hi: '#FDA4AF', shade: '#BE123C' },
];

const TAG_STYLES: Record<TwittlyTag, string> = {
  BREAKING: 'bg-[#DC2626] text-white border-[#991B1B]',
  POLICY: 'bg-[#1D4ED8] text-white border-[#1E3A8A]',
  PRESS: 'bg-[#0E7490] text-white border-[#155E75]',
  EVENT: 'bg-[#D97706] text-[#0B0F17] border-[#92400E]',
};

export const PixelPhone: React.FC<PixelPhoneProps> = ({
  day,
  hour,
  isOpen,
  onToggle,
  onClose,
  posts,
  unreadCount,
  onMarkRead,
  onCreateEvent,
  onToggleLike,
  onToggleRepost,
  onDeletePost,
  fullscreen = false,
}) => {
  const [activeApp, setActiveApp] = useState<PhoneAppId>('home');
  const [feedFilter, setFeedFilter] = useState<'all' | 'events'>('all');
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [eventTag, setEventTag] = useState<TwittlyTag>('EVENT');
  const [eventText, setEventText] = useState<string>('');

  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const timeStr = `${hour12}:00`;

  const openTwittly = () => {
    setActiveApp('twittly');
    onMarkRead();
  };

  const handlePublishCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = eventText.trim();
    if (!trimmed) return;
    onCreateEvent({
      content: trimmed,
      tag: eventTag,
      author: 'Executive Desk',
      handle: '@POTUS',
      avatarColor: '#B91C1C',
    });
    setEventText('');
    setComposerOpen(false);
  };

  // Collapsed state: strictly shows only the top peeking edge of the unlocked iPhone
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        title="Open Phone"
        aria-label="Open Phone"
        className="group block focus:outline-none cursor-pointer transition-transform duration-150 hover:-translate-y-1 drop-shadow-[0_-4px_12px_rgba(0,0,0,0.75)]"
      >
        <svg
          viewBox="0 0 80 16"
          shapeRendering="crispEdges"
          className="w-[152px] sm:w-[172px] h-auto block"
        >
          {/* Outer pixel outline */}
          <rect x={4} y={0} width={72} height={1} fill="#090D16" />
          <rect x={2} y={1} width={2} height={1} fill="#090D16" />
          <rect x={76} y={1} width={2} height={1} fill="#090D16" />
          <rect x={1} y={2} width={1} height={14} fill="#090D16" />
          <rect x={78} y={2} width={1} height={14} fill="#090D16" />

          {/* Titanium chassis edge */}
          <rect x={4} y={1} width={72} height={15} fill="#334155" />
          <rect x={2} y={2} width={76} height={14} fill="#334155" />
          <rect x={5} y={1} width={70} height={1} fill="#94A3B8" />
          <rect x={3} y={2} width={2} height={1} fill="#64748B" />
          <rect x={75} y={2} width={2} height={1} fill="#64748B" />
          <rect x={3} y={3} width={74} height={13} fill="#0B0F19" />

          {/* Unlocked home screen wallpaper edge */}
          <rect x={5} y={4} width={70} height={12} fill="#102142" />
          <rect x={4} y={5} width={72} height={11} fill="#132952" />
          <rect x={4} y={11} width={72} height={5} fill="#183469" />

          {/* Dynamic Island */}
          <rect x={31} y={6} width={18} height={4} fill="#070A12" />
          <rect x={30} y={7} width={20} height={2} fill="#070A12" />
          <rect x={46} y={7} width={1} height={2} fill="#1D4ED8" />

          {/* Live pixel time */}
          {renderPixelTime(timeStr, 7, 6, '#F8FAFC')}

          {/* Signal & Battery */}
          <rect x={57} y={9} width={1} height={1} fill="#E2E8F0" />
          <rect x={59} y={8} width={1} height={2} fill="#E2E8F0" />
          <rect x={61} y={7} width={1} height={3} fill="#E2E8F0" />
          <rect x={64} y={7} width={7} height={3} fill="#090D16" />
          <rect x={65} y={7} width={5} height={3} fill="#94A3B8" />
          <rect x={65} y={8} width={4} height={1} fill="#4ADE80" />
          <rect x={71} y={8} width={1} height={1} fill="#94A3B8" />

          {/* Twittly notification pixel indicator when unread */}
          {unreadCount > 0 && <rect x={24} y={7} width={3} height={3} fill="#1DA1F2" />}

          {/* Golden hover edge bar */}
          <rect
            x={31}
            y={14}
            width={18}
            height={1}
            fill="#FACC15"
            className="opacity-75 group-hover:opacity-100"
          />
        </svg>
      </button>
    );
  }

  const visiblePosts =
    feedFilter === 'events' ? posts.filter((p) => p.isUserEvent || p.tag === 'EVENT') : posts;
  const userEventsCount = posts.filter((p) => p.isUserEvent || p.tag === 'EVENT').length;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative select-none drop-shadow-[0_14px_28px_rgba(0,0,0,0.85)]"
    >
      {/* Close / Put Away Pixel Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Put Phone Away"
        aria-label="Put Phone Away"
        className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 bg-[#111622] border-2 border-[#D4AF37] text-[#FEF08A] hover:bg-[#1E293B] flex items-center justify-center cursor-pointer shadow-lg"
      >
        <svg viewBox="0 0 7 7" shapeRendering="crispEdges" className="w-3 h-3">
          <rect x={1} y={1} width={1} height={1} fill="#FEF08A" />
          <rect x={5} y={1} width={1} height={1} fill="#FEF08A" />
          <rect x={2} y={2} width={1} height={1} fill="#FEF08A" />
          <rect x={4} y={2} width={1} height={1} fill="#FEF08A" />
          <rect x={3} y={3} width={1} height={1} fill="#FEF08A" />
          <rect x={2} y={4} width={1} height={1} fill="#FEF08A" />
          <rect x={4} y={4} width={1} height={1} fill="#FEF08A" />
          <rect x={1} y={5} width={1} height={1} fill="#FEF08A" />
          <rect x={5} y={5} width={1} height={1} fill="#FEF08A" />
        </svg>
      </button>

      {/* Outer Pixel iPhone Chassis */}
      <div
        className={`relative ${
          fullscreen ? 'h-[min(510px,84vh)]' : 'h-[min(430px,69vh)]'
        } aspect-[80/152]`}
      >
        <svg viewBox="0 0 80 152" shapeRendering="crispEdges" className="w-full h-full block">
          {/* Side hardware buttons */}
          <rect x={0} y={25} width={1} height={6} fill="#475569" />
          <rect x={0} y={34} width={1} height={10} fill="#475569" />
          <rect x={0} y={46} width={1} height={10} fill="#475569" />
          <rect x={79} y={36} width={1} height={14} fill="#475569" />

          {/* Outer stepped dark outline */}
          <rect x={4} y={0} width={72} height={152} fill="#090D16" />
          <rect x={2} y={1} width={76} height={150} fill="#090D16" />
          <rect x={1} y={3} width={78} height={146} fill="#090D16" />

          {/* Brushed titanium outer bezel */}
          <rect x={4} y={1} width={72} height={150} fill="#334155" />
          <rect x={2} y={2} width={76} height={148} fill="#334155" />
          <rect x={5} y={1} width={70} height={1} fill="#94A3B8" />
          <rect x={5} y={150} width={70} height={1} fill="#1E293B" />

          {/* Inner black glass bezel */}
          <rect x={4} y={3} width={72} height={146} fill="#0B0F19" />
          <rect x={3} y={4} width={74} height={144} fill="#0B0F19" />

          {/* Screen Background (Home wallpaper or app backdrop) */}
          <rect x={5} y={4} width={70} height={144} fill="#0E1D3B" />
          <rect x={4} y={5} width={72} height={142} fill="#0E1D3B" />
          {activeApp === 'home' && (
            <>
              <rect x={4} y={26} width={72} height={30} fill="#142B57" />
              <rect x={4} y={56} width={72} height={32} fill="#1C3C78" />
              <rect x={4} y={88} width={72} height={26} fill="#254E96" />
              <rect x={4} y={114} width={72} height={33} fill="#1B366B" />
              {Array.from({ length: 18 }).map((_, i) => (
                <React.Fragment key={`dither-${i}`}>
                  <rect x={5 + i * 4} y={25} width={2} height={1} fill="#142B57" />
                  <rect x={6 + i * 4} y={55} width={2} height={1} fill="#1C3C78" />
                  <rect x={5 + i * 4} y={87} width={2} height={1} fill="#254E96" />
                  <rect x={6 + i * 4} y={113} width={2} height={1} fill="#1B366B" />
                </React.Fragment>
              ))}
            </>
          )}
          {activeApp === 'twittly' && (
            <>
              <rect x={4} y={4} width={72} height={11} fill="#1DA1F2" />
              <rect x={4} y={15} width={72} height={132} fill="#F4FAFF" />
            </>
          )}
          {activeApp === 'wetube' && (
            <>
              <rect x={4} y={4} width={72} height={11} fill="#B91C1C" />
              <rect x={4} y={15} width={72} height={132} fill="#0F1117" />
            </>
          )}

          {/* Status Bar */}
          {renderPixelTime(timeStr, 7, 6, '#F8FAFC')}
          <rect x={31} y={6} width={18} height={4} fill="#070A12" />
          <rect x={30} y={7} width={20} height={2} fill="#070A12" />
          <rect x={46} y={7} width={1} height={2} fill="#1D4ED8" />

          {/* Signal & Battery */}
          <rect x={57} y={9} width={1} height={1} fill="#E2E8F0" />
          <rect x={59} y={8} width={1} height={2} fill="#E2E8F0" />
          <rect x={61} y={7} width={1} height={3} fill="#E2E8F0" />
          <rect x={64} y={7} width={7} height={3} fill="#090D16" />
          <rect x={65} y={7} width={5} height={3} fill="#94A3B8" />
          <rect x={65} y={8} width={4} height={1} fill="#4ADE80" />
          <rect x={71} y={8} width={1} height={1} fill="#94A3B8" />

          {/* Bottom Home Indicator Bar */}
          <rect
            x={26}
            y={144}
            width={28}
            height={2}
            fill={activeApp === 'twittly' ? '#1E293B' : '#E2E8F0'}
            opacity={0.9}
          />
        </svg>

        {/* Interactive Screen Viewport Overlay */}
        <div
          className="absolute flex flex-col overflow-hidden"
          style={{
            left: '5%',
            right: '5%',
            top: '8.2%',
            bottom: '5.5%',
          }}
        >
          {/* HOME SCREEN */}
          {activeApp === 'home' && (
            <div className="flex-1 flex flex-col justify-between p-2.5">
              <div className="grid grid-cols-4 gap-x-2.5 gap-y-3 pt-1">
                {/* Twittly App */}
                <button
                  type="button"
                  onClick={openTwittly}
                  className="group flex flex-col items-center cursor-pointer focus:outline-none"
                >
                  <div className="relative w-full transition-transform group-hover:-translate-y-0.5">
                    <PixelSquareTile fill="#1DA1F2" hi="#7DD3FC" shade="#0369A1">
                      <PixelBirdIcon className="w-[62%] h-[62%]" />
                    </PixelSquareTile>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] bg-[#DC2626] border border-[#090D16] text-white font-mono font-bold text-[8px] leading-[12px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 text-[9px] font-mono font-bold text-white tracking-tight leading-none drop-shadow-[0_1px_0_#090D16]">
                    Twittly
                  </span>
                </button>

                {/* WeTube App */}
                <button
                  type="button"
                  onClick={() => setActiveApp('wetube')}
                  className="group flex flex-col items-center cursor-pointer focus:outline-none"
                >
                  <div className="w-full transition-transform group-hover:-translate-y-0.5">
                    <PixelSquareTile fill="#DC2626" hi="#FCA5A5" shade="#991B1B">
                      <PixelPlayIcon className="w-[62%] h-[62%]" />
                    </PixelSquareTile>
                  </div>
                  <span className="mt-1 text-[9px] font-mono font-bold text-white tracking-tight leading-none drop-shadow-[0_1px_0_#090D16]">
                    WeTube
                  </span>
                </button>

                {/* Remaining Placeholder Squares */}
                {PLACEHOLDER_SQUARES.map((sq, idx) => (
                  <div key={`sq-${idx}`} className="flex flex-col items-center">
                    <PixelSquareTile fill={sq.fill} hi={sq.hi} shade={sq.shade} />
                  </div>
                ))}
              </div>

              {/* Bottom Dock Squares */}
              <div className="bg-[#0A1326]/85 border-t-2 border-[#334155]/80 p-1.5 grid grid-cols-4 gap-2.5">
                {DOCK_PLACEHOLDERS.map((sq, idx) => (
                  <PixelSquareTile key={`dock-${idx}`} fill={sq.fill} hi={sq.hi} shade={sq.shade} />
                ))}
              </div>
            </div>
          )}

          {/* WETUBE (EMPTY APP) */}
          {activeApp === 'wetube' && (
            <div className="flex-1 flex flex-col bg-[#0F1117] text-slate-200 font-mono">
              <div className="bg-[#DC2626] border-b-2 border-[#7F1D1D] px-2 py-1.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveApp('home')}
                  className="px-1.5 py-0.5 bg-[#7F1D1D] hover:bg-[#991B1B] border border-[#450A0A] text-[9px] font-bold text-white cursor-pointer"
                >
                  &lt; Home
                </button>
                <div className="flex items-center gap-1">
                  <PixelPlayIcon className="w-3 h-3" />
                  <span className="text-[11px] font-bold text-white tracking-tight">WeTube</span>
                </div>
                <div className="w-9" />
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-9 bg-[#1E222D] border-2 border-[#334155] flex items-center justify-center mb-2">
                  <PixelPlayIcon className="w-5 h-5 opacity-45" />
                </div>
                <div className="text-[10px] font-bold text-slate-400">WeTube</div>
                <div className="text-[9px] text-slate-500 mt-0.5">No videos yet</div>
              </div>
            </div>
          )}

          {/* TWITTLY (TWITTER-BLUE PIXEL NEWS & GAME EVENTS) */}
          {activeApp === 'twittly' && (
            <div className="flex-1 flex flex-col bg-[#F4FAFF] text-[#0F172A] font-mono min-h-0">
              {/* Twitter-Blue Header Bar */}
              <div className="bg-[#1DA1F2] border-b-2 border-[#0E6BA8] px-2 py-1.5 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveApp('home')}
                  className="px-1.5 py-0.5 bg-[#0C7ABF] hover:bg-[#095E94] border border-[#074770] text-[9px] font-bold text-white cursor-pointer"
                >
                  &lt;
                </button>
                <div className="flex items-center gap-1">
                  <PixelBirdIcon className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold text-white tracking-tight">
                    Twittly
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setComposerOpen((v) => !v)}
                  className={`px-1.5 py-0.5 border text-[9px] font-bold cursor-pointer ${
                    composerOpen
                      ? 'bg-[#FEF08A] text-[#0F172A] border-[#B45309]'
                      : 'bg-white text-[#0C7ABF] border-[#0C7ABF] hover:bg-[#E0F2FE]'
                  }`}
                >
                  + Event
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="grid grid-cols-2 bg-[#E1F1FD] border-b-2 border-[#B6DCF7] text-[9px] font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setFeedFilter('all')}
                  className={`py-1 text-center cursor-pointer transition-colors ${
                    feedFilter === 'all'
                      ? 'bg-white text-[#1DA1F2] border-b-2 border-[#1DA1F2]'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  All News ({posts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('events')}
                  className={`py-1 text-center cursor-pointer transition-colors ${
                    feedFilter === 'events'
                      ? 'bg-white text-[#1DA1F2] border-b-2 border-[#1DA1F2]'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  Events ({userEventsCount})
                </button>
              </div>

              {/* Inline Game Event Maker */}
              {composerOpen && (
                <form
                  onSubmit={handlePublishCustomEvent}
                  className="bg-[#E6F4FE] border-b-2 border-[#1DA1F2] p-2 space-y-1.5 shrink-0"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold text-[#0C4A6E]">
                      NEW GAME EVENT
                    </span>
                    <div className="flex items-center gap-0.5">
                      {(['EVENT', 'BREAKING', 'POLICY', 'PRESS'] as TwittlyTag[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEventTag(t)}
                          className={`px-1 py-0.5 text-[7px] font-bold border cursor-pointer ${
                            eventTag === t
                              ? TAG_STYLES[t]
                              : 'bg-white text-[#475569] border-[#93C5FD]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={eventText}
                    onChange={(e) => setEventText(e.target.value)}
                    placeholder="Write event news..."
                    className="w-full bg-white border-2 border-[#93C5FD] focus:border-[#1DA1F2] p-1 text-[10px] leading-tight text-[#0F172A] outline-none resize-none"
                  />

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {PRESET_GAME_EVENTS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            onCreateEvent({
                              content: preset.content,
                              tag: preset.tag,
                              author: preset.author,
                              handle: preset.handle,
                              avatarColor: preset.avatarColor,
                            });
                            setComposerOpen(false);
                          }}
                          className="px-1 py-0.5 bg-white hover:bg-[#DBEAFE] border border-[#60A5FA] text-[8px] font-bold text-[#1E3A8A] whitespace-nowrap cursor-pointer"
                          title={`Post preset: ${preset.label}`}
                        >
                          +{preset.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={!eventText.trim()}
                      className="px-2 py-0.5 bg-[#1DA1F2] hover:bg-[#0C85D0] disabled:opacity-45 border border-[#0A6299] text-[9px] font-bold text-white whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Post
                    </button>
                  </div>
                </form>
              )}

              {/* Scrollable News Feed */}
              <div className="flex-1 overflow-y-auto divide-y-2 divide-[#CFE6F7]">
                {visiblePosts.length === 0 ? (
                  <div className="p-4 text-center text-[10px] text-[#64748B]">
                    No events posted yet. Tap + Event above to create one!
                  </div>
                ) : (
                  visiblePosts.map((post) => (
                    <article
                      key={post.id}
                      className="p-2 bg-[#F4FAFF] hover:bg-[#EAF5FE] transition-colors flex gap-2"
                    >
                      {/* Pixel Avatar Square */}
                      <div
                        className="w-5 h-5 shrink-0 border border-[#0F172A] flex items-center justify-center text-[9px] font-bold text-white shadow-[1px_1px_0px_#0F172A]"
                        style={{ backgroundColor: post.avatarColor }}
                      >
                        {post.author.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[10px] font-bold text-[#0F172A] truncate">
                              {post.author}
                            </span>
                            {post.verified && <PixelVerifiedBadge />}
                          </div>
                          <span className="text-[8px] text-[#64748B] shrink-0 tabular-nums">
                            D{post.day} · {formatCompactHour(post.hour)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] text-[#0284C7] truncate">
                            {post.handle}
                          </span>
                          <span
                            className={`px-1 py-[1px] text-[7px] font-bold border leading-none ${
                              TAG_STYLES[post.tag]
                            }`}
                          >
                            {post.tag}
                          </span>
                          {post.mood && (() => {
                            const moodMeta = REACTION_MOODS.find((m) => m.mood === post.mood);
                            return (
                              <span
                                className={`px-1 py-[1px] text-[7px] font-bold border leading-none uppercase tracking-wider ${
                                  moodMeta?.badgeStyle || 'bg-[#E2E8F0] text-[#334155] border-[#94A3B8]'
                                }`}
                              >
                                {moodMeta?.label || post.mood}
                              </span>
                            );
                          })()}
                        </div>

                        <p className="text-[10px] leading-snug text-[#1E293B] font-sans font-medium break-words">
                          {post.content}
                        </p>

                        <div className="flex items-center justify-between pt-0.5 text-[9px] text-[#475569] tabular-nums">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => onToggleLike(post.id)}
                              className={`inline-flex items-center gap-1 cursor-pointer ${
                                post.liked
                                  ? 'text-[#DC2626] font-bold'
                                  : 'hover:text-[#DC2626]'
                              }`}
                            >
                              <span>{post.liked ? '♥' : '♡'}</span>
                              <span>{post.likes}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleRepost(post.id)}
                              className={`inline-flex items-center gap-1 cursor-pointer ${
                                post.reposted
                                  ? 'text-[#1DA1F2] font-bold'
                                  : 'hover:text-[#1DA1F2]'
                              }`}
                            >
                              <span>↻</span>
                              <span>{post.reposts}</span>
                            </button>
                          </div>

                          {post.isUserEvent && (
                            <button
                              type="button"
                              onClick={() => onDeletePost(post.id)}
                              className="text-[8px] text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                              title="Remove Event"
                            >
                              Del
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Home Indicator Click Target placed outside overflow-hidden viewport */}
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeApp !== 'home') {
              setActiveApp('home');
            } else {
              onClose();
            }
          }}
          aria-label={activeApp === 'home' ? 'Put Phone Away' : 'Back to Home Screen'}
          className="absolute bottom-[2%] left-1/4 right-1/4 h-[4.5%] z-10 cursor-pointer"
        />
      </div>
    </div>
  );
};
