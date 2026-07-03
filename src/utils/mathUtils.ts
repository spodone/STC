export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 0..1 progress of a world-y position between its spawn point and the player line. */
export function depthProgress(y: number, spawnY: number, playerY: number): number {
  return clamp((y - spawnY) / (playerY - spawnY), 0, 1);
}

/** Cheap pseudo-3D: objects scale up as they approach the player line. */
export function depthScale(progress: number, minScale = 0.4, maxScale = 1.15): number {
  return lerp(minScale, maxScale, progress);
}

/**
 * How fast an approaching object should currently be covering ground, as a
 * multiplier on the base scroll speed. Real perspective motion isn't
 * constant-speed — a distant object crawls, a close one rushes past. Constant
 * speed reads as "falling/scrolling"; this easing is what reads as "I'm
 * riding toward it". Quadratic ease-in keeps the crawl noticeable far away.
 */
export function approachSpeedMultiplier(progress: number, minMult = 0.35, maxMult = 1.6): number {
  return lerp(minMult, maxMult, progress * progress);
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

export function pickWeighted<T extends { weight: number }>(items: readonly T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}
