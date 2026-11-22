using LostWorld.Core;
using LostWorld.Interaction;
using LostWorld.Missions;
using UnityEngine;

namespace LostWorld.Environment
{
    /// <summary>
    /// Procedurally builds the Chapter 1 jungle from primitives and generated meshes.
    /// No paid assets. Deterministic for a given seed. Call Build() once (GameBootstrap does this).
    /// Layout (metres, world space): crash site at origin, trail runs north (+Z), temple at Z = 110.
    /// </summary>
    public class JungleBuilder : MonoBehaviour
    {
        [Header("Terrain")]
        [SerializeField] int seed = 1138;
        [SerializeField] int gridSize = 80;        // quads per side
        [SerializeField] float worldSize = 170f;   // metres per side
        [SerializeField] float heightAmplitude = 3.5f;
        [SerializeField] float noiseScale = 0.045f;

        [Header("Density (lower = faster on mobile)")]
        [SerializeField] int treeCount = 90;
        [SerializeField] int rockCount = 40;
        [SerializeField] int bushCount = 60;

        public Vector3 JasonSpawn { get; private set; }
        public Vector3 ElenaSpawn { get; private set; }

        Material _ground, _trunk, _leaf, _rock, _metal, _stone, _path, _glow;
        Transform _root;

        public void Build()
        {
            Random.InitState(seed);
            _root = new GameObject("JungleRoot").transform;
            _root.SetParent(transform, false);

            CreateMaterials();
            BuildGround();
            BuildTrail();
            BuildCrashSite();
            BuildTemple();
            ScatterVegetation();

            JasonSpawn = new Vector3(0f, SampleHeight(0f, 0f) + 0.2f, 0f);
            ElenaSpawn = new Vector3(-14f, SampleHeight(-14f, 8f) + 0.2f, 8f);
            BuildMissionTriggers();
        }

        // ---------- Materials (URP Lit with Standard fallback) ----------

        void CreateMaterials()
        {
            _ground = MakeMat(new Color(0.22f, 0.36f, 0.16f));
            _trunk = MakeMat(new Color(0.36f, 0.25f, 0.14f));
            _leaf = MakeMat(new Color(0.12f, 0.42f, 0.14f));
            _rock = MakeMat(new Color(0.42f, 0.42f, 0.40f));
            _metal = MakeMat(new Color(0.55f, 0.55f, 0.58f), 0.6f);
            _stone = MakeMat(new Color(0.62f, 0.58f, 0.48f));
            _path = MakeMat(new Color(0.55f, 0.46f, 0.32f));
            _glow = MakeMat(new Color(0.3f, 0.9f, 1f));
        }

        static Material MakeMat(Color c, float smooth = 0.2f) => MaterialFactory.Create(c, smooth);

        // ---------- Terrain ----------

        float SampleHeight(float x, float z)
        {
            float n = Mathf.PerlinNoise(x * noiseScale + seed, z * noiseScale + seed) - 0.5f;
            float h = n * heightAmplitude * 2f;
            // Flatten around the crash site and the temple plaza so gameplay spots stay level.
            float dCrash = Mathf.Sqrt(x * x + z * z);
            float dTemple = Mathf.Sqrt(x * x + (z - 110f) * (z - 110f));
            float flatten = Mathf.Clamp01((dCrash - 14f) / 20f) * Mathf.Clamp01((dTemple - 12f) / 18f);
            return h * flatten;
        }

        void BuildGround()
        {
            int v = gridSize + 1;
            var verts = new Vector3[v * v];
            var uvs = new Vector2[v * v];
            float step = worldSize / gridSize;
            float half = worldSize * 0.5f;

            for (int z = 0; z < v; z++)
                for (int x = 0; x < v; x++)
                {
                    float wx = x * step - half;
                    float wz = z * step - half;
                    verts[z * v + x] = new Vector3(wx, SampleHeight(wx, wz), wz);
                    uvs[z * v + x] = new Vector2(x, z) * 0.25f;
                }

            var tris = new int[gridSize * gridSize * 6];
            int t = 0;
            for (int z = 0; z < gridSize; z++)
                for (int x = 0; x < gridSize; x++)
                {
                    int i = z * v + x;
                    tris[t++] = i; tris[t++] = i + v; tris[t++] = i + 1;
                    tris[t++] = i + 1; tris[t++] = i + v; tris[t++] = i + v + 1;
                }

            var mesh = new Mesh { name = "JungleGround", indexFormat = UnityEngine.Rendering.IndexFormat.UInt32 };
            mesh.vertices = verts;
            mesh.uv = uvs;
            mesh.triangles = tris;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();

            var go = new GameObject("Ground");
            go.transform.SetParent(_root, false);
            go.AddComponent<MeshFilter>().sharedMesh = mesh;
            go.AddComponent<MeshRenderer>().sharedMaterial = _ground;
            go.AddComponent<MeshCollider>().sharedMesh = mesh;
        }

        // ---------- Trail & temple ----------

        void BuildTrail()
        {
            var parent = NewChild("Trail");
            for (float z = 14f; z < 100f; z += 2.2f)
            {
                float x = Mathf.Sin(z * 0.05f) * 4f;
                var stone = Prim(PrimitiveType.Cube, new Vector3(x, SampleHeight(x, z) + 0.02f, z),
                    new Vector3(2.4f, 0.05f, 1.6f), _path, parent);
                stone.transform.rotation = Quaternion.Euler(0, Random.Range(-8f, 8f), 0);
                Destroy(stone.GetComponent<BoxCollider>()); // path is visual only; the ground collides
            }
        }

        void BuildTemple()
        {
            var parent = NewChild("Temple");
            Vector3 c = new Vector3(0f, SampleHeight(0f, 110f), 110f);

            // Stepped plaza
            for (int i = 0; i < 3; i++)
                Prim(PrimitiveType.Cube, c + new Vector3(0, 0.3f + i * 0.4f, 0), new Vector3(16 - i * 2, 0.4f, 16 - i * 2), _stone, parent);

            // Entrance facade: two pillars + lintel + dark doorway
            Prim(PrimitiveType.Cube, c + new Vector3(-4.5f, 4f, -6f), new Vector3(2.4f, 8f, 3f), _stone, parent);
            Prim(PrimitiveType.Cube, c + new Vector3(4.5f, 4f, -6f), new Vector3(2.4f, 8f, 3f), _stone, parent);
            Prim(PrimitiveType.Cube, c + new Vector3(0f, 8.6f, -6f), new Vector3(12f, 1.6f, 3.2f), _stone, parent);
            Prim(PrimitiveType.Cube, c + new Vector3(0f, 2.2f, -6.2f), new Vector3(5.2f, 4.4f, 1f), _rock, parent);
            var doorway = Prim(PrimitiveType.Cube, c + new Vector3(0f, 2.2f, -6.8f), new Vector3(4f, 3.8f, 0.2f), _glow, parent);
            doorway.name = "TempleDoorGlow";
            Destroy(doorway.GetComponent<BoxCollider>());

            // Puzzle plates in front of the temple
            var plateA = Prim(PrimitiveType.Cylinder, c + new Vector3(-3f, 0.5f, 3f), new Vector3(1.6f, 0.05f, 1.6f), _metal, parent);
            var plateB = Prim(PrimitiveType.Cylinder, c + new Vector3(3f, 0.5f, 3f), new Vector3(1.6f, 0.05f, 1.6f), _metal, parent);
            plateA.name = "PlateJason"; plateB.name = "PlateElena";
            Puzzle = (plateA, plateB);

            var solvedGate = Prim(PrimitiveType.Cube, c + new Vector3(0f, 2.2f, -6.8f), new Vector3(4f, 3.8f, 0.3f), _glow, parent);
            solvedGate.SetActive(false);
            SolvedGate = solvedGate;
        }

        public (GameObject a, GameObject b) Puzzle { get; private set; }
        public GameObject SolvedGate { get; private set; }

        // ---------- Crash site ----------

        void BuildCrashSite()
        {
            var parent = NewChild("CrashSite");
            Vector3 c = new Vector3(0f, SampleHeight(0f, 0f), 0f);

            // Fuselage: a cylinder lying on its side, half buried.
            var fuselage = Prim(PrimitiveType.Cylinder, c + new Vector3(4f, 1.4f, 2f), new Vector3(2.2f, 7f, 2.2f), _metal, parent);
            fuselage.transform.rotation = Quaternion.Euler(0, 25, 90);
            fuselage.name = "Fuselage";

            // Wing sections
            var wingA = Prim(PrimitiveType.Cube, c + new Vector3(-2f, 0.6f, -3f), new Vector3(9f, 0.25f, 2.6f), _metal, parent);
            wingA.transform.rotation = Quaternion.Euler(-12, 35, 8);
            var wingB = Prim(PrimitiveType.Cube, c + new Vector3(7f, 0.4f, -4f), new Vector3(5f, 0.2f, 2f), _metal, parent);
            wingB.transform.rotation = Quaternion.Euler(4, -20, -15);

            // Tail fin and debris
            var fin = Prim(PrimitiveType.Cube, c + new Vector3(9f, 2.2f, 6f), new Vector3(0.25f, 3.5f, 2.2f), _metal, parent);
            fin.transform.rotation = Quaternion.Euler(0, 40, 15);
            for (int i = 0; i < 8; i++)
            {
                Vector3 p = c + new Vector3(Random.Range(-8f, 8f), 0.2f, Random.Range(-8f, 8f));
                var d = Prim(PrimitiveType.Cube, p, Random.insideUnitSphere.Abs() * 0.9f + Vector3.one * 0.3f, _metal, parent);
                d.transform.rotation = Quaternion.Euler(Random.Range(0, 360f), Random.Range(0, 360f), 0);
            }

            // Crash-site interactables: a logbook and a broken radio (feed the mission 2 trigger).
            var logbook = Prim(PrimitiveType.Cube, c + new Vector3(-1.2f, 0.25f, 1.2f), new Vector3(0.4f, 0.1f, 0.3f), _trunk, parent);
            logbook.name = "Logbook";
            var it = logbook.AddComponent<Interactable>();
            SetPrompt(it, "Read logbook");

            var radio = Prim(PrimitiveType.Cube, c + new Vector3(2.2f, 0.3f, -1.5f), new Vector3(0.5f, 0.4f, 0.3f), _metal, parent);
            radio.name = "BrokenRadio";
            SetPrompt(radio.AddComponent<Interactable>(), "Inspect radio");
        }

        static void SetPrompt(Interactable it, string text) => it.SetPrompt(text);

        // ---------- Vegetation ----------

        void ScatterVegetation()
        {
            var parent = NewChild("Vegetation");
            float half = worldSize * 0.5f - 6f;

            for (int i = 0; i < treeCount; i++)
            {
                Vector2 p = Random.insideUnitCircle * half;
                if (IsClearZone(p)) { i--; continue; }
                PlaceTree(new Vector3(p.x, SampleHeight(p.x, p.y), p.y), parent);
            }
            for (int i = 0; i < rockCount; i++)
            {
                Vector2 p = Random.insideUnitCircle * half;
                if (IsClearZone(p)) { i--; continue; }
                float s = Random.Range(0.8f, 2.4f);
                var r = Prim(PrimitiveType.Sphere, new Vector3(p.x, SampleHeight(p.x, p.y) + s * 0.2f, p.y),
                    new Vector3(s, s * 0.7f, s), _rock, parent);
                r.transform.rotation = Quaternion.Euler(0, Random.Range(0, 360f), 0);
            }
            for (int i = 0; i < bushCount; i++)
            {
                Vector2 p = Random.insideUnitCircle * half;
                if (IsClearZone(p)) { i--; continue; }
                float s = Random.Range(1.2f, 2.2f);
                Prim(PrimitiveType.Sphere, new Vector3(p.x, SampleHeight(p.x, p.y) + s * 0.4f, p.y),
                    new Vector3(s, s * 0.8f, s), _leaf, parent);
            }
        }

        void PlaceTree(Vector3 basePos, Transform parent)
        {
            float h = Random.Range(5f, 9f);
            var trunk = Prim(PrimitiveType.Cylinder, basePos + Vector3.up * h * 0.5f,
                new Vector3(0.35f, h * 0.5f, 0.35f), _trunk, parent);
            trunk.name = "TreeTrunk";
            // Trunk collider only; canopy is visual, so Jason can walk under it.
            var canopy = Prim(PrimitiveType.Sphere, basePos + Vector3.up * (h + 0.6f),
                Vector3.one * Random.Range(2.6f, 3.8f), _leaf, parent);
            canopy.name = "TreeCanopy";
            Destroy(canopy.GetComponent<SphereCollider>());
        }

        bool IsClearZone(Vector2 p)
        {
            // Keep spawn, the trail corridor, and the temple plaza free of trees and rocks.
            if (p.magnitude < 16f) return true;
            if (Mathf.Abs(p.x - Mathf.Sin(p.y * 0.05f) * 4f) < 5f && p.y > 10f && p.y < 105f) return true;
            if (Vector2.Distance(p, new Vector2(0f, 110f)) < 20f) return true;
            return false;
        }

        // ---------- Mission triggers ----------

        void BuildMissionTriggers()
        {
            var parent = NewChild("MissionTriggers");
            AddTrigger(parent, "Trig_FindElena", MissionId.FindElena, ElenaSpawn, 4f);
            AddTrigger(parent, "Trig_CrashSite", MissionId.InvestigateCrash, new Vector3(0, 1, 0), 6f);
            AddTrigger(parent, "Trig_Trail", MissionId.FollowAncientTrail, new Vector3(0, SampleHeight(0, 45), 45), 5f);
            AddTrigger(parent, "Trig_Temple", MissionId.ReachTemple, new Vector3(0, SampleHeight(0, 100), 100), 6f);
        }

        static void AddTrigger(Transform parent, string name, MissionId id, Vector3 pos, float radius)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.position = pos + Vector3.up * 1f;
            var sc = go.AddComponent<SphereCollider>();
            sc.isTrigger = true;
            sc.radius = radius;
            go.AddComponent<MissionTrigger>().Configure(id);
        }

        // ---------- Helpers ----------

        Transform NewChild(string name)
        {
            var go = new GameObject(name);
            go.transform.SetParent(_root, false);
            return go.transform;
        }

        static GameObject Prim(PrimitiveType type, Vector3 pos, Vector3 scale, Material mat, Transform parent)
        {
            var go = GameObject.CreatePrimitive(type);
            go.transform.SetParent(parent, false);
            go.transform.position = pos;
            go.transform.localScale = scale;
            go.GetComponent<Renderer>().sharedMaterial = mat;
            return go;
        }
    }

    static class Vector3Extensions
    {
        public static Vector3 Abs(this Vector3 v) => new Vector3(Mathf.Abs(v.x), Mathf.Abs(v.y), Mathf.Abs(v.z));
    }
}
