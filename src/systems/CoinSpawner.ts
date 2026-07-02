import Phaser from "phaser";
import { Coin } from "../entities/Coin";
import { LANE_X, PLAYER_Y } from "../config/GameConfig";
import { ObjectPool } from "../utils/ObjectPool";
import { randomInt, randomRange } from "../utils/mathUtils";
import type { LaneIndex } from "../types/index";

const TRAIL_SPACING_PX = 90;

export class CoinSpawner extends Phaser.Events.EventEmitter {
  static readonly COIN_COLLECTED = "coin-collected";

  private readonly pool: ObjectPool<Coin>;
  private readonly active: Coin[] = [];
  private spawnTimer = 0;

  constructor(scene: Phaser.Scene) {
    super();
    this.pool = new ObjectPool<Coin>(
      () => new Coin(scene),
      (c) => c.deactivate(),
      20,
    );
  }

  reset(): void {
    for (const coin of this.active) this.pool.release(coin);
    this.active.length = 0;
    this.spawnTimer = randomRange(1.5, 2.5);
  }

  update(deltaSeconds: number, scrollSpeed: number, playerLane: LaneIndex, playerCrashed: boolean): void {
    if (!playerCrashed) {
      this.spawnTimer -= deltaSeconds;
      if (this.spawnTimer <= 0) {
        this.spawnTrail();
        this.spawnTimer = randomRange(1.8, 3.2);
      }
    }

    for (let i = this.active.length - 1; i >= 0; i--) {
      const coin = this.active[i];
      coin.update(deltaSeconds, scrollSpeed);

      if (!playerCrashed && !coin.collected) {
        const withinBand = Math.abs(coin.y - PLAYER_Y) <= 70;
        if (withinBand && coin.getLane() === playerLane) {
          this.emit(CoinSpawner.COIN_COLLECTED, coin.x, coin.y);
          coin.playCollectPop(() => {
            this.pool.release(coin);
          });
        }
      }

      if (coin.collected && !coin.active) {
        this.active.splice(i, 1);
      } else if (coin.isPastPlayer()) {
        this.pool.release(coin);
        this.active.splice(i, 1);
      }
    }
  }

  private spawnTrail(): void {
    const lane = randomInt(0, 2) as LaneIndex;
    const count = randomInt(3, 5);
    for (let i = 0; i < count; i++) {
      const coin = this.pool.acquire();
      coin.spawn(lane, LANE_X[lane]);
      coin.y -= i * TRAIL_SPACING_PX;
      this.active.push(coin);
    }
  }
}
