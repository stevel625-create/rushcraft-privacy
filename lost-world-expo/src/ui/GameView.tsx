import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { Game, GameMode } from '../engine/game';
import { CinematicOverlay } from './CinematicOverlay';
import { Subtitles } from './Subtitles';
import { Hud } from './Hud';
import { createRenderer, type GLLike } from './renderer';
import { Controls } from './Controls';
import { TouchController, buttonZones, type JoystickVisual } from './touchController';

export type ViewMode = 'play' | 'idle' | 'frozen';

interface Props {
  game: Game;
  /** play = player in control; idle = menu backdrop with camera drift; frozen = paused. */
  mode: ViewMode;
  onPause(): void;
}

export function GameView({ game, mode, onPause }: Props) {
  const playing = mode === 'play';
  const { width, height } = useWindowDimensions();
  const [touch] = useState(() => new TouchController(game.input));
  const [joystick, setJoystick] = useState<JoystickVisual>({ active: false, ox: 0, oy: 0, kx: 0, ky: 0 });
  const modeRef = useRef(mode);
  const [glError, setGlError] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(game.mode);
  useEffect(() => game.on('mode', setGameMode), [game]);
  // Cinematic fade / flash / letterbox, written every frame from the render loop (no re-renders).
  const [fx] = useState(() => ({ fade: new Animated.Value(0), flash: new Animated.Value(0), letterbox: new Animated.Value(0) }));
  const frame = useRef<number | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  const [useEnabled, setUseEnabled] = useState(false);

  // Leaving play mode: hide the joystick (state adjusted during render, as React recommends)...
  const [wasPlaying, setWasPlaying] = useState(playing);
  if (playing !== wasPlaying) {
    setWasPlaying(playing);
    if (!playing) setJoystick({ active: false, ox: 0, oy: 0, kx: 0, ky: 0 });
  }
  // ...and drop any held fingers / keys so Jason doesn't keep walking after a pause.
  useEffect(() => {
    if (!playing) { touch.reset(); game.input.reset(); }
  }, [playing, game, touch]);

  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);

  // Keyboard + mouse on web (desktop preview and automated browser tests).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const keys = new Set<string>();
    const apply = () => {
      const x = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      const y = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
      const walk = keys.has('shift') ? 0.6 : 1;
      game.input.setMove(x * walk, y * walk);
    };
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === ' ') game.input.queueJump();
      else if (k === 'e') game.input.queueInteract();
      else if (k === 'escape' && modeRef.current === 'play') onPause();
      keys.add(k); apply();
    };
    const up = (e: KeyboardEvent) => { keys.delete(e.key.toLowerCase()); apply(); };
    let dragging = false, lx = 0, ly = 0;
    const md = (e: MouseEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; };
    const mm = (e: MouseEvent) => { if (!dragging) return; game.input.addLook(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY; };
    const mu = () => { dragging = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mousedown', md);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
    };
  }, [game, onPause]);

  // The GL drawing buffer is sized once, when the context is created. Create it only once the phone is
  // landscape, and recreate it (new key) if the screen size changes, so the picture is never stretched.
  const landscape = Platform.OS === 'web' || width >= height;
  const glKey = `${Math.round(width)}x${Math.round(height)}`;

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current); // stop the previous context's loop
    const glAny = gl as unknown as GLLike;
    let renderer;
    try {
      console.log('[LostWorld] GL:', gl.getParameter(gl.VERSION), '| webgl2:', glAny.supportsWebGL2,
        '| buffer:', gl.drawingBufferWidth, 'x', gl.drawingBufferHeight);
      renderer = createRenderer(glAny);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn('[LostWorld] Could not start 3D:', message);
      setGlError(message);
      return;
    }
    renderer.setPixelRatio(1);
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
    game.setAspect(gl.drawingBufferWidth / gl.drawingBufferHeight);
    game.setViewportHeight(gl.drawingBufferHeight);

    let last = Date.now();
    const loop = () => {
      const now = Date.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (modeRef.current === 'play') game.update(dt);
      else if (modeRef.current === 'idle') game.idle(dt);
      const cs = game.cinematicState;
      fx.fade.setValue(cs ? cs.fade : 0);
      fx.flash.setValue(cs ? cs.flash : 0);
      fx.letterbox.setValue(cs?.letterbox ? 1 : 0);
      renderer.render(game.scene, game.camera);
      gl.endFrameEXP();
      frame.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const sync = () => setJoystick({ ...touch.joystick });
  const buttons = buttonZones(width, height);

  return (
    <View style={StyleSheet.absoluteFill}>
      {landscape ? (
        <GLView key={glKey} style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} msaaSamples={0} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.rotate]}>
          <Text style={styles.errorTitle}>Turn your phone sideways</Text>
        </View>
      )}
      {glError && (
        <View style={[StyleSheet.absoluteFill, styles.errorBox]} pointerEvents="none">
          <Text style={styles.errorTitle}>3D couldn&apos;t start on this device</Text>
          <Text style={styles.errorText}>{glError}</Text>
        </View>
      )}
      {playing && gameMode === 'play' && <Controls touch={touch} buttons={buttons} useEnabled={useEnabled} onStick={sync} />}
      {playing && gameMode === 'play' && <Hud game={game} buttons={buttons} joystick={joystick} onPause={onPause} onPromptChange={setUseEnabled} />}
      {playing && gameMode === 'cinematic' && (
        <CinematicOverlay fade={fx.fade} flash={fx.flash} letterbox={fx.letterbox} onSkip={() => game.skipCinematic()} />
      )}
      {playing && <Subtitles game={game} tapToSkip={gameMode === 'cinematic'} />}
    </View>
  );
}

const styles = StyleSheet.create({
  rotate: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#050a07' },
  errorBox: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24, paddingHorizontal: 24 },
  errorTitle: { color: '#f2bf40', fontWeight: '800', fontSize: 15 },
  errorText: { color: '#f4f1e8', fontSize: 13, textAlign: 'center', marginTop: 4 },
});
