import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TwittlyTag } from '../types/engine';
import { FlagKind } from '../data/worldMapEvents';
import {
  speakVoiceline,
  stopVoiceline,
  playVoicelineAndWait,
  VoiceProfileId,
} from '../utils/voicePlayer';

interface CountryPhoneLine {
  id: string;
  countryName: string;
  presidentTitle: string;
  flag: FlagKind;
  extLabel: string;
  dialCode: string;
  dtmfPairs: [number, number][];
  voiceProfile: VoiceProfileId;
  audioUrl?: string;
  greetingLine: string;
  postContent: string;
  postTag: TwittlyTag;
}

const MAP_COUNTRY_LINES: CountryPhoneLine[] = [
  {
    id: 'mexico',
    countryName: 'Mexico',
    presidentTitle: 'President of Mexico',
    flag: 'mexico',
    extLabel: 'EXT 01',
    dialCode: '+52-01',
    dtmfPairs: [
      [770, 1336],
      [697, 1336],
      [697, 1209],
    ],
    voiceProfile: 'mexico',
    audioUrl: './audio/leader_mexico.mp3',
    greetingLine:
      '"Buenos días, this is the President of Mexico. Is it finally the time you let us through?"',
    postContent:
      'Just finished a direct call with the President of Mexico on the Oval Office desk phone. Border crossing & policy talks underway!',
    postTag: 'POLICY',
  },
  {
    id: 'russia',
    countryName: 'Russia',
    presidentTitle: 'Vladimir Putin · Russia',
    flag: 'russia',
    extLabel: 'EXT 02',
    dialCode: '+7-001',
    dtmfPairs: [
      [852, 1209],
      [941, 1336],
      [697, 1209],
    ],
    voiceProfile: 'russia',
    audioUrl: './audio/leader_russia.mp3',
    greetingLine:
      '"This is Putin. What do you want this time, Donnie? I have to go stock up on my vodka."',
    postContent:
      'Placed an encrypted red-line call with Vladimir Putin from the Resolute Desk. High-stakes diplomacy is on the table.',
    postTag: 'BREAKING',
  },
  {
    id: 'iran',
    countryName: 'Iran',
    presidentTitle: 'President of Iran',
    flag: 'iran',
    extLabel: 'EXT 03',
    dialCode: '+98-02',
    dtmfPairs: [
      [852, 1477],
      [852, 1336],
      [697, 1336],
    ],
    voiceProfile: 'iran',
    greetingLine:
      '"This is Iran calling back! For the record, we are definitely not building anything nuclear—just very peaceful giant solar heaters!"',
    postContent:
      'Direct hotline call just concluded with Iran. Regional talks and energy infrastructure remain front and center.',
    postTag: 'BREAKING',
  },
  {
    id: 'china',
    countryName: 'China',
    presidentTitle: 'President of China',
    flag: 'china',
    extLabel: 'EXT 04',
    dialCode: '+86-10',
    dtmfPairs: [
      [852, 1336],
      [770, 1477],
      [697, 1209],
    ],
    voiceProfile: 'china',
    audioUrl: './audio/leader_china.wav',
    greetingLine:
      '"Greetings. You have reached the Great Empire of China, the greatest country by far."',
    postContent:
      'Spoke directly with the Great Empire of China from the Resolute Desk phone regarding trade, shipping lanes, and tariffs.',
    postTag: 'POLICY',
  },
  {
    id: 'north-korea',
    countryName: 'Korea',
    presidentTitle: 'Leader of Korea',
    flag: 'north-korea',
    extLabel: 'EXT 05',
    dialCode: '+850-1',
    dtmfPairs: [
      [852, 1336],
      [770, 1336],
      [941, 1336],
    ],
    voiceProfile: 'north-korea',
    greetingLine:
      '"This is Korea! You actually dialed Pyongyang direct? Wait—don’t hang up, those giant rockets were strictly celebratory fireworks!"',
    postContent:
      'Historic surprise call placed to Korea straight from the Oval Office desk phone. Diplomacy moving fast!',
    postTag: 'EVENT',
  },
];

interface EndCallClip {
  audioUrl: string;
  text: string;
}

const TRUMP_END_CALL_CLIPS: EndCallClip[] = [
  {
    audioUrl: './audio/potus_phone_1.mp3',
    text: '"Alright, tremendous talking to you, believe me."',
  },
  {
    audioUrl: './audio/potus_phone_2.mp3',
    text: '"We\'re finished. Great call, tremendous call, probably the greatest call ever made."',
  },
  {
    audioUrl: './audio/potus_phone_3.mp3',
    text: '"Alright, we\'re done here. I\'ve got much bigger things to deal with, believe me."',
  },
];

type CallPhase = 'idle' | 'dialing' | 'ringing' | 'connected' | 'ending';

interface PixelDeskPhoneModalProps {
  onClose: () => void;
  onPostToTwittly: (payload: {
    content: string;
    tag: TwittlyTag;
    author?: string;
    handle?: string;
    avatarColor?: string;
  }) => void;
}

function PixelFlag15x10({
  flag,
  className = 'w-[30px] h-[20px]',
}: {
  flag: FlagKind;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 15 10"
      shapeRendering="crispEdges"
      className={`${className} shrink-0 border-2 border-[#07090E]`}
      aria-hidden="true"
    >
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
      {flag === 'usa' && (
        <>
          <rect x={0} y={0} width={15} height={10} fill="#F8FAFC" />
          <rect x={0} y={0} width={15} height={2} fill="#DC2626" />
          <rect x={0} y={4} width={15} height={2} fill="#DC2626" />
          <rect x={0} y={8} width={15} height={2} fill="#DC2626" />
          <rect x={0} y={0} width={7} height={6} fill="#1D4ED8" />
        </>
      )}
    </svg>
  );
}

// 18x14 Pixel Crimson Hotline Handset Sprite
const RED_PHONE_GRID = [
  '..................',
  '...oooooooooooo...',
  '..oRRRRRRRRRRRRo..',
  '.oRRhRRRRRRRRhRRo.',
  '.oRRooorrrroooRRo.',
  '..ooo..oRRo..ooo..',
  '......oRRRRo......',
  '.....oRdRRdRo.....',
  '....oRdgRgdRRo....',
  '...oRRRRRRRRRRo...',
  '...oRddddddddRo...',
  '..oRRRRRRRRRRRRo..',
  '..oooooooooooooo..',
  '..................',
];

const RED_PHONE_PALETTE: Record<string, string> = {
  '.': 'transparent',
  o: '#07090E',
  R: '#DC2626',
  r: '#991B1B',
  h: '#FCA5A5',
  d: '#450A0A',
  g: '#FACC15',
};

function PixelRedPhoneSprite({ className = 'w-11 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 14" shapeRendering="crispEdges" className={className} aria-hidden="true">
      {RED_PHONE_GRID.map((row, y) =>
        row.split('').map((cell, x) => {
          const fill = RED_PHONE_PALETTE[cell];
          if (!fill || fill === 'transparent') return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

function PixelSpeakerGrille() {
  const rows = 4;
  const cols = 12;
  return (
    <svg
      viewBox="0 0 25 9"
      shapeRendering="crispEdges"
      className="w-16 h-6 shrink-0 opacity-90"
      aria-hidden="true"
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => (
          <g key={`${r}-${c}`}>
            <rect x={c * 2 + 1} y={r * 2 + 1} width={1} height={1} fill="#05060A" />
            <rect x={c * 2 + 1} y={r * 2 + 2} width={1} height={0.4} fill="#3F2414" />
          </g>
        ))
      )}
    </svg>
  );
}

function PixelBrassScrew() {
  return (
    <svg viewBox="0 0 6 6" shapeRendering="crispEdges" className="w-3 h-3 shrink-0" aria-hidden="true">
      <rect x={1} y={0} width={4} height={6} fill="#090706" />
      <rect x={0} y={1} width={6} height={4} fill="#090706" />
      <rect x={1} y={1} width={4} height={4} fill="#CA8A04" />
      <rect x={1} y={1} width={2} height={2} fill="#FEF08A" />
      <rect x={2} y={2} width={2} height={2} fill="#78350F" />
    </svg>
  );
}

export const PixelDeskPhoneModal: React.FC<PixelDeskPhoneModalProps> = ({
  onClose,
  onPostToTwittly,
}) => {
  const [activeCountryId, setActiveCountryId] = useState<string | null>(null);
  const [callPhase, setCallPhase] = useState<CallPhase>('idle');
  const [postedForId, setPostedForId] = useState<string | null>(null);
  const [meterTick, setMeterTick] = useState<number>(0);
  const [endingClipText, setEndingClipText] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<number[]>([]);
  const activeNodesRef = useRef<AudioNode[]>([]);
  const isMountedRef = useRef<boolean>(true);
  const isHangingUpRef = useRef<boolean>(false);

  const stopActiveAudioAndTimers = useCallback(() => {
    stopVoiceline();
    for (const tid of timersRef.current) {
      window.clearTimeout(tid);
    }
    timersRef.current = [];

    for (const node of activeNodesRef.current) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already-stopped nodes
      }
    }
    activeNodesRef.current = [];
  }, []);

  const getAudioContext = useCallback((): AudioContext | null => {
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtor();
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const scheduleDualTone = useCallback(
    (
      ctx: AudioContext,
      freqA: number,
      freqB: number,
      startOffsetSec: number,
      durationSec: number,
      peakGain: number
    ) => {
      const now = ctx.currentTime + startOffsetSec;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.012);
      gain.gain.setValueAtTime(peakGain, Math.max(now + 0.015, now + durationSec - 0.015));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
      gain.connect(ctx.destination);

      const oscA = ctx.createOscillator();
      oscA.type = 'sine';
      oscA.frequency.setValueAtTime(freqA, now);
      oscA.connect(gain);

      const oscB = ctx.createOscillator();
      oscB.type = 'sine';
      oscB.frequency.setValueAtTime(freqB, now);
      oscB.connect(gain);

      oscA.start(now);
      oscB.start(now);
      oscA.stop(now + durationSec + 0.02);
      oscB.stop(now + durationSec + 0.02);

      activeNodesRef.current.push(oscA, oscB, gain);
    },
    []
  );

  const playClosingPhoneSound = useCallback((): number => {
    const ctx = getAudioContext();
    if (!ctx) return 380;
    const now = ctx.currentTime;

    // 1. Crisp handset switch-hook click
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.14, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    clickGain.connect(ctx.destination);

    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(640, now);
    clickOsc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
    clickOsc.connect(clickGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);

    // 2. Heavy bakelite receiver cradle thud
    const thudStart = now + 0.055;
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.2, thudStart);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, thudStart + 0.11);
    thudGain.connect(ctx.destination);

    const thudOsc = ctx.createOscillator();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(210, thudStart);
    thudOsc.frequency.exponentialRampToValueAtTime(52, thudStart + 0.1);
    thudOsc.connect(thudGain);
    thudOsc.start(thudStart);
    thudOsc.stop(thudStart + 0.12);

    // 3. Classic telephone disconnect tone pulse
    const beepStart = now + 0.18;
    const beepGain = ctx.createGain();
    beepGain.gain.setValueAtTime(0.0001, beepStart);
    beepGain.gain.linearRampToValueAtTime(0.065, beepStart + 0.015);
    beepGain.gain.setValueAtTime(0.065, beepStart + 0.16);
    beepGain.gain.exponentialRampToValueAtTime(0.0001, beepStart + 0.21);
    beepGain.connect(ctx.destination);

    const beepOscA = ctx.createOscillator();
    beepOscA.type = 'sine';
    beepOscA.frequency.setValueAtTime(480, beepStart);
    beepOscA.connect(beepGain);

    const beepOscB = ctx.createOscillator();
    beepOscB.type = 'sine';
    beepOscB.frequency.setValueAtTime(620, beepStart);
    beepOscB.connect(beepGain);

    beepOscA.start(beepStart);
    beepOscB.start(beepStart);
    beepOscA.stop(beepStart + 0.22);
    beepOscB.stop(beepStart + 0.22);

    activeNodesRef.current.push(
      clickOsc,
      clickGain,
      thudOsc,
      thudGain,
      beepOscA,
      beepOscB,
      beepGain
    );

    return 430;
  }, [getAudioContext]);

  const startCallToCountry = useCallback(
    (line: CountryPhoneLine) => {
      stopActiveAudioAndTimers();
      setActiveCountryId(line.id);
      setPostedForId(null);
      setCallPhase('dialing');

      const ctx = getAudioContext();
      if (ctx) {
        line.dtmfPairs.forEach(([f1, f2], idx) => {
          scheduleDualTone(ctx, f1, f2, idx * 0.14, 0.095, 0.065);
        });

        scheduleDualTone(ctx, 440, 480, 0.56, 0.52, 0.05);
        scheduleDualTone(ctx, 440, 480, 1.32, 0.52, 0.05);

        const connectNow = ctx.currentTime + 2.02;
        const chimeGain = ctx.createGain();
        chimeGain.gain.setValueAtTime(0.0001, connectNow);
        chimeGain.gain.linearRampToValueAtTime(0.07, connectNow + 0.015);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, connectNow + 0.24);
        chimeGain.connect(ctx.destination);

        const chimeOsc = ctx.createOscillator();
        chimeOsc.type = 'triangle';
        chimeOsc.frequency.setValueAtTime(523.25, connectNow);
        chimeOsc.frequency.setValueAtTime(783.99, connectNow + 0.07);
        chimeOsc.connect(chimeGain);
        chimeOsc.start(connectNow);
        chimeOsc.stop(connectNow + 0.25);
        activeNodesRef.current.push(chimeOsc, chimeGain);
      }

      const tRing = window.setTimeout(() => {
        setCallPhase('ringing');
      }, 480);

      const tConnect = window.setTimeout(() => {
        setCallPhase('connected');
        if (line.audioUrl) {
          speakVoiceline(line.greetingLine, line.voiceProfile, line.audioUrl);
        }
      }, 2020);

      timersRef.current.push(tRing, tConnect);
    },
    [getAudioContext, scheduleDualTone, stopActiveAudioAndTimers]
  );

  useEffect(() => {
    if (callPhase === 'idle') return;
    const interval = window.setInterval(() => {
      setMeterTick((t) => (t + 1) % 8);
    }, 150);
    return () => window.clearInterval(interval);
  }, [callPhase]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopActiveAudioAndTimers();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        void audioCtxRef.current.close();
      }
    };
  }, [stopActiveAudioAndTimers]);

  const activeLine =
    MAP_COUNTRY_LINES.find((c) => c.id === activeCountryId) || null;

  const handleHangUp = useCallback(async () => {
    if (isHangingUpRef.current) return;
    isHangingUpRef.current = true;

    stopActiveAudioAndTimers();

    const clip =
      TRUMP_END_CALL_CLIPS[Math.floor(Math.random() * TRUMP_END_CALL_CLIPS.length)];

    setCallPhase('ending');
    setEndingClipText(clip.text);

    await playVoicelineAndWait(clip.text, 'narrator', clip.audioUrl);
    if (!isMountedRef.current) return;

    const closingDurationMs = playClosingPhoneSound();
    const closeTimer = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      onClose();
    }, closingDurationMs);
    timersRef.current.push(closeTimer);
  }, [onClose, playClosingPhoneSound, stopActiveAudioAndTimers]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-5 select-none"
      onClick={handleHangUp}
    >
      {/* Outer Mahogany & Brass Executive Switchboard Console */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          imageRendering: 'pixelated',
          boxShadow: [
            'inset 3px 3px 0 0 #8C4E2B',
            'inset -3px -3px 0 0 #261209',
            '0 0 0 3px #07090E',
            '0 0 0 6px #C88F2A',
            '0 0 0 9px #07090E',
            '8px 12px 0 6px rgba(0, 0, 0, 0.78)',
          ].join(', '),
        }}
        className="w-full max-w-3xl bg-[#4A2614] p-2.5 sm:p-3 text-slate-100"
      >
        {/* Inner Smoked-Bakelite Steel Console Chassis */}
        <div
          style={{
            boxShadow: [
              'inset 2px 2px 0 0 #3E4352',
              'inset -2px -2px 0 0 #090A0F',
              '0 0 0 2px #07090E',
            ].join(', '),
          }}
          className="bg-[#181B24] p-3 sm:p-4 space-y-4"
        >
          {/* Console Top Nameplate Bar */}
          <div className="flex items-center justify-between gap-3 border-b-2 border-[#090B10] pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <PixelBrassScrew />
              <div
                style={{
                  boxShadow: [
                    'inset 2px 2px 0 0 #07090E',
                    'inset -2px -2px 0 0 #2B3040',
                  ].join(', '),
                }}
                className="bg-[#101219] px-2 py-1 flex items-center justify-center shrink-0"
              >
                <PixelRedPhoneSprite className="w-9 h-7" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold font-mono tracking-[0.12em] uppercase text-[#FEF08A] drop-shadow-[2px_2px_0_#07090E] truncate">
                    Executive Red-Line Switchboard
                  </h2>
                </div>
                <p className="text-[11px] font-mono text-[#CBD5E1] truncate">
                  Direct world-map leader intercom
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2.5">
                <PixelSpeakerGrille />
              </div>

              <button
                type="button"
                disabled={callPhase === 'ending'}
                onClick={() => void handleHangUp()}
                style={{
                  boxShadow: [
                    'inset 2px 2px 0 0 #FCA5A5',
                    'inset -2px -2px 0 0 #7F1D1D',
                    '0 0 0 2px #07090E',
                    '2px 3px 0 0 #05060A',
                  ].join(', '),
                }}
                className={`px-3.5 py-2 text-white text-xs font-mono font-bold tracking-wider uppercase whitespace-nowrap transition-transform duration-75 ${
                  callPhase === 'ending'
                    ? 'bg-[#7F1D1D] opacity-85 cursor-wait'
                    : 'bg-[#DC2626] hover:bg-[#EF4444] active:translate-y-[2px] cursor-pointer'
                }`}
              >
                {callPhase === 'ending' ? 'Ending Call...' : 'End Call'}
              </button>
              <PixelBrassScrew />
            </div>
          </div>

          {/* 5 Mechanical Console Switch Keys (Only Countries from Cabinet Map) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.14em] uppercase text-[#EBC14B]">
              <span>Select Foreign Leader Key</span>
              <span>5 World Map Lines</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {MAP_COUNTRY_LINES.map((line) => {
                const isSelected = line.id === activeCountryId;
                const ledColor = !isSelected
                  ? '#1F2937'
                  : callPhase === 'connected'
                    ? '#22C55E'
                    : meterTick % 2 === 0
                      ? '#FACC15'
                      : '#78350F';

                return (
                  <button
                    key={line.id}
                    type="button"
                    disabled={callPhase === 'ending'}
                    onClick={() => startCallToCountry(line)}
                    style={{
                      boxShadow: isSelected
                        ? [
                            'inset 2px 2px 0 0 #090B10',
                            'inset -2px -2px 0 0 #4B5563',
                            '0 0 0 2px #07090E',
                            '0 0 0 4px #EBC14B',
                          ].join(', ')
                        : [
                            'inset 2px 2px 0 0 #4B5563',
                            'inset -2px -2px 0 0 #0D1017',
                            '0 0 0 2px #07090E',
                            '0 3px 0 1px #05060A',
                          ].join(', '),
                    }}
                    className={`group p-2.5 text-left transition-transform duration-75 flex flex-col justify-between gap-2 ${
                      callPhase === 'ending' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      isSelected
                        ? 'bg-[#262018] translate-y-[2px]'
                        : 'bg-[#262B38] hover:bg-[#2F3545] active:translate-y-[2px]'
                    }`}
                  >
                    {/* Top Row: Flag + Pixel Hardware LED Lamp */}
                    <div className="flex items-center justify-between gap-1.5">
                      <PixelFlag15x10 flag={line.flag} />
                      <span
                        className="w-2.5 h-2.5 border border-[#07090E] shrink-0"
                        style={{
                          backgroundColor: ledColor,
                          boxShadow:
                            isSelected && callPhase === 'connected'
                              ? 'inset 1px 1px 0 0 #BBF7D0'
                              : undefined,
                        }}
                      />
                    </div>

                    {/* Country Keycap Label */}
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[10px] font-mono font-bold tracking-wider text-[#FACC15]">
                        {line.extLabel}
                      </div>
                      <div className="text-xs font-mono font-bold text-[#F8FAFC] truncate drop-shadow-[1px_1px_0_#07090E]">
                        {line.countryName.toUpperCase()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recessed Amber/Phosphor Pixel CRT Intercom Monitor */}
          <div
            style={{
              boxShadow: [
                'inset 3px 3px 0 0 #040508',
                'inset -2px -2px 0 0 #374151',
                '0 0 0 2px #07090E',
              ].join(', '),
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 2px, transparent 2px, transparent 4px)',
            }}
            className="bg-[#080D0B] p-4 min-h-[158px] flex flex-col justify-between gap-4"
          >
            {callPhase === 'ending' ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#3B1717] pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PixelFlag15x10 flag="usa" className="w-8 h-[22px]" />
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-bold tracking-wider uppercase text-[#FCA5A5] truncate">
                        Oval Office · Executive Line
                      </div>
                      <div className="text-[10px] font-mono text-[#FBBF24]">
                        {activeLine ? `CLOSING ${activeLine.extLabel}` : 'CLOSING SWITCHBOARD'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 bg-[#130606] px-2.5 py-1 border border-[#7F1D1D]">
                    <div className="flex items-end gap-1" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((bar) => {
                        const active = (meterTick + bar) % 2 === 0;
                        return (
                          <span
                            key={bar}
                            className="w-1.5 block"
                            style={{
                              height: `${5 + bar * 2}px`,
                              backgroundColor: active ? '#F87171' : '#3B1717',
                            }}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#F87171]">
                      ENDING
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex items-center">
                  <p className="text-sm sm:text-[15px] font-mono text-[#FEF2F2] leading-relaxed">
                    {endingClipText ?? '"Alright, tremendous talking to you, believe me."'}
                  </p>
                </div>
              </>
            ) : !activeLine ? (
              <div className="flex items-center gap-4 my-auto py-2">
                <div className="w-12 h-12 shrink-0 bg-[#0F1714] border-2 border-[#1F3329] flex items-center justify-center">
                  <PixelRedPhoneSprite className="w-9 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold tracking-[0.12em] uppercase text-[#FACC15]">
                    SWITCHBOARD STANDBY
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-[#A7F3D0]">
                    Press any country switch above to dial their leader on the secure line.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Monitor Top Telemetry Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#162820] pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PixelFlag15x10 flag={activeLine.flag} className="w-8 h-[22px]" />
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-bold tracking-wider uppercase text-[#FEF08A] truncate">
                        {activeLine.presidentTitle}
                      </div>
                      <div className="text-[10px] font-mono text-[#6EE7B7]">
                        {activeLine.extLabel} · LINE {activeLine.dialCode}
                      </div>
                    </div>
                  </div>

                  {/* Crisp Pixel Signal Equalizer + Phase Badge */}
                  <div className="flex items-center gap-2 shrink-0 bg-[#040706] px-2.5 py-1 border border-[#1E3A2F]">
                    <div className="flex items-end gap-1" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((bar) => {
                        const active =
                          callPhase === 'connected'
                            ? (meterTick + bar) % 3 !== 0
                            : bar <= meterTick % 5;
                        const barHex =
                          callPhase === 'connected' ? '#4ADE80' : '#FACC15';
                        return (
                          <span
                            key={bar}
                            className="w-1.5 block"
                            style={{
                              height: `${5 + bar * 2}px`,
                              backgroundColor: active ? barHex : '#1A2420',
                            }}
                          />
                        );
                      })}
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
                        callPhase === 'connected' ? 'text-[#4ADE80]' : 'text-[#FACC15]'
                      }`}
                    >
                      {callPhase === 'connected' ? 'ON AIR' : callPhase}
                    </span>
                  </div>
                </div>

                {/* Main Voice Transcript Area */}
                <div className="flex-1 flex items-center">
                  {callPhase === 'dialing' && (
                    <p className="text-sm font-mono text-[#FDE047]">
                      &gt; DIALING {activeLine.countryName.toUpperCase()} ({activeLine.dialCode})...
                    </p>
                  )}

                  {callPhase === 'ringing' && (
                    <p className="text-sm font-mono text-[#FBBF24]">
                      &gt; RINGING {activeLine.presidentTitle.toUpperCase()}...
                    </p>
                  )}

                  {callPhase === 'connected' && (
                    <p className="text-sm sm:text-[15px] font-mono text-[#ECFDF5] leading-relaxed">
                      {activeLine.greetingLine}
                    </p>
                  )}
                </div>

                {/* Console Footer Actions (Redial + Post to Twittly, NO Replay Voice) */}
                {callPhase === 'connected' && (
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t-2 border-[#162820]">
                    <button
                      type="button"
                      onClick={() => startCallToCountry(activeLine)}
                      style={{
                        boxShadow: [
                          'inset 2px 2px 0 0 #EBC14B',
                          'inset -2px -2px 0 0 #8F6118',
                          '0 0 0 2px #07090E',
                        ].join(', '),
                      }}
                      className="px-3 py-1.5 bg-[#C88F2A] hover:bg-[#D9A13B] active:translate-y-[1px] text-[#090D16] text-[11px] font-mono font-bold tracking-wider uppercase whitespace-nowrap cursor-pointer"
                    >
                      Redial Line
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onPostToTwittly({
                          content: activeLine.postContent,
                          tag: activeLine.postTag,
                          author: 'Executive Desk',
                          handle: '@POTUS',
                          avatarColor: '#B91C1C',
                        });
                        setPostedForId(activeLine.id);
                      }}
                      style={{
                        boxShadow: [
                          'inset 2px 2px 0 0 #7DD3FC',
                          'inset -2px -2px 0 0 #0369A1',
                          '0 0 0 2px #07090E',
                        ].join(', '),
                      }}
                      className="px-3.5 py-1.5 bg-[#1DA1F2] hover:bg-[#38BDF8] active:translate-y-[1px] text-white text-[11px] font-mono font-bold tracking-wider uppercase whitespace-nowrap cursor-pointer"
                    >
                      {postedForId === activeLine.id
                        ? 'Posted to Twittly!'
                        : 'Post Call to Twittly'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
