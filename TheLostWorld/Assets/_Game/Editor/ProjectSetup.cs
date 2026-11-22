using System.IO;
using LostWorld.Core;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;

namespace LostWorld.EditorTools
{
    /// <summary>
    /// One-click (or headless) project setup so the repo needs no hand-made assets:
    /// URP asset, base material in Resources, Chapter 1 scene in Build Settings, and mobile player settings.
    /// Safe to run repeatedly; each step only creates what is missing.
    /// </summary>
    public static class ProjectSetup
    {
        public const string CompanyName = "Zorvex Entertainment";
        public const string ProductName = "The Lost World";
        public const string BundleId = "com.zorvex.thelostworld";
        public const string Version = "0.1.0";

        const string SettingsDir = "Assets/_Game/Settings";
        const string ResourcesDir = "Assets/_Game/Resources";
        public const string ScenePath = "Assets/_Game/Scenes/Chapter1.unity";

        [MenuItem("Lost World/Setup Project", priority = 0)]
        public static void RunAll()
        {
            EnsureUrp();
            EnsureBaseMaterial();
            EnsureScene();
            ConfigurePlayer();
            AssetDatabase.SaveAssets();
            Debug.Log("[ProjectSetup] Done: URP, base material, Chapter1 scene, player settings.");
        }

        // ---------- URP ----------

        public static void EnsureUrp()
        {
            if (GraphicsSettings.defaultRenderPipeline is UniversalRenderPipelineAsset existing)
            {
                ApplyAllQualityLevels(existing);
                return;
            }

            Directory.CreateDirectory(SettingsDir);
            string rendererPath = SettingsDir + "/Mobile_Renderer.asset";
            string assetPath = SettingsDir + "/Mobile_URP.asset";

            var renderer = AssetDatabase.LoadAssetAtPath<UniversalRendererData>(rendererPath);
            if (renderer == null)
            {
                renderer = ScriptableObject.CreateInstance<UniversalRendererData>();
                AssetDatabase.CreateAsset(renderer, rendererPath);
            }

            var urp = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(assetPath);
            if (urp == null)
            {
                urp = UniversalRenderPipelineAsset.Create(renderer);
                // Mobile-friendly defaults.
                urp.shadowDistance = 40f;
                urp.msaaSampleCount = 1;
                urp.supportsHDR = false;
                urp.renderScale = 1f;
                AssetDatabase.CreateAsset(urp, assetPath);
            }

            GraphicsSettings.defaultRenderPipeline = urp;
            ApplyAllQualityLevels(urp);
            EditorUtility.SetDirty(urp);
        }

        static void ApplyAllQualityLevels(RenderPipelineAsset asset)
        {
            int current = QualitySettings.GetQualityLevel();
            for (int i = 0; i < QualitySettings.names.Length; i++)
            {
                QualitySettings.SetQualityLevel(i, false);
                QualitySettings.renderPipeline = asset;
            }
            QualitySettings.SetQualityLevel(current, false);
        }

        // ---------- Base material (pins the Lit shader into player builds) ----------

        public static void EnsureBaseMaterial()
        {
            Directory.CreateDirectory(ResourcesDir);
            string path = $"{ResourcesDir}/{MaterialFactory.BaseMaterialResource}.mat";
            if (AssetDatabase.LoadAssetAtPath<Material>(path) != null) return;

            Shader s = Shader.Find("Universal Render Pipeline/Lit");
            if (s == null)
            {
                Debug.LogError("[ProjectSetup] URP Lit shader not found. Is com.unity.render-pipelines.universal installed?");
                return;
            }
            AssetDatabase.CreateAsset(new Material(s) { name = MaterialFactory.BaseMaterialResource }, path);
        }

        // ---------- Scene ----------

        public static void EnsureScene()
        {
            if (!File.Exists(ScenePath))
            {
                Directory.CreateDirectory(Path.GetDirectoryName(ScenePath));
                Scene scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
                new GameObject("GameBootstrap").AddComponent<GameBootstrap>();
                EditorSceneManager.SaveScene(scene, ScenePath);
            }

            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        }

        // ---------- Player settings ----------

        public static void ConfigurePlayer()
        {
            PlayerSettings.companyName = CompanyName;
            PlayerSettings.productName = ProductName;
            PlayerSettings.bundleVersion = Version;
            PlayerSettings.colorSpace = ColorSpace.Linear;

            // Landscape only, either way up.
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToLandscapeLeft = true;
            PlayerSettings.allowedAutorotateToLandscapeRight = true;
            PlayerSettings.allowedAutorotateToPortrait = false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;

            // Android
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, BundleId);
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64; // Play Store requires 64-bit
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevelAuto;
            if (PlayerSettings.Android.bundleVersionCode < 1) PlayerSettings.Android.bundleVersionCode = 1;

            // iOS
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.iOS, BundleId);
            PlayerSettings.iOS.targetOSVersionString = "15.0";
            PlayerSettings.iOS.requiresFullScreen = true;
            if (string.IsNullOrEmpty(PlayerSettings.iOS.buildNumber) || PlayerSettings.iOS.buildNumber == "0")
                PlayerSettings.iOS.buildNumber = "1";
        }
    }
}
