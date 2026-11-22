using System;
using System.Collections.Generic;
using UnityEngine;

namespace LostWorld.Missions
{
    /// <summary>One step of a level, e.g. ("find_elena", "Find Elena"). Ids are unique within a level.</summary>
    public class ObjectiveDef
    {
        public readonly string Id;
        public readonly string Title;

        public ObjectiveDef(string id, string title)
        {
            Id = id;
            Title = title;
        }
    }

    /// <summary>
    /// Runs the ordered objective list of the current level. World mechanics (triggers, puzzles, pickups)
    /// call Complete(id); only the active objective can complete, so out-of-order calls are ignored.
    /// </summary>
    public class MissionManager : MonoBehaviour
    {
        public static MissionManager Instance { get; private set; }

        public event Action<ObjectiveDef> ObjectiveStarted;
        public event Action<ObjectiveDef> ObjectiveCompleted;
        public event Action<ObjectiveDef, int, int> ProgressChanged; // objective, current, total
        public event Action LevelCompleted;

        IReadOnlyList<ObjectiveDef> _objectives = Array.Empty<ObjectiveDef>();

        public int CurrentIndex { get; private set; }
        public ObjectiveDef Current => CurrentIndex < _objectives.Count ? _objectives[CurrentIndex] : null;
        public string CurrentId => Current?.Id;
        public bool IsLevelComplete => _objectives.Count > 0 && CurrentIndex >= _objectives.Count;
        public IReadOnlyList<ObjectiveDef> Objectives => _objectives;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        /// <summary>Start a level's objectives, optionally resuming from a saved index.</summary>
        public void LoadObjectives(IReadOnlyList<ObjectiveDef> objectives, int startIndex = 0)
        {
            _objectives = objectives ?? Array.Empty<ObjectiveDef>();
            CurrentIndex = Mathf.Clamp(startIndex, 0, _objectives.Count);
            if (Current != null) ObjectiveStarted?.Invoke(Current);
        }

        public bool Complete(string id)
        {
            if (Current == null || Current.Id != id) return false;

            var done = Current;
            CurrentIndex++;
            ObjectiveCompleted?.Invoke(done);

            if (Current != null) ObjectiveStarted?.Invoke(Current);
            else LevelCompleted?.Invoke();
            return true;
        }

        /// <summary>True if the objective is already behind the player (used to fast-forward on Continue).</summary>
        public bool IsCompleted(string id)
        {
            for (int i = 0; i < CurrentIndex && i < _objectives.Count; i++)
                if (_objectives[i].Id == id) return true;
            return false;
        }

        public void ReportProgress(string id, int current, int total)
        {
            if (Current != null && Current.Id == id) ProgressChanged?.Invoke(Current, current, total);
        }
    }
}
