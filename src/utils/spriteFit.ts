import type Phaser from "phaser";
import type { SkinDefinition } from "../config/cosmetics";

/**
 * Normalizes a player sprite's scale/origin to a target display height,
 * regardless of the source texture's native resolution — procedural sprites
 * and real illustrated art (much higher-res) can be swapped in freely
 * without every call site needing its own scale math.
 */
export function fitPlayerSprite(image: Phaser.GameObjects.Image, skin: SkinDefinition, targetHeight: number): void {
  image.setOrigin(0.5, skin.spriteOriginY ?? 0.95);
  image.setScale(targetHeight / image.frame.height);
}
