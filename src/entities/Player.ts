import Phaser from "phaser";
import { LANE_CHANGE_MS, LANE_X, PLAYER_Y } from "../config/GameConfig";
import { clamp } from "../utils/mathUtils";
import type { LaneIndex } from "../types/index";

/** The rider. Only moves left/right between lanes — forward motion is simulated by the world scrolling under it. */
export class Player extends Phaser.GameObjects.Container {
  private lane: LaneIndex = 1;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly sprite: Phaser.GameObjects.Image;
  private bobTime = 0;
  private crashed = false;

  constructor(scene: Phaser.Scene, textureKey: string) {
    super(scene, LANE_X[1], PLAYER_Y);
    this.shadow = scene.add.image(0, 8, "shadow-md").setAlpha(0.85);
    this.sprite = scene.add.image(0, 0, textureKey).setOrigin(0.5, 0.95);
    this.add([this.shadow, this.sprite]);
    scene.add.existing(this);
  }

  setSkin(textureKey: string): void {
    this.sprite.setTexture(textureKey);
  }

  getLane(): LaneIndex {
    return this.lane;
  }

  isCrashed(): boolean {
    return this.crashed;
  }

  reset(): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.sprite);
    this.lane = 1;
    this.crashed = false;
    this.x = LANE_X[1];
    this.y = PLAYER_Y;
    this.angle = 0;
    this.setScale(1);
    this.setAlpha(1);
    this.sprite.setTint(0xffffff);
    this.sprite.y = 0;
    this.bobTime = 0;
  }

  changeLane(direction: -1 | 1): void {
    if (this.crashed) return;
    const next = clamp(this.lane + direction, 0, 2) as LaneIndex;
    if (next === this.lane) return;
    this.lane = next;

    this.scene.tweens.add({
      targets: this,
      x: LANE_X[this.lane],
      duration: LANE_CHANGE_MS,
      ease: "Cubic.easeOut",
    });

    this.scene.tweens.add({
      targets: this,
      angle: direction * 14,
      duration: LANE_CHANGE_MS * 0.5,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
  }

  update(deltaSeconds: number): void {
    if (this.crashed) return;
    this.bobTime += deltaSeconds;
    this.sprite.y = Math.sin(this.bobTime * 9) * 3;
  }

  playCrash(onComplete: () => void): void {
    this.crashed = true;
    this.sprite.setTint(0xffb3b3);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.25,
      scaleY: 0.75,
      duration: 90,
      yoyo: true,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: this,
      angle: 95,
      y: this.y + 40,
      alpha: 0.25,
      duration: 420,
      delay: 90,
      ease: "Back.easeIn",
      onComplete,
    });
  }
}
