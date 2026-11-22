using System;
using System.Collections.Generic;
using LostWorld.Core;
using LostWorld.Interaction;
using LostWorld.Missions;
using UnityEngine;
using Object = UnityEngine.Object;
using Random = UnityEngine.Random;

namespace LostWorld.Environment
{
    /// <summary>
    /// Toolkit for building levels from primitives and generated meshes (no paid assets).
    /// Everything it creates sits under Root, and the materials and meshes it allocates are freed in Dispose,
    /// so switching levels does not leak memory on device.
    /// </summary>
    public class WorldKit : IDisposable
    {
        public Transform Root { get; }
        readonly List<Object> _owned = new List<Object>();

        public WorldKit(string name, int seed)
        {
            Root = new GameObject(name).transform;
            Random.InitState(seed);
        }

        // ---------- Materials ----------

        public Material Mat(Color c, float smoothness = 0.2f)
        {
            var m = MaterialFactory.Create(c, smoothness);
            _owned.Add(m);
            return m;
        }

        // ---------- Hierarchy ----------

        public Transform Group(string name, Transform parent = null)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent ? parent : Root, false);
            return go.transform;
        }

        public GameObject Prim(PrimitiveType type, Vector3 pos, Vector3 scale, Material mat, Transform parent,
            float yaw = 0f, bool collider = true)
        {
            var go = GameObject.CreatePrimitive(type);
            go.transform.SetParent(parent ? parent : Root, false);
            go.transform.SetPositionAndRotation(pos, Quaternion.Euler(0f, yaw, 0f));
            go.transform.localScale = scale;
            go.GetComponent<Renderer>().sharedMaterial = mat;

            // DestroyImmediate (fine for runtime-created objects) so GetComponent<Collider>() is correct straight away.
            if (!collider)
            {
                Object.DestroyImmediate(go.GetComponent<Collider>());
            }
            else if (type == PrimitiveType.Cylinder)
            {
                // The built-in cylinder ships with a CapsuleCollider: domed tops, and wide thin discs turn into
                // big spheres. A convex MeshCollider matches the visible flat-topped shape.
                Object.DestroyImmediate(go.GetComponent<Collider>());
                var mc = go.AddComponent<MeshCollider>();
                mc.sharedMesh = go.GetComponent<MeshFilter>().sharedMesh;
                mc.convex = true;
            }
            return go;
        }

        public GameObject Box(Vector3 pos, Vector3 scale, Material mat, Transform parent, float yaw = 0f, bool collider = true)
            => Prim(PrimitiveType.Cube, pos, scale, mat, parent, yaw, collider);

        // ---------- Terrain ----------

        /// <summary>Square heightfield mesh centred on <paramref name="center"/> with a matching MeshCollider.</summary>
        public GameObject Ground(Vector3 center, float size, int grid, Func<float, float, float> height, Material mat)
        {
            int v = grid + 1;
            var verts = new Vector3[v * v];
            var uvs = new Vector2[v * v];
            float step = size / grid, half = size * 0.5f;

            for (int z = 0; z < v; z++)
                for (int x = 0; x < v; x++)
                {
                    float wx = center.x + x * step - half;
                    float wz = center.z + z * step - half;
                    verts[z * v + x] = new Vector3(wx, center.y + height(wx, wz), wz);
                    uvs[z * v + x] = new Vector2(x, z) * 0.25f;
                }

            var tris = new int[grid * grid * 6];
            int t = 0;
            for (int z = 0; z < grid; z++)
                for (int x = 0; x < grid; x++)
                {
                    int i = z * v + x;
                    tris[t++] = i; tris[t++] = i + v; tris[t++] = i + 1;
                    tris[t++] = i + 1; tris[t++] = i + v; tris[t++] = i + v + 1;
                }

            var mesh = new Mesh { name = "Ground", indexFormat = UnityEngine.Rendering.IndexFormat.UInt32 };
            mesh.vertices = verts;
            mesh.uv = uvs;
            mesh.triangles = tris;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            _owned.Add(mesh);

            var go = new GameObject("Ground");
            go.transform.SetParent(Root, false);
            go.AddComponent<MeshFilter>().sharedMesh = mesh;
            go.AddComponent<MeshRenderer>().sharedMaterial = mat;
            go.AddComponent<MeshCollider>().sharedMesh = mesh;
            return go;
        }

        /// <summary>Flat liquid surface (water, lava). With kill = true, touching it respawns Jason.</summary>
        public GameObject Liquid(Vector3 center, Vector2 size, Material mat, bool kill)
        {
            var go = Box(center, new Vector3(size.x, 0.2f, size.y), mat, Root, 0f, true);
            go.name = kill ? "Liquid_Kill" : "Liquid";
            var col = go.GetComponent<Collider>();
            col.isTrigger = true;
            if (kill) go.AddComponent<KillVolume>();
            return go;
        }

        // ---------- Props ----------

        public GameObject Tree(Vector3 basePos, Transform parent, Material trunk, Material leaf, float minH = 5f, float maxH = 9f)
        {
            float h = Random.Range(minH, maxH);
            var t = Prim(PrimitiveType.Cylinder, basePos + Vector3.up * h * 0.5f, new Vector3(0.35f, h * 0.5f, 0.35f), trunk, parent);
            t.name = "TreeTrunk";
            var c = Prim(PrimitiveType.Sphere, basePos + Vector3.up * (h + 0.6f), Vector3.one * Random.Range(2.6f, 3.8f), leaf, t.transform.parent, 0f, false);
            c.name = "TreeCanopy";
            return t;
        }

        public Light PointLight(Vector3 pos, Color color, float range, float intensity, Transform parent)
        {
            var go = new GameObject("PointLight");
            go.transform.SetParent(parent ? parent : Root, false);
            go.transform.position = pos;
            var l = go.AddComponent<Light>();
            l.type = LightType.Point;
            l.color = color;
            l.range = range;
            l.intensity = intensity;
            l.shadows = LightShadows.None; // point-light shadows are too expensive on mobile
            return l;
        }

        /// <summary>A flame: small glowing sphere plus a point light, grouped so it can be toggled as one.</summary>
        public GameObject Flame(Vector3 pos, Transform parent, Material flameMat)
        {
            var g = Group("Flame", parent);
            Prim(PrimitiveType.Sphere, pos, Vector3.one * 0.45f, flameMat, g, 0f, false);
            PointLight(pos + Vector3.up * 0.3f, new Color(1f, 0.6f, 0.25f), 9f, 2.2f, g);
            return g.gameObject;
        }

        public Interactable MakeInteractable(GameObject go, string prompt)
        {
            var it = go.AddComponent<Interactable>();
            it.SetPrompt(prompt);
            return it;
        }

        /// <summary>Examinable object that shows a line of text.</summary>
        public void Examine(GameObject go, string prompt, string message)
        {
            MakeInteractable(go, prompt);
            go.AddComponent<InteractAction>().Configure(null, message);
        }

        public SlidingDoor Door(Vector3 pos, Vector3 scale, Material mat, Transform parent, float yaw = 0f)
        {
            var go = Box(pos, scale, mat, parent, yaw);
            go.name = "Door";
            return go.AddComponent<SlidingDoor>();
        }

        public PressurePlate Plate(Vector3 pos, Material mat, Transform parent)
        {
            var go = Prim(PrimitiveType.Cylinder, pos, new Vector3(1.6f, 0.05f, 1.6f), mat, parent);
            go.name = "PressurePlate";
            go.GetComponent<Collider>().isTrigger = true;
            // Taller invisible trigger so standing on the plate is detected reliably.
            var trigger = go.AddComponent<BoxCollider>();
            trigger.isTrigger = true;
            trigger.size = new Vector3(1f, 40f, 1f);
            trigger.center = new Vector3(0f, 20f, 0f);
            return go.AddComponent<PressurePlate>();
        }

        // ---------- Gameplay volumes ----------

        public void Trigger(string objectiveId, Vector3 pos, float radius)
        {
            var go = new GameObject("Trig_" + objectiveId);
            go.transform.SetParent(Root, false);
            go.transform.position = pos + Vector3.up;
            var sc = go.AddComponent<SphereCollider>();
            sc.isTrigger = true;
            sc.radius = radius;
            go.AddComponent<MissionTrigger>().Configure(objectiveId);
        }

        public void Checkpoint(Vector3 pos, float radius = 3f)
        {
            var go = new GameObject("Checkpoint");
            go.transform.SetParent(Root, false);
            go.transform.position = pos + Vector3.up * 0.3f;
            var sc = go.AddComponent<SphereCollider>();
            sc.isTrigger = true;
            sc.radius = radius;
            go.AddComponent<CheckpointTrigger>();
        }

        // ---------- Cleanup ----------

        public void Dispose()
        {
            if (Root)
            {
                // Deactivate first so FindObjectsByType and triggers ignore it during the rest of this frame.
                Root.gameObject.SetActive(false);
                Object.Destroy(Root.gameObject);
            }
            foreach (var o in _owned) if (o) Object.Destroy(o);
            _owned.Clear();
        }
    }
}
