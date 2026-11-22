using UnityEngine;
using UnityEngine.Events;

namespace LostWorld.Interaction
{
    /// <summary>
    /// Anything Jason can examine or use. The prompt text is shown by the HUD when in range.
    /// Wire behaviour in the inspector via onInteract, or subclass for custom logic.
    /// </summary>
    public class Interactable : MonoBehaviour
    {
        [SerializeField] string prompt = "Examine";
        [SerializeField] bool singleUse;
        [SerializeField] UnityEvent onInteract;

        bool _used;

        public string Prompt => prompt;
        public bool CanInteract => !(singleUse && _used);

        public void SetPrompt(string text) => prompt = text;

        public void Interact()
        {
            if (!CanInteract) return;
            _used = true;
            onInteract?.Invoke();
        }
    }
}
