using UnityEngine;
using UnityEngine.Events;

namespace LostWorld.Interaction
{
    /// <summary>
    /// Anything Jason can examine or use. The prompt text is shown by the HUD when in range.
    /// Wire behaviour in the inspector via onInteract, or from code via OnInteract.AddListener.
    /// </summary>
    public class Interactable : MonoBehaviour
    {
        [SerializeField] string prompt = "Examine";
        [SerializeField] bool singleUse;
        [SerializeField] UnityEvent onInteract = new UnityEvent();

        bool _used;

        public string Prompt => prompt;
        public bool CanInteract => !_used || !singleUse;
        public UnityEvent OnInteract => onInteract ??= new UnityEvent();

        public void SetPrompt(string text) => prompt = text;

        /// <summary>Permanently disable (puzzle solved, brazier lit). Hides the prompt.</summary>
        public void MarkUsed()
        {
            _used = true;
            singleUse = true;
        }

        public void Interact()
        {
            if (!CanInteract) return;
            _used = true;
            OnInteract.Invoke();
        }
    }
}
