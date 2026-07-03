import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, PALETTE } from "../config/GameConfig";
import { playerTextureKey } from "../config/cosmetics";
import { CosmeticManager } from "../systems/CosmeticManager";
import { CoinManager } from "../systems/CoinManager";
import { audioManager } from "../systems/AudioManager";
import { fitPlayerSprite } from "../utils/spriteFit";
import type { SkinDefinition } from "../config/cosmetics";

const COLUMNS = 3;
const CARD_W = 200;
const CARD_H = 250;
const GRID_TOP = 300;
const GRID_GAP_X = 24;
const GRID_GAP_Y = 24;

export class ShopScene extends Phaser.Scene {
  private cosmetics!: CosmeticManager;
  private coinManager!: CoinManager;
  private coinText!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super("Shop");
  }

  create(): void {
    this.cosmetics = new CosmeticManager();
    this.coinManager = new CoinManager();
    this.cards = [];

    const g = this.add.graphics();
    g.fillGradientStyle(PALETTE.skyTop, PALETTE.skyTop, PALETTE.uiDark, PALETTE.uiDark, 1);
    g.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    this.add
      .text(40, 60, "←", {
        fontFamily: "Arial, sans-serif",
        fontSize: "40px",
        color: "#ffffff",
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.start("Menu"));

    this.add
      .text(DESIGN_WIDTH / 2, 70, "SHOP", {
        fontFamily: "Arial, sans-serif",
        fontSize: "40px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add.image(DESIGN_WIDTH - 150, 66, "coin").setScale(0.55);
    this.coinText = this.add
      .text(DESIGN_WIDTH - 118, 66, String(this.coinManager.getWallet()), {
        fontFamily: "Arial, sans-serif",
        fontSize: "26px",
        fontStyle: "bold",
        color: "#ffd23f",
      })
      .setOrigin(0, 0.5);

    this.add
      .text(DESIGN_WIDTH / 2, 150, "SKINS", {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#aab0c0",
      })
      .setOrigin(0.5);

    this.buildGrid();
  }

  private buildGrid(): void {
    const skins = this.cosmetics.getAll();
    const gridWidth = COLUMNS * CARD_W + (COLUMNS - 1) * GRID_GAP_X;
    const startX = (DESIGN_WIDTH - gridWidth) / 2 + CARD_W / 2;

    skins.forEach((skin, index) => {
      const col = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const x = startX + col * (CARD_W + GRID_GAP_X);
      const y = GRID_TOP + CARD_H / 2 + row * (CARD_H + GRID_GAP_Y);
      const card = this.buildCard(skin, x, y);
      this.cards.push(card);
    });
  }

  private buildCard(skin: SkinDefinition, x: number, y: number): Phaser.GameObjects.Container {
    const unlocked = this.cosmetics.isUnlocked(skin.id);
    const equipped = this.cosmetics.getEquipped().id === skin.id;

    const bg = this.add.graphics();
    bg.fillStyle(equipped ? 0x2f3a55 : PALETTE.uiDark, 0.95);
    bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 20);
    if (equipped) {
      bg.lineStyle(3, PALETTE.uiAccent, 1);
      bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 20);
    }

    const preview = this.add.image(0, -50, playerTextureKey(skin.id));
    fitPlayerSprite(preview, skin, 143);
    if (!unlocked) preview.setTint(0x555555);

    const name = this.add
      .text(0, 46, skin.name, {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: CARD_W - 20 },
      })
      .setOrigin(0.5);

    const children: Phaser.GameObjects.GameObject[] = [bg, preview, name];

    let actionLabel: string;
    let actionColor: number;
    if (equipped) {
      actionLabel = "EQUIPPED";
      actionColor = PALETTE.uiAccent;
    } else if (unlocked) {
      actionLabel = "EQUIP";
      actionColor = 0x3d8b52;
    } else {
      actionLabel = skin.price === 0 ? "FREE" : `${skin.price}`;
      actionColor = 0x2b3040;
    }

    const btnY = 96;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(actionColor, 1);
    btnBg.fillRoundedRect(-CARD_W / 2 + 16, btnY - 20, CARD_W - 32, 40, 20);
    const btnText = this.add
      .text(0, btnY, actionLabel, {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        fontStyle: "900",
        color: equipped ? "#1a1f2e" : "#ffffff",
      })
      .setOrigin(0.5);
    children.push(btnBg, btnText);

    const container = this.add.container(x, y, children).setSize(CARD_W, CARD_H);

    if (!equipped) {
      container.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        this.tweens.add({
          targets: container,
          scale: 0.95,
          duration: 70,
          yoyo: true,
          ease: "Quad.easeOut",
        });
        audioManager.unlock();
        this.onCardTapped(skin);
      });
    }

    return container;
  }

  private onCardTapped(skin: SkinDefinition): void {
    const unlocked = this.cosmetics.isUnlocked(skin.id);
    if (unlocked) {
      this.cosmetics.equip(skin.id);
      audioManager.playButtonTap();
      this.rebuild();
      return;
    }

    if (this.coinManager.spend(skin.price)) {
      this.cosmetics.unlock(skin.id);
      this.cosmetics.equip(skin.id);
      audioManager.playMilestone();
      this.rebuild();
    } else {
      audioManager.playButtonTap();
      this.flashInsufficientFunds();
    }
  }

  private flashInsufficientFunds(): void {
    this.tweens.add({
      targets: this.coinText,
      scale: 1.3,
      duration: 90,
      yoyo: true,
      repeat: 1,
      ease: "Quad.easeOut",
    });
  }

  private rebuild(): void {
    for (const card of this.cards) card.destroy();
    this.cards = [];
    this.coinText.setText(String(this.coinManager.getWallet()));
    this.buildGrid();
  }
}
