using LostWorld.Environment;
using LostWorld.Missions;
using UnityEngine;

namespace LostWorld.Levels
{
    /// <summary>Level 1 — The Crash. Jungle crash site, ancient trail, temple entrance, first co-op plates.</summary>
    public class Level1Crash : ILevelBuilder
    {
        const string FindElena = "find_elena", Investigate = "investigate_crash", Trail = "follow_trail",
            Temple = "reach_temple", Puzzle = "coop_puzzle";

        public static readonly LevelDefinition Definition = new LevelDefinition
        {
            Number = 1,
            Title = "The Crash",
            Subtitle = "Find Elena and the way into the jungle",
            Seed = 1138,
            Theme = new LevelTheme(),
            Objectives = new[]
            {
                new ObjectiveDef(FindElena, "Find Elena"),
                new ObjectiveDef(Investigate, "Investigate the crash site: read the pilot's logbook"),
                new ObjectiveDef(Trail, "Follow the ancient trail"),
                new ObjectiveDef(Temple, "Reach the temple entrance"),
                new ObjectiveDef(Puzzle, "Solve the temple plates together with Elena"),
            },
            Builder = new Level1Crash()
        };

        static readonly Vector3 TempleCenter = new Vector3(0f, 0f, 110f);

        static float Height(float x, float z)
        {
            float n = Mathf.PerlinNoise(x * 0.045f + 50f, z * 0.045f + 50f) - 0.5f;
            float dCrash = Mathf.Sqrt(x * x + z * z);
            float dTemple = Mathf.Sqrt(x * x + (z - 110f) * (z - 110f));
            float flatten = Mathf.Clamp01((dCrash - 14f) / 20f) * Mathf.Clamp01((dTemple - 12f) / 18f);
            return n * 7f * flatten;
        }

        static float TrailX(float z) => Mathf.Sin(z * 0.05f) * 4f;

        public LevelLayout Build(WorldKit kit)
        {
            var ground = kit.Mat(new Color(0.22f, 0.36f, 0.16f));
            var trunk = kit.Mat(new Color(0.36f, 0.25f, 0.14f));
            var leaf = kit.Mat(new Color(0.12f, 0.42f, 0.14f));
            var rock = kit.Mat(new Color(0.42f, 0.42f, 0.40f));
            var metal = kit.Mat(new Color(0.55f, 0.55f, 0.58f), 0.6f);
            var stone = kit.Mat(new Color(0.62f, 0.58f, 0.48f));
            var path = kit.Mat(new Color(0.55f, 0.46f, 0.32f));
            var paper = kit.Mat(new Color(0.85f, 0.8f, 0.65f));

            kit.Ground(Vector3.zero, 170f, 80, Height, ground);

            // Trail stones (visual only; the ground collides).
            var trail = kit.Group("Trail");
            for (float z = 14f; z < 100f; z += 2.2f)
            {
                float x = TrailX(z);
                kit.Box(new Vector3(x, Height(x, z) + 0.02f, z), new Vector3(2.4f, 0.05f, 1.6f), path, trail,
                    Random.Range(-8f, 8f), false);
            }

            // Crash site
            var crash = kit.Group("CrashSite");
            var fuselage = kit.Prim(PrimitiveType.Cylinder, new Vector3(4f, 1.4f, 2f), new Vector3(2.2f, 7f, 2.2f), metal, crash);
            fuselage.transform.rotation = Quaternion.Euler(0, 25, 90);
            var wingA = kit.Box(new Vector3(-2f, 0.6f, -3f), new Vector3(9f, 0.25f, 2.6f), metal, crash);
            wingA.transform.rotation = Quaternion.Euler(-12, 35, 8);
            var wingB = kit.Box(new Vector3(7f, 0.4f, -4f), new Vector3(5f, 0.2f, 2f), metal, crash);
            wingB.transform.rotation = Quaternion.Euler(4, -20, -15);
            var fin = kit.Box(new Vector3(9f, 2.2f, 6f), new Vector3(0.25f, 3.5f, 2.2f), metal, crash);
            fin.transform.rotation = Quaternion.Euler(0, 40, 15);
            for (int i = 0; i < 8; i++)
            {
                var d = kit.Box(new Vector3(Random.Range(-8f, 8f), 0.2f, Random.Range(-8f, 8f)),
                    new Vector3(Random.Range(0.3f, 1.2f), Random.Range(0.2f, 0.6f), Random.Range(0.3f, 1.2f)), metal, crash);
                d.transform.rotation = Quaternion.Euler(Random.Range(0, 360f), Random.Range(0, 360f), 0);
            }

            var logbook = kit.Box(new Vector3(-1.2f, 0.25f, 1.2f), new Vector3(0.5f, 0.12f, 0.35f), paper, crash);
            logbook.name = "Logbook";
            kit.MakeInteractable(logbook, "Read logbook");
            logbook.AddComponent<InteractAction>().Configure(Investigate,
                "\"Engine fire over the ridge... heading for the old temple road, north.\"",
                "A charred logbook. Find Elena first.");

            var radio = kit.Box(new Vector3(2.2f, 0.3f, -1.5f), new Vector3(0.5f, 0.4f, 0.3f), metal, crash);
            radio.name = "BrokenRadio";
            kit.Examine(radio, "Inspect radio", "Dead. The antenna snapped in the crash.");

            // Temple entrance with co-op plates and a door that opens on success.
            var temple = kit.Group("Temple");
            Vector3 c = TempleCenter;
            for (int i = 0; i < 3; i++)
                kit.Box(c + new Vector3(0, 0.3f + i * 0.4f, 0), new Vector3(16 - i * 2, 0.4f, 16 - i * 2), stone, temple);
            kit.Box(c + new Vector3(-4.5f, 4f, -6f), new Vector3(2.4f, 8f, 3f), stone, temple);
            kit.Box(c + new Vector3(4.5f, 4f, -6f), new Vector3(2.4f, 8f, 3f), stone, temple);
            kit.Box(c + new Vector3(0f, 8.6f, -6f), new Vector3(12f, 1.6f, 3.2f), stone, temple);
            var door = kit.Door(c + new Vector3(0f, 3.4f, -6f), new Vector3(6.6f, 4.4f, 1.2f), rock, temple);

            Vector3 plateJason = c + new Vector3(-3f, 1.45f, 3f);
            Vector3 plateElena = c + new Vector3(3f, 1.45f, 3f);
            var puzzle = temple.gameObject.AddComponent<CooperativePuzzle>();
            puzzle.Configure(Puzzle);
            puzzle.AddPlate(kit.Plate(plateJason, metal, temple), Occupant.Jason);
            puzzle.AddPlate(kit.Plate(plateElena, metal, temple), Occupant.Elena);
            puzzle.SetDoor(door);

            // Vegetation, kept off the spawn, trail and plaza.
            var veg = kit.Group("Vegetation");
            bool Clear(Vector2 p) =>
                p.magnitude < 16f ||
                (Mathf.Abs(p.x - TrailX(p.y)) < 5f && p.y > 10f && p.y < 105f) ||
                Vector2.Distance(p, new Vector2(0f, 110f)) < 20f;

            Scatter(90, 79f, Clear, p => kit.Tree(new Vector3(p.x, Height(p.x, p.y), p.y), veg, trunk, leaf));
            Scatter(40, 79f, Clear, p =>
            {
                float s = Random.Range(0.8f, 2.4f);
                kit.Prim(PrimitiveType.Sphere, new Vector3(p.x, Height(p.x, p.y) + s * 0.2f, p.y), new Vector3(s, s * 0.7f, s), rock, veg);
            });
            Scatter(60, 79f, Clear, p =>
            {
                float s = Random.Range(1.2f, 2.2f);
                kit.Prim(PrimitiveType.Sphere, new Vector3(p.x, Height(p.x, p.y) + s * 0.4f, p.y), new Vector3(s, s * 0.8f, s), leaf, veg, 0f, false);
            });

            var elena = new Vector3(-14f, Height(-14f, 8f) + 0.2f, 8f);
            kit.Trigger(FindElena, elena, 4f);
            kit.Trigger(Trail, new Vector3(0f, Height(0f, 45f), 45f), 5f);
            kit.Trigger(Temple, new Vector3(0f, Height(0f, 100f), 100f), 6f);
            kit.Checkpoint(new Vector3(0f, Height(0f, 45f), 45f));

            var layout = new LevelLayout
            {
                JasonSpawn = new Vector3(0f, Height(0f, 0f) + 0.2f, 0f),
                ElenaSpawn = elena,
                KillY = -30f
            };
            layout.CompanionSpots[FindElena] = elena; // she waits where she landed until Jason finds her
            layout.CompanionSpots[Puzzle] = plateElena;
            return layout;
        }

        /// <summary>Random placement in a disc, skipping cleared areas. Bounded attempts so it never hangs.</summary>
        internal static void Scatter(int count, float radius, System.Func<Vector2, bool> isClear, System.Action<Vector2> place)
        {
            int placed = 0;
            for (int attempt = 0; placed < count && attempt < count * 10; attempt++)
            {
                Vector2 p = Random.insideUnitCircle * radius;
                if (isClear(p)) continue;
                place(p);
                placed++;
            }
        }
    }
}
