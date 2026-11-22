using LostWorld.Companion;
using LostWorld.Environment;
using LostWorld.Interaction;
using LostWorld.Levels;
using LostWorld.Missions;
using LostWorld.Monetization;
using LostWorld.Player;
using LostWorld.Save;
using LostWorld.UI;
using UnityEngine;

namespace LostWorld.Core
{
    /// <summary>
    /// Entry point. Put this on ONE GameObject in an otherwise empty scene (ProjectSetup does it) and press Play.
    /// Creates the persistent pieces once (Jason, Elena, camera, managers, UI) and swaps levels in and out.
    /// </summary>
    public class GameBootstrap : MonoBehaviour
    {
        public static GameBootstrap Instance { get; private set; }
        public IStoreService Store { get; private set; }
        public int CurrentLevelIndex { get; private set; }

        PlayerController _player;
        CompanionFollower _companion;
        ThirdPersonCamera _cam;
        Camera _camera;
        Light _sun;
        MissionManager _missions;
        RespawnService _respawn;
        GameHUD _hud;
        MainMenu _menu;

        WorldKit _world;
        LevelLayout _layout;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;

            gameObject.AddComponent<InputRouter>();
            Store = StoreServiceFactory.Create();
            Store.Initialise(_ => { });

            BuildPersistent();
            LoadLevel(0, null); // backdrop behind the main menu
            _player.ControlsEnabled = false;
            _menu.Show(SaveSystem.HasSave());
        }

        void BuildPersistent()
        {
            _sun = FindFirstObjectByType<Light>();
            if (_sun == null || _sun.type != LightType.Directional)
            {
                _sun = new GameObject("Sun").AddComponent<Light>();
                _sun.type = LightType.Directional;
            }
            _sun.shadows = LightShadows.Soft;

            _missions = new GameObject("MissionManager").AddComponent<MissionManager>();
            _missions.ObjectiveStarted += OnObjectiveStarted;
            _missions.ObjectiveCompleted += _ => SaveCheckpoint(false);
            _missions.LevelCompleted += OnLevelCompleted;

            var jason = CreateHuman("Jason", new Color(0.15f, 0.35f, 0.7f));
            _player = jason.AddComponent<PlayerController>();
            jason.AddComponent<InteractionDetector>();

            var elena = CreateHuman("Elena", new Color(0.85f, 0.45f, 0.55f));
            _companion = elena.AddComponent<CompanionFollower>();
            _companion.Leader = jason.transform;

            _camera = Camera.main;
            if (_camera == null)
            {
                var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
                _camera = camGo.AddComponent<Camera>();
                camGo.AddComponent<AudioListener>();
            }
            _camera.clearFlags = CameraClearFlags.SolidColor;
            _camera.fieldOfView = 60f;
            _camera.farClipPlane = 250f; // fog hides the cut-off; keeps draw distance mobile-friendly
            _cam = _camera.GetComponent<ThirdPersonCamera>();
            if (_cam == null) _cam = _camera.gameObject.AddComponent<ThirdPersonCamera>();
            _cam.Target = jason.transform;
            _player.SetCamera(_camera.transform);

            _respawn = new GameObject("RespawnService").AddComponent<RespawnService>();
            _respawn.Bind(_player, _companion, _cam);

            _hud = GameHUD.Create();
            _hud.SaveRequested += () => SaveCheckpoint(true);
            _hud.PauseToggled += TogglePause;
            _hud.MainMenuRequested += ReturnToMenu;
            _hud.NextLevelRequested += NextLevel;

            _menu = MainMenu.Create(this);
        }

        // ---------- Level loading ----------

        void LoadLevel(int index, SaveData restore)
        {
            GameState.SetPaused(false);
            _hud.SetPaused(false);
            _hud.HideLevelComplete();

            _world?.Dispose();

            CurrentLevelIndex = Mathf.Clamp(index, 0, LevelCatalog.Count - 1);
            LevelDefinition level = LevelCatalog.Get(CurrentLevelIndex);
            ApplyTheme(level.Theme);

            _world = new WorldKit($"Level{level.Number}_{level.Title}", level.Seed);
            _layout = level.Builder.Build(_world);
            // New colliders' transforms reach the physics scene only at the next simulation step; sync now so
            // raycasts (companion ground probe) and trigger checks see the level we just built.
            Physics.SyncTransforms();

            // Place characters before objectives start so triggers see them in the right spot.
            Vector3 pos = restore != null ? SaveSystem.PositionOf(restore) : _layout.JasonSpawn;
            Quaternion rot = Quaternion.Euler(0f, restore != null ? restore.playerYaw : _layout.JasonYaw, 0f);
            _player.Warp(pos, rot);
            _companion.ReturnToFollowing();
            if (restore != null) _respawn.RecoverCompanion();
            else _companion.WarpTo(_layout.ElenaSpawn);
            _respawn.ResetForLevel(pos, rot, _layout.KillY);
            _cam.Snap();

            _missions.LoadObjectives(level.Objectives, restore?.objectiveIndex ?? 0);
            FastForwardCompletedMechanics();
            _hud.SetLevelLabel($"LEVEL {level.Number} · {level.Title.ToUpperInvariant()}");
        }

        /// <summary>On Continue, put puzzles that are already behind the player into their solved state.</summary>
        void FastForwardCompletedMechanics()
        {
            if (_missions.CurrentIndex == 0) return;
            foreach (var mb in FindObjectsByType<MonoBehaviour>(FindObjectsSortMode.None))
                if (mb is IObjectiveMechanic m && !string.IsNullOrEmpty(m.ObjectiveId) && _missions.IsCompleted(m.ObjectiveId))
                    m.ForceComplete();
        }

        void ApplyTheme(LevelTheme t)
        {
            _camera.backgroundColor = t.Sky;
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = t.Ambient;
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = t.Fog;
            RenderSettings.fogDensity = t.FogDensity;
            _sun.color = t.SunColor;
            _sun.intensity = t.SunIntensity;
            _sun.transform.rotation = Quaternion.Euler(t.SunEuler);
        }

        void OnObjectiveStarted(ObjectiveDef o)
        {
            if (_layout != null && _layout.CompanionSpots.TryGetValue(o.Id, out Vector3 spot))
                _companion.WalkTo(spot);
            else if (_companion.CurrentState == CompanionFollower.State.Scripted)
                _companion.ReturnToFollowing();
        }

        void OnLevelCompleted()
        {
            bool hasNext = CurrentLevelIndex + 1 < LevelCatalog.Count;
            if (hasNext) ProgressStore.UnlockThrough(CurrentLevelIndex + 1);
            _companion.ReturnToFollowing();
            _player.ControlsEnabled = false;
            _hud.ShowLevelComplete(LevelCatalog.Get(CurrentLevelIndex).Title, hasNext);
        }

        // ---------- Menu / flow ----------

        public void StartNewGame()
        {
            SaveSystem.Delete();
            StartLevel(0);
        }

        public void StartLevel(int index)
        {
            if (!ProgressStore.IsUnlocked(index)) return;
            LoadLevel(index, null);
            BeginPlay();
            SaveCheckpoint(false);
        }

        public void Continue()
        {
            var data = SaveSystem.Read();
            if (data == null) { StartNewGame(); return; }

            int idx = Mathf.Clamp(data.levelIndex, 0, LevelCatalog.Count - 1);
            if (data.objectiveIndex >= LevelCatalog.Get(idx).Objectives.Length)
            {
                // Saved after finishing a level: resume at the start of the next one.
                LoadLevel(Mathf.Min(idx + 1, LevelCatalog.Count - 1), null);
            }
            else
            {
                LoadLevel(idx, data);
            }
            BeginPlay();
        }

        void NextLevel()
        {
            if (CurrentLevelIndex + 1 < LevelCatalog.Count) StartLevel(CurrentLevelIndex + 1);
            else ReturnToMenu();
        }

        void BeginPlay()
        {
            _menu.Hide();
            _player.ControlsEnabled = true;
            GameState.SetPaused(false);
            var level = LevelCatalog.Get(CurrentLevelIndex);
            _hud.Toast($"Level {level.Number}: {level.Title}", 3f);
        }

        void SaveCheckpoint(bool announce)
        {
            Transform j = _player.transform;
            bool ok = SaveSystem.Write(SaveSystem.Capture(CurrentLevelIndex, _missions.CurrentIndex, j.position, j.eulerAngles.y));
            if (announce) _hud.Toast(ok ? "Checkpoint saved" : "Save failed - storage unavailable", 2f);
        }

        void TogglePause()
        {
            bool paused = !GameState.Paused;
            GameState.SetPaused(paused);
            _player.ControlsEnabled = !paused;
            _hud.SetPaused(paused);
        }

        void ReturnToMenu()
        {
            GameState.SetPaused(false);
            _hud.SetPaused(false);
            _hud.HideLevelComplete();
            _player.ControlsEnabled = false;
            _menu.Show(SaveSystem.HasSave());
        }

        public void ShowToast(string message) => _hud.Toast(message);

        // ---------- Characters ----------

        static GameObject CreateHuman(string name, Color shirt)
        {
            var go = new GameObject(name);

            var cc = go.AddComponent<CharacterController>();
            cc.height = 1.8f;
            cc.radius = 0.35f;
            cc.center = new Vector3(0, 0.9f, 0);
            cc.stepOffset = 0.35f;
            cc.slopeLimit = 45f;

            var body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            body.name = "Body";
            body.transform.SetParent(go.transform, false);
            body.transform.localPosition = new Vector3(0, 0.9f, 0);
            body.transform.localScale = new Vector3(0.7f, 0.9f, 0.7f);
            DestroyImmediate(body.GetComponent<CapsuleCollider>());
            body.GetComponent<Renderer>().sharedMaterial = MaterialFactory.Create(shirt);

            // Simple "face" marker so facing direction reads on the placeholder capsule.
            var visor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            visor.name = "Visor";
            visor.transform.SetParent(go.transform, false);
            visor.transform.localPosition = new Vector3(0f, 1.5f, 0.3f);
            visor.transform.localScale = new Vector3(0.4f, 0.15f, 0.1f);
            DestroyImmediate(visor.GetComponent<BoxCollider>());
            visor.GetComponent<Renderer>().sharedMaterial = MaterialFactory.Create(new Color(0.1f, 0.1f, 0.1f));

            return go;
        }
    }
}
