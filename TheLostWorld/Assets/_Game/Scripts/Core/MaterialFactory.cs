using UnityEngine;
using UnityEngine.Rendering;

namespace LostWorld.Core
{
    /// <summary>
    /// Creates coloured runtime materials that survive player builds.
    /// Shader.Find alone is not safe on device: Unity strips shaders that no built asset references.
    /// ProjectSetup (editor) saves Resources/LostWorld_BaseLit.mat, which pins the URP Lit shader into the build;
    /// every runtime material is a copy of it.
    /// </summary>
    public static class MaterialFactory
    {
        public const string BaseMaterialResource = "LostWorld_BaseLit";
        static Material _base;

        public static Material Create(Color color, float smoothness = 0.2f)
        {
            var m = new Material(GetBase()) { color = color };
            if (m.HasProperty("_BaseColor")) m.SetColor("_BaseColor", color);
            if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", smoothness);
            return m;
        }

        static Material GetBase()
        {
            if (_base != null) return _base;

            _base = Resources.Load<Material>(BaseMaterialResource);
            if (_base != null) return _base;

            // Editor fallback before ProjectSetup has run. Pick the shader that matches the active pipeline,
            // otherwise URP shaders render magenta under the built-in pipeline.
            bool urpActive = GraphicsSettings.currentRenderPipeline != null;
            Shader s = urpActive ? Shader.Find("Universal Render Pipeline/Lit") : Shader.Find("Standard");
            if (s == null) s = Shader.Find("Universal Render Pipeline/Simple Lit");
            if (s == null) s = Shader.Find("Sprites/Default");
            Debug.LogWarning($"[MaterialFactory] {BaseMaterialResource} missing from Resources; using '{(s ? s.name : "none")}'. " +
                             "Run 'Lost World > Setup Project' before building.");
            _base = new Material(s);
            return _base;
        }
    }
}
