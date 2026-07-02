import Phaser from "phaser";
import { DESIGN_WIDTH, PALETTE } from "../config/GameConfig";
import { CoinManager } from "../systems/CoinManager";
import { ScoreManager } from "../systems/ScoreManager";

const HUD_DEPTH = 1000;

/** Top HUD: distance + best, coin counter, pause button. Bottom stays empty per design. */
export class HUD {
  private readonly scene: Phaser.Scene;
  private readonly distanceText: Phaser.GameObjects.Text;
  private readonly bestText: Phaser.GameObjects.Text;
  private readonly coinPill: Phaser.GameObjects.Container;
  private readonly coinText: Phaser.GameObjects.Text;
  private readonly pauseButton: Phaser.GameObjects.Container;
  onPause?: () => void;

  constructor(scene: Phaser.Scene, scoreManager: ScoreManager, coinManager: CoinManager, best: number) {
    this.scene = scene;

    this.distanceText = scene.add
      .text(28, 34, "0m", {
        fontFamily: "Arial, sans-serif",
        fontSize: "44px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setDepth(HUD_DEPTH)
      .setShadow(0, 3, "rgba(0,0,0,0.35)", 4);

    this.bestText = scene.add
      .text(28, 86, `BEST: ${best}m`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#d8dce6",
      })
      .setDepth(HUD_DEPTH)
      .setShadow(0, 2, "rgba(0,0,0,0.3)", 3);

    this.coinPill = this.buildCoinPill();
    this.coinText = this.coinPill.getData("text") as Phaser.GameObjects.Text;

    this.pauseButton = this.buildPauseButton();

    scoreManager.on(ScoreManager.METERS_CHANGED, this.onMeters, this);
    scoreManager.on(ScoreManager.MILESTONE, this.onMilestone, this);
    coinManager.on(CoinManager.RUN_COINS_CHANGED, this.onCoins, this);
  }

  private buildCoinPill(): Phaser.GameObjects.Container {
    const x = DESIGN_WIDTH - 150;
    const y = 40;
    const bg = this.scene.add.graphics();
    bg.fillStyle(PALETTE.uiDark, 0.82);
    bg.fillRoundedRect(-70, -26, 140, 52, 26);
    const icon = this.scene.add.image(-38, 0, "coin").setScale(0.55);
    const text = this.scene.add
      .text(4, 0, "0", {
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffd23f",
      })
      .setOrigin(0, 0.5);
    const container = this.scene.add.container(x, y, [bg, icon, text]).setDepth(HUD_DEPTH);
    container.setData("text", text);
    return container;
  }

  private buildPauseButton(): Phaser.GameObjects.Container {
    const x = DESIGN_WIDTH - 44;
    const y = 118;
    const bg = this.scene.add.graphics();
    bg.fillStyle(PALETTE.uiDark, 0.82);
    bg.fillCircle(0, 0, 30);
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-9, -10, 6, 20, 2);
    bg.fillRoundedRect(3, -10, 6, 20, 2);
    const container = this.scene.add.container(x, y, [bg]).setDepth(HUD_DEPTH).setSize(60, 60);
    container.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      this.pulse(container);
      this.onPause?.();
    });
    return container;
  }

  private pulse(target: Phaser.GameObjects.Container): void {
    this.scene.tweens.add({
      targets: target,
      scale: 0.85,
      duration: 70,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private onMeters(meters: number): void {
    this.distanceText.setText(`${meters}m`);
  }

  private onMilestone(): void {
    this.scene.tweens.add({
      targets: this.distanceText,
      scale: 1.35,
      duration: 110,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private onCoins(runCoins: number): void {
    this.coinText.setText(String(runCoins));
    this.scene.tweens.add({
      targets: this.coinPill,
      scale: 1.18,
      duration: 110,
      yoyo: true,
      ease: "Back.easeOut",
    });
  }

  setVisible(visible: boolean): void {
    this.distanceText.setVisible(visible);
    this.bestText.setVisible(visible);
    this.coinPill.setVisible(visible);
    this.pauseButton.setVisible(visible);
  }

  destroy(): void {
    this.distanceText.destroy();
    this.bestText.destroy();
    this.coinPill.destroy();
    this.pauseButton.destroy();
  }
}
