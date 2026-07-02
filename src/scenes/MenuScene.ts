import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, PALETTE, STORAGE_KEYS } from "../config/GameConfig";
import { CosmeticManager } from "../systems/CosmeticManager";
import { audioManager } from "../systems/AudioManager";
import { playerTextureKey } from "../config/cosmetics";
import { storage } from "../utils/storage";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  create(): void {
    const cx = DESIGN_WIDTH / 2;

    this.drawBackground();

    this.add
      .text(cx, 220, "SMASH THE", {
        fontFamily: "Arial, sans-serif",
        fontSize: "48px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setShadow(0, 4, "rgba(0,0,0,0.3)", 6);

    this.add
      .text(cx, 278, "CYCLIST", {
        fontFamily: "Arial, sans-serif",
        fontSize: "64px",
        fontStyle: "900",
        color: "#ffd23f",
      })
      .setOrigin(0.5)
      .setShadow(0, 5, "rgba(0,0,0,0.3)", 6);

    this.add
      .text(cx, 340, "Dodge everything. Survive the Tour.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#eef1f8",
      })
      .setOrigin(0.5);

    const cosmetics = new CosmeticManager();
    const skin = cosmetics.getEquipped();
    const preview = this.add.image(cx, 660, playerTextureKey(skin.id)).setScale(1.6);
    this.tweens.add({
      targets: preview,
      y: 640,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const best = storage.getNumber(STORAGE_KEYS.bestScore, 0);
    const coins = storage.getNumber(STORAGE_KEYS.coins, 0);

    this.add
      .text(cx, 820, `BEST: ${best}m`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add.image(cx - 46, 862, "coin").setScale(0.55);
    this.add
      .text(cx - 20, 862, String(coins), {
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffd23f",
      })
      .setOrigin(0, 0.5);

    this.makeButton(cx, 970, 380, 96, PALETTE.uiAccent, "PLAY", "#1a1f2e", 34, () => {
      audioManager.unlock();
      audioManager.playButtonTap();
      this.scene.start("Game");
    });

    this.makeButton(cx, 1080, 300, 68, 0x2b3040, "SHOP", "#ffffff", 22, () => {
      audioManager.unlock();
      audioManager.playButtonTap();
      this.scene.start("Shop");
    });
  }

  private drawBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(PALETTE.skyTop, PALETTE.skyTop, PALETTE.skyBottom, PALETTE.skyBottom, 1);
    g.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    const road = this.add.tileSprite(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 260, DESIGN_WIDTH, 520, "road-tile");
    road.setOrigin(0.5, 0.5);
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    label: string,
    textColor: string,
    fontSize: number,
    onTap: () => void,
  ): Phaser.GameObjects.Container {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: `${fontSize}px`,
        fontStyle: "900",
        color: textColor,
      })
      .setOrigin(0.5);
    const container = this.add.container(x, y, [bg, text]).setSize(w, h);
    container.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      this.tweens.add({
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
}
