import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "../config/GameConfig";
import { ENVIRONMENTS, SEGMENT_LENGTH_METERS } from "../config/environments";

/**
 * Owns the scrolling backdrop. Prefers a real illustrated background per
 * distance segment; falls back to the procedural tiled road (which bakes in
 * scrolling trees/rocks/crowd on the margins) for any segment that doesn't
 * have a properly layered (scrollable) background yet — see
 * `useForGameplayBackground` in config/environments.ts.
 */
export class EnvironmentManager {
  private readonly scene: Phaser.Scene;
  private readonly fallbackRoad: Phaser.GameObjects.TileSprite;
  private readonly illustratedBg: Phaser.GameObjects.Image;
  private currentIndex = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const sky = scene.add.graphics().setDepth(-100);
    sky.fillGradientStyle(0x8ec9f0, 0x8ec9f0, 0xd8f0ff, 0xd8f0ff, 1);
    sky.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    this.fallbackRoad = scene.add
      .tileSprite(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, "road-tile")
      .setDepth(-50);

    this.illustratedBg = scene.add
      .image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, ENVIRONMENTS[0].textureKey)
      .setDepth(-60)
      .setVisible(false);
    this.illustratedBg.setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT);
  }

  reset(): void {
    this.fallbackRoad.tilePositionY = 0;
    this.currentIndex = -1;
    this.applySegment(0);
  }

  /** Call every frame while playing — keeps the procedural fallback scrolling. */
  scrollFallback(scrollSpeed: number, deltaSeconds: number): void {
    this.fallbackRoad.tilePositionY -= scrollSpeed * deltaSeconds;
  }

  /** Call whenever distance changes — swaps the backdrop when crossing into a new segment. */
  update(currentMeters: number): void {
    const index = Math.floor(currentMeters / SEGMENT_LENGTH_METERS) % ENVIRONMENTS.length;
    if (index !== this.currentIndex) this.applySegment(index);
  }

  private applySegment(index: number): void {
    this.currentIndex = index;
    const env = ENVIRONMENTS[index];

    if (env.useForGameplayBackground && this.scene.textures.exists(env.textureKey)) {
      this.illustratedBg.setTexture(env.textureKey);
      this.illustratedBg.setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT);
      this.illustratedBg.setVisible(true);
      this.fallbackRoad.setVisible(false);
    } else {
      this.illustratedBg.setVisible(false);
      this.fallbackRoad.setVisible(true);
    }
  }
}
