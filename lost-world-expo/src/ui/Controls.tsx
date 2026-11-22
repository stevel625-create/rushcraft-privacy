import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import type { ButtonZone, TouchController } from './touchController';

interface Props {
  touch: TouchController;
  buttons: ButtonZone[];
  useEnabled: boolean;
  /** Called after any stick change so the HUD can redraw the joystick. */
  onStick(): void;
}

/**
 * Touch surfaces built on react-native-gesture-handler (native gestures, multi-touch):
 * left half = floating joystick, right half = camera drag, circles = JUMP / USE (fire on touch-down).
 * Callbacks run on the JS thread (runOnJS) because they only write to the game's input state.
 */
export function Controls({ touch, buttons, useEnabled, onStick }: Props) {
  const stick = usePanGesture({
    minDistance: 0,
    runOnJS: true,
    onBegin: (e) => { touch.stickStart(e.absoluteX, e.absoluteY); onStick(); },
    onUpdate: (e) => { touch.stickMove(e.absoluteX, e.absoluteY); onStick(); },
    onFinalize: () => { touch.stickEnd(); onStick(); },
  });

  const camera = usePanGesture({
    minDistance: 0,
    runOnJS: true,
    onUpdate: (e) => touch.look(e.changeX, e.changeY),
  });

  const jump = useTapGesture({ runOnJS: true, onBegin: () => touch.press('jump') });
  const use = useTapGesture({ runOnJS: true, onBegin: () => touch.press('use') });

  const zone = (b: ButtonZone) => ({ left: b.x - b.r - 10, top: b.y - b.r - 10, width: (b.r + 10) * 2, height: (b.r + 10) * 2 });
  const jumpZone = buttons.find((b) => b.id === 'jump');
  const useZone = buttons.find((b) => b.id === 'use');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <GestureDetector gesture={stick}>
        <View style={[styles.half, { left: 0 }]} collapsable={false} />
      </GestureDetector>
      <GestureDetector gesture={camera}>
        <View style={[styles.half, { right: 0 }]} collapsable={false} />
      </GestureDetector>
      {jumpZone && (
        <GestureDetector gesture={jump}>
          <View style={[styles.button, zone(jumpZone)]} collapsable={false} />
        </GestureDetector>
      )}
      {useZone && useEnabled && (
        <GestureDetector gesture={use}>
          <View style={[styles.button, zone(useZone)]} collapsable={false} />
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  half: { position: 'absolute', top: 0, bottom: 0, width: '50%' },
  button: { position: 'absolute', borderRadius: 999 },
});
