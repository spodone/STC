import {
  EASY_WINDOW_SECONDS,
  SPEED_BASE,
  SPEED_MAX,
  SPEED_RAMP_SECONDS,
} from "../config/GameConfig";
import { clamp, lerp } from "../utils/mathUtils";

/**
 * Single source of truth for "how hard is the run right now". Everything
 * else (spawner, road scroll, score) reads from this each frame instead of
 * tracking its own timer, so difficulty always stays in sync.
 */
export class DifficultyManager {
  private elapsedSeconds = 0;

  update(deltaSeconds: number): void {
    this.elapsedSeconds += deltaSeconds;
  }

  reset(): void {
    this.elapsedSeconds = 0;
  }

  getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  /** Current world scroll speed in px/sec, ramping from base to max. */
  getScrollSpeed(): number {
    const t = clamp(this.elapsedSeconds / SPEED_RAMP_SECONDS, 0, 1);
    // ease-in so the ramp feels gentle early, aggressive late
    const eased = t * t * (3 - 2 * t);
    return lerp(SPEED_BASE, SPEED_MAX, eased);
  }

  /** Average seconds between obstacle spawns — shrinks as the run goes on. */
  getSpawnIntervalSeconds(): number {
    const t = clamp(this.elapsedSeconds / SPEED_RAMP_SECONDS, 0, 1);
    return lerp(1.15, 0.45, t);
  }

  /** Chance [0,1] that a spawn wave drops a second, simultaneous obstacle. */
  getComboChance(): number {
    if (this.elapsedSeconds < EASY_WINDOW_SECONDS) return 0;
    const t = clamp((this.elapsedSeconds - EASY_WINDOW_SECONDS) / SPEED_RAMP_SECONDS, 0, 1);
    return lerp(0, 0.55, t);
  }

  isEasyWindow(): boolean {
    return this.elapsedSeconds < EASY_WINDOW_SECONDS;
  }
}
