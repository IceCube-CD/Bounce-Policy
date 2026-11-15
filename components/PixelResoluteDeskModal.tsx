import React, { useState, useRef, useEffect, useCallback } from 'react';
import deskPulledBackUrl from '../assets/images/resolute_desk_closeup.jpg';
import { CHARACTERISTIC_META } from '../data/defaultBills';
import {
  NationCharacteristics,
  PolicyBill,
  SignedBillRecord,
  VetoedBillRecord,
} from '../types/engine';
import { speakVoiceline } from '../utils/voicePlayer';

interface PixelResoluteDeskModalProps {
  bills: PolicyBill[];
  dailyBillIds?: string[];
  currentDay?: number;
  signedBills: Record<string, SignedBillRecord>;
  vetoedBills?: Record<string, VetoedBillRecord>;
  characteristics: NationCharacteristics;
  onSignBill: (bill: PolicyBill, signatureDataUrl: string) => void;
  onVetoBill: (bill: PolicyBill) => void;
  onResetDeskBills?: () => void;
  onClose: () => void;
}

const TRUMP_SIGN_BILL_CLIPS: { audioUrl: string; text: string }[] = [
  {
    audioUrl: './audio/potus_sign_bill_1.mp3',
    text: 'This is the greatest bill ever signed, nobody does it better.',
  },
  {
    audioUrl: './audio/potus_sign_bill_2.mp3',
    text: 'Absolutely incredible, everybody loves this bill, believe me.',
  },
  {
    audioUrl: './audio/potus_sign_bill_3.mp3',
    text: 'Beautiful, beautiful, what a tremendous bill.',
  },
];

const TRUMP_VETO_BILL_CLIPS: { audioUrl: string; text: string }[] = [
  {
    audioUrl: './audio/potus_veto_bill_1.mp3',
    text: "It's a disgrace, a total disgrace.",
  },
  {
    audioUrl: './audio/potus_veto_bill_2.mp3',
    text: "This bill is a disaster. You're all fired.",
  },
  {
    audioUrl: './audio/potus_veto_bill_3.mp3',
    text: "I'm not signing this, even my enemies have better ideas.",
  },
];

const LOGICAL_W = 240;
const LOGICAL_H = 56;

// 22x14 Pixel Great Seal / American Eagle Crest
const EAGLE_CREST_GRID = [
  '.........oooo.........',
  '.......ooyyyyo........',
  '..oooo.ooyggyo.oooo...',
  '.oggggooygbbgyoggggo..',
  'oggbbgggygBBgyggbbggo.',
  'ogbggbggyBssByggbggbo.',
  '.ooggbggykBBkyggbgoo..',
  '...oogggyksskyggoo....',
  '....oogyykkkkgyoo.....',
  '.....ooygggggyoo......',
  '....ooggoyyyoggoo.....',
  '...ooyyoo...ooyyoo....',
  '......................',
  '......................',
];

const CREST_PALETTE: Record<string, string> = {
  '.': 'transparent',
  o: '#291F16',
  y: '#EAB308',
  g: '#B45309',
  b: '#78350F',
  B: '#1E3A8A',
  s: '#F8FAFC',
  k: '#991B1B',
};

// 18x18 Pixel Crimson Wax Presidential Seal
const WAX_SEAL_GRID = [
  '......oooooo......',
  '....ookkkkkkoo....',
  '...okkkrrrrkkko...',
  '..okkrrgggggrrko..',
  '.okkrrggyyygggrko.',
  '.okrrggyyyyyggRko.',
  'okkrgyyybbbyygrkko',
  'okkrgyybssbyygrkko',
  'okkrgyybssbyygrkko',
  'okkrgyyybbbyygrkko',
  '.okrrggyyyyyggrko.',
  '.okkrrggyyygggrko.',
  '..okkrrgggggrrko..',
  '...okkkrrrrkkko...',
  '....ookkkkkkoo....',
  '.....okko.okko....',
  '....okko...okko...',
  '....ooo.....ooo...',
];

const WAX_PALETTE: Record<string, string> = {
  '.': 'transparent',
  o: '#3B0D0D',
  k: '#7F1D1D',
  r: '#B91C1C',
  R: '#DC2626',
  g: '#F59E0B',
  y: '#FEF08A',
  b: '#92400E',
  s: '#F8FAFC',
};

// 16x16 Top-Down Pixel Brass Presidential Seal Stamp
function PixelSealStamp({ ready }: { ready: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={`w-full h-full transition-transform duration-100 ${
        ready ? 'group-hover:scale-105 group-active:scale-95' : 'opacity-80'
      }`}
      aria-hidden="true"
    >
      <rect x={4} y={1} width={8} height={1} fill="#2B1F16" />
      <rect x={2} y={2} width={2} height={1} fill="#2B1F16" />
      <rect x={12} y={2} width={2} height={1} fill="#2B1F16" />
      <rect x={1} y={4} width={1} height={8} fill="#2B1F16" />
      <rect x={14} y={4} width={1} height={8} fill="#2B1F16" />
      <rect x={2} y={13} width={2} height={1} fill="#2B1F16" />
      <rect x={12} y={13} width={2} height={1} fill="#2B1F16" />
      <rect x={4} y={14} width={8} height={1} fill="#2B1F16" />
      <rect x={3} y={2} width={10} height={12} fill="#B45309" />
      <rect x={2} y={4} width={12} height={8} fill="#B45309" />
      <rect x={4} y={3} width={8} height={10} fill="#EAB308" />
      <rect x={3} y={4} width={10} height={8} fill="#EAB308" />
      <rect x={5} y={5} width={6} height={6} fill="#2B1F16" />
      <rect x={6} y={6} width={4} height={4} fill={ready ? '#B91C1C' : '#78350F'} />
      <rect x={6} y={6} width={2} height={2} fill={ready ? '#EF4444' : '#92400E'} />
    </svg>
  );
}

// Tiny Pixel Gum Eraser
function PixelGumEraser() {
  return (
    <svg viewBox="0 0 12 8" shapeRendering="crispEdges" className="w-full h-full" aria-hidden="true">
      <rect x={0} y={1} width={12} height={6} fill="#2B1F16" />
      <rect x={1} y={2} width={7} height={4} fill="#F472B6" />
      <rect x={1} y={2} width={7} height={1} fill="#FBCFE8" />
      <rect x={8} y={2} width={3} height={4} fill="#38BDF8" />
      <rect x={8} y={2} width={3} height={1} fill="#BAE6FD" />
    </svg>
  );
}

// High-Fidelity 32-Bit Pixel Wooden Archive Tray on the Desk for Signed Bills
function PixelArchiveTraySvg({ signedCount }: { signedCount: number }) {
  const sheetCount = Math.min(4, signedCount);
  return (
    <svg
      viewBox="0 0 88 54"
      shapeRendering="crispEdges"
      className="w-full h-full block"
      aria-hidden="true"
    >
      {/* Drop Shadow on Desk Wood */}
      <rect x={4} y={6} width={82} height={46} fill="rgba(12, 5, 2, 0.55)" />

      {/* Outer Dark Pixel Outline */}
      <rect x={2} y={2} width={82} height={48} fill="#160B05" />

      {/* Mahogany Outer Box Rim */}
      <rect x={3} y={3} width={80} height={46} fill="#6B3416" />
      <rect x={3} y={3} width={80} height={2} fill="#9A5226" />
      <rect x={3} y={3} width={2} height={46} fill="#85431D" />
      <rect x={3} y={47} width={80} height={2} fill="#3D1C0A" />

      {/* Brass Corner Brackets */}
      <rect x={3} y={3} width={6} height={6} fill="#D97706" />
      <rect x={4} y={4} width={3} height={3} fill="#FACC15" />
      <rect x={77} y={3} width={6} height={6} fill="#D97706" />
      <rect x={79} y={4} width={3} height={3} fill="#FACC15" />
      <rect x={3} y={43} width={6} height={6} fill="#B45309" />
      <rect x={4} y={45} width={3} height={3} fill="#FACC15" />
      <rect x={77} y={43} width={6} height={6} fill="#B45309" />
      <rect x={79} y={45} width={3} height={3} fill="#FACC15" />

      {/* Inner Recessed Green Baize / Dark Wood Tray Cavity */}
      <rect x={7} y={7} width={72} height={34} fill="#140A05" />
      <rect x={8} y={8} width={70} height={32} fill="#1D2E22" />
      <rect x={8} y={8} width={70} height={2} fill="#121E16" />
      <rect x={8} y={8} width={2} height={32} fill="#121E16" />

      {/* Empty Tray Slot Lines if 0 Signed */}
      {sheetCount === 0 && (
        <g opacity={0.45}>
          <rect x={16} y={16} width={54} height={1} fill="#344E3B" />
          <rect x={16} y={23} width={54} height={1} fill="#344E3B" />
          <rect x={16} y={30} width={54} height={1} fill="#344E3B" />
        </g>
      )}

      {/* Stacked Signed Pixel Parchment Sheets inside the Archive Box */}
      {Array.from({ length: sheetCount }).map((_, idx) => {
        const ox = 13 + idx * 4;
        const oy = 11 + (sheetCount - 1 - idx) * 2;
        return (
          <g key={idx}>
            <rect x={ox - 1} y={oy - 1} width={52} height={25} fill="#23170E" />
            <rect x={ox} y={oy} width={50} height={23} fill="#F5EBD4" />
            <rect x={ox} y={oy} width={50} height={2} fill="#FDFBF5" />
            {/* Tiny Gold Header & Ribbon */}
            <rect x={ox + 4} y={oy + 3} width={14} height={2} fill="#78350F" />
            <rect x={ox + 40} y={oy + 3} width={6} height={2} fill="#B91C1C" />
            {/* Tiny Printed Clauses */}
            <rect x={ox + 4} y={oy + 8} width={38} height={1} fill="#8C765A" />
            <rect x={ox + 4} y={oy + 11} width={34} height={1} fill="#8C765A" />
            <rect x={ox + 4} y={oy + 14} width={28} height={1} fill="#8C765A" />
            {/* Tiny Blue Ink Signature Squiggle */}
            <rect x={ox + 6} y={oy + 18} width={12} height={1} fill="#1E3A8A" />
            <rect x={ox + 9} y={oy + 17} width={6} height={1} fill="#1E3A8A" />
            {/* Tiny Crimson Wax Seal */}
            <rect x={ox + 39} y={oy + 15} width={6} height={6} fill="#7F1D1D" />
            <rect x={ox + 40} y={oy + 16} width={4} height={4} fill="#DC2626" />
            <rect x={ox + 41} y={oy + 17} width={2} height={2} fill="#FACC15" />
          </g>
        );
      })}

      {/* Front Brass Nameplate Bar on Lower Rim */}
      <rect x={17} y={41} width={52} height={7} fill="#1E1108" />
      <rect x={18} y={42} width={50} height={5} fill="#D97706" />
      <rect x={18} y={42} width={50} height={1} fill="#FEF08A" />
      <rect x={20} y={44} width={2} height={1} fill="#451A03" />
      <rect x={64} y={44} width={2} height={1} fill="#451A03" />
    </svg>
  );
}

function PixelSpriteGrid({
  grid,
  palette,
  className,
}: {
  grid: string[];
  palette: Record<string, string>;
  className: string;
}) {
  const height = grid.length;
  const width = grid[0]?.length || 1;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {grid.map((row, y) =>
        row.split('').map((cell, x) => {
          const fill = palette[cell];
          if (!fill || fill === 'transparent') return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

export const PixelResoluteDeskModal: React.FC<PixelResoluteDeskModalProps> = ({
  bills,
  dailyBillIds,
  currentDay = 1,
  signedBills,
  vetoedBills = {},
  characteristics,
  onSignBill,
  onVetoBill,
  onResetDeskBills,
  onClose,
}) => {
  const deskBills = bills.filter((b) => b.activeOnDesk !== false);
  const visibleBills = deskBills.length > 0 ? deskBills : bills;

  // Separate bills into today's Unsigned Queue (3-4 daily bills), Signed Archive (all days), and Vetoed count
  const dailySet = dailyBillIds && dailyBillIds.length > 0 ? new Set(dailyBillIds) : null;
  const unsignedBills = visibleBills.filter(
    (b) => !signedBills[b.id] && !vetoedBills[b.id] && (!dailySet || dailySet.has(b.id))
  );
  const totalRemainingUnhandled = visibleBills.filter(
    (b) => !signedBills[b.id] && !vetoedBills[b.id]
  ).length;
  const signedBillsList = visibleBills.filter((b) => Boolean(signedBills[b.id]));
  const vetoedBillsCount = visibleBills.filter((b) => Boolean(vetoedBills[b.id])).length;

  const [selectedBillId, setSelectedBillId] = useState<string>(
    () => unsignedBills[0]?.id || ''
  );
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  const [hasInk, setHasInk] = useState<boolean>(false);
  const [nudgeSignHint, setNudgeSignHint] = useState<boolean>(false);
  const [throwingBillId, setThrowingBillId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastScratchAtRef = useRef<number>(0);
  const advanceTimerRef = useRef<number | null>(null);
  const vetoTimerRef = useRef<number | null>(null);
  const throwSoundTimerRef = useRef<number | null>(null);
  const pendingVetoRef = useRef<{ bill: PolicyBill; nextId: string } | null>(null);
  const lastVetoClipIdxRef = useRef<number>(-1);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const activeBill =
    (selectedBillId &&
      visibleBills.find(
        (b) =>
          b.id === selectedBillId &&
          !vetoedBills[b.id] &&
          (Boolean(signedBills[b.id]) || !dailySet || dailySet.has(b.id))
      )) ||
    unsignedBills[0] ||
    null;
  const activeBillId = activeBill?.id || '';
  const signedRecord = activeBill ? signedBills[activeBill.id] : undefined;
  const isThrowingActiveBill = Boolean(activeBill && throwingBillId === activeBill.id);
  const nextUnsignedAfterActive = activeBill
    ? unsignedBills.find((b) => b.id !== activeBill.id) || null
    : null;

  const getAudioCtx = useCallback((): AudioContext | null => {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new Ctor();
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const playPaperRustle = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.075);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.09);
  }, [getAudioCtx]);

  const playPenScratch = useCallback(() => {
    const perfNow = performance.now();
    if (perfNow - lastScratchAtRef.current < 55) return;
    lastScratchAtRef.current = perfNow;

    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920 + Math.random() * 260, now);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.03);
  }, [getAudioCtx]);

  const playStampThud = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.22, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    thudGain.connect(ctx.destination);

    const thudOsc = ctx.createOscillator();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(165, now);
    thudOsc.frequency.exponentialRampToValueAtTime(48, now + 0.12);
    thudOsc.connect(thudGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.15);

    const sealStart = now + 0.06;
    const sealGain = ctx.createGain();
    sealGain.gain.setValueAtTime(0.0001, sealStart);
    sealGain.gain.linearRampToValueAtTime(0.06, sealStart + 0.015);
    sealGain.gain.exponentialRampToValueAtTime(0.0001, sealStart + 0.22);
    sealGain.connect(ctx.destination);

    const sealOsc = ctx.createOscillator();
    sealOsc.type = 'sine';
    sealOsc.frequency.setValueAtTime(523.25, sealStart);
    sealOsc.frequency.setValueAtTime(659.25, sealStart + 0.07);
    sealOsc.connect(sealGain);
    sealOsc.start(sealStart);
    sealOsc.stop(sealStart + 0.23);
  }, [getAudioCtx]);

  const playPaperThrowSound = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Snappy paper whoosh using filtered noise + downward flick
    const dur = 0.28;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1650, now);
    filter.frequency.exponentialRampToValueAtTime(340, now + dur);
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur);
  }, [getAudioCtx]);

  const clearSignaturePad = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    setNudgeSignHint(false);
  }, []);

  useEffect(() => {
    clearSignaturePad();
  }, [activeBillId, clearSignaturePad]);

  // Keep Escape listener active without resetting timers when parent App re-renders
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
      }
      if (vetoTimerRef.current !== null) {
        window.clearTimeout(vetoTimerRef.current);
      }
      if (throwSoundTimerRef.current !== null) {
        window.clearTimeout(throwSoundTimerRef.current);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  const getLogicalCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(LOGICAL_W - 1, Math.round(((e.clientX - rect.left) / rect.width) * LOGICAL_W))
    );
    const y = Math.max(
      0,
      Math.min(LOGICAL_H - 1, Math.round(((e.clientY - rect.top) / rect.height) * LOGICAL_H))
    );
    return { x, y };
  };

  const drawPixelLine = (x0: number, y0: number, x1: number, y1: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0F1E4A';

    let cx = x0;
    let cy = y0;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      ctx.fillRect(cx, cy, 2, 2);
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  };

  const handleSigPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeBill || signedRecord) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getLogicalCoords(e);
    isDrawingRef.current = true;
    lastPtRef.current = pt;
    drawPixelLine(pt.x, pt.y, pt.x, pt.y);
    setHasInk(true);
    setNudgeSignHint(false);
    playPenScratch();
  };

  const handleSigPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPtRef.current || signedRecord) return;
    const pt = getLogicalCoords(e);
    drawPixelLine(lastPtRef.current.x, lastPtRef.current.y, pt.x, pt.y);
    lastPtRef.current = pt;
    playPenScratch();
  };

  const handleSigPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPtRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore already-released capture
    }
  };

  const finalizePendingVeto = useCallback(() => {
    const pending = pendingVetoRef.current;
    if (!pending) return;
    pendingVetoRef.current = null;

    if (vetoTimerRef.current !== null) {
      window.clearTimeout(vetoTimerRef.current);
      vetoTimerRef.current = null;
    }

    setThrowingBillId(null);
    onVetoBill(pending.bill);
    if (pending.nextId) {
      playPaperRustle();
      setSelectedBillId(pending.nextId);
    } else {
      setSelectedBillId('');
    }
  }, [onVetoBill, playPaperRustle]);

  const handleStampDocument = () => {
    if (!activeBill || signedRecord || isThrowingActiveBill) return;
    if (!hasInk || !canvasRef.current) {
      setNudgeSignHint(true);
      return;
    }
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const justSignedId = activeBill.id;
    const nextUnsigned = unsignedBills.find((b) => b.id !== justSignedId);

    // Lock selection to this bill briefly so the player sees the crimson wax seal land
    setSelectedBillId(justSignedId);
    playStampThud();
    const randomClip =
      TRUMP_SIGN_BILL_CLIPS[Math.floor(Math.random() * TRUMP_SIGN_BILL_CLIPS.length)];
    if (randomClip) {
      speakVoiceline(randomClip.text, 'narrator', randomClip.audioUrl);
    }
    onSignBill(activeBill, dataUrl);

    // After showing the crimson wax seal land briefly, file it into the Archive Box & pull the next unsigned bill!
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
    }
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null;
      playPaperRustle();
      setSelectedBillId(nextUnsigned ? nextUnsigned.id : '');
    }, 650);
  };

  const handleVetoAndThrow = () => {
    if (!activeBill || signedRecord || throwingBillId) return;

    const billToVeto = activeBill;
    const nextUnsigned = unsignedBills.find((b) => b.id !== billToVeto.id);

    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    pendingVetoRef.current = {
      bill: billToVeto,
      nextId: nextUnsigned ? nextUnsigned.id : '',
    };

    setSelectedBillId(billToVeto.id);
    setThrowingBillId(billToVeto.id);
    setNudgeSignHint(false);
    playStampThud();

    if (throwSoundTimerRef.current !== null) {
      window.clearTimeout(throwSoundTimerRef.current);
    }
    throwSoundTimerRef.current = window.setTimeout(() => {
      throwSoundTimerRef.current = null;
      playPaperThrowSound();
    }, 90);

    // Pick a random veto voiceline (avoiding repeating the exact same one back-to-back)
    let pickIdx = Math.floor(Math.random() * TRUMP_VETO_BILL_CLIPS.length);
    if (TRUMP_VETO_BILL_CLIPS.length > 1 && pickIdx === lastVetoClipIdxRef.current) {
      pickIdx =
        (pickIdx + 1 + Math.floor(Math.random() * (TRUMP_VETO_BILL_CLIPS.length - 1))) %
        TRUMP_VETO_BILL_CLIPS.length;
    }
    lastVetoClipIdxRef.current = pickIdx;
    const randomVetoClip = TRUMP_VETO_BILL_CLIPS[pickIdx];
    if (randomVetoClip) {
      speakVoiceline(randomVetoClip.text, 'narrator', randomVetoClip.audioUrl);
    }

    if (vetoTimerRef.current !== null) {
      window.clearTimeout(vetoTimerRef.current);
    }
    vetoTimerRef.current = window.setTimeout(() => {
      finalizePendingVeto();
    }, 520);
  };

  return (
    <div
      style={{ imageRendering: 'pixelated' }}
      className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-[#1D0F08] select-none"
      onClick={onClose}
    >
      {/* Full-Screen Pulled-Back Crisp Pixel Resolute Desk */}
      <img
        src={deskPulledBackUrl}
        alt="Top-down view of the Resolute Executive Desk"
        draggable={false}
        referrerPolicy="no-referrer"
        style={{ imageRendering: 'pixelated' }}
        className="absolute inset-0 w-full h-full object-cover pixelated block pointer-events-none"
      />

      {/* Desk surface click-blocker so clicking the wood around papers doesn't accidentally exit */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsArchiveOpen(false);
        }}
        className="absolute left-[18%] top-[18%] w-[64%] h-[64%]"
      />

      {/* Subtle Diegetic Escape Keycap at Bottom-Right Floor Corner */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Step away from desk (Esc)"
        aria-label="Step away from desk"
        style={{
          boxShadow:
            'inset 1px 1px 0 0 #E5C896, inset -1px -1px 0 0 #4A2511, 0 0 0 2px #140B06',
        }}
        className="absolute bottom-3 right-3 z-30 px-2.5 py-1 bg-[#7A421D]/90 hover:bg-[#945124] text-[#FEF3C7] text-[10px] font-mono font-bold tracking-widest uppercase opacity-80 hover:opacity-100 cursor-pointer transition-opacity"
      >
        ESC
      </button>

      {/* CIRCLE 1 (UPPER-LEFT DESK BELOW BOOKS): High-Fidelity Pixel Signed Bills Archive Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute left-[19.5%] sm:left-[21.5%] top-[34%] w-[16%] sm:w-[12.5%] z-30"
      >
        <button
          type="button"
          onClick={() => {
            playPaperRustle();
            setIsArchiveOpen((prev) => !prev);
          }}
          title="Signed Bills Archive Box — Click to inspect signed bills"
          className="group relative w-full cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 block"
        >
          <PixelArchiveTraySvg signedCount={signedBillsList.length} />

          {/* Crisp Brass Archive Label & Signed Counter Badge */}
          <div
            style={{
              boxShadow:
                'inset 1px 1px 0 0 #FDE68A, inset -1px -1px 0 0 #78350F, 0 2px 0 0 #140A05',
            }}
            className="mt-0.5 px-1.5 py-0.5 bg-[#92400E] border border-[#1E1108] flex items-center justify-between gap-1"
          >
            <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-wider uppercase text-[#FEF3C7] truncate">
              ARCHIVE BOX
            </span>
            <span className="px-1 bg-[#140A05] text-[#FACC15] text-[8px] sm:text-[9px] font-mono font-bold">
              {signedBillsList.length}
            </span>
          </div>
        </button>

        {/* Signed Bills Archive Drawer Popover (when Archive Box is clicked) */}
        {isArchiveOpen && (
          <div
            style={{
              boxShadow:
                'inset 2px 2px 0 0 #9A5226, inset -2px -2px 0 0 #2B1306, 0 0 0 2px #120804, 0 12px 24px rgba(0,0,0,0.75)',
            }}
            className="mt-1.5 w-[210px] sm:w-[235px] bg-[#3B1C0B] p-2 space-y-1.5 z-40"
          >
            <div className="flex items-center justify-between border-b border-[#78350F] pb-1">
              <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#FDE68A]">
                SIGNED ARCHIVE ({signedBillsList.length})
              </span>
              <button
                type="button"
                onClick={() => setIsArchiveOpen(false)}
                className="text-[9px] font-mono font-bold text-[#FDBA74] hover:text-white px-1 cursor-pointer"
              >
                [X]
              </button>
            </div>

            {signedBillsList.length === 0 ? (
              <div className="py-2 text-[9px] font-mono text-[#D6C7AA] text-center">
                No signed bills archived yet. Sign &amp; stamp a bill on the desk!
              </div>
            ) : (
              <div className="space-y-1 max-h-[165px] overflow-y-auto pr-0.5">
                {signedBillsList.map((bill) => {
                  const isCurrent = activeBill?.id === bill.id;
                  return (
                    <button
                      key={bill.id}
                      type="button"
                      onClick={() => {
                        playPaperRustle();
                        setSelectedBillId(bill.id);
                        setIsArchiveOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-[#78350F] border-[#FACC15] text-[#FEF9C3]'
                          : 'bg-[#241006] hover:bg-[#52260F] border-[#5C2D12] text-[#F5EBD4]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[8px] font-mono font-bold text-[#FACC15] uppercase">
                          {bill.code} · SIGNED
                        </div>
                        <div className="text-[10px] font-serif font-bold truncate">
                          {bill.title}
                        </div>
                      </div>
                      <PixelSpriteGrid
                        grid={WAX_SEAL_GRID}
                        palette={WAX_PALETTE}
                        className="w-4 h-4 shrink-0"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CIRCLE 2 (LOWER-LEFT OF DESK): Fanned Stack of UNSIGNED Bills (New ones automatically take the place of signed ones!) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute left-[14%] sm:left-[21%] bottom-[21%] top-[50%] w-[26%] sm:w-[19%] pointer-events-none"
      >
        {unsignedBills.length > 0 ? (
          unsignedBills.slice(0, 4).map((bill, idx) => {
            const isSelected = activeBill?.id === bill.id;
            const leftOffset = idx * 14;
            const rotateDeg = idx === 0 ? -5.5 : idx === 1 ? -1.5 : idx === 2 ? 2.5 : 6;

            return (
              <button
                key={bill.id}
                type="button"
                onClick={() => {
                  if (throwingBillId) return;
                  if (bill.id !== activeBillId) {
                    playPaperRustle();
                  }
                  setSelectedBillId(bill.id);
                  setIsArchiveOpen(false);
                }}
                aria-label={`${bill.code}: ${bill.title}`}
                style={{
                  left: `${leftOffset}%`,
                  zIndex: isSelected ? 22 : 10 + idx,
                  transform: `rotate(${rotateDeg}deg) ${
                    isSelected ? 'translateY(-12px) scale(1.03)' : ''
                  }`,
                  background: 'linear-gradient(160deg, #FCF9F0 0%, #F4ECD7 75%, #EAE0C8 100%)',
                  border: isSelected ? '1px solid #B45309' : '1px solid #C2B295',
                  boxShadow: isSelected
                    ? '0 0 0 2px #FACC15, 0 10px 20px rgba(15, 7, 3, 0.55), 0 2px 4px rgba(15, 7, 3, 0.35)'
                    : '0 6px 14px rgba(15, 7, 3, 0.45), 0 1px 3px rgba(15, 7, 3, 0.3)',
                }}
                className="pointer-events-auto absolute bottom-0 w-[64%] aspect-[8.5/11] hover:-translate-y-2 p-2.5 sm:p-3 text-left transition-transform duration-150 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Colored ink stamp stripe at top corner */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1 border-b border-[#D6C7AA] pb-0.5">
                    <span className="text-[8px] sm:text-[9px] font-serif font-bold tracking-wider uppercase text-[#5C4630] truncate">
                      {bill.code}
                    </span>
                    <span
                      className="w-2.5 h-1 shrink-0"
                      style={{ backgroundColor: bill.ribbonColor }}
                    />
                  </div>
                  <div className="text-[9px] sm:text-[11px] font-serif font-bold text-[#221A12] leading-tight line-clamp-3">
                    {bill.title}
                  </div>
                </div>

                {/* Realistic paper print micro-lines + Pending Badge */}
                <div className="space-y-1">
                  <div className="space-y-1 opacity-30" aria-hidden="true">
                    <div className="h-[1.5px] w-full bg-[#5C4630]" />
                    <div className="h-[1.5px] w-11/12 bg-[#5C4630]" />
                    <div className="h-[1.5px] w-4/5 bg-[#5C4630]" />
                    <div className="h-[1.5px] w-full bg-[#5C4630]" />
                  </div>
                  <div className="text-[7px] sm:text-[8px] font-mono font-bold tracking-wider uppercase text-[#92400E] pt-0.5">
                    UNSIGNED
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div
            style={{
              boxShadow: 'inset 1px 1px 0 0 #78350F, 0 0 0 2px #1A0C05',
            }}
            className="pointer-events-auto absolute bottom-2 left-0 w-[85%] bg-[#2C1509]/90 p-2.5 text-center space-y-1"
          >
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#FACC15]">
              DAY {currentDay} QUEUE CLEAR
            </div>
            <div className="text-[8px] font-mono text-[#E7DCC2] leading-snug">
              {totalRemainingUnhandled > 0
                ? `Today's batch complete! Sleep in the Hallway Bedroom for tomorrow's 3–4 bills.`
                : vetoedBillsCount > 0
                  ? `${signedBillsList.length} signed & ${vetoedBillsCount} vetoed off the desk.`
                  : 'All active bills are signed & filed in the Archive Box above.'}
            </div>
          </div>
        )}
      </div>

      {/* CIRCLE 3 (BOTTOM-LEFT SIDE PANEL): High-Fidelity Pixel Policy Impact & Characteristics Panel */}
      {activeBill && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow:
              'inset 2px 2px 0 0 #854D0E, inset -2px -2px 0 0 #291507, 0 0 0 3px #120904, 0 12px 28px rgba(0, 0, 0, 0.75)',
          }}
          className="absolute left-3 sm:left-4 bottom-3 sm:bottom-4 z-30 w-[205px] sm:w-[248px] bg-[#1F1209]/95 p-2.5 sm:p-3 space-y-2"
        >
          {/* Brass Riveted Header */}
          <div className="flex items-center justify-between gap-2 border-b-2 border-[#5C3415] pb-1.5">
            <div className="min-w-0">
              <div className="text-[8px] font-mono font-bold tracking-[0.18em] uppercase text-[#FACC15]">
                BILL IMPACT · {activeBill.code}
              </div>
              <div className="text-[10px] sm:text-[11px] font-serif font-bold text-[#FEF3C7] truncate">
                {activeBill.title}
              </div>
            </div>
            <span
              className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase shrink-0 border ${
                signedRecord
                  ? 'bg-[#7F1D1D] border-[#EF4444] text-[#FEE2E2]'
                  : 'bg-[#14532D] border-[#4ADE80] text-[#DCFCE7]'
              }`}
            >
              {signedRecord ? 'SIGNED' : 'PREVIEW'}
            </span>
          </div>

          {/* 5 Nation Characteristics with Rise / Lower Delta Bars & Badges */}
          <div className="space-y-1.5">
            {CHARACTERISTIC_META.map((meta) => {
              const currentVal = characteristics[meta.key] ?? 50;
              const delta = activeBill.effects[meta.key] ?? 0;
              const isPositive = delta > 0;
              const isNegative = delta < 0;

              // If not yet signed, preview how much this bill will raise or lower the current bar
              const projectedVal = signedRecord
                ? currentVal
                : Math.max(0, Math.min(100, currentVal + delta));

              return (
                <div key={meta.key} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono">
                    <span className="text-[#E7DCC2] font-bold tracking-tight">
                      {meta.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[#A89984]">{currentVal}%</span>
                      <span
                        className={`px-1 py-0.2 text-[9px] font-mono font-bold min-w-[42px] text-right border ${
                          isPositive
                            ? 'bg-[#052E16] border-[#22C55E] text-[#4ADE80]'
                            : isNegative
                              ? 'bg-[#450A0A] border-[#EF4444] text-[#F87171]'
                              : 'bg-[#1C1917] border-[#44403C] text-[#78716C]'
                        }`}
                      >
                        {isPositive
                          ? `▲ +${delta}`
                          : isNegative
                            ? `▼ ${delta}`
                            : '— 0'}
                      </span>
                    </div>
                  </div>

                  {/* Segmented Pixel Bar with Delta Highlight */}
                  <div className="relative h-2 w-full bg-[#0C0704] border border-[#442811] overflow-hidden">
                    {/* Base Value Bar */}
                    <div
                      style={{
                        width: `${ signedRecord ? currentVal : Math.min(currentVal, projectedVal) }%`,
                        backgroundColor: meta.barColor,
                      }}
                      className="h-full transition-all duration-200"
                    />
                    {/* Delta Rise/Lower Preview Segment when unsigned */}
                    {!signedRecord && delta !== 0 && (
                      <div
                        style={{
                          left: `${Math.min(currentVal, projectedVal)}%`,
                          width: `${Math.abs(projectedVal - currentVal)}%`,
                          backgroundColor: isPositive ? '#4ADE80' : '#EF4444',
                        }}
                        className="absolute top-0 bottom-0 opacity-85"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CENTER-RIGHT OF DESK: Realistic Tall Portrait American Paper Stack & Active Bill */}
      {activeBill ? (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center pl-[18%] sm:pl-[14%] pr-[5%]"
        >
          <style>{`
            @keyframes vetoBillThrow {
              0% {
                transform: translate(0%, 0%) rotate(0deg) scale(1);
                opacity: 1;
              }
              18% {
                transform: translate(0%, 2%) rotate(-2deg) scale(0.97);
                opacity: 1;
              }
              100% {
                transform: translate(135%, -85%) rotate(38deg) scale(0.68);
                opacity: 0;
              }
            }
          `}</style>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsArchiveOpen(false);
            }}
            style={{
              height: 'min(82vh, 84%)',
              aspectRatio: '8.5 / 11',
            }}
            className="pointer-events-auto relative max-w-[92%]"
          >
            {/* Next unsigned bill waiting underneath in the stack (visible as top bill is thrown) */}
            {!signedRecord && nextUnsignedAfterActive && (
              <div
                aria-hidden="true"
                style={{
                  background: 'linear-gradient(168deg, #FDFBF5 0%, #F7F1E1 62%, #EFE5CE 100%)',
                  border: '1px solid #C2B295',
                  boxShadow: '0 8px 18px rgba(16, 8, 3, 0.35)',
                  transform: 'rotate(0.8deg) translate(3px, 2px)',
                  padding: 'clamp(14px, 3.2vh, 28px) clamp(18px, 3.8vh, 36px)',
                }}
                className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden opacity-95"
              >
                <div className="flex flex-col items-center text-center border-b border-[#5C4A36]/50 pb-[1.5vh]">
                  <div className="text-[clamp(8px,1.2vh,11px)] font-serif tracking-[0.22em] uppercase text-[#5C4A36]">
                    119th Congress · United States of America
                  </div>
                  <PixelSpriteGrid
                    grid={EAGLE_CREST_GRID}
                    palette={CREST_PALETTE}
                    className="w-[clamp(34px,5.6vh,48px)] h-[clamp(22px,3.6vh,32px)] my-[0.5vh]"
                  />
                  <div className="text-[clamp(11px,1.7vh,15px)] font-serif font-bold tracking-[0.16em] uppercase text-[#1F1710]">
                    {nextUnsignedAfterActive.code}
                  </div>
                  <div className="text-[clamp(9px,1.3vh,11px)] font-serif font-semibold tracking-[0.2em] uppercase text-[#7C2D12]">
                    {nextUnsignedAfterActive.category}
                  </div>
                  <div className="w-20 border-t border-[#9B8669] my-[0.7vh]" />
                  <h3 className="text-[clamp(13px,2.2vh,20px)] font-serif font-bold text-[#140E0A] leading-snug max-w-[94%]">
                    {nextUnsignedAfterActive.title}
                  </h3>
                </div>
                <div className="flex-1 py-[1.4vh] space-y-[1.2vh] overflow-hidden opacity-80">
                  <p className="text-[clamp(10px,1.55vh,13.5px)] font-serif leading-relaxed text-[#261D14]">
                    {nextUnsignedAfterActive.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Top Active Realistic Tall Cotton-Parchment American Bill */}
            <div
              key={activeBill.id}
              onAnimationEnd={() => {
                if (isThrowingActiveBill) {
                  finalizePendingVeto();
                }
              }}
              style={{
                background:
                  'linear-gradient(168deg, #FDFBF5 0%, #F7F1E1 62%, #EFE5CE 100%)',
                backgroundImage: [
                  'linear-gradient(168deg, rgba(253,251,245,0.96) 0%, rgba(247,241,225,0.96) 62%, rgba(239,229,206,0.96) 100%)',
                  'repeating-linear-gradient(to bottom, transparent 0px, transparent 21px, rgba(120, 96, 68, 0.035) 22px)',
                ].join(', '),
                border: '1px solid #C6B597',
                boxShadow:
                  'inset 0 0 28px rgba(168, 140, 98, 0.14), 0 10px 24px rgba(15, 7, 3, 0.42), 0 2px 5px rgba(15, 7, 3, 0.25)',
                padding: 'clamp(14px, 3.2vh, 28px) clamp(18px, 3.8vh, 36px)',
                animation: isThrowingActiveBill
                  ? 'vetoBillThrow 500ms cubic-bezier(0.32, 0, 0.72, 0.22) forwards'
                  : undefined,
              }}
              className="relative w-full h-full text-[#1F1710] flex flex-col justify-between overflow-hidden"
            >
              {/* Bold Crimson VETOED Ink Stamp Overlay while throwing */}
              {isThrowingActiveBill && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
                >
                  <div
                    style={{
                      transform: 'rotate(-16deg)',
                      boxShadow: 'inset 0 0 0 3px #991B1B, 0 4px 0 rgba(127, 29, 29, 0.25)',
                    }}
                    className="px-6 py-2.5 border-4 border-[#B91C1C] bg-[#FEE2E2]/85 text-[#991B1B] font-mono font-black text-3xl sm:text-5xl tracking-[0.22em] uppercase"
                  >
                    VETOED
                  </div>
                </div>
              )}
              {/* Realistic Top-Right Paper Folded Corner */}
              <span
                aria-hidden="true"
                style={{
                  width: 'clamp(16px, 3vh, 26px)',
                  height: 'clamp(16px, 3vh, 26px)',
                  background:
                    'linear-gradient(225deg, #D5C4A1 48%, #B5A27F 50%, #F8F3E4 52%, #EAE0C8 100%)',
                  boxShadow: '-2px 2px 3px rgba(40, 26, 12, 0.16)',
                }}
                className="absolute top-0 right-0 pointer-events-none"
              />

              {/* Top: Authentic American Congressional / Presidential Heading */}
              <div className="flex flex-col items-center text-center border-b border-[#5C4A36]/60 pb-[1.5vh]">
                <div className="text-[clamp(8px,1.2vh,11px)] font-serif tracking-[0.22em] uppercase text-[#5C4A36]">
                  119th Congress · United States of America
                </div>

                <PixelSpriteGrid
                  grid={EAGLE_CREST_GRID}
                  palette={CREST_PALETTE}
                  className="w-[clamp(34px,5.6vh,48px)] h-[clamp(22px,3.6vh,32px)] my-[0.5vh]"
                />

                <div className="text-[clamp(11px,1.7vh,15px)] font-serif font-bold tracking-[0.16em] uppercase text-[#1F1710]">
                  {activeBill.code}
                </div>

                <div className="text-[clamp(9px,1.3vh,11px)] font-serif font-semibold tracking-[0.2em] uppercase text-[#7C2D12]">
                  {activeBill.category}
                </div>

                <div className="w-20 border-t border-[#9B8669] my-[0.7vh]" />

                <h3 className="text-[clamp(13px,2.2vh,20px)] font-serif font-bold text-[#140E0A] leading-snug max-w-[94%]">
                  {activeBill.title}
                </h3>
              </div>

              {/* Middle: Real Printed Federal Bill Body (Zero Scrollbar, Clean Fit) */}
              <div className="flex-1 flex flex-col justify-center py-[1.4vh] space-y-[1.4vh] overflow-hidden">
                <p className="text-[clamp(10px,1.55vh,13.5px)] font-serif leading-relaxed text-[#261D14]">
                  <span className="italic">
                    Be it enacted by the Senate and House of Representatives of the United
                    States of America in Congress assembled, and signed into order by the
                    President,
                  </span>{' '}
                  {activeBill.summary}
                </p>

                <div className="space-y-[1vh] text-[clamp(9.5px,1.45vh,12.5px)] font-serif leading-relaxed text-[#32261B]">
                  {activeBill.clauses.map((clause, idx) => (
                    <p key={idx} className="indent-4">
                      {clause}
                    </p>
                  ))}
                </div>
              </div>

              {/* Bottom: Authentic "Approved," Signature Line & Wax Seal */}
              <div className="border-t border-[#C8B899] pt-[1.4vh] flex items-end justify-between gap-3 shrink-0">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[clamp(10px,1.4vh,12px)] font-serif italic text-[#4A3B2B]">
                      Approved,
                    </span>
                    {!signedRecord && hasInk && (
                      <button
                        type="button"
                        onClick={clearSignaturePad}
                        title="Erase ink"
                        aria-label="Erase signature ink"
                        className="w-5 h-3.5 cursor-pointer hover:scale-110 transition-transform"
                      >
                        <PixelGumEraser />
                      </button>
                    )}
                  </div>

                  {/* Direct Paper Signature Line */}
                  <div className="relative border-b border-[#2D2218]">
                    <span className="absolute left-1 bottom-1.5 text-[clamp(11px,1.5vh,14px)] font-serif font-bold text-[#7A6347] pointer-events-none">
                      X
                    </span>

                    {signedRecord ? (
                      <img
                        src={signedRecord.signatureDataUrl}
                        alt="Presidential signature"
                        style={{ imageRendering: 'pixelated' }}
                        className="w-full h-[clamp(40px,6.8vh,60px)] object-contain pointer-events-none"
                      />
                    ) : (
                      <canvas
                        ref={canvasRef}
                        width={LOGICAL_W}
                        height={LOGICAL_H}
                        onPointerDown={handleSigPointerDown}
                        onPointerMove={handleSigPointerMove}
                        onPointerUp={handleSigPointerUp}
                        onPointerLeave={handleSigPointerUp}
                        style={{ imageRendering: 'pixelated', touchAction: 'none' }}
                        className="w-full h-[clamp(40px,6.8vh,60px)] block cursor-crosshair"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[clamp(8px,1.15vh,10.5px)] font-serif tracking-wider uppercase text-[#4A3B2B]">
                      President of the United States
                    </span>
                    {nudgeSignHint && !signedRecord && (
                      <span className="text-[clamp(8px,1.15vh,10.5px)] font-serif font-bold text-[#991B1B]">
                        Sign above first
                      </span>
                    )}
                  </div>
                </div>

                {/* Crimson Wax Seal (once signed) OR Interactive VETO & Brass Seal Stamp */}
                <div className="shrink-0 flex items-center justify-center gap-2">
                  {signedRecord ? (
                    <div className="w-[clamp(48px,8.2vh,74px)] h-[clamp(48px,8.2vh,74px)] pointer-events-none">
                      <PixelSpriteGrid
                        grid={WAX_SEAL_GRID}
                        palette={WAX_PALETTE}
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleVetoAndThrow}
                        disabled={Boolean(throwingBillId)}
                        title="Veto & throw this bill off the desk"
                        aria-label="Veto and throw bill off desk"
                        style={{
                          boxShadow:
                            'inset 2px 2px 0 0 #FCA5A5, inset -2px -2px 0 0 #7F1D1D, 0 0 0 2px #1B0A08, 0 3px 0 1px #140806',
                        }}
                        className="px-2.5 sm:px-3 py-2 bg-[#B91C1C] hover:bg-[#DC2626] active:translate-y-0.5 disabled:opacity-60 text-[#FEF2F2] font-mono font-bold text-[10px] sm:text-xs tracking-[0.14em] uppercase cursor-pointer transition-transform"
                      >
                        VETO
                      </button>
                      <button
                        type="button"
                        onClick={handleStampDocument}
                        disabled={Boolean(throwingBillId)}
                        title={hasInk ? 'Stamp Presidential Seal' : 'Sign the X line first'}
                        aria-label="Stamp Presidential Seal"
                        className="group w-[clamp(44px,7.5vh,66px)] h-[clamp(44px,7.5vh,66px)] p-0.5 cursor-pointer disabled:opacity-60"
                      >
                        <PixelSealStamp ready={hasInk} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center pl-[18%] sm:pl-[14%] pr-[5%]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow:
                'inset 2px 2px 0 0 #854D0E, inset -2px -2px 0 0 #291507, 0 0 0 3px #120904, 0 12px 28px rgba(0, 0, 0, 0.75)',
            }}
            className="pointer-events-auto max-w-sm bg-[#1F1209]/95 px-6 py-5 text-center space-y-2"
          >
            <div className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#FACC15]">
              {totalRemainingUnhandled > 0
                ? `DAY ${currentDay} DESK DOCKET COMPLETE`
                : 'RESOLUTE DESK CLEAR'}
            </div>
            <p className="text-[11px] font-mono text-[#E7DCC2] leading-relaxed">
              {totalRemainingUnhandled > 0
                ? `You've handled all 3–4 bills delivered for Day ${currentDay}! Step out into the West Wing Hallway and enter the Presidential Bedroom to sleep until Day ${currentDay + 1} for your next batch (${totalRemainingUnhandled} bills remaining).`
                : 'Every bill in the docket has been signed or vetoed and tossed off! Click the Archive Box on the left to review signed bills, or reset the full docket.'}
            </p>
            {onResetDeskBills && totalRemainingUnhandled === 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playPaperRustle();
                    onResetDeskBills();
                  }}
                  style={{
                    boxShadow:
                      'inset 1px 1px 0 0 #FDE68A, inset -1px -1px 0 0 #78350F, 0 2px 0 0 #120904',
                  }}
                  className="px-3.5 py-1.5 bg-[#B45309] hover:bg-[#D97706] text-[#FEF3C7] font-mono font-bold text-[10px] tracking-widest uppercase cursor-pointer"
                >
                  BRING BILLS BACK TO DESK
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
