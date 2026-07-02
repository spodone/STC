import type { ObstacleDefinition } from "../types/index";

/**
 * Difficulty curve is expressed through unlockAtSeconds: easy, static
 * obstacles show up immediately; obstacles that move (and demand a read +
 * react) unlock progressively so the first 20s stay gentle.
 */
export const OBSTACLE_DEFINITIONS: readonly ObstacleDefinition[] = [
  { kind: "banana", motion: "static", textureKey: "banana", hitboxScale: 0.65, weight: 12, unlockAtSeconds: 0 },
  { kind: "bottle", motion: "static", textureKey: "bottle", hitboxScale: 0.6, weight: 10, unlockAtSeconds: 0 },
  { kind: "barrier", motion: "static", textureKey: "barrier", hitboxScale: 0.9, weight: 8, unlockAtSeconds: 5 },
  { kind: "backpack", motion: "static", textureKey: "backpack", hitboxScale: 0.7, weight: 7, unlockAtSeconds: 8 },
  { kind: "selfieGuy", motion: "static", textureKey: "selfieGuy", hitboxScale: 0.85, weight: 8, unlockAtSeconds: 6 },
  { kind: "pigeon", motion: "swooping", textureKey: "pigeon", hitboxScale: 0.75, weight: 8, unlockAtSeconds: 10 },
  { kind: "flag", motion: "swooping", textureKey: "flag", hitboxScale: 0.7, weight: 6, unlockAtSeconds: 12 },
  { kind: "dog", motion: "crossing", textureKey: "dog", hitboxScale: 0.85, weight: 7, unlockAtSeconds: 15 },
  { kind: "protester", motion: "crossing", textureKey: "protester", hitboxScale: 0.9, weight: 5, unlockAtSeconds: 20 },
  { kind: "car", motion: "inLane", textureKey: "car", hitboxScale: 1.05, weight: 6, unlockAtSeconds: 25 },
];

export const PROTESTER_MESSAGES: readonly string[] = [
  "SAVE THE PLANET",
  "NO MORE CARS",
  "TOO MUCH CARBON",
  "STOP OIL",
  "CLIMATE NOW",
];

/** Base Y-proximity window (px) around the player's line that counts as a hit. */
export const BASE_HIT_WINDOW_PX = 55;
