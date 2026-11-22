using LostWorld.Environment;
using LostWorld.Missions;
using UnityEngine;

namespace LostWorld.Levels
{
    /// <summary>
    /// Level 3 — Canopy Walk. Platforms high in giant trees joined by rope bridges and jump gaps.
    /// Collect three relic shards on side platforms, then reach the lookout. Falling = back to checkpoint.
    /// </summary>
    public class Level3Canopy : ILevelBuilder
    {
        const string Shards = "collect_shards", Lookout = "reach_lookout";
        const float Deck = 12f;        // platform top height
        const float PlatformRadius = 3f;

        public static readonly LevelDefinition Definition = new LevelDefinition
        {
            Number = 3,
            Title = "Canopy Walk",
            Subtitle = "High above the jungle floor",
            Seed = 3317,
            Theme = new LevelTheme
            {
                Sky = new Color(0.62f, 0.8f, 0.9f),
                Fog = new Color(0.55f, 0.72f, 0.62f),
                FogDensity = 0.018f,
                Ambient = new Color(0.5f, 0.56f, 0.48f),
                SunColor = new Color(1f, 0.95f, 0.82f),
                SunIntensity = 1.2f,
                SunEuler = new Vector3(60f, -50f, 0f)
            },
            Objectives = new[]
            {
                new ObjectiveDef(Shards, "Collect the relic shards in the canopy"),
                new ObjectiveDef(Lookout, "Reach the lookout platform"),
            },
            Builder = new Level3Canopy()
        };

        Material _wood, _plank, _rope, _trunk, _leaf;
        WorldKit _kit;
        Transform _root;

        public LevelLayout Build(WorldKit kit)
        {
            _kit = kit;
            _wood = kit.Mat(new Color(0.45f, 0.32f, 0.2f));
            _plank = kit.Mat(new Color(0.55f, 0.4f, 0.25f));
            _rope = kit.Mat(new Color(0.7f, 0.62f, 0.45f));
            _trunk = kit.Mat(new Color(0.3f, 0.22f, 0.14f));
            _leaf = kit.Mat(new Color(0.14f, 0.4f, 0.16f));
            var floor = kit.Mat(new Color(0.16f, 0.28f, 0.12f));
            var relic = kit.Mat(new Color(0.3f, 0.9f, 1f), 0.9f);

            _root = kit.Group("Canopy");
            kit.Ground(new Vector3(0f, 0f, 45f), 160f, 32, (x, z) => Mathf.PerlinNoise(x * 0.04f, z * 0.04f) * 2f, floor);

            // Main route. 'gap' = jump instead of a bridge.
            Vector3[] route =
            {
                new Vector3(0, Deck, 0), new Vector3(6, Deck, 12), new Vector3(-2, Deck, 22),
                new Vector3(-4, Deck + 1f, 35), new Vector3(4, Deck + 1f, 46), new Vector3(2, Deck + 2f, 59),
                new Vector3(-5, Deck + 2f, 70), new Vector3(0, Deck + 3f, 84),
            };
            bool[] gapAfter = { false, false, true, false, false, true, false };

            for (int i = 0; i < route.Length; i++)
            {
                Platform(route[i], i == route.Length - 1 ? 4.5f : PlatformRadius);
                if (i == 0) continue;
                if (gapAfter[i - 1]) continue; // jump gap: platforms are placed close enough to clear it
                Bridge(route[i - 1], route[i]);
            }

            // Jump gaps need the platform edges within reach: add a small stepping platform in each gap.
            for (int i = 0; i < gapAfter.Length; i++)
            {
                if (!gapAfter[i]) continue;
                Vector3 mid = Vector3.Lerp(route[i], route[i + 1], 0.5f);
                Platform(mid, 2f);
            }

            // Side platforms with relic shards, reached by a short jump from the route.
            var counter = _root.gameObject.AddComponent<CountedObjective>();
            Vector3[] sides =
            {
                // ~2.3 m edge-to-edge gaps; a running jump clears ~4 m.
                route[1] + new Vector3(7.5f, 0f, 1f),
                route[3] + new Vector3(-7.5f, 0.5f, 0f),
                route[5] + new Vector3(7.5f, 0.5f, 1.5f),
            };
            counter.Configure(Shards, sides.Length);
            foreach (var s in sides)
            {
                Platform(s, 2.2f);
                var shard = kit.Prim(PrimitiveType.Cube, s + Vector3.up * 1.2f, Vector3.one * 0.6f, relic, _root);
                shard.name = "RelicShard";
                shard.transform.rotation = Quaternion.Euler(45f, 0f, 45f);
                shard.GetComponent<Collider>().isTrigger = true;
                shard.AddComponent<Collectible>().Bind(counter);
            }

            // Jungle floor dressing below.
            var veg = kit.Group("Floor");
            Level1Crash.Scatter(40, 70f, p => false, p => kit.Tree(new Vector3(p.x, 0f, p.y + 45f), veg, _trunk, _leaf, 8f, 14f));

            kit.Checkpoint(route[3] + Vector3.up * 0.5f);
            kit.Checkpoint(route[6] + Vector3.up * 0.5f);
            kit.Trigger(Lookout, route[route.Length - 1], 3.5f);

            return new LevelLayout
            {
                JasonSpawn = route[0] + Vector3.up * 0.3f,
                ElenaSpawn = route[0] + new Vector3(1.5f, 0.3f, -1f),
                KillY = Deck - 4f
            };
        }

        /// <summary>Round deck on a giant trunk, with a leafy crown above.</summary>
        void Platform(Vector3 top, float radius)
        {
            _kit.Prim(PrimitiveType.Cylinder, top - Vector3.up * 0.2f, new Vector3(radius * 2f, 0.2f, radius * 2f), _wood, _root);
            float trunkH = top.y;
            _kit.Prim(PrimitiveType.Cylinder, new Vector3(top.x, trunkH * 0.5f - 0.4f, top.z), new Vector3(1.2f, trunkH * 0.5f, 1.2f), _trunk, _root);
            _kit.Prim(PrimitiveType.Sphere, top + Vector3.up * 7f, new Vector3(radius * 2.4f, 3f, radius * 2.4f), _leaf, _root, 0f, false);
        }

        /// <summary>Plank bridge between two platform edges, with rope rails that also keep characters on.</summary>
        void Bridge(Vector3 a, Vector3 b)
        {
            Vector3 flat = new Vector3(b.x - a.x, 0f, b.z - a.z);
            float yaw = Mathf.Atan2(flat.x, flat.z) * Mathf.Rad2Deg;
            Vector3 dir = flat.normalized;
            Vector3 start = a + dir * (PlatformRadius - 0.3f);
            Vector3 end = b - dir * (PlatformRadius - 0.3f);
            Vector3 mid = (start + end) * 0.5f;
            float len = Vector3.Distance(start, end);
            float pitch = -Mathf.Atan2(end.y - start.y, new Vector2(end.x - start.x, end.z - start.z).magnitude) * Mathf.Rad2Deg;

            var deck = _kit.Box(mid - Vector3.up * 0.1f, new Vector3(1.6f, 0.12f, len), _plank, _root);
            deck.transform.rotation = Quaternion.Euler(pitch, yaw, 0f);
            Vector3 right = Quaternion.Euler(0f, yaw, 0f) * Vector3.right;
            foreach (float side in new[] { -1f, 1f })
            {
                var rail = _kit.Box(mid + right * side * 0.85f + Vector3.up * 0.5f, new Vector3(0.08f, 1f, len), _rope, _root);
                rail.transform.rotation = Quaternion.Euler(pitch, yaw, 0f);
            }
        }
    }
}
