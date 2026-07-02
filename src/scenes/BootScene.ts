import Phaser from "phaser";

/** First scene to run. No assets to load yet — just hands off to Preload. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    this.scene.start("Preload");
  }
}
