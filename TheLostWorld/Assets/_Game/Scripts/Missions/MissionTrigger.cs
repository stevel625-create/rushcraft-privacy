using LostWorld.Player;
using UnityEngine;

namespace LostWorld.Missions
{
    /// <summary>
    /// Place on a trigger volume. When Jason enters while <see cref="mission"/> is active,
    /// that mission completes. Set <see cref="oneShot"/> to ignore re-entry.
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class MissionTrigger : MonoBehaviour
    {
        [SerializeField] MissionId mission = MissionId.FindElena;
        [SerializeField] bool oneShot = true;

        bool _fired;

        /// <summary>Set the mission from code (used by JungleBuilder when generating triggers).</summary>
        public void Configure(MissionId id, bool once = true)
        {
            mission = id;
            oneShot = once;
        }

        void Reset()
        {
            var c = GetComponent<Collider>();
            if (c) c.isTrigger = true;
        }

        void OnTriggerEnter(Collider other)
        {
            if (_fired && oneShot) return;
            if (other.GetComponentInParent<PlayerController>() == null) return;
            if (MissionManager.Instance == null) return;

            if (MissionManager.Instance.Complete(mission)) _fired = true;
        }
    }
}
