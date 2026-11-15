import { TwittlyPost, TwittlyTag } from '../types/engine';

export const DEFAULT_TWITTLY_POSTS: TwittlyPost[] = [
  {
    id: 'news-1',
    author: 'Capitol Wire',
    handle: '@CapitolWire',
    avatarColor: '#1D4ED8',
    verified: true,
    tag: 'BREAKING',
    content:
      'Morning briefing underway in the West Wing. Cabinet chiefs spotted entering the corridor ahead of today’s schedule.',
    day: 1,
    hour: 9,
    likes: 412,
    reposts: 128,
  },
  {
    id: 'news-2',
    author: 'White House Press',
    handle: '@WHPressPool',
    avatarColor: '#0284C7',
    verified: true,
    tag: 'PRESS',
    content:
      'Reporters gathered outside the Oval doors awaiting remarks on the new domestic trade & infrastructure package.',
    day: 1,
    hour: 8,
    likes: 289,
    reposts: 74,
  },
  {
    id: 'news-3',
    author: 'Executive Desk',
    handle: '@POTUS',
    avatarColor: '#B91C1C',
    verified: true,
    tag: 'POLICY',
    content:
      'Big morning ahead at the Resolute Desk. Reviewing state briefs and taking direct calls all afternoon!',
    day: 1,
    hour: 8,
    likes: 1840,
    reposts: 520,
  },
  {
    id: 'news-4',
    author: 'Market Ticker',
    handle: '@EconWatch',
    avatarColor: '#047857',
    verified: true,
    tag: 'POLICY',
    content:
      'Opening bell steady as investors watch Washington for executive action and energy announcements.',
    day: 1,
    hour: 7,
    likes: 156,
    reposts: 41,
  },
];

export const PRESET_GAME_EVENTS: Array<{
  label: string;
  tag: TwittlyTag;
  author: string;
  handle: string;
  avatarColor: string;
  content: string;
}> = [
  {
    label: 'Exec Order',
    tag: 'POLICY',
    author: 'Executive Desk',
    handle: '@POTUS',
    avatarColor: '#B91C1C',
    content:
      'Just signed a major new Executive Order at the Resolute Desk. Huge win for American workers!',
  },
  {
    label: 'Press Alert',
    tag: 'BREAKING',
    author: 'Capitol Wire',
    handle: '@CapitolWire',
    avatarColor: '#1D4ED8',
    content:
      'FLASH: Unscheduled White House press briefing called for this hour. Correspondents rushing to the West Wing.',
  },
  {
    label: 'Summit News',
    tag: 'EVENT',
    author: 'State Dispatch',
    handle: '@StateWire',
    avatarColor: '#B45309',
    content:
      'Foreign delegation arrives at the West Wing entrance for closed-door talks with the President.',
  },
];
