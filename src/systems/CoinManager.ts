import Phaser from "phaser";
import { STORAGE_KEYS } from "../config/GameConfig";
import { storage } from "../utils/storage";

export class CoinManager extends Phaser.Events.EventEmitter {
  static readonly RUN_COINS_CHANGED = "run-coins-changed";

  private runCoins = 0;
  private wallet: number;

  constructor() {
    super();
    this.wallet = storage.getNumber(STORAGE_KEYS.coins, 0);
  }

  reset(): void {
    this.runCoins = 0;
    this.emit(CoinManager.RUN_COINS_CHANGED, 0);
  }

  collect(amount = 1): void {
    this.runCoins += amount;
    this.emit(CoinManager.RUN_COINS_CHANGED, this.runCoins);
  }

  getRunCoins(): number {
    return this.runCoins;
  }

  getWallet(): number {
    return this.wallet;
  }

  /** Call once on game over — banks the run's coins into the persistent wallet. */
  deposit(): number {
    this.wallet += this.runCoins;
    storage.setNumber(STORAGE_KEYS.coins, this.wallet);
    return this.wallet;
  }

  spend(amount: number): boolean {
    if (amount > this.wallet) return false;
    this.wallet -= amount;
    storage.setNumber(STORAGE_KEYS.coins, this.wallet);
    return true;
  }
}
