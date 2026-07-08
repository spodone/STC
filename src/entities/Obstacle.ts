import Phaser from "phaser";
import { HORIZON_Y, LANE_COUNT, PLAYER_Y, ROAD_X, laneWidthAtY } from "../config/GameConfig";
import { BASE_HIT_WINDOW_PX, PROTESTER_MESSAGES } from "../config/obstacles";
import { approachSpeedMultiplier, clamp, depthProgress, depthScale, lerp, pickRandom, randomRange } from "../utils/mathUtils";
import type { LaneIndex, ObstacleDefinition } from "../types/index";

export const OBSTACLE_SPAWN_Y = HORIZON_Y;
export const OBSTACLE_RECYCLE_MARGIN = 160;

const CENTER_OFFSET = (LANE_COUNT - 1) / 2;
const laneUnit = (lane: LaneIndex): number => lane - CENTER_OFFSET;

/** Vertical center of the blank cardboard sign in the protester art (fraction from top). */
const PROTESTER_SIGN_Y_FRAC = 0.284;

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
    this.sprite.setOrigin(0.5, definition.spriteOriginY ?? 0.85);
    // Normalize real art (various source resolutions) to a consistent on-road
    // footprint; procedural textures render at native size (scale 1).
    this.sprite.setScale(definition.displayWidth ? definition.displayWidth / this.sprite.frame.width : 1);
    this.sprite.y = 0;
    this.sprite.angle = 0;

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
      if (definition.kind === "pigeon") {
        // bird drops in toward the given lane from a random side
        const side = Math.random() < 0.5 ? -1 : 1;
        const targetUnit = laneUnit(lane);
        this.crossStartUnit = targetUnit + side * 1.3;
        this.crossEndUnit = targetUnit;
        this.crossDuration = 0.4;
      } else {
        // person only appears at an edge — jumps out from the roadside into
        // the nearest edge lane (never the middle lane)
        const fromLeft = Math.random() < 0.5;
        const edgeUnit = laneUnit(fromLeft ? 0 : 2);
        this.crossStartUnit = edgeUnit + (fromLeft ? -1.3 : 1.3);
        this.crossEndUnit = edgeUnit;
        this.crossDuration = 0.45;
      }
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
      if (this.signText) {
        this.signText.setText(pickRandom(PROTESTER_MESSAGES));
        // Overlay the message onto the blank cardboard drawn in the art.
        const spriteScale = this.sprite.scaleX;
        const fh = this.sprite.frame.height;
        const originY = definition.spriteOriginY ?? 0.85;
        this.signText.y = spriteScale * (PROTESTER_SIGN_Y_FRAC - originY) * fh;
        this.signText.setVisible(true);
      }
    } else if (this.signText) {
      this.signText.setVisible(false);
    }
  }

  private ensureSign(): void {
    if (this.signText) return;
    this.signText = this.scene.add
      .text(0, 0, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#2a2118",
        align: "center",
        wordWrap: { width: 78 },
      })
      .setOrigin(0.5);
    this.add(this.signText);
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
      let base = lerp(this.crossStartUnit, this.crossEndUnit, eased);
      if (this.definition.kind === "pigeon") {
        // once it has swooped in, keep drifting side to side so it reads as
        // flying (and forces the player to track it), with a matching wing bank
        base += Math.sin(this.age * 3.0) * 0.85 * t;
        this.sprite.angle = Math.cos(this.age * 3.0) * 12 * t;
        this.sprite.y = Math.sin(this.age * 14) * 4;
      } else {
        // person jumping out from the roadside: a single hop as they land
        this.sprite.y = t < 1 ? -Math.sin(t * Math.PI) * 18 : 0;
      }
      this.xUnit = base;
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
