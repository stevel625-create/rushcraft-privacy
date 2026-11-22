import type { ProductId } from "./products.ts";

/**
 * Store billing behind one small interface, so the shop logic doesn't care
 * whether it's talking to Apple, Google (through RevenueCat) or the mock
 * used in the browser and in tests.
 */

export type StoreItem = { id: string; title: string; price: string };

export type PurchaseOutcome =
  | { status: "ok"; transactionId: string; entitlements: string[] }
  | { status: "cancelled" }
  | { status: "failed"; message: string };

export interface Billing {
  init(): Promise<void>;
  products(ids: readonly ProductId[]): Promise<StoreItem[]>;
  purchase(id: ProductId): Promise<PurchaseOutcome>;
  /** Currently active entitlement IDs. */
  entitlements(): Promise<string[]>;
  /** Restores non-consumables (required by Apple); returns active entitlements. */
  restore(): Promise<string[]>;
}

// ---------------------------------------------------------------- RevenueCat

type RcCustomerInfo = { entitlements: { active: Record<string, unknown> } };

/**
 * iOS and Android via @revenuecat/purchases-capacitor. RevenueCat validates
 * receipts server-side, so no backend of your own is needed.
 * Use the *public* SDK keys from the RevenueCat dashboard (one per platform).
 */
export class RevenueCatBilling implements Billing {
  // Loaded lazily so the web build never touches the native plugin.
  private rc!: typeof import("@revenuecat/purchases-capacitor");
  /** Store product objects: purchaseStoreProduct needs the full object, not just its ID. */
  private readonly cache = new Map<string, unknown>();

  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async init(): Promise<void> {
    this.rc = await import("@revenuecat/purchases-capacitor");
    await this.rc.Purchases.configure({ apiKey: this.apiKey });
  }

  async products(ids: readonly ProductId[]): Promise<StoreItem[]> {
    const { Purchases, PRODUCT_CATEGORY } = this.rc;
    const { products } = await Purchases.getProducts({
      productIdentifiers: [...ids],
      type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    });
    return products.map((p) => {
      this.cache.set(p.identifier, p);
      return { id: p.identifier, title: p.title, price: p.priceString };
    });
  }

  async purchase(id: ProductId): Promise<PurchaseOutcome> {
    let product = this.cache.get(id);
    if (!product) {
      await this.products([id]);
      product = this.cache.get(id);
    }
    if (!product) return { status: "failed", message: "This item isn't available in the store right now." };
    try {
      const result = await this.rc.Purchases.purchaseStoreProduct({ product: product as never });
      const tx = (result as { transaction?: { transactionIdentifier?: string } }).transaction;
      return {
        status: "ok",
        // Fall back to a local ID so a missing identifier never blocks the grant.
        transactionId: tx?.transactionIdentifier ?? `${id}:${Date.now()}`,
        entitlements: activeOf(result.customerInfo as RcCustomerInfo),
      };
    } catch (error) {
      const e = error as { userCancelled?: boolean; code?: string | number; message?: string };
      // PURCHASE_CANCELLED_ERROR is code "1" in RevenueCat's error codes.
      if (e?.userCancelled || String(e?.code) === "1") return { status: "cancelled" };
      return { status: "failed", message: e?.message ?? "The purchase didn't go through." };
    }
  }

  async entitlements(): Promise<string[]> {
    const { customerInfo } = await this.rc.Purchases.getCustomerInfo();
    return activeOf(customerInfo as RcCustomerInfo);
  }

  async restore(): Promise<string[]> {
    const { customerInfo } = await this.rc.Purchases.restorePurchases();
    return activeOf(customerInfo as RcCustomerInfo);
  }
}

function activeOf(info: RcCustomerInfo | undefined): string[] {
  return Object.keys(info?.entitlements?.active ?? {});
}

// ---------------------------------------------------------------- Mock

/**
 * Browser/dev stand-in: every purchase succeeds instantly (or as scripted in
 * tests). Lets you build and test the shop UI without a device or store account.
 */
export class MockBilling implements Billing {
  private owned = new Set<string>();
  private n = 0;
  /** Tests can script the next outcome. */
  next: "ok" | "cancelled" | "failed" = "ok";

  private readonly entitlementOf: (id: ProductId) => string | undefined;
  private readonly prices: Partial<Record<ProductId, string>>;

  constructor(entitlementOf: (id: ProductId) => string | undefined, prices: Partial<Record<ProductId, string>> = {}) {
    this.entitlementOf = entitlementOf;
    this.prices = prices;
  }

  async init(): Promise<void> {}

  async products(ids: readonly ProductId[]): Promise<StoreItem[]> {
    return ids.map((id) => ({ id, title: id, price: this.prices[id] ?? "$0.99" }));
  }

  async purchase(id: ProductId): Promise<PurchaseOutcome> {
    const outcome = this.next;
    this.next = "ok";
    if (outcome === "cancelled") return { status: "cancelled" };
    if (outcome === "failed") return { status: "failed", message: "Mock failure" };
    const ent = this.entitlementOf(id);
    if (ent) this.owned.add(ent);
    return { status: "ok", transactionId: `mock-${++this.n}`, entitlements: [...this.owned] };
  }

  async entitlements(): Promise<string[]> {
    return [...this.owned];
  }

  async restore(): Promise<string[]> {
    return [...this.owned];
  }
}

// ---------------------------------------------------------------- Factory

/**
 * Picks the right billing for where the game is running.
 * Native iOS/Android → RevenueCat with that platform's key; anything else → mock.
 */
export async function createBilling(keys: { ios: string; android: string }, mock: () => Billing): Promise<Billing> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      return new RevenueCatBilling(platform === "ios" ? keys.ios : keys.android);
    }
  } catch {
    /* not running under Capacitor */
  }
  return mock();
}
