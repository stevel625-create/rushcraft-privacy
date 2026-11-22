import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LEVELS } from '../levels';
import { PRODUCTS } from '../store/catalog';
import { colors } from './theme';

function Btn({ label, onPress, disabled, wide, danger }: { label: string; onPress(): void; disabled?: boolean; wide?: boolean; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.btn, wide && styles.btnWide, danger && styles.btnDanger, disabled && styles.btnDisabled, pressed && styles.btnPressed]}
    >
      <Text style={[styles.btnText, disabled && styles.btnTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

function Panel({ title, subtitle, children, dim = true }: { title: string; subtitle?: string; children: ReactNode; dim?: boolean }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, dim && styles.dim]}>
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export function MainMenu(p: { hasSave: boolean; onNew(): void; onContinue(): void; onLevels(): void; onSettings(): void; onStore(): void }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, styles.menuBg]}>
      <Text style={styles.logo}>THE LOST WORLD</Text>
      <Text style={styles.tagline}>A Zorvex Entertainment adventure</Text>
      <View style={styles.menuButtons}>
        <Btn label="NEW GAME" onPress={p.onNew} wide />
        <Btn label="CONTINUE" onPress={p.onContinue} disabled={!p.hasSave} wide />
        <Btn label="LEVELS" onPress={p.onLevels} wide />
        <View style={styles.row}>
          <Btn label="SETTINGS" onPress={p.onSettings} />
          <Btn label="STORE" onPress={p.onStore} />
        </View>
      </View>
    </View>
  );
}

export function LevelSelect({ unlocked, onPick, onBack }: { unlocked: number; onPick(i: number): void; onBack(): void }) {
  return (
    <Panel title="LEVELS" subtitle="Finish a level to unlock the next.">
      <View style={styles.grid}>
        {LEVELS.map((l, i) => (
          <Pressable key={l.number} disabled={i >= unlocked} onPress={() => onPick(i)} accessibilityRole="button"
            style={({ pressed }) => [styles.levelCard, i >= unlocked && styles.btnDisabled, pressed && styles.btnPressed]}>
            <Text style={styles.levelNum}>{l.number}</Text>
            <Text style={[styles.levelTitle, i >= unlocked && styles.btnTextDisabled]}>{i < unlocked ? l.title : 'Locked'}</Text>
            {i < unlocked && <Text style={styles.levelSub}>{l.subtitle}</Text>}
          </Pressable>
        ))}
      </View>
      <Btn label="BACK" onPress={onBack} />
    </Panel>
  );
}

export function Settings(p: { onEraseSave(): void; onResetUnlocks(): void; onResetPurchases(): void; onBack(): void; note: string }) {
  return (
    <Panel title="SETTINGS" subtitle="Left thumb: move (push far to run). Right thumb: drag the camera. JUMP and USE on the right.">
      <View style={styles.col}>
        <Btn label="ERASE SAVED PROGRESS" onPress={p.onEraseSave} wide danger />
        <Btn label="RESET LEVEL UNLOCKS" onPress={p.onResetUnlocks} wide danger />
        <Btn label="RESET MOCK PURCHASES" onPress={p.onResetPurchases} wide danger />
      </View>
      {p.note ? <Text style={styles.note}>{p.note}</Text> : null}
      <Btn label="BACK" onPress={p.onBack} />
    </Panel>
  );
}

export function Store({ owned, onBuy, onBack }: { owned: Set<string>; onBuy(id: string): void; onBack(): void }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const product = PRODUCTS.find((x) => x.id === confirm);
  return (
    <Panel title="STORE" subtitle="All six levels are free. Purchases here are a mock: no money is charged.">
      <ScrollView style={styles.storeList} contentContainerStyle={{ gap: 8 }}>
        {PRODUCTS.map((x) => (
          <View key={x.id} style={styles.storeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelTitle}>{x.title}</Text>
              <Text style={styles.levelSub}>{x.blurb}</Text>
            </View>
            {owned.has(x.id) ? <Text style={styles.owned}>OWNED</Text> : <Btn label="GET" onPress={() => setConfirm(x.id)} />}
          </View>
        ))}
      </ScrollView>
      <Btn label="BACK" onPress={onBack} />
      {product && (
        <Panel title="MOCK PURCHASE" subtitle={`Grant "${product.title}" in this prototype? No money is charged and no store is contacted.`}>
          <View style={styles.row}>
            <Btn label="CONFIRM (MOCK)" onPress={() => { onBuy(product.id); setConfirm(null); }} />
            <Btn label="CANCEL" onPress={() => setConfirm(null)} />
          </View>
        </Panel>
      )}
    </Panel>
  );
}

export function PauseMenu(p: { onResume(): void; onSave(): void; onMenu(): void; note: string }) {
  return (
    <Panel title="PAUSED">
      <View style={styles.col}>
        <Btn label="RESUME" onPress={p.onResume} wide />
        <Btn label="SAVE CHECKPOINT" onPress={p.onSave} wide />
        <Btn label="MAIN MENU" onPress={p.onMenu} wide />
      </View>
      {p.note ? <Text style={styles.note}>{p.note}</Text> : null}
    </Panel>
  );
}

export function LevelComplete(p: { title: string; hasNext: boolean; onNext(): void; onMenu(): void }) {
  return (
    <Panel title={p.title.toUpperCase()} subtitle={p.hasNext ? 'LEVEL COMPLETE' : 'THE ADVENTURE IS COMPLETE'}>
      <View style={styles.row}>
        {p.hasNext && <Btn label="NEXT LEVEL" onPress={p.onNext} />}
        <Btn label="MAIN MENU" onPress={p.onMenu} />
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  dim: { backgroundColor: 'rgba(0,0,0,0.55)' },
  menuBg: { backgroundColor: 'rgba(4,12,8,0.45)' },
  logo: { color: colors.text, fontSize: 40, fontWeight: '900', letterSpacing: 6, textShadowColor: '#000', textShadowRadius: 10 },
  tagline: { color: colors.gold, fontSize: 13, letterSpacing: 3, marginTop: 4, marginBottom: 18 },
  menuButtons: { alignItems: 'center', gap: 10 },
  panel: { backgroundColor: colors.panel, borderRadius: 18, borderWidth: 1, borderColor: colors.buttonBorder, padding: 20,
    maxWidth: 720, width: '86%', maxHeight: '92%', alignItems: 'center', gap: 12 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  col: { gap: 10, alignItems: 'center' },
  btn: { minWidth: 150, minHeight: 46, paddingHorizontal: 18, borderRadius: 12, backgroundColor: colors.button,
    borderWidth: 1, borderColor: colors.buttonBorder, alignItems: 'center', justifyContent: 'center' },
  btnWide: { minWidth: 300 },
  btnDanger: { borderColor: colors.danger },
  btnDisabled: { opacity: 0.4 },
  btnPressed: { backgroundColor: 'rgba(242,191,64,0.25)' },
  btnText: { color: colors.text, fontWeight: '800', fontSize: 15, letterSpacing: 1.5 },
  btnTextDisabled: { color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  levelCard: { width: 200, minHeight: 72, borderRadius: 12, padding: 10, backgroundColor: colors.button, borderWidth: 1, borderColor: colors.buttonBorder },
  levelNum: { color: colors.gold, fontWeight: '900', fontSize: 16 },
  levelTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  levelSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  storeList: { alignSelf: 'stretch', maxHeight: 220 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, backgroundColor: colors.button },
  owned: { color: colors.gold, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 12 },
  note: { color: colors.gold, fontSize: 13 },
});
