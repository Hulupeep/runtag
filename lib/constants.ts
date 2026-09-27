// Design tokens
export const COLORS = {
  black: '#0a0a0a',
  white: '#f5f5f0',
  green: '#34c759',
  red: '#ff3b30',
  gray: '#86868b',
} as const

// Animation timings
export const TIMING = {
  nfcRipple: 600,
  sceneTransition: 500,
  runAnimation: 5000,
  chainPop: 400,
  tapFeedback: 100, // Max allowed for INV-D5
  autoAdvanceDelay: 2000,
} as const

// Scene types
export type Scene = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

// Copy content
export const COPY = {
  scene1: {
    headline: 'Your watch is making you fat.',
    subline: 'Metrics don\'t create runners. Habits do.',
    cta: 'Try RunTag Demo →',
  },
  scene2: {
    narrative: 'It\'s 7am. You\'re at the edge of the woods.',
    instruction: 'Tap the tag to start your run.',
    chainLabel: '4-day chain',
  },
  scene3: {
    status: 'TAGGED',
    subtitle: 'Run started',
    narrative: 'You\'re in. Now go.',
  },
  scene4: {
    narrative: 'No pace to check. No watch to glance at.',
    subline: 'Just you and the trail.',
  },
  scene5: {
    narrative: 'Run complete. Tap out.',
    instruction: 'Tap the tag to finish.',
  },
  scene6: {
    status: '✓',
    narrative: 'Day 5. Chain unbroken.',
    celebration: 'Keep it going.',
  },
  scene7: {
    headline: 'Discover routes others have created.',
    subline: 'Find new tags. Explore new paths.',
  },
  scene8: {
    headline: 'Stop optimizing. Start moving.',
    cta: 'Get Starter Kit – £19',
    emailPlaceholder: 'your@email.com',
    socialProof: '2,847 chains unbroken this week',
    restart: 'Restart Demo',
  },
} as const

// Chain configuration
export const CHAIN = {
  initial: 4,
  afterRun: 5,
} as const

// Forbidden terms (INV-D4)
export const FORBIDDEN_TERMS = [
  'pace',
  'km/h',
  'mph',
  'calories',
  'bpm',
  'heart rate',
  'distance',
  'split',
  'cadence',
  'stride',
] as const

// Breakpoints
export const BREAKPOINTS = {
  mobile: 768,
} as const

// Accessibility
export const A11Y = {
  minTapTarget: 48,
} as const
