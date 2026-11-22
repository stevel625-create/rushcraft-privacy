using System;
using System.IO;
using UnityEngine;

namespace LostWorld.Save
{
    [Serializable]
    public class SaveData
    {
        public int version = 2;
        public int levelIndex;      // 0-based index into LevelCatalog
        public int objectiveIndex;  // objectives already completed in that level
        public float[] playerPosition = new float[3];
        public float playerYaw;
        public string savedAtUtc;
    }

    /// <summary>
    /// Local JSON checkpoint (one slot) in Application.persistentDataPath.
    /// All file IO is wrapped in try/catch so a bad disk never crashes gameplay.
    /// </summary>
    public static class SaveSystem
    {
        const string FileName = "lostworld_save.json";
        static string FilePath => Path.Combine(Application.persistentDataPath, FileName);

        public static bool HasSave() => Read() != null;

        public static bool Write(SaveData data)
        {
            try
            {
                data.savedAtUtc = DateTime.UtcNow.ToString("o");
                File.WriteAllText(FilePath, JsonUtility.ToJson(data, true));
                return true;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[Save] Write failed: {e.Message}");
                return false;
            }
        }

        /// <summary>Returns null when there is no save, or when it is unreadable or from an older format.</summary>
        public static SaveData Read()
        {
            try
            {
                if (!File.Exists(FilePath)) return null;
                var d = JsonUtility.FromJson<SaveData>(File.ReadAllText(FilePath));
                return d != null && d.version == 2 ? d : null;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[Save] Read failed: {e.Message}");
                return null;
            }
        }

        public static void Delete()
        {
            try { if (File.Exists(FilePath)) File.Delete(FilePath); }
            catch (Exception e) { Debug.LogWarning($"[Save] Delete failed: {e.Message}"); }
        }

        public static SaveData Capture(int level, int objective, Vector3 pos, float yaw) => new SaveData
        {
            levelIndex = level,
            objectiveIndex = objective,
            playerPosition = new[] { pos.x, pos.y, pos.z },
            playerYaw = yaw
        };

        public static Vector3 PositionOf(SaveData d) =>
            d.playerPosition != null && d.playerPosition.Length == 3
                ? new Vector3(d.playerPosition[0], d.playerPosition[1], d.playerPosition[2])
                : Vector3.zero;
    }

    /// <summary>Which levels are unlocked. Kept apart from the checkpoint so erasing a save keeps unlocks.</summary>
    public static class ProgressStore
    {
        const string Key = "lw_unlocked_levels";

        /// <summary>Number of unlocked levels (always at least 1).</summary>
        public static int UnlockedCount
        {
            get
            {
                try { return Mathf.Max(1, PlayerPrefs.GetInt(Key, 1)); }
                catch { return 1; }
            }
        }

        public static bool IsUnlocked(int levelIndex) => levelIndex < UnlockedCount;

        public static void UnlockThrough(int levelIndex)
        {
            try
            {
                if (levelIndex + 1 <= UnlockedCount) return;
                PlayerPrefs.SetInt(Key, levelIndex + 1);
                PlayerPrefs.Save();
            }
            catch (Exception e) { Debug.LogWarning($"[Progress] Save failed: {e.Message}"); }
        }

        public static void ResetAll()
        {
            try { PlayerPrefs.DeleteKey(Key); PlayerPrefs.Save(); }
            catch (Exception e) { Debug.LogWarning($"[Progress] Reset failed: {e.Message}"); }
        }
    }
}
