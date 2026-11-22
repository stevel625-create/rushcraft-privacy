using System;
using System.Collections.Generic;
using UnityEngine;

namespace LostWorld.Missions
{
    public enum MissionId
    {
        FindElena = 0,
        InvestigateCrash = 1,
        FollowAncientTrail = 2,
        ReachTemple = 3,
        CooperativePuzzle = 4,
        Complete = 5
    }

    public static class MissionData
    {
        public static readonly string[] Titles =
        {
            "Find Elena",
            "Investigate the crash site",
            "Follow the ancient trail",
            "Reach the temple entrance",
            "Solve the first cooperative puzzle",
            "Chapter 1 complete"
        };

        public static string Title(MissionId id) => Titles[Mathf.Clamp((int)id, 0, Titles.Length - 1)];
    }

    /// <summary>
    /// Linear mission chain for Chapter 1. Objectives advance only when the matching trigger
    /// calls Complete(id). Triggers live in the world (see MissionTrigger).
    /// </summary>
    public class MissionManager : MonoBehaviour
    {
        public static MissionManager Instance { get; private set; }

        public event Action<MissionId> MissionStarted;
        public event Action<MissionId> MissionCompleted;

        public MissionId Current { get; private set; } = MissionId.FindElena;
        public bool IsChapterComplete => Current == MissionId.Complete;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        void Start()
        {
            MissionStarted?.Invoke(Current);
        }

        /// <summary>Only the active mission can complete; out-of-order calls are ignored.</summary>
        public bool Complete(MissionId id)
        {
            if (id != Current) return false;

            MissionCompleted?.Invoke(id);
            Current = (MissionId)((int)id + 1);
            if (Current > MissionId.Complete) Current = MissionId.Complete;
            MissionStarted?.Invoke(Current);
            return true;
        }

        /// <summary>Used by SaveSystem when restoring a checkpoint.</summary>
        public void SetMissionSilently(MissionId id)
        {
            Current = id;
        }

        public string CurrentTitle => MissionData.Title(Current);
    }
}
