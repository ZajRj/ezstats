import React, { useMemo } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../ui/Text';
import { colors } from '../../theme/colors';
import { parseData, type DecimalSeparator } from '../../stats/core/parse';
import { summary } from '../../stats/core/descriptive';
import { fmt } from '../../stats/core/rounding';

interface DataInputProps {
  label: string;
  text: string;
  onChangeText: (t: string) => void;
  decimal: DecimalSeparator;
  /** Editable group name for multi-group tests. */
  onChangeLabel?: (l: string) => void;
  onRemove?: () => void;
  unit?: string;
  hint?: string;
}

export default function DataInput({ label, text, onChangeText, decimal, onChangeLabel, onRemove, unit, hint }: DataInputProps) {
  const parsed = useMemo(() => parseData(text, decimal), [text, decimal]);
  const stats = useMemo(() => summary(parsed.values), [parsed]);
  const u = unit ? ` ${unit}` : '';
  const placeholder = decimal === ','
    ? 'Pega o escribe los datos: 71,8  72,4  73,1 …'
    : 'Pega o escribe los datos: 71.8, 72.4, 73.1 …';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {onChangeLabel ? (
          <TextInput
            style={styles.labelInput}
            value={label}
            onChangeText={onChangeLabel}
            accessibilityLabel="Nombre del grupo"
            maxLength={30}
          />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
        {onRemove && (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${label}`}
          >
            <Ionicons name="close" size={16} color={colors.danger} />
            <Text style={styles.removeText}>Quitar</Text>
          </Pressable>
        )}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={onChangeText}
        multiline
        placeholder={placeholder}
        placeholderTextColor="#718096"
        autoCorrect={false}
        autoCapitalize="none"
        textAlignVertical="top"
        accessibilityLabel={`Datos de ${label}`}
      />
      <View style={styles.preview} accessibilityLiveRegion="polite">
        {parsed.tokens.length === 0 ? (
          <Text style={styles.previewMuted}>Sin datos todavía.</Text>
        ) : (
          <Text style={styles.previewText}>
            {parsed.values.length} de {parsed.tokens.length} valores leídos
            {stats ? `  ·  n = ${stats.n}  ·  x̄ = ${fmt(stats.mean)}${u}` : ''}
            {stats && stats.n > 1 ? `  ·  s = ${fmt(stats.sd)}${u}` : ''}
            {stats ? `  ·  mín ${fmt(stats.min)}  ·  máx ${fmt(stats.max)}` : ''}
          </Text>
        )}
        {parsed.invalid.length > 0 && (
          <View style={styles.invalidBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.invalidText}>
              {parsed.invalid.length === 1 ? 'Valor no válido: ' : 'Valores no válidos: '}
              {parsed.invalid.slice(0, 6).map((t) => `“${t.text}” (posición ${t.position})`).join(', ')}
              {parsed.invalid.length > 6 ? ` y ${parsed.invalid.length - 6} más` : ''}.
              {decimal === ',' && parsed.invalid.some((t) => t.text.includes('.'))
                ? ' El separador decimal está en coma; cámbialo a punto si tus datos usan punto.'
                : ''}
              {decimal === '.' && parsed.invalid.some((t) => /\d,\d/.test(t.text))
                ? ' Revisa el separador decimal.'
                : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  labelInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 4,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: colors.dangerLight,
  },
  removeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  input: {
    minHeight: 96,
    maxHeight: 200,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  preview: {
    gap: 6,
  },
  previewText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  previewMuted: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  invalidBox: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
  },
  invalidText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
    lineHeight: 18,
  },
});
