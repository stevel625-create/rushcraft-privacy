import { useState, useSyncExternalStore } from "react";
import type { GameEngine } from "../engine.ts";
import { PRODUCTS, type ProductId } from "./products.ts";
import type { BuyResult, GameShop } from "./shop.ts";

/**
 * Shop UI. Styled with Tailwind to sit alongside the existing HUD.
 *
 *   <ShopPanel shop={shop} engine={engine} open={open} paywall={paywall} onClose={...} />
 *   <QuickItems shop={shop} engine={engine} />   // battery + hint buttons for the HUD
 *
 * Show the panel with `paywall` set when shop.onPaywall fires.
 */

export function useShop(shop: GameShop) {
  // Snapshot is the state object itself; GameShop mutates and notifies, so bump a version.
  const version = useSyncExternalStore(
    (fn) => shop.subscribe(fn),
    () => JSON.stringify(shop.state) + shop.ready,
  );
  return { state: shop.state, version };
}

const MESSAGE: Record<BuyResult, string> = {
  ok: "Thank you!",
  cancelled: "",
  failed: "The purchase didn't go through. You haven't been charged.",
  unavailable: "That isn't available right now. Try again in a moment.",
};

export function ShopPanel(props: {
  shop: GameShop;
  engine: GameEngine;
  open: boolean;
  /** Opened because the player hit the end of Stage 2: lead with the unlock. */
  paywall?: boolean;
  onClose: () => void;
}) {
  const { shop, engine, open, paywall, onClose } = props;
  const { state } = useShop(shop);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  if (!open) return null;

  const buy = async (id: ProductId) => {
    setBusy(id);
    setNote("");
    const result = await shop.buy(id);
    setBusy(null);
    setNote(MESSAGE[result]);
    if (result === "ok" && id === "car07.full_game") {
      engine.refreshPerks();
      if (paywall) onClose(); // straight back to the Stage 2 ending, now showing CONTINUE
    }
  };

  const restore = async () => {
    setBusy("restore");
    const ok = await shop.restore();
    setBusy(null);
    setNote(ok ? "Purchases restored." : "Couldn't reach the store. Check your connection.");
  };

  const products = paywall ? [...PRODUCTS].sort((a, b) => Number(b.id === "car07.full_game") - Number(a.id === "car07.full_game")) : PRODUCTS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono text-stone-200">
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-lg border border-stone-700 bg-stone-950 p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg tracking-widest">{paywall ? "THE LINE GOES ON" : "STORES"}</h2>
            {paywall && (
              <p className="mt-1 text-sm text-stone-400">
                Car 07 has six more stops. Unlock the full game to ride on.
              </p>
            )}
          </div>
          <button onClick={onClose} className="px-2 text-stone-400 hover:text-white" aria-label="Close">
            ✕
          </button>
        </div>

        <ul className="space-y-3">
          {products.map((p) => {
            const owned = p.entitlement ? state.owned[p.entitlement] : false;
            const listing = shop.listing(p.id);
            const count = p.grant ? state.items[p.grant.item] : null;
            return (
              <li key={p.id} className="flex items-center gap-3 rounded border border-stone-800 p-3">
                <div className="flex-1">
                  <div className="text-sm tracking-wide">{p.title}</div>
                  <div className="text-xs text-stone-400">{p.blurb}</div>
                  {count !== null && <div className="mt-1 text-xs text-amber-300">You have {count}</div>}
                </div>
                <button
                  disabled={owned || busy !== null || !listing}
                  onClick={() => buy(p.id)}
                  className="min-w-20 rounded bg-amber-600 px-3 py-2 text-sm text-black disabled:bg-stone-700 disabled:text-stone-400"
                >
                  {owned ? "OWNED" : busy === p.id ? "…" : (listing?.price ?? "—")}
                </button>
              </li>
            );
          })}
        </ul>

        <LampPicker shop={shop} />

        <label className="mt-4 flex items-center gap-2 text-xs text-stone-400">
          <input
            type="checkbox"
            checked={state.autoSecondWind}
            onChange={(e) => shop.setAutoSecondWind(e.target.checked)}
          />
          Use a Second Wind automatically when caught
        </label>

        {note && <p className="mt-3 text-sm text-amber-200">{note}</p>}

        {/* Apple requires a visible way to restore non-consumable purchases. */}
        <button
          onClick={restore}
          disabled={busy !== null}
          className="mt-4 w-full rounded border border-stone-700 py-2 text-xs tracking-widest text-stone-300"
        >
          {busy === "restore" ? "RESTORING…" : "RESTORE PURCHASES"}
        </button>
      </div>
    </div>
  );
}

function LampPicker({ shop }: { shop: GameShop }) {
  useShop(shop);
  const current = shop.currentLamp().id;
  return (
    <div className="mt-4">
      <div className="mb-2 text-xs tracking-widest text-stone-400">BEAM COLOUR</div>
      <div className="flex gap-2">
        {shop.lampColours().map((c) => (
          <button
            key={c.id}
            title={c.locked ? `${c.name} (Lamp Colours)` : c.name}
            disabled={c.locked}
            onClick={() => shop.setLamp(c.id)}
            className={`h-9 w-9 rounded-full border-2 ${current === c.id ? "border-white" : "border-transparent"} disabled:opacity-30`}
            style={{ background: `#${c.color.toString(16).padStart(6, "0")}` }}
          >
            {c.locked && <span className="text-xs text-black">🔒</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Small HUD buttons for using consumables mid-run. */
export function QuickItems({ shop, engine, onShop }: { shop: GameShop; engine: GameEngine; onShop: () => void }) {
  const { state } = useShop(shop);
  const [flash, setFlash] = useState("");

  const refill = () => {
    if (!shop.spend("batteries")) return onShop();
    if (!engine.refillBattery()) {
      shop.refund("batteries");
      setFlash("Light's already full");
      setTimeout(() => setFlash(""), 1500);
    }
  };
  const hint = () => {
    if (!shop.spend("hints")) return onShop();
    if (!engine.showHint()) {
      shop.refund("hints");
      setFlash("No hint here");
      setTimeout(() => setFlash(""), 1500);
    }
  };

  const btn = "rounded bg-black/60 px-3 py-2 font-mono text-xs tracking-widest text-stone-200 backdrop-blur";
  return (
    <div className="pointer-events-auto flex gap-2">
      <button className={btn} onClick={refill}>
        🔋 {state.items.batteries}
      </button>
      <button className={btn} onClick={hint}>
        ? {state.items.hints}
      </button>
      <span className={btn}>♥ {state.items.secondWinds}</span>
      {flash && <span className="self-center font-mono text-xs text-stone-400">{flash}</span>}
    </div>
  );
}
