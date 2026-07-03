import Phaser from "phaser";
import { HORIZON_Y, LANE_COUNT, PLAYER_Y, ROAD_X, laneWidthAtY } from "../config/GameConfig";
import { BASE_HIT_WINDOW_PX, PROTESTER_MESSAGES } from "../config/obstacles";
import { approachSpeedMultiplier, clamp, depthProgress, depthScale, lerp, pickRandom, randomRange } from "../utils/mathUtils";
import type { LaneIndex, ObstacleDefinition } from "../types/index";

export const OBSTACLE_SPAWN_Y = HORIZON_Y;
export const OBSTACLE_RECYCLE_MARGIN = 160;

const CENTER_OFFSET = (LANE_COUNT - 1) / 2;
const laneUnit = (lane: LaneIndex): number => lane - CENTER_OFFSET;

/**
 * One reusable entity for every obstacle kind. Behaviour is driven entirely
 * by `definition.motion`, so the pool never needs kind-specific subclasses —
 * new obstacle kinds are just a new ObstacleDefinition entry.
 *
 * Position is tracked as `xUnit` — an offset in lane-widths from the road's
 * center, independent of depth — and converted to a pixel x every frame via
 * laneWidthAtY(y). That's what makes the sideways motion (crossing, swerving,
 * swooping in) converge correctly toward the horizon's vanishing point.
 */
export class Obstacle extends Phaser.GameObjects.Container {
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly sprite: Phaser.GameObjects.Image;
  private signBg?: Phaser.GameObjects.Rectangle;
  private signText?: Phaser.GameObjects.Text;

  private definition!: ObstacleDefinition;
  private age = 0;
  private xUnit = 0;
  private crossStartUnit = 0;
  private crossEndUnit = 0;
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
      const offRoadLeft = laneUnit(0) - 0.7;
      const offRoadRight = laneUnit(2) + 0.7;
      this.crossStartUnit = leftToRight ? offRoadLeft : offRoadRight;
      this.crossEndUnit = leftToRight ? offRoadRight : offRoadLeft;
      this.crossDuration = travelTime * randomRange(0.7, 0.9);
      this.xUnit = this.crossStartUnit;
    } else if (definition.motion === "swooping") {
      const side = Math.random() < 0.5 ? -1 : 1;
      const targetUnit = laneUnit(lane);
      this.crossStartUnit = targetUnit + side * 1.3;
      this.crossEndUnit = targetUnit;
      this.crossDuration = 0.4;
      this.xUnit = this.crossStartUnit;
    } else if (definition.motion === "inLane") {
      this.xUnit = laneUnit(lane);
      this.laneSwerveTimer = randomRange(0.55, 0.85);
      this.laneSwerveTarget = lane;
    } else {
      this.xUnit = laneUnit(lane);
    }

    this.x = ROAD_X + this.xUnit * laneWidthAtY(this.y);

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

  isJumpable(): boolean {
    return this.definition.jumpable;
  }

  getLane(): LaneIndex {
    return clamp(Math.round(this.xUnit + CENTER_OFFSET), 0, LANE_COUNT - 1) as LaneIndex;
  }

  /** True while the obstacle is roughly centered in a lane (not mid-crossing/off-road). */
  isInLaneBounds(): boolean {
    return Math.abs(this.xUnit - laneUnit(this.getLane())) < 0.42;
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
    const priorProgress = depthProgress(this.y, OBSTACLE_SPAWN_Y, PLAYER_Y);
    const approachMultiplier = approachSpeedMultiplier(priorProgress);
    this.y += scrollSpeed * deltaSeconds * verticalMultiplier * approachMultiplier;

    if (this.definition.motion === "crossing") {
      const t = clamp(this.age / this.crossDuration, 0, 1);
      this.xUnit = lerp(this.crossStartUnit, this.crossEndUnit, t);
      if (this.definition.kind === "dog") {
        this.sprite.y = Math.sin(this.age * 16) * 3;
      } else {
        this.sprite.y = Math.sin(this.age * 6) * 2;
      }
    } else if (this.definition.motion === "swooping") {
      const t = clamp(this.age / this.crossDuration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.xUnit = lerp(this.crossStartUnit, this.crossEndUnit, eased);
      this.sprite.y = Math.sin(this.age * 14) * 4;
    } else if (this.definition.motion === "inLane") {
      this.laneSwerveTimer -= deltaSeconds;
      if (this.laneSwerveTimer <= 0) {
        this.laneSwerveTimer = randomRange(0.6, 1.0);
        const options: LaneIndex[] = [0, 1, 2].filter((l) => l !== this.laneSwerveTarget) as LaneIndex[];
        this.laneSwerveTarget = pickRandom(options);
        this.scene.tweens.add({
          targets: this,
          xUnit: laneUnit(this.laneSwerveTarget),
          duration: 320,
          ease: "Sine.easeInOut",
        });
      }
    }

    this.x = ROAD_X + this.xUnit * laneWidthAtY(this.y);

    const progress = depthProgress(this.y, OBSTACLE_SPAWN_Y, PLAYER_Y);
    this.setScale(depthScale(progress));
  }

  deactivate(): void {
    this.active = false;
    this.setVisible(false);
    this.scene.tweens.killTweensOf(this);
  }
}
