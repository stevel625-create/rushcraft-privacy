using LostWorld.Companion;
using LostWorld.Environment;
using LostWorld.Interaction;
using LostWorld.Missions;
using LostWorld.Monetization;
using LostWorld.Player;
using LostWorld.Save;
using LostWorld.UI;
using UnityEngine;

namespace LostWorld.Core
{
    /// <summary>
    /// Entry point for Chapter 1. Put this on ONE empty GameObject in an otherwise empty scene
    /// and press Play. It builds the jungle, Jason, Elena, camera, mission system, HUD, and menu at runtime.
    /// </summary>
    public class GameBootstrap : MonoBehaviour
    {
        [SerializeField] bool buildOnStart = true;

        public static GameBootstrap Instance { get; private set; }
        public IStoreService Store { get; private set; }

        GameObject _jason, _elena;
        PlayerController _player;
        CompanionFollower _companion;
        ThirdPersonCamera _cam;
        MissionManager _missions;
        GameHUD _hud;
        MainMenu _menu;
        CooperativePuzzle _puzzle;
        JungleBuilder _jungle;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;

            gameObject.AddComponent<InputRouter>();
            Store = StoreServiceFactory.Create();
            Store.Initialise(_ => { });

            if (buildOnStart) BuildWorld();
        }

        void BuildWorld()
        {
            SetupLighting();

            // Jungle
            var jungleGo = new GameObject("Jungle");
            _jungle = jungleGo.AddComponent<JungleBuilder>();
            _jungle.Build();

            // Managers
            var missionsGo = new GameObject("MissionManager");
            _missions = missionsGo.AddComponent<MissionManager>();

            // Characters
            _jason = CreateHuman("Jason", _jungle.JasonSpawn, new Color(0.15f, 0.35f, 0.7f));
            _player = _jason.AddComponent<PlayerController>();
            _jason.AddComponent<InteractionDetector>();
            _jason.tag = "Untagged";

            _elena = CreateHuman("Elena", _jungle.ElenaSpawn, new Color(0.85f, 0.45f, 0.55f));
            _companion = _elena.AddComponent<CompanionFollower>();
            _companion.Leader = _jason.transform;

            // Camera
            Camera cam = Camera.main;
            if (cam == null)
            {
                var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
                cam = camGo.AddComponent<Camera>();
                camGo.AddComponent<AudioListener>();
            }
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.55f, 0.72f, 0.82f);
            cam.fieldOfView = 60f;
            _cam = cam.gameObject.GetComponent<ThirdPersonCamera>() ?? cam.gameObject.AddComponent<ThirdPersonCamera>();
            _cam.Target = _jason.transform;
            _player.SetCamera(cam.transform);

            // Puzzle wiring
            WirePuzzle();

            // HUD and menu
            _hud = GameHUD.Create();
            _hud.SaveRequested += SaveCheckpoint;
            _hud.PauseToggled += TogglePause;
            _hud.MainMenuRequested += ReturnToMenu;

            _menu = MainMenu.Create(this);
            _menu.Show(hasSave: SaveSystem.HasSave());
            _player.ControlsEnabled = false;
        }

        void WirePuzzle()
        {
            var puzzleGo = new GameObject("CooperativePuzzle");
            _puzzle = puzzleGo.AddComponent<CooperativePuzzle>();
            var (a, b) = _jungle.Puzzle;
            _puzzle.SetPlates(AddPlate(a), AddPlate(b));
            _puzzle.SetVisual(_jungle.SolvedGate);

            // Elena must stand on her plate for the puzzle. Script her there when the puzzle mission starts,
            // then hand her back to following afterwards.
            _missions.MissionStarted += OnMissionStarted;
        }

        void OnMissionStarted(LostWorld.Missions.MissionId id)
        {
            if (id == LostWorld.Missions.MissionId.CooperativePuzzle)
                _companion.WalkTo(_jungle.Puzzle.b.transform.position);
            else if (_companion.CurrentState == CompanionFollower.State.Scripted)
                _companion.ReturnToFollowing();
        }

        static PressurePlate AddPlate(GameObject go)
        {
            var c = go.GetComponent<Collider>();
            if (c) c.isTrigger = true;
            return go.AddComponent<PressurePlate>();
        }

        // ---------- Menu / game flow ----------

        public void StartNewGame()
        {
            SaveSystem.Delete();
            ResetWorldToStart();
            BeginPlay();
        }

        public void Continue()
        {
            var data = SaveSystem.Read();
            if (data == null)
            {
                StartNewGame();
                return;
            }
            _missions.SetMissionSilently((MissionId)data.missionIndex);
            if (data.puzzleSolved) _puzzle.RestoreSolved();
            _player.Warp(SaveSystem.PositionOf(data), Quaternion.Euler(0, data.playerYaw, 0));
            _cam.Snap();
            BeginPlay();
        }

        void ResetWorldToStart()
        {
            _missions.SetMissionSilently(MissionId.FindElena);
            _player.Warp(_jungle.JasonSpawn, Quaternion.identity);
            _elena.GetComponent<CharacterController>().enabled = false;
            _elena.transform.position = _jungle.ElenaSpawn;
            _elena.GetComponent<CharacterController>().enabled = true;
            _companion.ReturnToFollowing();
            _cam.Snap();
        }

        void BeginPlay()
        {
            // Continue skips MissionStarted, so apply the current mission's companion behaviour here.
            OnMissionStarted(_missions.Current);
            _menu.Hide();
            _player.ControlsEnabled = true;
            GameState.SetPaused(false);
            _hud.Toast("Find Elena", 3f);
        }

        public void SaveCheckpoint()
        {
            var data = SaveSystem.Capture(_missions.Current, _jason.transform.position,
                _jason.transform.eulerAngles.y, _puzzle.Solved);
            bool ok = SaveSystem.Write(data);
            _hud.Toast(ok ? "Checkpoint saved" : "Save failed - storage unavailable", 2f);
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
            _player.ControlsEnabled = false;
            _menu.Show(hasSave: SaveSystem.HasSave());
        }

        public void ShowToast(string message) => _hud.Toast(message);

        // ---------- Scene setup ----------

        static void SetupLighting()
        {
            var sun = FindObjectOfType<Light>();
            if (sun == null)
            {
                var go = new GameObject("Sun");
                sun = go.AddComponent<Light>();
                sun.type = LightType.Directional;
            }
            sun.color = new Color(1f, 0.93f, 0.8f);
            sun.intensity = 1.1f;
            sun.shadows = LightShadows.Soft;
            sun.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.45f, 0.5f, 0.45f);
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExpDensity;
            RenderSettings.fogColor = new Color(0.6f, 0.75f, 0.78f);
            RenderSettings.fogDensity = 0.012f;
        }

        static GameObject CreateHuman(string name, Vector3 pos, Color shirt)
        {
            var go = new GameObject(name);
            go.transform.position = pos;

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
            Object.Destroy(body.GetComponent<CapsuleCollider>());
            var mat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard")) { color = shirt };
            body.GetComponent<Renderer>().sharedMaterial = mat;

            return go;
        }
    }
}
