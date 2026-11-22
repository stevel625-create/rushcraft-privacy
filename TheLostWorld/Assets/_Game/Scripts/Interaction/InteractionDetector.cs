using LostWorld.Core;
using UnityEngine;

namespace LostWorld.Interaction
{
    /// <summary>
    /// Lives on Jason. Finds the closest in-range, in-front Interactable and triggers it
    /// when the interact button (on-screen or E) is pressed. Uses OverlapSphereNonAlloc to avoid GC.
    /// </summary>
    public class InteractionDetector : MonoBehaviour
    {
        [SerializeField] float range = 2.2f;
        [SerializeField] float minDotFacing = 0.35f;
        [SerializeField] LayerMask interactMask = ~0;

        readonly Collider[] _hits = new Collider[16];

        public Interactable Current { get; private set; }

        public static event System.Action<Interactable> CurrentChanged;

        void Update()
        {
            Interactable best = FindBest();
            if (best != Current)
            {
                Current = best;
                CurrentChanged?.Invoke(Current);
            }

            if (Current != null && TouchInput.InteractPressed)
            {
                Current.Interact();
            }
        }

        Interactable FindBest()
        {
            int n = Physics.OverlapSphereNonAlloc(transform.position, range, _hits, interactMask,
                QueryTriggerInteraction.Collide);

            Interactable best = null;
            float bestScore = float.MinValue;

            for (int i = 0; i < n; i++)
            {
                var it = _hits[i].GetComponentInParent<Interactable>();
                if (it == null || !it.CanInteract) continue;

                Vector3 to = it.transform.position - transform.position;
                to.y = 0f;
                float dist = to.magnitude;
                if (dist < 0.01f) dist = 0.01f;
                float facing = Vector3.Dot(transform.forward, to / dist);
                if (facing < minDotFacing) continue;

                float score = facing - dist * 0.1f;
                if (score > bestScore)
                {
                    bestScore = score;
                    best = it;
                }
            }
            return best;
        }
    }
}
