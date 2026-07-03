import { clamp, lerp } from "../utils/mathUtils";
import type { LaneIndex } from "../types/index";

/** Design-resolution canvas. Phaser's Scale.FIT scales this to any device. */
export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;

/** Road / lane layout at full depth (i.e. at the player's line). */
export const LANE_COUNT = 3;
export const LANE_WIDTH = 200;
export const ROAD_WIDTH = LANE_COUNT * LANE_WIDTH;
export const ROAD_X = DESIGN_WIDTH / 2;

/** World-space vertical anchor for the player (screen-space, stays fixed). */
export const PLAYER_Y = DESIGN_HEIGHT - 320;

/**
 * Perspective: the road narrows gently toward the horizon, matching the
 * painted background art. Kept subtle on purpose — obstacles must read as
 * "already sitting on the road, just distant" from the moment they appear,
 * not as if they're converging out of a single point and falling in from
 * the sky. MIN_LANE_SPREAD_PX is deliberately close to LANE_WIDTH so lane
 * identity stays legible immediately, with only mild convergence for depth.
 */
export const HORIZON_Y = 0;
export const MIN_LANE_SPREAD_PX = 130;

/** Perspective depth progress: 0 at the horizon, 1 at the player's line. */
export function depthT(y: number): number {
  return clamp((y - HORIZON_Y) / (PLAYER_Y - HORIZON_Y), 0, 1);
}

/** Lane width at a given world-y, narrowing toward the horizon. */
export function laneWidthAtY(y: number): number {
  return lerp(MIN_LANE_SPREAD_PX, LANE_WIDTH, depthT(y));
}

/** Perspective-correct lane center x-position at a given world-y. */
export function laneXAtY(lane: LaneIndex, y: number): number {
  return ROAD_X + (lane - (LANE_COUNT - 1) / 2) * laneWidthAtY(y);
}

/** Lane center x-positions at the player's line (index 0 = left, 1 = middle, 2 = right). */
export const LANE_X: readonly number[] = Array.from({ length: LANE_COUNT }, (_, i) =>
  laneXAtY(i as LaneIndex, PLAYER_Y),
);

/** Speed curve: world scroll speed in px/sec ramps from base to max over rampSeconds.
 * These are nominal values — actual per-frame speed is further shaped by
 * approachSpeedMultiplier (slow far away, fast close up), which averages
 * ~77% of nominal, so these run a bit hot to land on the same real
 * time-to-reach-player as before that curve was added. */
export const SPEED_BASE = 560;
export const SPEED_MAX = 1360;
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
