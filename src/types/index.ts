export type LaneIndex = 0 | 1 | 2;

export type ObstacleKind =
  | "banana"
  | "pigeon"
  | "selfieGuy"
  | "dog"
  | "car"
  | "bottle"
  | "barrier"
  | "protester"
  | "flag"
  | "backpack";

/** How an obstacle behaves once spawned. */
export type ObstacleMotion =
  | "static" // sits in a lane, road scrolls past it
  | "crossing" // walks/runs across lanes (dog, protester)
  | "swooping" // drops into a lane from off-screen (pigeon, flag)
  | "inLane"; // moves within the lane grid, can change lanes (car)

export interface ObstacleDefinition {
  kind: ObstacleKind;
  motion: ObstacleMotion;
  textureKey: string;
  /** Collision hitbox as a fraction of sprite display size, keeps hits feeling fair. */
  hitboxScale: number;
  /** Relative spawn weight — higher shows up more often. */
  weight: number;
  /** Seconds into a run before this obstacle can appear at all. */
  unlockAtSeconds: number;
  /** Ground-level clutter the player can clear with a jump; tall/wide obstacles can't be jumped. */
  jumpable: boolean;
  /** Path (under public/) to a real illustrated sprite. When present, PreloadScene
   * loads it under `textureKey` and TextureFactory skips the procedural version. */
  artPath?: string;
  /** Target on-road display width (design px) the art is normalized to, so any
   * source resolution renders at the same footprint. Defaults to native size. */
  displayWidth?: number;
  /** Vertical origin (0=top,1=bottom) for ground contact; defaults to 0.85. */
  spriteOriginY?: number;
}

export type CosmeticCategory = "bike" | "helmet" | "jersey" | "skin";

export interface CosmeticItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  price: number;
  tint: number;
  unlockedByDefault?: boolean;
}

export interface RunResult {
  distanceMeters: number;
  coinsCollected: number;
  isNewBest: boolean;
}
