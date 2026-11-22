using System.Collections.Generic;
using LostWorld.Companion;
using LostWorld.Player;
using UnityEngine;

namespace LostWorld.Missions
{
    /// <summary>
    /// Implemented by every world mechanic tied to an objective, so Continue can put already-finished
    /// puzzles into their solved state without replaying them.
    /// </summary>
    public interface IObjectiveMechanic
    {
        string ObjectiveId { get; }
        void ForceComplete();
    }

    public enum Occupant { Jason, Elena }

    /// <summary>
    /// Plates that must all be held by the right character at once for holdSeconds.
    /// One plate (Elena) = "hold the gate" puzzle; two plates (Jason + Elena) = classic co-op puzzle.
    /// </summary>
    public class CooperativePuzzle : MonoBehaviour, IObjectiveMechanic
    {
        [SerializeField] string objectiveId;
        [SerializeField] float holdSeconds = 1f;

        readonly List<(PressurePlate plate, Occupant need)> _plates = new List<(PressurePlate, Occupant)>();
        GameObject _solvedVisual;
        SlidingDoor _door;
        float _held;
        bool _solved;

        public string ObjectiveId => objectiveId;
        public bool Solved => _solved;

        public void Configure(string id, float hold = 1f)
        {
            objectiveId = id;
            holdSeconds = hold;
        }

        public void AddPlate(PressurePlate plate, Occupant need) => _plates.Add((plate, need));
        public void SetVisual(GameObject visual) => _solvedVisual = visual;
        public void SetDoor(SlidingDoor door) => _door = door;

        void Update()
        {
            if (_solved || _plates.Count == 0) return;
            var mm = MissionManager.Instance;
            if (mm == null || mm.CurrentId != objectiveId) return;

            bool ok = true;
            foreach (var (plate, need) in _plates)
                if (plate == null || !plate.Has(need)) { ok = false; break; }

            _held = ok ? _held + Time.deltaTime : 0f;
            if (_held >= holdSeconds)
            {
                ApplySolved(false);
                mm.Complete(objectiveId);
            }
        }

        public void ForceComplete() => ApplySolved(true);

        void ApplySolved(bool instant)
        {
            _solved = true;
            if (_solvedVisual) _solvedVisual.SetActive(true);
            if (_door) { if (instant) _door.OpenInstant(); else _door.Open(); }
        }
    }

    /// <summary>
    /// Reports who is standing on it. Flags are rebuilt every physics step from OnTriggerStay, so they stay
    /// correct after teleports (where OnTriggerExit may never fire).
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class PressurePlate : MonoBehaviour
    {
        bool _jason, _elena;

        public bool Has(Occupant who) => who == Occupant.Jason ? _jason : _elena;

        void Reset()
        {
            var c = GetComponent<Collider>();
            if (c) c.isTrigger = true;
        }

        void FixedUpdate()
        {
            _jason = false;
            _elena = false;
        }

        void OnTriggerStay(Collider other)
        {
            if (other.GetComponentInParent<PlayerController>() != null) _jason = true;
            else if (other.GetComponentInParent<CompanionFollower>() != null) _elena = true;
        }
    }
}
