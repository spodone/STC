import Phaser from "phaser";
import { Obstacle } from "../entities/Obstacle";
import { OBSTACLE_DEFINITIONS } from "../config/obstacles";
import { PLAYER_Y } from "../config/GameConfig";
import { ObjectPool } from "../utils/ObjectPool";
import { pickWeighted, randomInt } from "../utils/mathUtils";
import type { DifficultyManager } from "./DifficultyManager";
import type { LaneIndex, ObstacleDefinition } from "../types/index";

// Kinds that pick their own lane internally (edge-emergers, crossers, cars) —
// exclude them from combo waves so two obstacles never fight for the same lane.
const SOLO_ONLY_KINDS = new Set(["dog", "protester", "selfieGuy", "car"]);

export class ObstacleSpawner extends Phaser.Events.EventEmitter {
  static readonly PLAYER_HIT = "player-hit";

  private readonly difficulty: DifficultyManager;
  private readonly pool: ObjectPool<Obstacle>;
  private readonly active: Obstacle[] = [];
  private spawnTimer = 0;

  constructor(scene: Phaser.Scene, difficulty: DifficultyManager) {
    super();
    this.difficulty = difficulty;
    this.pool = new ObjectPool<Obstacle>(
      () => new Obstacle(scene),
      (o) => o.deactivate(),
      14,
    );
  }

  reset(): void {
    for (const obstacle of this.active) this.pool.release(obstacle);
    this.active.length = 0;
    this.spawnTimer = randomInt(1, 2);
  }

  update(
    deltaSeconds: number,
    scrollSpeed: number,
    playerLane: LaneIndex,
    playerCrashed: boolean,
    playerJumping: boolean,
  ): void {
    if (!playerCrashed) {
      this.spawnTimer -= deltaSeconds;
      if (this.spawnTimer <= 0) {
        this.spawnWave();
        this.spawnTimer = this.difficulty.getSpawnIntervalSeconds();
      }
    }

    for (let i = this.active.length - 1; i >= 0; i--) {
      const obstacle = this.active[i];
      obstacle.update(deltaSeconds, scrollSpeed);

      if (!playerCrashed && !obstacle.resolved) {
        const withinBand = Math.abs(obstacle.y - PLAYER_Y) <= obstacle.getHitWindowPx();
        if (withinBand && obstacle.isInLaneBounds() && obstacle.getLane() === playerLane) {
          obstacle.resolved = true;
          if (!(playerJumping && obstacle.isJumpable())) {
            this.emit(ObstacleSpawner.PLAYER_HIT, obstacle.getKind());
          }
        }
      }

      if (obstacle.isPastPlayer()) {
        this.pool.release(obstacle);
        this.active.splice(i, 1);
      }
    }
  }

  private spawnWave(): void {
    const elapsed = this.difficulty.getElapsedSeconds();
    const unlocked = OBSTACLE_DEFINITIONS.filter((d) => d.unlockAtSeconds <= elapsed);
    if (unlocked.length === 0) return;

    const first = pickWeighted(unlocked);
    const firstLane = randomInt(0, 2) as LaneIndex;
    this.spawnOne(first, firstLane);

    const canCombo =
      Math.random() < this.difficulty.getComboChance() &&
      !SOLO_ONLY_KINDS.has(first.kind) &&
      unlocked.some((d) => !SOLO_ONLY_KINDS.has(d.kind));

    if (canCombo) {
      const comboPool = unlocked.filter((d) => !SOLO_ONLY_KINDS.has(d.kind));
      const second = pickWeighted(comboPool);
      const remainingLanes: LaneIndex[] = [0, 1, 2].filter((l) => l !== firstLane) as LaneIndex[];
      const secondLane = remainingLanes[randomInt(0, remainingLanes.length - 1)];
      this.spawnOne(second, secondLane);
    }
  }

  private spawnOne(definition: ObstacleDefinition, lane: LaneIndex): void {
    const obstacle = this.pool.acquire();
    obstacle.spawn(definition, lane, this.difficulty.getScrollSpeed());
    this.active.push(obstacle);
  }
}
