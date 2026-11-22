# THE LOST WORLD — Chapter 1 prototype (Unity 6, URP)

Zorvex Entertainment · iOS and Android · third-person jungle adventure

This folder is the Unity project for the first playable prototype (Chapter 1: The Crash).
Everything is generated at runtime from one bootstrap component, so the scene file stays tiny
and free of merge conflicts.

## Status

**Written, not yet run in the Unity Editor.** The C# has been syntax-checked (tree-sitter parse of
all 17 files, no errors). It has *not* been compiled against UnityEngine, and no play-mode test has run.
Expect a short round of compile fixes on first open. See "Verification still needed" below.

## Project layout

```
TheLostWorld/
  Assets/_Game/
    Scripts/
      Core/          GameBootstrap (entry point), InputRouter, GameState
      Player/        PlayerController, ThirdPersonCamera
      Companion/     CompanionFollower (Elena's AI)
      Missions/      MissionManager, MissionTrigger, CooperativePuzzle, PressurePlate
      Interaction/   Interactable, InteractionDetector
      Environment/   JungleBuilder (procedural jungle, crash site, temple)
      Save/          SaveSystem (JSON checkpoint)
      UI/            GameHUD (in-game), MainMenu (Play/Continue/Settings/Store)
      Monetization/  IStoreService, ProductCatalog, MockStoreService
    Scenes/          (put your empty scene here)
    Prefabs/  Materials/   (reserved)
  Packages/manifest.json   URP, Input System (installed, not used by the prototype), uGUI, TMP, AI Navigation
  ProjectSettings/ProjectVersion.txt   target editor 6000.0.x (adjust to your installed Unity 6 LTS)
```

## Unity Editor setup (about 5 minutes)

1. **Open the project.** In Unity Hub, *Add project from disk* → select the `TheLostWorld` folder.
   Use Unity 6 LTS (6000.0.x). Let it resolve the packages in `Packages/manifest.json`.
2. **Render pipeline.** Create a URP asset if prompted: *Edit → Project Settings → Graphics → Default Render Pipeline*
   should point at a `UniversalRenderPipelineAsset`. Keep the default Universal 3D template settings.
3. **Input.** The prototype uses the legacy Input Manager (default for new projects). Confirm
   *Edit → Project Settings → Player → Other Settings → Active Input Handling* is **Input Manager (Old)** or **Both**.
4. **Scene.** *File → New Scene → Basic (URP)*. Save it as `Assets/_Game/Scenes/Chapter1.unity`.
   Delete nothing; the bootstrap reuses the default Main Camera and Directional Light if they exist.
5. **Bootstrap.** Create an empty GameObject named `GameBootstrap`, add the `GameBootstrap` component
   (namespace `LostWorld.Core`). Leave *Build On Start* ticked.
6. **Play.** Press Play. The main menu appears. Press **PLAY**.

### Controls

| Action | Touch | Editor / keyboard |
|---|---|---|
| Move | left half of screen (floating joystick) | WASD / arrows |
| Run | push the joystick past ~85% | Shift is not bound; run at full stick |
| Rotate camera | drag right half of screen | hold right mouse button and move |
| Jump | JUMP button | Space |
| Interact | USE button (appears near objects) | E |
| Pause | II button (top right) | — |

### Mobile build settings (when you're ready to test on a device)

- *Player → Other Settings*: set Bundle ID (e.g. `com.zorvex.thelostworld`), minimum iOS 15 / Android API 26.
- *Graphics*: keep the URP Mobile asset profile (lower shadow distance, no HDR, no MSAA on low-end).
- *Quality*: use the *Mobile* level or equivalent.
- Build for a device, not the simulator, to judge frame rate. Target 30 fps minimum, 60 fps on mid-tier devices.

## Mission flow (Chapter 1)

| # | Mission | Completed by |
|---|---|---|
| 1 | Find Elena | Jason walks to Elena's position (`Trig_FindElena`) |
| 2 | Investigate the crash site | Jason enters the wreck (`Trig_CrashSite`). Logbook and radio are examinable |
| 3 | Follow the ancient trail | Jason walks the stone trail (`Trig_Trail`) |
| 4 | Reach the temple entrance | Jason reaches the plaza (`Trig_Temple`) |
| 5 | Solve the first cooperative puzzle | Jason on the left plate and Elena on the right plate, held 1 s. The temple door opens |

Missions advance strictly in order. `MissionManager.Complete` ignores out-of-order calls.

## Save & checkpoints

- The **SAVE CHECKPOINT** button in the pause menu writes `chapter1_save.json` to `Application.persistentDataPath`.
- It stores: mission index, Jason's position and heading, and whether the puzzle is solved.
- **CONTINUE** on the main menu restores that state. It is greyed out when no save exists.
- **ERASE LOCAL SAVE** in Settings deletes it. All file IO is wrapped in try/catch.

## Monetization (architecture only, no real purchases)

- `IStoreService` is the seam between gameplay and the store. `ProductCatalog` defines the SKUs in the plan:
  Chapter 2, Chapter 3, two cosmetic outfits, and the Complete Adventure bundle. Chapter 1 is free.
- The prototype uses `MockStoreService`. Confirming a purchase in the Store only grants the item locally.
  Nothing is charged, and no store credentials exist in the project.
- **Production:** implement `UnityIapStoreService : IStoreService` on top of Unity IAP (`com.unity.purchasing`),
  with Apple (StoreKit) and Google Play Billing. Put the real SKUs in the App Store Connect and Google Play Console
  and load the Unity Gaming Services project ID from the dashboard. Do **not** commit keys.
  `StoreServiceFactory` is the one place to switch implementations.

## What is implemented vs. what needs the editor

| Area | Status |
|---|---|
| Folder structure, package manifest, .gitignore | Done |
| Touch joystick (floating), drag camera, keyboard fallback | Written. Needs on-device testing for feel and dead zones |
| Player controller: walk, run, jump, gravity, camera-relative move | Written. Needs play-mode tuning (speeds, jump height) |
| Third-person camera with touch orbit and occlusion pull-in | Written. Needs play-mode check |
| Climbing | **Not implemented.** The brief asks for "basic climbing"; the hook is not built yet |
| Elena follow AI: following band, waits, obstacle steering, catch-up warp | Written. No NavMesh; steering is raycast-based |
| Elena scripted walk (`WalkTo`) for puzzles | API present; no scripted sequence authored yet |
| Procedural jungle: ground mesh, trees, rocks, bushes, trail, temple, crash site | Written from primitives. Visual quality is basic by design |
| Stylized materials, fog, sun | Basic flat colours plus fog. No art pass |
| Mission system (5 missions, strict order) + triggers | Written |
| Cooperative puzzle (two plates, Jason + Elena) | Written. Elena is scripted to walk to her plate when mission 5 starts, then resumes following. Check her stopping point on the plate in play |
| Interaction system (prompt, USE button, examine) | Written. Two examinables (logbook, radio). The radio is not wired to a mission yet |
| Main menu: Play, Continue, Settings, Store | Written |
| Pause menu and checkpoint save | Written |
| Mock store with confirmation dialog | Written. Mock only |
| Unity IAP production store | **Not implemented.** Interface and catalog only |
| Animations (Jason, Elena) | **Not implemented.** Placeholder capsules; the Animator hooks are optional |
| Audio | **Not implemented** |
| Mobile performance pass (LOD, batching, texture budget) | **Not done.** Tree and vegetation counts are set low (`JungleBuilder`) but untested |

### Verification still needed (in the Editor, not done here)

1. Compile. Expect possible minor errors (e.g. a namespace or a Unity API difference in Unity 6).
2. Play mode: Jason walks, runs, and jumps. Camera follows and rotates.
3. Elena follows at ~2.5 m and waits when Jason stops. Check she doesn't get stuck on trees.
4. Walk the mission chain 1 → 5 end to end, then save and continue.
5. Puzzle: Jason and Elena each stand on their plate and the door opens.
6. Test on a real phone for touch behaviour and frame rate.

## Tuning knobs

Most values are `[SerializeField]` on the components, so you can tune them in the Inspector:
`PlayerController` (speeds, jump), `ThirdPersonCamera` (distance, pitch limits, sensitivity),
`CompanionFollower` (follow and stop distances), `JungleBuilder` (seed, tree/rock/bush counts, terrain size).
