using UnityEngine;

namespace LostWorld.Companion
{
    /// <summary>
    /// Elena's follow AI. Keeps a comfortable distance behind the leader, waits when the leader stops,
    /// and steers around obstacles with forward/side raycasts (no NavMesh bake needed for the prototype).
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class CompanionFollower : MonoBehaviour
    {
        public enum State { Idle, Following, Waiting, Scripted }

        [SerializeField] Transform leader;
        [SerializeField] float followDistance = 2.5f;   // start moving when farther than this
        [SerializeField] float stopDistance = 1.6f;     // stop when this close
        [SerializeField] float teleportDistance = 25f;  // catch-up warp if she gets lost
        [SerializeField] float moveSpeed = 3.6f;
        [SerializeField] float sprintSpeed = 6f;
        [SerializeField] float turnSpeed = 10f;
        [SerializeField] float gravity = -22f;
        [SerializeField] float avoidRayLength = 1.2f;
        [SerializeField] LayerMask obstacleMask = ~0;
        [SerializeField] Animator animator;

        CharacterController _cc;
        Vector3 _velocity;
        State _state = State.Idle;
        Vector3 _scriptedTarget;
        bool _hasScriptedTarget;

        public State CurrentState => _state;
        public Transform Leader { get => leader; set => leader = value; }

        void Awake()
        {
            _cc = GetComponent<CharacterController>();
        }

        void Update()
        {
            if (leader == null) return;

            float dist = Vector3.Distance(Flat(transform.position), Flat(leader.position));

            if (_state == State.Scripted)
            {
                if (_hasScriptedTarget) MoveTowards(_scriptedTarget, moveSpeed, stopDistance * 0.5f);
                ApplyGravityAndMove(Vector3.zero);
                return;
            }

            if (dist > teleportDistance)
            {
                WarpTo(leader.position - leader.forward * followDistance);
                return;
            }

            // Hysteresis so she does not jitter at the edge of the follow band.
            if (_state != State.Following && dist > followDistance) _state = State.Following;
            else if (_state == State.Following && dist < stopDistance) _state = State.Waiting;
            else if (_state == State.Idle) _state = State.Waiting;

            if (_state == State.Following)
            {
                float speed = dist > followDistance * 2.5f ? sprintSpeed : moveSpeed;
                MoveTowards(leader.position, speed, stopDistance);
            }
            else
            {
                ApplyGravityAndMove(Vector3.zero);
                FaceFlat(leader.position);
            }

            if (animator)
            {
                animator.SetFloat("Speed", new Vector3(_cc.velocity.x, 0, _cc.velocity.z).magnitude / sprintSpeed);
            }
        }

        /// <summary>Scripted puzzle code can walk her to a point, then hand control back.</summary>
        public void WalkTo(Vector3 point)
        {
            _scriptedTarget = point;
            _hasScriptedTarget = true;
            _state = State.Scripted;
        }

        public void ReturnToFollowing()
        {
            _hasScriptedTarget = false;
            _state = State.Following;
        }

        void MoveTowards(Vector3 worldTarget, float speed, float arriveRadius)
        {
            Vector3 toTarget = Flat(worldTarget) - Flat(transform.position);
            float d = toTarget.magnitude;
            Vector3 desired = Vector3.zero;

            if (d > arriveRadius)
            {
                desired = AvoidObstacles(toTarget.normalized) * speed;
                FaceFlat(worldTarget);
            }
            ApplyGravityAndMove(desired);
        }

        /// <summary>Probe ahead and to the sides; bend the heading away from anything solid.</summary>
        Vector3 AvoidObstacles(Vector3 dir)
        {
            Vector3 origin = transform.position + Vector3.up * 0.5f;
            if (!Physics.Raycast(origin, dir, avoidRayLength, obstacleMask, QueryTriggerInteraction.Ignore))
                return dir;

            Vector3 left = Quaternion.Euler(0, -45, 0) * dir;
            Vector3 right = Quaternion.Euler(0, 45, 0) * dir;
            bool leftClear = !Physics.Raycast(origin, left, avoidRayLength, obstacleMask, QueryTriggerInteraction.Ignore);
            bool rightClear = !Physics.Raycast(origin, right, avoidRayLength, obstacleMask, QueryTriggerInteraction.Ignore);

            if (leftClear) return left.normalized;
            if (rightClear) return right.normalized;
            return -dir * 0.3f; // boxed in: back off slightly
        }

        void ApplyGravityAndMove(Vector3 horizontal)
        {
            if (_cc.isGrounded && _velocity.y < 0f) _velocity.y = -2f;
            _velocity.y += gravity * Time.deltaTime;
            _cc.Move((horizontal + Vector3.up * _velocity.y) * Time.deltaTime);
        }

        void FaceFlat(Vector3 worldPoint)
        {
            Vector3 d = Flat(worldPoint) - Flat(transform.position);
            if (d.sqrMagnitude < 0.0001f) return;
            transform.rotation = Quaternion.Slerp(transform.rotation,
                Quaternion.LookRotation(d.normalized), turnSpeed * Time.deltaTime);
        }

        public void WarpTo(Vector3 position)
        {
            _cc.enabled = false;
            transform.position = position;
            _cc.enabled = true;
            _velocity = Vector3.zero;
        }

        static Vector3 Flat(Vector3 v) => new Vector3(v.x, 0f, v.z);
    }
}
