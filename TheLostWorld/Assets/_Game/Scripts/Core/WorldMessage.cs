using System;

namespace LostWorld.Core
{
    /// <summary>Decoupled channel for short on-screen messages from world objects (examine text, pickups).</summary>
    public static class WorldMessage
    {
        public static event Action<string> Shown;

        public static void Show(string message)
        {
            if (!string.IsNullOrEmpty(message)) Shown?.Invoke(message);
        }
    }
}
