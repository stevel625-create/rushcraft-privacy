import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Game, HudState } from '../engine/game';
import type { ButtonZone, JoystickVisual } from './touchController';
import { colors } from './theme';

interface Props {
  game: Game;
  buttons: ButtonZone[];
  joystick: JoystickVisual;
  onPause(): void;
  /** Lets the touch controller enable the USE hit zone only while a prompt is shown. */
  onPromptChange(hasPrompt: boolean): void;
}

export function Hud({ game, buttons, joystick, onPause, onPromptChange }: Props) {
  const [hud, setHud] = useState<HudState>(game.hud);
  const [toast, setToast] = useState<string>('');
  const toastInfo = useRef({ kind: 'objective' as 'objective' | 'story', until: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const offHud = game.on('hud', setHud);
    const offToast = game.on('toast', (text, kind) => {
      const now = Date.now();
      // Story text (logbook, relic) stays up; an objective toast arriving at the same moment waits its turn.
      if (kind === 'objective' && toastInfo.current.kind === 'story' && now < toastInfo.current.until) return;
      const ms = kind === 'story' ? 4000 : 3000;
      toastInfo.current = { kind, until: now + ms };
      setToast(text);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(''), ms);
    });
    return () => { offHud(); offToast(); if (timer.current) clearTimeout(timer.current); };
  }, [game]);

  const hasPrompt = hud.prompt !== null;
  useEffect(() => { onPromptChange(hasPrompt); }, [hasPrompt, onPromptChange]);
  const jump = buttons.find((b) => b.id === 'jump');
  const use = buttons.find((b) => b.id === 'use');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.topLeft} pointerEvents="none">
        <Text style={styles.small}>OBJECTIVE</Text>
        <Text style={styles.objective}>{hud.objective}</Text>
      </View>
      <Text style={styles.levelLabel} pointerEvents="none">{hud.levelLabel}</Text>
      {toast !== '' && <Text style={styles.toast} pointerEvents="none">{toast}</Text>}
      {hud.prompt && <Text style={styles.prompt} pointerEvents="none">{hud.prompt}</Text>}

      {!joystick.active && (
        // Resting joystick so players can see where to move; touching anywhere on the left half grabs it.
        <View pointerEvents="none" style={styles.joyRest}>
          <View style={styles.joyBaseRest} />
          <View style={styles.joyKnobRest} />
          <Text style={styles.joyHint}>MOVE</Text>
        </View>
      )}
      {joystick.active && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.joyBase, { left: joystick.ox - 70, top: joystick.oy - 70 }]} />
          <View style={[styles.joyKnob, { left: joystick.kx - 30, top: joystick.ky - 30 }]} />
        </View>
      )}
      {jump && <Circle zone={jump} label="JUMP" />}
      {use && hud.prompt && <Circle zone={use} label="USE" accent />}

      <Pressable onPress={onPause} style={styles.pause} hitSlop={12} accessibilityLabel="Pause">
        <Text style={styles.pauseText}>II</Text>
      </Pressable>
    </View>
  );
}

function Circle({ zone, label, accent }: { zone: { x: number; y: number; r: number }; label: string; accent?: boolean }) {
  return (
    <View pointerEvents="none" style={[styles.circle, accent && styles.circleAccent,
      { left: zone.x - zone.r, top: zone.y - zone.r, width: zone.r * 2, height: zone.r * 2, borderRadius: zone.r }]}>
      <Text style={styles.circleText}>{label}</Text>
    </View>
  );
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.85)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  topLeft: { position: 'absolute', left: 24, top: 18, maxWidth: '45%' },
  small: { color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 2, ...shadow },
  objective: { color: '#fff', fontSize: 17, fontWeight: '600', marginTop: 2, ...shadow },
  levelLabel: { position: 'absolute', top: 14, alignSelf: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 2, ...shadow },
  toast: { position: 'absolute', top: '26%', left: '15%', right: '15%', textAlign: 'center', color: '#fff', fontSize: 20, fontWeight: '600', ...shadow },
  prompt: { position: 'absolute', bottom: '30%', alignSelf: 'center', color: '#fff', fontSize: 17, backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, overflow: 'hidden' },
  joyBase: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.08)' },
  joyRest: { position: 'absolute', left: 60, bottom: 50, width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  joyBaseRest: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(0,0,0,0.18)' },
  joyKnobRest: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.35)' },
  joyHint: { position: 'absolute', bottom: -22, color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  joyKnob: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.45)' },
  circle: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  circleAccent: { backgroundColor: 'rgba(242,191,64,0.3)', borderColor: colors.gold },
  circleText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1, ...shadow },
  pause: { position: 'absolute', right: 20, top: 14, width: 52, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  pauseText: { color: '#fff', fontWeight: '900', fontSize: 18 },
});
