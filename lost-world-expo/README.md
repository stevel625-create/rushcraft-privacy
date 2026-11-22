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

## Controls (touch)

| Action | How |
|---|---|
| Move | Put your left thumb anywhere on the left half and drag (floating joystick). Push it far to run |
| Camera | Drag on the right half |
| Jump | **JUMP** button, bottom right |
| Interact | **USE** button (appears when something is in front of you) |
| Pause | **II**, top right |

Moving, jumping and turning the camera all work at the same time (multi-touch).

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
src/levels/              one file per level
src/ui/                  GameView (expo-gl + three.js + touch), Hud, Menus
src/storage.ts           AsyncStorage saves, unlocks, mock purchases
src/store/catalog.ts     planned products (mock only)
tests/                   headless test suite with an autopilot that plays every level
```

## Checks

```bash
npm test            # 27 checks: physics, level builds, full autopilot playthrough of all 6 levels, Continue, touch
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

## Known limits

- Jason and Elena are built and animated in code (walk, run, jump, idle). They're stylised-realistic, not scanned humans: true photoreal characters need model files (e.g. Mixamo characters you download with your own Adobe account), which can be added later. There's no audio yet.
- Elena can't jump. On gap levels (2, 3, 5) she is placed back next to Jason when she falls.
- No climbing.
- Not yet tested on a physical phone. It renders and plays in a desktop browser, and every level is verified
  completable by the test autopilot, but touch feel and frame rate need checking on your iPhone.
