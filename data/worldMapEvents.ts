export type FlagKind =
  | 'usa'
  | 'mexico'
  | 'iran'
  | 'russia'
  | 'china'
  | 'north-korea';

export interface WorldMapCountry {
  id: string;
  name: string;
  mapLabel: string;
  flag: FlagKind;
  centerX: number;
  centerY: number;
  polygonPoints: string;
  baseColor: string;
  hoverColor: string;
  highlightColor: string;
  shadowColor: string;
}

export const WORLD_MAP_COUNTRIES: WorldMapCountry[] = [
  {
    id: 'usa',
    name: 'America',
    mapLabel: 'AMERICA',
    flag: 'usa',
    centerX: 35,
    centerY: 27,
    polygonPoints:
      '10,18 16,18 16,14 24,14 24,12 44,12 44,15 54,15 54,19 60,19 60,26 56,26 56,31 59,31 59,36 54,36 54,41 49,41 49,47 45,47 45,42 38,42 38,44 28,44 28,42 18,42 18,36 14,36 14,26 10,26',
    baseColor: '#2E5888',
    hoverColor: '#3B6DA6',
    highlightColor: '#5B8EC9',
    shadowColor: '#1E3C5E',
  },
  {
    id: 'mexico',
    name: 'Mexico',
    mapLabel: 'MEXICO',
    flag: 'mexico',
    centerX: 43,
    centerY: 60,
    polygonPoints:
      '18,42 28,42 28,44 38,44 38,42 41,42 41,48 46,48 46,51 54,51 54,56 59,56 59,64 54,64 54,71 48,71 48,78 42,78 42,71 38,71 38,60 32,60 32,54 24,54 24,49 19,49 19,45 18,45',
    baseColor: '#9C7232',
    hoverColor: '#B8883D',
    highlightColor: '#D6A454',
    shadowColor: '#6E4F1F',
  },
  {
    id: 'russia',
    name: 'Russia',
    mapLabel: 'RUSSIA',
    flag: 'russia',
    centerX: 108,
    centerY: 22,
    polygonPoints:
      '68,26 68,18 74,18 74,14 90,14 90,12 126,12 126,15 142,15 142,18 149,18 149,24 144,24 144,29 138,29 138,34 103,34 103,32 78,32 78,30 68,30',
    baseColor: '#5D4870',
    hoverColor: '#745B8B',
    highlightColor: '#9075AB',
    shadowColor: '#3E2F4C',
  },
  {
    id: 'iran',
    name: 'Iran',
    mapLabel: 'IRAN',
    flag: 'iran',
    centerX: 85,
    centerY: 46,
    polygonPoints:
      '68,30 78,30 78,32 103,32 103,50 98,50 98,56 92,56 92,69 82,69 82,56 74,56 74,51 69,51 69,41 74,41 74,37 68,37',
    baseColor: '#2C6F5C',
    hoverColor: '#388B73',
    highlightColor: '#4FAF93',
    shadowColor: '#1B4B3D',
  },
  {
    id: 'china',
    name: 'China',
    mapLabel: 'CHINA',
    flag: 'china',
    centerX: 120,
    centerY: 44,
    polygonPoints:
      '103,32 103,34 138,34 138,48 133,48 133,54 127,54 127,60 121,60 121,54 115,54 115,59 109,59 109,50 103,50',
    baseColor: '#9E3C34',
    hoverColor: '#BB4940',
    highlightColor: '#D6635A',
    shadowColor: '#6D2620',
  },
  {
    id: 'north-korea',
    name: 'Korea',
    mapLabel: 'KOREA',
    flag: 'north-korea',
    centerX: 144,
    centerY: 41,
    polygonPoints: '138,32 146,32 146,36 151,36 151,46 147,46 147,51 141,51 141,48 138,48',
    baseColor: '#2E6F8E',
    hoverColor: '#3B89AE',
    highlightColor: '#56A9D0',
    shadowColor: '#1D495E',
  },
];
