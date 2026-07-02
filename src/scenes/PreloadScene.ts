import Phaser from "phaser";
import { TextureFactory } from "../systems/TextureFactory";

/**
 * All art is generated procedurally (no exported assets from the concept
 * art), so "loading" is just synchronous texture generation — no network
 * wait, no spinner needed beyond a single frame.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  create(): void {
    new TextureFactory(this).generateAll();
    this.scene.start("Menu");
  }
}
