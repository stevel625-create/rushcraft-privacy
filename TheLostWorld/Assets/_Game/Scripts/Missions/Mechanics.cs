using System.Collections.Generic;
using LostWorld.Core;
using LostWorld.Interaction;
using LostWorld.Player;
using UnityEngine;

namespace LostWorld.Missions
{
    /// <summary>Stone door that sinks into the ground when opened.</summary>
    public class SlidingDoor : MonoBehaviour
    {
        [SerializeField] float openSeconds = 1.6f;
        Vector3 _closedPos, _openPos;
        float _t = -1f;

        void Awake()
        {
            _closedPos = transform.position;
            _openPos = _closedPos + Vector3.down * (transform.lossyScale.y + 0.05f);
        }

        public void Open()
        {
            if (_t < 0f) _t = 0f;
        }

        public void OpenInstant()
        {
            _t = 1f;
            transform.position = _openPos;
        }

        void Update()
        {
            if (_t < 0f || _t >= 1f) return;
            _t = Mathf.Min(1f, _t + Time.deltaTime / openSeconds);
            transform.position = Vector3.Lerp(_closedPos, _openPos, Mathf.SmoothStep(0f, 1f, _t));
        }
    }

    /// <summary>Something that counts toward a CountedObjective (a pickup, a brazier).</summary>
    public interface ICountedItem
    {
        void MarkDone();
    }

    /// <summary>
    /// "Do X of N" objective. Items may be collected early; the objective completes as soon as it is active
    /// and the count is reached. Optionally opens a door.
    /// </summary>
    public class CountedObjective : MonoBehaviour, IObjectiveMechanic
    {
        string _objectiveId;
        int _required;
        int _count;
        bool _done;
        bool _reported;
        SlidingDoor _door;
        readonly List<ICountedItem> _items = new List<ICountedItem>();

        public string ObjectiveId => _objectiveId;

        public void Configure(string id, int required, SlidingDoor door = null)
        {
            _objectiveId = id;
            _required = required;
            _door = door;
        }

        public void Register(ICountedItem item) => _items.Add(item);

        public void Increment()
        {
            if (_done) return;
            _count = Mathf.Min(_required, _count + 1);
            _reported = false;
        }

        void Update()
        {
            var mm = MissionManager.Instance;
            if (_done || mm == null || mm.CurrentId != _objectiveId) return;

            if (!_reported)
            {
                mm.ReportProgress(_objectiveId, _count, _required);
                _reported = true;
            }
            if (_count >= _required)
            {
                _done = true;
                if (_door) _door.Open();
                mm.Complete(_objectiveId);
            }
        }

        public void ForceComplete()
        {
            _done = true;
            _count = _required;
            foreach (var item in _items) item.MarkDone();
            if (_door) _door.OpenInstant();
        }
    }

    /// <summary>Floating relic shard. Walk into it to collect.</summary>
    [RequireComponent(typeof(Collider))]
    public class Collectible : MonoBehaviour, ICountedItem
    {
        CountedObjective _owner;
        bool _taken;
        Vector3 _basePos;

        public void Bind(CountedObjective owner)
        {
            _owner = owner;
            owner.Register(this);
        }

        void Start() => _basePos = transform.position;

        void Update()
        {
            transform.Rotate(0f, 90f * Time.deltaTime, 0f, Space.World);
            transform.position = _basePos + Vector3.up * (Mathf.Sin(Time.time * 2f) * 0.15f);
        }

        void OnTriggerEnter(Collider other)
        {
            if (_taken || other.GetComponentInParent<PlayerController>() == null) return;
            _taken = true;
            gameObject.SetActive(false);
            if (_owner) _owner.Increment();
            WorldMessage.Show("Relic shard found");
        }

        public void MarkDone()
        {
            _taken = true;
            gameObject.SetActive(false);
        }
    }

    /// <summary>Unlit brazier. Interact to light it (turns on its child light and flame).</summary>
    [RequireComponent(typeof(Interactable))]
    public class Brazier : MonoBehaviour, ICountedItem
    {
        CountedObjective _owner;
        GameObject _flame;
        bool _lit;

        public void Bind(CountedObjective owner, GameObject flame)
        {
            _owner = owner;
            _flame = flame;
            if (_flame) _flame.SetActive(false);
            owner.Register(this);
            GetComponent<Interactable>().OnInteract.AddListener(Light);
        }

        void Light()
        {
            if (_lit) return;
            MarkDone();
            if (_owner) _owner.Increment();
        }

        public void MarkDone()
        {
            _lit = true;
            if (_flame) _flame.SetActive(true);
            GetComponent<Interactable>().MarkUsed();
        }
    }

    /// <summary>Statue that turns 90 degrees per interaction. Aligned when facing its target step.</summary>
    [RequireComponent(typeof(Interactable))]
    public class RotatingStatue : MonoBehaviour
    {
        int _step;
        int _targetStep;
        float _baseYaw;
        bool _locked;

        public bool IsAligned => _step == _targetStep;

        public void Configure(int startStep, int targetStep)
        {
            _baseYaw = transform.eulerAngles.y - startStep * 90f;
            _step = startStep & 3;
            _targetStep = targetStep & 3;
            GetComponent<Interactable>().OnInteract.AddListener(Turn);
        }

        void Turn()
        {
            if (_locked) return;
            _step = (_step + 1) & 3;
        }

        void Update()
        {
            Quaternion target = Quaternion.Euler(0f, _baseYaw + _step * 90f, 0f);
            transform.rotation = Quaternion.RotateTowards(transform.rotation, target, 360f * Time.deltaTime);
        }

        public void Lock(bool snapToTarget)
        {
            _locked = true;
            if (snapToTarget)
            {
                _step = _targetStep;
                transform.rotation = Quaternion.Euler(0f, _baseYaw + _step * 90f, 0f);
            }
            GetComponent<Interactable>().MarkUsed();
        }
    }

    /// <summary>Completes its objective when every statue is aligned. Locks them and opens a door.</summary>
    public class StatuePuzzle : MonoBehaviour, IObjectiveMechanic
    {
        string _objectiveId;
        readonly List<RotatingStatue> _statues = new List<RotatingStatue>();
        SlidingDoor _door;
        bool _solved;

        public string ObjectiveId => _objectiveId;

        public void Configure(string id, SlidingDoor door)
        {
            _objectiveId = id;
            _door = door;
        }

        public void Add(RotatingStatue s) => _statues.Add(s);

        void Update()
        {
            var mm = MissionManager.Instance;
            if (_solved || mm == null || mm.CurrentId != _objectiveId || _statues.Count == 0) return;

            foreach (var s in _statues) if (!s.IsAligned) return;

            _solved = true;
            foreach (var s in _statues) s.Lock(false);
            if (_door) _door.Open();
            WorldMessage.Show("The statues lock into place");
            mm.Complete(_objectiveId);
        }

        public void ForceComplete()
        {
            _solved = true;
            foreach (var s in _statues) s.Lock(true);
            if (_door) _door.OpenInstant();
        }
    }

    /// <summary>
    /// Examine text and/or "interact to complete objective". With no objective id it is a plain examinable.
    /// </summary>
    [RequireComponent(typeof(Interactable))]
    public class InteractAction : MonoBehaviour, IObjectiveMechanic
    {
        string _objectiveId;
        string _message;
        string _notYetMessage;
        bool _done;

        public string ObjectiveId => _objectiveId;

        public void Configure(string objectiveId, string message, string notYetMessage = null)
        {
            _objectiveId = objectiveId;
            _message = message;
            _notYetMessage = notYetMessage;
            GetComponent<Interactable>().OnInteract.AddListener(Use);
        }

        void Use()
        {
            var mm = MissionManager.Instance;
            bool hasObjective = !string.IsNullOrEmpty(_objectiveId);

            if (hasObjective && !_done && mm != null && mm.CurrentId != _objectiveId)
            {
                if (!string.IsNullOrEmpty(_notYetMessage)) WorldMessage.Show(_notYetMessage);
                return;
            }

            if (!string.IsNullOrEmpty(_message)) WorldMessage.Show(_message);

            if (hasObjective && !_done && mm != null && mm.Complete(_objectiveId)) ForceComplete();
        }

        public void ForceComplete()
        {
            _done = true;
            GetComponent<Interactable>().MarkUsed();
        }
    }
}
