using System;
using LostWorld.Core;
using LostWorld.Interaction;
using LostWorld.Missions;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace LostWorld.UI
{
    /// <summary>
    /// In-game HUD built in code (no prefabs): mission banner, interaction prompt,
    /// on-screen jump/interact buttons, toast messages, and the pause panel.
    /// Touch-first: all controls are large and sit in the thumb zones.
    /// </summary>
    public class GameHUD : MonoBehaviour
    {
        public event Action SaveRequested;
        public event Action MainMenuRequested;

        Text _mission, _prompt, _toast;
        Button _jump, _interact, _pause;
        GameObject _pausePanel;
        float _toastTimer;
        Canvas _canvas;
        RectTransform _joyBase, _joyKnob;

        public static GameHUD Create()
        {
            var go = new GameObject("GameHUD");
            return go.AddComponent<GameHUD>();
        }

        void Awake()
        {
            BuildCanvas();
        }

        void OnEnable()
        {
            InteractionDetector.CurrentChanged += OnInteractableChanged;
            if (MissionManager.Instance != null)
            {
                MissionManager.Instance.MissionStarted += OnMissionStarted;
                OnMissionStarted(MissionManager.Instance.Current);
            }
        }

        void OnDisable()
        {
            InteractionDetector.CurrentChanged -= OnInteractableChanged;
            if (MissionManager.Instance != null)
                MissionManager.Instance.MissionStarted -= OnMissionStarted;
        }

        void Update()
        {
            UpdateJoystickVisual();

            if (_toastTimer > 0f)
            {
                _toastTimer -= Time.unscaledDeltaTime;
                if (_toastTimer <= 0f) _toast.text = "";
            }
        }

        void UpdateJoystickVisual()
        {
            bool active = TouchInput.MoveActive;
            _joyBase.gameObject.SetActive(active);
            _joyKnob.gameObject.SetActive(active);
            if (!active) return;

            // ScreenSpaceOverlay: anchoredPosition is measured from the bottom-left corner in canvas units.
            float s = _canvas.scaleFactor;
            Vector2 origin = TouchInput.MoveOrigin / s;
            _joyBase.anchoredPosition = origin;
            _joyKnob.anchoredPosition = origin + TouchInput.Move * TouchInput.JoystickRadiusPixels / s;
        }

        public void Toast(string message, float seconds = 2.5f)
        {
            _toast.text = message;
            _toastTimer = seconds;
        }

        public void SetPaused(bool paused)
        {
            _pausePanel.SetActive(paused);
        }

        void OnMissionStarted(MissionId id)
        {
            _mission.text = id == MissionId.Complete
                ? "Chapter 1 complete"
                : $"<size=60%>OBJECTIVE</size>\n{MissionData.Title(id)}";
            if (id != MissionId.FindElena && id != MissionId.Complete) Toast("Objective updated");
        }

        void OnInteractableChanged(Interactable it)
        {
            _prompt.text = it != null ? it.Prompt : "";
            _interact.gameObject.SetActive(it != null);
        }

        // ---------- Build ----------

        void BuildCanvas()
        {
            var canvasGo = new GameObject("HUDCanvas");
            canvasGo.transform.SetParent(transform, false);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 10;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            if (FindObjectOfType<EventSystem>() == null)
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<EventSystem>();
                es.AddComponent<StandaloneInputModule>();
            }

            _mission = MakeText("Mission", _canvas.transform, TextAnchor.UpperLeft,
                new Vector2(0, 1), new Vector2(0, 1), new Vector2(40, -40), new Vector2(700, 140), 40);
            _toast = MakeText("Toast", _canvas.transform, TextAnchor.MiddleCenter,
                new Vector2(0.5f, 0.7f), new Vector2(0.5f, 0.7f), Vector2.zero, new Vector2(900, 80), 36);
            _prompt = MakeText("Prompt", _canvas.transform, TextAnchor.MiddleCenter,
                new Vector2(0.5f, 0.35f), new Vector2(0.5f, 0.35f), Vector2.zero, new Vector2(600, 60), 34);

            _interact = MakeButton("Interact", _canvas.transform, new Vector2(1, 0), new Vector2(-340, 300), 240, "USE",
                () => TouchInput.QueueInteract());
            _jump = MakeButton("Jump", _canvas.transform, new Vector2(1, 0), new Vector2(-120, 140), 240, "JUMP",
                () => TouchInput.QueueJump());
            _pause = MakeButton("Pause", _canvas.transform, new Vector2(1, 1), new Vector2(-120, -80), 140, "II",
                () => PauseToggled?.Invoke());

            _interact.gameObject.SetActive(false);
            _joyBase = MakeCircle("JoyBase", 240, new Color(1, 1, 1, 0.18f));
            _joyKnob = MakeCircle("JoyKnob", 110, new Color(1, 1, 1, 0.45f));
            _joyBase.gameObject.SetActive(false);
            _joyKnob.gameObject.SetActive(false);
            BuildPausePanel();
        }

        public event Action PauseToggled;

        static Sprite _circleSprite;

        RectTransform MakeCircle(string name, float diameter, Color color)
        {
            if (_circleSprite == null) _circleSprite = BuildCircleSprite(64);
            var go = new GameObject(name, typeof(RectTransform), typeof(Image));
            go.transform.SetParent(_canvas.transform, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = rt.anchorMax = Vector2.zero;
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(diameter, diameter);
            var img = go.GetComponent<Image>();
            img.sprite = _circleSprite;
            img.color = color;
            img.raycastTarget = false;
            return rt;
        }

        static Sprite BuildCircleSprite(int size)
        {
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            float r = size * 0.5f;
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float d = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), new Vector2(r, r));
                    float a = Mathf.Clamp01(r - d);
                    tex.SetPixel(x, y, new Color(1, 1, 1, a));
                }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
        }

        void BuildPausePanel()
        {
            _pausePanel = new GameObject("PausePanel", typeof(RectTransform), typeof(Image));
            _pausePanel.transform.SetParent(_canvas.transform, false);
            var rt = (RectTransform)_pausePanel.transform;
            rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one; rt.offsetMin = rt.offsetMax = Vector2.zero;
            _pausePanel.GetComponent<Image>().color = new Color(0, 0, 0, 0.7f);

            var resume = MakeButton("Resume", rt, new Vector2(0.5f, 0.6f), Vector2.zero, 0, "RESUME",
                () => PauseToggled?.Invoke(), new Vector2(360, 100));
            var save = MakeButton("SaveCheckpoint", rt, new Vector2(0.5f, 0.45f), Vector2.zero, 0, "SAVE CHECKPOINT",
                () => SaveRequested?.Invoke(), new Vector2(360, 100));
            MakeButton("MainMenu", rt, new Vector2(0.5f, 0.3f), Vector2.zero, 0, "MAIN MENU",
                () => MainMenuRequested?.Invoke(), new Vector2(360, 100));
            _pausePanel.SetActive(false);
        }

        internal static Text MakeText(string name, Transform parent, TextAnchor align, Vector2 anchor, Vector2 pivot,
            Vector2 pos, Vector2 size, int fontSize)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = rt.anchorMax = anchor;
            rt.pivot = pivot;
            rt.anchoredPosition = pos;
            rt.sizeDelta = size;
            var t = go.GetComponent<Text>();
            t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.alignment = align;
            t.fontSize = fontSize;
            t.color = Color.white;
            t.supportRichText = true;
            t.raycastTarget = false;
            return t;
        }

        internal static Button MakeButton(string name, Transform parent, Vector2 anchor, Vector2 pos, float size,
            string label, Action onClick, Vector2? sizeOverride = null)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = rt.anchorMax = anchor;
            rt.pivot = anchor;
            rt.anchoredPosition = pos;
            Vector2 s = sizeOverride ?? new Vector2(size, size);
            rt.sizeDelta = s;

            var img = go.GetComponent<Image>();
            img.color = new Color(1f, 1f, 1f, 0.22f);
            var btn = go.GetComponent<Button>();
            btn.targetGraphic = img;
            btn.onClick.AddListener(() => onClick());

            var labelGo = new GameObject("Label", typeof(RectTransform), typeof(Text));
            labelGo.transform.SetParent(go.transform, false);
            var lrt = (RectTransform)labelGo.transform;
            lrt.anchorMin = Vector2.zero; lrt.anchorMax = Vector2.one; lrt.offsetMin = lrt.offsetMax = Vector2.zero;
            var t = labelGo.GetComponent<Text>();
            t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.text = label;
            t.alignment = TextAnchor.MiddleCenter;
            t.fontSize = 32;
            t.color = Color.white;
            t.raycastTarget = false;
            return btn;
        }
    }
}
