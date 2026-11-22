import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import * as THREE from 'three';
import type { Game } from '../engine/game';
import { Hud } from './Hud';
import { TouchController, buttonZones, type JoystickVisual, type TouchPoint } from './touchController';

export type ViewMode = 'play' | 'idle' | 'frozen';

interface Props {
  game: Game;
  /** play = player in control; idle = menu backdrop with camera drift; frozen = paused. */
  mode: ViewMode;
  onPause(): void;
}

/** three.js needs a canvas-like object; expo-gl gives us only the GL context. */
function fakeCanvas(gl: ExpoWebGLRenderingContext) {
  return {
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    style: {},
    clientHeight: gl.drawingBufferHeight,
    addEventListener: () => {},
    removeEventListener: () => {},
    getContext: () => gl,
  } as unknown as HTMLCanvasElement;
}

/** Some native GL contexts return null here; three.js reads `.alpha` from it. */
function ensureContextAttributes(gl: ExpoWebGLRenderingContext) {
  const original = gl.getContextAttributes?.bind(gl);
  const fallback = { alpha: true, antialias: false, depth: true, stencil: false, premultipliedAlpha: true,
    preserveDrawingBuffer: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false, desynchronized: false };
  (gl as { getContextAttributes: () => unknown }).getContextAttributes = () => original?.() ?? fallback;
}

export function GameView({ game, mode, onPause }: Props) {
  const playing = mode === 'play';
  const { width, height } = useWindowDimensions();
  const [touch] = useState(() => new TouchController(game.input));
  const [joystick, setJoystick] = useState<JoystickVisual>({ active: false, ox: 0, oy: 0, kx: 0, ky: 0 });
  const modeRef = useRef(mode);
  const frame = useRef<number | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { touch.layout(width, height); }, [touch, width, height]);

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

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    ensureContextAttributes(gl);
    const renderer = new THREE.WebGLRenderer({ canvas: fakeCanvas(gl), context: gl as unknown as WebGL2RenderingContext, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
    game.setAspect(gl.drawingBufferWidth / gl.drawingBufferHeight);

    let last = Date.now();
    const loop = () => {
      const now = Date.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (modeRef.current === 'play') game.update(dt);
      else if (modeRef.current === 'idle') game.idle(dt);
      renderer.render(game.scene, game.camera);
      gl.endFrameEXP();
      frame.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const points = (e: GestureResponderEvent): TouchPoint[] =>
    e.nativeEvent.changedTouches.map((t) => ({ id: Number(t.identifier), x: t.pageX, y: t.pageY }));
  const sync = () => setJoystick({ ...touch.joystick });

  return (
    <View style={StyleSheet.absoluteFill}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} msaaSamples={0} />
      {playing && (
        <View
          style={StyleSheet.absoluteFill}
          onTouchStart={(e) => { touch.start(points(e)); sync(); }}
          onTouchMove={(e) => { touch.move(points(e)); sync(); }}
          onTouchEnd={(e) => { touch.end(points(e)); sync(); }}
          onTouchCancel={(e) => { touch.end(points(e)); sync(); }}
        />
      )}
      {playing && (
        <Hud game={game} buttons={buttonZones(width, height)} joystick={joystick} onPause={onPause}
          onPromptChange={(hasPrompt) => touch.setUseEnabled(hasPrompt)} />
      )}
    </View>
  );
}
