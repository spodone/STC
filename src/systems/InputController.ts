import Phaser from "phaser";
import { SWIPE_MIN_DISTANCE_PX } from "../config/GameConfig";

/** Unifies swipe (touch/mouse drag) and keyboard into two simple lane-change signals. */
export class InputController extends Phaser.Events.EventEmitter {
  static readonly LANE_LEFT = "lane-left";
  static readonly LANE_RIGHT = "lane-right";
  static readonly PAUSE_PRESSED = "pause-pressed";

  private readonly scene: Phaser.Scene;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private pointerActive = false;
  private enabled = true;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.bindPointer();
    this.bindKeyboard();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private bindPointer(): void {
    this.scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.pointerActive = true;
      this.pointerStartX = p.x;
      this.pointerStartY = p.y;
    });

    this.scene.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.pointerActive) return;
      this.pointerActive = false;
      if (!this.enabled) return;

      const dx = p.x - this.pointerStartX;
      const dy = p.y - this.pointerStartY;
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE_PX || Math.abs(dx) <= Math.abs(dy)) return;

      this.emit(dx > 0 ? InputController.LANE_RIGHT : InputController.LANE_LEFT);
    });
  }

  private bindKeyboard(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    keyboard.on("keydown-LEFT", () => this.enabled && this.emit(InputController.LANE_LEFT));
    keyboard.on("keydown-A", () => this.enabled && this.emit(InputController.LANE_LEFT));
    keyboard.on("keydown-RIGHT", () => this.enabled && this.emit(InputController.LANE_RIGHT));
    keyboard.on("keydown-D", () => this.enabled && this.emit(InputController.LANE_RIGHT));
    keyboard.on("keydown-ESC", () => this.emit(InputController.PAUSE_PRESSED));
    keyboard.on("keydown-P", () => this.emit(InputController.PAUSE_PRESSED));
  }

  destroy(): void {
    this.scene.input.keyboard?.removeAllListeners();
    this.scene.input.removeAllListeners();
    this.removeAllListeners();
  }
}
