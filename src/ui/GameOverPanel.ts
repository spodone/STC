import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, PALETTE } from "../config/GameConfig";
import type { RunResult } from "../types/index";

const DEPTH = 2000;

export interface GameOverCallbacks {
  onPlayAgain: () => void;
  onShare: () => void;
  onHome: () => void;
}

/** Full-screen results overlay. Built once, animated in/out via show()/hide(). */
export class GameOverPanel {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly distanceText: Phaser.GameObjects.Text;
  private readonly bestText: Phaser.GameObjects.Text;
  private readonly coinsText: Phaser.GameObjects.Text;
  private readonly newBestBadge: Phaser.GameObjects.Text;
  private readonly interactiveElements: (Phaser.GameObjects.Container | Phaser.GameObjects.Text)[] = [];

  constructor(scene: Phaser.Scene, callbacks: GameOverCallbacks) {
    this.scene = scene;
    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2;

    this.backdrop = scene.add
      .rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x0a0d16, 0)
      .setDepth(DEPTH);

    const panelW = 560;
    const panelH = 640;
    const panelBg = scene.add.graphics();
    panelBg.fillStyle(PALETTE.uiDark, 0.97);
    panelBg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    panelBg.lineStyle(4, 0xffffff, 0.06);
    panelBg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);

    const title = scene.add
      .text(0, -panelH / 2 + 64, "GAME OVER", {
        fontFamily: "Arial, sans-serif",
        fontSize: "40px",
        fontStyle: "900",
        color: "#ff4d5e",
      })
      .setOrigin(0.5);

    this.newBestBadge = scene.add
      .text(0, -panelH / 2 + 108, "NEW BEST!", {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#1a1f2e",
        backgroundColor: "#ffd23f",
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5);

    this.distanceText = scene.add
      .text(0, -panelH / 2 + 200, "0m", {
        fontFamily: "Arial, sans-serif",
        fontSize: "72px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.bestText = scene.add
      .text(0, -panelH / 2 + 262, "BEST: 0m", {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#aab0c0",
      })
      .setOrigin(0.5);

    const coinIcon = scene.add.image(-46, -panelH / 2 + 322, "coin").setScale(0.6);
    this.coinsText = scene.add
      .text(-8, -panelH / 2 + 322, "+0", {
        fontFamily: "Arial, sans-serif",
        fontSize: "30px",
        fontStyle: "bold",
        color: "#ffd23f",
      })
      .setOrigin(0, 0.5);

    const playAgainBtn = this.makeButton(0, 70, panelW - 80, 84, PALETTE.uiAccent, "PLAY AGAIN", "#1a1f2e", () => {
      callbacks.onPlayAgain();
    });

    const shareBtn = this.makeButton(0, 168, panelW - 80, 70, 0x2b3040, "SHARE SCORE", "#ffffff", () => {
      callbacks.onShare();
    });

    const homeText = scene.add
      .text(0, 250, "HOME", {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#8a90a0",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => callbacks.onHome());

    this.interactiveElements.push(playAgainBtn, shareBtn, homeText);

    this.root = scene.add
      .container(cx, cy, [
        panelBg,
        title,
        this.newBestBadge,
        this.distanceText,
        this.bestText,
        coinIcon,
        this.coinsText,
        playAgainBtn,
        shareBtn,
        homeText,
      ])
      .setDepth(DEPTH + 1)
      .setScale(0.8)
      .setAlpha(0)
      .setVisible(false);

    this.backdrop.setVisible(false);
    this.setInteractable(false);
  }

  private setInteractable(enabled: boolean): void {
    for (const el of this.interactiveElements) {
      if (enabled) el.setInteractive({ useHandCursor: true });
      else el.disableInteractive();
    }
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    label: string,
    textColor: string,
    onTap: () => void,
  ): Phaser.GameObjects.Container {
    const bg = this.scene.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: "26px",
        fontStyle: "900",
        color: textColor,
      })
      .setOrigin(0.5);
    const container = this.scene.add.container(x, y, [bg, text]).setSize(w, h);
    container.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      this.scene.tweens.add({
        targets: container,
        scale: 0.93,
        duration: 70,
        yoyo: true,
        ease: "Quad.easeOut",
        onComplete: onTap,
      });
    });
    return container;
  }

  show(result: RunResult, best: number): void {
    this.distanceText.setText(`${result.distanceMeters}m`);
    this.bestText.setText(`BEST: ${best}m`);
    this.coinsText.setText(`+${result.coinsCollected}`);
    this.newBestBadge.setVisible(result.isNewBest);

    this.backdrop.setAlpha(0).setVisible(true);
    this.root.setAlpha(0).setScale(0.8).setVisible(true);
    this.setInteractable(true);

    this.scene.tweens.add({
      targets: this.backdrop,
      fillAlpha: 0.62,
      duration: 220,
      ease: "Sine.easeOut",
    });

    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      scale: 1,
      duration: 320,
      delay: 120,
      ease: "Back.easeOut",
    });
  }

  hide(): void {
    this.setInteractable(false);
    this.backdrop.setVisible(false);
    this.root.setVisible(false);
    this.backdrop.setAlpha(0);
    this.root.setAlpha(0);
  }
}
