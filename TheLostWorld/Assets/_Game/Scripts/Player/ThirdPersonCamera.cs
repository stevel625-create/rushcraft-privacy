using LostWorld.Core;
using UnityEngine;

namespace LostWorld.Player
{
    /// <summary>
    /// Orbit-follow camera. Drag on the right half of the screen to rotate (TouchInput.LookDelta).
    /// Pulls in when geometry blocks the view (single raycast, cheap for mobile).
    /// </summary>
    public class ThirdPersonCamera : MonoBehaviour
    {
        [SerializeField] Transform target;
        [SerializeField] Vector3 pivotOffset = new Vector3(0f, 1.6f, 0f);
        [SerializeField] float distance = 5.5f;
        [SerializeField] float minDistance = 1.5f;
        [SerializeField] float minPitch = -20f;
        [SerializeField] float maxPitch = 60f;
        [SerializeField] float yaw = 0f;
        [SerializeField] float pitch = 18f;
        [SerializeField] float lookSensitivity = 0.15f;
        [SerializeField] float followSmooth = 12f;
        [SerializeField] LayerMask occlusionMask = ~0;

        Vector3 _smoothedPivot;
        bool _initialised;

        public Transform Target
        {
            get => target;
            set { target = value; _initialised = false; }
        }

        void LateUpdate()
        {
            if (target == null) return;

            // Rotate with touch/mouse drag. Ignore input while a UI pointer is over a button is handled by EventSystem routing.
            yaw += TouchInput.LookDelta.x * lookSensitivity;
            pitch = Mathf.Clamp(pitch - TouchInput.LookDelta.y * lookSensitivity, minPitch, maxPitch);

            Vector3 desiredPivot = target.position + pivotOffset;
            if (!_initialised)
            {
                _smoothedPivot = desiredPivot;
                _initialised = true;
            }
            _smoothedPivot = Vector3.Lerp(_smoothedPivot, desiredPivot, 1f - Mathf.Exp(-followSmooth * Time.deltaTime));

            Quaternion rot = Quaternion.Euler(pitch, yaw, 0f);
            Vector3 dir = rot * Vector3.back;

            float dist = distance;
            if (Physics.SphereCast(_smoothedPivot, 0.25f, dir, out RaycastHit hit, distance, occlusionMask,
                QueryTriggerInteraction.Ignore))
            {
                dist = Mathf.Max(minDistance, hit.distance);
            }

            transform.position = _smoothedPivot + dir * dist;
            transform.rotation = rot;
        }

        /// <summary>Snap immediately (after a warp or checkpoint).</summary>
        public void Snap()
        {
            _initialised = false;
        }
    }
}
