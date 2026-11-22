using LostWorld.Core;
using LostWorld.Monetization;
using UnityEngine;
using UnityEngine.UI;

namespace LostWorld.UI
{
    /// <summary>
    /// Main menu: Play, Continue, Settings, Store. Built in code on its own canvas above the HUD.
    /// The Store uses the mock store only: confirming a purchase grants the item locally, with no charge.
    /// </summary>
    public class MainMenu : MonoBehaviour
    {
        GameBootstrap _game;
        Canvas _canvas;
        GameObject _main, _store, _settings, _confirm;
        Button _continue;
        Text _confirmText;
        string _pendingProduct;
        Text _storeStatus;

        public static MainMenu Create(GameBootstrap game)
        {
            var go = new GameObject("MainMenu");
            var m = go.AddComponent<MainMenu>();
            m._game = game;
            m.Build();
            return m;
        }

        public void Show(bool hasSave)
        {
            _canvas.gameObject.SetActive(true);
            _continue.interactable = hasSave;
            ShowPanel(_main);
        }

        public void Hide() => _canvas.gameObject.SetActive(false);

        void Build()
        {
            var canvasGo = new GameObject("MenuCanvas");
            canvasGo.transform.SetParent(transform, false);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 50;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            _main = Panel("Main", new Color(0.04f, 0.09f, 0.05f, 0.92f));
            Title(_main.transform, "THE LOST WORLD", "Chapter 1: The Crash");
            Button play = Btn(_main.transform, "Play", "PLAY", 0.5f, 0.5f, () => _game.StartNewGame());
            _continue = Btn(_main.transform, "Continue", "CONTINUE", 0.5f, 0.4f, () => _game.Continue());
            Btn(_main.transform, "Settings", "SETTINGS", 0.5f, 0.3f, () => ShowPanel(_settings));
            Btn(_main.transform, "Store", "STORE", 0.5f, 0.2f, () => { RefreshStore(); ShowPanel(_store); });

            _store = Panel("Store", new Color(0.04f, 0.06f, 0.1f, 0.96f));
            Title(_store.transform, "STORE", "Chapter 1 is free. Other content is a mock purchase in this prototype.");
            BuildStoreRows(_store.transform);
            _storeStatus = GameHUD.MakeText("Status", _store.transform, TextAnchor.MiddleCenter,
                new Vector2(0.5f, 0.12f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(1200, 60), 30);
            Btn(_store.transform, "StoreBack", "BACK", 0.5f, 0.04f, () => ShowPanel(_main), 360);

            _settings = Panel("Settings", new Color(0.04f, 0.06f, 0.1f, 0.96f));
            Title(_settings.transform, "SETTINGS", "Touch: left thumb moves, right thumb drags the camera.");
            Btn(_settings.transform, "ResetProgress", "ERASE LOCAL SAVE", 0.5f, 0.5f, () =>
            {
                SaveSystem.Delete();
                _game.ShowToast("Local save erased");
            }, 520);
            Btn(_settings.transform, "ResetMock", "RESET MOCK PURCHASES", 0.5f, 0.4f, () =>
            {
                MockStoreService.ResetAll();
                _game.ShowToast("Mock purchases reset");
            }, 520);
            Btn(_settings.transform, "SettingsBack", "BACK", 0.5f, 0.04f, () => ShowPanel(_main), 360);

            _confirm = Panel("Confirm", new Color(0, 0, 0, 0.8f));
            _confirmText = GameHUD.MakeText("ConfirmText", _confirm.transform, TextAnchor.MiddleCenter,
                new Vector2(0.5f, 0.6f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(1200, 160), 36);
            Btn(_confirm.transform, "ConfirmYes", "CONFIRM (MOCK)", 0.42f, 0.4f, ConfirmPurchase, 420);
            Btn(_confirm.transform, "ConfirmNo", "CANCEL", 0.58f, 0.4f, () => ShowPanel(_store), 420);
            _confirm.SetActive(false);

            _game.Store.PurchaseFinished += OnPurchaseFinished;
            ShowPanel(_main);
        }

        void BuildStoreRows(Transform parent)
        {
            float y = 0.72f;
            foreach (var p in ProductCatalog.All)
            {
                var prod = p;
                var btn = GameHUD.MakeButton("Buy_" + p.id, parent, new Vector2(0.5f, y), Vector2.zero, 0,
                    p.displayName, () => AskConfirm(prod.id), new Vector2(900, 80));
                btn.gameObject.name = "Buy_" + p.id;
                y -= 0.1f;
            }
        }

        void RefreshStore()
        {
            _storeStatus.text = "";
        }

        void AskConfirm(string productId)
        {
            _pendingProduct = productId;
            if (_game.Store.Owns(productId))
            {
                _storeStatus.text = "Already owned.";
                return;
            }
            _confirmText.text = "Mock purchase: no money is charged.\nGrant this item in the prototype?";
            _confirm.SetActive(true);
        }

        void ConfirmPurchase()
        {
            _confirm.SetActive(false);
            if (_pendingProduct != null) _game.Store.Purchase(_pendingProduct);
            _pendingProduct = null;
        }

        void OnPurchaseFinished(string id, PurchaseResult result)
        {
            if (_storeStatus == null) return;
            _storeStatus.text = result switch
            {
                PurchaseResult.Success => "Granted (mock).",
                PurchaseResult.AlreadyOwned => "Already owned.",
                PurchaseResult.Cancelled => "Cancelled.",
                _ => "Purchase unavailable in this build."
            };
        }

        void OnDestroy()
        {
            if (_game != null && _game.Store != null) _game.Store.PurchaseFinished -= OnPurchaseFinished;
        }

        void ShowPanel(GameObject panel)
        {
            _main.SetActive(panel == _main);
            _store.SetActive(panel == _store);
            _settings.SetActive(panel == _settings);
        }

        GameObject Panel(string name, Color bg)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image));
            go.transform.SetParent(_canvas.transform, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
            rt.offsetMin = rt.offsetMax = Vector2.zero;
            go.GetComponent<Image>().color = bg;
            return go;
        }

        static void Title(Transform parent, string title, string subtitle)
        {
            var t = GameHUD.MakeText("Title", parent, TextAnchor.MiddleCenter,
                new Vector2(0.5f, 0.82f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(1400, 120), 72);
            t.text = title;
            var s = GameHUD.MakeText("Subtitle", parent, TextAnchor.MiddleCenter,
                new Vector2(0.5f, 0.72f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(1400, 80), 30);
            s.text = subtitle;
            s.color = new Color(1, 1, 1, 0.7f);
        }

        static Button Btn(Transform parent, string name, string label, float ax, float ay, System.Action onClick,
            float width = 420)
        {
            return GameHUD.MakeButton(name, parent, new Vector2(ax, ay), Vector2.zero, 0, label, onClick,
                new Vector2(width, 90));
        }
    }
}
