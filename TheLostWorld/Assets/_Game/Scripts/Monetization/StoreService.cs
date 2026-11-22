using System;
using System.Collections.Generic;
using UnityEngine;

namespace LostWorld.Monetization
{
    public enum ProductKind { Chapter, Cosmetic, Bundle }

    [Serializable]
    public class ProductDef
    {
        public string id;          // store SKU, e.g. "lostworld.ch2"
        public string displayName;
        public ProductKind kind;
        public string priceLabel;  // placeholder until the store returns localized prices
    }

    public enum PurchaseResult { Success, Cancelled, Failed, AlreadyOwned }

    /// <summary>
    /// Abstraction the game talks to. Swap the implementation per platform/build:
    /// MockStoreService (prototype, no money moves) or UnityIapStoreService (production, Apple/Google billing).
    /// </summary>
    public interface IStoreService
    {
        bool IsInitialised { get; }
        event Action<string, PurchaseResult> PurchaseFinished;
        void Initialise(Action<bool> done);
        IReadOnlyList<ProductDef> Products { get; }
        void Purchase(string productId);
        void RestorePurchases(Action<int> done);
        bool Owns(string productId);
    }

    /// <summary>Catalog for the plan: Chapter 1 free, later chapters, cosmetics, and the complete bundle.</summary>
    public static class ProductCatalog
    {
        public const string Chapter2 = "lostworld.chapter2";
        public const string Chapter3 = "lostworld.chapter3";
        public const string CosmeticOutfitExplorer = "lostworld.outfit.explorer";
        public const string CosmeticOutfitSafari = "lostworld.outfit.safari";
        public const string CompleteAdventure = "lostworld.bundle.complete";

        public static readonly ProductDef[] All =
        {
            new ProductDef { id = Chapter2, displayName = "Chapter 2: The Sunken Gate", kind = ProductKind.Chapter, priceLabel = "$—" },
            new ProductDef { id = Chapter3, displayName = "Chapter 3: The Obsidian Peak", kind = ProductKind.Chapter, priceLabel = "$—" },
            new ProductDef { id = CosmeticOutfitExplorer, displayName = "Explorer Outfit", kind = ProductKind.Cosmetic, priceLabel = "$—" },
            new ProductDef { id = CosmeticOutfitSafari, displayName = "Safari Outfit", kind = ProductKind.Cosmetic, priceLabel = "$—" },
            new ProductDef { id = CompleteAdventure, displayName = "Complete Adventure", kind = ProductKind.Bundle, priceLabel = "$—" },
        };
    }
}
