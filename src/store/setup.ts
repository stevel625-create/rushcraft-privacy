import type { GameEngine } from "../engine.ts";
import { MockBilling, createBilling } from "./billing.ts";
import { productInfo } from "./products.ts";
import { GameShop } from "./shop.ts";

/**
 * Wiring, in order:
 *
 *   const shop = await createShop();                         // before the engine
 *   const engine = new GameEngine(host, onHud, touch, shop.perks);
 *   connectShop(shop, engine);                               // lamp colour, unlock refresh
 *
 * The shop must exist before the engine so a returning player who owns the
 * full game resumes straight into their saved later stage.
 */

/** Public RevenueCat SDK keys (dashboard → Project → API keys). Safe to ship in the app. */
const KEYS = {
  ios: import.meta.env.VITE_REVENUECAT_IOS_KEY ?? "",
  android: import.meta.env.VITE_REVENUECAT_ANDROID_KEY ?? "",
};

export async function createShop(): Promise<GameShop> {
  const billing = await createBilling(KEYS, () => new MockBilling((id) => productInfo(id)?.entitlement));
  const shop = new GameShop(billing);
  // Prices and entitlements load in the background; cached ownership applies immediately.
  void shop.init();
  return shop;
}

export function connectShop(shop: GameShop, engine: GameEngine): () => void {
  let lamp = "";
  const sync = () => {
    const current = shop.currentLamp();
    if (current.id !== lamp) {
      lamp = current.id;
      engine.setLampColor(current.color);
    }
    engine.refreshPerks();
  };
  sync();
  return shop.subscribe(sync);
}
