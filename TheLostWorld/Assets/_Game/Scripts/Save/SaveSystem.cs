using System;
using System.IO;
using LostWorld.Missions;
using UnityEngine;

namespace LostWorld.Save
{
    [Serializable]
    public class SaveData
    {
        public int version = 1;
        public int missionIndex;
        public float[] playerPosition = new float[3];
        public float playerYaw;
        public bool puzzleSolved;
        public string savedAtUtc;
    }

    /// <summary>
    /// Local JSON save with a single checkpoint slot. Writes to Application.persistentDataPath.
    /// All file IO is wrapped in try/catch so a bad disk never crashes gameplay.
    /// </summary>
    public static class SaveSystem
    {
        const string FileName = "chapter1_save.json";
        static string Path => System.IO.Path.Combine(Application.persistentDataPath, FileName);

        public static bool HasSave()
        {
            try { return File.Exists(Path); }
            catch (Exception e) { Debug.LogWarning($"[Save] HasSave failed: {e.Message}"); return false; }
        }

        public static bool Write(SaveData data)
        {
            try
            {
                data.savedAtUtc = DateTime.UtcNow.ToString("o");
                File.WriteAllText(Path, JsonUtility.ToJson(data, true));
                return true;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[Save] Write failed: {e.Message}");
                return false;
            }
        }

        public static SaveData Read()
        {
            try
            {
                if (!File.Exists(Path)) return null;
                return JsonUtility.FromJson<SaveData>(File.ReadAllText(Path));
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[Save] Read failed: {e.Message}");
                return null;
            }
        }

        public static void Delete()
        {
            try { if (File.Exists(Path)) File.Delete(Path); }
            catch (Exception e) { Debug.LogWarning($"[Save] Delete failed: {e.Message}"); }
        }

        public static SaveData Capture(MissionId mission, Vector3 pos, float yaw, bool puzzleSolved)
        {
            return new SaveData
            {
                missionIndex = (int)mission,
                playerPosition = new[] { pos.x, pos.y, pos.z },
                playerYaw = yaw,
                puzzleSolved = puzzleSolved
            };
        }

        public static Vector3 PositionOf(SaveData d) =>
            d.playerPosition != null && d.playerPosition.Length == 3
                ? new Vector3(d.playerPosition[0], d.playerPosition[1], d.playerPosition[2])
                : Vector3.zero;
    }
}
