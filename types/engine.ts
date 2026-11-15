export type ZoneType = 'solid' | 'interactive' | 'door' | 'mask';

export type PropKind =
  | 'fire-flames'
  | 'candle-flame'
  | 'warm-glow'
  | 'emerald-glow'
  | 'clock-pendulum'
  | 'sparkle-glint';

export interface Point2D {
  x: number;
  y: number;
}

export interface CropInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AnimatedPropItem {
  id: string;
  label: string;
  kind: PropKind;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  skewY?: number;
  speed?: number; // multiplier: 0.4 to 2.2
  flipX?: boolean;
  visible?: boolean;
  crop?: CropInsets;
}

export interface MapZone {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  collisionType: ZoneType;
  blocksWalk?: boolean;
  maskTarget?: 'props' | 'all';
  targetSceneId?: string;
  targetDoorId?: string;
  targetSpawn?: Point2D;
  targetDirection?: 'up' | 'down' | 'left' | 'right';
  opensModal?: 'world-map' | 'desk-phone' | 'resolute-desk';
  description: string;
  isDefault?: boolean;
}

export type CharacterAssetKind = 'secret-service-bodyguard';
export type BodyguardVariant =
  | 'dark-hair'
  | 'buzz-cut'
  | 'maga-cap-red'
  | 'rally-sign-usa'
  | 'rally-blonde-vip'
  | 'press-cameraman';

export interface SceneCharacterItem {
  id: string;
  label: string;
  kind: CharacterAssetKind;
  variant?: BodyguardVariant;
  xPercent: number;
  yPercent: number;
  scalePercent?: number;
  direction: 'down' | 'up' | 'left' | 'right';
  blocksWalk?: boolean;
  dialogue?: string;
  visible?: boolean;
}

export interface SceneData {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  aspectRatio: '16:9' | '4:3' | 'custom';
  spawn: Point2D;
  spawnDirection?: 'down' | 'up' | 'left' | 'right';
  lockCharacter?: boolean;
  disableInteractions?: boolean;
  characterScale: number; // percentage of map height (e.g., 18)
  cameraZoom?: number; // play-mode camera zoom (>= 1) with smooth player follow
  restrictToFloor: boolean;
  floorPolygon: Point2D[];
  props: AnimatedPropItem[];
  zones: MapZone[];
  characters?: SceneCharacterItem[];
  isBuiltIn?: boolean;
}

export type CharacteristicKey =
  | 'economy'
  | 'approval'
  | 'security'
  | 'diplomacy'
  | 'media';

export type NationCharacteristics = Record<CharacteristicKey, number>;

export type BillCategory = 'EXECUTIVE ORDER' | 'POLICY BILL' | 'STATE DIRECTIVE';

export type ReactionMood = 'HAPPY' | 'HYPED' | 'SHOCKED' | 'SKEPTICAL' | 'ANGRY';

export interface BillTwittlyReaction {
  id: string;
  author: string;
  handle: string;
  mood: ReactionMood;
  content: string;
}

export interface PolicyBill {
  id: string;
  code: string;
  title: string;
  category: BillCategory;
  summary: string;
  clauses: string[];
  ribbonColor: string;
  effects: Partial<Record<CharacteristicKey, number>>;
  twittlyReactions?: BillTwittlyReaction[];
  activeOnDesk?: boolean;
}

export interface SignedBillRecord {
  billId: string;
  signatureDataUrl: string;
  signedDay: number;
  signedHour: number;
}

export interface VetoedBillRecord {
  billId: string;
  vetoedDay: number;
  vetoedHour: number;
}

export type TwittlyTag = 'BREAKING' | 'POLICY' | 'PRESS' | 'EVENT';

export interface TwittlyPost {
  id: string;
  author: string;
  handle: string;
  avatarColor: string;
  verified?: boolean;
  tag: TwittlyTag;
  mood?: ReactionMood;
  content: string;
  day: number;
  hour: number;
  likes: number;
  reposts: number;
  liked?: boolean;
  reposted?: boolean;
  isUserEvent?: boolean;
}


