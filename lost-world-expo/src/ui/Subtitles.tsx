import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DialogueLine, Speaker } from '../engine/dialogue';
import type { Game } from '../engine/game';

const NAME_COLOR: Record<Speaker, string> = {
  Jason: '#7fb6ff',
  Elena: '#f2bf40',
  Pilot: '#ff8a6a',
  Narrator: '#d8d2c4',
};

/**
 * Dialogue subtitles: speaker badge, name and line. In cinematics a tap skips to the next line;
 * during gameplay the box ignores touches so it never blocks the controls.
 */
export function Subtitles({ game, tapToSkip }: { game: Game; tapToSkip: boolean }) {
  const [line, setLine] = useState<DialogueLine | null>(game.dialogue.current);
  useEffect(() => game.on('dialogue', setLine), [game]);
  if (!line) return null;
  const narrator = line.speaker === 'Narrator';
  return (
    <View style={styles.wrap} pointerEvents={tapToSkip ? 'box-none' : 'none'}>
      <Pressable onPress={() => game.dialogue.skipLine()} disabled={!tapToSkip} style={[styles.box, narrator && styles.narratorBox]}
        accessibilityLabel={`${line.speaker}: ${line.text}`}>
        {!narrator && (
          <View style={[styles.badge, { borderColor: NAME_COLOR[line.speaker] }]}>
            <Text style={[styles.badgeText, { color: NAME_COLOR[line.speaker] }]}>{line.speaker[0]}</Text>
          </View>
        )}
        <Text style={[styles.text, narrator && styles.narrator]}>
          {!narrator && <Text style={[styles.name, { color: NAME_COLOR[line.speaker] }]}>{line.speaker}: </Text>}
          {line.text}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 18, alignItems: 'center' },
  box: { flexDirection: 'row', alignItems: 'center', maxWidth: '62%', gap: 12, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: 'rgba(8,10,8,0.72)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(242,191,64,0.35)' },
  narratorBox: { backgroundColor: 'transparent', borderWidth: 0 },
  badge: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  badgeText: { fontWeight: '900', fontSize: 18 },
  text: { color: '#f4f1e8', fontSize: 16, lineHeight: 21, flexShrink: 1 },
  name: { fontWeight: '800' },
  narrator: { fontStyle: 'italic', fontSize: 20, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 6 },
});
