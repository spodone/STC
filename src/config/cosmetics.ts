import { PALETTE } from "./GameConfig";
import type { CosmeticItem } from "../types/index";

export type JerseyPattern = "solid" | "dots" | "stripe";

export interface SkinDefinition extends CosmeticItem {
  jerseyColor: number;
  frameColor: number;
  helmetColor: number;
  pattern: JerseyPattern;
  patternColor: number;
  /** Path (under public/) to a real illustrated sprite for this skin. When
   * present, PreloadScene loads it and TextureFactory skips the procedural
   * version — same graceful-upgrade pattern as the environment backgrounds. */
  artPath?: string;
  /** Fraction down the source image where the wheel/ground contact sits —
   * varies per art source, so it's measured per-skin rather than assumed.
   * Defaults to 0.95 (matches the procedural sprites) when omitted. */
  spriteOriginY?: number;
}

/** Texture key for a given skin id — TextureFactory generates one per entry. */
export const playerTextureKey = (skinId: string): string => `player-${skinId}`;

export const SKINS: readonly SkinDefinition[] = [
  {
    id: "yellow-leader",
    category: "skin",
    name: "Yellow Leader",
    price: 0,
    tint: PALETTE.jerseyYellow,
    unlockedByDefault: true,
    jerseyColor: PALETTE.jerseyYellow,
    frameColor: PALETTE.bikeFrame,
    helmetColor: 0x232323,
    pattern: "solid",
    patternColor: 0x000000,
    artPath: "art/cyclist/yellow.png",
    spriteOriginY: 0.998,
  },
  {
    id: "polka-dot",
    category: "skin",
    name: "Polka Dot",
    price: 300,
    tint: 0xffffff,
    jerseyColor: 0xffffff,
    frameColor: 0xe94b4b,
    helmetColor: 0xe94b4b,
    pattern: "dots",
    patternColor: 0xe94b4b,
    artPath: "art/cyclist/Polka.png",
    spriteOriginY: 0.998,
  },
  {
    id: "green-sprinter",
    category: "skin",
    name: "Green Sprinter",
    price: 300,
    tint: 0x3d8b52,
    jerseyColor: 0x3d8b52,
    frameColor: 0x1f5c34,
    helmetColor: 0x232323,
    pattern: "solid",
    patternColor: 0x000000,
    artPath: "art/cyclist/Green.png",
    spriteOriginY: 0.998,
  },
  {
    id: "retro-rider",
    category: "skin",
    name: "Retro Rider",
    price: 500,
    tint: 0xe8d9b0,
    jerseyColor: 0xe8d9b0,
    frameColor: 0x8a5a2b,
    helmetColor: 0x8a5a2b,
    pattern: "stripe",
    patternColor: 0xb04242,
    artPath: "art/cyclist/UCI.png",
    spriteOriginY: 0.998,
  },
  {
    id: "coffee-rider",
    category: "skin",
    name: "Coffee Rider",
    price: 400,
    tint: 0x6f4a2e,
    jerseyColor: 0x6f4a2e,
    frameColor: 0x3d2a1a,
    helmetColor: 0xd8b98a,
    pattern: "solid",
    patternColor: 0x000000,
  },
  {
    id: "skeleton",
    category: "skin",
    name: "Skeleton",
    price: 600,
    tint: 0x2b2b2b,
    jerseyColor: 0x2b2b2b,
    frameColor: 0x1a1a1a,
    helmetColor: 0xffffff,
    pattern: "stripe",
    patternColor: 0xffffff,
  },
  {
    id: "banana-suit",
    category: "skin",
    name: "Banana Suit",
    price: 450,
    tint: 0xf6d63a,
    jerseyColor: 0xf6d63a,
    frameColor: 0x8a6d1f,
    helmetColor: 0xf6d63a,
    pattern: "dots",
    patternColor: 0x8a6d1f,
  },
  {
    id: "pizza-rider",
    category: "skin",
    name: "Pizza Delivery",
    price: 500,
    tint: 0xe94b4b,
    jerseyColor: 0xe94b4b,
    frameColor: 0xe94b4b,
    helmetColor: 0xffffff,
    pattern: "stripe",
    patternColor: 0xffffff,
    artPath: "art/cyclist/Pizza.png",
    spriteOriginY: 0.986,
  },
  {
    id: "business-cyclist",
    category: "skin",
    name: "Business Cyclist",
    price: 700,
    tint: 0x24304a,
    jerseyColor: 0x24304a,
    frameColor: 0x1a1a1a,
    helmetColor: 0x24304a,
    pattern: "stripe",
    patternColor: 0xe94b4b,
  },
];

export const DEFAULT_SKIN_ID = "yellow-leader";
