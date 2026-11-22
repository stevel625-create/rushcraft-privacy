# The Lost World — Expo Go edition

Zorvex Entertainment · third-person jungle adventure · iOS and Android via **Expo Go** (Expo SDK 58)

Jason Cross and his AI partner Elena Reyes explore six levels, from the jungle crash site to the heart of an
ancient temple. Everything is drawn with three.js on Expo's built-in `expo-gl`: realistic (PBR) materials with
code-generated textures, sun shadows, a sky dome, animated characters, trees and grass, all made in code. No paid assets, no native modules beyond what Expo Go ships, and no build step needed to play on a phone.

## Play it on your iPhone (about 5 minutes)

You need: a Mac with **Node.js 20+** ([nodejs.org](https://nodejs.org)), and the **Expo Go** app from the App Store
on your iPhone. The phone and Mac must be on the same Wi-Fi.

```bash
cd lost-world-expo
npm install
npx expo start
```

A QR code appears in the terminal. Open the iPhone **Camera**, point it at the QR code, and tap the banner to open
it in Expo Go. Turn the phone sideways: the game is landscape.

If the phone can't connect (office or hotel Wi-Fi often blocks it), use `npx expo start --tunnel` instead.

Android works the same way: install Expo Go from Google Play and scan the QR code from inside the Expo Go app.

Desktop preview: `npx expo start --web`, then press `w`. Keyboard: WASD or arrows to move, Shift to walk,
Space to jump, E to use, Esc to pause, and drag the mouse to turn the camera.

## Story, cinematic and dialogue

**New Game** opens with a ~21-second cinematic: the plane flies over the jungle, the right engine catches fire,
the pilot calls a mayday, the plane dives into the canopy and crashes (flash, shake, phone vibration), then
"Some time later..." Jason wakes by the burning wreck and Mission 1, *Find Elena*, begins. Tap **SKIP ›** at
any time. Tap a subtitle during the cinematic to skip that line. Continue and Level Select go straight to gameplay.

Conversations play during gameplay with subtitles, a speaker badge and the character's name. They're triggered by
mission events, for example finding Elena: *"You made it! This isn't just a crash site... there's something here.
Follow me."* All lines are in `src/levels/dialogue.ts`, and their triggers per level are at the bottom of that file.

### Audio

- **Placeholder voices:** the phone's text-to-speech reads each line, with a different pitch per character.
- **Recorded voices:** every line has a stable id such as `l1_found.1`. Save the recording as
  `assets/voice/l1_found.1.m4a` and add one line to `src/audio/voices.ts`. The game plays the recording instead
  of text-to-speech, and the subtitle stays up for the recording's length if you list it in `VOICE_SECONDS`.
- **Sound effects and ambience** are placeholders synthesised in code: engine drone, alarm, crash, fire, wind,
  jungle, cave, lava, temple, pickup, stone door, gong and splash. They're in `assets/audio/` (regenerate with
  `node tools/make-audio.mjs`). Replace any file with a final recording of the same name.
- **Settings → Sound** turns all audio on or off. On iPhone, sound plays even with the silent switch on.

## Characters

Jason (explorer shirt, cargo pants, belt pouch, boots, large backpack with bedroll) and Elena (tank top, cargo
pants, boots, pack, ponytail) are original 3D models generated in code: one skinned mesh each, with smooth joints
and realistic proportions (1.82 m and 1.68 m), 2 materials, and keyframed Idle / Walk / Run / Jump animations.
There are no third-party assets, so there are no licence limits. For motion-captured, lifelike characters, add
Mixamo models (next section). They replace the built-in ones automatically.

## Realistic characters from Mixamo (free)

The game ships with built-in characters. To use lifelike, motion-captured characters instead, download them
from Mixamo (free with an Adobe account) and run one command. Mixamo files may be used in your game but not
redistributed as raw files, so they stay out of git (`assets/models/` is ignored).

1. Go to **mixamo.com** and sign in.
2. **Characters** tab: pick the character for Jason. Click **Download**: Format **FBX Binary (.fbx)**,
   Pose **T-pose**, then save it as `Downloads/mixamo/jason/Jason.fbx`.
3. **Animations** tab, with that character still selected, download each of these with Skin **Without Skin**
   into the same folder. Tick **In Place** where Mixamo offers it:
   - an idle, saved with "idle" in the name (`Idle.fbx`)
   - a walk (`Walking.fbx`)
   - a run (`Running.fbx`)
   - a jump (`Jumping.fbx`, optional)
4. Repeat for Elena into `Downloads/mixamo/elena/`.
5. In Terminal:
   ```bash
   cd ~/Downloads/lost-world-expo
   node tools/prepare-models.mjs jason ~/Downloads/mixamo/jason elena ~/Downloads/mixamo/elena
   npx expo start --clear
   ```

The script converts the FBX files in plain JavaScript and writes them to `assets/models/`. On the next start the
game uses them automatically, blending idle, walk, run and jump with your speed.

## Controls (touch)

| Action | How |
|---|---|
| Move | Put your left thumb anywhere on the left half and drag (floating joystick). Push it far to run |
| Camera | Drag on the right half |
| Jump | **JUMP** button, bottom right |
| Interact | **USE** button (appears when something is in front of you) |
| Pause | **II**, top right |

The MOVE stick sits bottom-left. Moving, jumping and turning the camera all work at the same time (multi-touch).

## Levels

| # | Level | Objectives |
|---|---|---|
| 1 | The Crash | Find Elena → read the pilot's logbook → follow the trail → reach the temple → stand on the plates together |
| 2 | The Sunken Gate | Hop the stepping stones → Elena holds the gate plate → reach the river shrine |
| 3 | Canopy Walk | Collect 3 relic shards on platforms 12 m up → reach the lookout |
| 4 | The Echo Caves | Light 3 braziers in a dark maze → find the exit behind the stone door |
| 5 | Obsidian Peak | Jump basalt columns across lava → climb the spiral stair → ring the summit gong |
| 6 | Heart of the Temple | Turn 3 guardian statues to face the altar → hold the final seal with Elena → claim the relic |

Finishing a level unlocks the next one (**LEVELS** on the main menu). The game autosaves after every objective and
when a level starts. **CONTINUE** resumes where you were, with solved puzzles still solved. Falling, water and lava
send Jason back to his last checkpoint. There's no game over.

## Project layout

```
App.tsx                  screen flow: menu, levels, settings, store, play, pause, level complete
src/engine/              the game, independent of React and GL (runs in Node tests too)
  physics.ts             kinematic collision: boxes, cylinders, ramps, heightfields, character body
  characters.ts          Jason controller, Elena follow AI, orbit camera
  mechanics.ts           triggers, checkpoints, hazards, doors, plates, pickups, braziers, statues
  world.ts               WorldKit: builds meshes + colliders, merges static meshes into few draw calls
  missions.ts, game.ts   objectives and the level/frame orchestration
  dialogue.ts            conversations, line timing, subtitles events
  cinematic.ts, plane.ts the opening plane-crash cinematic and its aircraft
  particles.ts           fire / smoke point-sprite particles
  textures.ts, sky.ts    generated PBR textures, sky dome
src/characters/          built-in Jason / Elena: rig, skinned mesh builder, keyframed clips
src/models/              loader for prepared (Mixamo) character models
src/levels/              one file per level; dialogue.ts = all lines and their mission triggers
src/audio/               AudioService (expo-audio, text-to-speech, haptics), sound and voice registries
src/ui/                  GameView, renderer (Expo Go compatibility), Controls, Hud, Subtitles, CinematicOverlay, Menus
src/storage.ts           AsyncStorage saves, unlocks, mock purchases
src/store/catalog.ts     planned products (mock only)
assets/audio/            placeholder sound effects and ambience (generated)
tools/                   make-audio.mjs (placeholder audio), prepare-models.mjs + fbx.mjs (Mixamo import)
tests/                   headless test suite with an autopilot that plays every level
```

## Checks

```bash
npm test            # 41 checks: physics, renderer compatibility, level builds, autopilot playthrough of all 6 levels,
                    # Continue, touch, dialogue, the opening cinematic and skip, character models (if installed)
npm run typecheck
npm run lint
```

The autopilot drives Jason through each level at 60 Hz: it walks, auto-jumps at gaps, pathfinds the cave maze,
interacts, and waits for Elena on the co-op plates. A level only passes if it is actually completable.

## Monetization

All six levels are free. The Store screen shows the planned products (chapter expansions, outfits, a complete
bundle) with a **mock** purchase flow: confirming only sets a local flag. No money moves and no store is contacted.

Real purchases can't run in Expo Go: they need native store code. When you're ready, make a development build
(`npx expo run:ios` or EAS Build) and add an IAP library such as `expo-iap` or RevenueCat's
`react-native-purchases`. Products are configured in App Store Connect / Google Play Console, never in this repo.

## Renderer compatibility (Expo Go SDK 58)

Installed: three.js **0.187.0**, expo-gl **58.0.4**, Expo **58.0.26**, React Native **0.88.1**. expo-three is not
used: the game drives three.js directly through expo-gl.

**The problem.** expo-gl 57.0.0 ([expo/expo#45871](https://github.com/expo/expo/pull/45871)) made
`WebGL2RenderingContext` inherit from `WebGLRenderingContext`. three.js r163 and later throw
*"THREE.WebGLRenderer: WebGL 1 is not supported since r163"* whenever `context instanceof WebGLRenderingContext`,
so they reject the real WebGL 2 context. expo-gl 58.0.4 ([#51572](https://github.com/expo/expo/pull/51572)) fixed
this in native code. But Expo Go ships native code inside the app binary, built from an earlier 58.0.x, so
**the bug is still present in Expo Go whatever JS package version is installed.** Upgrading three.js doesn't help,
because the check is still there. Downgrading to r162 would avoid it, but at the cost of moving to an older API.

**The fix** (`src/ui/renderer.ts`):

- **Construction:** when the context really is WebGL 2, the renderer hides the `WebGLRenderingContext` global
  only while three.js's constructor runs, checks that it's hidden (it also handles a non-configurable global),
  and restores it exactly afterwards.
- **Texture uploads:** expo-gl's `pixelStorei()` only implements two parameters and logs a warning for every other
  one three.js sets. Default-valued parameters are now dropped in JavaScript, so there's no console spam.
- **Startup queries:** `getParameter()` binding queries that expo-gl doesn't implement return null instead of
  throwing, and `getContextAttributes()` gets a fallback.
- **Unsupported methods:** expo-gl leaves `fenceSync`, `getBufferSubData`, `renderbufferStorageMultisample` and the
  compressed-texture calls unimplemented. They're unused here: no async readback, no MSAA render targets, no
  compressed textures.

## Needs testing on a physical phone

The following were verified in Node tests and a desktop browser, but only a real device can confirm them:

- **3D startup in Expo Go.** The renderer workaround was tested against a simulation of Expo Go's context classes.
  Watch for the `[LostWorld] GL:` line in Terminal.
- **Frame rate** with shadows, textures, grass, particles and two skinned characters.
- **Touch feel:** stick dead-zone, camera sensitivity, multi-touch.
- **Audio:** expo-audio playback, looping, text-to-speech voices, playback with the silent switch on, and the haptic on impact.
- **Mixamo models**, if you install them (FBX conversion is pure JavaScript and tested with a Mixamo-style file).

## Known limits

- Built-in characters are stylised-realistic, not scanned humans. Lifelike characters need model files, such as
  Mixamo characters downloaded with your own Adobe account (see above).
- Voices are text-to-speech placeholders until recordings are added. Sound effects are synthesised placeholders.
- Elena can't jump. On gap levels (2, 3, 5) she is placed back next to Jason when she falls.
- No climbing.
- In-app purchases are a mock (no production IAP in this phase).
