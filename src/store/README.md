# In-app purchases: setup

Billing runs through **RevenueCat** (`@revenuecat/purchases-capacitor`). It
handles Apple and Google receipts server-side, so you don't need a backend.
In the browser, a mock store is used so you can build and test the UI.

## What's for sale

| Product ID            | Type           | Grants                              | Suggested price |
| --------------------- | -------------- | ----------------------------------- | --------------- |
| `car07.full_game`     | Non-consumable | Stages 3–8 (entitlement `full_game`) | $3.99           |
| `car07.lamp_colors`   | Non-consumable | 4 beam colours (entitlement `lamp_colors`) | $0.99     |
| `car07.batteries_5`   | Consumable     | 5 instant battery refills           | $0.99           |
| `car07.second_wind_3` | Consumable     | 3 Second Winds (escape a catch)     | $0.99           |
| `car07.hints_10`      | Consumable     | 10 location hints                   | $0.99           |

New players get 1 battery, 1 Second Wind and 3 hints free (`STARTER` in
`products.ts`). Stages 1–2 are free. The unlock prompt appears at the end
of Stage 2.

## 1. Install

```sh
npm install @revenuecat/purchases-capacitor
npx cap sync
```

## 2. App Store Connect (iOS)

1. Sign the **Paid Apps agreement** and fill in tax and banking details. Products won't load until you do.
2. Your app → **Monetization → In-App Purchases** → create the five products with the exact IDs above. Use **Non-Consumable** for the two unlocks and **Consumable** for the rest.
3. Give each a display name, description, price and review screenshot. Add them to your next app version when you submit it.
4. Create a **Sandbox tester** under Users and Access, for testing on a device.

## 3. Google Play Console (Android)

1. Set up a payments profile.
2. Upload a build to an internal testing track first. Play won't show in-app products until a build with billing has been uploaded.
3. **Monetize → Products → In-app products** → create the same five IDs. Consumable or not is decided in code, so they're all one-time products here.
4. Add your Google account under **License testing**.

## 4. RevenueCat

1. Create a project. Add an **App Store** app (with an In-App Purchase key) and a **Play Store** app (with a service-account JSON). The dashboard walks you through both.
2. **Products**: import all five from each store.
3. **Entitlements**: create `full_game` (attach `car07.full_game`) and `lamp_colors` (attach `car07.lamp_colors`). Consumables don't need an entitlement.
4. Copy the **public** SDK keys into `.env`:

```
VITE_REVENUECAT_IOS_KEY=appl_xxxxxxxx
VITE_REVENUECAT_ANDROID_KEY=goog_xxxxxxxx
```

## 5. Wire it into the app

```ts
import { createShop, connectShop } from "./store/setup";
import { ShopPanel, QuickItems } from "./store/ShopPanel";

const shop = await createShop();                                  // before the engine
const engine = new GameEngine(host, onHud, touch, shop.perks);    // 4th argument is new
connectShop(shop, engine);
shop.onPaywall(() => openShop({ paywall: true }));                // end of Stage 2
```

Render `<ShopPanel>` from a menu button and from the paywall. Put
`<QuickItems>` in the HUD for the battery and hint buttons. The engine's
`HudState` also has a new `hidden` flag (true inside a locker), if you want a
vent-slat overlay.

## Store rules this already follows

- Digital items use Apple and Google billing only. No external payment links.
- **Restore Purchases** is visible in the shop (Apple requires it).
- Prices are shown from the store (`priceString`), never hard-coded.
- No randomised rewards, so loot-box disclosure rules don't apply.

## Known limits

- **Consumables live on the device.** They aren't restored after reinstalling or on a new phone, and stores don't restore consumables anyway. To sync them across devices, track balances on a server (RevenueCat webhooks or your own).
- If the app is killed in the moment between payment and crediting, a consumable could be lost. RevenueCat's purchase history in the dashboard lets you grant it back by hand.
