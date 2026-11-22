using LostWorld.Companion;
using LostWorld.Missions;
using LostWorld.Player;
using UnityEngine;

namespace LostWorld.Missions
{
    /// <summary>
    /// Two plates: Jason must stand on plate A while Elena stands on plate B, held for holdSeconds.
    /// Only progresses while the CooperativePuzzle mission is active. Completing it calls MissionManager.
    /// </summary>
    public class CooperativePuzzle : MonoBehaviour
    {
        [SerializeField] PressurePlate plateA; // Jason
        [SerializeField] PressurePlate plateB; // Elena
        [SerializeField] float holdSeconds = 1.0f;
        [SerializeField] GameObject solvedVisual; // e.g. a glowing door or gem

        float _held;
        bool _solved;

        public bool Solved => _solved;

        public void SetPlates(PressurePlate a, PressurePlate b)
        {
            plateA = a;
            plateB = b;
        }

        public void SetVisual(GameObject visual) => solvedVisual = visual;

        void Update()
        {
            if (_solved || MissionManager.Instance == null) return;
            if (MissionManager.Instance.Current != MissionId.CooperativePuzzle) return;

            bool ok = plateA && plateB && plateA.Occupant == Occupant.Jason && plateB.Occupant == Occupant.Elena;
            _held = ok ? _held + Time.deltaTime : 0f;

            if (_held >= holdSeconds) Solve();
        }

        void Solve()
        {
            _solved = true;
            if (solvedVisual) solvedVisual.SetActive(true);
            MissionManager.Instance.Complete(MissionId.CooperativePuzzle);
        }

        /// <summary>Restore from a save without replaying the reward.</summary>
        public void RestoreSolved()
        {
            _solved = true;
            if (solvedVisual) solvedVisual.SetActive(true);
        }
    }

    public enum Occupant { None, Jason, Elena }

    /// <summary>Tracks whether Jason or Elena is standing on it. Tag-free: checks component types.</summary>
    [RequireComponent(typeof(Collider))]
    public class PressurePlate : MonoBehaviour
    {
        public Occupant Occupant { get; private set; }

        void Reset()
        {
            var c = GetComponent<Collider>();
            if (c) c.isTrigger = true;
        }

        void OnTriggerStay(Collider other)
        {
            if (other.GetComponentInParent<PlayerController>() != null) Occupant = Occupant.Jason;
            else if (other.GetComponentInParent<CompanionFollower>() != null) Occupant = Occupant.Elena;
        }

        void OnTriggerExit(Collider other)
        {
            if (other.GetComponentInParent<PlayerController>() != null && Occupant == Occupant.Jason)
                Occupant = Occupant.None;
            else if (other.GetComponentInParent<CompanionFollower>() != null && Occupant == Occupant.Elena)
                Occupant = Occupant.None;
        }
    }
}
