using UnityEngine;

namespace LostWorld.Core
{
    /// <summary>
    /// Ticks TouchInput once per frame before gameplay scripts read it.
    /// Set Script Execution Order: InputRouter = -100 (GameBootstrap adds this automatically).
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public class InputRouter : MonoBehaviour
    {
        void Update()
        {
            if (GameState.Paused) return;
            TouchInput.Tick();
        }
    }

    /// <summary>Global pause flag. Pausing freezes gameplay Update via GameState checks in controllers.</summary>
    public static class GameState
    {
        public static bool Paused { get; private set; }

        public static void SetPaused(bool paused)
        {
            Paused = paused;
            Time.timeScale = paused ? 0f : 1f;
        }
    }
}
