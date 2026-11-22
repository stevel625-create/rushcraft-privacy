import type { Billing, StoreItem } from "./billing.ts";
import {
  LAMP_COLOURS,
  PRODUCT_IDS,
  STARTER,
  productInfo,
  type Consumable,
  type Entitlement,
  type LampColour,
  type ProductId,
} from "./products.ts";

/**
 * The game's shop: what the player owns, what's on sale, and how purchases
 * turn into items. Consumables live on the device; non-consumables come from
 * RevenueCat entitlements and are cached so the game works offline.
 *
 * Bridges to the engine through `perks` (see GameEngine's Perks).
 */

export type ShopState = {
  owned: Record<Entitlement, boolean>;
  items: Record<Consumable, number>;
  lamp: string;
  /** Spend Second Winds automatically when caught. */
  autoSecondWind: boolean;
};

export type BuyResult = "ok" | "cancelled" | "failed" | "unavailable";

type Saved = ShopState & { seen: string[] };

export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const KEY = "car07.shop";
const SEEN_CAP = 200;

/** localStorage when it works; memory otherwise (private mode, tests). */
export function safeStorage(): KeyValue {
  try {
    const ls = globalThis.localStorage;
    ls.setItem("car07.probe", "1");
    ls.removeItem("car07.probe");
    return ls;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) };
  }
}

export class GameShop {
  private data: Saved;
  private readonly billing: Billing;
  private readonly storage: KeyValue;
  private readonly listeners = new Set<() => void>();
  private readonly paywallListeners = new Set<() => void>();
  private readonly catalog = new Map<string, StoreItem>();
  private busy = false;
  ready = false;

  constructor(billing: Billing, storage: KeyValue = safeStorage()) {
    this.billing = billing;
    this.storage = storage;
    this.data = this.load();
  }

  // ------------------------------------------------------------- lifecycle

  /** Connects to the store, fetches prices and refreshes entitlements. Safe to call once at startup. */
  async init(): Promise<void> {
    try {
      await this.billing.init();
      for (const item of await this.billing.products(PRODUCT_IDS)) this.catalog.set(item.id, item);
      this.applyEntitlements(await this.billing.entitlements());
    } catch {
      // Offline or store unavailable: cached ownership still applies.
    }
    this.ready = true;
    this.emit();
  }

  // ------------------------------------------------------------- reads

  get state(): Readonly<ShopState> {
    return this.data;
  }

  get fullGame(): boolean {
    return this.data.owned.full_game;
  }

  /** Store listing for a product (localized price), if the store returned it. */
  listing(id: ProductId): StoreItem | undefined {
    return this.catalog.get(id);
  }

  lampColours(): (LampColour & { locked: boolean })[] {
    return LAMP_COLOURS.map((c) => ({ ...c, locked: c.premium && !this.data.owned.lamp_colors }));
  }

  currentLamp(): LampColour {
    const c = LAMP_COLOURS.find((l) => l.id === this.data.lamp);
    return c && (!c.premium || this.data.owned.lamp_colors) ? c : LAMP_COLOURS[0];
  }

  // ------------------------------------------------------------- actions

  async buy(id: ProductId): Promise<BuyResult> {
    const info = productInfo(id);
    if (!info || this.busy) return "unavailable";
    if (info.entitlement && this.data.owned[info.entitlement]) return "ok";
    this.busy = true;
    try {
      const outcome = await this.billing.purchase(id);
      if (outcome.status !== "ok") return outcome.status;
      // Never credit the same transaction twice (retries, listener replays).
      if (!this.data.seen.includes(outcome.transactionId)) {
        this.data.seen = [...this.data.seen, outcome.transactionId].slice(-SEEN_CAP);
        if (info.grant) this.data.items[info.grant.item] += info.grant.amount;
      }
      this.applyEntitlements(outcome.entitlements);
      if (info.entitlement) this.data.owned[info.entitlement] = true;
      this.save();
      return "ok";
    } catch {
      return "failed";
    } finally {
      this.busy = false;
    }
  }

  /** Restore Purchases button (required on iOS). Consumables can't be restored by design. */
  async restore(): Promise<boolean> {
    try {
      this.applyEntitlements(await this.billing.restore(), true);
      return true;
    } catch {
      return false;
    }
  }

  /** Spends one of a consumable. Returns false if there are none. */
  spend(item: Consumable): boolean {
    if (this.data.items[item] <= 0) return false;
    this.data.items[item]--;
    this.save();
    return true;
  }

  /** Gives one back (e.g. a hint asked for where none was available). */
  refund(item: Consumable): void {
    this.data.items[item]++;
    this.save();
  }

  setLamp(id: string): boolean {
    const c = LAMP_COLOURS.find((l) => l.id === id);
    if (!c || (c.premium && !this.data.owned.lamp_colors)) return false;
    this.data.lamp = id;
    this.save();
    return true;
  }

  setAutoSecondWind(on: boolean): void {
    this.data.autoSecondWind = on;
    this.save();
  }

  // ------------------------------------------------------------- engine bridge

  /** Hand this to the engine (GameEngine's `perks`). */
  readonly perks = {
    fullGame: () => this.fullGame,
    takeSecondWind: () => this.data.autoSecondWind && this.spend("secondWinds"),
    onPaywall: () => this.paywallListeners.forEach((fn) => fn()),
  };

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Fires when the player tries to continue past Stage 2 without the full game. */
  onPaywall(fn: () => void): () => void {
    this.paywallListeners.add(fn);
    return () => this.paywallListeners.delete(fn);
  }

  // ------------------------------------------------------------- internals

  /**
   * Entitlements only ever add ownership, except on an explicit restore,
   * which mirrors the store exactly (so refunds take effect there).
   */
  private applyEntitlements(active: string[], authoritative = false): void {
    for (const ent of ["full_game", "lamp_colors"] as const) {
      const has = active.includes(ent);
      if (has) this.data.owned[ent] = true;
      else if (authoritative) this.data.owned[ent] = false;
    }
    this.save();
  }

  private load(): Saved {
    const fresh: Saved = {
      owned: { full_game: false, lamp_colors: false },
      items: { ...STARTER },
      lamp: "torch",
      autoSecondWind: true,
      seen: [],
    };
    try {
      const raw = this.storage.getItem(KEY);
      if (!raw) return fresh;
      const s = JSON.parse(raw) as Partial<Saved>;
      return {
        owned: { ...fresh.owned, ...s.owned },
        items: { ...fresh.items, ...s.items },
        lamp: typeof s.lamp === "string" ? s.lamp : fresh.lamp,
        autoSecondWind: s.autoSecondWind !== false,
        seen: Array.isArray(s.seen) ? s.seen.slice(-SEEN_CAP) : [],
      };
    } catch {
      return fresh;
    }
  }

  private save(): void {
    try {
      this.storage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage blocked: state still works for this session */
    }
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn());
  }
}
