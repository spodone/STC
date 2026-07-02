import Phaser from "phaser";
import { PIXELS_PER_METER, STORAGE_KEYS } from "../config/GameConfig";
import { storage } from "../utils/storage";

export class ScoreManager extends Phaser.Events.EventEmitter {
  static readonly METERS_CHANGED = "meters-changed";
  static readonly MILESTONE = "milestone";

  private distancePx = 0;
  private lastMeters = 0;
  private best: number;

  constructor() {
    super();
    this.best = storage.getNumber(STORAGE_KEYS.bestScore, 0);
  }

  reset(): void {
    this.distancePx = 0;
    this.lastMeters = 0;
    this.emit(ScoreManager.METERS_CHANGED, 0);
  }

  addDistance(px: number): void {
    this.distancePx += px;
    const meters = this.getMeters();
    if (meters !== this.lastMeters) {
      this.lastMeters = meters;
      this.emit(ScoreManager.METERS_CHANGED, meters);
      if (meters > 0 && meters % 100 === 0) {
        this.emit(ScoreManager.MILESTONE, meters);
      }
    }
  }

  getMeters(): number {
    return Math.floor(this.distancePx / PIXELS_PER_METER);
  }

  getBest(): number {
    return this.best;
  }

  /** Call once on game over. Returns whether this run set a new best. */
  finalize(): boolean {
    const meters = this.getMeters();
    const isNewBest = meters > this.best;
    if (isNewBest) {
      this.best = meters;
      storage.setNumber(STORAGE_KEYS.bestScore, this.best);
    }
    return isNewBest;
  }
}
