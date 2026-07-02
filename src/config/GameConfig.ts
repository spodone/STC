/** Design-resolution canvas. Phaser's Scale.FIT scales this to any device. */
export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;

/** Road / lane layout. */
export const LANE_COUNT = 3;
export const LANE_WIDTH = 200;
export const ROAD_WIDTH = LANE_COUNT * LANE_WIDTH;
export const ROAD_X = DESIGN_WIDTH / 2;

/** World-space vertical anchor for the player (screen-space, stays fixed). */
export const PLAYER_Y = DESIGN_HEIGHT - 320;

/** Lane center x-positions, index 0 = left, 1 = middle, 2 = right. */
export const LANE_X: readonly number[] = Array.from({ length: LANE_COUNT }, (_, i) => {
  const laneStart = ROAD_X - ROAD_WIDTH / 2;
  return laneStart + LANE_WIDTH * i + LANE_WIDTH / 2;
});

/** Speed curve: world scroll speed in px/sec ramps from base to max over rampSeconds. */
export const SPEED_BASE = 480;
export const SPEED_MAX = 1180;
export const SPEED_RAMP_SECONDS = 90;
export const EASY_WINDOW_SECONDS = 20;

/** Distance scoring: meters are derived from scroll speed, not raw px. */
export const PIXELS_PER_METER = 40;

/** Lane change feel. */
export const LANE_CHANGE_MS = 140;
export const SWIPE_MIN_DISTANCE_PX = 30;

/** Palette — colorful, premium, low-poly cartoon vibe. */
export const PALETTE = {
  skyTop: 0x8ec9f0,
  skyBottom: 0xd8f0ff,
  roadDark: 0x4a4e5c,
  roadLight: 0x565b6b,
  laneLine: 0xf4f4f4,
  grass: 0x6fbf6a,
  grassShade: 0x5fa85a,
  jerseyYellow: 0xffd23f,
  jerseySkin: 0xf2b98a,
  bikeFrame: 0x2b6cff,
  coinGold: 0xffcb3c,
  uiDark: 0x1a1f2e,
  uiAccent: 0xffd23f,
  danger: 0xff4d5e,
  white: 0xffffff,
} as const;

export const STORAGE_KEYS = {
  bestScore: "stc:bestScore",
  coins: "stc:coins",
  unlockedCosmetics: "stc:unlockedCosmetics",
  equippedCosmetic: "stc:equippedCosmetic",
  muted: "stc:muted",
} as const;

export const GAME_EVENTS = {
  scoreChanged: "score-changed",
  coinsChanged: "coins-changed",
  playerHit: "player-hit",
  gameOver: "game-over",
  paused: "game-paused",
  resumed: "game-resumed",
} as const;
