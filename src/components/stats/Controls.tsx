import React, { useCallback, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import SegmentedControl from '../ui/SegmentedControl';
import { colors } from '../../theme/colors';
import { parseData, type DecimalSeparator } from '../../stats/core/parse';
import type { Mode } from '../../stats/types';
import type { Group } from '../../stats/tests/anova/anovaCore';
import { SIGNED_KEYBOARD } from '../ui/TableKit';

export const ALPHAS = [0.1, 0.05, 0.01];

export interface GroupDraft {
  key: number;
  label: string;
  text: string;
  enabled?: boolean;
}

let nextKey = Date.now();
export const draft = (label: string, text = '', enabled = true): GroupDraft => ({ key: nextKey++, label, text, enabled });

/** Formats values for a text field with the chosen decimal separator. */
export function valuesToText(values: number[], decimal: DecimalSeparator): string {
  return values.map((v) => (decimal === ',' ? String(v).replace('.', ',') : String(v))).join(decimal === ',' ? '  ' : ', ');
}

export function useGroups(initial: GroupDraft[]) {
  const [groups, setGroups] = useState<GroupDraft[]>(initial);
  const update = useCallback((key: number, patch: Partial<GroupDraft>) => {
    setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  }, []);
  const toggleEnabled = useCallback((key: number) => {
    setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, enabled: g.enabled === false ? true : false } : g)));
  }, []);
  /** Adds a draft; `makeLabel` receives the current number of drafts. */
  const add = useCallback((makeLabel: (count: number) => string = (c) => `Grupo ${c + 1}`) => {
    setGroups((gs) => [...gs, draft(makeLabel(gs.length))]);
  }, []);
  const remove = useCallback((key: number) => setGroups((gs) => gs.filter((g) => g.key !== key)), []);
  return { groups, setGroups, update, toggleEnabled, add, remove };
}

/** Parses all drafts; returns a Spanish error when any token is invalid. */
export function parseGroups(drafts: GroupDraft[], decimal: DecimalSeparator, includeDisabled = false): { groups: Group[] } | { error: string } {
  const out: Group[] = [];
  const activeDrafts = includeDisabled ? drafts : drafts.filter((d) => d.enabled !== false);
  if (activeDrafts.length === 0) return { error: 'No hay variables activas para calcular.' };
  for (const d of activeDrafts) {
    const r = parseData(d.text, decimal);
    if (r.invalid.length) {
      return { error: `“${d.label}” tiene valores no válidos (${r.invalid.map((t) => `“${t.text}”`).slice(0, 3).join(', ')}). Corrígelos antes de calcular.` };
    }
    if (r.values.length === 0) return { error: `“${d.label}” no tiene datos.` };
    out.push({ label: d.label.trim() || 'Grupo', values: r.values });
  }
  return { groups: out };
}

/** A single number from a text field, or NaN. */
export function parseOne(text: string, decimal: DecimalSeparator): number {
  const r = parseData(text, decimal);
  return r.invalid.length === 0 && r.values.length === 1 ? r.values[0] : NaN;
}

interface SettingsProps {
  alpha: number;
  setAlpha: (a: number) => void;
  customAlpha: string;
  setCustomAlpha: (s: string) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  decimal: DecimalSeparator;
  setDecimal: (d: DecimalSeparator) => void;
}

export function SettingsPanel(p: SettingsProps) {
  const isDefaultAlpha = p.customAlpha === '' && ALPHAS.includes(p.alpha);
  const alphaIdx = isDefaultAlpha ? ALPHAS.indexOf(p.alpha) : 3;
  const options = ['α 0.10', 'α 0.05', 'α 0.01', 'Manual / Otro'];
  const selected = alphaIdx;
  return (
    <View style={styles.panel}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Nivel de significancia (α)</Text>
        <SegmentedControl
          compact
          options={options}
          selectedIndex={selected}
          onChange={(i) => {
            if (i < ALPHAS.length) {
              p.setAlpha(ALPHAS[i]);
              p.setCustomAlpha('');
            } else {
              const defaultCustom = p.customAlpha || '0.025';
              p.setCustomAlpha(defaultCustom);
              const num = parseFloat(defaultCustom.replace(',', '.'));
              if (!isNaN(num) && num > 0 && num < 1) {
                p.setAlpha(num);
              }
            }
          }}
        />
        {(selected === 3 || p.customAlpha !== '') && (
          <View style={styles.customAlphaBox}>
            <Text style={styles.customAlphaPrompt}>Colocar nivel de significancia α a mano:</Text>
            <TextInput
              style={styles.input}
              value={p.customAlpha}
              onChangeText={(val) => {
                p.setCustomAlpha(val);
                const num = parseFloat(val.replace(',', '.'));
                if (!isNaN(num) && num > 0 && num < 1) {
                  p.setAlpha(num);
                }
              }}
              placeholder="ej. 0.02, 0.025, 0.005"
              placeholderTextColor="#718096"
              keyboardType="decimal-pad"
              accessibilityLabel="α personalizado"
            />
            <Text style={styles.customAlphaHint}>
              α activo: {p.alpha} (utilizado en tablas ANOVA, pruebas t en 8 pasos y selección de modelo).
            </Text>
          </View>
        )}
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Modo de cálculo</Text>
        <SegmentedControl
          compact
          options={['Tabla (como a mano)', 'Exacto (valor p)']}
          selectedIndex={p.mode === 'tabla' ? 0 : 1}
          onChange={(i) => {
            p.setMode(i === 0 ? 'tabla' : 'exacto');
          }}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Separador decimal de tus datos</Text>
        <SegmentedControl
          compact
          options={['Punto  (1.5)', 'Coma  (1,5)']}
          selectedIndex={p.decimal === '.' ? 0 : 1}
          onChange={(i) => p.setDecimal(i === 0 ? '.' : ',')}
        />
      </View>
    </View>
  );
}

/** Resolves the α actually used, or an error for a bad custom value. */
export function resolveAlpha(alpha: number, custom: string, mode: Mode, decimal: DecimalSeparator): number | string {
  if (custom === '') return alpha;
  const a = parseOne(custom, decimal === ',' ? ',' : '.');
  const b = isNaN(a) ? parseOne(custom, decimal === ',' ? '.' : ',') : a;
  if (!(b > 0 && b < 1)) return 'α personalizado debe estar entre 0 y 1.';
  return b;
}

export function TextField({ label, value, onChangeText, placeholder, numeric = true, hint }: {
  label: string; value: string; onChangeText: (s: string) => void; placeholder?: string; numeric?: boolean; hint?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#718096"
        keyboardType={numeric ? SIGNED_KEYBOARD : 'default'}
        autoCorrect={false}
        accessibilityLabel={label}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function PrimaryButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={colors.card} />
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.error} accessibilityLiveRegion="assertive">
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 14,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  hint: { fontSize: 12, color: colors.textSecondary },
  customAlphaBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginTop: 4,
  },
  customAlphaPrompt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  customAlphaHint: {
    fontSize: 11,
    color: '#0284C7',
    fontStyle: 'italic',
  },
  input: {
    height: 46,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryText: { fontSize: 17, fontWeight: 'bold', color: colors.card },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.card,
  },
  ghostText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  error: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.dangerLight,
  },
  errorText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.danger },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
});
