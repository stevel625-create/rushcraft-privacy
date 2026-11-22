using LostWorld.Environment;
using LostWorld.Missions;
using UnityEngine;

namespace LostWorld.Levels
{
    /// <summary>
    /// Level 5 — Obsidian Peak. Hop basalt columns across a lava sea, climb the spiral stair around the
    /// volcanic cone, and ring the summit gong. Touching lava = back to checkpoint.
    /// </summary>
    public class Level5Peak : ILevelBuilder
    {
        const string CrossLava = "cross_lava", Climb = "climb_peak", Gong = "ring_gong";

        const int Tiers = 10;
        const float BaseRadius = 14f, TierShrink = 1.2f, TierH = 2f, BaseTop = 1f;
        const float StepRise = 0.3f;   // below the CharacterController step offset (0.35)
        const float StepArc = 1.5f;

        public static readonly LevelDefinition Definition = new LevelDefinition
        {
            Number = 5,
            Title = "Obsidian Peak",
            Subtitle = "Climb above the fire",
            Seed = 5521,
            Theme = new LevelTheme
            {
                Sky = new Color(0.32f, 0.14f, 0.11f),
                Fog = new Color(0.42f, 0.2f, 0.12f),
                FogDensity = 0.02f,
                Ambient = new Color(0.42f, 0.27f, 0.22f),
                SunColor = new Color(1f, 0.6f, 0.4f),
                SunIntensity = 1f,
                SunEuler = new Vector3(30f, 60f, 0f)
            },
            Objectives = new[]
            {
                new ObjectiveDef(CrossLava, "Cross the lava field to the mountain"),
                new ObjectiveDef(Climb, "Climb to the summit of Obsidian Peak"),
                new ObjectiveDef(Gong, "Ring the summit gong"),
            },
            Builder = new Level5Peak()
        };

        static float TierRadius(int i) => BaseRadius - TierShrink * i;
        static float SummitY => BaseTop + TierH * (Tiers - 1);

        public LevelLayout Build(WorldKit kit)
        {
            var lava = kit.Mat(new Color(1f, 0.35f, 0.05f), 0.8f);
            var obsidian = kit.Mat(new Color(0.12f, 0.1f, 0.12f), 0.7f);
            var basalt = kit.Mat(new Color(0.25f, 0.22f, 0.22f));
            var bronze = kit.Mat(new Color(0.75f, 0.55f, 0.2f), 0.7f);

            var root = kit.Group("Peak");
            kit.Liquid(new Vector3(0f, 0f, 0f), new Vector2(170f, 170f), lava, kill: true);
            kit.PointLight(new Vector3(0f, 3f, -30f), new Color(1f, 0.45f, 0.15f), 30f, 1.5f, root);

            // Starting island and basalt columns.
            Vector3 island = new Vector3(0f, BaseTop, -45f);
            kit.Prim(PrimitiveType.Cylinder, island - Vector3.up * 1.5f, new Vector3(12f, 1.5f, 12f), basalt, root);
            float[] xs = { 0f, 1.6f, -0.4f, -2f, -0.5f, 1.4f, 0f };
            for (int i = 0; i < xs.Length; i++)
            {
                float z = -36.5f + i * 3.2f;
                kit.Prim(PrimitiveType.Cylinder, new Vector3(xs[i], BaseTop - 1.5f, z), new Vector3(2f, 1.5f, 2f), basalt, root);
            }

            // Stepped volcanic cone: tier 0 top at BaseTop, each tier 2 m higher and 1.2 m narrower.
            for (int i = 0; i < Tiers; i++)
            {
                float top = BaseTop + TierH * i;
                float h = i == 0 ? 2f : TierH;
                float r = TierRadius(i);
                kit.Prim(PrimitiveType.Cylinder, new Vector3(0f, top - h * 0.5f, 0f), new Vector3(r * 2f, h * 0.5f, r * 2f), obsidian, root);
            }

            // Spiral stair hugging the cone, starting on the side facing the columns (-Z).
            var stair = kit.Group("Stair", root);
            float theta = -Mathf.PI * 0.5f;
            int steps = Mathf.CeilToInt((SummitY - BaseTop) / StepRise);
            Vector3 midStair = Vector3.zero;
            for (int s = 1; s <= steps; s++)
            {
                float y = BaseTop + s * StepRise;
                int tier = Mathf.Clamp(Mathf.CeilToInt((y - BaseTop) / TierH), 1, Tiers - 1);
                float r = TierRadius(tier) + 1.2f;
                theta += StepArc / r;
                Vector3 pos = new Vector3(Mathf.Cos(theta) * r, y - 0.15f, Mathf.Sin(theta) * r);
                kit.Box(pos, new Vector3(2.4f, 0.3f, StepArc + 0.3f), basalt, stair, -theta * Mathf.Rad2Deg);
                if (s == steps / 2) midStair = pos + Vector3.up * 0.3f;
            }

            // Summit gong.
            Vector3 summit = new Vector3(0f, SummitY, 0f);
            kit.Box(summit + new Vector3(-1.4f, 1.5f, 0f), new Vector3(0.25f, 3f, 0.25f), obsidian, root);
            kit.Box(summit + new Vector3(1.4f, 1.5f, 0f), new Vector3(0.25f, 3f, 0.25f), obsidian, root);
            kit.Box(summit + new Vector3(0f, 3f, 0f), new Vector3(3.1f, 0.25f, 0.25f), obsidian, root);
            var gong = kit.Prim(PrimitiveType.Cylinder, summit + new Vector3(0f, 1.7f, 0f), new Vector3(2f, 0.06f, 2f), bronze, root);
            gong.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
            gong.name = "Gong";
            kit.MakeInteractable(gong, "Ring the gong");
            gong.AddComponent<InteractAction>().Configure(Gong, "BWONNNG... the sound rolls across the valley.",
                "Climb to the summit first.");

            Vector3 baseLanding = new Vector3(0f, BaseTop, -TierRadius(0) + 1.5f);
            kit.Trigger(CrossLava, baseLanding, 3f);
            kit.Trigger(Climb, summit, 2.5f);
            kit.Checkpoint(baseLanding);
            kit.Checkpoint(midStair, 1.5f);

            return new LevelLayout
            {
                JasonSpawn = island + Vector3.up * 0.2f,
                ElenaSpawn = island + new Vector3(2f, 0.2f, -1.5f),
                KillY = -5f
            };
        }
    }
}
