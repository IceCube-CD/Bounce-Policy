import React from 'react';
import { renderPixelGridRle } from '../utils/pixelGridCache';

export type Direction = 'down' | 'up' | 'left' | 'right';
export type CharacterPose = 'normal' | 'ducking' | 'fist-raised';

interface PixelCharacterProps {
  direction: Direction;
  walkFrame: number; // 0 = idle, 1 = left step, 2 = passing, 3 = right step
  isMoving: boolean;
  pose?: CharacterPose;
  speechBubble?: string;
  className?: string;
}

// High-Fidelity 32-Bit Presidential Pixel Palette (28x42 grid)
const PALETTE: Record<string, string> = {
  '.': 'transparent',
  o: '#0F131F', // crisp dark pixel outline
  i: '#22283B', // soft inner contour
  // Signature Golden-Blonde Swept Hair (4 tones)
  h: '#8F6118', // deep golden-ochre shadow
  g: '#C88F2A', // warm golden blonde
  y: '#EBC14B', // bright golden blonde
  Y: '#FEF08A', // sunlit comb-over highlight
  // Warm Golden-Tan Complexion (4 tones)
  d: '#B86B3E', // deep warm shadow
  S: '#DE8D58', // warm tan mid-shadow
  s: '#F2AE7A', // warm peach-tan base
  f: '#F9CCA6', // brow/cheekbone highlight
  // Facial Features
  b: '#966E36', // blonde-taupe brow
  e: '#1A346B', // sharp blue eyes
  q: '#E6ECF5', // soft eye sclera
  m: '#A85C3A', // nose & firm mouth line
  // Broad-Shouldered Navy Suit (5 tones)
  N: '#091326', // midnight navy shadow
  n: '#122444', // dark tailored navy
  u: '#1C3766', // presidential navy base
  l: '#2C518E', // lapel & shoulder highlight
  L: '#4772B8', // upper lapel sheen
  // Crisp White Dress Shirt & Pocket Square
  w: '#F8FAFC',
  c: '#CBD5E1',
  // Iconic Long Crimson Red Silk Tie & Ear Graze (3 tones)
  T: '#7F1D1D', // deep crimson shadow
  t: '#DC2626', // vivid crimson red
  r: '#F87171', // crimson highlight
  // Gold Flag Lapel Pin & Belt Buckle
  G: '#FACC15',
  // Trousers & Polished Dress Shoes
  P: '#0E1A30',
  p: '#182B4D',
  k: '#0C0E14',
  K: '#2B2224',
  a: '#68575C',
};

// 28 columns x 42 rows
const DOWN_IDLE = [
  '........ooooooooooo.........',
  '.......oYYYYYyyyyggo........',
  '......oYYYYyyyyyggggo.......',
  '.....oYYYyyyyyyyygggho......',
  '.....oyyygyyyyyyyyghho......',
  '....oyyggiiyyyyyygghhho.....',
  '....oyyghffffffffsghhho.....',
  '....ohgSsffffffffSsgho......',
  '....ohSssbbssssbbssSho......',
  '....ohSssqesffseqssSho......',
  '.....oSSssssssssssSSo.......',
  '.....oSsSSssmmssSSsSo.......',
  '......oSSddddddddSSo........',
  '......oSSdSmmmmSdSSo........',
  '.......ooSSSSSSSSoo.........',
  '.......ooolwttwlooo.........',
  '.....oolLLlwttwlllLLoo......',
  '...oolLLuuunwrrwnuuLLloo....',
  '..olLLuuuunnwttwnnuuuuLlo...',
  '..olLuuuuunnwttwnnGGuuLuo...',
  '..ouuuuuuunnlTTlnnuuuuuuo...',
  '..ouuuuuuunnnttunnuuuuuuo...',
  '..ouuuuuunnnutttunnuuuuuo...',
  '..onnnnuunnnutrtunnuunnno...',
  '..onnnnuunnnutttunnuunnno...',
  '..onnnnuunnnutTTunnuunnno...',
  '..onnnnuunnnutttunnuunnno...',
  '..onnnnuunnnutTunnnnNnnno...',
  '..ossnnuunNNNttNNNNnNnsso...',
  '..oSSsnnNNNNNttNNNNNnsSSo...',
  '...ooo.onnnnnTtnnnno.ooo....',
  '.......onnnnNNNNnnno........',
  '.......oppppPPPPpppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '......oKKaKKo..oKKaKKo......',
  '......oKKKKKo..oKKKKKo......',
  '......ooooooo..ooooooo......',
  '............................',
];

// Iconic "FIGHT! FIGHT! FIGHT!" Pose: Raised Right Fist + Crimson Ear Graze + Defiant Shout
const DOWN_FIST_RAISED = [
  '.ooooo..ooooooooooo.........',
  'oSSsssooYYYYYyyyyggo........',
  'oSssddsoYYYYyyyyyggggo......',
  'oSSddsooYYYyyyyyyyygggho....',
  '.owwwo..oyyygyyyyyyyyghho...',
  '.oLLuo.oyyggiiyyyyyygghhho..',
  '.oLLuo.oyyghffffffffsghhho..',
  '.ouuuo.otgSsffffffffSsgho...',
  '.ouuuo.ottssbbssssbbssSho...',
  '.ouuuo.otSssqesffseqssSho...',
  '.ouuuo..otSssssteessssSSo...',
  '.ouuuoo.oSsSSssmmssSSsSo....',
  '..ouuLLooSSdddooodddSSo.....',
  '..olLLLuooSSdoTTTodSSo......',
  '...olLLLuuoooSSSSSooo.......',
  '....oolLLlllwttwlooo........',
  '.....oolLLlwttwlllLLoo......',
  '......olLLunwrrwnuuLLloo....',
  '......ouuunnwttwnnuuuuLlo...',
  '......ouuunnwttwnnGGuuLuo...',
  '......ouuunnlTTlnnuuuuuuo...',
  '......ouuunnnttunnuuuuuuo...',
  '......onnnnutttunnuuuuuo....',
  '......onnnnutrtunnuunnno....',
  '......onnnnutttunnuunnno....',
  '......onnnnutTTunnuunnno....',
  '......onnnnutttunnuunnno....',
  '......onnnnutTunnnnNnnno....',
  '......onnnNNNttNNNNnNnsso...',
  '......onNNNNNttNNNNNnsSSo...',
  '.......onnnnnTtnnnno.ooo....',
  '.......onnnnNNNNnnno........',
  '.......oppppPPPPpppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '......oKKaKKo..oKKaKKo......',
  '......oKKKKKo..oKKKKKo......',
  '......ooooooo..ooooooo......',
  '............................',
];

// Ducking low behind the podium right after shots ring out (hand touching grazed right ear)
const DOWN_DUCKING = [
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '........ooooooooooo.........',
  '.......oYYYYYyyyyggo........',
  '......oYYYYyyyyyggggo.......',
  '.....oYYYyyyyyyyygggho......',
  '....oooyyygyyyyyyyyghho.....',
  '...oSSoyyggiiyyyyyygghhho...',
  '...oSsoyyghffffffffsghhho...',
  '...oSSotgSsffffffffSsgho....',
  '....owottssbbssssbbssSho....',
  '....oLotSssqesffseqssSho....',
  '....oLLoSSssssssssssSSo.....',
  '....olLLoSsSSssmmssSSsSo....',
  '....oolLLooSSddddddddSSo....',
  '.....oolLLuuoSSSSSSSooo.....',
  '......olLLuuunwttwnuuLLoo...',
  '......ouuuuuunwrrwnuuuuLlo..',
  '......onnnnnuuwttwuuuuuLuo..',
  '.......onnnnnnutttunnnnno...',
  '.......onnnnnnNNNNNnnnnno...',
  '.......oppppPPPPPPPPpppo....',
  '.......oppppP......Ppppo....',
  '.......oppppP......Ppppo....',
  '.......oppppP......Ppppo....',
  '......oKKaKKo......oKKaKKo..',
  '......oKKKKKo......oKKKKKo..',
  '......ooooooo......ooooooo..',
  '............................',
  '............................',
  '............................',
];

const DOWN_STEP_L = [
  '............................',
  '........ooooooooooo.........',
  '.......oYYYYYyyyyggo........',
  '......oYYYYyyyyyggggo.......',
  '.....oYYYyyyyyyyygggho......',
  '.....oyyygyyyyyyyyghho......',
  '....oyyggiiyyyyyygghhho.....',
  '....oyyghffffffffsghhho.....',
  '....ohgSsffffffffSsgho......',
  '....ohSssbbssssbbssSho......',
  '....ohSssqesffseqssSho......',
  '.....oSSssssssssssSSo.......',
  '.....oSsSSssmmssSSsSo.......',
  '......oSSddddddddSSo........',
  '......oSSdSmmmmSdSSo........',
  '.......ooSSSSSSSSoo.........',
  '.......ooolwttwlooo.........',
  '.....oolLLlwttwlllLLoo......',
  '...oolLLuuunwrrwnuuLLloo....',
  '..olLLuuuunnwttwnnuuuuLlo...',
  '..olLuuuuunnwttwnnGGuuLuo...',
  '..onnnnuuunnlTTlnnuuuuuuo...',
  '..onnnnuuunnnttunnuuuuuuo...',
  '..ossnnuunnnutttunnuunnno...',
  '..oSSsnnunnnutrtunnuunnno...',
  '...ooo.onnnnutttunnuunnso...',
  '.......onnnnutTTunnuunSSo...',
  '.......onnnnutttunnnnooo....',
  '.......onnnnNtTunnnno.......',
  '.......onnnnnTtnnnnno.......',
  '.......oppppPPPPpppo........',
  '......ooppppP..Ppppo........',
  '......opppppP..Ppppo........',
  '......oppppPo..Pppppo.......',
  '......oppppPo..Pppppo.......',
  '.....oKKaKKo....Ppppo.......',
  '.....oKKKKKo....oKKaKKo.....',
  '.....ooooooo....oKKKKKo.....',
  '................ooooooo.....',
  '............................',
  '............................',
  '............................',
];

const DOWN_STEP_R = [
  '............................',
  '........ooooooooooo.........',
  '.......oYYYYYyyyyggo........',
  '......oYYYYyyyyyggggo.......',
  '.....oYYYyyyyyyyygggho......',
  '.....oyyygyyyyyyyyghho......',
  '....oyyggiiyyyyyygghhho.....',
  '....oyyghffffffffsghhho.....',
  '....ohgSsffffffffSsgho......',
  '....ohSssbbssssbbssSho......',
  '....ohSssqesffseqssSho......',
  '.....oSSssssssssssSSo.......',
  '.....oSsSSssmmssSSsSo.......',
  '......oSSddddddddSSo........',
  '......oSSdSmmmmSdSSo........',
  '.......ooSSSSSSSSoo.........',
  '.......ooolwttwlooo.........',
  '.....oolLLlwttwlllLLoo......',
  '...oolLLuuunwrrwnuuLLloo....',
  '..olLLuuuunnwttwnnuuuuLlo...',
  '..olLuuuuunnwttwnnGGuuLuo...',
  '..ouuuuuuunnlTTlnnuunnno....',
  '..ouuuuuuunnnttunnuunnno....',
  '..onnnnuunnnutttunnuosso....',
  '..onnnnuunnnutrtunnuSSSo....',
  '..ossonuunnnutttunno.ooo....',
  '..oSSsonnnnnutTTunno........',
  '...ooo.onnnnutttunno........',
  '.......onnnnNtTunnno........',
  '.......onnnnnTtnnnno........',
  '.......oppppPPPPpppo........',
  '.......oppppP..Ppppoo.......',
  '.......oppppP..Pppppo.......',
  '......opppppP..oPpppo.......',
  '......opppppP..oPpppo.......',
  '......oppppPo...oKKaKKo.....',
  '.....oKKaKKo....oKKKKKo.....',
  '.....oKKKKKo....ooooooo.....',
  '.....ooooooo................',
  '............................',
  '............................',
  '............................',
];

const UP_IDLE = [
  '........ooooooooooo.........',
  '.......oYYYYYyyyyggo........',
  '......oYYYYyyyyyggggo.......',
  '.....oYYYyyyyyyyygggho......',
  '.....oyyyyyyyyyyyggggho.....',
  '....oyyyyyyyyyyygggggho.....',
  '....oyyyyyyyyyygggggggho....',
  '....oggyyyyyyyggggggghho....',
  '....ogggyyyyyggggggghhho....',
  '.....ogggggggggggghhhho.....',
  '.....ooggggggggghhhhoo......',
  '......oooggggghhhhooo.......',
  '.......oooSSSSSSSooo........',
  '........ooSSSSSSSoo.........',
  '.......ooolllllllooo........',
  '.....oolLLuuuuuuuLLloo......',
  '...oolLLuuuuuuuuuuuLLloo....',
  '..olLLuuuuuunnnuuuuuuuLlo...',
  '..olLuuuuuuunnnuuuuuuuLuo...',
  '..ouuuuuuuuunnnuuuuuuuuuo...',
  '..ouuuuuuuunnnnnuuuuuuuuo...',
  '..ouuuuuuuunnnnnuuuuuuuuo...',
  '..onnnnuuuunnnnnuuuunnno....',
  '..onnnnuuuunnnnnuuuunnno....',
  '..onnnnuuuunnnnnuuuunnno....',
  '..onnnnuuunNNNNNnuuunnno....',
  '..onnnnuuunNNNNNnuuunnno....',
  '..ossnnuuunNNNNNnuuunsso....',
  '..oSSsnnnNNNNNNNNNnnsSSo....',
  '...ooo.onnnnnnnnnnno.ooo....',
  '.......onnnnNNNNnnno........',
  '.......oppppPPPPpppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '.......oppppP..Ppppo........',
  '......oKKaKKo..oKKaKKo......',
  '......oKKKKKo..oKKKKKo......',
  '......ooooooo..ooooooo......',
  '............................',
  '............................',
];

const UP_STEP_L = [
  '............................',
  '........ooooooooooo.........',
  '.......oYYYYYyyyyggo........',
  '......oYYYYyyyyyggggo.......',
  '.....oYYYyyyyyyyygggho......',
  '.....oyyyyyyyyyyyggggho.....',
  '....oyyyyyyyyyyygggggho.....',
  '....oyyyyyyyyyygggggggho....',
  '....oggyyyyyyyggggggghho....',
  '....ogggyyyyyggggggghhho....',
  '.....ogggggggggggghhhho.....',
  '.....ooggggggggghhhhoo......',
  '......oooggggghhhhooo.......',
  '.......oooSSSSSSSooo........',
  '........ooSSSSSSSoo.........',
  '.......ooolllllllooo........',
  '.....oolLLuuuuuuuLLloo......',
  '...oolLLuuuuuuuuuuuLLloo....',
  '..olLLuuuuuunnnuuuuuuuLlo...',
  '..onnnnuuuuunnnuuuuuuuLuo...',
  '..onnnnuuuuunnnuuuuuuuuuo...',
  '..ossnnuuuunnnnnuuuuuuuuo...',
  '..oSSsnnuuunnnnnuuuunnno....',
  '...ooo.onnunnnnnuuuunnno....',
  '.......onnunnnnnnuuunnso....',
  '.......onnunNNNNNnuunSSo....',
  '.......onnnNNNNNNnnnooo.....',
  '.......onnnNNNNNNnno........',
  '.......oppppPPPPpppo........',
  '......ooppppP..Ppppo........',
  '......opppppP..Ppppo........',
  '......oppppPo..Pppppo.......',
  '......oppppPo..Pppppo.......',
  '.....oKKaKKo....Ppppo.......',
  '.....oKKKKKo....oKKaKKo.....',
  '.....ooooooo....oKKKKKo.....',
  '................ooooooo.....',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
];

const UP_STEP_R = [
  '............................',
  '........ooooooooooo.........',
  '.......oYYYYYyyyyggo........',
  '......oYYYYyyyyyggggo.......',
  '.....oYYYyyyyyyyygggho......',
  '.....oyyyyyyyyyyyggggho.....',
  '....oyyyyyyyyyyygggggho.....',
  '....oyyyyyyyyyygggggggho....',
  '....oggyyyyyyyggggggghho....',
  '....ogggyyyyyggggggghhho....',
  '.....ogggggggggggghhhho.....',
  '.....ooggggggggghhhhoo......',
  '......oooggggghhhhooo.......',
  '.......oooSSSSSSSooo........',
  '........ooSSSSSSSoo.........',
  '.......ooolllllllooo........',
  '.....oolLLuuuuuuuLLloo......',
  '...oolLLuuuuuuuuuuuLLloo....',
  '..olLLuuuuuunnnuuuuuuuLlo...',
  '..olLuuuuuuunnnuuuunnno.....',
  '..ouuuuuuuuunnnuuuunnno.....',
  '..ouuuuuuuunnnnnuuunsso.....',
  '..onnnnuuuunnnnnuuunSSo.....',
  '..onnnnuuuunnnnnnuu.ooo.....',
  '..onnnnuuuunnnnnnuno........',
  '..ossonuuuunNNNNNuno........',
  '..oSSsonnnnNNNNNNno.........',
  '...ooo.onnnNNNNNNno.........',
  '.......oppppPPPPpppo........',
  '.......oppppP..Ppppoo.......',
  '.......oppppP..Pppppo.......',
  '......opppppP..oPpppo.......',
  '......opppppP..oPpppo.......',
  '......oppppPo...oKKaKKo.....',
  '.....oKKaKKo....oKKKKKo.....',
  '.....oKKKKKo....ooooooo.....',
  '.....ooooooo................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
];

const RIGHT_IDLE = [
  '........ooooooooooo.........',
  '.......oYYYYYyyyyggo........',
  '......oYYYYyyyyyygggho......',
  '......oYYyyyyyyyyggggho.....',
  '.....oYYYYyyyygggggggho.....',
  '.....ogggiiiyyyggggggho.....',
  '......ohgsfffffffggggho.....',
  '......ohSsffffffffgggho.....',
  '......ohSssssbbsssggSho.....',
  '......ohSsssssqesssSSho.....',
  '.......osssssssssssSSo......',
  '.......ossssssssssSSsso.....',
  '........osssssssSSssso......',
  '........osSSSSddddSSo.......',
  '........oooSSSSSSooo........',
  '.........ooSSSSSSo..........',
  '.......ooolllwtooo..........',
  '......oolLLuuwtrno..........',
  '.....olLLuuuuuwttno.........',
  '....olLuuuuulGGwtno.........',
  '....ouuuuuuulluuttno........',
  '....ouuuuuuulluuttnno.......',
  '....onnnnuuulluuttnno.......',
  '....onnnnuuulluuttnno.......',
  '....onnnnuuuuuuuttnno.......',
  '....onnnnuuuuuuuntnno.......',
  '....onnnnuuuuuuuntno........',
  '....onnnsssoNNNNNtno........',
  '....oonnSSsoNNNNNno.........',
  '......oooooNNNNNnno.........',
  '.......onnnNNNNNno..........',
  '.......oppppPPPPpo..........',
  '.......oppppPPPPpo..........',
  '.......oppppP.Pppo..........',
  '.......oppppP.Pppo..........',
  '.......oppppP.Pppo..........',
  '.......oppppP.Pppo..........',
  '.......oKKaKKoKKaKKo........',
  '.......oKKKKKoKKKKKo........',
  '.......ooooooooooooo........',
  '............................',
  '............................',
];

const RIGHT_STEP_L = [
  '............................',
  '........ooooooooooo.........',
  '.......oYYYYYyyyyggo........',
  '......oYYYYyyyyyygggho......',
  '......oYYyyyyyyyyggggho.....',
  '.....oYYYYyyyygggggggho.....',
  '.....ogggiiiyyyggggggho.....',
  '......ohgsfffffffggggho.....',
  '......ohSsffffffffgggho.....',
  '......ohSssssbbsssggSho.....',
  '......ohSsssssqesssSSho.....',
  '.......osssssssssssSSo......',
  '.......ossssssssssSSsso.....',
  '........osssssssSSssso......',
  '........osSSSSddddSSo.......',
  '........oooSSSSSSooo........',
  '.........ooSSSSSSo..........',
  '.......ooolllwtooo..........',
  '......oolLLuuwtrno..........',
  '.....olLLuuuuuwttno.........',
  '....olLuuuuulGGwtno.........',
  '....onnnnuuulluuttno........',
  '....onnnnuuulluuttnno.......',
  '....onnnnnsssoooootno.......',
  '.....oonnnSSsso..ono........',
  '.......oonnnnNNNNNno........',
  '........onnnnNNNNNno........',
  '........oppppPPPPpo.........',
  '.......ooppppPoPpppo........',
  '......ooppppPo..Ppppo.......',
  '......oppppPo...Pppppo......',
  '.....oKKaKKo.....Ppppo......',
  '.....oKKKKKo.....oKKaKKo....',
  '.....ooooooo.....oKKKKKo....',
  '.................ooooooo....',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
];

const RIGHT_STEP_R = [
  '............................',
  '........ooooooooooo.........',
  '.......oYYYYYyyyyggo........',
  '......oYYYYyyyyyygggho......',
  '......oYYyyyyyyyyggggho.....',
  '.....oYYYYyyyygggggggho.....',
  '.....ogggiiiyyyggggggho.....',
  '......ohgsfffffffggggho.....',
  '......ohSsffffffffgggho.....',
  '......ohSssssbbsssggSho.....',
  '......ohSsssssqesssSSho.....',
  '.......osssssssssssSSo......',
  '.......ossssssssssSSsso.....',
  '........osssssssSSssso......',
  '........osSSSSddddSSo.......',
  '........oooSSSSSSooo........',
  '.........ooSSSSSSo..........',
  '.......ooolllwtooo..........',
  '......oolLLuuwtrno..........',
  '.....olLLuuuuuwttno.........',
  '....olLuuuuulGGwtno.........',
  '....ouuuuuuulluuttno........',
  '....ouuuuuuulluuttnno.......',
  '....ouuuuuuulluunssso.......',
  '....onnnnuuuuuuunSSso.......',
  '.....onnnnuuuuuuntnno.......',
  '......onnnNNNNNNtnno........',
  '.......onnnnNNNNNno.........',
  '.......oppppPPPPpo..........',
  '......oppppPo..Ppppo........',
  '......oppppPo..Ppppo........',
  '.....oppppPo...oPpppo.......',
  '.....oKKaKKo...oKKaKKo......',
  '.....oKKKKKo...oKKKKKo......',
  '.....ooooooo...ooooooo......',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
];

function getFrameGrid(
  direction: Direction,
  walkFrame: number,
  isMoving: boolean,
  pose: CharacterPose = 'normal'
): string[] {
  if (pose === 'fist-raised') {
    return DOWN_FIST_RAISED;
  }
  if (pose === 'ducking') {
    return DOWN_DUCKING;
  }

  const step = isMoving ? walkFrame % 4 : 0;

  if (direction === 'down') {
    if (step === 1) return DOWN_STEP_L;
    if (step === 3) return DOWN_STEP_R;
    return DOWN_IDLE;
  }
  if (direction === 'up') {
    if (step === 1) return UP_STEP_L;
    if (step === 3) return UP_STEP_R;
    return UP_IDLE;
  }
  if (direction === 'right' || direction === 'left') {
    if (step === 1) return RIGHT_STEP_L;
    if (step === 3) return RIGHT_STEP_R;
    return RIGHT_IDLE;
  }
  return DOWN_IDLE;
}

export const PixelCharacter: React.FC<PixelCharacterProps> = React.memo(({
  direction,
  walkFrame,
  isMoving,
  pose = 'normal',
  speechBubble,
  className = '',
}) => {
  const grid = getFrameGrid(direction, walkFrame, isMoving, pose);
  const flipX = pose === 'normal' && direction === 'left';

  return (
    <div
      className={`relative pointer-events-none select-none ${className}`}
      style={{
        aspectRatio: '28 / 42',
      }}
    >
      {/* Clean Outlined Pixel Speech Text above President */}
      {speechBubble && (
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap font-mono font-bold text-[#FEF08A] uppercase pointer-events-none"
          style={{
            fontSize: '9.5px',
            letterSpacing: '0.07em',
            textShadow:
              '1px 1px 0 #090D16, -1px -1px 0 #090D16, 1px -1px 0 #090D16, -1px 1px 0 #090D16, 0 2px 0 #090D16, 0 0 10px rgba(250, 204, 21, 0.55)',
          }}
        >
          {speechBubble}
        </div>
      )}

      {/* Ground Contact Shadow (smooth radial gradient, avoids per-frame blur filter) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          bottom: '2.5%',
          width: '66%',
          height: '11%',
          background:
            'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.28) 55%, transparent 80%)',
        }}
      />

      {/* Crisp 28x42 32-Bit Pixel Sprite (RLE-merged & cached) */}
      <svg
        viewBox="0 0 28 42"
        shapeRendering="crispEdges"
        className="relative block w-full h-full drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]"
        style={{
          transform: flipX ? 'scaleX(-1)' : undefined,
        }}
      >
        {renderPixelGridRle(grid, PALETTE)}
      </svg>
    </div>
  );
});
