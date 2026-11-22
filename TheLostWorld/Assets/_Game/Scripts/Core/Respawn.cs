using LostWorld.Companion;
using LostWorld.Player;
using UnityEngine;

namespace LostWorld.Core
{
    /// <summary>
    /// Puts Jason back at the last checkpoint when he falls below the level's kill height or touches a
    /// KillVolume (water, lava). Elena is recovered next to him. No lives or game over in the prototype.
    /// </summary>
    public class RespawnService : MonoBehaviour
    {
        public static RespawnService Instance { get; private set; }

        PlayerController _player;
        CompanionFollower _companion;
        ThirdPersonCamera _cam;
        Vector3 _point;
        Quaternion _rotation = Quaternion.identity;
        float _killY = float.NegativeInfinity;
        float _cooldown;

        void Awake() => Instance = this;

        public void Bind(PlayerController player, CompanionFollower companion, ThirdPersonCamera cam)
        {
            _player = player;
            _companion = companion;
            _cam = cam;
        }

        /// <summary>Called when a level loads.</summary>
        public void ResetForLevel(Vector3 spawn, Quaternion rotation, float killY)
        {
            _point = spawn;
            _rotation = rotation;
            _killY = killY;
        }

        public void SetCheckpoint(Vector3 point, Quaternion rotation)
        {
            _point = point;
            _rotation = rotation;
        }

        void Update()
        {
            if (_cooldown > 0f) _cooldown -= Time.deltaTime;
            if (_player && _player.transform.position.y < _killY) RespawnPlayer();
            if (_companion && _companion.transform.position.y < _killY) RecoverCompanion();
        }

        public void RespawnPlayer()
        {
            if (_player == null || _cooldown > 0f) return;
            _cooldown = 0.5f;
            _player.Warp(_point, _rotation);
            if (_cam) _cam.Snap();
            RecoverCompanion();
            WorldMessage.Show("Careful...");
        }

        public void RecoverCompanion()
        {
            if (_companion == null || _player == null) return;
            _companion.WarpTo(FindGroundNear(_player.transform));
        }

        /// <summary>
        /// A spot next to Jason that has solid ground under it (not lava, water or a drop), so Elena is not
        /// warped straight back into the hazard she fell into. Falls back to just above Jason.
        /// </summary>
        static Vector3 FindGroundNear(Transform p)
        {
            Vector3[] offsets = { -p.forward, p.right, -p.right, p.forward };
            foreach (var o in offsets)
            {
                Vector3 probe = p.position + o * 1.2f + Vector3.up * 2f;
                if (Physics.Raycast(probe, Vector3.down, out RaycastHit hit, 4f, ~0, QueryTriggerInteraction.Ignore)
                    && hit.normal.y > 0.7f)
                    return hit.point + Vector3.up * 0.1f;
            }
            return p.position + Vector3.up * 2f;
        }
    }

    /// <summary>Water, lava, pits: touching it sends Jason back to his checkpoint.</summary>
    [RequireComponent(typeof(Collider))]
    public class KillVolume : MonoBehaviour
    {
        void OnTriggerEnter(Collider other)
        {
            var rs = RespawnService.Instance;
            if (rs == null) return;
            if (other.GetComponentInParent<PlayerController>() != null) rs.RespawnPlayer();
            else if (other.GetComponentInParent<CompanionFollower>() != null) rs.RecoverCompanion();
        }
    }

    /// <summary>Walk through to move the respawn point here.</summary>
    [RequireComponent(typeof(Collider))]
    public class CheckpointTrigger : MonoBehaviour
    {
        bool _reached;

        void OnTriggerEnter(Collider other)
        {
            if (_reached || other.GetComponentInParent<PlayerController>() == null) return;
            _reached = true;
            RespawnService.Instance?.SetCheckpoint(transform.position, other.transform.rotation);
            WorldMessage.Show("Checkpoint");
        }
    }
}
