import Phaser from "phaser";
import "./style.css";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "./config/GameConfig";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { ShopScene } from "./scenes/ShopScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#0f1320",
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, ShopScene],
};

const game = new Phaser.Game(config);

if (import.meta.env.DEV) {
  (window as unknown as { __GAME__: Phaser.Game }).__GAME__ = game;
}
