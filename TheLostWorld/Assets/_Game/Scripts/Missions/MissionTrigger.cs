using LostWorld.Player;
using UnityEngine;

namespace LostWorld.Missions
{
    /// <summary>
    /// Trigger volume that completes an objective when Jason is inside it while that objective is active.
    /// Uses OnTriggerStay, so it also fires if Jason is already standing in it when the objective starts.
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class MissionTrigger : MonoBehaviour
    {
        [SerializeField] string objectiveId;

        public void Configure(string id) => objectiveId = id;

        void Reset()
        {
            var c = GetComponent<Collider>();
            if (c) c.isTrigger = true;
        }

        void OnTriggerStay(Collider other)
        {
            var mm = MissionManager.Instance;
            if (mm == null || mm.CurrentId != objectiveId) return;
            if (other.GetComponentInParent<PlayerController>() == null) return;
            mm.Complete(objectiveId);
        }
    }
}
