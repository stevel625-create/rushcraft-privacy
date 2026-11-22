/**
 * Everything the game sells. Product IDs must match App Store Connect and
 * Google Play Console exactly; entitlement IDs must match the RevenueCat
 * dashboard. Prices come from the stores at runtime: never hard-code them in UI.
 */

export type ProductId =
  | "car07.full_game"
  | "car07.lamp_colors"
  | "car07.batteries_5"
  | "car07.second_wind_3"
  | "car07.hints_10";

/** Consumable counters kept on the device. */
export type Consumable = "batteries" | "secondWinds" | "hints";
/** Non-consumables, granted through RevenueCat entitlements. */
export type Entitlement = "full_game" | "lamp_colors";

export type ProductInfo = {
  id: ProductId;
  kind: "unlock" | "consumable";
  title: string;
  blurb: string;
  /** Entitlement a non-consumable grants. */
  entitlement?: Entitlement;
  /** What a consumable adds. */
  grant?: { item: Consumable; amount: number };
};

export const PRODUCTS: readonly ProductInfo[] = [
  {
    id: "car07.full_game",
    kind: "unlock",
    title: "Full Game",
    blurb: "Unlock Stages 3–8: Yard Nine to Hallow Cross Terminus.",
    entitlement: "full_game",
  },
  {
    id: "car07.lamp_colors",
    kind: "unlock",
    title: "Lamp Colours",
    blurb: "Four extra beam colours for your torch and signal lamp.",
    entitlement: "lamp_colors",
  },
  {
    id: "car07.batteries_5",
    kind: "consumable",
    title: "5 Battery Refills",
    blurb: "Instantly refill your light to 100%.",
    grant: { item: "batteries", amount: 5 },
  },
  {
    id: "car07.second_wind_3",
    kind: "consumable",
    title: "3 Second Winds",
    blurb: "When the Listener catches you, tear free instead of starting over.",
    grant: { item: "secondWinds", amount: 3 },
  },
  {
    id: "car07.hints_10",
    kind: "consumable",
    title: "10 Hints",
    blurb: "Tells you exactly where to go next.",
    grant: { item: "hints", amount: 10 },
  },
];

export const PRODUCT_IDS = PRODUCTS.map((p) => p.id);

export function productInfo(id: string): ProductInfo | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Free starter items so every player can try each feature once. */
export const STARTER: Record<Consumable, number> = { batteries: 1, secondWinds: 1, hints: 3 };

export type LampColour = { id: string; name: string; color: number; premium: boolean };

export const LAMP_COLOURS: readonly LampColour[] = [
  { id: "torch", name: "Torch White", color: 0xf0e8c6, premium: false },
  { id: "sodium", name: "Sodium Amber", color: 0xffb060, premium: true },
  { id: "signal", name: "Signal Red", color: 0xff5a44, premium: true },
  { id: "mercury", name: "Mercury Blue", color: 0xa8d4ff, premium: true },
  { id: "green", name: "Guard's Green", color: 0x9cff9c, premium: true },
];
