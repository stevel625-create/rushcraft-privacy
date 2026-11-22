using System.Collections.Generic;
using LostWorld.Environment;
using LostWorld.Missions;
using UnityEngine;

namespace LostWorld.Levels
{
    /// <summary>Lighting and atmosphere for a level. Applied by GameBootstrap before the level is built.</summary>
    public class LevelTheme
    {
        public Color Sky = new Color(0.55f, 0.72f, 0.82f);
        public Color Fog = new Color(0.6f, 0.75f, 0.78f);
        public float FogDensity = 0.012f;
        public Color Ambient = new Color(0.45f, 0.5f, 0.45f);
        public Color SunColor = new Color(1f, 0.93f, 0.8f);
        public float SunIntensity = 1.1f;
        public Vector3 SunEuler = new Vector3(50f, -30f, 0f);
    }

    /// <summary>What a builder hands back: where everyone starts and how the level behaves.</summary>
    public class LevelLayout
    {
        public Vector3 JasonSpawn;
        public float JasonYaw;
        public Vector3 ElenaSpawn;
        /// <summary>Falling below this height respawns Jason at his last checkpoint.</summary>
        public float KillY = -30f;
        /// <summary>When the keyed objective starts, Elena walks to this point and holds there.</summary>
        public readonly Dictionary<string, Vector3> CompanionSpots = new Dictionary<string, Vector3>();
    }

    public interface ILevelBuilder
    {
        LevelLayout Build(WorldKit kit);
    }

    public class LevelDefinition
    {
        public int Number;           // 1-based, shown to the player
        public string Title;
        public string Subtitle;
        public int Seed;
        public LevelTheme Theme;
        public ObjectiveDef[] Objectives;
        public ILevelBuilder Builder;
    }

    /// <summary>All playable levels in order. Level N+1 unlocks when level N is completed.</summary>
    public static class LevelCatalog
    {
        public static readonly LevelDefinition[] All =
        {
            Level1Crash.Definition,
            Level2SunkenGate.Definition,
            Level3Canopy.Definition,
            Level4Caves.Definition,
            Level5Peak.Definition,
            Level6Sanctum.Definition,
        };

        public static int Count => All.Length;
        public static LevelDefinition Get(int index) => All[Mathf.Clamp(index, 0, All.Length - 1)];
    }
}
