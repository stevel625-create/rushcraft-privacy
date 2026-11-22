import type { Animated } from 'react-native';
import { Animated as A, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  fade: Animated.Value;
  flash: Animated.Value;
  letterbox: Animated.Value;
  onSkip(): void;
}

/**
 * Letterbox bars, fade-to-black, impact flash and the SKIP button. The animated values are written
 * every frame by GameView from the cinematic's state, so nothing here re-renders per frame.
 */
export function CinematicOverlay({ fade, flash, letterbox, onSkip }: Props) {
  const bar = letterbox.interpolate({ inputRange: [0, 1], outputRange: [0, 46] });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <A.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: fade }]} />
      <A.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#fff6e6', opacity: flash }]} />
      <A.View pointerEvents="none" style={[styles.bar, { top: 0, height: bar }]} />
      <A.View pointerEvents="none" style={[styles.bar, { bottom: 0, height: bar }]} />
      <Pressable onPress={onSkip} style={styles.skip} hitSlop={14} accessibilityRole="button" accessibilityLabel="Skip cinematic">
        <Text style={styles.skipText}>SKIP ›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, backgroundColor: '#000' },
  skip: { position: 'absolute', right: 22, top: 56, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  skipText: { color: '#fff', fontWeight: '800', letterSpacing: 2, fontSize: 13 },
});
