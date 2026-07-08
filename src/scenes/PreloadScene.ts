import Phaser from "phaser";
import { TextureFactory } from "../systems/TextureFactory";
import { ENVIRONMENTS } from "../config/environments";
import { SKINS, playerTextureKey } from "../config/cosmetics";
import { OBSTACLE_DEFINITIONS } from "../config/obstacles";

/**
 * Most art is generated procedurally (no shipped assets yet for most of the
 * game), but real illustrated art is loaded here as it arrives — only
 * entries that declare a real file (`hasArt` / `artPath`) are queued, so
 * missing files never 404 in the console.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload(): void {
    for (const env of ENVIRONMENTS) {
      if (env.hasArt) this.load.image(env.textureKey, env.imagePath);
    }
    for (const skin of SKINS) {
      if (skin.artPath) this.load.image(playerTextureKey(skin.id), skin.artPath);
    }
    for (const obstacle of OBSTACLE_DEFINITIONS) {
      if (obstacle.artPath) this.load.image(obstacle.textureKey, obstacle.artPath);
    }
  }

  create(): void {
    new TextureFactory(this).generateAll();
    this.scene.start("Menu");
  }
}
