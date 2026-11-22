using UnityEngine;

namespace LostWorld.Core
{
    /// <summary>
    /// Single source of truth for touch + keyboard fallback input.
    /// Uses the legacy Input Manager (default in new projects), so no extra package setup is needed.
    /// Left half of the screen = virtual joystick, right half = camera drag.
    /// </summary>
    public static class TouchInput
    {
        public static Vector2 Move { get; private set; }
        public static Vector2 LookDelta { get; private set; }
        public static bool JumpPressed { get; private set; }
        public static bool InteractPressed { get; private set; }
        public static bool MoveActive => _moveFinger != -1;
        public static Vector2 MoveOrigin => _moveOrigin;   // screen pixels, for drawing the joystick base

        static int _moveFinger = -1;
        static int _lookFinger = -1;
        static Vector2 _moveOrigin;
        public static float JoystickRadiusPixels = 120f;

        /// <summary>Call once per frame from a single early-updating script (InputRouter).</summary>
        public static void Tick()
        {
            LookDelta = Vector2.zero;
            JumpPressed = false;
            InteractPressed = false;

            if (Input.touchSupported && Input.touchCount > 0)
            {
                ProcessTouches();
            }
            else
            {
                ProcessKeyboard();
            }
        }

        static void ProcessTouches()
        {
            float halfW = Screen.width * 0.5f;
            bool moveActive = false;

            for (int i = 0; i < Input.touchCount; i++)
            {
                Touch t = Input.GetTouch(i);
                bool leftSide = t.position.x < halfW;

                switch (t.phase)
                {
                    case TouchPhase.Began:
                        if (leftSide && _moveFinger == -1)
                        {
                            _moveFinger = t.fingerId;
                            _moveOrigin = t.position;
                        }
                        else if (!leftSide && _lookFinger == -1)
                        {
                            _lookFinger = t.fingerId;
                        }
                        break;

                    case TouchPhase.Moved:
                    case TouchPhase.Stationary:
                        if (t.fingerId == _moveFinger)
                        {
                            Vector2 raw = (t.position - _moveOrigin) / JoystickRadiusPixels;
                            Move = Vector2.ClampMagnitude(raw, 1f);
                            moveActive = true;
                        }
                        else if (t.fingerId == _lookFinger && t.phase == TouchPhase.Moved)
                        {
                            LookDelta += t.deltaPosition;
                        }
                        break;

                    case TouchPhase.Ended:
                    case TouchPhase.Canceled:
                        if (t.fingerId == _moveFinger) { _moveFinger = -1; Move = Vector2.zero; }
                        if (t.fingerId == _lookFinger) { _lookFinger = -1; }
                        break;
                }
            }

            if (!moveActive && _moveFinger == -1) Move = Vector2.zero;
        }

        static void ProcessKeyboard()
        {
            Move = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
            if (Move.sqrMagnitude > 1f) Move.Normalize();

            if (Input.GetMouseButton(1))
            {
                LookDelta = new Vector2(Input.GetAxis("Mouse X") * 25f, Input.GetAxis("Mouse Y") * 25f);
            }
            JumpPressed = Input.GetButtonDown("Jump");
            InteractPressed = Input.GetKeyDown(KeyCode.E);
        }

        /// <summary>UI buttons call this to request a jump / interact for the next frame.</summary>
        public static void QueueJump() => JumpPressed = true;
        public static void QueueInteract() => InteractPressed = true;
    }
}
