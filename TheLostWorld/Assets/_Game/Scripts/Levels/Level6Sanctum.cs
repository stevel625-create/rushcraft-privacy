using LostWorld.Environment;
using LostWorld.Interaction;
using LostWorld.Missions;
using UnityEngine;

namespace LostWorld.Levels
{
    /// <summary>
    /// Level 6 — Heart of the Temple. Turn the three guardian statues to face the altar, open the inner
    /// chamber, hold the final seal together with Elena, and claim the relic.
    /// </summary>
    public class Level6Sanctum : ILevelBuilder
    {
        const string Enter = "enter_sanctum", Statues = "align_statues", Seal = "final_seal", Relic = "claim_relic";

        public static readonly LevelDefinition Definition = new LevelDefinition
        {
            Number = 6,
            Title = "Heart of the Temple",
            Subtitle = "What the jungle was hiding",
            Seed = 6607,
            Theme = new LevelTheme
            {
                Sky = new Color(0.07f, 0.07f, 0.13f),
                Fog = new Color(0.09f, 0.08f, 0.15f),
                FogDensity = 0.022f,
                Ambient = new Color(0.26f, 0.23f, 0.36f),
                SunColor = new Color(0.6f, 0.68f, 1f),
                SunIntensity = 0.45f,
                SunEuler = new Vector3(55f, 160f, 0f)
            },
            Objectives = new[]
            {
                new ObjectiveDef(Enter, "Enter the sanctum hall"),
                new ObjectiveDef(Statues, "Turn the guardian statues to face the altar"),
                new ObjectiveDef(Seal, "Hold the final seal together with Elena"),
                new ObjectiveDef(Relic, "Claim the relic"),
            },
            Builder = new Level6Sanctum()
        };

        const float HalfW = 15f, Back = 65f, Front = -5f, WallH = 8f, InnerWallZ = 32f;

        public LevelLayout Build(WorldKit kit)
        {
            var floor = kit.Mat(new Color(0.35f, 0.32f, 0.3f));
            var stone = kit.Mat(new Color(0.5f, 0.46f, 0.4f));
            var dark = kit.Mat(new Color(0.28f, 0.25f, 0.24f));
            var gold = kit.Mat(new Color(0.95f, 0.75f, 0.25f), 0.85f);
            var metal = kit.Mat(new Color(0.6f, 0.55f, 0.45f), 0.6f);
            var flame = kit.Mat(new Color(1f, 0.6f, 0.2f));
            var glass = kit.Mat(new Color(0.3f, 0.5f, 0.55f), 0.9f);

            var hall = kit.Group("Sanctum");
            float len = Back - Front;
            float midZ = (Back + Front) * 0.5f;

            // Shell: floor, outer walls, columns.
            kit.Box(new Vector3(0f, -0.25f, midZ), new Vector3(HalfW * 2f, 0.5f, len), floor, hall);
            kit.Box(new Vector3(-HalfW, WallH * 0.5f, midZ), new Vector3(1f, WallH, len), stone, hall);
            kit.Box(new Vector3(HalfW, WallH * 0.5f, midZ), new Vector3(1f, WallH, len), stone, hall);
            kit.Box(new Vector3(0f, WallH * 0.5f, Back), new Vector3(HalfW * 2f, WallH, 1f), stone, hall);
            kit.Box(new Vector3(0f, WallH * 0.5f, Front), new Vector3(HalfW * 2f, WallH, 1f), stone, hall);
            for (float z = 4f; z < Back - 2f; z += 6f)
            {
                if (Mathf.Abs(z - InnerWallZ) < 2f) continue;
                kit.Prim(PrimitiveType.Cylinder, new Vector3(-9f, WallH * 0.5f, z), new Vector3(1.4f, WallH * 0.5f, 1.4f), dark, hall);
                kit.Prim(PrimitiveType.Cylinder, new Vector3(9f, WallH * 0.5f, z), new Vector3(1.4f, WallH * 0.5f, 1.4f), dark, hall);
            }

            // Wall torches.
            foreach (float z in new[] { 8f, 26f, 44f, 58f })
            {
                kit.Flame(new Vector3(-HalfW + 0.9f, 3.2f, z), hall, flame);
                kit.Flame(new Vector3(HalfW - 0.9f, 3.2f, z), hall, flame);
            }

            // Inscription with the puzzle hint.
            var tablet = kit.Box(new Vector3(-4f, 1f, 6f), new Vector3(1.6f, 2f, 0.3f), dark, hall);
            tablet.name = "Inscription";
            kit.Examine(tablet, "Read inscription", "\"Only when the guardians look upon the heart will the way open.\"");

            // Inner wall with the statue-locked door.
            kit.Box(new Vector3(-(HalfW + 3f) * 0.5f, WallH * 0.5f, InnerWallZ), new Vector3(HalfW - 3f, WallH, 1f), stone, hall);
            kit.Box(new Vector3((HalfW + 3f) * 0.5f, WallH * 0.5f, InnerWallZ), new Vector3(HalfW - 3f, WallH, 1f), stone, hall);
            kit.Box(new Vector3(0f, WallH - 1f, InnerWallZ), new Vector3(6f, 2f, 1f), stone, hall);
            var innerDoor = kit.Door(new Vector3(0f, 3f, InnerWallZ), new Vector3(6f, 6f, 1.2f), dark, hall);

            // Guardian statues. Each must turn to face +Z (the altar); they start facing other ways.
            var statuePuzzle = hall.gameObject.AddComponent<StatuePuzzle>();
            statuePuzzle.Configure(Statues, innerDoor);
            int[] startSteps = { 1, 2, 3 };
            float[] xs = { -6f, 0f, 6f };
            for (int i = 0; i < 3; i++)
                statuePuzzle.Add(Statue(kit, new Vector3(xs[i], 0f, 22f), startSteps[i], stone, gold, hall));

            // Inner chamber: final co-op seal and the relic in a stone cage.
            Vector3 plateJason = new Vector3(-5f, 0.05f, 44f);
            Vector3 plateElena = new Vector3(5f, 0.05f, 44f);
            Vector3 altar = new Vector3(0f, 0f, 56f);
            kit.Box(altar + new Vector3(0f, 0.6f, 0f), new Vector3(2.4f, 1.2f, 2.4f), stone, hall);
            var relic = kit.Prim(PrimitiveType.Sphere, altar + new Vector3(0f, 1.65f, 0f), Vector3.one * 0.7f, gold, hall);
            relic.name = "Relic";
            kit.MakeInteractable(relic, "Take the relic");
            relic.AddComponent<InteractAction>().Configure(Relic,
                "The relic is warm in your hands. Elena: \"Jason... this changes everything.\"",
                "The relic is sealed behind the stone cage.");
            kit.PointLight(altar + Vector3.up * 3f, new Color(1f, 0.85f, 0.5f), 10f, 2.5f, hall);
            // Sits on the altar top (1.2 m) and encloses the relic; opening sinks it into the altar.
            var cage = kit.Door(altar + new Vector3(0f, 2.0f, 0f), new Vector3(1.8f, 1.6f, 1.8f), glass, hall);

            var seal = hall.gameObject.AddComponent<CooperativePuzzle>();
            seal.Configure(Seal, 1f);
            seal.AddPlate(kit.Plate(plateJason, metal, hall), Occupant.Jason);
            seal.AddPlate(kit.Plate(plateElena, metal, hall), Occupant.Elena);
            seal.SetDoor(cage);

            kit.Trigger(Enter, new Vector3(0f, 0f, 12f), 4f);
            kit.Checkpoint(new Vector3(0f, 0f, 38f));

            var layout = new LevelLayout
            {
                JasonSpawn = new Vector3(0f, 0.2f, 0f),
                ElenaSpawn = new Vector3(2f, 0.2f, -2f),
                KillY = -10f
            };
            layout.CompanionSpots[Seal] = plateElena;
            return layout;
        }

        /// <summary>Statue root carries the collider and interaction; children are the body and a gold "face".</summary>
        static RotatingStatue Statue(WorldKit kit, Vector3 pos, int startStep, Material body, Material face, Transform parent)
        {
            kit.Box(pos + new Vector3(0f, 0.3f, 0f), new Vector3(1.8f, 0.6f, 1.8f), body, parent);

            var root = new GameObject("GuardianStatue");
            root.transform.SetParent(parent, false);
            root.transform.position = pos + Vector3.up * 0.6f;
            var col = root.AddComponent<BoxCollider>();
            col.center = new Vector3(0f, 1.1f, 0f);
            col.size = new Vector3(1f, 2.2f, 1f);

            kit.Box(root.transform.position + new Vector3(0f, 1.1f, 0f), new Vector3(1f, 2.2f, 0.8f), body, root.transform, 0f, false);
            kit.Box(root.transform.position + new Vector3(0f, 1.7f, 0.45f), new Vector3(0.5f, 0.35f, 0.15f), face, root.transform, 0f, false);

            root.transform.rotation = Quaternion.Euler(0f, startStep * 90f, 0f);
            kit.MakeInteractable(root, "Turn statue");
            var statue = root.AddComponent<RotatingStatue>();
            statue.Configure(startStep, 0);
            return statue;
        }
    }
}
