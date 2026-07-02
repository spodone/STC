import { DEFAULT_SKIN_ID, SKINS } from "../config/cosmetics";
import { STORAGE_KEYS } from "../config/GameConfig";
import { storage } from "../utils/storage";
import type { SkinDefinition } from "../config/cosmetics";

export class CosmeticManager {
  private unlockedIds: Set<string>;
  private equippedId: string;

  constructor() {
    const defaults = SKINS.filter((s) => s.unlockedByDefault).map((s) => s.id);
    this.unlockedIds = new Set(storage.getJSON<string[]>(STORAGE_KEYS.unlockedCosmetics, defaults));
    this.equippedId = storage.getJSON<string>(STORAGE_KEYS.equippedCosmetic, DEFAULT_SKIN_ID);
  }

  getAll(): readonly SkinDefinition[] {
    return SKINS;
  }

  isUnlocked(id: string): boolean {
    return this.unlockedIds.has(id);
  }

  getEquipped(): SkinDefinition {
    return SKINS.find((s) => s.id === this.equippedId) ?? SKINS[0];
  }

  unlock(id: string): void {
    this.unlockedIds.add(id);
    storage.setJSON(STORAGE_KEYS.unlockedCosmetics, [...this.unlockedIds]);
  }

  equip(id: string): boolean {
    if (!this.unlockedIds.has(id)) return false;
    this.equippedId = id;
    storage.setJSON(STORAGE_KEYS.equippedCosmetic, id);
    return true;
  }
}
