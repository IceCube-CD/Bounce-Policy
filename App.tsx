/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  Maximize2,
  Minimize2,
  Grid,
  Copy,
  Check,
  User,
  Ban,
  MessageSquare,
  Trash2,
  Footprints,
  Plus,
  Move,
  Upload,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Flame,
  RotateCcw,
  Layers,
  Eye,
  EyeOff,
  FileJson,
  Sparkles,
  Calendar,
  DoorOpen,
  MapPin,
  Shield,
  ScrollText,
} from 'lucide-react';
import { BUILT_IN_SCENES, createNewScene } from './data/defaultScenes';
import savedWorldStateRaw from './data/savedWorldState.json';
import { DEFAULT_TWITTLY_POSTS } from './data/defaultNews';
import {
  CHARACTERISTIC_SHORT_LABELS,
  DAILY_RANDOM_EVENTS,
  DailyRandomEvent,
  pickRandomDailyEvent,
} from './data/dailyRandomEvents';
import {
  DEFAULT_CHARACTERISTICS,
  DEFAULT_POLICY_BILLS,
  CHARACTERISTIC_META,
  REACTION_MOODS,
  ensureBillThreeReactions,
} from './data/defaultBills';
import {
  AnimatedPropItem,
  BodyguardVariant,
  CharacterAssetKind,
  CharacteristicKey,
  MapZone,
  NationCharacteristics,
  Point2D,
  PolicyBill,
  PropKind,
  SceneCharacterItem,
  SceneData,
  SignedBillRecord,
  TwittlyPost,
  TwittlyTag,
  VetoedBillRecord,
  ZoneType,
} from './types/engine';
import { PixelCharacter, Direction, CharacterPose } from './components/PixelCharacter';
import { PixelBodyguard } from './components/PixelBodyguard';
import { PixelRallyBallistics } from './components/PixelRallyBallistics';
import { PixelTacticalNukeOverlay } from './components/PixelTacticalNukeOverlay';
import { PixelWhiteHouseBombingOverlay } from './components/PixelWhiteHouseBombingOverlay';
import { PixelWhiteHouseRaidOverlay } from './components/PixelWhiteHouseRaidOverlay';
import { WORLD_MAP_COUNTRIES, WorldMapCountry } from './data/worldMapEvents';
import { PixelMarineOne, HelicopterFlightPhase } from './components/PixelMarineOne';
import { AnimatedPropRenderer, PROP_LIBRARY } from './components/AnimatedProps';
import { PixelDayHud } from './components/PixelDayHud';
import {
  DefconLevel,
  DefconToastData,
  PixelDefconHud,
  PixelDefconNotification,
  getDefconFromSecurity,
} from './components/PixelDefconHud';
import { DevCharacteristicsPanel } from './components/DevCharacteristicsPanel';
import { PixelPhone } from './components/PixelPhone';
import { PixelWorldMapModal } from './components/PixelWorldMapModal';
import { PixelDeskPhoneModal } from './components/PixelDeskPhoneModal';
import { PixelResoluteDeskModal } from './components/PixelResoluteDeskModal';
import { PixelIntroOverlay } from './components/PixelIntroOverlay';
import {
  DayTransitionState,
  PixelDayTransitionOverlay,
} from './components/PixelDayTransitionOverlay';
import {
  PRESIDENTIAL_CHATTER_CLIPS,
  PixelEventSummonModal,
} from './components/PixelEventSummonModal';
import { BillsAndStatsInspector } from './components/BillsAndStatsInspector';
import {
  playDefconStepSound,
  playHelicopterTakeoffSound,
  playRallyShotsSound,
  playTacticalNukeSound,
  playTerroristBombSound,
  playWhiteHouseRaidSound,
  playVoicelineAndWait,
  speakVoiceline,
  stopDefconStepSound,
  stopTacticalNukeSound,
  stopTerroristBombSound,
  stopWhiteHouseRaidSound,
  stopVoiceline,
} from './utils/voicePlayer';
import {
  PixelInteractButton,
  PixelDialogueBox,
  InteractPromptKind,
  InteractKeyLabel,
} from './components/PixelInteractPrompt';

type EngineMode = 'play' | 'props' | 'characters' | 'zones' | 'floor' | 'bills' | 'events';
type ZoneSubTool = 'select' | 'draw-door' | 'draw-interactive' | 'draw-solid' | 'draw-mask';
type GridOverlayMode = 'none' | '32px' | '16px';

interface DragAction {
  type:
    | 'move-prop'
    | 'resize-prop'
    | 'move-character'
    | 'move-spawn'
    | 'move-zone'
    | 'resize-zone'
    | 'draw-zone'
    | 'move-floor-pt'
    | 'move-door-arrival'
    | 'move-door-preview-spawn';
  targetId?: string;
  sourceSceneId?: string;
  pointIndex?: number;
  startMouseX: number;
  startMouseY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  currentX: number;
  currentY: number;
}

const ENGINE_STORAGE_KEY = 'executive_scene_engine_v1';
const ENGINE_SAVED_AT_KEY = 'executive_scene_saved_at_v1';
const MASK_SEED_STORAGE_KEY = 'executive_scene_mask_seed_v1';
const HALLWAY_SEED_STORAGE_KEY = 'executive_scene_hallway_seed_v1';
const HALLWAY_RESTORE_KEY = 'executive_scene_hallway_restore_v2';
const DESK_INTERACT_FIX_KEY = 'executive_desk_interact_fix_v1';
const HALLWAY_GUARDS_SEED_KEY = 'executive_hallway_guards_v1';
const DESK_PHONE_SEED_KEY = 'executive_desk_phone_seed_v1';
const RESOLUTE_DESK_MODAL_SEED_KEY = 'executive_resolute_desk_modal_v1';
const LAWN_SCENE_SEED_KEY = 'executive_white_house_lawn_v6';
const RALLY_SCENE_SEED_KEY = 'executive_presidential_rally_v2';
const BEDROOM_SCENE_SEED_KEY = 'executive_bedroom_scene_seeded_v2';
const CHARACTERISTICS_STORAGE_KEY = 'executive_characteristics_v1';
const BILLS_STORAGE_KEY = 'executive_policy_bills_v1';
const BILLS_97_SEED_KEY = 'executive_bills_97_seeded_v1';
const DAILY_DESK_BATCH_STORAGE_KEY = 'executive_daily_desk_batch_v1';
const SIGNED_BILLS_STORAGE_KEY = 'executive_signed_bills_v1';
const VETOED_BILLS_STORAGE_KEY = 'executive_vetoed_bills_v1';

function pickDailyBillBatchIds(
  allBills: PolicyBill[],
  signedMap: Record<string, SignedBillRecord>,
  vetoedMap: Record<string, VetoedBillRecord>,
  dayNum: number
): string[] {
  const candidates = allBills.filter(
    (b) => b.activeOnDesk !== false && !signedMap[b.id] && !vetoedMap[b.id]
  );
  if (candidates.length === 0) return [];
  const count = dayNum % 2 === 1 ? 4 : 3;
  // Deterministic daily shuffle seeded by dayNum so player gets a varied 3-4 bill mix each day
  const pool = [...candidates];
  let seed = (dayNum * 2654435761) >>> 0;
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, Math.min(count, pool.length)).map((b) => b.id);
}

const RALLY_PRE_SHOT_SPEECH_CLIP = './audio/rally_speech_intro.mp3';
const RALLY_POST_SHOT_FIST_CLIP = './audio/rally_bad_shot.mp3';

const RALLY_SPEECH_CLIPS = [
  RALLY_PRE_SHOT_SPEECH_CLIP,
  RALLY_POST_SHOT_FIST_CLIP,
  './audio/potus_sign_bill_1.mp3',
  './audio/potus_sign_bill_2.mp3',
  './audio/potus_sign_bill_3.mp3',
];

const RALLY_CROWD_CHANTS = [
  'USA! USA!',
  'LOOK AT THAT CHART!',
  'WE LOVE TRUMP!',
  '45 - 47!!',
  'TELL EM SIR!',
  'USA! #1!',
];

const RALLY_SCARED_CRIES = [
  'GET DOWN!!',
  'GUNSHOTS!!',
  'OMG NO!!',
  'STAY LOW!!',
  'PROTECT HIM!!',
  'MEDIC!!',
];

const RALLY_FIGHT_CHANTS = [
  'BAD SHOT!!',
  'USA! USA!',
  'HE IS OKAY!!',
  'TERRIBLE SHOT!!',
  'UNSTOPPABLE!!',
  '45 - 47!!',
];

type RallyEventPhase = 'idle' | 'speaking' | 'ducking' | 'fist-raised';

const CHARACTER_ASSET_LIBRARY: {
  id: string;
  kind: CharacterAssetKind;
  variant: BodyguardVariant;
  name: string;
  subtitle: string;
  defaultDialogue: string;
}[] = [
  {
    id: 'asset-bodyguard-dark',
    kind: 'secret-service-bodyguard',
    variant: 'dark-hair',
    name: 'Bodyguard — Dark Hair',
    subtitle: 'Secret Service · Suit & Aviators',
    defaultDialogue: 'Clearance verified, Mr. President. Perimeter is secure.',
  },
  {
    id: 'asset-bodyguard-buzz',
    kind: 'secret-service-bodyguard',
    variant: 'buzz-cut',
    name: 'Bodyguard — Buzz Cut',
    subtitle: 'Secret Service · Suit & Earpiece',
    defaultDialogue: 'Standing watch on post. Corridor clear.',
  },
  {
    id: 'asset-rally-maga-cap',
    kind: 'secret-service-bodyguard',
    variant: 'maga-cap-red',
    name: 'Rally Fan — Red Cap',
    subtitle: 'Supporter · Red Cap & Jacket',
    defaultDialogue: 'USA! USA! We drove all night to see this speech, Mr. President!',
  },
  {
    id: 'asset-rally-usa-sign',
    kind: 'secret-service-bodyguard',
    variant: 'rally-sign-usa',
    name: 'Rally Fan — USA Sign',
    subtitle: 'Supporter · Raised USA Placard',
    defaultDialogue: 'Look at my homemade USA sign! Best rally turnout in history!',
  },
  {
    id: 'asset-rally-blonde-vip',
    kind: 'secret-service-bodyguard',
    variant: 'rally-blonde-vip',
    name: 'Rally VIP — Flag Waver',
    subtitle: 'VIP Crowd · Mini U.S. Flag',
    defaultDialogue: 'The energy in this arena is electric! Four more years!',
  },
  {
    id: 'asset-press-cameraman',
    kind: 'secret-service-bodyguard',
    variant: 'press-cameraman',
    name: 'Press Cameraman',
    subtitle: 'Media Pool · Broadcast Camera',
    defaultDialogue: 'Live feed rolling from the press riser, Mr. President.',
  },
];

function restoreBuiltInHallwayAndLink(list: SceneData[]): SceneData[] {
  const builtInHallway = BUILT_IN_SCENES.find((s) => s.id === 'west-wing-hallway');
  const builtInOfficeDoor = BUILT_IN_SCENES[0]?.zones.find(
    (z) => z.id === 'south-doors'
  );
  let next = list;
  if (builtInOfficeDoor) {
    next = next.map((scene: SceneData) => {
      if (scene.id === 'presidents-office-daylight') {
        return {
          ...scene,
          zones: scene.zones.map((z) =>
            z.id === 'south-doors'
              ? {
                  ...z,
                  collisionType: 'door',
                  targetSceneId: z.targetSceneId || builtInOfficeDoor.targetSceneId,
                  targetDoorId: z.targetDoorId || builtInOfficeDoor.targetDoorId,
                  targetSpawn: z.targetSpawn || builtInOfficeDoor.targetSpawn,
                  targetDirection: z.targetDirection || builtInOfficeDoor.targetDirection,
                  description: z.description || builtInOfficeDoor.description,
                }
              : z
          ),
        };
      }
      return scene;
    });
  }
  if (builtInHallway && !next.some((s: SceneData) => s.id === 'west-wing-hallway')) {
    next = [...next, builtInHallway];
  }
  return next.map((scene: SceneData) => ({
    ...scene,
    zones: scene.zones.map((z) =>
      z.collisionType === 'interactive' && z.targetSceneId && z.id !== 'resolute-desk'
        ? { ...z, collisionType: 'door' as const }
        : z
    ),
  }));
}

function normalizeBuiltInSceneImages(list: SceneData[]): SceneData[] {
  return list.map((scene: SceneData) => {
    const builtInMatch = BUILT_IN_SCENES.find((b) => b.id === scene.id);
    const hasCustomDataImage =
      typeof scene.imageUrl === 'string' && scene.imageUrl.startsWith('data:');
    return {
      ...scene,
      imageUrl:
        builtInMatch && !hasCustomDataImage ? builtInMatch.imageUrl : scene.imageUrl,
      characters: scene.characters ?? [],
    };
  });
}

function loadInitialScenes(): SceneData[] {
  try {
    const bundledState = savedWorldStateRaw as {
      updatedAt?: number;
      scenes?: SceneData[];
    };
    const bundledUpdatedAt =
      typeof bundledState?.updatedAt === 'number' ? bundledState.updatedAt : 0;
    const bundledScenes = Array.isArray(bundledState?.scenes) ? bundledState.scenes : [];

    const localSavedAt = Number(localStorage.getItem(ENGINE_SAVED_AT_KEY) || '0');
    const raw = localStorage.getItem(ENGINE_STORAGE_KEY);

    // If the project has a savedWorldState.json that is newer than (or when localStorage is empty/moved), load it directly
    if (
      bundledScenes.length > 0 &&
      (!raw || bundledUpdatedAt >= localSavedAt)
    ) {
      return normalizeBuiltInSceneImages(bundledScenes);
    }

    if (raw) {
      let parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const maskSeeded = localStorage.getItem(MASK_SEED_STORAGE_KEY);
        if (!maskSeeded) {
          localStorage.setItem(MASK_SEED_STORAGE_KEY, '1');
          const defaultMask = BUILT_IN_SCENES[0]?.zones.find(
            (z) => z.id === 'fireplace-arch-mask'
          );
          if (defaultMask) {
            parsed = parsed.map((scene: SceneData) => {
              if (
                scene.id === 'presidents-office-daylight' &&
                !scene.zones.some((z) => z.collisionType === 'mask')
              ) {
                return { ...scene, zones: [...scene.zones, defaultMask] };
              }
              return scene;
            });
          }
        }

        const hallwaySeeded = localStorage.getItem(HALLWAY_SEED_STORAGE_KEY);
        const hallwayRestored = localStorage.getItem(HALLWAY_RESTORE_KEY);
        if (!hallwaySeeded || !hallwayRestored) {
          localStorage.setItem(HALLWAY_SEED_STORAGE_KEY, '1');
          localStorage.setItem(HALLWAY_RESTORE_KEY, '1');
          parsed = restoreBuiltInHallwayAndLink(parsed);
        }

        const deskFixed = localStorage.getItem(DESK_INTERACT_FIX_KEY);
        if (!deskFixed) {
          localStorage.setItem(DESK_INTERACT_FIX_KEY, '1');
          parsed = parsed.map((scene: SceneData) => ({
            ...scene,
            zones: scene.zones.map((z) =>
              z.id === 'resolute-desk'
                ? {
                    ...z,
                    collisionType: 'interactive' as const,
                    blocksWalk: true,
                    targetSceneId: undefined,
                    targetDoorId: undefined,
                    targetSpawn: undefined,
                    targetDirection: undefined,
                  }
                : z
            ),
          }));
        }

        const guardsSeeded = localStorage.getItem(HALLWAY_GUARDS_SEED_KEY);
        if (!guardsSeeded) {
          localStorage.setItem(HALLWAY_GUARDS_SEED_KEY, '1');
          const builtInHallwayGuards =
            BUILT_IN_SCENES.find((s) => s.id === 'west-wing-hallway')?.characters || [];
          parsed = parsed.map((scene: SceneData) => {
            if (
              scene.id === 'west-wing-hallway' &&
              (!scene.characters || scene.characters.length === 0)
            ) {
              return { ...scene, characters: builtInHallwayGuards };
            }
            return { ...scene, characters: scene.characters ?? [] };
          });
        }

        const phoneSeeded = localStorage.getItem(DESK_PHONE_SEED_KEY);
        if (!phoneSeeded) {
          localStorage.setItem(DESK_PHONE_SEED_KEY, '1');
          const builtInDeskPhone = BUILT_IN_SCENES[0]?.zones.find(
            (z) => z.id === 'desk-phone'
          );
          if (builtInDeskPhone) {
            parsed = parsed.map((scene: SceneData) => {
              if (
                scene.id === 'presidents-office-daylight' &&
                !scene.zones.some(
                  (z) => z.id === 'desk-phone' || z.opensModal === 'desk-phone'
                )
              ) {
                const deskIndex = scene.zones.findIndex((z) => z.id === 'resolute-desk');
                const nextZones = [...scene.zones];
                if (deskIndex >= 0) {
                  nextZones.splice(deskIndex + 1, 0, builtInDeskPhone);
                } else {
                  nextZones.push(builtInDeskPhone);
                }
                return { ...scene, zones: nextZones };
              }
              return scene;
            });
          }
        }

        const resoluteModalSeeded = localStorage.getItem(RESOLUTE_DESK_MODAL_SEED_KEY);
        if (!resoluteModalSeeded) {
          localStorage.setItem(RESOLUTE_DESK_MODAL_SEED_KEY, '1');
          parsed = parsed.map((scene: SceneData) => ({
            ...scene,
            zones: scene.zones.map((z) =>
              z.id === 'resolute-desk'
                ? {
                    ...z,
                    opensModal: 'resolute-desk' as const,
                    description:
                      'Review executive briefs, sign state bills, and enact policy.',
                  }
                : z
            ),
          }));
        }

        const lawnSeeded = localStorage.getItem(LAWN_SCENE_SEED_KEY);
        if (!lawnSeeded) {
          localStorage.setItem(LAWN_SCENE_SEED_KEY, '1');
          const builtInLawn = BUILT_IN_SCENES.find(
            (s) => s.id === 'white-house-south-lawn'
          );
          const builtInHallwayLawnDoor = BUILT_IN_SCENES.find(
            (s) => s.id === 'west-wing-hallway'
          )?.zones.find((z) => z.id === 'hallway-to-lawn-door');

          if (builtInHallwayLawnDoor) {
            parsed = parsed.map((scene: SceneData) => {
              if (scene.id === 'west-wing-hallway') {
                const hasLawnDoor = scene.zones.some(
                  (z) => z.id === 'hallway-to-lawn-door'
                );
                return {
                  ...scene,
                  zones: hasLawnDoor
                    ? scene.zones
                    : [...scene.zones, builtInHallwayLawnDoor],
                };
              }
              return scene;
            });
          }

          if (builtInLawn && !parsed.some((s: SceneData) => s.id === 'white-house-south-lawn')) {
            parsed = [...parsed, builtInLawn];
          }
        }

        const rallySeeded = localStorage.getItem(RALLY_SCENE_SEED_KEY);
        if (!rallySeeded) {
          localStorage.setItem(RALLY_SCENE_SEED_KEY, '1');
          const builtInRally = BUILT_IN_SCENES.find(
            (s) => s.id === 'presidential-rally-stage'
          );
          if (builtInRally && !parsed.some((s: SceneData) => s.id === 'presidential-rally-stage')) {
            parsed = [...parsed, builtInRally];
          }
        }

        const bedroomSeeded = localStorage.getItem(BEDROOM_SCENE_SEED_KEY);
        if (!bedroomSeeded) {
          localStorage.setItem(BEDROOM_SCENE_SEED_KEY, '1');
          const builtInBedroom = BUILT_IN_SCENES.find(
            (s) => s.id === 'presidential-bedroom'
          );
          const builtInHallwayBedroomDoor = BUILT_IN_SCENES.find(
            (s) => s.id === 'west-wing-hallway'
          )?.zones.find((z) => z.id === 'hallway-to-bedroom-door');

          if (builtInHallwayBedroomDoor) {
            parsed = parsed.map((scene: SceneData) => {
              if (scene.id === 'west-wing-hallway') {
                const hasBedroomDoor = scene.zones.some(
                  (z) => z.id === 'hallway-to-bedroom-door'
                );
                return {
                  ...scene,
                  zones: hasBedroomDoor
                    ? scene.zones
                    : [...scene.zones, builtInHallwayBedroomDoor],
                };
              }
              return scene;
            });
          }

          if (builtInBedroom) {
            if (parsed.some((s: SceneData) => s.id === 'presidential-bedroom')) {
              parsed = parsed.map((s: SceneData) =>
                s.id === 'presidential-bedroom'
                  ? { ...s, imageUrl: builtInBedroom.imageUrl }
                  : s
              );
            } else {
              parsed = [...parsed, builtInBedroom];
            }
          }
        }

        return normalizeBuiltInSceneImages(parsed);
      }
    }
  } catch {
    // Ignore storage issues
  }
  return BUILT_IN_SCENES;
}

function isPointInPolygon(px: number, py: number, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isWalkablePosition(px: number, py: number, scene: SceneData): boolean {
  if (px < 2 || px > 98 || py < 6 || py > 97) return false;
  if (scene.restrictToFloor && scene.floorPolygon.length >= 3) {
    if (!isPointInPolygon(px, py, scene.floorPolygon)) {
      return false;
    }
  }
  for (const zone of scene.zones) {
    const blocks = zone.collisionType === 'solid' || zone.blocksWalk === true;
    if (!blocks) continue;
    if (
      px >= zone.xPercent &&
      px <= zone.xPercent + zone.widthPercent &&
      py >= zone.yPercent &&
      py <= zone.yPercent + zone.heightPercent
    ) {
      return false;
    }
  }
  for (const ch of scene.characters ?? []) {
    if (ch.visible === false || !ch.blocksWalk) continue;
    if (
      Math.abs(px - ch.xPercent) < 2.2 &&
      py >= ch.yPercent - 2.2 &&
      py <= ch.yPercent + 1.4
    ) {
      return false;
    }
  }
  return true;
}

function computeSmartLandingForDoor(door: MapZone): {
  spawn: Point2D;
  direction: Direction;
} {
  const centerX = +Math.min(95, Math.max(5, door.xPercent + door.widthPercent / 2)).toFixed(1);
  const centerY = door.yPercent + door.heightPercent / 2;
  const bottomY = +Math.min(94, Math.max(12, door.yPercent + door.heightPercent)).toFixed(1);

  if (centerY < 45) {
    return {
      spawn: {
        x: centerX,
        y: +Math.min(94, door.yPercent + door.heightPercent + 5).toFixed(1),
      },
      direction: 'down',
    };
  }
  if (door.yPercent > 65) {
    return {
      spawn: {
        x: centerX,
        y: +Math.max(14, door.yPercent - 3.5).toFixed(1),
      },
      direction: 'up',
    };
  }
  if (door.xPercent < 25) {
    return {
      spawn: {
        x: +Math.min(92, door.xPercent + door.widthPercent + 4).toFixed(1),
        y: bottomY,
      },
      direction: 'right',
    };
  }
  if (door.xPercent + door.widthPercent > 75) {
    return {
      spawn: {
        x: +Math.max(8, door.xPercent - 4).toFixed(1),
        y: bottomY,
      },
      direction: 'left',
    };
  }
  return {
    spawn: {
      x: centerX,
      y: +Math.min(94, door.yPercent + door.heightPercent + 4).toFixed(1),
    },
    direction: 'down',
  };
}

type NearbyInteractItem =
  | { type: 'zone'; zone: MapZone; edgeDist: number; centerDist: number }
  | { type: 'character'; character: SceneCharacterItem; edgeDist: number; centerDist: number };

const INTERACT_KEYS: InteractKeyLabel[] = ['E', 'R', 'F'];

function getNearbyInteractItems(
  px: number,
  py: number,
  scene: SceneData
): NearbyInteractItem[] {
  if (scene.disableInteractions) {
    return [];
  }
  const margin = 4.6;
  const items: NearbyInteractItem[] = [];

  for (const zone of scene.zones) {
    if (zone.collisionType !== 'interactive' && zone.collisionType !== 'door') continue;
    const x1 = zone.xPercent;
    const y1 = zone.yPercent;
    const x2 = zone.xPercent + zone.widthPercent;
    const y2 = zone.yPercent + zone.heightPercent;

    if (px >= x1 - margin && px <= x2 + margin && py >= y1 - margin && py <= y2 + margin) {
      const dx = Math.max(x1 - px, 0, px - x2);
      const dy = Math.max(y1 - py, 0, py - y2);
      const edgeDist = Math.hypot(dx, dy);
      const cx = x1 + zone.widthPercent / 2;
      const cy = y1 + zone.heightPercent / 2;
      const centerDist = Math.hypot(px - cx, py - cy);
      items.push({ type: 'zone', zone, edgeDist, centerDist });
    }
  }

  for (const ch of scene.characters ?? []) {
    if (ch.visible === false || !ch.dialogue?.trim()) continue;
    const dist = Math.hypot(px - ch.xPercent, py - ch.yPercent);
    if (dist <= 7.5) {
      items.push({ type: 'character', character: ch, edgeDist: dist, centerDist: dist });
    }
  }

  items.sort((a, b) => {
    const aSpecial =
      a.type === 'zone' && (a.zone.opensModal === 'desk-phone' || a.zone.id === 'desk-phone')
        ? 1
        : 0;
    const bSpecial =
      b.type === 'zone' && (b.zone.opensModal === 'desk-phone' || b.zone.id === 'desk-phone')
        ? 1
        : 0;
    if (Math.abs(a.edgeDist - b.edgeDist) > 1.2) {
      return a.edgeDist - b.edgeDist;
    }
    if (aSpecial !== bSpecial) return aSpecial - bSpecial;
    return a.centerDist - b.centerDist;
  });

  return items.slice(0, INTERACT_KEYS.length);
}

function getZonePromptMeta(
  zone: MapZone,
  keyLabel: InteractKeyLabel = 'E'
): { kind: InteractPromptKind; actionText: string } {
  if (zone.opensModal === 'desk-phone' || zone.id === 'desk-phone') {
    return { kind: 'phone', actionText: `PRESS ${keyLabel} · CALL` };
  }
  if (zone.opensModal === 'resolute-desk' || zone.id === 'resolute-desk') {
    return { kind: 'desk', actionText: `PRESS ${keyLabel} · SIGN BILLS` };
  }
  if (zone.opensModal === 'world-map' || zone.id === 'coffee-table') {
    return { kind: 'map', actionText: `PRESS ${keyLabel} · WORLD MAP` };
  }
  if (zone.id === 'marine-one-helicopter') {
    return { kind: 'helicopter', actionText: `PRESS ${keyLabel} · BOARD HELICOPTER` };
  }
  if (zone.id === 'rally-podium') {
    return { kind: 'interact', actionText: `PRESS ${keyLabel} · DELIVER SPEECH` };
  }
  if (zone.id === 'presidential-bed') {
    return { kind: 'interact', actionText: `PRESS ${keyLabel} · SLEEP` };
  }
  if (zone.collisionType === 'door' || Boolean(zone.targetSceneId)) {
    return { kind: 'door', actionText: `PRESS ${keyLabel} · ENTER DOOR` };
  }
  return { kind: 'interact', actionText: `PRESS ${keyLabel} · INSPECT` };
}

export default function App() {
  const [scenes, setScenes] = useState<SceneData[]>(loadInitialScenes);
  const [activeSceneId, setActiveSceneId] = useState<string>(() => {
    const init = loadInitialScenes();
    const rallyScene = init.find((s) => s.id === 'presidential-rally-stage');
    return rallyScene?.id || 'presidential-rally-stage';
  });

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0] || BUILT_IN_SCENES[0];

  const [engineMode, setEngineMode] = useState<EngineMode>('play');
  const [zoneSubTool, setZoneSubTool] = useState<ZoneSubTool>('select');
  const [gridMode, setGridMode] = useState<GridOverlayMode>('none');
  const [showZonesInPlay, setShowZonesInPlay] = useState<boolean>(false);
  const [fullscreenPlay, setFullscreenPlay] = useState<boolean>(true);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [isPhoneOpen, setIsPhoneOpen] = useState<boolean>(false);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState<boolean>(false);
  const [isDeskPhoneOpen, setIsDeskPhoneOpen] = useState<boolean>(false);
  const [isResoluteDeskOpen, setIsResoluteDeskOpen] = useState<boolean>(false);
  const [isEventSummonerOpen, setIsEventSummonerOpen] = useState<boolean>(false);

  // Secret Dev Studio unlock counter (press V 10 times repeatedly)
  const vPressCountRef = useRef<number>(0);
  const vLastPressMsRef = useRef<number>(0);
  const vToastClearRef = useRef<number | null>(null);
  const [vUnlockCount, setVUnlockCount] = useState<number>(0);
  const [worldSaveStatus, setWorldSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const hasHydratedWorldRef = useRef<boolean>(false);

  const [selectedPropId, setSelectedPropId] = useState<string | null>(
    activeScene.props[0]?.id || null
  );
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    activeScene.characters?.[0]?.id || null
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(
    activeScene.zones[0]?.id || null
  );
  const [dragAction, setDragAction] = useState<DragAction | null>(null);

  // Character movement state
  const [walkEnabled, setWalkEnabled] = useState<boolean>(true);
  const [charPos, setCharPos] = useState<Point2D>(activeScene.spawn);
  const [charDir, setCharDir] = useState<Direction>('down');
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [walkFrame, setWalkFrame] = useState<number>(0);
  const [clickTarget, setClickTarget] = useState<Point2D | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<MapZone | null>(null);
  const [rallyCheerActive, setRallyCheerActive] = useState<boolean>(false);
  const rallyCheerTimerRef = useRef<number | null>(null);
  const [rallyEventPhase, setRallyEventPhase] = useState<RallyEventPhase>('idle');
  const [rallyShotFlash, setRallyShotFlash] = useState<boolean>(false);
  const rallyEventCancelRef = useRef<(() => void) | null>(null);

  // Random Presidential Chatter state (plays custom voice clip + speech bubble comment above POTUS)
  const [activeChatterText, setActiveChatterText] = useState<string | null>(null);
  const chatterClearTimerRef = useRef<number | null>(null);
  const lastChatterIndexRef = useRef<number>(-1);

  // Tactical Nuke Summon Event state
  const [tacticalNuke, setTacticalNuke] = useState<{
    active: boolean;
    country: WorldMapCountry | null;
    launchId: number;
    startedAtMs: number;
  }>({
    active: false,
    country: null,
    launchId: 0,
    startedAtMs: 0,
  });
  const tacticalNukeStopRef = useRef<(() => void) | null>(null);
  const tacticalNukeAutoClearRef = useRef<number | null>(null);
  const tacticalNukeActiveRef = useRef<boolean>(false);

  useEffect(() => {
    tacticalNukeActiveRef.current = tacticalNuke.active;
  }, [tacticalNuke.active]);

  // White House Terrorist Bombing Event state (auto-triggers at 0% National Security or from Summon Events)
  const [terroristBomb, setTerroristBomb] = useState<{
    active: boolean;
    launchId: number;
    startedAtMs: number;
  }>({
    active: false,
    launchId: 0,
    startedAtMs: 0,
  });
  const terroristBombStopRef = useRef<(() => void) | null>(null);
  const terroristBombActiveRef = useRef<boolean>(false);

  useEffect(() => {
    terroristBombActiveRef.current = terroristBomb.active;
  }, [terroristBomb.active]);

  // White House & Oval Office Public Raid Event state (auto-triggers at 0% Public Approval or from Summon Events)
  const [whiteHouseRaid, setWhiteHouseRaid] = useState<{
    active: boolean;
    launchId: number;
    startedAtMs: number;
  }>({
    active: false,
    launchId: 0,
    startedAtMs: 0,
  });
  const whiteHouseRaidStopRef = useRef<(() => void) | null>(null);
  const whiteHouseRaidActiveRef = useRef<boolean>(false);

  useEffect(() => {
    whiteHouseRaidActiveRef.current = whiteHouseRaid.active;
  }, [whiteHouseRaid.active]);

  const nearbyItems = useMemo(
    () => getNearbyInteractItems(charPos.x, charPos.y, activeScene),
    [charPos.x, charPos.y, activeScene]
  );

  const maskZones = useMemo(
    () => activeScene.zones.filter((z) => z.collisionType === 'mask'),
    [activeScene.zones]
  );

  const visiblePlayCharacters = useMemo(
    () => (activeScene.characters || []).filter((ch) => ch.visible !== false),
    [activeScene.characters]
  );

  const visibleStageCharacters = useMemo(
    () =>
      engineMode === 'characters'
        ? activeScene.characters || []
        : visiblePlayCharacters,
    [activeScene.characters, engineMode, visiblePlayCharacters]
  );

  const activeCameraZoom =
    engineMode === 'play' ? Math.max(1, activeScene.cameraZoom ?? 1) : 1;

  const cameraTransformStyle = useMemo<React.CSSProperties>(() => {
    if (activeCameraZoom <= 1.001) {
      return {};
    }
    const minShift = 100 / activeCameraZoom - 100;
    const tx = Math.min(0, Math.max(minShift, 50 / activeCameraZoom - charPos.x));
    const ty = Math.min(0, Math.max(minShift, 50 / activeCameraZoom - charPos.y));
    return {
      transformOrigin: '0 0',
      transform: `scale(${activeCameraZoom}) translate(${tx}%, ${ty}%)`,
      willChange: 'transform',
    };
  }, [activeCameraZoom, charPos.x, charPos.y]);

  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [newSceneModalOpen, setNewSceneModalOpen] = useState<boolean>(false);
  const [newSceneName, setNewSceneName] = useState<string>('');
  const [newSceneImageData, setNewSceneImageData] = useState<string>('');
  const [confirmDeleteSceneId, setConfirmDeleteSceneId] = useState<string | null>(null);

  // Day & Hour counter state (persisted locally)
  const [showDayCounter, setShowDayCounter] = useState<boolean>(true);
  const [currentDay, setCurrentDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('executive_scene_day_v1');
      const parsed = saved ? parseInt(saved, 10) : 1;
      return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
    } catch {
      return 1;
    }
  });
  const [currentHour, setCurrentHour] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('executive_scene_hour_v1');
      const parsed = saved ? parseInt(saved, 10) : 9;
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 23 ? parsed : 9;
    } catch {
      return 9;
    }
  });

  // Twittly news & user-created game events state (persisted locally)
  const [twittlyPosts, setTwittlyPosts] = useState<TwittlyPost[]>(() => {
    try {
      const saved = localStorage.getItem('executive_twittly_posts_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage issues
    }
    return DEFAULT_TWITTLY_POSTS;
  });
  const [unreadTwittly, setUnreadTwittly] = useState<number>(1);

  // Characteristics storage & template/custom bills state (always restore DEFCON to 5 / 4 at game start)
  const [characteristics, setCharacteristics] = useState<NationCharacteristics>(() => {
    try {
      const saved = localStorage.getItem(CHARACTERISTICS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const merged: NationCharacteristics = { ...DEFAULT_CHARACTERISTICS, ...parsed };
          // Always restore Diplomacy to at least 75 (DEFCON 5) or 65 (DEFCON 4) at the start of the game
          if (typeof merged.diplomacy !== 'number' || merged.diplomacy < 65) {
            merged.diplomacy = DEFAULT_CHARACTERISTICS.diplomacy;
          }
          if (typeof merged.security !== 'number' || merged.security <= 0) {
            merged.security = DEFAULT_CHARACTERISTICS.security;
          }
          if (typeof merged.approval !== 'number' || merged.approval <= 0) {
            merged.approval = DEFAULT_CHARACTERISTICS.approval;
          }
          return merged;
        }
      }
    } catch {
      // Ignore storage issues
    }
    return DEFAULT_CHARACTERISTICS;
  });

  const [bills, setBills] = useState<PolicyBill[]>(() => {
    try {
      const seeded97 = localStorage.getItem(BILLS_97_SEED_KEY);
      if (!seeded97) {
        localStorage.setItem(BILLS_97_SEED_KEY, '1');
        localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(DEFAULT_POLICY_BILLS));
        localStorage.removeItem(DAILY_DESK_BATCH_STORAGE_KEY);
        return DEFAULT_POLICY_BILLS;
      }
      const saved = localStorage.getItem(BILLS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage issues
    }
    return DEFAULT_POLICY_BILLS;
  });

  const [signedBills, setSignedBills] = useState<Record<string, SignedBillRecord>>(() => {
    try {
      const saved = localStorage.getItem(SIGNED_BILLS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // Ignore storage issues
    }
    return {};
  });

  const [vetoedBills, setVetoedBills] = useState<Record<string, VetoedBillRecord>>(() => {
    try {
      const saved = localStorage.getItem(VETOED_BILLS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // Ignore storage issues
    }
    return {};
  });

  // Daily batch of 3-4 unhandled bills on the Resolute Desk per in-game day
  const [dailyDeskBatch, setDailyDeskBatch] = useState<{
    day: number;
    billIds: string[];
  }>(() => {
    try {
      const saved = localStorage.getItem(DAILY_DESK_BATCH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.day === 'number' &&
          Array.isArray(parsed.billIds) &&
          parsed.billIds.length > 0
        ) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage issues
    }
    return {
      day: 1,
      billIds: pickDailyBillBatchIds(DEFAULT_POLICY_BILLS, {}, {}, 1),
    };
  });

  // Sleep / Inauguration transition overlay state
  const [sleepTransition, setSleepTransition] = useState<DayTransitionState | null>(null);
  const sleepTimerRef = useRef<number | null>(null);

  // Prologue Rally state (runs right after clicking Start Game on Intro, then transitions to Oval Office Day 1)
  const [isPrologueRally, setIsPrologueRally] = useState<boolean>(true);
  const isPrologueRallyRef = useRef<boolean>(true);

  // Daily Random Event (100 events pool, 1 per day with Twittly notification + ding)
  const [dailyEventToast, setDailyEventToast] = useState<{
    id: number;
    day: number;
    event: DailyRandomEvent;
    statLabel: string;
  } | null>(null);
  const dailyEventToastTimerRef = useRef<number | null>(null);
  const usedDailyEventIdsRef = useRef<Set<string>>(new Set());
  const lastTriggeredEventDayRef = useRef<number>(0);

  const [heliFlight, setHeliFlight] = useState<{
    active: boolean;
    phase: HelicopterFlightPhase;
    progress: number;
    boarded: boolean;
    fadeOpacity: number;
  }>({
    active: false,
    phase: 'idle',
    progress: 0,
    boarded: false,
    fadeOpacity: 0,
  });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const doorPreviewRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileUploadRef = useRef<HTMLInputElement | null>(null);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const charPosRef = useRef<Point2D>(activeScene.spawn);
  const charDirRef = useRef<Direction>('down');
  const isMovingRef = useRef<boolean>(false);
  const setCharDirSafe = useCallback((nextDir: Direction) => {
    if (charDirRef.current === nextDir) return;
    charDirRef.current = nextDir;
    setCharDir(nextDir);
  }, []);
  const setIsMovingSafe = useCallback((nextMoving: boolean) => {
    if (isMovingRef.current === nextMoving) return;
    isMovingRef.current = nextMoving;
    setIsMoving(nextMoving);
  }, []);
  const clickTargetRef = useRef<Point2D | null>(null);
  const activeSceneRef = useRef<SceneData>(activeScene);
  const scenesRef = useRef<SceneData[]>(scenes);
  const heliFlightActiveRef = useRef<boolean>(false);
  const heliFlightStopRef = useRef<(() => void) | null>(null);
  const pendingSpawnRef = useRef<{
    sceneId: string;
    spawn: Point2D;
    direction?: Direction;
  } | null>(null);

  useEffect(() => {
    heliFlightActiveRef.current = heliFlight.active;
  }, [heliFlight.active]);

  useEffect(() => {
    if (
      heliFlightActiveRef.current &&
      (engineMode !== 'play' || activeSceneId !== 'white-house-south-lawn')
    ) {
      heliFlightStopRef.current?.();
      heliFlightStopRef.current = null;
    }
  }, [engineMode, activeSceneId]);

  useEffect(() => {
    return () => {
      heliFlightStopRef.current?.();
      heliFlightStopRef.current = null;
    };
  }, []);

  useEffect(() => {
    activeSceneRef.current = activeScene;
  }, [activeScene]);

  useEffect(() => {
    scenesRef.current = scenes;
  }, [scenes]);

  const persistWorldStateToServer = useCallback(
    async (scenesToSave: SceneData[], billsToSave?: PolicyBill[]) => {
      const now = Date.now();
      try {
        localStorage.setItem(ENGINE_STORAGE_KEY, JSON.stringify(scenesToSave));
        localStorage.setItem(ENGINE_SAVED_AT_KEY, String(now));
      } catch {
        // Ignore quota exceeded on large uploaded images
      }
      setWorldSaveStatus('saving');
      try {
        await fetch('/api/world-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updatedAt: now,
            scenes: scenesToSave,
            ...(billsToSave ? { bills: billsToSave } : {}),
          }),
        });
        setWorldSaveStatus('saved');
      } catch {
        setWorldSaveStatus('saved');
      }
    },
    []
  );

  // On mount, check if the server has a newer savedWorldState.json on disk
  useEffect(() => {
    let cancelled = false;
    fetch('/api/world-state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const diskUpdatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : 0;
        const localSavedAt = Number(localStorage.getItem(ENGINE_SAVED_AT_KEY) || '0');
        if (Array.isArray(data.scenes) && data.scenes.length > 0 && diskUpdatedAt > localSavedAt) {
          const normalized = normalizeBuiltInSceneImages(data.scenes);
          setScenes(normalized);
          try {
            localStorage.setItem(ENGINE_STORAGE_KEY, JSON.stringify(normalized));
            localStorage.setItem(ENGINE_SAVED_AT_KEY, String(diskUpdatedAt));
          } catch {
            // Ignore storage issues
          }
        }
        hasHydratedWorldRef.current = true;
      })
      .catch(() => {
        hasHydratedWorldRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist scenes (including all zones, obstacles, doors, masks, floor bounds, characters & props) to localStorage AND src/data/savedWorldState.json
  useEffect(() => {
    const now = Date.now();
    try {
      localStorage.setItem(ENGINE_STORAGE_KEY, JSON.stringify(scenes));
      localStorage.setItem(ENGINE_SAVED_AT_KEY, String(now));
    } catch {
      // Ignore quota exceeded on large uploaded images
    }
    const timer = window.setTimeout(() => {
      void persistWorldStateToServer(scenes);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [scenes, persistWorldStateToServer]);

  // Persist Twittly posts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('executive_twittly_posts_v1', JSON.stringify(twittlyPosts));
    } catch {
      // Ignore storage issues
    }
  }, [twittlyPosts]);

  // Persist characteristics, bills, and signed bills to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHARACTERISTICS_STORAGE_KEY, JSON.stringify(characteristics));
    } catch {
      // Ignore storage issues
    }
  }, [characteristics]);

  useEffect(() => {
    try {
      localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
    } catch {
      // Ignore storage issues
    }
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem(SIGNED_BILLS_STORAGE_KEY, JSON.stringify(signedBills));
    } catch {
      // Ignore storage issues
    }
  }, [signedBills]);

  useEffect(() => {
    try {
      localStorage.setItem(VETOED_BILLS_STORAGE_KEY, JSON.stringify(vetoedBills));
    } catch {
      // Ignore storage issues
    }
  }, [vetoedBills]);

  useEffect(() => {
    try {
      localStorage.setItem(DAILY_DESK_BATCH_STORAGE_KEY, JSON.stringify(dailyDeskBatch));
    } catch {
      // Ignore storage issues
    }
  }, [dailyDeskBatch]);

  // Whenever currentDay changes (or if current batch has no valid bill IDs in bills), deal a fresh 3-4 bill batch for the day
  useEffect(() => {
    const validIds = dailyDeskBatch.billIds.filter((id) =>
      bills.some((b) => b.id === id && b.activeOnDesk !== false)
    );
    if (dailyDeskBatch.day !== currentDay || validIds.length === 0) {
      const nextIds = pickDailyBillBatchIds(bills, signedBills, vetoedBills, currentDay);
      setDailyDeskBatch({ day: currentDay, billIds: nextIds });
    }
  }, [currentDay, bills, signedBills, vetoedBills, dailyDeskBatch.day, dailyDeskBatch.billIds]);

  // Persist day & hour counter to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('executive_scene_day_v1', String(currentDay));
      localStorage.setItem('executive_scene_hour_v1', String(currentHour));
    } catch {
      // Ignore storage issues
    }
  }, [currentDay, currentHour]);

  // Advance in-game hour smoothly in Play Mode (1 hour every 10 seconds)
  useEffect(() => {
    if (engineMode !== 'play' || tacticalNuke.active || terroristBomb.active || whiteHouseRaid.active) return;
    const timer = setInterval(() => {
      setCurrentHour((prevHour) => {
        if (prevHour >= 23) {
          setCurrentDay((d) => {
            const nextDay = d + 1;
            setTwittlyPosts((posts) => [
              {
                id: `day-${nextDay}-${Date.now()}`,
                author: 'Capitol Wire',
                handle: '@CapitolWire',
                avatarColor: '#1D4ED8',
                verified: true,
                tag: 'PRESS',
                content: `Day ${nextDay} begins at the White House. Morning schedule and press briefs are now underway.`,
                day: nextDay,
                hour: 0,
                likes: 84,
                reposts: 19,
              },
              ...posts,
            ]);
            setUnreadTwittly((u) => u + 1);
            return nextDay;
          });
          return 0;
        }
        return prevHour + 1;
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [engineMode, tacticalNuke.active, terroristBomb.active, whiteHouseRaid.active]);

  const handleCreateTwittlyEvent = useCallback(
    (payload: {
      content: string;
      tag: TwittlyTag;
      author?: string;
      handle?: string;
      avatarColor?: string;
    }) => {
      const newPost: TwittlyPost = {
        id: `event-${Date.now()}`,
        author: payload.author || 'Executive Desk',
        handle: payload.handle || '@POTUS',
        avatarColor: payload.avatarColor || '#B91C1C',
        verified: true,
        tag: payload.tag,
        content: payload.content,
        day: currentDay,
        hour: currentHour,
        likes: 1,
        reposts: 0,
        isUserEvent: true,
      };
      setTwittlyPosts((prev) => [newPost, ...prev]);
    },
    [currentDay, currentHour]
  );

  const handleToggleTwittlyLike = useCallback((postId: string) => {
    setTwittlyPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !p.liked,
              likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1,
            }
          : p
      )
    );
  }, []);

  const handleToggleTwittlyRepost = useCallback((postId: string) => {
    setTwittlyPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              reposted: !p.reposted,
              reposts: p.reposted ? Math.max(0, p.reposts - 1) : p.reposts + 1,
            }
          : p
      )
    );
  }, []);

  const handleDeleteTwittlyPost = useCallback((postId: string) => {
    setTwittlyPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  // Helper to update current scene cleanly
  const updateActiveScene = useCallback(
    (updater: (scene: SceneData) => SceneData) => {
      setScenes((prev) =>
        prev.map((s) => (s.id === activeScene.id ? updater(s) : s))
      );
    },
    [activeScene.id]
  );

  const handleSignBill = useCallback(
    (bill: PolicyBill, signatureDataUrl: string) => {
      setSignedBills((prev) => {
        if (prev[bill.id]) return prev;
        return {
          ...prev,
          [bill.id]: {
            billId: bill.id,
            signatureDataUrl,
            signedDay: currentDay,
            signedHour: currentHour,
          },
        };
      });

      setCharacteristics((prev) => {
        const next = { ...prev };
        for (const meta of CHARACTERISTIC_META) {
          const delta = bill.effects[meta.key] ?? 0;
          if (delta !== 0) {
            next[meta.key] = Math.max(0, Math.min(100, (next[meta.key] ?? 50) + delta));
          }
        }
        return next;
      });

      const reactions = ensureBillThreeReactions(bill).filter(
        (r) => r.content.trim().length > 0
      );

      const officialPost: TwittlyPost = {
        id: `tw-sign-${bill.id}-${Date.now()}`,
        author: 'Executive Desk',
        handle: '@POTUS',
        avatarColor: '#B91C1C',
        verified: true,
        tag: 'POLICY',
        content: `Signed ${bill.code} (${bill.title}) at the Resolute Executive Desk.`,
        day: currentDay,
        hour: currentHour,
        likes: 42,
        reposts: 14,
        isUserEvent: true,
      };

      const reactionPosts: TwittlyPost[] = reactions.map((rx, idx) => {
        const moodMeta = REACTION_MOODS.find((m) => m.mood === rx.mood);
        const cleanHandle = (rx.handle || '@citizen').trim();
        return {
          id: `tw-rx-${bill.id}-${idx}-${Date.now()}`,
          author: (rx.author || `Citizen #${idx + 1}`).trim(),
          handle: cleanHandle.startsWith('@') ? cleanHandle : `@${cleanHandle}`,
          avatarColor: moodMeta?.avatarColor || '#0284C7',
          verified: false,
          tag: 'POLICY',
          mood: rx.mood,
          content: rx.content.trim(),
          day: currentDay,
          hour: currentHour,
          likes: 15 + idx * 9,
          reposts: 4 + idx * 3,
          isUserEvent: true,
        };
      });

      setTwittlyPosts((prev) => [...reactionPosts, officialPost, ...prev]);
      setUnreadTwittly((u) => u + 1 + reactionPosts.length);
    },
    [currentDay, currentHour]
  );

  const handleVetoBill = useCallback(
    (bill: PolicyBill) => {
      setVetoedBills((prev) => {
        if (prev[bill.id]) return prev;
        return {
          ...prev,
          [bill.id]: {
            billId: bill.id,
            vetoedDay: currentDay,
            vetoedHour: currentHour,
          },
        };
      });

      const vetoPost: TwittlyPost = {
        id: `tw-veto-${bill.id}-${Date.now()}`,
        author: 'Executive Desk',
        handle: '@POTUS',
        avatarColor: '#B91C1C',
        verified: true,
        tag: 'POLICY',
        content: `VETOED ${bill.code} (${bill.title}) and tossed it straight off the Resolute Desk!`,
        day: currentDay,
        hour: currentHour,
        likes: 64,
        reposts: 22,
        isUserEvent: true,
      };

      setTwittlyPosts((prev) => [vetoPost, ...prev]);
      setUnreadTwittly((u) => u + 1);
    },
    [currentDay, currentHour]
  );

  const startMarineOneFlight = useCallback(() => {
    if (heliFlightActiveRef.current) return;

    heliFlightStopRef.current?.();
    clickTargetRef.current = null;
    setClickTarget(null);
    setActiveInteraction(null);
    pressedKeysRef.current.clear();

    const officeScene =
      scenesRef.current.find((s) => s.id === 'presidents-office-daylight') ||
      BUILT_IN_SCENES[0];

    const startPos = { ...charPosRef.current };
    const stairFoot: Point2D = { x: 74.8, y: 45.0 };
    const cabinEntry: Point2D = { x: 74.2, y: 40.5 };

    const BOARD_MS = 900;
    const SPOOL_MS = 1350;
    const TAKEOFF_MS = 1200;
    const FLY_MS = 2050;
    const TOTAL_MS = BOARD_MS + SPOOL_MS + TAKEOFF_MS + FLY_MS;

    const stopSound = playHelicopterTakeoffSound();
    let cancelled = false;
    let rafId = 0;
    let fadeOutTimer = 0;
    const startTime = performance.now();
    let stepFrameAcc = 0;
    let lastTime = startTime;

    heliFlightActiveRef.current = true;
    setHeliFlight({
      active: true,
      phase: 'boarding',
      progress: 0,
      boarded: false,
      fadeOpacity: 0,
    });

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const elapsed = now - startTime;

      if (elapsed < BOARD_MS) {
        const p = Math.min(1, elapsed / BOARD_MS);
        let nx = startPos.x;
        let ny = startPos.y;
        if (p < 0.72) {
          const walkT = p / 0.72;
          nx = startPos.x + (stairFoot.x - startPos.x) * walkT;
          ny = startPos.y + (stairFoot.y - startPos.y) * walkT;
          const dx = stairFoot.x - startPos.x;
          const dy = stairFoot.y - startPos.y;
          if (Math.abs(dx) > Math.abs(dy)) {
            setCharDirSafe(dx >= 0 ? 'right' : 'left');
          } else {
            setCharDirSafe(dy >= 0 ? 'down' : 'up');
          }
        } else {
          const climbT = (p - 0.72) / 0.28;
          nx = stairFoot.x + (cabinEntry.x - stairFoot.x) * climbT;
          ny = stairFoot.y + (cabinEntry.y - stairFoot.y) * climbT;
          setCharDirSafe('up');
        }
        charPosRef.current = { x: nx, y: ny };
        setCharPos({ x: nx, y: ny });
        setIsMovingSafe(p < 0.94);
        stepFrameAcc += dt;
        if (stepFrameAcc >= 0.11) {
          stepFrameAcc = 0;
          setWalkFrame((f) => (f + 1) % 4);
        }
        setHeliFlight({
          active: true,
          phase: 'boarding',
          progress: p,
          boarded: p >= 0.94,
          fadeOpacity: 0,
        });
        rafId = requestAnimationFrame(tick);
        return;
      }

      setIsMovingSafe(false);

      if (elapsed < BOARD_MS + SPOOL_MS) {
        const p = (elapsed - BOARD_MS) / SPOOL_MS;
        setHeliFlight({
          active: true,
          phase: 'spooling',
          progress: p,
          boarded: true,
          fadeOpacity: 0,
        });
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (elapsed < BOARD_MS + SPOOL_MS + TAKEOFF_MS) {
        const p = (elapsed - BOARD_MS - SPOOL_MS) / TAKEOFF_MS;
        setHeliFlight({
          active: true,
          phase: 'takeoff',
          progress: p,
          boarded: true,
          fadeOpacity: 0,
        });
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (elapsed < TOTAL_MS) {
        const p = (elapsed - BOARD_MS - SPOOL_MS - TAKEOFF_MS) / FLY_MS;
        const fadeOpacity = p > 0.76 ? Math.min(1, (p - 0.76) / 0.24) : 0;
        setHeliFlight({
          active: true,
          phase: 'flying',
          progress: p,
          boarded: true,
          fadeOpacity,
        });
        rafId = requestAnimationFrame(tick);
        return;
      }

      // Teleport smoothly back to the President's Office
      heliFlightActiveRef.current = false;
      pendingSpawnRef.current = {
        sceneId: officeScene.id,
        spawn: { x: 50, y: 53 },
        direction: 'down',
      };
      setActiveSceneId(officeScene.id);
      setHeliFlight({
        active: false,
        phase: 'idle',
        progress: 0,
        boarded: false,
        fadeOpacity: 1,
      });

      fadeOutTimer = window.setTimeout(() => {
        setHeliFlight((prev) => ({ ...prev, fadeOpacity: 0 }));
      }, 90);
    };

    heliFlightStopRef.current = () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(fadeOutTimer);
      stopSound();
      heliFlightActiveRef.current = false;
      setIsMovingSafe(false);
      setHeliFlight({
        active: false,
        phase: 'idle',
        progress: 0,
        boarded: false,
        fadeOpacity: 0,
      });
    };

    rafId = requestAnimationFrame(tick);
  }, []);

  const playSleepChime = useCallback(() => {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      const notes = [392.0, 493.88, 587.33, 783.99];
      notes.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.16;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.065, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.5);
      });
      window.setTimeout(() => {
        if (ctx.state !== 'closed') {
          void ctx.close();
        }
      }, 1500);
    } catch {
      // Ignore audio errors
    }
  }, []);

  const playDailyEventDing = useCallback(() => {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      const now = ctx.currentTime;

      // Crisp two-tone Twittly notification bell ding (A5 -> E6)
      const tones = [
        { freq: 880, delay: 0, dur: 0.18, peak: 0.14 },
        { freq: 1318.51, delay: 0.11, dur: 0.42, peak: 0.18 },
      ];
      tones.forEach((t) => {
        const start = now + t.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(t.freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(t.peak, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + t.dur + 0.02);
      });

      window.setTimeout(() => {
        if (ctx.state !== 'closed') {
          void ctx.close();
        }
      }, 900);
    } catch {
      // Ignore audio errors
    }
  }, []);

  const triggerDailyRandomEvent = useCallback(
    (dayNum: number) => {
      const chosen = pickRandomDailyEvent(usedDailyEventIdsRef.current);
      usedDailyEventIdsRef.current.add(chosen.id);
      if (usedDailyEventIdsRef.current.size >= DAILY_RANDOM_EVENTS.length) {
        usedDailyEventIdsRef.current.clear();
      }

      const statLabel = CHARACTERISTIC_SHORT_LABELS[chosen.characteristic];
      const sign = chosen.delta > 0 ? '+' : '';

      playDailyEventDing();

      setCharacteristics((prev) => {
        const currentVal = prev[chosen.characteristic] ?? 50;
        const nextVal = Math.max(0, Math.min(100, currentVal + chosen.delta));
        return {
          ...prev,
          [chosen.characteristic]: nextVal,
        };
      });

      const eventPost: TwittlyPost = {
        id: `daily-evt-${dayNum}-${Date.now()}`,
        author: chosen.author,
        handle: chosen.handle,
        avatarColor: chosen.avatarColor,
        verified: true,
        tag: chosen.tag,
        content: `${chosen.headline} [${statLabel} ${sign}${chosen.delta}%]`,
        day: dayNum,
        hour: currentHour,
        likes: 120 + Math.floor(Math.random() * 240),
        reposts: 35 + Math.floor(Math.random() * 90),
        isUserEvent: true,
      };

      setTwittlyPosts((prev) => [eventPost, ...prev]);
      setUnreadTwittly((u) => u + 1);

      if (dailyEventToastTimerRef.current !== null) {
        window.clearTimeout(dailyEventToastTimerRef.current);
      }
      setDailyEventToast({
        id: Date.now() + Math.random(),
        day: dayNum,
        event: chosen,
        statLabel,
      });
      dailyEventToastTimerRef.current = window.setTimeout(() => {
        setDailyEventToast(null);
        dailyEventToastTimerRef.current = null;
      }, 6200);
    },
    [playDailyEventDing, currentHour]
  );

  const handleSleepInBedroom = useCallback(() => {
    if (sleepTransition?.active) return;
    clickTargetRef.current = null;
    setClickTarget(null);
    setActiveInteraction(null);
    pressedKeysRef.current.clear();
    playSleepChime();

    const fromDay = currentDay;
    const toDay = currentDay + 1;
    const nextBatchIds = pickDailyBillBatchIds(bills, signedBills, vetoedBills, toDay);

    setSleepTransition({
      active: true,
      mode: 'sleep',
      fromDay,
      toDay,
      deliveredCount: nextBatchIds.length,
    });

    setCurrentDay(toDay);
    setCurrentHour(9);
    setDailyDeskBatch({ day: toDay, billIds: nextBatchIds });

    setTwittlyPosts((posts) => [
      {
        id: `sleep-day-${toDay}-${Date.now()}`,
        author: 'White House Pool',
        handle: '@WHPressPool',
        avatarColor: '#1D4ED8',
        verified: true,
        tag: 'PRESS',
        content: `Good morning from the White House! Day ${toDay} begins at 09:00 AM with ${nextBatchIds.length} new policy bills delivered to the Resolute Desk.`,
        day: toDay,
        hour: 9,
        likes: 96,
        reposts: 24,
      },
      ...posts,
    ]);
    setUnreadTwittly((u) => u + 1);

    if (sleepTimerRef.current !== null) {
      window.clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
  }, [
    sleepTransition?.active,
    playSleepChime,
    currentDay,
    bills,
    signedBills,
    vetoedBills,
  ]);

  const triggerWakeUpVoiceline = useCallback(() => {
    const wakeUpText = '*CHATTER* "I\'M AWAKE, VERY AWAKE!"';
    const wakeUpAudioUrl = './audio/potus_wake_up.mp3';

    if (chatterClearTimerRef.current !== null) {
      window.clearTimeout(chatterClearTimerRef.current);
      chatterClearTimerRef.current = null;
    }

    setActiveChatterText(wakeUpText);
    speakVoiceline(wakeUpText, 'narrator', wakeUpAudioUrl);

    chatterClearTimerRef.current = window.setTimeout(() => {
      setActiveChatterText(null);
      chatterClearTimerRef.current = null;
    }, 3400);
  }, []);

  const handleDismissSleepTransition = useCallback(() => {
    const wasSleeping = sleepTransition?.mode === 'sleep';
    setSleepTransition(null);
    if (wasSleeping) {
      triggerWakeUpVoiceline();
    }
  }, [sleepTransition?.mode, triggerWakeUpVoiceline]);

  const handleInteractZone = useCallback(
    (zone: MapZone) => {
      if (heliFlightActiveRef.current) return;

      if (zone.id === 'marine-one-helicopter') {
        startMarineOneFlight();
        return;
      }

      if (zone.id === 'presidential-bed') {
        handleSleepInBedroom();
        return;
      }

      if (zone.opensModal === 'desk-phone' || zone.id === 'desk-phone') {
        clickTargetRef.current = null;
        setClickTarget(null);
        setActiveInteraction(null);
        setIsDeskPhoneOpen(true);
        return;
      }

      if (zone.opensModal === 'resolute-desk' || zone.id === 'resolute-desk') {
        clickTargetRef.current = null;
        setClickTarget(null);
        setActiveInteraction(null);
        setIsResoluteDeskOpen(true);
        return;
      }

      if (zone.opensModal === 'world-map' || zone.id === 'coffee-table') {
        clickTargetRef.current = null;
        setClickTarget(null);
        setActiveInteraction(null);
        setIsWorldMapOpen(true);
        return;
      }

    if (zone.targetSceneId) {
      const target = scenesRef.current.find((s) => s.id === zone.targetSceneId);
      if (target) {
        const targetDoor = zone.targetDoorId
          ? target.zones.find((z) => z.id === zone.targetDoorId)
          : undefined;
        const smart = targetDoor ? computeSmartLandingForDoor(targetDoor) : null;
        const resolvedSpawn = zone.targetSpawn || smart?.spawn || target.spawn;
        const resolvedDir = zone.targetDirection || smart?.direction;

        const finalSpawn = target.lockCharacter ? target.spawn : resolvedSpawn;
        const finalDir =
          (target.lockCharacter ? target.spawnDirection : resolvedDir) ||
          target.spawnDirection ||
          (finalSpawn.y > 65 ? 'up' : 'down');

        if (target.id === activeSceneRef.current.id) {
          charPosRef.current = finalSpawn;
          setCharPos(finalSpawn);
          setCharDirSafe(finalDir);
          setIsMovingSafe(false);
          setWalkFrame(0);
          clickTargetRef.current = null;
          setClickTarget(null);
          setActiveInteraction(null);
          return;
        }

        // Immediately sync refs and state before scene render so there is zero 1-frame ghosting or teleport jump
        pendingSpawnRef.current = {
          sceneId: target.id,
          spawn: finalSpawn,
          direction: finalDir,
        };
        activeSceneRef.current = target;
        charPosRef.current = finalSpawn;
        setCharPos(finalSpawn);
        setCharDirSafe(finalDir);
        setIsMovingSafe(false);
        setWalkFrame(0);
        clickTargetRef.current = null;
        setClickTarget(null);
        setActiveInteraction(null);
        setActiveSceneId(target.id);
        return;
      }
    }
      if (zone.id === 'rally-podium') {
        const podiumSpot: Point2D = { x: 50, y: 42.5 };
        charPosRef.current = podiumSpot;
        setCharPos(podiumSpot);
        setCharDirSafe('down');
        clickTargetRef.current = null;
        setClickTarget(null);

        if (rallyCheerTimerRef.current !== null) {
          window.clearTimeout(rallyCheerTimerRef.current);
        }
        setRallyCheerActive(true);
        rallyCheerTimerRef.current = window.setTimeout(() => {
          setRallyCheerActive(false);
          rallyCheerTimerRef.current = null;
        }, 6000);

        setCharacteristics((prev) => ({
          ...prev,
          approval: Math.min(100, (prev.approval ?? 50) + 5),
          media: Math.min(100, (prev.media ?? 50) + 3),
        }));

        handleCreateTwittlyEvent({
          content:
            'LIVE FROM THE RALLY STAGE: What an incredible, record-breaking crowd tonight! Nobody has ever seen energy like this! USA!',
          tag: 'EVENT',
          author: 'Executive Desk',
          handle: '@POTUS',
          avatarColor: '#B91C1C',
        });
        setUnreadTwittly((u) => u + 1);
      }

      setActiveInteraction((prev) => (prev?.id === zone.id ? null : zone));
    },
    [startMarineOneFlight, handleSleepInBedroom, handleCreateTwittlyEvent]
  );

  const handleInteractCharacter = useCallback((ch: SceneCharacterItem) => {
    const asInteraction: MapZone = {
      id: ch.id,
      label: ch.label,
      xPercent: ch.xPercent,
      yPercent: ch.yPercent,
      widthPercent: 4,
      heightPercent: 4,
      collisionType: 'interactive',
      description: ch.dialogue || 'Standing watch.',
    };
    setActiveInteraction((prev) => (prev?.id === ch.id ? null : asInteraction));
  }, []);

  const completePrologueRallyToOffice = useCallback(() => {
    isPrologueRallyRef.current = false;
    setIsPrologueRally(false);
    rallyEventCancelRef.current?.();
    rallyEventCancelRef.current = null;
    setRallyEventPhase('idle');
    setRallyShotFlash(false);
    setRallyCheerActive(false);

    const day1Batch = pickDailyBillBatchIds(bills, signedBills, vetoedBills, 1);
    setCurrentDay(1);
    setCurrentHour(9);
    setDailyDeskBatch({ day: 1, billIds: day1Batch });
    lastTriggeredEventDayRef.current = 0;

    const officeScene =
      scenesRef.current.find((s) => s.id === 'presidents-office-daylight') ||
      BUILT_IN_SCENES[0];
    pendingSpawnRef.current = null;
    activeSceneRef.current = officeScene;
    charPosRef.current = officeScene.spawn;
    setCharPos(officeScene.spawn);
    setCharDirSafe('down');
    setIsMovingSafe(false);
    setWalkFrame(0);
    clickTargetRef.current = null;
    setClickTarget(null);
    setActiveInteraction(null);
    setActiveSceneId('presidents-office-daylight');
    setEngineMode('play');

    playSleepChime();
    setSleepTransition({
      active: true,
      mode: 'inauguration',
      fromDay: 1,
      toDay: 1,
      deliveredCount: day1Batch.length,
      headerText: 'CAMPAIGN RALLY SURVIVED · INAUGURATION',
      titleText: 'DAY 1 BEGINS · OVAL OFFICE',
      subText: '09:00 AM · Step up to the Resolute Desk to review your first batch of bills',
    });

    if (sleepTimerRef.current !== null) {
      window.clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
  }, [bills, signedBills, vetoedBills, playSleepChime, setCharDirSafe, setIsMovingSafe]);

  const startRallyEventSequence = useCallback(() => {
    rallyEventCancelRef.current?.();

    let cancelled = false;
    let stopShotsSound: (() => void) | null = null;
    const timers: number[] = [];

    rallyEventCancelRef.current = () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      stopShotsSound?.();
      stopVoiceline();
    };

    // Phase 1: Speaking at podium before shots ("...take a look at what happened")
    setRallyEventPhase('speaking');
    setRallyCheerActive(true);
    setRallyShotFlash(false);

    playVoicelineAndWait('', 'narrator', RALLY_PRE_SHOT_SPEECH_CLIP).then(() => {
      if (cancelled) return;

      // Phase 2: Single high-velocity shot rings out from the front
      stopShotsSound = playRallyShotsSound();
      setRallyShotFlash(true);

      const duckTimer = window.setTimeout(() => {
        if (!cancelled) setRallyEventPhase('ducking');
      }, 115);
      timers.push(duckTimer);

      const flashOffTimer = window.setTimeout(() => {
        if (!cancelled) setRallyShotFlash(false);
      }, 580);
      timers.push(flashOffTimer);

      // Phase 3: Trump rises with raised fist & plays "Bad shot, terrible shot..." (4edf5d25.mp3)
      const riseTimer = window.setTimeout(() => {
        if (cancelled) return;
        setRallyEventPhase('fist-raised');
        playVoicelineAndWait('', 'narrator', RALLY_POST_SHOT_FIST_CLIP).then(() => {
          if (cancelled) return;
          if (isPrologueRallyRef.current) {
            const finishTimer = window.setTimeout(() => {
              if (!cancelled && isPrologueRallyRef.current) {
                completePrologueRallyToOffice();
              }
            }, 1400);
            timers.push(finishTimer);
          }
        });
      }, 1650);
      timers.push(riseTimer);
    });
  }, [completePrologueRallyToOffice]);

  const handleStartGameFromIntro = useCallback(() => {
    isPrologueRallyRef.current = true;
    setIsPrologueRally(true);

    // Always restore DEFCON to 5 (or 4) and reset starting stats at the start of the game
    const startDiplomacy = Math.random() < 0.65 ? 80 : 68; // 80 -> DEFCON 5, 68 -> DEFCON 4
    const freshStats: NationCharacteristics = {
      ...DEFAULT_CHARACTERISTICS,
      diplomacy: startDiplomacy,
    };
    prevDiplomacyRef.current = freshStats.diplomacy;
    prevSecurityRef.current = freshStats.security;
    prevApprovalRef.current = freshStats.approval;
    prevDefconRef.current = getDefconFromSecurity(freshStats.diplomacy);
    if (defconToastTimerRef.current !== null) {
      window.clearTimeout(defconToastTimerRef.current);
      defconToastTimerRef.current = null;
    }
    setDefconToast(null);
    setCharacteristics(freshStats);

    setCurrentDay(1);
    setCurrentHour(9);
    lastTriggeredEventDayRef.current = 0;

    const rallyScene =
      scenesRef.current.find((s) => s.id === 'presidential-rally-stage') ||
      BUILT_IN_SCENES.find((s) => s.id === 'presidential-rally-stage');
    if (rallyScene) {
      pendingSpawnRef.current = null;
      activeSceneRef.current = rallyScene;
      charPosRef.current = rallyScene.spawn;
      setCharPos(rallyScene.spawn);
    }
    setActiveSceneId('presidential-rally-stage');
    setEngineMode('play');
    setShowIntro(false);
  }, []);

  const stopTacticalNukeEvent = useCallback(() => {
    stopTacticalNukeSound();
    tacticalNukeStopRef.current?.();
    tacticalNukeStopRef.current = null;
    if (tacticalNukeAutoClearRef.current !== null) {
      window.clearTimeout(tacticalNukeAutoClearRef.current);
      tacticalNukeAutoClearRef.current = null;
    }
    tacticalNukeActiveRef.current = false;
    setTacticalNuke((prev) => ({
      active: false,
      country: null,
      launchId: prev.launchId,
      startedAtMs: 0,
    }));
  }, []);

  const stopTerroristBombEvent = useCallback(() => {
    stopTerroristBombSound();
    terroristBombStopRef.current?.();
    terroristBombStopRef.current = null;
    terroristBombActiveRef.current = false;
    setTerroristBomb((prev) => ({
      active: false,
      launchId: prev.launchId,
      startedAtMs: 0,
    }));
  }, []);

  const stopWhiteHouseRaidEvent = useCallback(() => {
    stopWhiteHouseRaidSound();
    whiteHouseRaidStopRef.current?.();
    whiteHouseRaidStopRef.current = null;
    whiteHouseRaidActiveRef.current = false;
    setWhiteHouseRaid((prev) => ({
      active: false,
      launchId: prev.launchId,
      startedAtMs: 0,
    }));
  }, []);

  const prevDiplomacyRef = useRef<number>(characteristics.diplomacy ?? 50);
  const prevSecurityRef = useRef<number>(characteristics.security ?? 50);
  const prevApprovalRef = useRef<number>(characteristics.approval ?? 50);
  const prevDefconRef = useRef<DefconLevel>(
    getDefconFromSecurity(characteristics.diplomacy ?? 50)
  );
  const [defconToast, setDefconToast] = useState<DefconToastData | null>(null);
  const defconToastTimerRef = useRef<number | null>(null);

  const handleRestartAfterNuke = useCallback(() => {
    stopTacticalNukeEvent();
    stopTerroristBombEvent();
    stopWhiteHouseRaidEvent();
    stopDefconStepSound();
    heliFlightStopRef.current?.();
    heliFlightStopRef.current = null;
    rallyEventCancelRef.current?.();
    rallyEventCancelRef.current = null;
    isPrologueRallyRef.current = false;
    setIsPrologueRally(false);
    stopVoiceline();
    pressedKeysRef.current.clear();

    setIsWorldMapOpen(false);
    setIsDeskPhoneOpen(false);
    setIsResoluteDeskOpen(false);
    setIsPhoneOpen(false);
    setRallyEventPhase('idle');
    setRallyShotFlash(false);
    setRallyCheerActive(false);

    prevDiplomacyRef.current = DEFAULT_CHARACTERISTICS.diplomacy;
    prevSecurityRef.current = DEFAULT_CHARACTERISTICS.security;
    prevApprovalRef.current = DEFAULT_CHARACTERISTICS.approval;
    prevDefconRef.current = getDefconFromSecurity(DEFAULT_CHARACTERISTICS.diplomacy);
    if (defconToastTimerRef.current !== null) {
      window.clearTimeout(defconToastTimerRef.current);
      defconToastTimerRef.current = null;
    }
    setDefconToast(null);
    if (dailyEventToastTimerRef.current !== null) {
      window.clearTimeout(dailyEventToastTimerRef.current);
      dailyEventToastTimerRef.current = null;
    }
    setDailyEventToast(null);
    lastTriggeredEventDayRef.current = 0;
    setCharacteristics(DEFAULT_CHARACTERISTICS);
    setSignedBills({});
    setVetoedBills({});
    setCurrentDay(1);
    setCurrentHour(9);
    setDailyDeskBatch({
      day: 1,
      billIds: pickDailyBillBatchIds(bills, {}, {}, 1),
    });
    setTwittlyPosts(DEFAULT_TWITTLY_POSTS);
    setUnreadTwittly(1);

    const officeScene =
      scenesRef.current.find((s) => s.id === 'presidents-office-daylight') ||
      BUILT_IN_SCENES[0];
    pendingSpawnRef.current = null;
    activeSceneRef.current = officeScene;
    charPosRef.current = officeScene.spawn;
    setCharPos(officeScene.spawn);
    setCharDirSafe('down');
    setIsMovingSafe(false);
    setWalkFrame(0);
    clickTargetRef.current = null;
    setClickTarget(null);
    setActiveInteraction(null);
    setActiveSceneId('presidents-office-daylight');
    setEngineMode('play');
  }, [stopTacticalNukeEvent, stopTerroristBombEvent, stopWhiteHouseRaidEvent]);

  const triggerTerroristBombEvent = useCallback(() => {
    stopTacticalNukeEvent();
    stopWhiteHouseRaidEvent();
    stopTerroristBombSound();
    terroristBombStopRef.current?.();
    terroristBombStopRef.current = null;
    heliFlightStopRef.current?.();
    heliFlightStopRef.current = null;
    rallyEventCancelRef.current?.();
    rallyEventCancelRef.current = null;
    stopVoiceline();
    pressedKeysRef.current.clear();

    setIsWorldMapOpen(false);
    setIsDeskPhoneOpen(false);
    setIsResoluteDeskOpen(false);
    setIsPhoneOpen(false);
    setActiveInteraction(null);
    clickTargetRef.current = null;
    setClickTarget(null);

    const nowMs = performance.now();
    terroristBombActiveRef.current = true;
    terroristBombStopRef.current = playTerroristBombSound();

    setTerroristBomb((prev) => ({
      active: true,
      launchId: prev.launchId + 1,
      startedAtMs: nowMs,
    }));

    handleCreateTwittlyEvent({
      content:
        '🚨 TERRORIST ATTACK: Armed intruder jumped the White House fence with explosives! Security at 0%!',
      tag: 'BREAKING',
      author: 'Secret Service Ops',
      handle: '@USSS_Alert',
      avatarColor: '#DC2626',
    });
    setUnreadTwittly((u) => u + 1);
  }, [stopTacticalNukeEvent, stopWhiteHouseRaidEvent, handleCreateTwittlyEvent]);

  const triggerWhiteHouseRaidEvent = useCallback(() => {
    stopTacticalNukeEvent();
    stopTerroristBombEvent();
    stopWhiteHouseRaidSound();
    whiteHouseRaidStopRef.current?.();
    whiteHouseRaidStopRef.current = null;
    heliFlightStopRef.current?.();
    heliFlightStopRef.current = null;
    rallyEventCancelRef.current?.();
    rallyEventCancelRef.current = null;
    stopVoiceline();
    pressedKeysRef.current.clear();

    setIsWorldMapOpen(false);
    setIsDeskPhoneOpen(false);
    setIsResoluteDeskOpen(false);
    setIsPhoneOpen(false);
    setActiveInteraction(null);
    clickTargetRef.current = null;
    setClickTarget(null);

    const nowMs = performance.now();
    whiteHouseRaidActiveRef.current = true;
    whiteHouseRaidStopRef.current = playWhiteHouseRaidSound();

    setWhiteHouseRaid((prev) => ({
      active: true,
      launchId: prev.launchId + 1,
      startedAtMs: nowMs,
    }));

    handleCreateTwittlyEvent({
      content:
        '🚨 WHITE HOUSE RAID: Angry protesters jumped the White House fence and stormed the Oval Office! Public Approval at 0%!',
      tag: 'BREAKING',
      author: 'Capitol Wire',
      handle: '@CapitolWire',
      avatarColor: '#DC2626',
    });
    setUnreadTwittly((u) => u + 1);
  }, [stopTacticalNukeEvent, stopTerroristBombEvent, handleCreateTwittlyEvent]);

  const triggerTacticalNukeEvent = useCallback(
    (specificCountryId?: string) => {
      // Stop any existing nuke/bomb/raid sequence & overlapping scene audio first
      stopTerroristBombEvent();
      stopWhiteHouseRaidEvent();
      stopDefconStepSound();
      stopTacticalNukeSound();
      tacticalNukeStopRef.current?.();
      tacticalNukeStopRef.current = null;
      if (tacticalNukeAutoClearRef.current !== null) {
        window.clearTimeout(tacticalNukeAutoClearRef.current);
        tacticalNukeAutoClearRef.current = null;
      }
      heliFlightStopRef.current?.();
      heliFlightStopRef.current = null;
      rallyEventCancelRef.current?.();
      rallyEventCancelRef.current = null;
      stopVoiceline();
      pressedKeysRef.current.clear();

      setIsWorldMapOpen(false);
      setIsDeskPhoneOpen(false);
      setIsResoluteDeskOpen(false);
      setIsPhoneOpen(false);
      setActiveInteraction(null);
      clickTargetRef.current = null;
      setClickTarget(null);

      // Candidate foreign countries from the World Map (excluding USA unless explicitly chosen)
      const foreignCountries = WORLD_MAP_COUNTRIES.filter((c) => c.id !== 'usa');
      const pool = foreignCountries.length > 0 ? foreignCountries : WORLD_MAP_COUNTRIES;

      const chosenCountry =
        (specificCountryId
          ? WORLD_MAP_COUNTRIES.find((c) => c.id === specificCountryId)
          : undefined) || pool[Math.floor(Math.random() * pool.length)];

      const nowMs = performance.now();
      tacticalNukeActiveRef.current = true;
      tacticalNukeStopRef.current = playTacticalNukeSound();

      const nukeReactionText =
        '*CHATTER* "OH, THAT\'S NOT GOOD. IT\'S CHINA\'S FAULT, PROBABLY!"';
      const nukeReactionAudioUrl = './audio/potus_nuke_reaction.mp3';

      if (chatterClearTimerRef.current !== null) {
        window.clearTimeout(chatterClearTimerRef.current);
        chatterClearTimerRef.current = null;
      }
      setActiveChatterText(nukeReactionText);
      speakVoiceline(nukeReactionText, 'narrator', nukeReactionAudioUrl);
      chatterClearTimerRef.current = window.setTimeout(() => {
        setActiveChatterText(null);
        chatterClearTimerRef.current = null;
      }, 9500);

      setTacticalNuke((prev) => ({
        active: true,
        country: chosenCountry,
        launchId: prev.launchId + 1,
        startedAtMs: nowMs,
      }));

      const countryDisplayName =
        chosenCountry.id === 'north-korea' ? 'North Korea' : chosenCountry.name;

      handleCreateTwittlyEvent({
        content: `🚨 DEFCON 1 EMERGENCY ALERT: ${countryDisplayName} has launched a Tactical Nuke! Incoming warhead detected on radar!`,
        tag: 'BREAKING',
        author: 'NORAD Command',
        handle: '@NORAD_Alert',
        avatarColor: '#DC2626',
      });
      setUnreadTwittly((u) => u + 1);
    },
    [stopTerroristBombEvent, stopWhiteHouseRaidEvent, handleCreateTwittlyEvent]
  );

  // Pop up DEFCON notification each time Diplomacy crosses into a new DEFCON tier (5, 4, 3, 2, 1)
  useEffect(() => {
    const dip = characteristics.diplomacy ?? 50;
    const nextDefcon = getDefconFromSecurity(dip);
    const prevDefcon = prevDefconRef.current;

    if (nextDefcon !== prevDefcon) {
      prevDefconRef.current = nextDefcon;
      if (defconToastTimerRef.current !== null) {
        window.clearTimeout(defconToastTimerRef.current);
      }
      setDefconToast({
        id: Date.now() + Math.random(),
        level: nextDefcon,
        previousLevel: prevDefcon,
        security: dip,
      });
      defconToastTimerRef.current = window.setTimeout(() => {
        setDefconToast(null);
        defconToastTimerRef.current = null;
      }, 3400);

      // Play single DEFCON alarm sound on tier transitions (DEFCON 1 at 0% Diplomacy plays the full 5->1 nuke sequence)
      if (nextDefcon !== 1 && dip > 0) {
        playDefconStepSound();
      }
    }
  }, [characteristics.diplomacy]);

  // Auto-trigger the 5->1 DEFCON Tactical Nuke bomb animation whenever Diplomacy drops to 0%
  useEffect(() => {
    const dip = characteristics.diplomacy ?? 50;
    const prevDip = prevDiplomacyRef.current;
    prevDiplomacyRef.current = dip;

    if (
      prevDip > 0 &&
      dip <= 0 &&
      !tacticalNukeActiveRef.current &&
      !terroristBombActiveRef.current &&
      !whiteHouseRaidActiveRef.current
    ) {
      triggerTacticalNukeEvent();
    }
  }, [characteristics.diplomacy, triggerTacticalNukeEvent]);

  // Auto-trigger White House Terrorist Bombing Attack whenever National Security drops to 0%
  useEffect(() => {
    const sec = characteristics.security ?? 50;
    const prevSec = prevSecurityRef.current;
    prevSecurityRef.current = sec;

    if (
      prevSec > 0 &&
      sec <= 0 &&
      !terroristBombActiveRef.current &&
      !tacticalNukeActiveRef.current &&
      !whiteHouseRaidActiveRef.current
    ) {
      triggerTerroristBombEvent();
    }
  }, [characteristics.security, triggerTerroristBombEvent]);

  // Auto-trigger White House & Oval Office Public Raid event whenever Public Approval drops to 0%
  useEffect(() => {
    const app = characteristics.approval ?? 50;
    const prevApp = prevApprovalRef.current;
    prevApprovalRef.current = app;

    if (
      prevApp > 0 &&
      app <= 0 &&
      !whiteHouseRaidActiveRef.current &&
      !terroristBombActiveRef.current &&
      !tacticalNukeActiveRef.current
    ) {
      triggerWhiteHouseRaidEvent();
    }
  }, [characteristics.approval, triggerWhiteHouseRaidEvent]);

  // Trigger 1 random daily event per in-game day (with Twittly post, ding sound, and stat gain/loss)
  useEffect(() => {
    if (
      showIntro ||
      isPrologueRally ||
      engineMode !== 'play' ||
      activeScene.id === 'presidential-rally-stage' ||
      tacticalNuke.active ||
      terroristBomb.active ||
      whiteHouseRaid.active
    ) {
      return;
    }
    if (lastTriggeredEventDayRef.current === currentDay) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (lastTriggeredEventDayRef.current !== currentDay) {
        lastTriggeredEventDayRef.current = currentDay;
        triggerDailyRandomEvent(currentDay);
      }
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [
    currentDay,
    showIntro,
    isPrologueRally,
    engineMode,
    activeScene.id,
    tacticalNuke.active,
    terroristBomb.active,
    whiteHouseRaid.active,
    triggerDailyRandomEvent,
  ]);

  const triggerPresidentialChatter = useCallback((specificClipId?: string) => {
    if (PRESIDENTIAL_CHATTER_CLIPS.length === 0) return;

    let chosenIndex = -1;
    if (specificClipId) {
      chosenIndex = PRESIDENTIAL_CHATTER_CLIPS.findIndex((c) => c.id === specificClipId);
    }
    if (chosenIndex === -1) {
      if (PRESIDENTIAL_CHATTER_CLIPS.length === 1) {
        chosenIndex = 0;
      } else {
        const candidates = PRESIDENTIAL_CHATTER_CLIPS.map((_, idx) => idx).filter(
          (idx) => idx !== lastChatterIndexRef.current
        );
        chosenIndex = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    lastChatterIndexRef.current = chosenIndex;
    const clip = PRESIDENTIAL_CHATTER_CLIPS[chosenIndex];

    if (chatterClearTimerRef.current !== null) {
      window.clearTimeout(chatterClearTimerRef.current);
      chatterClearTimerRef.current = null;
    }

    setActiveChatterText(clip.text);
    speakVoiceline(clip.text, 'narrator', clip.audioUrl);

    chatterClearTimerRef.current = window.setTimeout(() => {
      setActiveChatterText(null);
      chatterClearTimerRef.current = null;
    }, 3400);
  }, []);

  // Periodically play random presidential chatter from time to time during normal gameplay
  useEffect(() => {
    if (
      showIntro ||
      isPrologueRally ||
      engineMode !== 'play' ||
      activeScene.id === 'presidential-rally-stage' ||
      sleepTransition?.active ||
      isResoluteDeskOpen ||
      isDeskPhoneOpen ||
      isWorldMapOpen ||
      isEventSummonerOpen ||
      tacticalNuke.active ||
      terroristBomb.active ||
      whiteHouseRaid.active
    ) {
      return;
    }

    let timerId: number | null = null;

    const scheduleNextChatter = () => {
      // Play a random chatter line every 22 to 36 seconds
      const delayMs = 22000 + Math.floor(Math.random() * 14000);
      timerId = window.setTimeout(() => {
        if (
          !tacticalNukeActiveRef.current &&
          !terroristBombActiveRef.current &&
          !whiteHouseRaidActiveRef.current &&
          !heliFlightActiveRef.current
        ) {
          triggerPresidentialChatter();
        }
        scheduleNextChatter();
      }, delayMs);
    };

    scheduleNextChatter();

    return () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [
    showIntro,
    isPrologueRally,
    engineMode,
    activeScene.id,
    sleepTransition?.active,
    isResoluteDeskOpen,
    isDeskPhoneOpen,
    isWorldMapOpen,
    isEventSummonerOpen,
    tacticalNuke.active,
    terroristBomb.active,
    whiteHouseRaid.active,
    triggerPresidentialChatter,
  ]);

  useEffect(() => {
    return () => {
      stopDefconStepSound();
      stopTacticalNukeSound();
      stopTerroristBombSound();
      stopWhiteHouseRaidSound();
      tacticalNukeStopRef.current?.();
      terroristBombStopRef.current?.();
      whiteHouseRaidStopRef.current?.();
      if (tacticalNukeAutoClearRef.current !== null) {
        window.clearTimeout(tacticalNukeAutoClearRef.current);
      }
      if (defconToastTimerRef.current !== null) {
        window.clearTimeout(defconToastTimerRef.current);
      }
      if (chatterClearTimerRef.current !== null) {
        window.clearTimeout(chatterClearTimerRef.current);
      }
    };
  }, []);

  // Automatically start the Rally Event Sequence when entering the Presidential Campaign Rally Arena in Play Mode (once Intro is closed)
  useEffect(() => {
    if (showIntro) return;
    if (activeScene.id === 'presidential-rally-stage' && engineMode === 'play') {
      startRallyEventSequence();
      return () => {
        rallyEventCancelRef.current?.();
        rallyEventCancelRef.current = null;
      };
    } else {
      rallyEventCancelRef.current?.();
      rallyEventCancelRef.current = null;
      setRallyEventPhase('idle');
      setRallyShotFlash(false);
      setRallyCheerActive(false);
    }
  }, [showIntro, activeScene.id, engineMode, startRallyEventSequence]);

  useEffect(() => {
    if (!activeInteraction) return;
    if (activeInteraction.id === 'rally-podium') {
      startRallyEventSequence();
    }
  }, [activeInteraction, startRallyEventSequence]);

  const triggerNearbyItem = useCallback(
    (item: NearbyInteractItem) => {
      if (item.type === 'zone') {
        handleInteractZone(item.zone);
      } else {
        handleInteractCharacter(item.character);
      }
    },
    [handleInteractZone, handleInteractCharacter]
  );

  // Reset character position when switching scenes (respecting linked door spawn or locked scene spawn)
  useEffect(() => {
    const pending = pendingSpawnRef.current;
    const isMatched = Boolean(
      pending && pending.sceneId === activeScene.id && !activeScene.lockCharacter
    );
    const spawnPos = isMatched && pending ? pending.spawn : activeScene.spawn;
    const spawnDir =
      isMatched && pending
        ? pending.direction
        : activeScene.spawnDirection;
    pendingSpawnRef.current = null;

    charPosRef.current = spawnPos;
    setCharPos(spawnPos);
    setCharDirSafe(spawnDir || (spawnPos.y > 65 ? 'up' : 'down'));
    setIsMovingSafe(false);
    setWalkFrame(0);
    setClickTarget(null);
    clickTargetRef.current = null;
    setActiveInteraction(null);
    setSelectedPropId(activeScene.props[0]?.id || null);
    setSelectedCharacterId(activeScene.characters?.[0]?.id || null);
    setSelectedZoneId(activeScene.zones[0]?.id || null);
    setConfirmDeleteSceneId(null);
  }, [activeSceneId]);

  // Keep character synced to spawn & spawnDirection when scene is in locked character mode
  useEffect(() => {
    if (activeScene.lockCharacter) {
      charPosRef.current = activeScene.spawn;
      setCharPos(activeScene.spawn);
      setIsMovingSafe(false);
      setWalkFrame(0);
      clickTargetRef.current = null;
      setClickTarget(null);
    }
    if (activeScene.spawnDirection) {
      setCharDirSafe(activeScene.spawnDirection);
    }
    if (activeScene.disableInteractions && activeInteraction) {
      setActiveInteraction(null);
    }
  }, [
    activeScene.lockCharacter,
    activeScene.spawn.x,
    activeScene.spawn.y,
    activeScene.spawnDirection,
    activeScene.disableInteractions,
    activeInteraction,
  ]);

  // Keyboard movement + E/Space interaction + arrow key nudging in Edit Mode
  useEffect(() => {
    const moveKeys = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'w',
      'a',
      's',
      'd',
      'W',
      'A',
      'S',
      'D',
    ]);

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      // Press 'V' 10 times repeatedly (outside text inputs) to unlock/toggle the full Dev Studio UI
      if (
        (e.key === 'v' || e.key === 'V') &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.repeat
      ) {
        const now = performance.now();
        if (now - vLastPressMsRef.current > 1500) {
          vPressCountRef.current = 1;
        } else {
          vPressCountRef.current += 1;
        }
        vLastPressMsRef.current = now;
        const count = vPressCountRef.current;

        if (vToastClearRef.current !== null) {
          window.clearTimeout(vToastClearRef.current);
          vToastClearRef.current = null;
        }

        if (count >= 10) {
          vPressCountRef.current = 0;
          setVUnlockCount(0);
          e.preventDefault();
          pressedKeysRef.current.clear();
          setIsEventSummonerOpen(false);
          if (fullscreenPlay) {
            setFullscreenPlay(false);
          } else {
            setEngineMode('play');
            setFullscreenPlay(true);
          }
          return;
        } else if (count >= 3) {
          setVUnlockCount(count);
          vToastClearRef.current = window.setTimeout(() => {
            vPressCountRef.current = 0;
            setVUnlockCount(0);
            vToastClearRef.current = null;
          }, 1500);
        }
      }

      // Press 'B' anywhere (outside text inputs) to toggle the high-fidelity pixel Crisis Summoner popup window
      if ((e.key === 'b' || e.key === 'B') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!showIntro) {
          e.preventDefault();
          pressedKeysRef.current.clear();
          setIsEventSummonerOpen((prev) => !prev);
          return;
        }
      }

      if (e.key === 'Escape') {
        if (isEventSummonerOpen) {
          setIsEventSummonerOpen(false);
          return;
        }
        if (sleepTransition?.active) {
          handleDismissSleepTransition();
          return;
        }
        if (isResoluteDeskOpen) {
          setIsResoluteDeskOpen(false);
          return;
        }
        if (isDeskPhoneOpen) {
          setIsDeskPhoneOpen(false);
          return;
        }
        if (isWorldMapOpen) {
          setIsWorldMapOpen(false);
          return;
        }
        if (isPhoneOpen) {
          setIsPhoneOpen(false);
          return;
        }
        if (!fullscreenPlay) {
          setEngineMode('play');
          setFullscreenPlay(true);
          return;
        }
        if (activeInteraction) setActiveInteraction(null);
        if (zoneSubTool !== 'select') setZoneSubTool('select');
        setDragAction(null);
        return;
      }

      if (
        showIntro ||
        isEventSummonerOpen ||
        sleepTransition?.active ||
        tacticalNukeActiveRef.current ||
        terroristBombActiveRef.current ||
        whiteHouseRaidActiveRef.current ||
        isWorldMapOpen ||
        isDeskPhoneOpen ||
        isResoluteDeskOpen
      ) {
        return;
      }

      // Keyboard arrow-key nudging when editing a selected prop or zone
      if (
        engineMode === 'props' &&
        selectedPropId &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 2 : 0.4;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        updateActiveScene((s) => ({
          ...s,
          props: s.props.map((p) =>
            p.id === selectedPropId
              ? {
                  ...p,
                  xPercent: +Math.min(98, Math.max(0, p.xPercent + dx)).toFixed(2),
                  yPercent: +Math.min(98, Math.max(0, p.yPercent + dy)).toFixed(2),
                }
              : p
          ),
        }));
        return;
      }

      if (
        engineMode === 'characters' &&
        selectedCharacterId &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 2 : 0.4;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        updateActiveScene((s) => ({
          ...s,
          characters: (s.characters || []).map((c) =>
            c.id === selectedCharacterId
              ? {
                  ...c,
                  xPercent: +Math.min(96, Math.max(4, c.xPercent + dx)).toFixed(1),
                  yPercent: +Math.min(96, Math.max(10, c.yPercent + dy)).toFixed(1),
                }
              : c
          ),
        }));
        return;
      }

      if (
        engineMode === 'zones' &&
        selectedZoneId &&
        zoneSubTool === 'select' &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 2 : 0.5;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        updateActiveScene((s) => ({
          ...s,
          zones: s.zones.map((z) =>
            z.id === selectedZoneId
              ? {
                  ...z,
                  xPercent: +Math.min(98, Math.max(0, z.xPercent + dx)).toFixed(1),
                  yPercent: +Math.min(98, Math.max(0, z.yPercent + dy)).toFixed(1),
                }
              : z
          ),
        }));
        return;
      }

      if (engineMode !== 'play' || !walkEnabled || heliFlightActiveRef.current) return;

      if (
        !activeSceneRef.current.disableInteractions &&
        (e.key === 'e' ||
          e.key === 'E' ||
          e.key === ' ' ||
          e.key === 'r' ||
          e.key === 'R' ||
          e.key === 'f' ||
          e.key === 'F')
      ) {
        const items = getNearbyInteractItems(
          charPosRef.current.x,
          charPosRef.current.y,
          activeSceneRef.current
        );
        const slotIndex =
          e.key === 'r' || e.key === 'R' ? 1 : e.key === 'f' || e.key === 'F' ? 2 : 0;
        const chosen = items[slotIndex];
        if (chosen) {
          e.preventDefault();
          triggerNearbyItem(chosen);
          return;
        }
      }

      if (moveKeys.has(e.key)) {
        if (activeSceneRef.current.lockCharacter) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        pressedKeysRef.current.add(e.key.toLowerCase());
        if (activeInteraction) setActiveInteraction(null);
        if (clickTargetRef.current) {
          clickTargetRef.current = null;
          setClickTarget(null);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key.toLowerCase());
    };

    const onBlur = () => {
      pressedKeysRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    engineMode,
    walkEnabled,
    fullscreenPlay,
    showIntro,
    isPhoneOpen,
    isWorldMapOpen,
    isDeskPhoneOpen,
    isResoluteDeskOpen,
    isEventSummonerOpen,
    sleepTransition?.active,
    handleDismissSleepTransition,
    activeInteraction,
    selectedPropId,
    selectedCharacterId,
    selectedZoneId,
    zoneSubTool,
    updateActiveScene,
    triggerNearbyItem,
  ]);

  // 60fps Character Walk Loop
  useEffect(() => {
    if (!walkEnabled || engineMode !== 'play') {
      setIsMovingSafe(false);
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();
    let frameTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const scene = activeSceneRef.current;
      if (
        heliFlightActiveRef.current ||
        tacticalNukeActiveRef.current ||
        terroristBombActiveRef.current ||
        whiteHouseRaidActiveRef.current ||
        scene.lockCharacter
      ) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const keys = pressedKeysRef.current;
      let dx = 0;
      let dy = 0;

      if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
      if (keys.has('arrowright') || keys.has('d')) dx += 1;
      if (keys.has('arrowup') || keys.has('w')) dy -= 1;
      if (keys.has('arrowdown') || keys.has('s')) dy += 1;

      const speed = 22 / Math.max(1, scene.cameraZoom ?? 1);

      if (dx === 0 && dy === 0 && clickTargetRef.current) {
        const target = clickTargetRef.current;
        const tdx = target.x - charPosRef.current.x;
        const tdy = target.y - charPosRef.current.y;
        const dist = Math.hypot(tdx, tdy);
        if (dist < 0.7) {
          clickTargetRef.current = null;
          setClickTarget(null);
        } else {
          dx = tdx / dist;
          dy = tdy / dist;
        }
      } else if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
      }

      if (dx !== 0 || dy !== 0) {
        if (Math.abs(dx) > Math.abs(dy)) {
          setCharDirSafe(dx < 0 ? 'left' : 'right');
        } else {
          setCharDirSafe(dy < 0 ? 'up' : 'down');
        }

        const aspectAdjust = scene.aspectRatio === '4:3' ? 4 / 3 : 16 / 9;
        const stepX = dx * speed * dt;
        const stepY = dy * speed * aspectAdjust * dt;

        let nextX = charPosRef.current.x;
        let nextY = charPosRef.current.y;

        if (isWalkablePosition(nextX + stepX, nextY, scene)) {
          nextX += stepX;
        }
        if (isWalkablePosition(nextX, nextY + stepY, scene)) {
          nextY += stepY;
        }

        const moved =
          Math.abs(nextX - charPosRef.current.x) > 0.001 ||
          Math.abs(nextY - charPosRef.current.y) > 0.001;

        if (moved) {
          charPosRef.current = { x: nextX, y: nextY };
          setCharPos({ x: nextX, y: nextY });
          setIsMovingSafe(true);
          frameTimer += dt;
          if (frameTimer >= 0.14) {
            frameTimer = 0;
            setWalkFrame((f) => (f + 1) % 4);
          }
        } else {
          setIsMovingSafe(false);
          if (clickTargetRef.current) {
            clickTargetRef.current = null;
            setClickTarget(null);
          }
        }
      } else {
        setIsMovingSafe(false);
        setWalkFrame((prev) => (prev === 0 ? prev : 0));
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [walkEnabled, engineMode, setCharDirSafe, setIsMovingSafe]);

  // Coordinate helper relative to map stage container
  const getPercentCoords = (clientX: number, clientY: number): Point2D | null => {
    const el = stageRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  // Coordinate helper relative to mini destination door preview
  const getDoorPreviewCoords = (clientX: number, clientY: number): Point2D | null => {
    const el = doorPreviewRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = +Math.min(96, Math.max(4, ((clientX - rect.left) / rect.width) * 100)).toFixed(1);
    const y = +Math.min(96, Math.max(6, ((clientY - rect.top) / rect.height) * 100)).toFixed(1);
    return { x, y };
  };

  // Global mouse/pointer drag handler for moving & resizing props, zones, spawn, door spawns, and floor corners
  useEffect(() => {
    if (!dragAction) return;

    const onPointerMove = (e: PointerEvent) => {
      if (
        dragAction.type === 'move-door-preview-spawn' &&
        dragAction.targetId &&
        dragAction.sourceSceneId
      ) {
        const previewCoords = getDoorPreviewCoords(e.clientX, e.clientY);
        if (!previewCoords) return;
        setScenes((prev) =>
          prev.map((sc) =>
            sc.id === dragAction.sourceSceneId
              ? {
                  ...sc,
                  zones: sc.zones.map((z) =>
                    z.id === dragAction.targetId ? { ...z, targetSpawn: previewCoords } : z
                  ),
                }
              : sc
          )
        );
        return;
      }

      const coords = getPercentCoords(e.clientX, e.clientY);
      if (!coords) return;

      const dx = coords.x - dragAction.startMouseX;
      const dy = coords.y - dragAction.startMouseY;

      if (dragAction.type === 'draw-zone') {
        setDragAction((prev) =>
          prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null
        );
        return;
      }

      if (dragAction.type === 'move-door-arrival' && dragAction.targetId && dragAction.sourceSceneId) {
        const nextX = +Math.min(96, Math.max(4, dragAction.origX + dx)).toFixed(1);
        const nextY = +Math.min(96, Math.max(6, dragAction.origY + dy)).toFixed(1);
        setScenes((prev) =>
          prev.map((sc) =>
            sc.id === dragAction.sourceSceneId
              ? {
                  ...sc,
                  zones: sc.zones.map((z) =>
                    z.id === dragAction.targetId
                      ? { ...z, targetSpawn: { x: nextX, y: nextY } }
                      : z
                  ),
                }
              : sc
          )
        );
        return;
      }

      if (dragAction.type === 'move-prop' && dragAction.targetId) {
        const nextX = +Math.min(
          100 - dragAction.origW,
          Math.max(0, dragAction.origX + dx)
        ).toFixed(2);
        const nextY = +Math.min(
          100 - dragAction.origH,
          Math.max(0, dragAction.origY + dy)
        ).toFixed(2);
        updateActiveScene((s) => ({
          ...s,
          props: s.props.map((p) =>
            p.id === dragAction.targetId ? { ...p, xPercent: nextX, yPercent: nextY } : p
          ),
        }));
      } else if (dragAction.type === 'resize-prop' && dragAction.targetId) {
        const nextW = +Math.max(1.0, Math.min(40, dragAction.origW + dx)).toFixed(2);
        const nextH = +Math.max(1.5, Math.min(40, dragAction.origH + dy)).toFixed(2);
        updateActiveScene((s) => ({
          ...s,
          props: s.props.map((p) =>
            p.id === dragAction.targetId ? { ...p, widthPercent: nextW, heightPercent: nextH } : p
          ),
        }));
      } else if (dragAction.type === 'move-character' && dragAction.targetId) {
        const nextX = +Math.min(96, Math.max(4, dragAction.origX + dx)).toFixed(1);
        const nextY = +Math.min(96, Math.max(10, dragAction.origY + dy)).toFixed(1);
        updateActiveScene((s) => ({
          ...s,
          characters: (s.characters || []).map((c) =>
            c.id === dragAction.targetId ? { ...c, xPercent: nextX, yPercent: nextY } : c
          ),
        }));
      } else if (dragAction.type === 'move-spawn') {
        const nextX = +Math.min(95, Math.max(5, dragAction.origX + dx)).toFixed(1);
        const nextY = +Math.min(95, Math.max(10, dragAction.origY + dy)).toFixed(1);
        updateActiveScene((s) => ({ ...s, spawn: { x: nextX, y: nextY } }));
        charPosRef.current = { x: nextX, y: nextY };
        setCharPos({ x: nextX, y: nextY });
      } else if (dragAction.type === 'move-zone' && dragAction.targetId) {
        const nextX = +Math.min(
          100 - dragAction.origW,
          Math.max(0, dragAction.origX + dx)
        ).toFixed(1);
        const nextY = +Math.min(
          100 - dragAction.origH,
          Math.max(0, dragAction.origY + dy)
        ).toFixed(1);
        updateActiveScene((s) => ({
          ...s,
          zones: s.zones.map((z) =>
            z.id === dragAction.targetId ? { ...z, xPercent: nextX, yPercent: nextY } : z
          ),
        }));
      } else if (dragAction.type === 'resize-zone' && dragAction.targetId) {
        const nextW = +Math.max(2, Math.min(90, dragAction.origW + dx)).toFixed(1);
        const nextH = +Math.max(2, Math.min(90, dragAction.origH + dy)).toFixed(1);
        updateActiveScene((s) => ({
          ...s,
          zones: s.zones.map((z) =>
            z.id === dragAction.targetId ? { ...z, widthPercent: nextW, heightPercent: nextH } : z
          ),
        }));
      } else if (
        dragAction.type === 'move-floor-pt' &&
        typeof dragAction.pointIndex === 'number'
      ) {
        const nextX = +Math.min(99, Math.max(1, dragAction.origX + dx)).toFixed(1);
        const nextY = +Math.min(99, Math.max(1, dragAction.origY + dy)).toFixed(1);
        updateActiveScene((s) => ({
          ...s,
          floorPolygon: s.floorPolygon.map((pt, idx) =>
            idx === dragAction.pointIndex ? { x: nextX, y: nextY } : pt
          ),
        }));
      }
    };

    const onPointerUp = () => {
      if (dragAction.type === 'draw-zone') {
        const xPercent = +Math.min(dragAction.startMouseX, dragAction.currentX).toFixed(1);
        const yPercent = +Math.min(dragAction.startMouseY, dragAction.currentY).toFixed(1);
        const widthPercent = +Math.abs(dragAction.currentX - dragAction.startMouseX).toFixed(1);
        const heightPercent = +Math.abs(dragAction.currentY - dragAction.startMouseY).toFixed(1);

        if (widthPercent >= 1.2 && heightPercent >= 1.2) {
          const isSolid = zoneSubTool === 'draw-solid';
          const isMask = zoneSubTool === 'draw-mask';
          const isDoor = zoneSubTool === 'draw-door';
          const count = activeSceneRef.current.zones.length + 1;
          const doorCount =
            activeSceneRef.current.zones.filter((z) => z.collisionType === 'door').length + 1;

          const newZone: MapZone = {
            id: `zone-${Date.now()}`,
            label: isDoor
              ? `Door ${doorCount}`
              : isMask
                ? `Hide / Mask Zone ${count}`
                : isSolid
                  ? `No-Walk Zone ${count}`
                  : `Interactive Zone ${count}`,
            xPercent,
            yPercent,
            widthPercent,
            heightPercent,
            collisionType: isDoor
              ? 'door'
              : isMask
                ? 'mask'
                : isSolid
                  ? 'solid'
                  : 'interactive',
            blocksWalk: isSolid,
            maskTarget: isMask ? 'props' : undefined,
            description: isDoor
              ? 'Doorway. Walk up and press E to enter.'
              : isMask
                ? 'Hides overlapping animated items behind background pixels.'
                : isSolid
                  ? 'Blocked obstacle area.'
                  : 'Custom interaction! Edit this text in the inspector.',
          };
          updateActiveScene((s) => ({ ...s, zones: [...s.zones, newZone] }));
          setSelectedZoneId(newZone.id);
          setZoneSubTool('select');
        }
      }
      setDragAction(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragAction, zoneSubTool, updateActiveScene]);

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (engineMode === 'zones' && zoneSubTool !== 'select') {
      const coords = getPercentCoords(e.clientX, e.clientY);
      if (!coords) return;
      e.preventDefault();
      setDragAction({
        type: 'draw-zone',
        startMouseX: coords.x,
        startMouseY: coords.y,
        origX: coords.x,
        origY: coords.y,
        origW: 0,
        origH: 0,
        currentX: coords.x,
        currentY: coords.y,
      });
    }
  };

  const handleMapClickToWalk = (e: React.MouseEvent<HTMLImageElement>) => {
    if (
      !walkEnabled ||
      engineMode !== 'play' ||
      heliFlightActiveRef.current ||
      activeScene.lockCharacter
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isWalkablePosition(x, y, activeScene)) {
      const nextTarget = { x, y };
      clickTargetRef.current = nextTarget;
      setClickTarget(nextTarget);
      setActiveInteraction(null);
    }
  };

  // Scene actions
  const handleAddAnimatedProp = (kind: PropKind) => {
    const preset = PROP_LIBRARY.find((p) => p.kind === kind) || PROP_LIBRARY[0];
    const newProp: AnimatedPropItem = {
      id: `prop-${Date.now()}`,
      label: `${preset.label} ${activeScene.props.length + 1}`,
      kind,
      xPercent: 48,
      yPercent: 48,
      widthPercent: preset.defaultW,
      heightPercent: preset.defaultH,
      skewY: 0,
      speed: 1,
      flipX: false,
      visible: true,
    };
    updateActiveScene((s) => ({ ...s, props: [...s.props, newProp] }));
    setSelectedPropId(newProp.id);
    setEngineMode('props');
  };

  const handleNudgeProp = (propId: string, dx: number, dy: number) => {
    updateActiveScene((s) => ({
      ...s,
      props: s.props.map((p) =>
        p.id === propId
          ? {
              ...p,
              xPercent: +Math.min(98, Math.max(0, p.xPercent + dx)).toFixed(2),
              yPercent: +Math.min(98, Math.max(0, p.yPercent + dy)).toFixed(2),
            }
          : p
      ),
    }));
  };

  const handleNudgeZone = (zoneId: string, dx: number, dy: number) => {
    updateActiveScene((s) => ({
      ...s,
      zones: s.zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              xPercent: +Math.min(98, Math.max(0, z.xPercent + dx)).toFixed(1),
              yPercent: +Math.min(98, Math.max(0, z.yPercent + dy)).toFixed(1),
            }
          : z
      ),
    }));
  };

  const handleAddCharacterAsset = (
    kind: CharacterAssetKind,
    variant: BodyguardVariant,
    defaultLabel?: string,
    defaultDialogue?: string
  ) => {
    const existingCount = (activeScene.characters || []).length;
    const offset = (existingCount % 4) * 4 - 6;
    const newChar: SceneCharacterItem = {
      id: `char-${Date.now()}`,
      label: defaultLabel || `Bodyguard ${existingCount + 1}`,
      kind,
      variant,
      xPercent: +Math.min(90, Math.max(10, 50 + offset)).toFixed(1),
      yPercent: 54,
      direction: 'down',
      blocksWalk: true,
      dialogue:
        defaultDialogue || 'Clearance verified, Mr. President. Perimeter is secure.',
      visible: true,
    };
    updateActiveScene((s) => ({
      ...s,
      characters: [...(s.characters || []), newChar],
    }));
    setSelectedCharacterId(newChar.id);
    setEngineMode('characters');
  };

  const handleNudgeCharacter = (charId: string, dx: number, dy: number) => {
    updateActiveScene((s) => ({
      ...s,
      characters: (s.characters || []).map((c) =>
        c.id === charId
          ? {
              ...c,
              xPercent: +Math.min(96, Math.max(4, c.xPercent + dx)).toFixed(1),
              yPercent: +Math.min(96, Math.max(10, c.yPercent + dy)).toFixed(1),
            }
          : c
      ),
    }));
  };

  const handleDuplicateCharacter = (char: SceneCharacterItem) => {
    const copy: SceneCharacterItem = {
      ...char,
      id: `char-${Date.now()}`,
      label: `${char.label} Copy`,
      xPercent: +Math.min(94, char.xPercent + 4).toFixed(1),
      yPercent: +Math.min(94, char.yPercent + 2).toFixed(1),
    };
    updateActiveScene((s) => ({
      ...s,
      characters: [...(s.characters || []), copy],
    }));
    setSelectedCharacterId(copy.id);
  };

  const handleCreateCustomScene = () => {
    const cleanName = newSceneName.trim() || `Custom Scene ${scenes.length + 1}`;
    const created = createNewScene(cleanName, newSceneImageData || undefined);
    setScenes((prev) => [...prev, created]);
    setActiveSceneId(created.id);
    setNewSceneName('');
    setNewSceneImageData('');
    setNewSceneModalOpen(false);
    setEngineMode('props');
  };

  const handleDuplicateScene = () => {
    const clone: SceneData = {
      ...JSON.parse(JSON.stringify(activeScene)),
      id: `scene-${Date.now()}`,
      name: `${activeScene.name} (Copy)`,
      isBuiltIn: false,
    };
    setScenes((prev) => [...prev, clone]);
    setActiveSceneId(clone.id);
  };

  const handleDeleteActiveScene = () => {
    if (scenes.length <= 1) return;
    const remaining = scenes.filter((s) => s.id !== activeScene.id);
    setScenes(remaining);
    setActiveSceneId(remaining[0].id);
    setConfirmDeleteSceneId(null);
  };

  const handleRestoreBuiltInScenes = () => {
    setScenes((prev) => {
      const missing = BUILT_IN_SCENES.filter(
        (builtIn) => !prev.some((s) => s.id === builtIn.id)
      );
      if (missing.length === 0) return prev;
      return restoreBuiltInHallwayAndLink([...prev, ...missing]);
    });
  };

  const handleResetActiveScene = () => {
    const builtIn = BUILT_IN_SCENES.find((b) => b.id === activeScene.id);
    if (builtIn) {
      setScenes((prev) => prev.map((s) => (s.id === activeScene.id ? builtIn : s)));
      charPosRef.current = builtIn.spawn;
      setCharPos(builtIn.spawn);
    }
  };

  const handleUploadNewBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (newSceneModalOpen) {
          setNewSceneImageData(reader.result);
        } else {
          updateActiveScene((s) => ({ ...s, imageUrl: reader.result as string }));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownloadMapPng = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || 1920;
      const h = img.naturalHeight || 1080;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${activeScene.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/png');
      }
    } finally {
      setTimeout(() => setIsDownloading(false), 350);
    }
  }, [activeScene.name]);

  const handleCopySceneJson = () => {
    navigator.clipboard.writeText(JSON.stringify(activeScene, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  const handleExportProjectFile = () => {
    const blob = new Blob([JSON.stringify(scenes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'executive_scene_project.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
          setScenes(parsed);
          setActiveSceneId(parsed[0].id);
        } else if (parsed && parsed.id && parsed.props) {
          setScenes((prev) => [...prev, { ...parsed, id: `imported-${Date.now()}` }]);
        }
      } catch {
        // Invalid JSON ignored safely
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectedProp = activeScene.props.find((p) => p.id === selectedPropId) || null;
  const selectedCharacter =
    (activeScene.characters || []).find((c) => c.id === selectedCharacterId) || null;
  const selectedZone = activeScene.zones.find((z) => z.id === selectedZoneId) || null;

  const drawPreviewBox =
    dragAction?.type === 'draw-zone'
      ? {
          left: Math.min(dragAction.startMouseX, dragAction.currentX),
          top: Math.min(dragAction.startMouseY, dragAction.currentY),
          width: Math.abs(dragAction.currentX - dragAction.startMouseX),
          height: Math.abs(dragAction.currentY - dragAction.startMouseY),
        }
      : null;

  // Fullscreen Play View
  if (fullscreenPlay) {
    return (
      <div className="fixed inset-0 z-50 bg-[#070A0F] flex items-center justify-center overflow-hidden select-none">
        <div className="relative inline-flex items-center justify-center max-w-full max-h-full overflow-hidden">
          <div
            className="relative inline-flex items-center justify-center max-w-full max-h-full"
            style={cameraTransformStyle}
          >
            <img
            src={activeScene.imageUrl}
            alt={activeScene.name}
            referrerPolicy="no-referrer"
            onClick={handleMapClickToWalk}
            draggable={false}
            className="max-w-screen max-h-screen object-contain pixelated cursor-pointer"
          />

          {activeScene.props.map((prop) => (
            <div
              key={prop.id}
              className="absolute z-10 pointer-events-none"
              style={{
                left: `${prop.xPercent}%`,
                top: `${prop.yPercent}%`,
                width: `${prop.widthPercent}%`,
                height: `${prop.heightPercent}%`,
              }}
            >
              <AnimatedPropRenderer item={prop} />
            </div>
          ))}

          {/* Depth-sorted Scene Characters (Bodyguards) + Walkable Player */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {activeScene.id === 'presidential-rally-stage' && (
              <PixelRallyBallistics active={rallyShotFlash} />
            )}

            {visiblePlayCharacters.map((ch, idx) => {
                const isRallyScene = activeScene.id === 'presidential-rally-stage';
                const isCrowdSupporter =
                  ch.variant === 'maga-cap-red' ||
                  ch.variant === 'rally-sign-usa' ||
                  ch.variant === 'rally-blonde-vip';
                const isStageGuardWest = ch.id === 'rally-guard-stage-west';
                const isStageGuardEast = ch.id === 'rally-guard-stage-east';
                const isRushingGuard =
                  isRallyScene &&
                  (rallyEventPhase === 'ducking' || rallyEventPhase === 'fist-raised') &&
                  (isStageGuardWest || isStageGuardEast);

                const effectiveX = isRushingGuard
                  ? isStageGuardWest
                    ? 46.8
                    : 53.2
                  : ch.xPercent;
                const effectiveY = isRushingGuard ? 43.2 : ch.yPercent;

                const isScaredNow =
                  isRallyScene &&
                  rallyEventPhase === 'ducking' &&
                  (isCrowdSupporter || ch.variant === 'press-cameraman');

                const isCheeringNow = isRallyScene
                  ? (rallyEventPhase === 'speaking' || rallyEventPhase === 'fist-raised') &&
                    isCrowdSupporter
                  : rallyCheerActive && isCrowdSupporter;

                let cheerText: string | undefined;
                if (isScaredNow) {
                  if (idx % 2 === 0) {
                    cheerText =
                      RALLY_SCARED_CRIES[Math.floor(idx / 2) % RALLY_SCARED_CRIES.length];
                  }
                } else if (isRushingGuard && rallyEventPhase === 'ducking') {
                  cheerText = isStageGuardWest ? 'GET DOWN SIR!!' : 'COVER POTUS!!';
                } else if (isCheeringNow && idx % 2 === 0) {
                  cheerText =
                    rallyEventPhase === 'fist-raised'
                      ? RALLY_FIGHT_CHANTS[Math.floor(idx / 2) % RALLY_FIGHT_CHANTS.length]
                      : RALLY_CROWD_CHANTS[Math.floor(idx / 2) % RALLY_CROWD_CHANTS.length];
                }

                return (
                  <div
                    key={ch.id}
                    className="absolute pointer-events-none transition-[left,top] duration-300"
                    style={{
                      left: `${effectiveX}%`,
                      top: `${effectiveY}%`,
                      height: `${ch.scalePercent ?? activeScene.characterScale}%`,
                      transform: 'translate(-50%, -92%)',
                      zIndex: Math.round(effectiveY * 10),
                    }}
                  >
                    <PixelBodyguard
                      direction={
                        isRushingGuard
                          ? isStageGuardWest
                            ? 'right'
                            : 'left'
                          : ch.direction
                      }
                      variant={ch.variant}
                      cheering={isCheeringNow}
                      scared={isScaredNow}
                      cheerText={cheerText}
                      jumpSeed={ch.id}
                      className="h-full w-auto"
                    />
                  </div>
                );
              })}

            {activeScene.id === 'white-house-south-lawn' && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: '53.5%',
                  top: '13.5%',
                  width: '37%',
                  height: '37%',
                  zIndex:
                    heliFlight.phase === 'takeoff' || heliFlight.phase === 'flying'
                      ? 999
                      : 450,
                }}
              >
                <PixelMarineOne
                  phase={heliFlight.phase}
                  phaseProgress={heliFlight.progress}
                  className="w-full h-full"
                />
              </div>
            )}

            {walkEnabled && !(heliFlight.active && heliFlight.boarded) && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${charPos.x}%`,
                  top: `${
                    activeScene.id === 'presidential-rally-stage' &&
                    rallyEventPhase === 'ducking'
                      ? charPos.y + 2.4
                      : charPos.y
                  }%`,
                  height: `${activeScene.characterScale}%`,
                  transform: `translate(-50%, ${isMoving && walkFrame % 2 === 1 ? '-94%' : '-92%'})`,
                  zIndex: Math.round(charPos.y * 10),
                  willChange: 'left, top, transform',
                }}
              >
                <PixelCharacter
                  direction={charDir}
                  walkFrame={walkFrame}
                  isMoving={isMoving}
                  pose={
                    activeScene.id === 'presidential-rally-stage'
                      ? (rallyEventPhase === 'ducking'
                          ? 'ducking'
                          : rallyEventPhase === 'fist-raised'
                            ? 'fist-raised'
                            : 'normal')
                      : 'normal'
                  }
                  speechBubble={
                    activeScene.id === 'presidential-rally-stage' &&
                    rallyEventPhase === 'fist-raised'
                      ? 'BAD SHOT! TERRIBLE SHOT!'
                      : activeChatterText || undefined
                  }
                  className="h-full w-auto"
                />
              </div>
            )}
          </div>

          {/* Foreground Hide/Mask Cutouts (hide overlapping prop/character parts behind background pixels) */}
          {maskZones.map((mask) => (
              <div
                key={`fs-mask-${mask.id}`}
                className={`absolute overflow-hidden pointer-events-none ${
                  mask.maskTarget === 'all' ? 'z-[25]' : 'z-[15]'
                }`}
                style={{
                  left: `${mask.xPercent}%`,
                  top: `${mask.yPercent}%`,
                  width: `${mask.widthPercent}%`,
                  height: `${mask.heightPercent}%`,
                }}
              >
                <img
                  src={activeScene.imageUrl}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  referrerPolicy="no-referrer"
                  className="absolute max-w-none pixelated"
                  style={{
                    width: `${(100 / Math.max(0.1, mask.widthPercent)) * 100}%`,
                    height: `${(100 / Math.max(0.1, mask.heightPercent)) * 100}%`,
                    left: `${-(mask.xPercent / Math.max(0.1, mask.widthPercent)) * 100}%`,
                    top: `${-(mask.yPercent / Math.max(0.1, mask.heightPercent)) * 100}%`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top-Left Corner High-Fidelity Pixel DEFCON Counter HUD (driven by Diplomacy) */}
          {showDayCounter && !tacticalNuke.active && !terroristBomb.active && !whiteHouseRaid.active && (
            <div className="absolute top-5 left-5 z-30">
              <PixelDefconHud security={characteristics.diplomacy ?? 50} />
            </div>
          )}

          {/* Top-Center DEFCON Escalation / Level Change Notification Popup */}
          {defconToast && !tacticalNuke.active && !terroristBomb.active && !whiteHouseRaid.active && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
              <PixelDefconNotification toast={defconToast} />
            </div>
          )}

          {/* Daily Random Event Twittly Notification Banner (Fullscreen) */}
          {dailyEventToast && !tacticalNuke.active && !terroristBomb.active && !whiteHouseRaid.active && (
            <div
              key={`fs-daily-toast-${dailyEventToast.id}`}
              onClick={() => {
                setIsPhoneOpen(true);
                setDailyEventToast(null);
              }}
              style={{
                imageRendering: 'pixelated',
                boxShadow:
                  'inset 2px 2px 0 0 #38BDF8, inset -2px -2px 0 0 #0369A1, 0 0 0 3px #090D16, 0 10px 24px rgba(0,0,0,0.75)',
              }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-[#0F172A]/95 border-2 border-[#0EA5E9] px-3.5 py-2.5 cursor-pointer select-none transition-transform hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1 mb-1.5">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-sky-300">
                  🔔 TWITTLY BREAKING ALERT · DAY {dailyEventToast.day}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono font-black uppercase border ${
                    dailyEventToast.event.delta >= 0
                      ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                      : 'bg-red-950 border-red-400 text-red-300'
                  }`}
                >
                  {dailyEventToast.event.delta >= 0 ? '▲' : '▼'}{' '}
                  {dailyEventToast.statLabel.toUpperCase()}{' '}
                  {dailyEventToast.event.delta >= 0
                    ? `+${dailyEventToast.event.delta}%`
                    : `${dailyEventToast.event.delta}%`}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-100 leading-snug">
                <span className="text-amber-300 font-bold">
                  {dailyEventToast.event.handle}:
                </span>{' '}
                {dailyEventToast.event.headline}
              </div>
            </div>
          )}

          {/* Prologue Rally Skip to Oval Office Button (Fullscreen) */}
          {isPrologueRally && activeScene.id === 'presidential-rally-stage' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
              <button
                type="button"
                onClick={completePrologueRallyToOffice}
                style={{
                  boxShadow:
                    'inset 2px 2px 0 0 #FDE68A, inset -2px -2px 0 0 #78350F, 0 0 0 3px #090D16, 0 6px 16px rgba(0,0,0,0.75)',
                }}
                className="px-4 py-2 bg-[#B45309] hover:bg-[#D97706] text-[#FEF3C7] font-mono font-bold text-xs tracking-wider uppercase cursor-pointer"
              >
                SKIP TO OVAL OFFICE (DAY 1) →
              </button>
            </div>
          )}

          {/* Bottom-Left Corner High-Fidelity Pixel Day & Hour HUD */}
          {showDayCounter && (
            <div className="absolute bottom-5 left-5 z-30">
              <PixelDayHud day={currentDay} hour={currentHour} />
            </div>
          )}

          {/* Fullscreen Tactical Nuke Overlay */}
          {tacticalNuke.active && tacticalNuke.country && (
            <PixelTacticalNukeOverlay
              key={`fs-nuke-${tacticalNuke.launchId}`}
              launchId={tacticalNuke.launchId}
              startedAtMs={tacticalNuke.startedAtMs}
              active={tacticalNuke.active}
              country={tacticalNuke.country}
              sceneId={activeScene.id}
              onClose={stopTacticalNukeEvent}
              onRestartGame={handleRestartAfterNuke}
            />
          )}

          {/* Fullscreen White House Terrorist Bombing Overlay */}
          {terroristBomb.active && (
            <PixelWhiteHouseBombingOverlay
              key={`fs-bomb-${terroristBomb.launchId}`}
              launchId={terroristBomb.launchId}
              startedAtMs={terroristBomb.startedAtMs}
              active={terroristBomb.active}
              onClose={stopTerroristBombEvent}
              onRestartGame={handleRestartAfterNuke}
            />
          )}

          {/* Fullscreen White House & Oval Office Public Raid Overlay */}
          {whiteHouseRaid.active && (
            <PixelWhiteHouseRaidOverlay
              key={`fs-raid-${whiteHouseRaid.launchId}`}
              launchId={whiteHouseRaid.launchId}
              startedAtMs={whiteHouseRaid.startedAtMs}
              active={whiteHouseRaid.active}
              onClose={stopWhiteHouseRaidEvent}
              onRestartGame={handleRestartAfterNuke}
            />
          )}

          {walkEnabled &&
            !heliFlight.active &&
            nearbyItems.length > 0 &&
            !activeInteraction && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-4 max-w-[94vw]">
              {nearbyItems.map((item, idx) => {
                const keyLabel = INTERACT_KEYS[idx] || 'E';
                if (item.type === 'zone') {
                  const meta = getZonePromptMeta(item.zone, keyLabel);
                  return (
                    <PixelInteractButton
                      key={`fs-zone-${item.zone.id}`}
                      label={item.zone.label}
                      actionText={meta.actionText}
                      kind={meta.kind}
                      keyLabel={keyLabel}
                      onClick={() => handleInteractZone(item.zone)}
                    />
                  );
                }
                return (
                  <PixelInteractButton
                    key={`fs-char-${item.character.id}`}
                    label={item.character.label}
                    actionText={`PRESS ${keyLabel} · TALK`}
                    kind="character"
                    keyLabel={keyLabel}
                    onClick={() => handleInteractCharacter(item.character)}
                  />
                );
              })}
            </div>
          )}

          {activeInteraction && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl">
              <PixelDialogueBox
                label={activeInteraction.label}
                description={activeInteraction.description}
                kind={
                  (activeScene.characters || []).some((c) => c.id === activeInteraction.id)
                    ? 'character'
                    : getZonePromptMeta(activeInteraction).kind
                }
                onPostToTwittly={() => {
                  handleCreateTwittlyEvent({
                    content: `Activity at ${activeInteraction.label}: ${activeInteraction.description}`,
                    tag: 'EVENT',
                    author: 'Executive Desk',
                    handle: '@POTUS',
                    avatarColor: '#B91C1C',
                  });
                  setUnreadTwittly((u) => u + 1);
                  setActiveInteraction(null);
                }}
                onClose={() => setActiveInteraction(null)}
              />
            </div>
          )}
        </div>

        {/* Bottom-Right Edge Pixel iPhone (peeks as an edge, opens directly unlocked) */}
        {!tacticalNuke.active && !terroristBomb.active && !whiteHouseRaid.active && (
          <div
            className={`fixed right-6 z-40 transition-all duration-200 ${
              isPhoneOpen ? 'bottom-5' : 'bottom-0'
            }`}
          >
            <PixelPhone
              day={currentDay}
              hour={currentHour}
              isOpen={isPhoneOpen}
              onToggle={() => setIsPhoneOpen((o) => !o)}
              onClose={() => setIsPhoneOpen(false)}
              posts={twittlyPosts}
              unreadCount={unreadTwittly}
              onMarkRead={() => setUnreadTwittly(0)}
              onCreateEvent={handleCreateTwittlyEvent}
              onToggleLike={handleToggleTwittlyLike}
              onToggleRepost={handleToggleTwittlyRepost}
              onDeletePost={handleDeleteTwittlyPost}
              fullscreen
            />
          </div>
        )}

        {isWorldMapOpen && (
          <PixelWorldMapModal onClose={() => setIsWorldMapOpen(false)} />
        )}

        {isDeskPhoneOpen && (
          <PixelDeskPhoneModal
            onClose={() => setIsDeskPhoneOpen(false)}
            onPostToTwittly={(payload) => {
              handleCreateTwittlyEvent(payload);
              setUnreadTwittly((u) => u + 1);
            }}
          />
        )}

        {isResoluteDeskOpen && (
          <PixelResoluteDeskModal
            bills={bills}
            dailyBillIds={dailyDeskBatch.billIds}
            currentDay={currentDay}
            signedBills={signedBills}
            vetoedBills={vetoedBills}
            characteristics={characteristics}
            onSignBill={handleSignBill}
            onVetoBill={handleVetoBill}
            onResetDeskBills={() => {
              setSignedBills({});
              setVetoedBills({});
              setDailyDeskBatch({
                day: currentDay,
                billIds: pickDailyBillBatchIds(bills, {}, {}, currentDay),
              });
            }}
            onClose={() => setIsResoluteDeskOpen(false)}
          />
        )}
        {sleepTransition?.active && (
          <PixelDayTransitionOverlay
            transition={sleepTransition}
            onDismiss={handleDismissSleepTransition}
          />
        )}
        <PixelEventSummonModal
          isOpen={isEventSummonerOpen}
          onClose={() => setIsEventSummonerOpen(false)}
          onSummonNuke={() => triggerTacticalNukeEvent()}
          onSummonBombing={() => triggerTerroristBombEvent()}
          onSummonRaid={() => triggerWhiteHouseRaidEvent()}
          onTriggerChatter={(clipId) => triggerPresidentialChatter(clipId)}
        />
        {heliFlight.fadeOpacity > 0.01 && (
          <div
            className="fixed inset-0 z-50 bg-[#070A0F] pointer-events-none transition-opacity duration-300"
            style={{ opacity: heliFlight.fadeOpacity }}
          />
        )}
        {vUnlockCount >= 3 && (
          <div
            style={{
              imageRendering: 'pixelated',
              boxShadow:
                'inset 1px 1px 0 0 #818CF8, inset -1px -1px 0 0 #1E1B4B, 0 0 0 2px #05070B',
            }}
            className="fixed top-4 right-4 z-[85] px-3 py-1.5 bg-[#1E1B4B]/95 border border-indigo-400 font-mono font-black text-[10px] tracking-widest uppercase text-indigo-200 pointer-events-none"
          >
            DEV MENU UNLOCK: {vUnlockCount} / 10 [V]
          </div>
        )}
        {showIntro && (
          <PixelIntroOverlay onStartGame={handleStartGameFromIntro} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] flex flex-col">
      {/* Hidden file inputs for custom backgrounds & JSON project import */}
      <input
        ref={fileUploadRef}
        type="file"
        accept="image/*"
        onChange={handleUploadNewBackground}
        className="hidden"
      />
      <input
        ref={jsonImportRef}
        type="file"
        accept="application/json"
        onChange={handleImportProjectFile}
        className="hidden"
      />

      {/* Structured Developer Studio Top Bar (toggled anytime with [B]) */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold tracking-wider uppercase">
            DEV STUDIO
          </span>
          <div className="flex items-center gap-2">
            <label htmlFor="scene-select" className="text-xs font-medium text-slate-400">
              Scene:
            </label>
            <select
              id="scene-select"
              value={activeScene.id}
              onChange={(e) => setActiveSceneId(e.target.value)}
              className="bg-slate-900 border border-slate-700 focus:border-indigo-400 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-100 outline-none cursor-pointer"
            >
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setNewSceneModalOpen((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              New
            </button>
            <button
              type="button"
              onClick={() => fileUploadRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Replace background image of current scene"
            >
              <Upload className="w-3.5 h-3.5" />
              Map Image
            </button>
          </div>
        </div>

        {/* Center Segmented Tool Tabs */}
        <div
          role="tablist"
          aria-label="Developer Studio Mode"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg"
        >
          {[
            { id: 'play', label: 'Overview & Stats', icon: Footprints },
            { id: 'bills', label: `Bills (${bills.length})`, icon: ScrollText },
            { id: 'events', label: 'Trigger Events', icon: Flame },
            { id: 'zones', label: `Zones (${activeScene.zones.length})`, icon: Layers },
            {
              id: 'characters',
              label: `Characters (${(activeScene.characters || []).length})`,
              icon: Shield,
            },
            { id: 'props', label: `Props (${activeScene.props.length})`, icon: Move },
            { id: 'floor', label: 'Floor Bounds', icon: Grid },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = engineMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setEngineMode(tab.id as EngineMode);
                  if (tab.id === 'play') setZoneSubTool('select');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-indigo-500 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right: Save All Zones & Obstacles + Return to Fullscreen Game */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void persistWorldStateToServer(scenes, bills)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-100 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Save all obstacles, zones, areas, floor bounds, props, and characters into game project storage"
          >
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            {worldSaveStatus === 'saving'
              ? 'Saving Zones...'
              : 'Save Zones & Areas ✓'}
          </button>
          <button
            type="button"
            onClick={() => {
              void persistWorldStateToServer(scenes, bills);
              setEngineMode('play');
              setFullscreenPlay(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Resume Game [ESC]
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1480px] mx-auto px-4 sm:px-6 py-5 space-y-6">
        <section id="viewport" className="space-y-4">
          {/* Inline Create New Scene Drawer */}
          {newSceneModalOpen && (
            <div className="rounded-xl border border-indigo-500/40 bg-slate-900/95 p-4 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">New Scene Name</label>
                  <input
                    type="text"
                    value={newSceneName}
                    onChange={(e) => setNewSceneName(e.target.value)}
                    placeholder="e.g. Situation Room, Press Briefing..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-400 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Background Map Image (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileUploadRef.current?.click()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      {newSceneImageData ? 'Custom Image Ready' : 'Upload Pixel Map Image'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCreateCustomScene}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-400 rounded-lg transition-colors cursor-pointer"
                >
                  Create Scene
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewSceneModalOpen(false);
                    setNewSceneImageData('');
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Main Structured Two-Column Workspace: Left Stage Preview (7 cols) + Right Inspector (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7">
              <div className="relative rounded-xl border border-slate-800/90 bg-[#070A0F] overflow-hidden shadow-2xl">
                <div className="relative w-full flex items-center justify-center bg-[#06080D] p-2 sm:p-3 select-none">
                  <div
                    className={
                      engineMode === 'play'
                        ? 'relative inline-block overflow-hidden'
                        : 'relative inline-block'
                    }
                  >
                    <div
                      ref={stageRef}
                      onPointerDown={handleStagePointerDown}
                      style={engineMode === 'play' ? cameraTransformStyle : undefined}
                      className={`relative inline-block ${
                        engineMode === 'zones' && zoneSubTool !== 'select'
                          ? 'cursor-crosshair'
                          : engineMode === 'play'
                            ? 'cursor-pointer'
                            : 'cursor-default'
                      }`}
                    >
                    <img
                      ref={imgRef}
                      src={activeScene.imageUrl}
                      alt={activeScene.name}
                      referrerPolicy="no-referrer"
                      onClick={handleMapClickToWalk}
                      draggable={false}
                      className="block max-h-[72vh] w-auto max-w-full object-contain pixelated"
                    />

                    {/* Optional Pixel Grid */}
                    {gridMode !== 'none' && (
                      <div
                        className="absolute inset-0 pointer-events-none opacity-35"
                        style={{
                          backgroundImage:
                            gridMode === '32px'
                              ? 'linear-gradient(to right, rgba(251, 191, 36, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(251, 191, 36, 0.45) 1px, transparent 1px)'
                              : 'linear-gradient(to right, rgba(56, 189, 248, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.45) 1px, transparent 1px)',
                          backgroundSize: gridMode === '32px' ? '32px 32px' : '16px 16px',
                        }}
                      />
                    )}

                    {/* Animated Props Layer (Draggable & Resizable in 'props' mode!) */}
                    {activeScene.props.map((prop) => {
                      const isPropsMode = engineMode === 'props';
                      const isSelected = isPropsMode && prop.id === selectedPropId;
                      return (
                        <div
                          key={prop.id}
                          onPointerDown={(e) => {
                            if (!isPropsMode) return;
                            e.stopPropagation();
                            e.preventDefault();
                            const coords = getPercentCoords(e.clientX, e.clientY);
                            if (!coords) return;
                            setSelectedPropId(prop.id);
                            setDragAction({
                              type: 'move-prop',
                              targetId: prop.id,
                              startMouseX: coords.x,
                              startMouseY: coords.y,
                              origX: prop.xPercent,
                              origY: prop.yPercent,
                              origW: prop.widthPercent,
                              origH: prop.heightPercent,
                              currentX: coords.x,
                              currentY: coords.y,
                            });
                          }}
                          className={`absolute z-10 ${
                            isPropsMode
                              ? 'cursor-move pointer-events-auto'
                              : 'pointer-events-none'
                          } ${
                            isSelected
                              ? 'ring-2 ring-amber-400 bg-amber-400/10 rounded-sm'
                              : isPropsMode
                                ? 'ring-1 ring-dashed ring-amber-300/60 hover:ring-amber-300'
                                : ''
                          }`}
                          style={{
                            left: `${prop.xPercent}%`,
                            top: `${prop.yPercent}%`,
                            width: `${prop.widthPercent}%`,
                            height: `${prop.heightPercent}%`,
                          }}
                        >
                          <AnimatedPropRenderer item={prop} />

                          {isPropsMode && (
                            <span className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-semibold bg-slate-950/90 text-amber-300 border border-amber-400/40 rounded whitespace-nowrap pointer-events-none">
                              {prop.label}
                            </span>
                          )}

                          {isSelected && (
                            <div
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const coords = getPercentCoords(e.clientX, e.clientY);
                                if (!coords) return;
                                setDragAction({
                                  type: 'resize-prop',
                                  targetId: prop.id,
                                  startMouseX: coords.x,
                                  startMouseY: coords.y,
                                  origX: prop.xPercent,
                                  origY: prop.yPercent,
                                  origW: prop.widthPercent,
                                  origH: prop.heightPercent,
                                  currentX: coords.x,
                                  currentY: coords.y,
                                });
                              }}
                              title="Drag to resize"
                              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border-2 border-slate-950 rounded-sm cursor-nwse-resize"
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Player Spawn / Standing Position Pin (Draggable in 'props' & 'characters' modes) */}
                    {(engineMode === 'props' || engineMode === 'characters') && (
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const coords = getPercentCoords(e.clientX, e.clientY);
                          if (!coords) return;
                          setDragAction({
                            type: 'move-spawn',
                            startMouseX: coords.x,
                            startMouseY: coords.y,
                            origX: activeScene.spawn.x,
                            origY: activeScene.spawn.y,
                            origW: 0,
                            origH: 0,
                            currentX: coords.x,
                            currentY: coords.y,
                          });
                        }}
                        title="Drag to move where the Player Character stands / spawns"
                        className="absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-move px-2 py-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] shadow-lg border-2 border-white flex items-center gap-1 whitespace-nowrap"
                        style={{
                          left: `${activeScene.spawn.x}%`,
                          top: `${activeScene.spawn.y}%`,
                        }}
                      >
                        <User className="w-3 h-3" />
                        {activeScene.lockCharacter ? 'Locked Pos' : 'Spawn'}
                      </div>
                    )}

                    {/* Zones Layer (Editable in 'zones' mode, optionally visible in 'play' mode) */}
                    {(engineMode === 'zones' || showZonesInPlay) && (
                      <div className="absolute inset-0 z-30 pointer-events-none">
                        {activeScene.zones.map((zone) => {
                          const isSolid = zone.collisionType === 'solid';
                          const isMask = zone.collisionType === 'mask';
                          const isDoor = zone.collisionType === 'door';
                          const isZonesMode = engineMode === 'zones' && zoneSubTool === 'select';
                          const isSelected = engineMode === 'zones' && zone.id === selectedZoneId;
                          const targetSceneName = zone.targetSceneId
                            ? scenes.find((sc) => sc.id === zone.targetSceneId)?.name
                            : undefined;
                          const colorClasses = isDoor
                            ? 'border-emerald-400/90 bg-emerald-500/20 text-emerald-100'
                            : isMask
                              ? 'border-cyan-400/90 bg-cyan-500/20 text-cyan-100'
                              : isSolid
                                ? 'border-rose-400/90 bg-rose-500/20 text-rose-100'
                                : 'border-amber-400/90 bg-amber-400/20 text-amber-100';

                          return (
                            <div
                              key={zone.id}
                              onPointerDown={(e) => {
                                if (!isZonesMode) return;
                                e.stopPropagation();
                                e.preventDefault();
                                const coords = getPercentCoords(e.clientX, e.clientY);
                                if (!coords) return;
                                setSelectedZoneId(zone.id);
                                setDragAction({
                                  type: 'move-zone',
                                  targetId: zone.id,
                                  startMouseX: coords.x,
                                  startMouseY: coords.y,
                                  origX: zone.xPercent,
                                  origY: zone.yPercent,
                                  origW: zone.widthPercent,
                                  origH: zone.heightPercent,
                                  currentX: coords.x,
                                  currentY: coords.y,
                                });
                              }}
                              style={{
                                left: `${zone.xPercent}%`,
                                top: `${zone.yPercent}%`,
                                width: `${zone.widthPercent}%`,
                                height: `${zone.heightPercent}%`,
                              }}
                              className={`absolute border-2 border-dashed rounded p-1 flex flex-col justify-between ${colorClasses} ${
                                isZonesMode ? 'pointer-events-auto cursor-move' : 'pointer-events-none'
                              } ${isSelected ? 'ring-2 ring-white' : ''}`}
                            >
                              <div className="text-[10px] font-semibold tracking-tight bg-slate-950/85 px-1.5 py-0.5 rounded self-start truncate max-w-full">
                                {zone.label} ·{' '}
                                {isDoor
                                  ? targetSceneName
                                    ? `DOOR → ${targetSceneName}`
                                    : 'DOOR (Unlinked)'
                                  : isMask
                                    ? 'HIDE/MASK'
                                    : isSolid
                                      ? 'NO-WALK'
                                      : 'INTERACT'}
                              </div>

                              {isSelected && isZonesMode && (
                                <div
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const coords = getPercentCoords(e.clientX, e.clientY);
                                    if (!coords) return;
                                    setDragAction({
                                      type: 'resize-zone',
                                      targetId: zone.id,
                                      startMouseX: coords.x,
                                      startMouseY: coords.y,
                                      origX: zone.xPercent,
                                      origY: zone.yPercent,
                                      origW: zone.widthPercent,
                                      origH: zone.heightPercent,
                                      currentX: coords.x,
                                      currentY: coords.y,
                                    });
                                  }}
                                  title="Drag to resize zone"
                                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-slate-950 rounded-sm cursor-nwse-resize"
                                />
                              )}
                            </div>
                          );
                        })}

                        {/* Draggable Incoming Door Arrival Spawn Pins (position where character lands when entering this room!) */}
                        {engineMode === 'zones' &&
                          scenes.flatMap((srcScene) =>
                            srcScene.zones
                              .filter(
                                (d) =>
                                  d.targetSceneId === activeScene.id &&
                                  (d.collisionType === 'door' || Boolean(d.targetSceneId))
                              )
                              .map((d) => {
                                const targetDoor = d.targetDoorId
                                  ? activeScene.zones.find((z) => z.id === d.targetDoorId)
                                  : undefined;
                                const pinPos =
                                  d.targetSpawn ||
                                  (targetDoor
                                    ? computeSmartLandingForDoor(targetDoor).spawn
                                    : activeScene.spawn);
                                const isActiveIncoming =
                                  dragAction?.type === 'move-door-arrival' &&
                                  dragAction.targetId === d.id &&
                                  dragAction.sourceSceneId === srcScene.id;

                                return (
                                  <div
                                    key={`arrival-${srcScene.id}-${d.id}`}
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const coords = getPercentCoords(e.clientX, e.clientY);
                                      if (!coords) return;
                                      setDragAction({
                                        type: 'move-door-arrival',
                                        targetId: d.id,
                                        sourceSceneId: srcScene.id,
                                        startMouseX: coords.x,
                                        startMouseY: coords.y,
                                        origX: pinPos.x,
                                        origY: pinPos.y,
                                        origW: 0,
                                        origH: 0,
                                        currentX: coords.x,
                                        currentY: coords.y,
                                      });
                                    }}
                                    title={`Drag to move where character spawns when coming from "${d.label}" (${srcScene.name})`}
                                    className={`absolute z-40 -translate-x-1/2 -translate-y-1/2 cursor-move pointer-events-auto px-2 py-1 rounded-full font-bold text-[10px] shadow-xl border-2 flex items-center gap-1 whitespace-nowrap transition-transform ${
                                      isActiveIncoming
                                        ? 'bg-emerald-300 text-slate-950 border-white scale-105'
                                        : 'bg-emerald-500 text-slate-950 border-white hover:bg-emerald-400'
                                    }`}
                                    style={{
                                      left: `${pinPos.x}%`,
                                      top: `${pinPos.y}%`,
                                    }}
                                  >
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span>
                                      In: {d.label} ({srcScene.name})
                                    </span>
                                  </div>
                                );
                              })
                          )}

                        {/* Live Drag-to-Draw Zone Preview */}
                        {drawPreviewBox && (
                          <div
                            style={{
                              left: `${drawPreviewBox.left}%`,
                              top: `${drawPreviewBox.top}%`,
                              width: `${drawPreviewBox.width}%`,
                              height: `${drawPreviewBox.height}%`,
                            }}
                            className={`absolute border-2 rounded ${
                              zoneSubTool === 'draw-door'
                                ? 'border-emerald-400 bg-emerald-500/30'
                                : zoneSubTool === 'draw-mask'
                                  ? 'border-cyan-400 bg-cyan-500/30'
                                  : zoneSubTool === 'draw-solid'
                                    ? 'border-rose-400 bg-rose-500/30'
                                    : 'border-amber-300 bg-amber-400/30'
                            }`}
                          />
                        )}
                      </div>
                    )}

                    {/* Walkable Floor Polygon Bounds Editor */}
                    {engineMode === 'floor' && activeScene.floorPolygon.length >= 3 && (
                      <div className="absolute inset-0 z-30 pointer-events-none">
                        <svg
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          className="w-full h-full"
                        >
                          <polygon
                            points={activeScene.floorPolygon.map((p) => `${p.x},${p.y}`).join(' ')}
                            fill="rgba(56, 189, 248, 0.16)"
                            stroke="#38BDF8"
                            strokeWidth="0.45"
                            strokeDasharray="1.5 1"
                          />
                        </svg>
                        {activeScene.floorPolygon.map((pt, idx) => (
                          <div
                            key={idx}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const coords = getPercentCoords(e.clientX, e.clientY);
                              if (!coords) return;
                              setDragAction({
                                type: 'move-floor-pt',
                                pointIndex: idx,
                                startMouseX: coords.x,
                                startMouseY: coords.y,
                                origX: pt.x,
                                origY: pt.y,
                                origW: 0,
                                origH: 0,
                                currentX: coords.x,
                                currentY: coords.y,
                              });
                            }}
                            title={`Drag Floor Corner ${idx + 1}`}
                            className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-sky-400 border-2 border-slate-950 rounded-full cursor-move pointer-events-auto shadow-lg"
                            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Click-to-walk destination marker */}
                    {walkEnabled && engineMode === 'play' && clickTarget && (
                      <div
                        className="absolute pointer-events-none w-5 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/90 bg-amber-400/20 animate-pulse"
                        style={{
                          left: `${clickTarget.x}%`,
                          top: `${clickTarget.y}%`,
                        }}
                      />
                    )}

                    {/* Depth-sorted Scene Characters (Bodyguards) + Walkable Player */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                      {activeScene.id === 'presidential-rally-stage' &&
                        engineMode === 'play' && (
                          <PixelRallyBallistics active={rallyShotFlash} />
                        )}

                      {visibleStageCharacters.map((ch, idx) => {
                          const isCharMode = engineMode === 'characters';
                          const isSelected = isCharMode && ch.id === selectedCharacterId;
                          const isRallyPlay =
                            activeScene.id === 'presidential-rally-stage' &&
                            engineMode === 'play';
                          const isCrowdSupporter =
                            ch.variant === 'maga-cap-red' ||
                            ch.variant === 'rally-sign-usa' ||
                            ch.variant === 'rally-blonde-vip';
                          const isStageGuardWest = ch.id === 'rally-guard-stage-west';
                          const isStageGuardEast = ch.id === 'rally-guard-stage-east';
                          const isRushingGuard =
                            isRallyPlay &&
                            (rallyEventPhase === 'ducking' ||
                              rallyEventPhase === 'fist-raised') &&
                            (isStageGuardWest || isStageGuardEast);

                          const effectiveX = isRushingGuard
                            ? isStageGuardWest
                              ? 46.8
                              : 53.2
                            : ch.xPercent;
                          const effectiveY = isRushingGuard ? 43.2 : ch.yPercent;

                          const isScaredNow =
                            isRallyPlay &&
                            rallyEventPhase === 'ducking' &&
                            (isCrowdSupporter || ch.variant === 'press-cameraman');

                          const isCheeringNow = isRallyPlay
                            ? (rallyEventPhase === 'speaking' ||
                                rallyEventPhase === 'fist-raised') &&
                              isCrowdSupporter
                            : rallyCheerActive && isCrowdSupporter;

                          let cheerText: string | undefined;
                          if (isScaredNow) {
                            if (idx % 2 === 0) {
                              cheerText =
                                RALLY_SCARED_CRIES[
                                  Math.floor(idx / 2) % RALLY_SCARED_CRIES.length
                                ];
                            }
                          } else if (isRushingGuard && rallyEventPhase === 'ducking') {
                            cheerText = isStageGuardWest
                              ? 'GET DOWN SIR!!'
                              : 'COVER POTUS!!';
                          } else if (isCheeringNow && idx % 2 === 0) {
                            cheerText =
                              rallyEventPhase === 'fist-raised'
                                ? RALLY_FIGHT_CHANTS[
                                    Math.floor(idx / 2) % RALLY_FIGHT_CHANTS.length
                                  ]
                                : RALLY_CROWD_CHANTS[
                                    Math.floor(idx / 2) % RALLY_CROWD_CHANTS.length
                                  ];
                          }

                          const charPose: CharacterPose =
                            activeScene.id === 'presidential-rally-stage' &&
                            engineMode === 'play'
                              ? rallyEventPhase === 'ducking'
                                ? 'ducking'
                                : rallyEventPhase === 'fist-raised'
                                  ? 'fist-raised'
                                  : 'normal'
                              : 'normal';
                          void charPose;

                          return (
                            <div
                              key={ch.id}
                              onPointerDown={(e) => {
                                if (!isCharMode) return;
                                e.stopPropagation();
                                e.preventDefault();
                                const coords = getPercentCoords(e.clientX, e.clientY);
                                if (!coords) return;
                                setSelectedCharacterId(ch.id);
                                setDragAction({
                                  type: 'move-character',
                                  targetId: ch.id,
                                  startMouseX: coords.x,
                                  startMouseY: coords.y,
                                  origX: ch.xPercent,
                                  origY: ch.yPercent,
                                  origW: 0,
                                  origH: 0,
                                  currentX: coords.x,
                                  currentY: coords.y,
                                });
                              }}
                              className={`absolute transition-[left,top] duration-300 ${
                                isCharMode
                                  ? 'pointer-events-auto cursor-move'
                                  : 'pointer-events-none'
                              } ${
                                ch.visible === false ? 'opacity-35' : ''
                              } ${
                                isSelected
                                  ? 'ring-2 ring-cyan-400 bg-cyan-400/10 rounded-sm'
                                  : isCharMode
                                    ? 'ring-1 ring-dashed ring-cyan-300/60 hover:ring-cyan-300'
                                    : ''
                              }`}
                              style={{
                                left: `${effectiveX}%`,
                                top: `${effectiveY}%`,
                                height: `${ch.scalePercent ?? activeScene.characterScale}%`,
                                transform: 'translate(-50%, -92%)',
                                zIndex: Math.round(effectiveY * 10),
                              }}
                            >
                              <PixelBodyguard
                                direction={
                                  isRushingGuard
                                    ? isStageGuardWest
                                      ? 'right'
                                      : 'left'
                                    : ch.direction
                                }
                                variant={ch.variant}
                                cheering={isCheeringNow}
                                scared={isScaredNow}
                                cheerText={cheerText}
                                jumpSeed={ch.id}
                                className="h-full w-auto"
                              />
                              {isCharMode && (
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] font-semibold bg-slate-950/90 text-cyan-300 border border-cyan-400/40 rounded whitespace-nowrap pointer-events-none">
                                  {ch.label}
                                </span>
                              )}
                            </div>
                          );
                        })}

                      {activeScene.id === 'white-house-south-lawn' && (
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            left: '53.5%',
                            top: '13.5%',
                            width: '37%',
                            height: '37%',
                            zIndex:
                              heliFlight.phase === 'takeoff' || heliFlight.phase === 'flying'
                                ? 999
                                : 450,
                          }}
                        >
                          <PixelMarineOne
                            phase={heliFlight.phase}
                            phaseProgress={heliFlight.progress}
                            className="w-full h-full"
                          />
                        </div>
                      )}

                      {walkEnabled && !(heliFlight.active && heliFlight.boarded) && (
                        <div
                          onPointerDown={(e) => {
                            if (engineMode !== 'props' && engineMode !== 'characters') return;
                            e.stopPropagation();
                            e.preventDefault();
                            const coords = getPercentCoords(e.clientX, e.clientY);
                            if (!coords) return;
                            setDragAction({
                              type: 'move-spawn',
                              startMouseX: coords.x,
                              startMouseY: coords.y,
                              origX: activeScene.spawn.x,
                              origY: activeScene.spawn.y,
                              origW: 0,
                              origH: 0,
                              currentX: coords.x,
                              currentY: coords.y,
                            });
                          }}
                          className={`absolute ${
                            engineMode === 'props' || engineMode === 'characters'
                              ? 'pointer-events-auto cursor-move opacity-90 hover:ring-2 hover:ring-emerald-400 rounded-sm'
                              : engineMode !== 'play'
                                ? 'pointer-events-none opacity-45'
                                : 'pointer-events-none'
                          }`}
                          style={{
                            left: `${charPos.x}%`,
                            top: `${
                              activeScene.id === 'presidential-rally-stage' &&
                              engineMode === 'play' &&
                              rallyEventPhase === 'ducking'
                                ? charPos.y + 2.4
                                : charPos.y
                            }%`,
                            height: `${activeScene.characterScale}%`,
                            transform: `translate(-50%, ${
                              isMoving && walkFrame % 2 === 1 ? '-94%' : '-92%'
                            })`,
                            zIndex: Math.round(charPos.y * 10),
                            willChange: 'left, top, transform',
                          }}
                        >
                          <PixelCharacter
                            direction={charDir}
                            walkFrame={walkFrame}
                            isMoving={isMoving}
                            pose={
                              activeScene.id === 'presidential-rally-stage' &&
                              engineMode === 'play'
                                ? (rallyEventPhase === 'ducking'
                                    ? 'ducking'
                                    : rallyEventPhase === 'fist-raised'
                                      ? 'fist-raised'
                                      : 'normal')
                                : 'normal'
                            }
                            speechBubble={
                              activeScene.id === 'presidential-rally-stage' &&
                              engineMode === 'play' &&
                              rallyEventPhase === 'fist-raised'
                                ? 'BAD SHOT! TERRIBLE SHOT!'
                                : activeChatterText || undefined
                            }
                            className="h-full w-auto"
                          />
                        </div>
                      )}
                    </div>

                    {/* Foreground Hide/Mask Cutouts (renders exact background pixels in front of overlapping props/character) */}
                    {maskZones.map((mask) => (
                        <div
                          key={`mask-${mask.id}`}
                          className={`absolute overflow-hidden pointer-events-none ${
                            mask.maskTarget === 'all' ? 'z-[25]' : 'z-[15]'
                          }`}
                          style={{
                            left: `${mask.xPercent}%`,
                            top: `${mask.yPercent}%`,
                            width: `${mask.widthPercent}%`,
                            height: `${mask.heightPercent}%`,
                          }}
                        >
                          <img
                            src={activeScene.imageUrl}
                            alt=""
                            aria-hidden="true"
                            draggable={false}
                            referrerPolicy="no-referrer"
                            className="absolute max-w-none pixelated"
                            style={{
                              width: `${(100 / Math.max(0.1, mask.widthPercent)) * 100}%`,
                              height: `${(100 / Math.max(0.1, mask.heightPercent)) * 100}%`,
                              left: `${-(mask.xPercent / Math.max(0.1, mask.widthPercent)) * 100}%`,
                              top: `${-(mask.yPercent / Math.max(0.1, mask.heightPercent)) * 100}%`,
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Top-Left Compact Pixel DEFCON Counter HUD (driven by Diplomacy) */}
                    {showDayCounter && !fullscreenPlay && !tacticalNuke.active && !terroristBomb.active && !whiteHouseRaid.active && (
                      <div className="absolute top-4 left-4 z-30">
                        <PixelDefconHud security={characteristics.diplomacy ?? 50} />
                      </div>
                    )}

                    {/* Top-Center DEFCON Escalation / Level Change Notification Popup */}
                    {defconToast && !fullscreenPlay && !tacticalNuke.active && !terroristBomb.active && !whiteHouseRaid.active && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                        <PixelDefconNotification toast={defconToast} />
                      </div>
                    )}

                    {/* Daily Random Event Twittly Notification Banner (Stage View) */}
                    {dailyEventToast && !fullscreenPlay && !tacticalNuke.active && !terroristBomb.active && !whiteHouseRaid.active && (
                      <div
                        key={`stage-daily-toast-${dailyEventToast.id}`}
                        onClick={() => {
                          setIsPhoneOpen(true);
                          setDailyEventToast(null);
                        }}
                        style={{
                          imageRendering: 'pixelated',
                          boxShadow:
                            'inset 2px 2px 0 0 #38BDF8, inset -2px -2px 0 0 #0369A1, 0 0 0 3px #090D16, 0 10px 24px rgba(0,0,0,0.75)',
                        }}
                        className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-[#0F172A]/95 border-2 border-[#0EA5E9] px-3.5 py-2.5 cursor-pointer select-none transition-transform hover:scale-[1.01]"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1 mb-1.5">
                          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-sky-300">
                            🔔 TWITTLY BREAKING ALERT · DAY {dailyEventToast.day}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-black uppercase border ${
                              dailyEventToast.event.delta >= 0
                                ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                                : 'bg-red-950 border-red-400 text-red-300'
                            }`}
                          >
                            {dailyEventToast.event.delta >= 0 ? '▲' : '▼'}{' '}
                            {dailyEventToast.statLabel.toUpperCase()}{' '}
                            {dailyEventToast.event.delta >= 0
                              ? `+${dailyEventToast.event.delta}%`
                              : `${dailyEventToast.event.delta}%`}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-100 leading-snug">
                          <span className="text-amber-300 font-bold">
                            {dailyEventToast.event.handle}:
                          </span>{' '}
                          {dailyEventToast.event.headline}
                        </div>
                      </div>
                    )}

                    {/* Prologue Rally Skip to Oval Office Button (Stage View) */}
                    {isPrologueRally && !fullscreenPlay && activeScene.id === 'presidential-rally-stage' && (
                      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40">
                        <button
                          type="button"
                          onClick={completePrologueRallyToOffice}
                          style={{
                            boxShadow:
                              'inset 2px 2px 0 0 #FDE68A, inset -2px -2px 0 0 #78350F, 0 0 0 3px #090D16, 0 6px 16px rgba(0,0,0,0.75)',
                          }}
                          className="px-4 py-2 bg-[#B45309] hover:bg-[#D97706] text-[#FEF3C7] font-mono font-bold text-xs tracking-wider uppercase cursor-pointer"
                        >
                          SKIP TO OVAL OFFICE (DAY 1) →
                        </button>
                      </div>
                    )}

                    {/* Bottom-Left Corner High-Fidelity Pixel Day & Hour HUD */}
                    {showDayCounter && (
                      <div className="absolute bottom-4 left-4 z-30">
                        <PixelDayHud day={currentDay} hour={currentHour} />
                      </div>
                    )}

                    {/* Stage Tactical Nuke Event Overlay */}
                    {tacticalNuke.active && tacticalNuke.country && !fullscreenPlay && (
                      <PixelTacticalNukeOverlay
                        key={`stage-nuke-${tacticalNuke.launchId}`}
                        launchId={tacticalNuke.launchId}
                        startedAtMs={tacticalNuke.startedAtMs}
                        active={tacticalNuke.active}
                        country={tacticalNuke.country}
                        sceneId={activeScene.id}
                        onClose={stopTacticalNukeEvent}
                        onRestartGame={handleRestartAfterNuke}
                      />
                    )}

                    {/* Stage White House Terrorist Bombing Overlay */}
                    {terroristBomb.active && !fullscreenPlay && (
                      <PixelWhiteHouseBombingOverlay
                        key={`stage-bomb-${terroristBomb.launchId}`}
                        launchId={terroristBomb.launchId}
                        startedAtMs={terroristBomb.startedAtMs}
                        active={terroristBomb.active}
                        onClose={stopTerroristBombEvent}
                        onRestartGame={handleRestartAfterNuke}
                      />
                    )}

                    {/* Stage White House & Oval Office Public Raid Overlay */}
                    {whiteHouseRaid.active && !fullscreenPlay && (
                      <PixelWhiteHouseRaidOverlay
                        key={`stage-raid-${whiteHouseRaid.launchId}`}
                        launchId={whiteHouseRaid.launchId}
                        startedAtMs={whiteHouseRaid.startedAtMs}
                        active={whiteHouseRaid.active}
                        onClose={stopWhiteHouseRaidEvent}
                        onRestartGame={handleRestartAfterNuke}
                      />
                    )}

                    {/* Bottom-Right Edge Pixel iPhone (peeks as an edge, opens unlocked in Play Mode) */}
                    {engineMode === 'play' && (
                      <div
                        className={`absolute right-4 z-30 transition-all duration-200 ${
                          isPhoneOpen ? 'bottom-3' : 'bottom-0'
                        }`}
                      >
                        <PixelPhone
                          day={currentDay}
                          hour={currentHour}
                          isOpen={isPhoneOpen}
                          onToggle={() => setIsPhoneOpen((o) => !o)}
                          onClose={() => setIsPhoneOpen(false)}
                          posts={twittlyPosts}
                          unreadCount={unreadTwittly}
                          onMarkRead={() => setUnreadTwittly(0)}
                          onCreateEvent={handleCreateTwittlyEvent}
                          onToggleLike={handleToggleTwittlyLike}
                          onToggleRepost={handleToggleTwittlyRepost}
                          onDeletePost={handleDeleteTwittlyPost}
                        />
                      </div>
                    )}
                  </div>

                  {/* Flight Transition Fade Curtain */}
                  {heliFlight.fadeOpacity > 0.01 && (
                    <div
                      className="absolute inset-0 z-40 bg-[#070A0F] pointer-events-none transition-opacity duration-300"
                      style={{ opacity: heliFlight.fadeOpacity }}
                    />
                  )}

                  {/* Interactive Prompts Row in Play Mode (supports 1 or multiple close interactables: E, R, F) */}
                  {walkEnabled &&
                    engineMode === 'play' &&
                    !heliFlight.active &&
                    nearbyItems.length > 0 &&
                    !activeInteraction && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-4 max-w-[94%]">
                        {nearbyItems.map((item, idx) => {
                          const keyLabel = INTERACT_KEYS[idx] || 'E';
                          if (item.type === 'zone') {
                            const meta = getZonePromptMeta(item.zone, keyLabel);
                            return (
                              <PixelInteractButton
                                key={`zone-${item.zone.id}`}
                                label={item.zone.label}
                                actionText={meta.actionText}
                                kind={meta.kind}
                                keyLabel={keyLabel}
                                onClick={() => handleInteractZone(item.zone)}
                              />
                            );
                          }
                          return (
                            <PixelInteractButton
                              key={`char-${item.character.id}`}
                              label={item.character.label}
                              actionText={`PRESS ${keyLabel} · TALK`}
                              kind="character"
                              keyLabel={keyLabel}
                              onClick={() => handleInteractCharacter(item.character)}
                            />
                          );
                        })}
                      </div>
                    )}

                  {/* Active Interaction Dialogue Card */}
                  {activeInteraction && engineMode === 'play' && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl">
                      <PixelDialogueBox
                        label={activeInteraction.label}
                        description={activeInteraction.description}
                        kind={
                          (activeScene.characters || []).some(
                            (c) => c.id === activeInteraction.id
                          )
                            ? 'character'
                            : getZonePromptMeta(activeInteraction).kind
                        }
                        onPostToTwittly={() => {
                          handleCreateTwittlyEvent({
                            content: `Activity at ${activeInteraction.label}: ${activeInteraction.description}`,
                            tag: 'EVENT',
                            author: 'Executive Desk',
                            handle: '@POTUS',
                            avatarColor: '#B91C1C',
                          });
                          setUnreadTwittly((u) => u + 1);
                          setActiveInteraction(null);
                        }}
                        onClose={() => setActiveInteraction(null)}
                      />
                    </div>
                  )}
                </div>

                {/* Canvas Bottom Control Deck */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-t border-slate-800/80 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                      {(['none', '32px', '16px'] as GridOverlayMode[]).map((g) => (
                        <button
                          key={g}
                          onClick={() => setGridMode(g)}
                          className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            gridMode === g
                              ? 'bg-slate-800 text-amber-400'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {g === 'none' ? 'No Grid' : g}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowZonesInPlay((v) => !v)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        showZonesInPlay
                          ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Show Zones ({activeScene.zones.length})
                    </button>

                    <button
                      onClick={() => setWalkEnabled((v) => !v)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        walkEnabled
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Character {walkEnabled ? 'On' : 'Off'}
                    </button>

                    <button
                      onClick={() => {
                        const nextLocked = !(
                          activeScene.lockCharacter && activeScene.disableInteractions
                        );
                        updateActiveScene((s) => ({
                          ...s,
                          lockCharacter: nextLocked,
                          disableInteractions: nextLocked,
                        }));
                        if (nextLocked) {
                          setActiveInteraction(null);
                          setClickTarget(null);
                          clickTargetRef.current = null;
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activeScene.lockCharacter && activeScene.disableInteractions
                          ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Event Scene (Lock &amp; No Interact){' '}
                      {activeScene.lockCharacter && activeScene.disableInteractions
                        ? 'On'
                        : 'Off'}
                    </button>

                    {activeScene.id === 'presidential-rally-stage' && (
                      <button
                        onClick={startRallyEventSequence}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-red-500/20 border-red-500/50 text-red-200 hover:bg-red-500/30 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Replay Rally Event
                      </button>
                    )}

                    <button
                      onClick={() => setShowDayCounter((v) => !v)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        showDayCounter
                          ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Day Counter {showDayCounter ? 'On' : 'Off'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                    {engineMode === 'play' ? (
                      activeScene.lockCharacter ? (
                        <>
                          <span className="text-amber-300">
                            EVENT SCENE · Character Locked (Move in Characters / Props Dev Tab)
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Pos ({charPos.x.toFixed(0)}%, {charPos.y.toFixed(0)}%)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-emerald-300">WASD / Arrows or Click Floor</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Pos ({charPos.x.toFixed(0)}%, {charPos.y.toFixed(0)}%)
                          </span>
                        </>
                      )
                    ) : engineMode === 'props' ? (
                      <span className="text-amber-300">
                        Drag animated items or use Arrow keys to move · Corner handle resizes
                      </span>
                    ) : engineMode === 'characters' ? (
                      <span className="text-cyan-300">
                        Drag characters or use Arrow keys to position · Add made Bodyguard assets on the right
                      </span>
                    ) : engineMode === 'zones' ? (
                      <span className="text-rose-300">
                        Drag zones to move/resize, or select Draw tool on the right
                      </span>
                    ) : engineMode === 'floor' ? (
                      <span className="text-sky-300">
                        Drag the 4 blue corner pins to adjust walkable room bounds
                      </span>
                    ) : (
                      <span className="text-amber-300">
                        Configure bills &amp; characteristic effects on the right · Sign them at the Resolute Desk in Play Mode
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right-Side Structured Developer Inspector (5 cols in all modes) */}
            <aside className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/75 p-4 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* OVERVIEW & QUICK GAME CONTROLS (default tab when pressing B) */}
              {engineMode === 'play' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-100">
                        Game State &amp; Quick Controls
                      </h2>
                      <p className="text-xs text-slate-400">
                        Adjust stats, DEFCON, day counter, or jump between scenes.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300">
                      Press [B] to close
                    </span>
                  </div>

                  {/* Card 1: Day, Time & Docket Controls */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        Day {currentDay} · {String(currentHour).padStart(2, '0')}:00
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {dailyDeskBatch.billIds.length} bills in today&apos;s batch
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleSleepInBedroom}
                        className="px-3 py-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        +1 Day (Sleep &amp; Deal Bills)
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerDailyRandomEvent(currentDay)}
                        className="px-3 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Trigger Random Event
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Nation Characteristics & DEFCON Sliders */}
                  <DevCharacteristicsPanel
                    characteristics={characteristics}
                    onChangeCharacteristic={(key: CharacteristicKey, val: number) =>
                      setCharacteristics((prev) => ({
                        ...prev,
                        [key]: Math.max(0, Math.min(100, val)),
                      }))
                    }
                    onResetCharacteristics={() => {
                      prevDiplomacyRef.current = DEFAULT_CHARACTERISTICS.diplomacy;
                      prevSecurityRef.current = DEFAULT_CHARACTERISTICS.security;
                      prevApprovalRef.current = DEFAULT_CHARACTERISTICS.approval;
                      prevDefconRef.current = getDefconFromSecurity(
                        DEFAULT_CHARACTERISTICS.diplomacy
                      );
                      setDefconToast(null);
                      setCharacteristics(DEFAULT_CHARACTERISTICS);
                    }}
                  />

                  {/* Card 3: Quick Event Triggers */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5">
                    <div className="text-xs font-semibold text-slate-200">
                      Quick Crisis &amp; Cutscene Triggers
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => triggerTacticalNukeEvent()}
                        className="px-2.5 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Launch Tactical Nuke
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerTerroristBombEvent()}
                        className="px-2.5 py-2 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        White House Bombing
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerWhiteHouseRaidEvent()}
                        className="px-2.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Oval Office Raid
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSceneId('presidential-rally-stage');
                          startRallyEventSequence();
                        }}
                        className="px-2.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Replay Rally Scene
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 1: MOVE & ADD ANIMATED PROPS */}
              {engineMode === 'props' && (
                  <>
                    <div className="space-y-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <Flame className="w-4 h-4 text-amber-400" />
                          Animated Items ({activeScene.props.length})
                        </h2>
                        <span className="text-[11px] text-slate-400">Drag on map</span>
                      </div>

                      {/* Quick-Add Prop Palette */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-medium text-slate-400">
                          Add Animated Prop to Scene:
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PROP_LIBRARY.map((preset) => (
                            <button
                              key={preset.kind}
                              type="button"
                              onClick={() => handleAddAnimatedProp(preset.kind)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors text-left truncate cursor-pointer"
                            >
                              <Plus className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Active Props List */}
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {activeScene.props.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPropId(p.id)}
                          className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            p.id === selectedPropId
                              ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                              : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-medium truncate">{p.label}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateActiveScene((s) => ({
                                  ...s,
                                  props: s.props.map((item) =>
                                    item.id === p.id
                                      ? { ...item, visible: item.visible === false }
                                      : item
                                  ),
                                }));
                              }}
                              title="Toggle Visibility"
                              className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            >
                              {p.visible === false ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateActiveScene((s) => ({
                                  ...s,
                                  props: s.props.filter((item) => item.id !== p.id),
                                }));
                                if (selectedPropId === p.id) setSelectedPropId(null);
                              }}
                              title="Remove Item"
                              className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Prop Controls (Move Left/Right/Up/Down, Resize, Skew, Speed) */}
                    {selectedProp ? (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">
                            Selected Item Name
                          </label>
                          <input
                            type="text"
                            value={selectedProp.label}
                            onChange={(e) =>
                              updateActiveScene((s) => ({
                                ...s,
                                props: s.props.map((p) =>
                                  p.id === selectedProp.id ? { ...p, label: e.target.value } : p
                                ),
                              }))
                            }
                            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-md px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                          />
                        </div>

                        {/* Directional Move Pad (Left / Right / Up / Down) */}
                        <div className="flex items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-slate-200">
                              Move Position
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              X: {selectedProp.xPercent}% · Y: {selectedProp.yPercent}%
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1 w-24 shrink-0">
                            <div />
                            <button
                              type="button"
                              onClick={() => handleNudgeProp(selectedProp.id, 0, -0.5)}
                              aria-label="Move Up"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <div />
                            <button
                              type="button"
                              onClick={() => handleNudgeProp(selectedProp.id, -0.5, 0)}
                              aria-label="Move Left"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNudgeProp(selectedProp.id, 0, 0.5)}
                              aria-label="Move Down"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNudgeProp(selectedProp.id, 0.5, 0)}
                              aria-label="Move Right"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* X / Y / Width / Height Sliders */}
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <label className="space-y-1">
                            <span className="text-[11px] text-slate-400 flex justify-between font-mono">
                              <span>Left (X)</span>
                              <span>{selectedProp.xPercent}%</span>
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={96}
                              step={0.1}
                              value={selectedProp.xPercent}
                              onChange={(e) =>
                                updateActiveScene((s) => ({
                                  ...s,
                                  props: s.props.map((p) =>
                                    p.id === selectedProp.id
                                      ? { ...p, xPercent: +e.target.value }
                                      : p
                                  ),
                                }))
                              }
                              className="w-full accent-amber-400"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[11px] text-slate-400 flex justify-between font-mono">
                              <span>Top (Y)</span>
                              <span>{selectedProp.yPercent}%</span>
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={96}
                              step={0.1}
                              value={selectedProp.yPercent}
                              onChange={(e) =>
                                updateActiveScene((s) => ({
                                  ...s,
                                  props: s.props.map((p) =>
                                    p.id === selectedProp.id
                                      ? { ...p, yPercent: +e.target.value }
                                      : p
                                  ),
                                }))
                              }
                              className="w-full accent-amber-400"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[11px] text-slate-400 flex justify-between font-mono">
                              <span>Width</span>
                              <span>{selectedProp.widthPercent}%</span>
                            </span>
                            <input
                              type="range"
                              min={1}
                              max={30}
                              step={0.1}
                              value={selectedProp.widthPercent}
                              onChange={(e) =>
                                updateActiveScene((s) => ({
                                  ...s,
                                  props: s.props.map((p) =>
                                    p.id === selectedProp.id
                                      ? { ...p, widthPercent: +e.target.value }
                                      : p
                                  ),
                                }))
                              }
                              className="w-full accent-amber-400"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[11px] text-slate-400 flex justify-between font-mono">
                              <span>Height</span>
                              <span>{selectedProp.heightPercent}%</span>
                            </span>
                            <input
                              type="range"
                              min={1}
                              max={30}
                              step={0.1}
                              value={selectedProp.heightPercent}
                              onChange={(e) =>
                                updateActiveScene((s) => ({
                                  ...s,
                                  props: s.props.map((p) =>
                                    p.id === selectedProp.id
                                      ? { ...p, heightPercent: +e.target.value }
                                      : p
                                  ),
                                }))
                              }
                              className="w-full accent-amber-400"
                            />
                          </label>
                        </div>

                        {/* Skew & Speed Controls */}
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <label className="space-y-1">
                            <span className="text-[11px] text-slate-400 flex justify-between font-mono">
                              <span>Perspective Skew</span>
                              <span>{selectedProp.skewY ?? 0}°</span>
                            </span>
                            <input
                              type="range"
                              min={-35}
                              max={35}
                              step={1}
                              value={selectedProp.skewY ?? 0}
                              onChange={(e) =>
                                updateActiveScene((s) => ({
                                  ...s,
                                  props: s.props.map((p) =>
                                    p.id === selectedProp.id
                                      ? { ...p, skewY: +e.target.value }
                                      : p
                                  ),
                                }))
                              }
                              className="w-full accent-amber-400"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[11px] text-slate-400 flex justify-between font-mono">
                              <span>Anim Speed</span>
                              <span>{selectedProp.speed ?? 1}x</span>
                            </span>
                            <input
                              type="range"
                              min={0.4}
                              max={2.2}
                              step={0.1}
                              value={selectedProp.speed ?? 1}
                              onChange={(e) =>
                                updateActiveScene((s) => ({
                                  ...s,
                                  props: s.props.map((p) =>
                                    p.id === selectedProp.id
                                      ? { ...p, speed: +e.target.value }
                                      : p
                                  ),
                                }))
                              }
                              className="w-full accent-amber-400"
                            />
                          </label>
                        </div>

                        {/* Crop Overlapping Edges (%) */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-300">
                              Crop Edges (%)
                            </span>
                            {selectedProp.crop &&
                              (selectedProp.crop.top > 0 ||
                                selectedProp.crop.right > 0 ||
                                selectedProp.crop.bottom > 0 ||
                                selectedProp.crop.left > 0) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateActiveScene((s) => ({
                                      ...s,
                                      props: s.props.map((p) =>
                                        p.id === selectedProp.id
                                          ? {
                                              ...p,
                                              crop: { top: 0, right: 0, bottom: 0, left: 0 },
                                            }
                                          : p
                                      ),
                                    }))
                                  }
                                  className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                                >
                                  Reset Crop
                                </button>
                              )}
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 text-xs">
                            {(['top', 'right', 'bottom', 'left'] as const).map((edge) => {
                              const currentVal = selectedProp.crop?.[edge] ?? 0;
                              return (
                                <label key={edge} className="space-y-1">
                                  <span className="text-[11px] text-slate-400 flex justify-between font-mono tabular-nums capitalize">
                                    <span>Crop {edge}</span>
                                    <span>{currentVal}%</span>
                                  </span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={45}
                                    step={1}
                                    value={currentVal}
                                    onChange={(e) => {
                                      const val = +e.target.value;
                                      updateActiveScene((s) => ({
                                        ...s,
                                        props: s.props.map((p) =>
                                          p.id === selectedProp.id
                                            ? {
                                                ...p,
                                                crop: {
                                                  top: p.crop?.top ?? 0,
                                                  right: p.crop?.right ?? 0,
                                                  bottom: p.crop?.bottom ?? 0,
                                                  left: p.crop?.left ?? 0,
                                                  [edge]: val,
                                                },
                                              }
                                            : p
                                        ),
                                      }));
                                    }}
                                    className="w-full accent-cyan-400"
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 pt-2">
                        Select an animated item on the map or add one above to move and resize it.
                      </p>
                    )}

                    {/* Character Height Slider & Play Camera Zoom */}
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-slate-400 flex justify-between font-mono">
                          <span>Character Height Scale</span>
                          <span>{activeScene.characterScale}%</span>
                        </span>
                        <input
                          type="range"
                          min={6}
                          max={28}
                          step={0.5}
                          value={activeScene.characterScale}
                          onChange={(e) =>
                            updateActiveScene((s) => ({ ...s, characterScale: +e.target.value }))
                          }
                          className="w-full accent-emerald-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] text-slate-400 flex justify-between font-mono">
                          <span>Play Camera Zoom</span>
                          <span>{(activeScene.cameraZoom ?? 1).toFixed(2)}x</span>
                        </span>
                        <input
                          type="range"
                          min={1}
                          max={2.6}
                          step={0.05}
                          value={activeScene.cameraZoom ?? 1}
                          onChange={(e) =>
                            updateActiveScene((s) => ({ ...s, cameraZoom: +e.target.value }))
                          }
                          className="w-full accent-amber-400"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* MODE 1B: CHARACTER ASSETS DEV PAGE (BODYGUARDS & EVENT SCENE CONTROLS) */}
                {engineMode === 'characters' && (
                  <>
                    {/* Event Scene Mode & Locked Character Standing Position */}
                    <div className="space-y-3 border-b border-slate-800 pb-3.5 bg-slate-950/70 p-3 rounded-lg border">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                            Event Scene &amp; Player Lock
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            Immobilize character, remove all interact buttons &amp; choose standing spot
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !(
                              activeScene.lockCharacter && activeScene.disableInteractions
                            );
                            updateActiveScene((s) => ({
                              ...s,
                              lockCharacter: nextState,
                              disableInteractions: nextState,
                            }));
                            if (nextState) {
                              setActiveInteraction(null);
                              setClickTarget(null);
                              clickTargetRef.current = null;
                            }
                          }}
                          className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded border cursor-pointer shrink-0 transition-colors ${
                            activeScene.lockCharacter && activeScene.disableInteractions
                              ? 'bg-amber-400 text-slate-950 border-amber-300'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          {activeScene.lockCharacter && activeScene.disableInteractions
                            ? 'EVENT SCENE: ON'
                            : 'MAKE EVENT SCENE'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-200 bg-slate-900/90 border border-slate-800 rounded px-2 py-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(activeScene.lockCharacter)}
                            onChange={(e) =>
                              updateActiveScene((s) => ({
                                ...s,
                                lockCharacter: e.target.checked,
                              }))
                            }
                            className="rounded border-slate-700 bg-slate-950 text-amber-400"
                          />
                          <span>Lock Character</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-[11px] text-slate-200 bg-slate-900/90 border border-slate-800 rounded px-2 py-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(activeScene.disableInteractions)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateActiveScene((s) => ({
                                ...s,
                                disableInteractions: checked,
                              }));
                              if (checked) setActiveInteraction(null);
                            }}
                            className="rounded border-slate-700 bg-slate-950 text-amber-400"
                          />
                          <span>No Interact Buttons</span>
                        </label>
                      </div>

                      {/* Choose Where the Character Stands (X%, Y% & Facing) */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300">
                          <span>Character Standing Position (or drag on map)</span>
                          <span>
                            ({activeScene.spawn.x}%, {activeScene.spawn.y}%)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <label className="space-y-0.5 text-[10px] text-slate-400 font-mono">
                            <span className="flex justify-between">
                              <span>Pos X</span>
                              <span>{activeScene.spawn.x}%</span>
                            </span>
                            <input
                              type="range"
                              min={5}
                              max={95}
                              step={0.5}
                              value={activeScene.spawn.x}
                              onChange={(e) => {
                                const nextX = +e.target.value;
                                const nextPos = { x: nextX, y: activeScene.spawn.y };
                                updateActiveScene((s) => ({ ...s, spawn: nextPos }));
                                charPosRef.current = nextPos;
                                setCharPos(nextPos);
                              }}
                              className="w-full accent-emerald-400"
                            />
                          </label>

                          <label className="space-y-0.5 text-[10px] text-slate-400 font-mono">
                            <span className="flex justify-between">
                              <span>Pos Y</span>
                              <span>{activeScene.spawn.y}%</span>
                            </span>
                            <input
                              type="range"
                              min={10}
                              max={95}
                              step={0.5}
                              value={activeScene.spawn.y}
                              onChange={(e) => {
                                const nextY = +e.target.value;
                                const nextPos = { x: activeScene.spawn.x, y: nextY };
                                updateActiveScene((s) => ({ ...s, spawn: nextPos }));
                                charPosRef.current = nextPos;
                                setCharPos(nextPos);
                              }}
                              className="w-full accent-emerald-400"
                            />
                          </label>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-medium text-slate-400">
                            Character Facing Direction
                          </span>
                          <div className="grid grid-cols-4 gap-1">
                            {(['down', 'up', 'left', 'right'] as Direction[]).map((dir) => {
                              const currentDir = activeScene.spawnDirection || charDir;
                              return (
                                <button
                                  key={dir}
                                  type="button"
                                  onClick={() => {
                                    updateActiveScene((s) => ({
                                      ...s,
                                      spawnDirection: dir,
                                    }));
                                    setCharDirSafe(dir);
                                  }}
                                  className={`py-1 text-[10px] font-semibold uppercase rounded border cursor-pointer transition-colors ${
                                    currentDir === dir
                                      ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                  }`}
                                >
                                  {dir}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-cyan-400" />
                          Character Assets ({(activeScene.characters || []).length})
                        </h2>
                        <span className="text-[11px] text-slate-400">Drag on scene</span>
                      </div>

                      {/* Made Character Assets Palette (Only Bodyguards for now) */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-slate-300">
                            Made Character Assets
                          </span>
                          <span className="text-slate-500">Secret Service Bodyguards</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {CHARACTER_ASSET_LIBRARY.map((asset) => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() =>
                                handleAddCharacterAsset(
                                  asset.kind,
                                  asset.variant,
                                  asset.name,
                                  asset.defaultDialogue
                                )
                              }
                              className="group flex flex-col items-center gap-2 p-2.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/60 transition-colors text-center cursor-pointer"
                            >
                              <div className="h-16 flex items-center justify-center">
                                <PixelBodyguard
                                  direction="down"
                                  variant={asset.variant}
                                  className="h-16 w-auto"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <div className="text-[11px] font-semibold text-slate-100 group-hover:text-cyan-300">
                                  {asset.name}
                                </div>
                                <div className="text-[10px] text-slate-400">{asset.subtitle}</div>
                              </div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 text-[10px] font-semibold">
                                <Plus className="w-3 h-3" />
                                Place in Scene
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Placed Characters in Current Scene */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {(activeScene.characters || []).length === 0 ? (
                        <p className="text-xs text-slate-400 py-2">
                          No characters placed in this scene yet. Click a Bodyguard asset above to place one.
                        </p>
                      ) : (
                        (activeScene.characters || []).map((ch) => (
                          <div
                            key={ch.id}
                            onClick={() => setSelectedCharacterId(ch.id)}
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              ch.id === selectedCharacterId
                                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                                : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-6 w-4 shrink-0 flex items-center justify-center">
                                <PixelBodyguard
                                  direction={ch.direction}
                                  variant={ch.variant}
                                  className="h-6 w-auto"
                                />
                              </div>
                              <span className="font-medium truncate">{ch.label}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateCharacter(ch);
                                }}
                                title="Duplicate Character"
                                className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateActiveScene((s) => ({
                                    ...s,
                                    characters: (s.characters || []).map((item) =>
                                      item.id === ch.id
                                        ? { ...item, visible: item.visible === false }
                                        : item
                                    ),
                                  }));
                                }}
                                title="Toggle Visibility"
                                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                              >
                                {ch.visible === false ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateActiveScene((s) => ({
                                    ...s,
                                    characters: (s.characters || []).filter(
                                      (item) => item.id !== ch.id
                                    ),
                                  }));
                                  if (selectedCharacterId === ch.id) {
                                    setSelectedCharacterId(null);
                                  }
                                }}
                                title="Remove Character"
                                className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Selected Character Inspector */}
                    {selectedCharacter ? (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">
                            Character Name
                          </label>
                          <input
                            type="text"
                            value={selectedCharacter.label}
                            onChange={(e) =>
                              updateActiveScene((s) => ({
                                ...s,
                                characters: (s.characters || []).map((c) =>
                                  c.id === selectedCharacter.id
                                    ? { ...c, label: e.target.value }
                                    : c
                                ),
                              }))
                            }
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-md px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                          />
                        </div>

                        {/* Character Style Variant */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-slate-400">
                            NPC / Character Appearance
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(
                              [
                                { id: 'dark-hair', label: 'Agent (Dark Hair)' },
                                { id: 'buzz-cut', label: 'Agent (Buzz Cut)' },
                                { id: 'maga-cap-red', label: 'Rally Red Cap' },
                                { id: 'rally-sign-usa', label: 'Rally USA Sign' },
                                { id: 'rally-blonde-vip', label: 'Rally VIP Flag' },
                                { id: 'press-cameraman', label: 'Press Camera' },
                              ] as const
                            ).map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() =>
                                  updateActiveScene((s) => ({
                                    ...s,
                                    characters: (s.characters || []).map((c) =>
                                      c.id === selectedCharacter.id
                                        ? { ...c, variant: v.id }
                                        : c
                                    ),
                                  }))
                                }
                                className={`py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                                  (selectedCharacter.variant || 'dark-hair') === v.id
                                    ? 'bg-cyan-400/20 border-cyan-400 text-cyan-200'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {v.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Facing Direction */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-slate-400">
                            Facing Direction
                          </span>
                          <div className="grid grid-cols-4 gap-1">
                            {(['down', 'up', 'left', 'right'] as Direction[]).map((dir) => (
                              <button
                                key={dir}
                                type="button"
                                onClick={() =>
                                  updateActiveScene((s) => ({
                                    ...s,
                                    characters: (s.characters || []).map((c) =>
                                      c.id === selectedCharacter.id
                                        ? { ...c, direction: dir }
                                        : c
                                    ),
                                  }))
                                }
                                className={`py-1 text-[11px] font-semibold uppercase rounded border cursor-pointer transition-colors ${
                                  selectedCharacter.direction === dir
                                    ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                }`}
                              >
                                {dir}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Directional Move Pad + Coordinates */}
                        <div className="flex items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-slate-200">
                              Character Position
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              X: {selectedCharacter.xPercent}% · Y: {selectedCharacter.yPercent}%
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1 w-24 shrink-0">
                            <div />
                            <button
                              type="button"
                              onClick={() => handleNudgeCharacter(selectedCharacter.id, 0, -0.5)}
                              aria-label="Move Character Up"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <div />
                            <button
                              type="button"
                              onClick={() => handleNudgeCharacter(selectedCharacter.id, -0.5, 0)}
                              aria-label="Move Character Left"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNudgeCharacter(selectedCharacter.id, 0, 0.5)}
                              aria-label="Move Character Down"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNudgeCharacter(selectedCharacter.id, 0.5, 0)}
                              aria-label="Move Character Right"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Scale & Collision */}
                        <div className="space-y-2">
                          <label className="space-y-1 block">
                            <span className="text-[11px] text-slate-400 flex justify-between font-mono">
                              <span>Guard Height Scale</span>
                              <span>
                                {selectedCharacter.scalePercent ?? activeScene.characterScale}%
                              </span>
                            </span>
                            <input
                              type="range"
                              min={10}
                              max={28}
                              step={0.5}
                              value={selectedCharacter.scalePercent ?? activeScene.characterScale}
                              onChange={(e) =>
                                updateActiveScene((s) => ({
                                  ...s,
                                  characters: (s.characters || []).map((c) =>
                                    c.id === selectedCharacter.id
                                      ? { ...c, scalePercent: +e.target.value }
                                      : c
                                  ),
                                }))
                              }
                              className="w-full accent-cyan-400"
                            />
                          </label>

                          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedCharacter.blocksWalk)}
                              onChange={(e) =>
                                updateActiveScene((s) => ({
                                  ...s,
                                  characters: (s.characters || []).map((c) =>
                                    c.id === selectedCharacter.id
                                      ? { ...c, blocksWalk: e.target.checked }
                                      : c
                                  ),
                                }))
                              }
                              className="rounded border-slate-700 bg-slate-950 text-cyan-400"
                            />
                            Block walking past character
                          </label>
                        </div>

                        {/* Dialogue */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">
                            Dialogue (when pressing E nearby)
                          </label>
                          <textarea
                            rows={2}
                            value={selectedCharacter.dialogue || ''}
                            onChange={(e) =>
                              updateActiveScene((s) => ({
                                ...s,
                                characters: (s.characters || []).map((c) =>
                                  c.id === selectedCharacter.id
                                    ? { ...c, dialogue: e.target.value }
                                    : c
                                ),
                              }))
                            }
                            placeholder="Optional line when player presses E nearby..."
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-md px-2.5 py-1.5 text-xs text-slate-100 outline-none resize-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 pt-1">
                        Select a character on the scene or place a Bodyguard asset above to configure it.
                      </p>
                    )}
                  </>
                )}

                {/* MODE 2: EDIT & DRAW ZONES & DOORS */}
                {engineMode === 'zones' && (
                  <>
                    <div className="space-y-2.5 border-b border-slate-800 pb-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-100">
                          Zones & Doors ({activeScene.zones.length})
                        </h2>
                        <span className="text-[11px] text-slate-400">Drag or Draw</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setZoneSubTool('select')}
                          className={`col-span-2 px-2 py-1.5 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                            zoneSubTool === 'select'
                              ? 'bg-slate-800 border-slate-600 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Select / Move Zones & Arrival Pins
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setZoneSubTool((t) => (t === 'draw-door' ? 'select' : 'draw-door'))
                          }
                          className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            zoneSubTool === 'draw-door'
                              ? 'bg-emerald-400 text-slate-950'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                          title="Draw a doorway that teleports to a chosen door & spawn in another scene"
                        >
                          <DoorOpen className="w-3 h-3" />
                          + Add Door
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setZoneSubTool((t) =>
                              t === 'draw-interactive' ? 'select' : 'draw-interactive'
                            )
                          }
                          className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            zoneSubTool === 'draw-interactive'
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          + Interact
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setZoneSubTool((t) => (t === 'draw-solid' ? 'select' : 'draw-solid'))
                          }
                          className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            zoneSubTool === 'draw-solid'
                              ? 'bg-rose-500 text-white'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          <Ban className="w-3 h-3" />
                          + No-Walk
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setZoneSubTool((t) => (t === 'draw-mask' ? 'select' : 'draw-mask'))
                          }
                          className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            zoneSubTool === 'draw-mask'
                              ? 'bg-cyan-400 text-slate-950'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}
                          title="Draw a zone that hides overlapping animated items behind the background"
                        >
                          <EyeOff className="w-3 h-3" />
                          + Hide / Mask
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {activeScene.zones.map((z) => {
                        const isSolid = z.collisionType === 'solid';
                        const isMask = z.collisionType === 'mask';
                        const isDoor = z.collisionType === 'door';
                        return (
                          <div
                            key={z.id}
                            onClick={() => {
                              setSelectedZoneId(z.id);
                              setZoneSubTool('select');
                            }}
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              z.id === selectedZoneId
                                ? 'border-white bg-slate-800 text-white'
                                : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  isDoor
                                    ? 'bg-emerald-400'
                                    : isMask
                                      ? 'bg-cyan-400'
                                      : isSolid
                                        ? 'bg-rose-400'
                                        : 'bg-amber-400'
                                }`}
                              />
                              <span className="truncate font-medium">{z.label}</span>
                              {isDoor && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                  Door
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateActiveScene((s) => ({
                                  ...s,
                                  zones: s.zones.filter((item) => item.id !== z.id),
                                }));
                                if (selectedZoneId === z.id) setSelectedZoneId(null);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer shrink-0"
                              title="Delete Zone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {selectedZone && (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <input
                          type="text"
                          value={selectedZone.label}
                          onChange={(e) =>
                            updateActiveScene((s) => ({
                              ...s,
                              zones: s.zones.map((z) =>
                                z.id === selectedZone.id ? { ...z, label: e.target.value } : z
                              ),
                            }))
                          }
                          aria-label="Zone Label"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-100 outline-none"
                        />

                        <div className="grid grid-cols-2 gap-1.5">
                          {(
                            [
                              { type: 'door', label: 'Door' },
                              { type: 'interactive', label: 'Interact' },
                              { type: 'solid', label: 'No-Walk' },
                              { type: 'mask', label: 'Hide / Mask' },
                            ] as Array<{ type: ZoneType; label: string }>
                          ).map((opt) => {
                            const active = selectedZone.collisionType === opt.type;
                            const activeStyle =
                              opt.type === 'door'
                                ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                                : opt.type === 'mask'
                                  ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                                  : opt.type === 'solid'
                                    ? 'bg-rose-500 text-white border-rose-400'
                                    : 'bg-amber-400 text-slate-950 border-amber-300';
                            return (
                              <button
                                key={opt.type}
                                type="button"
                                onClick={() =>
                                  updateActiveScene((s) => ({
                                    ...s,
                                    zones: s.zones.map((z) =>
                                      z.id === selectedZone.id
                                        ? {
                                            ...z,
                                            collisionType: opt.type,
                                            blocksWalk:
                                              opt.type === 'solid'
                                                ? true
                                                : opt.type === 'mask'
                                                  ? false
                                                  : opt.type === 'door'
                                                    ? false
                                                    : z.blocksWalk,
                                            maskTarget:
                                              opt.type === 'mask'
                                                ? z.maskTarget || 'props'
                                                : z.maskTarget,
                                            targetSceneId:
                                              opt.type === 'door' ? z.targetSceneId : undefined,
                                            targetDoorId:
                                              opt.type === 'door' ? z.targetDoorId : undefined,
                                            targetSpawn:
                                              opt.type === 'door' ? z.targetSpawn : undefined,
                                            targetDirection:
                                              opt.type === 'door' ? z.targetDirection : undefined,
                                          }
                                        : z
                                    ),
                                  }))
                                }
                                className={`px-2 py-1.5 text-[11px] font-semibold rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                                  active
                                    ? activeStyle
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>

                        <textarea
                          rows={2}
                          value={selectedZone.description}
                          onChange={(e) =>
                            updateActiveScene((s) => ({
                              ...s,
                              zones: s.zones.map((z) =>
                                z.id === selectedZone.id ? { ...z, description: e.target.value } : z
                              ),
                            }))
                          }
                          placeholder="Interaction dialogue or door prompt..."
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none resize-none"
                        />

                        {(selectedZone.collisionType === 'door' ||
                          selectedZone.collisionType === 'interactive') && (
                          <div className="flex flex-col gap-2">
                            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(selectedZone.blocksWalk)}
                                onChange={(e) =>
                                  updateActiveScene((s) => ({
                                    ...s,
                                    zones: s.zones.map((z) =>
                                      z.id === selectedZone.id
                                        ? { ...z, blocksWalk: e.target.checked }
                                        : z
                                    ),
                                  }))
                                }
                                className="rounded border-slate-700 bg-slate-950 text-amber-400"
                              />
                              Also block walking inside this zone
                            </label>

                            {selectedZone.collisionType === 'interactive' && (
                              <label className="space-y-1 block">
                                <span className="text-[11px] font-medium text-slate-400">
                                  On Interact Action
                                </span>
                                <select
                                  value={
                                    selectedZone.opensModal ||
                                    (selectedZone.id === 'coffee-table'
                                      ? 'world-map'
                                      : selectedZone.id === 'desk-phone'
                                        ? 'desk-phone'
                                        : selectedZone.id === 'resolute-desk'
                                          ? 'resolute-desk'
                                          : 'dialogue')
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateActiveScene((s) => ({
                                      ...s,
                                      zones: s.zones.map((z) =>
                                        z.id === selectedZone.id
                                          ? {
                                              ...z,
                                              opensModal:
                                                val === 'world-map' ||
                                                val === 'desk-phone' ||
                                                val === 'resolute-desk'
                                                  ? val
                                                  : undefined,
                                            }
                                          : z
                                      ),
                                    }));
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-md px-2.5 py-1.5 text-xs text-slate-100 outline-none cursor-pointer"
                                >
                                  <option value="dialogue">Show Description / Dialogue Card</option>
                                  <option value="resolute-desk">Open Resolute Executive Desk (Sign Bills)</option>
                                  <option value="world-map">Open Cabinet World Map</option>
                                  <option value="desk-phone">Open Executive Desk Phone (Call)</option>
                                </select>
                              </label>
                            )}
                          </div>
                        )}

                        {/* Dedicated Door Options: Destination Scene, Target Door & Movable Arrival Spawn */}
                        {selectedZone.collisionType === 'door' && (() => {
                          const targetScene = scenes.find(
                            (sc) => sc.id === selectedZone.targetSceneId
                          );
                          const targetSceneDoors = targetScene
                            ? targetScene.zones.filter(
                                (tz) =>
                                  tz.collisionType === 'door' &&
                                  !(
                                    targetScene.id === activeScene.id &&
                                    tz.id === selectedZone.id
                                  )
                              )
                            : [];
                          const chosenTargetDoor = targetSceneDoors.find(
                            (tz) => tz.id === selectedZone.targetDoorId
                          );
                          const currentArrival =
                            selectedZone.targetSpawn ||
                            (chosenTargetDoor
                              ? computeSmartLandingForDoor(chosenTargetDoor).spawn
                              : targetScene?.spawn) || { x: 50, y: 75 };
                          const needsReturnLink =
                            Boolean(targetScene && chosenTargetDoor) &&
                            (chosenTargetDoor?.targetSceneId !== activeScene.id ||
                              chosenTargetDoor?.targetDoorId !== selectedZone.id);

                          return (
                            <div className="space-y-3 rounded-lg border border-emerald-500/35 bg-emerald-950/20 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                                  <DoorOpen className="w-3.5 h-3.5" />
                                  Door Teleport Options
                                </span>
                                {targetScene && targetScene.id !== activeScene.id && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveSceneId(targetScene.id)}
                                    className="text-[10px] font-semibold text-emerald-300 hover:text-emerald-200 underline cursor-pointer whitespace-nowrap"
                                  >
                                    Go to Scene →
                                  </button>
                                )}
                              </div>

                              {/* 1. Target Scene Selector */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-300">
                                  Destination Scene
                                </label>
                                <select
                                  value={selectedZone.targetSceneId || ''}
                                  onChange={(e) => {
                                    const nextId = e.target.value || undefined;
                                    const dest = scenes.find((sc) => sc.id === nextId);
                                    const firstDoor = dest?.zones.find(
                                      (tz) =>
                                        tz.collisionType === 'door' &&
                                        !(dest.id === activeScene.id && tz.id === selectedZone.id)
                                    );
                                    const smart = firstDoor
                                      ? computeSmartLandingForDoor(firstDoor)
                                      : null;
                                    updateActiveScene((s) => ({
                                      ...s,
                                      zones: s.zones.map((z) =>
                                        z.id === selectedZone.id
                                          ? {
                                              ...z,
                                              collisionType: nextId ? 'door' : z.collisionType,
                                              targetSceneId: nextId,
                                              targetDoorId: firstDoor?.id,
                                              targetSpawn: dest
                                                ? smart?.spawn || dest.spawn
                                                : undefined,
                                              targetDirection: smart?.direction,
                                            }
                                          : z
                                      ),
                                    }));
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                                >
                                  <option value="">None (Not Linked)</option>
                                  {scenes.map((sc) => (
                                    <option key={sc.id} value={sc.id}>
                                      {sc.name}
                                      {sc.id === activeScene.id ? ' (This Scene)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* 2. Target Door Selector inside chosen Destination Scene */}
                              {targetScene && (
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-slate-300">
                                    Select Door in &quot;{targetScene.name}&quot;
                                  </label>
                                  <select
                                    value={selectedZone.targetDoorId || ''}
                                    onChange={(e) => {
                                      const nextDoorId = e.target.value || undefined;
                                      const picked = targetSceneDoors.find(
                                        (d) => d.id === nextDoorId
                                      );
                                      const smart = picked
                                        ? computeSmartLandingForDoor(picked)
                                        : null;
                                      updateActiveScene((s) => ({
                                        ...s,
                                        zones: s.zones.map((z) =>
                                          z.id === selectedZone.id
                                            ? {
                                                ...z,
                                                targetDoorId: nextDoorId,
                                                targetSpawn: smart
                                                  ? smart.spawn
                                                  : z.targetSpawn || targetScene.spawn,
                                                targetDirection:
                                                  smart?.direction || z.targetDirection,
                                              }
                                            : z
                                        ),
                                      }));
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                                  >
                                    <option value="">Custom Spawn Point Only</option>
                                    {targetSceneDoors.map((tz) => (
                                      <option key={tz.id} value={tz.id}>
                                        {tz.label} ({tz.collisionType === 'door' ? 'Door' : 'Zone'})
                                      </option>
                                    ))}
                                  </select>
                                  {targetSceneDoors.length === 0 && (
                                    <p className="text-[10px] text-slate-400">
                                      No doors created in {targetScene.name} yet — add a door there
                                      or position the arrival pin below.
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* One-click Return Door Linker */}
                              {targetScene && chosenTargetDoor && needsReturnLink && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const returnSmart = computeSmartLandingForDoor(selectedZone);
                                    setScenes((prev) =>
                                      prev.map((sc) =>
                                        sc.id === targetScene.id
                                          ? {
                                              ...sc,
                                              zones: sc.zones.map((tz) =>
                                                tz.id === chosenTargetDoor.id
                                                  ? {
                                                      ...tz,
                                                      collisionType: 'door',
                                                      targetSceneId: activeScene.id,
                                                      targetDoorId: selectedZone.id,
                                                      targetSpawn: returnSmart.spawn,
                                                      targetDirection: returnSmart.direction,
                                                    }
                                                  : tz
                                              ),
                                            }
                                          : sc
                                      )
                                    );
                                  }}
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 rounded-md transition-colors cursor-pointer"
                                >
                                  Link &quot;{chosenTargetDoor.label}&quot; Back to This Door
                                </button>
                              )}

                              {/* 3. Movable Arrival Spawn Position (Interactive Destination Map Preview + Sliders + Facing) */}
                              {targetScene && (
                                <div className="space-y-2 pt-1 border-t border-emerald-500/25">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-medium text-emerald-200">
                                      Arrival Spawn Position
                                    </span>
                                    <span className="font-mono text-slate-300">
                                      X:{currentArrival.x}% Y:{currentArrival.y}%
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    Click or drag the green pin to set where you spawn when using
                                    this door:
                                  </p>

                                  <div
                                    ref={doorPreviewRef}
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const coords = getDoorPreviewCoords(e.clientX, e.clientY);
                                      if (!coords) return;
                                      updateActiveScene((s) => ({
                                        ...s,
                                        zones: s.zones.map((z) =>
                                          z.id === selectedZone.id
                                            ? { ...z, targetSpawn: coords }
                                            : z
                                        ),
                                      }));
                                      setDragAction({
                                        type: 'move-door-preview-spawn',
                                        targetId: selectedZone.id,
                                        sourceSceneId: activeScene.id,
                                        startMouseX: coords.x,
                                        startMouseY: coords.y,
                                        origX: coords.x,
                                        origY: coords.y,
                                        origW: 0,
                                        origH: 0,
                                        currentX: coords.x,
                                        currentY: coords.y,
                                      });
                                    }}
                                    className="relative w-full aspect-video rounded-md overflow-hidden border border-slate-700 bg-slate-950 cursor-crosshair select-none"
                                  >
                                    <img
                                      src={targetScene.imageUrl}
                                      alt={targetScene.name}
                                      draggable={false}
                                      className="w-full h-full object-fill pixelated pointer-events-none"
                                    />

                                    {/* Outline Doors in Destination Scene */}
                                    {targetSceneDoors.map((tz) => {
                                      const isTarget = tz.id === selectedZone.targetDoorId;
                                      return (
                                        <div
                                          key={`prev-door-${tz.id}`}
                                          style={{
                                            left: `${tz.xPercent}%`,
                                            top: `${tz.yPercent}%`,
                                            width: `${tz.widthPercent}%`,
                                            height: `${tz.heightPercent}%`,
                                          }}
                                          className={`absolute border pointer-events-none rounded-sm ${
                                            isTarget
                                              ? 'border-amber-300 bg-amber-400/25 ring-1 ring-white'
                                              : 'border-emerald-400/60 bg-emerald-400/10'
                                          }`}
                                        />
                                      );
                                    })}

                                    {/* Draggable Arrival Spawn Pin */}
                                    <div
                                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-bold text-[9px] border-2 border-white shadow-lg whitespace-nowrap"
                                      style={{
                                        left: `${currentArrival.x}%`,
                                        top: `${currentArrival.y}%`,
                                      }}
                                    >
                                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                                      Spawn
                                    </div>
                                  </div>

                                  {/* Fine X/Y Sliders */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <label className="space-y-0.5 text-[10px] text-slate-400 font-mono">
                                      <span className="flex justify-between">
                                        <span>Spawn X</span>
                                        <span>{currentArrival.x}%</span>
                                      </span>
                                      <input
                                        type="range"
                                        min={4}
                                        max={96}
                                        step={0.5}
                                        value={currentArrival.x}
                                        onChange={(e) => {
                                          const nextX = +e.target.value;
                                          updateActiveScene((s) => ({
                                            ...s,
                                            zones: s.zones.map((z) =>
                                              z.id === selectedZone.id
                                                ? {
                                                    ...z,
                                                    targetSpawn: {
                                                      x: nextX,
                                                      y: currentArrival.y,
                                                    },
                                                  }
                                                : z
                                            ),
                                          }));
                                        }}
                                        className="w-full accent-emerald-400"
                                      />
                                    </label>
                                    <label className="space-y-0.5 text-[10px] text-slate-400 font-mono">
                                      <span className="flex justify-between">
                                        <span>Spawn Y</span>
                                        <span>{currentArrival.y}%</span>
                                      </span>
                                      <input
                                        type="range"
                                        min={6}
                                        max={96}
                                        step={0.5}
                                        value={currentArrival.y}
                                        onChange={(e) => {
                                          const nextY = +e.target.value;
                                          updateActiveScene((s) => ({
                                            ...s,
                                            zones: s.zones.map((z) =>
                                              z.id === selectedZone.id
                                                ? {
                                                    ...z,
                                                    targetSpawn: {
                                                      x: currentArrival.x,
                                                      y: nextY,
                                                    },
                                                  }
                                                : z
                                            ),
                                          }));
                                        }}
                                        className="w-full accent-emerald-400"
                                      />
                                    </label>
                                  </div>

                                  {/* Facing Direction on Arrival */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-medium text-slate-400">
                                      Character Facing After Entering
                                    </span>
                                    <div className="grid grid-cols-4 gap-1">
                                      {(['up', 'down', 'left', 'right'] as Direction[]).map(
                                        (dir) => (
                                          <button
                                            key={dir}
                                            type="button"
                                            onClick={() =>
                                              updateActiveScene((s) => ({
                                                ...s,
                                                zones: s.zones.map((z) =>
                                                  z.id === selectedZone.id
                                                    ? { ...z, targetDirection: dir }
                                                    : z
                                                ),
                                              }))
                                            }
                                            className={`py-1 text-[10px] font-semibold uppercase rounded border cursor-pointer transition-colors ${
                                              selectedZone.targetDirection === dir
                                                ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                            }`}
                                          >
                                            {dir}
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {selectedZone.collisionType === 'mask' && (
                          <label className="inline-flex items-center gap-2 text-xs text-cyan-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedZone.maskTarget === 'all'}
                              onChange={(e) =>
                                updateActiveScene((s) => ({
                                  ...s,
                                  zones: s.zones.map((z) =>
                                    z.id === selectedZone.id
                                      ? { ...z, maskTarget: e.target.checked ? 'all' : 'props' }
                                      : z
                                  ),
                                }))
                              }
                              className="rounded border-slate-700 bg-slate-950 text-cyan-400"
                            />
                            Also hide character behind this foreground zone
                          </label>
                        )}

                        {/* Directional Move Pad for Selected Zone */}
                        <div className="flex items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                          <div className="space-y-0.5 text-[11px] font-mono text-slate-400">
                            <div>
                              X:{selectedZone.xPercent}% Y:{selectedZone.yPercent}%
                            </div>
                            <div>
                              W:{selectedZone.widthPercent}% H:{selectedZone.heightPercent}%
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1 w-24 shrink-0">
                            <div />
                            <button
                              type="button"
                              onClick={() => handleNudgeZone(selectedZone.id, 0, -1)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <div />
                            <button
                              type="button"
                              onClick={() => handleNudgeZone(selectedZone.id, -1, 0)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNudgeZone(selectedZone.id, 0, 1)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNudgeZone(selectedZone.id, 1, 0)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* MODE 3: FLOOR BOUNDS */}
                {engineMode === 'floor' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-sm font-bold text-slate-100">Walkable Floor Boundary</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Drag the 4 blue corner points on the map to match the room&apos;s walkable floor, or disable restriction to walk anywhere on the image.
                      </p>
                    </div>

                    <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                      <span className="text-xs font-medium text-slate-200">
                        Restrict walking inside floor polygon
                      </span>
                      <input
                        type="checkbox"
                        checked={activeScene.restrictToFloor}
                        onChange={(e) =>
                          updateActiveScene((s) => ({ ...s, restrictToFloor: e.target.checked }))
                        }
                        className="rounded border-slate-700 bg-slate-900 text-sky-400"
                      />
                    </label>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium text-slate-400">
                        Corner Coordinates:
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {activeScene.floorPolygon.map((pt, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300"
                          >
                            Corner {idx + 1}: ({pt.x}%, {pt.y}%)
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateActiveScene((s) => ({
                          ...s,
                          floorPolygon: [
                            { x: 10, y: 20 },
                            { x: 90, y: 20 },
                            { x: 95, y: 95 },
                            { x: 5, y: 95 },
                          ],
                        }))
                      }
                      className="w-full py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Expand Floor Polygon Wide
                    </button>
                  </div>
                )}
                {/* MODE 5: BILLS & CHARACTERISTICS STORAGE */}
                {engineMode === 'bills' && (
                  <BillsAndStatsInspector
                    characteristics={characteristics}
                    onChangeCharacteristic={(key: CharacteristicKey, value: number) =>
                      setCharacteristics((prev) => ({
                        ...prev,
                        [key]: Math.max(0, Math.min(100, value)),
                      }))
                    }
                    onResetCharacteristics={() => setCharacteristics(DEFAULT_CHARACTERISTICS)}
                    bills={bills}
                    signedBills={signedBills}
                    vetoedBills={vetoedBills}
                    onChangeBills={setBills}
                    onResetDefaultBills={() => {
                      setBills(DEFAULT_POLICY_BILLS);
                      setDailyDeskBatch({
                        day: currentDay,
                        billIds: pickDailyBillBatchIds(
                          DEFAULT_POLICY_BILLS,
                          signedBills,
                          vetoedBills,
                          currentDay
                        ),
                      });
                    }}
                    onClearSignedBills={() => {
                      setSignedBills({});
                      setVetoedBills({});
                      setDailyDeskBatch({
                        day: currentDay,
                        billIds: pickDailyBillBatchIds(bills, {}, {}, currentDay),
                      });
                    }}
                  />
                )}

                {/* MODE 6: SUMMON EVENTS DEV MENU */}
                {engineMode === 'events' && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">
                        Dev Event Launcher
                      </span>
                      <h2 className="text-base font-bold text-slate-100 mt-0.5">
                        Summon World &amp; Stage Events
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Adjust nation levels or trigger crisis events directly in the active scene. Dropping Diplomacy updates the live DEFCON counter and launches the 5→1 Tactical Nuke at 0%. National Security at 0% triggers the Terrorist Attack, and Public Approval at 0% triggers the White House Raid.
                      </p>
                    </div>

                    {/* Dev Nation Levels Control Card (Approval, Security, Economy, Diplomacy / DEFCON, Media Trust) */}
                    <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3.5">
                      <DevCharacteristicsPanel
                        characteristics={characteristics}
                        onChangeCharacteristic={(key: CharacteristicKey, value: number) =>
                          setCharacteristics((prev) => ({
                            ...prev,
                            [key]: Math.max(0, Math.min(100, Math.round(value))),
                          }))
                        }
                        onResetCharacteristics={() =>
                          setCharacteristics(DEFAULT_CHARACTERISTICS)
                        }
                        title="Nation Levels Control"
                        subtitle="Diplomacy 75+ = DEFCON 5 · 50-74 = 4 · 25-49 = 3 · 1-24 = 2 · 0 = Nuke"
                      />
                    </div>

                    {/* Daily Random Event (100 Pool) Quick Trigger Card */}
                    <div className="rounded-xl border-2 border-sky-500/60 bg-gradient-to-b from-sky-950/40 to-slate-950 p-4 space-y-2.5 shadow-lg">
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 text-[10px] font-mono font-bold uppercase text-sky-300">
                          100 Random Events Pool · 1 Per Day
                        </span>
                        <h3 className="text-sm font-bold text-slate-100 mt-1.5">
                          Daily Twittly Breaking Event &amp; Ding
                        </h3>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Automatically fires once per day with a notification ding, Twittly breaking post, and stat gain/loss (Economy, National Security, Public Approval, Diplomacy, or Media Trust).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          triggerDailyRandomEvent(currentDay);
                        }}
                        className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs uppercase tracking-wider border-2 border-sky-200 shadow-[0_4px_0_#0C4A6E] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                        Trigger Random Daily Event Now
                      </button>
                    </div>

                    {/* Tactical Nuke Summon Card */}
                    <div className="rounded-xl border-2 border-red-500/60 bg-gradient-to-b from-red-950/50 to-slate-950 p-4 space-y-3.5 shadow-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-[10px] font-mono font-bold uppercase text-red-300">
                            0% Diplomacy · DEFCON 1
                          </span>
                          <h3 className="text-sm font-bold text-slate-100 mt-1.5">
                            Tactical Nuke Incoming
                          </h3>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Auto-triggers when Diplomacy hits 0%. Plays <code className="text-amber-300">tactical-nuke.mp3</code>, announces the launching country from the World Map, drops an ICBM warhead, and detonates a 32-bit pixel mushroom cloud.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          triggerTacticalNukeEvent();
                        }}
                        className="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs uppercase tracking-wider border-2 border-amber-300 shadow-[0_4px_0_#450A0A] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Flame className="w-4 h-4 text-amber-300 shrink-0" />
                        Launch Tactical Nuke (Random Country)
                      </button>

                      {tacticalNuke.active && tacticalNuke.country && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-red-950/90 border border-red-400/60 text-xs">
                          <span className="text-amber-200 font-mono font-bold truncate">
                            ACTIVE LAUNCH:{' '}
                            {tacticalNuke.country.id === 'north-korea'
                              ? 'NORTH KOREA'
                              : tacticalNuke.country.name.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.currentTarget.blur();
                              stopTacticalNukeEvent();
                            }}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-red-200 border border-red-400/40 text-[11px] font-semibold shrink-0 cursor-pointer"
                          >
                            Stop Nuke
                          </button>
                        </div>
                      )}

                      <div className="pt-2 border-t border-red-500/25 space-y-2">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Or Test Specific World Map Country:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {WORLD_MAP_COUNTRIES.filter((c) => c.id !== 'usa').map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={(e) => {
                                e.currentTarget.blur();
                                triggerTacticalNukeEvent(c.id);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/70 border border-slate-800 hover:border-red-500/50 text-left text-xs font-medium text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span>
                                {c.id === 'north-korea' ? 'North Korea' : c.name}
                              </span>
                              <span className="text-[10px] font-mono text-red-400">
                                NUKE
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* White House Terrorist Bombing Summon Card (0% National Security Event) */}
                    <div className="rounded-xl border-2 border-orange-500/60 bg-gradient-to-b from-orange-950/45 to-slate-950 p-4 space-y-3 shadow-lg">
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-[10px] font-mono font-bold uppercase text-orange-300">
                          0% National Security · Breach
                        </span>
                        <h3 className="text-sm font-bold text-slate-100 mt-1.5">
                          White House Terrorist Bombing
                        </h3>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Auto-triggers when National Security hits 0%. A terrorist jumps the White House fence, plants a bomb at the portico, and detonates it.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          triggerTerroristBombEvent();
                        }}
                        className="w-full py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider border-2 border-amber-300 shadow-[0_4px_0_#431407] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-amber-300 shrink-0" />
                        Summon White House Bombing
                      </button>

                      {terroristBomb.active && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-orange-950/90 border border-orange-400/60 text-xs">
                          <span className="text-amber-200 font-mono font-bold truncate">
                            ACTIVE ATTACK: WHITE HOUSE
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.currentTarget.blur();
                              stopTerroristBombEvent();
                            }}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-orange-200 border border-orange-400/40 text-[11px] font-semibold shrink-0 cursor-pointer"
                          >
                            Stop Event
                          </button>
                        </div>
                      )}
                    </div>

                    {/* White House & Oval Office Public Raid Summon Card (0% Public Approval Event) */}
                    <div className="rounded-xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-950/40 to-slate-950 p-4 space-y-3 shadow-lg">
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono font-bold uppercase text-amber-300">
                          0% Public Approval · Uprising
                        </span>
                        <h3 className="text-sm font-bold text-slate-100 mt-1.5">
                          White House &amp; Oval Office Raid
                        </h3>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Auto-triggers when Public Approval hits 0%. A crowd jumps the White House fence, storms inside, and raids the President&apos;s Office.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          triggerWhiteHouseRaidEvent();
                        }}
                        className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider border-2 border-yellow-300 shadow-[0_4px_0_#451a03] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-yellow-200 shrink-0" />
                        Summon White House Raid
                      </button>

                      {whiteHouseRaid.active && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-950/90 border border-amber-400/60 text-xs">
                          <span className="text-yellow-200 font-mono font-bold truncate">
                            ACTIVE RAID: OVAL OFFICE
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.currentTarget.blur();
                              stopWhiteHouseRaidEvent();
                            }}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-200 border border-amber-400/40 text-[11px] font-semibold shrink-0 cursor-pointer"
                          >
                            Stop Event
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Rally Stage Event Quick Trigger Card */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                          Stage Event Sequence
                        </span>
                        <h3 className="text-xs font-bold text-slate-200 mt-0.5">
                          Presidential Campaign Rally Arena Event
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Jumps to the Rally Arena scene and starts the speech, front-shot ballistics, ducking, and raised-fist sequence.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSceneId('presidential-rally-stage');
                          setEngineMode('play');
                          startRallyEventSequence();
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/50 text-amber-300 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Start Rally Stage Event
                      </button>
                    </div>
                  </div>
                )}
              </aside>
            </div>
        </section>

        {/* Compact Scene Library & Project Export Bar */}
        <section
          id="scenes"
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Scenes ({scenes.length}) &amp; Project JSON
              </h2>
              <p className="text-xs text-slate-400">
                Click any scene to switch, or export/import your project configuration.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDuplicateScene}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Duplicate Scene
              </button>
              {activeScene.isBuiltIn && (
                <button
                  type="button"
                  onClick={handleResetActiveScene}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Scene Defaults
                </button>
              )}
              <button
                type="button"
                onClick={handleCopySceneJson}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied JSON
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    Copy JSON
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleExportProjectFile}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 text-sky-400" />
                Export .json
              </button>
              <button
                type="button"
                onClick={() => jsonImportRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Import .json
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {scenes.map((scene) => {
              const isCurrent = scene.id === activeScene.id;
              return (
                <div
                  key={scene.id}
                  onClick={() => setActiveSceneId(scene.id)}
                  className={`rounded-lg border overflow-hidden transition-colors cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'border-indigo-400 bg-slate-900 ring-1 ring-indigo-400/40'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="aspect-video bg-[#06080D] border-b border-slate-800/70 overflow-hidden">
                    <img
                      src={scene.imageUrl}
                      alt={scene.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover pixelated"
                    />
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs font-bold text-slate-100 truncate">{scene.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {scene.zones.length} Zones · {scene.props.length} Props
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {isWorldMapOpen && (
        <PixelWorldMapModal onClose={() => setIsWorldMapOpen(false)} />
      )}

      {isDeskPhoneOpen && (
        <PixelDeskPhoneModal
          onClose={() => setIsDeskPhoneOpen(false)}
          onPostToTwittly={(payload) => {
            handleCreateTwittlyEvent(payload);
            setUnreadTwittly((u) => u + 1);
          }}
        />
      )}

      {isResoluteDeskOpen && (
        <PixelResoluteDeskModal
          bills={bills}
          dailyBillIds={dailyDeskBatch.billIds}
          currentDay={currentDay}
          signedBills={signedBills}
          vetoedBills={vetoedBills}
          characteristics={characteristics}
          onSignBill={handleSignBill}
          onVetoBill={handleVetoBill}
          onResetDeskBills={() => {
            setSignedBills({});
            setVetoedBills({});
            setDailyDeskBatch({
              day: currentDay,
              billIds: pickDailyBillBatchIds(bills, {}, {}, currentDay),
            });
          }}
          onClose={() => setIsResoluteDeskOpen(false)}
        />
      )}

      {sleepTransition?.active && (
        <PixelDayTransitionOverlay
          transition={sleepTransition}
          onDismiss={handleDismissSleepTransition}
        />
      )}

      {showIntro && (
        <PixelIntroOverlay onStartGame={handleStartGameFromIntro} />
      )}
    </div>
  );
}
