import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, PALETTE } from "../config/GameConfig";
import { Player } from "../entities/Player";
import { InputController } from "../systems/InputController";
import { DifficultyManager } from "../systems/DifficultyManager";
import { ScoreManager } from "../systems/ScoreManager";
import { CoinManager } from "../systems/CoinManager";
import { CosmeticManager } from "../systems/CosmeticManager";
import { ObstacleSpawner } from "../systems/ObstacleSpawner";
import { CoinSpawner } from "../systems/CoinSpawner";
import { EnvironmentManager } from "../systems/EnvironmentManager";
import { audioManager } from "../systems/AudioManager";
import { HUD } from "../ui/HUD";
import { GameOverPanel } from "../ui/GameOverPanel";
import { buildShareCard, shareOrDownload } from "../systems/ShareCard";
import type { RunResult } from "../types/index";

type GameState = "countdown" | "playing" | "paused" | "crashing" | "gameover";

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputController!: InputController;
  private difficulty!: DifficultyManager;
  private score!: ScoreManager;
  private coinManager!: CoinManager;
  private cosmetics!: CosmeticManager;
  private obstacles!: ObstacleSpawner;
  private coinSpawner!: CoinSpawner;
  private hud!: HUD;
  private gameOverPanel!: GameOverPanel;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private pauseButtons: Phaser.GameObjects.Container[] = [];
  private environment!: EnvironmentManager;
  private state: GameState = "countdown";
  private lastResult: RunResult | null = null;

  constructor() {
    super("Game");
  }

  create(): void {
    this.state = "countdown";
    this.lastResult = null;

    this.environment = new EnvironmentManager(this);

    this.difficulty = new DifficultyManager();
    this.score = new ScoreManager();
    this.coinManager = new CoinManager();
    this.cosmetics = new CosmeticManager();

    const skin = this.cosmetics.getEquipped();
    this.player = new Player(this, skin);
    this.player.setDepth(500);

    this.obstacles = new ObstacleSpawner(this, this.difficulty);
    this.coinSpawner = new CoinSpawner(this);
    this.obstacles.on(ObstacleSpawner.PLAYER_HIT, this.onPlayerHit, this);
    this.coinSpawner.on(CoinSpawner.COIN_COLLECTED, this.onCoinCollected, this);

    this.hud = new HUD(this, this.score, this.coinManager, this.score.getBest());
    this.hud.onPause = () => this.togglePause();

    this.gameOverPanel = new GameOverPanel(this, {
      onPlayAgain: () => this.restart(),
      onShare: () => this.shareScore(),
      onHome: () => this.scene.start("Menu"),
    });

    this.pauseOverlay = this.buildPauseOverlay();

    this.inputController = new InputController(this);
    this.inputController.on(InputController.LANE_LEFT, () => this.player.changeLane(-1));
    this.inputController.on(InputController.LANE_RIGHT, () => this.player.changeLane(1));
    this.inputController.on(InputController.JUMP, () => this.onJumpPressed());
    this.inputController.on(InputController.PAUSE_PRESSED, () => this.togglePause());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputController.destroy());

    this.startCountdown();
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 1 / 30);
    this.player.update(dt);

    if (this.state !== "playing") return;

    this.difficulty.update(dt);
    const scrollSpeed = this.difficulty.getScrollSpeed();
    this.environment.scrollFallback(scrollSpeed, dt);
    this.environment.update(this.score.getMeters());

    this.obstacles.update(dt, scrollSpeed, this.player.getLane(), this.player.isCrashed(), this.player.isJumping());
    this.coinSpawner.update(dt, scrollSpeed, this.player.getLane(), this.player.isCrashed());
    this.score.addDistance(scrollSpeed * dt);
  }

  private startCountdown(): void {
    this.state = "countdown";
    this.inputController?.setEnabled(false);
    this.player.reset();
    this.difficulty.reset();
    this.score.reset();
    this.coinManager.reset();
    this.obstacles.reset();
    this.coinSpawner.reset();
    this.environment.reset();

    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2;
    const steps = ["3", "2", "1", "GO!"];
    let i = 0;

    const showNext = () => {
      if (i >= steps.length) {
        this.state = "playing";
        this.inputController.setEnabled(true);
        return;
      }
      const label = steps[i];
      i++;

      audioManager.unlock();
      if (label === "GO!") audioManager.playGo();
      else audioManager.playCountdownBeep();

      const text = this.add
        .text(cx, cy, label, {
          fontFamily: "Arial, sans-serif",
          fontSize: label === "GO!" ? "96px" : "120px",
          fontStyle: "900",
          color: label === "GO!" ? "#ffd23f" : "#ffffff",
        })
        .setOrigin(0.5)
        .setDepth(3000)
        .setScale(0.4)
        .setAlpha(0);

      this.tweens.add({
        targets: text,
        scale: 1,
        alpha: 1,
        duration: 180,
        ease: "Back.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            scale: 1.3,
            delay: 380,
            duration: 220,
            ease: "Quad.easeIn",
            onComplete: () => {
              text.destroy();
              showNext();
            },
          });
        },
      });
    };

    showNext();
  }

  private onPlayerHit(_kind: string): void {
    if (this.state !== "playing") return;
    this.state = "crashing";
    this.inputController.setEnabled(false);

    audioManager.playCrash();
    this.cameras.main.shake(220, 0.014);
    this.burstParticles(this.player.x, this.player.y - 60, 0xcccccc, 14);

    this.player.playCrash(() => {
      this.state = "gameover";
      this.showGameOver();
    });
  }

  private showGameOver(): void {
    const isNewBest = this.score.finalize();
    const distanceMeters = this.score.getMeters();
    const coinsCollected = this.coinManager.getRunCoins();
    this.coinManager.deposit();

    this.lastResult = { distanceMeters, coinsCollected, isNewBest };
    this.gameOverPanel.show(this.lastResult, this.score.getBest());
  }

  private onCoinCollected(x: number, y: number): void {
    this.coinManager.collect(1);
    audioManager.playCoin();
    this.burstParticles(x, y, 0xffd23f, 8);
  }

  private burstParticles(x: number, y: number, tint: number, count: number): void {
    const emitter = this.add.particles(x, y, "particle-spark", {
      speed: { min: 80, max: 220 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0 },
      lifespan: 420,
      tint,
      emitting: false,
    });
    emitter.setDepth(1500);
    emitter.explode(count);
    this.time.delayedCall(500, () => emitter.destroy());
  }

  private restart(): void {
    this.gameOverPanel.hide();
    this.startCountdown();
  }

  private onJumpPressed(): void {
    if (this.state !== "playing" || this.player.isJumping()) return;
    this.player.jump();
    audioManager.playWhoosh();
  }

  private togglePause(): void {
    if (this.state === "playing") {
      this.state = "paused";
      this.inputController.setEnabled(false);
      this.pauseOverlay.setVisible(true);
      for (const btn of this.pauseButtons) btn.setInteractive({ useHandCursor: true });
    } else if (this.state === "paused") {
      this.state = "playing";
      this.inputController.setEnabled(true);
      this.pauseOverlay.setVisible(false);
      for (const btn of this.pauseButtons) btn.disableInteractive();
    }
  }

  private buildPauseOverlay(): Phaser.GameObjects.Container {
    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2;
    const backdrop = this.add.rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, 0x0a0d16, 0.7);
    const title = this.add
      .text(0, -80, "PAUSED", {
        fontFamily: "Arial, sans-serif",
        fontSize: "48px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const resumeBtn = this.makeOverlayButton(0, 20, "RESUME", PALETTE.uiAccent, "#1a1f2e", () => this.togglePause());
    const homeBtn = this.makeOverlayButton(0, 120, "HOME", 0x2b3040, "#ffffff", () => this.scene.start("Menu"));
    resumeBtn.disableInteractive();
    homeBtn.disableInteractive();
    this.pauseButtons = [resumeBtn, homeBtn];

    const container = this.add
      .container(cx, cy, [backdrop, title, resumeBtn, homeBtn])
      .setDepth(2500)
      .setVisible(false);
    return container;
  }

  private makeOverlayButton(
    x: number,
    y: number,
    label: string,
    color: number,
    textColor: string,
    onTap: () => void,
  ): Phaser.GameObjects.Container {
    const w = 320;
    const h = 76;
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
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

  private shareScore(): void {
    if (!this.lastResult) return;
    const skin = this.cosmetics.getEquipped();
    const dataUrl = buildShareCard(this.lastResult, skin);
    shareOrDownload(dataUrl, this.lastResult);
  }
}
