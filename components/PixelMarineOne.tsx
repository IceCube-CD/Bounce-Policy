import React, { useEffect, useRef, useState } from 'react';
import marineOneSpriteSrc from '../assets/images/marine_one_sprite.jpg';

export type HelicopterFlightPhase = 'idle' | 'boarding' | 'spooling' | 'takeoff' | 'flying';

interface PixelMarineOneProps {
  phase: HelicopterFlightPhase;
  phaseProgress: number; // 0..1 within current phase
  className?: string;
}

interface ProcessedSprites {
  openUrl: string;
  closedUrl: string;
  width: number;
  height: number;
}

let cachedSpritesPromise: Promise<ProcessedSprites> | null = null;

function isMagentaKeyPixel(r: number, g: number, b: number): boolean {
  const minRB = Math.min(r, b);
  return r > 130 && b > 130 && g < 125 && minRB - g > 48;
}

function findColumnBellyBottom(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  colX: number,
  yStart: number,
  yEnd: number
): number {
  let bottom = Math.round(h * 0.64);
  for (let y = yEnd; y >= yStart; y--) {
    const a = data[(y * w + colX) * 4 + 3];
    if (a > 40) {
      bottom = y;
      break;
    }
  }
  return bottom;
}

function loadAndProcessSprites(): Promise<ProcessedSprites> {
  if (cachedSpritesPromise) return cachedSpritesPromise;

  cachedSpritesPromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || 1280;
      const h = img.naturalHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ openUrl: marineOneSpriteSrc, closedUrl: marineOneSpriteSrc, width: w, height: h });
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // 1. Flood-fill from image borders to remove solid #FF00FF magenta background cleanly
      const total = w * h;
      const visited = new Uint8Array(total);
      const removed = new Uint8Array(total);
      const queue = new Int32Array(total);
      let head = 0;
      let tail = 0;

      const enqueue = (idx: number) => {
        if (idx < 0 || idx >= total || visited[idx]) return;
        const p = idx * 4;
        if (isMagentaKeyPixel(data[p], data[p + 1], data[p + 2])) {
          visited[idx] = 1;
          removed[idx] = 1;
          queue[tail++] = idx;
        }
      };

      for (let x = 0; x < w; x++) {
        enqueue(x);
        enqueue((h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        enqueue(y * w);
        enqueue(y * w + (w - 1));
      }

      while (head < tail) {
        const cur = queue[head++];
        const cx = cur % w;
        const cy = (cur - cx) / w;
        if (cx > 0) enqueue(cur - 1);
        if (cx < w - 1) enqueue(cur + 1);
        if (cy > 0) enqueue(cur - w);
        if (cy < h - 1) enqueue(cur + w);
      }

      // 2. Despill any slight JPEG magenta fringe along outer outline edge pixels
      for (let i = 0; i < total; i++) {
        const p = i * 4;
        if (removed[i]) {
          data[p + 3] = 0;
          continue;
        }

        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const x = i % w;
        const y = (i - x) / w;
        const touchesRemoved =
          (x > 0 && removed[i - 1]) ||
          (x < w - 1 && removed[i + 1]) ||
          (y > 0 && removed[i - w]) ||
          (y < h - 1 && removed[i + w]);

        if (touchesRemoved) {
          const minRB = Math.min(r, b);
          if (minRB - g > 28 && minRB > 110) {
            data[p + 3] = 0;
          } else if (r > g + 14 && b > g + 14) {
            data[p] = Math.min(r, g + 12);
            data[p + 2] = Math.min(b, g + 12);
          }
        } else if (r > g + 40 && b > g + 40 && Math.min(r, b) > 130) {
          // Catch tiny enclosed magenta pockets (e.g. between stair rails & wheels)
          data[p + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const openUrl = canvas.toDataURL('image/png');

      // 3. Build gap-free closed-door / retracted-stairs variant using measured fuselage belly slope
      const closedData = new Uint8ClampedArray(data);
      const leftSampleX = Math.round(w * 0.522);
      const rightRefX = Math.round(w * 0.625);

      const leftBellyY = findColumnBellyBottom(
        data,
        w,
        h,
        leftSampleX,
        Math.round(h * 0.48),
        Math.round(h * 0.70)
      );
      const rightBellyY = findColumnBellyBottom(
        data,
        w,
        h,
        rightRefX,
        Math.round(h * 0.45),
        Math.round(h * 0.68)
      );

      // True upward fuselage slope per pixel moving right toward the tail
      const slope = (leftBellyY - rightBellyY) / Math.max(1, rightRefX - leftSampleX);

      const doorXStart = Math.round(w * 0.524);
      const doorOpeningEnd = Math.round(w * 0.586);
      const stairXEnd = Math.round(w * 0.618);
      const doorYTopBase = Math.round(h * 0.422);
      const stairClearYEnd = Math.round(h * 0.80);

      for (let x = doorXStart; x <= stairXEnd; x++) {
        const dx = x - leftSampleX;
        const yOffset = Math.round(dx * slope);
        const topY = doorYTopBase - yOffset;
        const bottomY = leftBellyY - yOffset;

        for (let y = topY; y <= stairClearYEnd; y++) {
          if (y < 0 || y >= h) continue;
          const dst = (y * w + x) * 4;

          if (y <= bottomY) {
            const srcY = Math.max(0, Math.min(h - 1, y + yOffset));
            const src = (srcY * w + leftSampleX) * 4;

            if (x <= doorOpeningEnd) {
              // Paint full closed olive fuselage + white roof + gold stripe + dark belly edge cleanly
              if (closedData[src + 3] > 20) {
                const isDoorSeam =
                  (x >= doorXStart + 1 && x <= doorXStart + 2) ||
                  (x >= doorOpeningEnd - 3 && x <= doorOpeningEnd - 2);
                const isInOliveWall = y >= Math.round(h * 0.455) - yOffset && y <= bottomY - 3;

                if (isDoorSeam && isInOliveWall) {
                  closedData[dst] = Math.max(14, closedData[src] - 32);
                  closedData[dst + 1] = Math.max(18, closedData[src + 1] - 32);
                  closedData[dst + 2] = Math.max(16, closedData[src + 2] - 32);
                  closedData[dst + 3] = 255;
                } else {
                  closedData[dst] = closedData[src];
                  closedData[dst + 1] = closedData[src + 1];
                  closedData[dst + 2] = closedData[src + 2];
                  closedData[dst + 3] = closedData[src + 3];
                }
              }
            } else {
              // Clean up protruding metallic gray stair handrail pixels just right of the closed door
              const pr = closedData[dst];
              const pg = closedData[dst + 1];
              const pb = closedData[dst + 2];
              const isGrayRail =
                closedData[dst + 3] > 20 &&
                Math.abs(pr - pb) < 22 &&
                pb >= pg - 6 &&
                y > Math.round(h * 0.49) - yOffset;
              if (isGrayRail && closedData[src + 3] > 20) {
                closedData[dst] = closedData[src];
                closedData[dst + 1] = closedData[src + 1];
                closedData[dst + 2] = closedData[src + 2];
                closedData[dst + 3] = closedData[src + 3];
              }
            }
          } else {
            // Erase retracted boarding stairs cleanly below the exact belly curve
            closedData[dst + 3] = 0;
          }
        }
      }

      const closedImage = new ImageData(closedData, w, h);
      ctx.putImageData(closedImage, 0, 0);
      const closedUrl = canvas.toDataURL('image/png');

      resolve({ openUrl, closedUrl, width: w, height: h });
    };

    img.onerror = () => {
      resolve({ openUrl: marineOneSpriteSrc, closedUrl: marineOneSpriteSrc, width: 1280, height: 720 });
    };
    img.src = marineOneSpriteSrc;
  });

  return cachedSpritesPromise;
}

export const PixelMarineOne: React.FC<PixelMarineOneProps> = React.memo(({
  phase,
  phaseProgress,
  className = '',
}) => {
  const [sprites, setSprites] = useState<ProcessedSprites | null>(null);
  const [rotorAngle, setRotorAngle] = useState<number>(18);
  const [beaconTick, setBeaconTick] = useState<number>(0);

  // Refs preserve continuous angle & live progress without resetting animation each frame
  const rotorAngleRef = useRef<number>(18);
  const phaseRef = useRef<HelicopterFlightPhase>(phase);
  const phaseProgressRef = useRef<number>(phaseProgress);
  phaseRef.current = phase;
  phaseProgressRef.current = phaseProgress;

  useEffect(() => {
    let mounted = true;
    void loadAndProcessSprites().then((res) => {
      if (mounted) setSprites(res);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isSpinning = phase === 'spooling' || phase === 'takeoff' || phase === 'flying';

  useEffect(() => {
    if (!isSpinning) {
      rotorAngleRef.current = 18;
      setRotorAngle(18);
      setBeaconTick(0);
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();
    let clock = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      clock += dt;

      const curPhase = phaseRef.current;
      const curProg = phaseProgressRef.current;
      const rpmFactor =
        curPhase === 'spooling' ? 0.14 + Math.pow(curProg, 1.35) * 0.86 : 1;
      const degPerSec = 1480 * rpmFactor;

      rotorAngleRef.current = (rotorAngleRef.current + degPerSec * dt) % 360;
      setRotorAngle(rotorAngleRef.current);
      setBeaconTick(clock);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isSpinning]);

  const doorOpen = phase === 'idle' || phase === 'boarding';

  // Continuous smooth curved takeoff + sweeping climb-out arc (up and smoothly curving left off-screen)
  let liftYPercent = 0;
  let flyXPercent = 0;
  let pitchDeg = 0;
  let heliScale = 1;
  let heliOpacity = 1;
  let shadowFactor = 1;

  if (phase === 'spooling') {
    liftYPercent = phaseProgress > 0.45 ? Math.sin(beaconTick * 40) * 0.35 : 0;
  } else if (phase === 'takeoff' || phase === 'flying') {
    // Combine takeoff (0..0.34) + flying (0.34..1.0) into one fluid C1-continuous flight curve
    const u = phase === 'takeoff' ? phaseProgress * 0.34 : 0.34 + phaseProgress * 0.66;

    // Smooth curved flight path: climbs cleanly off pad at u=0, bends smoothly into left flight
    flyXPercent = -325 * Math.pow(u, 2.05);
    liftYPercent = -122 * (1 - Math.pow(1 - u, 2.25));
    pitchDeg = -9.5 * Math.sin(Math.min(1, u * 1.45) * (Math.PI / 2));
    heliScale = 1 - 0.16 * Math.pow(u, 1.35);
    heliOpacity = u > 0.9 ? Math.max(0, 1 - (u - 0.9) / 0.1) : 1;
    shadowFactor = Math.max(0, 1 - u * 2.35);
  }

  const strobeOn = isSpinning && Math.sin(beaconTick * 9.5) > 0.2;
  const tailRotorAngle = (rotorAngle * 1.75) % 360;
  const activeSpriteUrl = sprites ? (doorOpen ? sprites.openUrl : sprites.closedUrl) : null;

  return (
    <div className={`relative w-full h-full select-none pointer-events-none ${className}`}>
      {/* 1. Grounded Cast Shadow on the Striped Lawn (no air rings) */}
      {shadowFactor > 0.02 && (
        <svg
          viewBox="0 0 160 90"
          shapeRendering="crispEdges"
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
          aria-hidden="true"
        >
          <g
            transform={`translate(84, 72) scale(${0.68 + 0.32 * shadowFactor}) translate(-84, -72)`}
            opacity={0.42 * shadowFactor}
          >
            <rect x="26" y="68" width="96" height="8" fill="#071106" />
            <rect x="20" y="70" width="108" height="4" fill="#071106" />
            <rect x="34" y="66" width="76" height="11" fill="#071106" />
            <rect x="116" y="66" width="28" height="5" fill="#071106" />
          </g>
        </svg>
      )}

      {/* 2. High-Fidelity Pixelated Marine One + Continuously Rotating Pixel Rotors */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          opacity: heliOpacity,
          transform: `translate(${flyXPercent}%, ${liftYPercent}%) rotate(${pitchDeg}deg) scale(${heliScale})`,
          transformOrigin: '50% 55%',
        }}
      >
        {activeSpriteUrl && (
          <img
            src={activeSpriteUrl}
            alt="Marine One"
            draggable={false}
            className="w-full h-full object-contain pixelated"
          />
        )}

        {/* Crisp Pixelated Animated Tail Rotor & 5-Blade Main Rotor Overlay */}
        <svg
          viewBox="0 0 160 90"
          shapeRendering="crispEdges"
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
          aria-hidden="true"
        >
          {/* Tail Fin Red Beacon Light */}
          <rect
            x="139.5"
            y="14.2"
            width="1.6"
            height="1.6"
            fill={strobeOn ? '#EF4444' : '#7F1D1D'}
          />

          {/* Tail Rotor Hub at (89.2%, 20.5%) -> (142.7, 18.45) */}
          <g transform={`translate(142.7, 18.45) rotate(${tailRotorAngle})`}>
            <rect x="-0.8" y="-9.5" width="1.6" height="19" fill="#0F131F" />
            <rect x="-0.4" y="-8.5" width="0.8" height="17" fill="#475569" />
            <rect x="-9.5" y="-0.8" width="19" height="1.6" fill="#0F131F" />
            <rect x="-8.5" y="-0.4" width="17" height="0.8" fill="#475569" />
            <rect x="-0.6" y="-9.5" width="1.2" height="2" fill="#FACC15" />
            <rect x="-0.6" y="7.5" width="1.2" height="2" fill="#FACC15" />
            <rect x="-9.5" y="-0.6" width="2" height="1.2" fill="#FACC15" />
            <rect x="7.5" y="-0.6" width="2" height="1.2" fill="#FACC15" />
            <rect x="-1.2" y="-1.2" width="2.4" height="2.4" fill="#CBD5E1" />
          </g>

          {/* 5-Blade Pixel Main Rotor mounted right onto hub cap (40.3%, 27.6%) -> (64.5, 24.8) */}
          <g transform="translate(64.5, 24.8) scale(1, 0.35)">
            {[0, 72, 144, 216, 288].map((offset) => (
              <g key={offset} transform={`rotate(${rotorAngle + offset})`}>
                {isSpinning && (
                  <rect
                    x="-1.8"
                    y="-58"
                    width="3.6"
                    height="56"
                    fill="#1E293B"
                    opacity="0.24"
                    transform="rotate(-14)"
                  />
                )}
                <rect x="-1.8" y="-63" width="3.6" height="63" fill="#0F131F" />
                <rect x="-1.1" y="-61.5" width="2.2" height="59" fill="#334155" />
                <rect x="0" y="-60.5" width="1.0" height="54" fill="#64748B" />
                <rect x="-1.3" y="-62.5" width="2.6" height="5.5" fill="#FACC15" />
              </g>
            ))}
            {/* Central Rotor Cap */}
            <circle cx={0} cy={0} r={5.0} fill="#0F131F" />
            <circle cx={0} cy={0} r={3.2} fill="#94A3B8" />
            <circle cx={-0.6} cy={-0.6} r={1.4} fill="#E2E8F0" />
          </g>
        </svg>
      </div>
    </div>
  );
});
