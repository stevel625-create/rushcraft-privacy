using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace LostWorld.EditorTools
{
    /// <summary>
    /// Mobile builds from the menu or headless CI.
    ///
    /// Menu:  Lost World > Build > Android APK (test) | Android AAB (Play Store) | iOS Xcode Project
    /// CLI:   Unity -batchmode -quit -projectPath TheLostWorld -buildTarget Android
    ///          -executeMethod LostWorld.EditorTools.BuildScript.BuildFromCommandLine
    ///          -customBuildPath Builds/Android/TheLostWorld.apk
    ///
    /// Accepts the arguments game-ci/unity-builder passes (-customBuildPath, -androidExportType,
    /// -androidKeystoreName/-Pass, -androidKeyaliasName/-Pass, -buildVersion, -androidVersionCode).
    /// No signing secrets live in this file or the repo.
    /// </summary>
    public static class BuildScript
    {
        const string OutRoot = "Builds";

        [MenuItem("Lost World/Build/Android APK (test install)", priority = 20)]
        public static void BuildAndroidApk() =>
            Build(BuildTarget.Android, $"{OutRoot}/Android/TheLostWorld.apk", development: true);

        [MenuItem("Lost World/Build/Android AAB (Play Store)", priority = 21)]
        public static void BuildAndroidAab() =>
            Build(BuildTarget.Android, $"{OutRoot}/Android/TheLostWorld.aab", development: false);

        [MenuItem("Lost World/Build/iOS Xcode Project", priority = 22)]
        public static void BuildIos() =>
            Build(BuildTarget.iOS, $"{OutRoot}/iOS", development: false);

        /// <summary>Headless entry point. Exits the editor with 0 on success, 1 on failure.</summary>
        public static void BuildFromCommandLine()
        {
            var args = ParseArgs();
            try
            {
                BuildTarget target = EditorUserBuildSettings.activeBuildTarget;
                if (args.TryGetValue("buildTarget", out string t) && Enum.TryParse(t, true, out BuildTarget parsed))
                    target = parsed;

                string path = args.TryGetValue("customBuildPath", out string p) ? p : DefaultPath(target, args);

                if (target == BuildTarget.Android)
                {
                    // game-ci passes androidAppBundle | androidPackage | androidStudioProject.
                    if (args.TryGetValue("androidExportType", out string export))
                    {
                        if (export == "androidAppBundle" && !path.EndsWith(".aab")) path = Path.ChangeExtension(path, ".aab");
                        if (export == "androidPackage" && !path.EndsWith(".apk")) path = Path.ChangeExtension(path, ".apk");
                    }
                    ApplyAndroidSigning(args);
                    if (args.TryGetValue("androidVersionCode", out string vc) && int.TryParse(vc, out int code))
                        PlayerSettings.Android.bundleVersionCode = code;
                }

                if (args.TryGetValue("buildVersion", out string version) && !string.IsNullOrEmpty(version) && version != "none")
                    PlayerSettings.bundleVersion = version;

                bool dev = args.ContainsKey("development");
                bool ok = Build(target, path, dev);
                EditorApplication.Exit(ok ? 0 : 1);
            }
            catch (Exception e)
            {
                Debug.LogError($"[BuildScript] {e}");
                EditorApplication.Exit(1);
            }
        }

        static string DefaultPath(BuildTarget target, Dictionary<string, string> args) => target switch
        {
            BuildTarget.Android => args.TryGetValue("androidExportType", out string e) && e == "androidAppBundle"
                ? $"{OutRoot}/Android/TheLostWorld.aab"
                : $"{OutRoot}/Android/TheLostWorld.apk",
            BuildTarget.iOS => $"{OutRoot}/iOS",
            _ => $"{OutRoot}/{target}/TheLostWorld"
        };

        public static bool Build(BuildTarget target, string path, bool development)
        {
            ProjectSetup.RunAll();

            BuildTargetGroup group = BuildPipeline.GetBuildTargetGroup(target);
            if (EditorUserBuildSettings.activeBuildTarget != target)
                EditorUserBuildSettings.SwitchActiveBuildTarget(group, target);

            if (target == BuildTarget.Android)
                EditorUserBuildSettings.buildAppBundle = path.EndsWith(".aab", StringComparison.OrdinalIgnoreCase);

            string dir = target == BuildTarget.iOS ? path : Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

            var options = new BuildPlayerOptions
            {
                scenes = new[] { ProjectSetup.ScenePath },
                locationPathName = path,
                target = target,
                targetGroup = group,
                options = development ? BuildOptions.Development : BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary s = report.summary;
            Debug.Log($"[BuildScript] {target} -> {path}: {s.result}, {s.totalSize / (1024f * 1024f):F1} MB, " +
                      $"{s.totalErrors} errors, {s.totalTime.TotalSeconds:F0}s");
            return s.result == BuildResult.Succeeded;
        }

        static void ApplyAndroidSigning(Dictionary<string, string> args)
        {
            // Without a keystore, Unity signs with the debug key: fine for test installs, rejected by Google Play.
            if (!args.TryGetValue("androidKeystoreName", out string ks) || string.IsNullOrEmpty(ks) || !File.Exists(ks))
            {
                PlayerSettings.Android.useCustomKeystore = false;
                Debug.Log("[BuildScript] No keystore supplied: using the debug signing key.");
                return;
            }

            PlayerSettings.Android.useCustomKeystore = true;
            PlayerSettings.Android.keystoreName = ks;
            PlayerSettings.Android.keystorePass = args.TryGetValue("androidKeystorePass", out string kp) ? kp : "";
            PlayerSettings.Android.keyaliasName = args.TryGetValue("androidKeyaliasName", out string an) ? an : "";
            PlayerSettings.Android.keyaliasPass = args.TryGetValue("androidKeyaliasPass", out string ap) ? ap : "";
        }

        static Dictionary<string, string> ParseArgs()
        {
            var result = new Dictionary<string, string>();
            string[] a = Environment.GetCommandLineArgs();
            for (int i = 0; i < a.Length; i++)
            {
                if (!a[i].StartsWith("-")) continue;
                string key = a[i].TrimStart('-');
                string value = i + 1 < a.Length && !a[i + 1].StartsWith("-") ? a[i + 1] : "";
                result[key] = value;
            }
            return result;
        }
    }
}
