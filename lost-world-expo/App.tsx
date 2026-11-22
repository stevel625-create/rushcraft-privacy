import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Game } from './src/engine/game';
import { AudioService } from './src/audio/AudioService';
import { VOICE_SECONDS } from './src/audio/voices';
import { loadCharacterModels } from './src/models/loadModels';
import { LEVELS } from './src/levels';
import {
  deleteSave, readMockOwned, readSave, readUnlocked, resetMockOwned, resetUnlocks, setMockOwned, unlockThrough, writeSave,
} from './src/storage';
import { PRODUCTS } from './src/store/catalog';
import { GameView, type ViewMode } from './src/ui/GameView';
import { LevelComplete, LevelSelect, MainMenu, PauseMenu, Settings, Store } from './src/ui/Menus';

type Screen = 'menu' | 'levels' | 'settings' | 'store' | 'playing' | 'paused' | 'complete';

function createGame() {
  const g = new Game();
  g.loadLevel(0); // menu backdrop
  g.player.controlsEnabled = false;
  return g;
}

export default function App() {
  const [game] = useState(createGame);
  const [audio] = useState(() => new AudioService());
  const [soundOn, setSoundOn] = useState(true);
  const [screen, setScreen] = useState<Screen>('menu');
  const [hasSave, setHasSave] = useState(false);
  const [unlocked, setUnlocked] = useState(1);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [complete, setComplete] = useState<{ title: string; hasNext: boolean } | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web') ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    readSave().then((s) => setHasSave(s !== null));
    readUnlocked().then(setUnlocked);
    readMockOwned(PRODUCTS.map((p) => p.id)).then(setOwned);
    if (Platform.OS === 'web') (globalThis as { __lostWorld?: Game }).__lostWorld = game; // automated browser tests
    // Rigged character models (if installed with tools/prepare-models.mjs) replace the built-in figures.
    loadCharacterModels()
      .then((c) => { if (c) game.setCharacterVisuals(c.jason, c.elena); console.log('[LostWorld] character models:', c ? Object.keys(c).join(', ') : 'none installed'); })
      .catch((e) => console.warn('[LostWorld] character models failed to load, using built-in figures:', e));
  }, [game]);

  // Audio: effects, loops, ambience, dialogue voices (recording or text-to-speech), haptics.
  useEffect(() => {
    audio.init();
    game.dialogue.recordedDurations = VOICE_SECONDS;
    const offs = [
      game.on('sound', (n) => audio.play(n)),
      game.on('loop', (n, on) => audio.loop(n, on)),
      game.on('ambience', (n) => audio.setAmbience(n)),
      game.on('dialogue', (line) => audio.say(line)),
      game.on('haptic', (k) => audio.haptic(k)),
    ];
    return () => { offs.forEach((off) => off()); audio.dispose(); };
  }, [game, audio]);

  useEffect(() => {
    const offs = [
      game.on('save', (d) => { writeSave(d).then((ok) => ok && setHasSave(true)); }),
      game.on('unlock', (i) => { unlockThrough(i).then(setUnlocked); }),
      game.on('levelComplete', (title, hasNext) => { setComplete({ title, hasNext }); setScreen('complete'); }),
    ];
    return () => offs.forEach((off) => off());
  }, [game]);

  const flash = (text: string) => { setNote(text); setTimeout(() => setNote(''), 2500); };

  /** `intro`: play the plane-crash opening first (New Game). */
  const startLevel = useCallback((index: number, intro = false) => {
    game.paused = false;
    audio.resumeAll();
    game.loadLevel(index, null, { intro });
    if (intro) game.startOpening();
    writeSave(game.snapshot()).then((ok) => ok && setHasSave(true));
    setComplete(null);
    setScreen('playing');
  }, [game, audio]);

  const onContinue = async () => {
    const s = await readSave();
    if (!s) return startLevel(0);
    const idx = Math.max(0, Math.min(LEVELS.length - 1, s.levelIndex));
    if (s.objectiveIndex >= LEVELS[idx].objectives.length) return startLevel(Math.min(idx + 1, LEVELS.length - 1));
    game.paused = false;
    game.loadLevel(idx, s);
    setScreen('playing');
  };

  const pause = useCallback(() => { game.paused = true; audio.pauseAll(); setScreen('paused'); }, [game, audio]);
  const resume = () => { game.paused = false; audio.resumeAll(); setScreen('playing'); };
  const toMenu = () => { game.paused = false; game.dialogue.clear(); audio.resumeAll(); game.player.controlsEnabled = false; setScreen('menu'); };

  const mode: ViewMode = screen === 'playing' ? 'play' : screen === 'paused' ? 'frozen' : 'idle';

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar hidden />
      <GameView game={game} mode={mode} onPause={pause} />

      {screen === 'menu' && (
        <MainMenu hasSave={hasSave} onNew={() => { deleteSave(); startLevel(0, true); }} onContinue={onContinue}
          onLevels={() => setScreen('levels')} onSettings={() => setScreen('settings')} onStore={() => setScreen('store')} />
      )}
      {screen === 'levels' && <LevelSelect unlocked={unlocked} onPick={startLevel} onBack={() => setScreen('menu')} />}
      {screen === 'settings' && (
        <Settings
          note={note}
          onEraseSave={() => { deleteSave(); setHasSave(false); flash('Saved progress erased'); }}
          onResetUnlocks={() => { resetUnlocks(); setUnlocked(1); flash('Level unlocks reset'); }}
          onResetPurchases={() => { resetMockOwned(PRODUCTS.map((p) => p.id)); setOwned(new Set()); flash('Mock purchases reset'); }}
          soundOn={soundOn}
          onToggleSound={() => { const next = !soundOn; setSoundOn(next); audio.setMuted(!next); }}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'store' && (
        <Store owned={owned} onBack={() => setScreen('menu')}
          onBuy={(id) => { setMockOwned(id); setOwned((o) => new Set(o).add(id)); }} />
      )}
      {screen === 'paused' && (
        <PauseMenu note={note} onResume={resume} onMenu={toMenu}
          onSave={() => writeSave(game.snapshot()).then((ok) => { if (ok) setHasSave(true); flash(ok ? 'Checkpoint saved' : 'Save failed'); })} />
      )}
      {screen === 'complete' && complete && (
        <LevelComplete title={complete.title} hasNext={complete.hasNext} onMenu={toMenu}
          onNext={() => startLevel(game.levelIndex + 1)} />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050a07' },
});
