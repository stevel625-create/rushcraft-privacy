using LostWorld.Environment;
using LostWorld.Missions;
using UnityEngine;

namespace LostWorld.Levels
{
    /// <summary>
    /// Level 2 — The Sunken Gate. Hop the stepping stones across a flooded river, then Elena holds the
    /// gate plate while Jason passes through to the river shrine. Falling in the water = back to checkpoint.
    /// </summary>
    public class Level2SunkenGate : ILevelBuilder
    {
        const string Cross = "cross_river", HoldGate = "hold_gate", Shrine = "reach_shrine";

        public static readonly LevelDefinition Definition = new LevelDefinition
        {
            Number = 2,
            Title = "The Sunken Gate",
            Subtitle = "Cross the flooded ruins",
            Seed = 2203,
            Theme = new LevelTheme
            {
                Sky = new Color(0.5f, 0.62f, 0.68f),
                Fog = new Color(0.55f, 0.66f, 0.7f),
                FogDensity = 0.02f,
                Ambient = new Color(0.4f, 0.47f, 0.5f),
                SunColor = new Color(0.9f, 0.92f, 1f),
                SunIntensity = 0.9f,
                SunEuler = new Vector3(40f, 20f, 0f)
            },
            Objectives = new[]
            {
                new ObjectiveDef(Cross, "Cross the flooded river on the stepping stones"),
                new ObjectiveDef(HoldGate, "Let Elena hold the gate plate"),
                new ObjectiveDef(Shrine, "Go through the gate to the river shrine"),
            },
            Builder = new Level2SunkenGate()
        };

        const float RiverStart = 10f, RiverEnd = 30f, WallZ = 52f;

        static float Height(float x, float z)
        {
            float bank = Mathf.PerlinNoise(x * 0.05f + 7f, z * 0.05f + 3f) * 1.5f;
            // Channel: smoothly drops to -4 m between the banks.
            float inChannel = Mathf.Clamp01(Mathf.Min(z - RiverStart, RiverEnd - z) / 3f);
            return Mathf.Lerp(bank, -4f, inChannel);
        }

        public LevelLayout Build(WorldKit kit)
        {
            var ground = kit.Mat(new Color(0.25f, 0.38f, 0.2f));
            var water = kit.Mat(new Color(0.15f, 0.35f, 0.42f), 0.9f);
            var stone = kit.Mat(new Color(0.5f, 0.52f, 0.48f));
            var moss = kit.Mat(new Color(0.3f, 0.42f, 0.28f));
            var trunk = kit.Mat(new Color(0.33f, 0.24f, 0.15f));
            var leaf = kit.Mat(new Color(0.15f, 0.4f, 0.2f));
            var metal = kit.Mat(new Color(0.6f, 0.55f, 0.4f), 0.5f);

            kit.Ground(new Vector3(0f, 0f, 30f), 130f, 64, Height, ground);
            kit.Liquid(new Vector3(0f, -0.9f, 20f), new Vector2(130f, RiverEnd - RiverStart + 6f), water, kill: true);

            // Stepping stones: zig-zag line, gaps of ~1.5-2 m (a running jump clears ~4 m).
            var stones = kit.Group("SteppingStones");
            float[] xs = { 0f, 2.2f, 0.5f, -1.8f, 0f, 2f, 0.4f };
            for (int i = 0; i < xs.Length; i++)
            {
                float z = RiverStart + 1.5f + i * 2.8f;
                var s = kit.Prim(PrimitiveType.Cylinder, new Vector3(xs[i], -1.2f, z), new Vector3(1.8f, 1.25f, 1.8f), i % 2 == 0 ? stone : moss, stones);
                s.name = "Stone_" + i;
            }

            // Sunken ruins for atmosphere.
            var ruins = kit.Group("Ruins");
            for (int i = 0; i < 10; i++)
            {
                float x = Random.Range(-30f, 30f);
                if (Mathf.Abs(x) < 6f) x += Mathf.Sign(x) * 6f;
                float h = Random.Range(1.5f, 5f);
                var col = kit.Prim(PrimitiveType.Cylinder, new Vector3(x, -1.5f + h * 0.5f, Random.Range(RiverStart, RiverEnd)),
                    new Vector3(1.2f, h * 0.5f, 1.2f), stone, ruins);
                col.transform.rotation = Quaternion.Euler(Random.Range(-15f, 15f), 0f, Random.Range(-15f, 15f));
            }

            // Gate wall spanning the whole valley, with a sliding gate in the middle.
            var gate = kit.Group("GateWall");
            kit.Box(new Vector3(-35f, 3f, WallZ), new Vector3(64f, 8f, 2f), stone, gate);
            kit.Box(new Vector3(35f, 3f, WallZ), new Vector3(64f, 8f, 2f), stone, gate);
            kit.Box(new Vector3(0f, 6.5f, WallZ), new Vector3(6f, 3f, 2f), stone, gate);
            var door = kit.Door(new Vector3(0f, 2.5f, WallZ), new Vector3(6f, 5f, 1.6f), moss, gate);

            Vector3 plate = new Vector3(7f, Height(7f, WallZ - 6f) + 0.05f, WallZ - 6f);
            var puzzle = gate.gameObject.AddComponent<CooperativePuzzle>();
            puzzle.Configure(HoldGate, 0.6f);
            puzzle.AddPlate(kit.Plate(plate, metal, gate), Occupant.Elena);
            puzzle.SetDoor(door);

            // Shrine beyond the gate.
            var shrine = kit.Group("Shrine");
            Vector3 sc = new Vector3(0f, Height(0f, 72f), 72f);
            kit.Box(sc + new Vector3(0, 0.25f, 0), new Vector3(8f, 0.5f, 8f), stone, shrine);
            for (int i = 0; i < 4; i++)
            {
                float a = i * Mathf.PI * 0.5f + Mathf.PI * 0.25f;
                kit.Prim(PrimitiveType.Cylinder, sc + new Vector3(Mathf.Cos(a) * 3f, 2.5f, Mathf.Sin(a) * 3f), new Vector3(0.7f, 2.2f, 0.7f), stone, shrine);
            }
            kit.Box(sc + new Vector3(0, 4.9f, 0), new Vector3(7.5f, 0.6f, 7.5f), stone, shrine);

            // Banks vegetation, kept off the path.
            var veg = kit.Group("Vegetation");
            Level1Crash.Scatter(55, 60f, p => Mathf.Abs(p.x) < 9f || (p.y + 30f > RiverStart - 3f && p.y + 30f < RiverEnd + 3f),
                p => kit.Tree(new Vector3(p.x, Height(p.x, p.y + 30f), p.y + 30f), veg, trunk, leaf));

            kit.Trigger(Cross, new Vector3(0f, Height(0f, RiverEnd + 5f), RiverEnd + 5f), 4f);
            kit.Trigger(Shrine, sc, 4f);
            kit.Checkpoint(new Vector3(0f, Height(0f, RiverEnd + 5f), RiverEnd + 5f));

            var layout = new LevelLayout
            {
                JasonSpawn = new Vector3(0f, Height(0f, -5f) + 0.2f, -5f),
                ElenaSpawn = new Vector3(2f, Height(2f, -7f) + 0.2f, -7f),
                KillY = -6f
            };
            layout.CompanionSpots[HoldGate] = plate;
            return layout;
        }
    }
}
