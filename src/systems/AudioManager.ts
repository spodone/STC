import { STORAGE_KEYS } from "../config/GameConfig";
import { storage } from "../utils/storage";

type ToneShape = "sine" | "square" | "sawtooth" | "triangle";

interface ToneStep {
  freq: number;
  duration: number;
  shape?: ToneShape;
  gain?: number;
  delay?: number;
}

/**
 * Tiny synthesized SFX engine — no audio files exist for this MVP, so every
 * "sound" is a couple of oscillator blips. Swap playTone-based methods for
 * scene.sound.play('key') later; callers (playCoin(), playCrash(), ...)
 * don't need to change.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted: boolean;

  constructor() {
    this.muted = storage.getJSON(STORAGE_KEYS.muted, false);
  }

  /** Must be called from a user-gesture handler (tap/click/keydown) on iOS/Safari. */
  unlock(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    storage.setJSON(STORAGE_KEYS.muted, muted);
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playCoin(): void {
    this.playSequence([
      { freq: 880, duration: 0.06, shape: "square", gain: 0.15 },
      { freq: 1320, duration: 0.09, shape: "square", gain: 0.15, delay: 0.05 },
    ]);
  }

  playCrash(): void {
    this.playNoiseThud();
  }

  playWhoosh(): void {
    this.playSequence([{ freq: 340, duration: 0.09, shape: "sawtooth", gain: 0.06 }]);
  }

  playCountdownBeep(): void {
    this.playSequence([{ freq: 520, duration: 0.12, shape: "sine", gain: 0.16 }]);
  }

  playGo(): void {
    this.playSequence([
      { freq: 660, duration: 0.09, shape: "sine", gain: 0.18 },
      { freq: 990, duration: 0.16, shape: "sine", gain: 0.2, delay: 0.09 },
    ]);
  }

  playButtonTap(): void {
    this.playSequence([{ freq: 440, duration: 0.05, shape: "triangle", gain: 0.1 }]);
  }

  playMilestone(): void {
    this.playSequence([
      { freq: 740, duration: 0.07, shape: "sine", gain: 0.14 },
      { freq: 988, duration: 0.1, shape: "sine", gain: 0.16, delay: 0.06 },
    ]);
  }

  private playSequence(steps: ToneStep[]): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    for (const step of steps) {
      this.scheduleTone(now + (step.delay ?? 0), step);
    }
  }

  private scheduleTone(startAt: number, step: ToneStep): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = step.shape ?? "sine";
    osc.frequency.setValueAtTime(step.freq, startAt);
    gainNode.gain.setValueAtTime(step.gain ?? 0.15, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + step.duration);
    osc.connect(gainNode).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + step.duration + 0.02);
  }

  private playNoiseThud(): void {
    const ctx = this.ctx;
    if (this.muted || !ctx) return;
    const duration = 0.25;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const decay = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(filter).connect(gainNode).connect(ctx.destination);
    noise.start();
  }
}

/** One AudioContext for the whole app — scenes share this instead of each creating their own. */
export const audioManager = new AudioManager();
