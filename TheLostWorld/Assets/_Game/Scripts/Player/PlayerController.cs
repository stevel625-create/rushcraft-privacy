using LostWorld.Core;
using UnityEngine;

namespace LostWorld.Player
{
    /// <summary>
    /// Third-person character controller for Jason. Uses CharacterController (cheap on mobile).
    /// Movement is relative to the active camera; run is automatic at full stick deflection.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] float walkSpeed = 3.2f;
        [SerializeField] float runSpeed = 6.5f;
        [SerializeField] float turnSpeed = 12f;
        [SerializeField] float runThreshold = 0.85f;

        [Header("Jump / Gravity")]
        [SerializeField] float jumpHeight = 1.4f;
        [SerializeField] float gravity = -22f;

        [Header("Refs")]
        [SerializeField] Transform cameraTransform;
        [SerializeField] Animator animator; // optional; uses float "Speed" and bool "Grounded"

        CharacterController _cc;
        Vector3 _velocity;
        bool _controlsEnabled = true;

        public bool IsGrounded => _cc.isGrounded;
        public bool IsRunning { get; private set; }
        public Vector3 Velocity => _cc.velocity;
        public float CurrentSpeed { get; private set; }

        /// <summary>Set false during cutscenes, dialog, or scripted puzzle moments.</summary>
        public bool ControlsEnabled
        {
            get => _controlsEnabled;
            set => _controlsEnabled = value;
        }

        public void SetCamera(Transform cam) => cameraTransform = cam;

        void Awake()
        {
            _cc = GetComponent<CharacterController>();
            if (cameraTransform == null && Camera.main != null) cameraTransform = Camera.main.transform;
        }

        void Update()
        {
            Vector2 stick = _controlsEnabled ? TouchInput.Move : Vector2.zero;
            float magnitude = Mathf.Clamp01(stick.magnitude);

            // Camera-relative flat direction.
            Vector3 forward = cameraTransform ? cameraTransform.forward : Vector3.forward;
            Vector3 right = cameraTransform ? cameraTransform.right : Vector3.right;
            forward.y = 0f; right.y = 0f;
            forward.Normalize(); right.Normalize();
            Vector3 wish = (right * stick.x + forward * stick.y);
            if (wish.sqrMagnitude > 1f) wish.Normalize();

            IsRunning = magnitude >= runThreshold;
            float targetSpeed = magnitude < 0.01f ? 0f : (IsRunning ? runSpeed : walkSpeed);
            Vector3 horizontal = wish * targetSpeed;

            if (wish.sqrMagnitude > 0.0001f)
            {
                Quaternion look = Quaternion.LookRotation(wish);
                transform.rotation = Quaternion.Slerp(transform.rotation, look, turnSpeed * Time.deltaTime);
            }

            if (_cc.isGrounded && _velocity.y < 0f) _velocity.y = -2f;

            if (_controlsEnabled && TouchInput.JumpPressed && _cc.isGrounded)
            {
                _velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
                if (animator) animator.SetTrigger("Jump");
            }

            _velocity.y += gravity * Time.deltaTime;

            Vector3 motion = horizontal + Vector3.up * _velocity.y;
            _cc.Move(motion * Time.deltaTime);

            CurrentSpeed = new Vector3(_cc.velocity.x, 0f, _cc.velocity.z).magnitude;
            if (animator)
            {
                animator.SetFloat("Speed", CurrentSpeed / runSpeed);
                animator.SetBool("Grounded", _cc.isGrounded);
            }
        }

        /// <summary>Teleport safely (used by checkpoints / respawn).</summary>
        public void Warp(Vector3 position, Quaternion rotation)
        {
            _cc.enabled = false;
            transform.SetPositionAndRotation(position, rotation);
            _cc.enabled = true;
            _velocity = Vector3.zero;
        }
    }
}
