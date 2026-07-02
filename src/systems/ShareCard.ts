import type { SkinDefinition } from "../config/cosmetics";
import type { RunResult } from "../types/index";

const CARD_W = 1080;
const CARD_H = 1920;

/** Renders a shareable results image with the Canvas 2D API (kept independent of Phaser). */
export function buildShareCard(result: RunResult, skin: SkinDefinition): string {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const sky = ctx.createLinearGradient(0, 0, 0, CARD_H);
  sky.addColorStop(0, "#8ec9f0");
  sky.addColorStop(1, "#2f6fed");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // ground band
  ctx.fillStyle = "#4a4e5c";
  ctx.fillRect(0, CARD_H - 420, CARD_W, 420);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let x = 120; x < CARD_W; x += 220) {
    ctx.fillRect(x, CARD_H - 420, 16, 420);
  }

  // confetti dots for celebratory feel
  const confettiColors = ["#ffd23f", "#ff4d5e", "#3d8b52", "#ffffff"];
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = confettiColors[i % confettiColors.length];
    const cx = Math.random() * CARD_W;
    const cy = Math.random() * (CARD_H - 500);
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 54px Arial, sans-serif";
  ctx.fillText("SMASH THE CYCLIST", CARD_W / 2, 200);

  ctx.font = "900 46px Arial, sans-serif";
  ctx.fillStyle = "#1a1f2e";
  ctx.fillText("I SURVIVED", CARD_W / 2, 620);

  ctx.font = "900 190px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#1a1f2e";
  ctx.strokeText(`${result.distanceMeters}m`, CARD_W / 2, 800);
  ctx.fillText(`${result.distanceMeters}m`, CARD_W / 2, 800);

  if (result.isNewBest) {
    ctx.font = "900 40px Arial, sans-serif";
    ctx.fillStyle = "#ffd23f";
    ctx.fillText("★ NEW BEST ★", CARD_W / 2, 880);
  }

  ctx.font = "bold 40px Arial, sans-serif";
  ctx.fillStyle = "#1a1f2e";
  ctx.fillText("Can you beat me?", CARD_W / 2, 960);

  // simple rider silhouette using the equipped skin's jersey color
  const bodyX = CARD_W / 2;
  const bodyY = CARD_H - 260;
  ctx.fillStyle = "#232323";
  ctx.beginPath();
  ctx.arc(bodyX - 90, bodyY + 60, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bodyX + 90, bodyY + 60, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `#${skin.jerseyColor.toString(16).padStart(6, "0")}`;
  ctx.beginPath();
  ctx.roundRect(bodyX - 70, bodyY - 90, 140, 130, 30);
  ctx.fill();
  ctx.fillStyle = "#f2b98a";
  ctx.beginPath();
  ctx.arc(bodyX, bodyY - 130, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "bold 30px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`+${result.coinsCollected} coins collected`, CARD_W / 2, CARD_H - 60);

  return canvas.toDataURL("image/png");
}

export async function shareOrDownload(dataUrl: string, result: RunResult): Promise<void> {
  if (!dataUrl) return;
  const text = `I survived ${result.distanceMeters}m in Smash the Cyclist. Can you beat me?`;

  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "smash-the-cyclist.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, title: "Smash the Cyclist" });
      return;
    }
  } catch {
    // fall through to download
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "smash-the-cyclist.png";
  link.click();
}
