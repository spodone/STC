import Phaser from "phaser";
import { HORIZON_Y, LANE_COUNT, PLAYER_Y, ROAD_X, laneWidthAtY } from "../config/GameConfig";
import { approachSpeedMultiplier, depthProgress, depthScale } from "../utils/mathUtils";
import type { LaneIndex } from "../types/index";

export const COIN_SPAWN_Y = HORIZON_Y;
export const COIN_RECYCLE_MARGIN = 160;
export const COIN_HIT_WINDOW_PX = 70;

const CENTER_OFFSET = (LANE_COUNT - 1) / 2;

export class Coin extends Phaser.GameObjects.Container {
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly sprite: Phaser.GameObjects.Image;
  private lane: LaneIndex = 1;
  private xUnit = 0;
  private age = 0;
  active = false;
  collected = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, COIN_SPAWN_Y);
    this.shadow = scene.add.image(0, 8, "shadow-sm");
    this.sprite = scene.add.image(0, 0, "coin");
    this.add([this.shadow, this.sprite]);
    scene.add.existing(this);
    this.setVisible(false);
  }

  spawn(lane: LaneIndex, yOffset = 0): void {
    this.lane = lane;
    this.xUnit = lane - CENTER_OFFSET;
    this.y = COIN_SPAWN_Y - yOffset;
    this.x = ROAD_X + this.xUnit * laneWidthAtY(this.y);
    this.age = 0;
    this.active = true;
    this.collected = false;
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(depthScale(0));
  }

  getLane(): LaneIndex {
    return this.lane;
  }

  isPastPlayer(): boolean {
    return this.y > PLAYER_Y + COIN_RECYCLE_MARGIN;
  }

  update(deltaSeconds: number, scrollSpeed: number): void {
    if (!this.active || this.collected) return;
    this.age += deltaSeconds;
    const priorProgress = depthProgress(this.y, COIN_SPAWN_Y, PLAYER_Y);
    this.y += scrollSpeed * deltaSeconds * approachSpeedMultiplier(priorProgress);
    this.x = ROAD_X + this.xUnit * laneWidthAtY(this.y);
    this.sprite.scaleX = Math.cos(this.age * 8);
    const progress = depthProgress(this.y, COIN_SPAWN_Y, PLAYER_Y);
    this.setScale(depthScale(progress));
  }

  playCollectPop(onComplete: () => void): void {
    this.collected = true;
    this.scene.tweens.add({
      targets: this,
      scale: this.scale * 1.6,
      alpha: 0,
      y: this.y - 40,
      duration: 220,
      ease: "Back.easeOut",
      onComplete,
    });
  }

  deactivate(): void {
    this.active = false;
    this.setVisible(false);
    this.scene.tweens.killTweensOf(this);
  }
}
