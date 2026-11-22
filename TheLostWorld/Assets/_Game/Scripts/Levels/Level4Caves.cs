using LostWorld.Environment;
using LostWorld.Missions;
using UnityEngine;

namespace LostWorld.Levels
{
    /// <summary>
    /// Level 4 — The Echo Caves. A dark maze under the mountain. Light the three braziers to open the
    /// stone door, then find the way out. The maze is built from the ASCII map below.
    /// </summary>
    public class Level4Caves : ILevelBuilder
    {
        const string Braziers = "light_braziers", Exit = "find_exit";
        const float Cell = 4f, WallH = 5f;

        public static readonly LevelDefinition Definition = new LevelDefinition
        {
            Number = 4,
            Title = "The Echo Caves",
            Subtitle = "Bring light to the dark",
            Seed = 4409,
            Theme = new LevelTheme
            {
                Sky = new Color(0.03f, 0.03f, 0.04f),
                Fog = new Color(0.04f, 0.04f, 0.05f),
                FogDensity = 0.035f,
                Ambient = new Color(0.16f, 0.15f, 0.18f),
                SunColor = new Color(0.6f, 0.65f, 0.8f),
                SunIntensity = 0.15f,
                SunEuler = new Vector3(70f, 0f, 0f)
            },
            Objectives = new[]
            {
                new ObjectiveDef(Braziers, "Light the braziers"),
                new ObjectiveDef(Exit, "Find the way out of the caves"),
            },
            Builder = new Level4Caves()
        };

        // S start, B brazier, D door (opens when all braziers are lit), E exit, C glowing crystal, # rock.
        // Checked: every B is reachable from S with the door shut; E is reachable only through D.
        static readonly string[] Map =
        {
            "#############",
            "#S....#.....#",
            "#.###.#.###.#",
            "#.#B..#..C#.#",
            "#.#####.#.#.#",
            "#..C....#.#B#",
            "###.#####.#.#",
            "#B..#.....#.#",
            "#.###.###.#.#",
            "#.....#E.D.C#",
            "#############",
        };

        static Vector3 CellPos(int row, int col) => new Vector3(col * Cell, 0f, -row * Cell);

        public LevelLayout Build(WorldKit kit)
        {
            var rock = kit.Mat(new Color(0.24f, 0.22f, 0.21f));
            var floorMat = kit.Mat(new Color(0.18f, 0.17f, 0.16f));
            var bronze = kit.Mat(new Color(0.55f, 0.4f, 0.2f), 0.5f);
            var flame = kit.Mat(new Color(1f, 0.6f, 0.2f));
            var crystal = kit.Mat(new Color(0.4f, 0.75f, 1f), 0.9f);
            var doorMat = kit.Mat(new Color(0.38f, 0.33f, 0.28f));

            int rows = Map.Length, cols = Map[0].Length;
            var cave = kit.Group("Cave");
            Vector3 center = new Vector3((cols - 1) * Cell * 0.5f, 0f, -(rows - 1) * Cell * 0.5f);

            kit.Box(center + Vector3.down * 0.25f, new Vector3(cols * Cell, 0.5f, rows * Cell), floorMat, cave);
            // Roof: no collider needed, but it casts shadow so the maze stays dark.
            kit.Box(center + Vector3.up * (WallH + 0.25f), new Vector3(cols * Cell, 0.5f, rows * Cell), rock, cave, 0f, false);

            var counter = cave.gameObject.AddComponent<CountedObjective>();
            Vector3 start = Vector3.zero, exit = Vector3.zero, elena = Vector3.zero;
            int brazierCount = 0;
            SlidingDoor door = null;

            for (int r = 0; r < rows; r++)
                for (int c = 0; c < cols; c++)
                {
                    Vector3 p = CellPos(r, c);
                    switch (Map[r][c])
                    {
                        case '#':
                            kit.Box(p + Vector3.up * WallH * 0.5f, new Vector3(Cell, WallH, Cell), rock, cave);
                            break;
                        case 'S':
                            start = p;
                            elena = CellPos(r, c + 1);
                            break;
                        case 'E':
                            exit = p;
                            kit.PointLight(p + Vector3.up * 3f, new Color(0.8f, 0.9f, 1f), 10f, 2f, cave);
                            break;
                        case 'D':
                            door = kit.Door(p + Vector3.up * WallH * 0.5f, new Vector3(Cell, WallH, Cell), doorMat, cave);
                            break;
                        case 'C':
                            var cr = kit.Prim(PrimitiveType.Cube, p + new Vector3(1.2f, 0.6f, 1.2f), new Vector3(0.5f, 1.2f, 0.5f), crystal, cave, 30f);
                            cr.transform.rotation = Quaternion.Euler(15f, 30f, 10f);
                            kit.PointLight(p + new Vector3(1.2f, 1.5f, 1.2f), new Color(0.4f, 0.7f, 1f), 7f, 1.2f, cave);
                            break;
                        case 'B':
                            brazierCount++;
                            var bowl = kit.Prim(PrimitiveType.Cylinder, p + Vector3.up * 0.6f, new Vector3(1f, 0.6f, 1f), bronze, cave);
                            bowl.name = "Brazier";
                            kit.MakeInteractable(bowl, "Light brazier");
                            var f = kit.Flame(p + Vector3.up * 1.45f, cave, flame);
                            bowl.AddComponent<Brazier>().Bind(counter, f);
                            break;
                    }
                }

            counter.Configure(Braziers, brazierCount, door);

            // Starting torch so the first corridor is readable.
            kit.Flame(start + new Vector3(-1.4f, 2.2f, 1.4f), cave, flame);

            kit.Trigger(Exit, exit, 1.6f);
            kit.Checkpoint(CellPos(5, 4), 1.5f);

            return new LevelLayout
            {
                JasonSpawn = start + Vector3.up * 0.2f,
                JasonYaw = 90f,
                ElenaSpawn = elena + Vector3.up * 0.2f,
                KillY = -10f
            };
        }
    }
}
