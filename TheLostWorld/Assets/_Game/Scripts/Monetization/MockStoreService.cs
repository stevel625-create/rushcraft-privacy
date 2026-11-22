using System;
using System.Collections.Generic;
using UnityEngine;

namespace LostWorld.Monetization
{
    /// <summary>
    /// Prototype store. NO real money moves: purchases only flip a local flag so the UI flow can be tested.
    /// Ownership is kept in PlayerPrefs for the prototype only (cleared with "Reset Mock Purchases").
    /// Never ship this implementation; production uses UnityIapStoreService with store-issued SKUs.
    /// </summary>
    public class MockStoreService : IStoreService
    {
        const string KeyPrefix = "mock_iap_";

        public bool IsInitialised { get; private set; }
        public event Action<string, PurchaseResult> PurchaseFinished;
        public IReadOnlyList<ProductDef> Products => ProductCatalog.All;

        public void Initialise(Action<bool> done)
        {
            IsInitialised = true;
            done?.Invoke(true);
        }

        public void Purchase(string productId)
        {
            if (!IsInitialised) { PurchaseFinished?.Invoke(productId, PurchaseResult.Failed); return; }
            if (Owns(productId)) { PurchaseFinished?.Invoke(productId, PurchaseResult.AlreadyOwned); return; }

            PlayerPrefs.SetInt(KeyPrefix + productId, 1);
            PlayerPrefs.Save();
            Debug.Log($"[MockStore] Granted '{productId}' (no charge).");
            PurchaseFinished?.Invoke(productId, PurchaseResult.Success);
        }

        public void RestorePurchases(Action<int> done)
        {
            int count = 0;
            foreach (var p in ProductCatalog.All) if (Owns(p.id)) count++;
            done?.Invoke(count);
        }

        public bool Owns(string productId) => PlayerPrefs.GetInt(KeyPrefix + productId, 0) == 1;

        public static void ResetAll()
        {
            foreach (var p in ProductCatalog.All) PlayerPrefs.DeleteKey(KeyPrefix + p.id);
            PlayerPrefs.Save();
        }
    }

    /// <summary>
    /// Production shell. Compiles only after the Unity IAP package is installed AND the
    /// UNITY_PURCHASING define is set (Unity adds it automatically once the package is present).
    /// Configure SKUs in the Unity Dashboard / App Store Connect / Google Play Console; do not hard-code keys here.
    /// </summary>
    public static class StoreServiceFactory
    {
        public static IStoreService Create()
        {
#if UNITY_PURCHASING && !UNITY_EDITOR
            // TODO(production): return new UnityIapStoreService();
            return new MockStoreService();
#else
            return new MockStoreService();
#endif
        }
    }
}
