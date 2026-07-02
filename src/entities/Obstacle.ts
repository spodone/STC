import Phaser from "phaser";
import { LANE_WIDTH, LANE_X, PLAYER_Y } from "../config/GameConfig";
import { BASE_HIT_WINDOW_PX, PROTESTER_MESSAGES } from "../config/obstacles";
import { clamp, depthProgress, depthScale, lerp, pickRandom, randomRange } from "../utils/mathUtils";
import type { LaneIndex, ObstacleDefinition } from "../types/index";

export const OBSTACLE_SPAWN_Y = -120;
export const OBSTACLE_RECYCLE_MARGIN = 160;

/**
 * One reusable entity for every obstacle kind. Behaviour is driven entirely
 * by `definition.motion`, so the pool never needs kind-specific subclasses —
 * new obstacle kinds are just a new ObstacleDefinition entry.
 */
export class Obstacle extends Phaser.GameObjects.Container {
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly sprite: Phaser.GameObjects.Image;
  private signBg?: Phaser.GameObjects.Rectangle;
  private signText?: Phaser.GameObjects.Text;

  private definition!: ObstacleDefinition;
  private age = 0;
  private crossStartX = 0;
  private crossEndX = 0;
  private crossDuration = 1;
  private laneSwerveTimer = 0;
  private laneSwerveTarget = 1 as LaneIndex;
  active = false;
  resolved = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, OBSTACLE_SPAWN_Y);
    this.shadow = scene.add.image(0, 10, "shadow-md");
    this.sprite = scene.add.image(0, 0, "banana").setOrigin(0.5, 0.85);
    this.add([this.shadow, this.sprite]);
    scene.add.existing(this);
    this.setVisible(false);
  }

  spawn(definition: ObstacleDefinition, lane: LaneIndex, scrollSpeed: number): void {
    this.definition = definition;
    this.age = 0;
    this.resolved = false;
    this.active = true;
    this.y = OBSTACLE_SPAWN_Y;
    this.angle = 0;
    this.setScale(depthScale(0));
    this.setAlpha(1);
    this.setVisible(true);
    this.sprite.setTexture(definition.textureKey);
    this.sprite.y = 0;

    const travelTime = Math.max((PLAYER_Y - OBSTACLE_SPAWN_Y) / scrollSpeed, 0.4);

    if (definition.motion === "crossing") {
      const leftToRight = Math.random() < 0.5;
      const offRoadLeft = LANE_X[0] - LANE_WIDTH * 0.7;
      const offRoadRight = LANE_X[2] + LANE_WIDTH * 0.7;
      this.crossStartX = leftToRight ? offRoadLeft : offRoadRight;
      this.crossEndX = leftToRight ? offRoadRight : offRoadLeft;
      this.crossDuration = travelTime * randomRange(0.7, 0.9);
      this.x = this.crossStartX;
    } else if (definition.motion === "swooping") {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.crossStartX = LANE_X[lane] + side * LANE_WIDTH * 1.3;
      this.crossEndX = LANE_X[lane];
      this.crossDuration = 0.4;
      this.x = this.crossStartX;
    } else if (definition.motion === "inLane") {
      this.x = LANE_X[lane];
      this.laneSwerveTimer = randomRange(0.55, 0.85);
      this.laneSwerveTarget = lane;
    } else {
      this.x = LANE_X[lane];
    }

    if (definition.kind === "protester") {
      this.ensureSign();
      if (this.signBg && this.signText) {
        this.signText.setText(pickRandom(PROTESTER_MESSAGES));
        this.signBg.setVisible(true);
        this.signText.setVisible(true);
      }
    } else if (this.signBg && this.signText) {
      this.signBg.setVisible(false);
      this.signText.setVisible(false);
    }
  }

  private ensureSign(): void {
    if (this.signBg && this.signText) return;
    this.signBg = this.scene.add.rectangle(0, -150, 118, 46, 0xffffff, 0.95).setStrokeStyle(3, 0x1a1f2e);
    this.signText = this.scene.add
      .text(0, -150, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#1a1f2e",
        align: "center",
        wordWrap: { width: 104 },
      })
      .setOrigin(0.5);
    this.add([this.signBg, this.signText]);
  }

  getKind(): string {
    return this.definition.kind;
  }

  getLane(): LaneIndex {
    let closest: LaneIndex = 0;
    let closestDist = Infinity;
    for (let i = 0; i < LANE_X.length; i++) {
      const d = Math.abs(this.x - LANE_X[i]);
      if (d < closestDist) {
        closestDist = d;
        closest = i as LaneIndex;
      }
    }
    return closest;
  }

  /** True while the obstacle's x is roughly centered in a lane (not mid-crossing/off-road). */
  isInLaneBounds(): boolean {
    const nearestLaneX = LANE_X[this.getLane()];
    return Math.abs(this.x - nearestLaneX) < LANE_WIDTH * 0.42;
  }

  getHitWindowPx(): number {
    return BASE_HIT_WINDOW_PX * this.definition.hitboxScale;
  }

  isPastPlayer(): boolean {
    return this.y > PLAYER_Y + OBSTACLE_RECYCLE_MARGIN;
  }

  update(deltaSeconds: number, scrollSpeed: number): void {
    if (!this.active) return;
    this.age += deltaSeconds;

    const verticalMultiplier = this.definition.motion === "inLane" ? 1.08 : 1;
    this.y += scrollSpeed * deltaSeconds * verticalMultiplier;

    if (this.definition.motion === "crossing") {
      const t = clamp(this.age / this.crossDuration, 0, 1);
      this.x = lerp(this.crossStartX, this.crossEndX, t);
      if (this.definition.kind === "dog") {
        this.sprite.y = Math.sin(this.age * 16) * 3;
      } else {
        this.sprite.y = Math.sin(this.age * 6) * 2;
      }
    } else if (this.definition.motion === "swooping") {
      const t = clamp(this.age / this.crossDuration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.x = lerp(this.crossStartX, this.crossEndX, eased);
      this.sprite.y = Math.sin(this.age * 14) * 4;
    } else if (this.definition.motion === "inLane") {
      this.laneSwerveTimer -= deltaSeconds;
      if (this.laneSwerveTimer <= 0) {
        this.laneSwerveTimer = randomRange(0.6, 1.0);
        const options: LaneIndex[] = [0, 1, 2].filter((l) => l !== this.laneSwerveTarget) as LaneIndex[];
        this.laneSwerveTarget = pickRandom(options);
        this.scene.tweens.add({
          targets: this,
          x: LANE_X[this.laneSwerveTarget],
          duration: 320,
          ease: "Sine.easeInOut",
        });
      }
    }

    const progress = depthProgress(this.y, OBSTACLE_SPAWN_Y, PLAYER_Y);
    this.setScale(depthScale(progress));
  }

  deactivate(): void {
    this.active = false;
    this.setVisible(false);
    this.scene.tweens.killTweensOf(this);
  }
}
