import Phaser from "phaser";
import { DESIGN_WIDTH, LANE_WIDTH, PALETTE, ROAD_WIDTH } from "../config/GameConfig";
import { playerTextureKey, SKINS } from "../config/cosmetics";
import { OBSTACLE_DEFINITIONS } from "../config/obstacles";

/** Texture keys backed by real art loaded in PreloadScene — skip procedural gen for these. */
const ART_BACKED_KEYS = new Set(
  OBSTACLE_DEFINITIONS.filter((o) => o.artPath).map((o) => o.textureKey),
);

/**
 * Generates every game texture at runtime with Phaser.Graphics.
 * We have no exported art assets, so this produces a consistent, colorful,
 * flat/low-poly style that reads clearly at a glance — critical for a dodge
 * game. Swap any generateX() body for a real spritesheet.load() later
 * without touching gameplay code, since everything downstream just
 * references texture keys.
 */
export class TextureFactory {
  private readonly g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics();
  }

  generateAll(): void {
    this.generateRoadTile();
    this.generateShadow("shadow-sm", 48, 20);
    this.generateShadow("shadow-md", 72, 28);
    this.generateShadow("shadow-lg", 100, 36);
    this.generateCoin();
    this.generateParticle();
    for (const skin of SKINS) {
      // Real art (loaded in PreloadScene.preload) takes precedence — skip
      // the procedural version so it isn't overwritten.
      if (skin.artPath) continue;
      this.generatePlayer(playerTextureKey(skin.id), skin.jerseyColor, {
        frameColor: skin.frameColor,
        helmetColor: skin.helmetColor,
        pattern: skin.pattern,
        patternColor: skin.patternColor,
      });
    }
    if (!ART_BACKED_KEYS.has("banana")) this.generateBanana();
    if (!ART_BACKED_KEYS.has("pigeon")) this.generatePigeon();
    if (!ART_BACKED_KEYS.has("selfieGuy")) this.generateSelfieGuy();
    if (!ART_BACKED_KEYS.has("dog")) this.generateDog();
    if (!ART_BACKED_KEYS.has("car")) this.generateCar();
    if (!ART_BACKED_KEYS.has("bottle")) this.generateBottle();
    if (!ART_BACKED_KEYS.has("barrier")) this.generateBarrier();
    this.generateProtester();
    if (!ART_BACKED_KEYS.has("backpack")) this.generateBackpack();
    this.generateCloud();
    this.g.destroy();
  }

  private clear(): void {
    this.g.clear();
  }

  private save(key: string, w: number, h: number): void {
    this.g.generateTexture(key, w, h);
  }

  // ---- Environment -------------------------------------------------

  private generateRoadTile(): void {
    const w = DESIGN_WIDTH; // must match the design canvas so tiling isn't offset
    const h = 240;
    const roadLeft = (w - ROAD_WIDTH) / 2;
    this.clear();

    // grass
    this.g.fillStyle(PALETTE.grass, 1);
    this.g.fillRect(0, 0, w, h);

    // road surface
    this.g.fillStyle(PALETTE.roadDark, 1);
    this.g.fillRect(roadLeft, 0, ROAD_WIDTH, h);

    // road edge lines
    this.g.fillStyle(PALETTE.white, 0.85);
    this.g.fillRect(roadLeft, 0, 6, h);
    this.g.fillRect(roadLeft + ROAD_WIDTH - 6, 0, 6, h);

    // dashed lane dividers (2 dividers for 3 lanes)
    const dash = 30;
    const gap = 30;
    for (let lane = 1; lane < 3; lane++) {
      const x = roadLeft + LANE_WIDTH * lane;
      for (let y = 0; y < h; y += dash + gap) {
        this.g.fillStyle(PALETTE.laneLine, 0.9);
        this.g.fillRect(x - 4, y, 8, dash);
      }
    }

    // roadside scenery — baked into the tile so the whole margin scrolls
    // with the road, not just a static painting behind moving obstacles.
    const leftCx = roadLeft / 2;
    const rightCx = roadLeft + ROAD_WIDTH + roadLeft / 2;
    this.drawTree(leftCx, 50);
    this.drawRock(leftCx, 128);
    this.drawCrowdCluster(leftCx, 196);
    this.drawCrowdCluster(rightCx, 46);
    this.drawTree(rightCx, 124);
    this.drawRock(rightCx, 200);

    this.save("road-tile", w, h);
  }

  private drawTree(cx: number, cy: number): void {
    this.g.fillStyle(0x5a3a22, 1);
    this.g.fillRect(cx - 3, cy + 10, 6, 14);
    this.g.fillStyle(PALETTE.grassShade, 1);
    this.g.fillTriangle(cx - 18, cy + 14, cx + 18, cy + 14, cx, cy - 6);
    this.g.fillTriangle(cx - 15, cy + 4, cx + 15, cy + 4, cx, cy - 16);
    this.g.fillTriangle(cx - 12, cy - 6, cx + 12, cy - 6, cx, cy - 24);
  }

  private drawRock(cx: number, cy: number): void {
    this.g.fillStyle(0x8b8d92, 1);
    this.g.fillEllipse(cx, cy, 30, 18);
    this.g.fillStyle(0x9fa1a6, 1);
    this.g.fillEllipse(cx - 5, cy - 4, 14, 9);
  }

  private drawCrowdCluster(cx: number, cy: number): void {
    const skinTones = [0xf2b98a, 0xc98a5c, 0x8a5a3a];
    const shirtColors = [0xe94b4b, 0x3d8b52, 0xffd23f, 0x2f6fed];
    for (let i = 0; i < 3; i++) {
      const x = cx - 14 + i * 14;
      this.g.fillStyle(shirtColors[i % shirtColors.length], 1);
      this.g.fillRoundedRect(x - 6, cy, 12, 14, 4);
      this.g.fillStyle(skinTones[i % skinTones.length], 1);
      this.g.fillCircle(x, cy - 5, 6);
    }
  }

  private generateCloud(): void {
    this.clear();
    this.g.fillStyle(PALETTE.white, 0.9);
    this.g.fillEllipse(40, 30, 70, 34);
    this.g.fillEllipse(75, 20, 55, 30);
    this.g.fillEllipse(15, 22, 45, 26);
    this.save("cloud", 110, 50);
  }

  private generateShadow(key: string, w: number, h: number): void {
    this.clear();
    const rings = 4;
    for (let i = rings; i > 0; i--) {
      const t = i / rings;
      this.g.fillStyle(0x000000, 0.28 * (1 - t * 0.6));
      this.g.fillEllipse(w / 2, h / 2, w * t, h * t);
    }
    this.save(key, w, h);
  }

  private generateParticle(): void {
    this.clear();
    this.g.fillStyle(PALETTE.white, 1);
    this.g.fillCircle(8, 8, 8);
    this.save("particle-spark", 16, 16);
  }

  private generateCoin(): void {
    this.clear();
    const r = 26;
    this.g.fillStyle(0xcf9a1f, 1);
    this.g.fillCircle(r, r + 2, r);
    this.g.fillStyle(PALETTE.coinGold, 1);
    this.g.fillCircle(r, r, r);
    this.g.fillStyle(0xfff2b8, 0.9);
    this.g.fillCircle(r - 7, r - 8, r * 0.4);
    this.g.lineStyle(3, 0xcf9a1f, 0.7);
    this.g.strokeCircle(r, r, r - 5);
    this.save("coin", r * 2, r * 2 + 4);
  }

  // ---- Player --------------------------------------------------------

  private generatePlayer(
    key: string,
    jerseyColor: number,
    options?: {
      frameColor?: number;
      helmetColor?: number;
      pattern?: "solid" | "dots" | "stripe";
      patternColor?: number;
    },
  ): void {
    this.clear();
    const w = 140;
    const h = 190;
    const cx = w / 2;
    const frameColor = options?.frameColor ?? PALETTE.bikeFrame;
    const helmetColor = options?.helmetColor ?? 0x232323;
    const pattern = options?.pattern ?? "solid";
    const patternColor = options?.patternColor ?? 0x000000;

    // wheels (rear view, mostly hidden behind body but peeking at sides)
    this.g.fillStyle(0x232323, 1);
    this.g.fillCircle(cx - 46, h - 30, 22);
    this.g.fillCircle(cx + 46, h - 30, 22);
    this.g.fillStyle(0x555555, 1);
    this.g.fillCircle(cx - 46, h - 30, 9);
    this.g.fillCircle(cx + 46, h - 30, 9);

    // frame hint between wheels
    this.g.lineStyle(6, frameColor, 1);
    this.g.lineBetween(cx - 40, h - 30, cx, h - 90);
    this.g.lineBetween(cx + 40, h - 30, cx, h - 90);

    // legs
    this.g.fillStyle(0x1c1c1c, 1);
    this.g.fillRoundedRect(cx - 34, h - 92, 20, 55, 8);
    this.g.fillRoundedRect(cx + 14, h - 92, 20, 55, 8);

    // torso / jersey
    const jerseyX = cx - 42;
    const jerseyY = h - 150;
    const jerseyW = 84;
    const jerseyH = 78;
    this.g.fillStyle(jerseyColor, 1);
    this.g.fillRoundedRect(jerseyX, jerseyY, jerseyW, jerseyH, 18);

    if (pattern === "dots") {
      this.g.fillStyle(patternColor, 0.9);
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          this.g.fillCircle(jerseyX + 18 + col * 26, jerseyY + 22 + row * 24, 6);
        }
      }
    } else if (pattern === "stripe") {
      this.g.fillStyle(patternColor, 0.95);
      this.g.fillRect(jerseyX, jerseyY + jerseyH * 0.38, jerseyW, jerseyH * 0.22);
    } else {
      // subtle shade stripe for solid jerseys — keeps them from looking flat
      this.g.fillStyle(0x000000, 0.08);
      this.g.fillRoundedRect(jerseyX, jerseyY, jerseyW, 20, { tl: 18, tr: 18, bl: 0, br: 0 });
    }

    // arms
    this.g.fillStyle(PALETTE.jerseySkin, 1);
    this.g.fillRoundedRect(cx - 60, h - 128, 18, 50, 8);
    this.g.fillRoundedRect(cx + 42, h - 128, 18, 50, 8);

    // shoulders/neck
    this.g.fillStyle(PALETTE.jerseySkin, 1);
    this.g.fillRoundedRect(cx - 14, h - 158, 28, 26, 10);

    // helmet
    this.g.fillStyle(helmetColor, 1);
    this.g.fillCircle(cx, h - 168, 30);
    this.g.fillStyle(0x3a3a3a, 1);
    this.g.fillRect(cx - 30, h - 168, 60, 14);
    this.g.fillStyle(PALETTE.uiAccent, 1);
    this.g.fillRect(cx - 4, h - 196, 8, 14);

    this.save(key, w, h);
  }

  // ---- Obstacles -------------------------------------------------------

  private generateBanana(): void {
    this.clear();
    this.g.fillStyle(0xf6d63a, 1);
    this.g.beginPath();
    this.g.arc(50, 30, 46, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
    this.g.arc(50, 46, 46, Phaser.Math.DegToRad(160), Phaser.Math.DegToRad(20), true);
    this.g.closePath();
    this.g.fillPath();
    this.g.fillStyle(0x8a6d1f, 1);
    this.g.fillCircle(14, 28, 5);
    this.save("banana", 100, 70);
  }

  private generatePigeon(): void {
    this.clear();
    const w = 90;
    const h = 70;
    this.g.fillStyle(0x9aa0ab, 1);
    this.g.fillEllipse(w / 2, h / 2 + 6, 56, 40);
    this.g.fillStyle(0x7d8590, 1);
    this.g.fillTriangle(w / 2 - 10, h / 2, w / 2 - 46, h / 2 - 18, w / 2 - 40, h / 2 + 12);
    this.g.fillTriangle(w / 2 + 10, h / 2, w / 2 + 46, h / 2 - 18, w / 2 + 40, h / 2 + 12);
    this.g.fillStyle(0xc9cfd8, 1);
    this.g.fillCircle(w / 2, h / 2 - 18, 16);
    this.g.fillStyle(0xffa23c, 1);
    this.g.fillTriangle(w / 2 + 12, h / 2 - 20, w / 2 + 26, h / 2 - 16, w / 2 + 12, h / 2 - 12);
    this.g.fillStyle(0x1a1a1a, 1);
    this.g.fillCircle(w / 2 + 4, h / 2 - 22, 2.5);
    this.save("pigeon", w, h);
  }

  private generateSelfieGuy(): void {
    this.clear();
    const w = 100;
    const h = 170;
    const cx = w / 2;
    this.g.fillStyle(0xffffff, 1);
    this.g.fillRoundedRect(cx - 32, h - 110, 64, 78, 14);
    this.g.fillStyle(0xff5a63, 1);
    for (let i = 0; i < 4; i++) {
      this.g.fillCircle(cx - 20 + i * 14, h - 96, 5);
      this.g.fillCircle(cx - 13 + i * 14, h - 82, 5);
    }
    this.g.fillStyle(0x2b3040, 1);
    this.g.fillRoundedRect(cx - 22, h - 34, 20, 40, 8);
    this.g.fillRoundedRect(cx + 2, h - 34, 20, 40, 8);
    this.g.fillStyle(PALETTE.jerseySkin, 1);
    this.g.fillCircle(cx, h - 132, 26);
    this.g.fillStyle(0x2c2c2c, 1);
    this.g.fillRoundedRect(cx - 26, h - 152, 52, 16, 8);
    // extended arm + phone
    this.g.fillStyle(PALETTE.jerseySkin, 1);
    this.g.fillRoundedRect(cx + 20, h - 128, 44, 14, 6);
    this.g.fillStyle(0x1a1a1a, 1);
    this.g.fillRoundedRect(cx + 58, h - 138, 16, 28, 4);
    this.save("selfieGuy", w, h);
  }

  private generateDog(): void {
    this.clear();
    const w = 130;
    const h = 90;
    this.g.fillStyle(0xa8672f, 1);
    this.g.fillRoundedRect(30, 30, 70, 34, 16);
    // legs
    this.g.fillRoundedRect(34, 58, 12, 26, 5);
    this.g.fillRoundedRect(56, 58, 12, 26, 5);
    this.g.fillRoundedRect(78, 58, 12, 26, 5);
    this.g.fillRoundedRect(96, 58, 12, 26, 5);
    // head
    this.g.fillCircle(24, 34, 22);
    this.g.fillStyle(0x7a4a20, 1);
    this.g.fillTriangle(8, 20, 4, 2, 18, 18);
    this.g.fillTriangle(22, 14, 20, -2, 34, 14);
    // snout
    this.g.fillStyle(0xc78a4b, 1);
    this.g.fillEllipse(6, 40, 16, 12);
    this.g.fillStyle(0x1a1a1a, 1);
    this.g.fillCircle(2, 40, 4);
    // tail
    this.g.fillStyle(0xa8672f, 1);
    this.g.fillTriangle(100, 34, 122, 18, 116, 42);
    this.save("dog", w, h);
  }

  private generateCar(): void {
    this.clear();
    const w = 150;
    const h = 200;
    this.g.fillStyle(0x2f6fed, 1);
    this.g.fillRoundedRect(15, 10, w - 30, h - 40, 26);
    this.g.fillStyle(0x9fd0ff, 0.9);
    this.g.fillRoundedRect(28, 30, w - 56, 60, 14);
    this.g.fillStyle(0x1c3f91, 1);
    this.g.fillRoundedRect(15, h - 70, w - 30, 40, 10);
    this.g.fillStyle(0xffe27a, 1);
    this.g.fillRoundedRect(24, h - 46, 26, 12, 4);
    this.g.fillRoundedRect(w - 50, h - 46, 26, 12, 4);
    this.g.fillStyle(0x1a1a1a, 1);
    this.g.fillRoundedRect(6, 36, 14, 40, 6);
    this.g.fillRoundedRect(w - 20, 36, 14, 40, 6);
    this.g.fillRoundedRect(6, h - 92, 14, 40, 6);
    this.g.fillRoundedRect(w - 20, h - 92, 14, 40, 6);
    this.save("car", w, h);
  }

  private generateBottle(): void {
    this.clear();
    const w = 46;
    const h = 100;
    this.g.fillStyle(0x2fa9e0, 0.85);
    this.g.fillRoundedRect(6, 26, w - 12, h - 32, 10);
    this.g.fillStyle(0x1f8cc0, 1);
    this.g.fillRoundedRect(14, 6, w - 28, 26, 6);
    this.g.fillStyle(0xffffff, 0.85);
    this.g.fillRoundedRect(10, 46, w - 20, 22, 4);
    this.save("bottle", w, h);
  }

  private generateBarrier(): void {
    this.clear();
    const w = 170;
    const h = 90;
    this.g.fillStyle(0xe94b4b, 1);
    this.g.fillRoundedRect(0, 10, w, 34, 8);
    this.g.fillStyle(0xffffff, 1);
    for (let x = 6; x < w; x += 36) {
      this.g.fillRect(x, 10, 18, 34);
    }
    this.g.fillStyle(0xffffff, 1);
    this.g.fillRoundedRect(0, 52, w, 26, 8);
    this.g.fillStyle(0xe94b4b, 1);
    for (let x = 6; x < w; x += 36) {
      this.g.fillRect(x, 52, 18, 26);
    }
    this.g.fillStyle(0x8a8a8a, 1);
    this.g.fillRect(14, 78, 10, 12);
    this.g.fillRect(w - 24, 78, 10, 12);
    this.save("barrier", w, h);
  }

  private generateProtester(): void {
    this.clear();
    const w = 100;
    const h = 180;
    const cx = w / 2;
    this.g.fillStyle(0x3d8b52, 1);
    this.g.fillRoundedRect(cx - 30, h - 108, 60, 76, 14);
    this.g.fillStyle(0x2b2b2b, 1);
    this.g.fillRoundedRect(cx - 22, h - 34, 18, 38, 7);
    this.g.fillRoundedRect(cx + 4, h - 34, 18, 38, 7);
    this.g.fillStyle(PALETTE.jerseySkin, 1);
    this.g.fillCircle(cx, h - 128, 24);
    // raised arm holding sign
    this.g.fillRoundedRect(cx + 14, h - 168, 16, 56, 7);
    this.save("protester", w, h);
  }


  private generateBackpack(): void {
    this.clear();
    const w = 80;
    const h = 90;
    this.g.fillStyle(0xe0752f, 1);
    this.g.fillRoundedRect(10, 16, w - 20, h - 24, 16);
    this.g.fillStyle(0xb85a1f, 1);
    this.g.fillRoundedRect(24, 0, w - 48, 26, 10);
    this.g.fillStyle(0xffd23f, 1);
    this.g.fillRoundedRect(w / 2 - 4, 30, 8, 40, 4);
    this.save("backpack", w, h);
  }
}
