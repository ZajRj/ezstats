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
  enabled?: boolean;
  onToggleEnabled?: () => void;
}

export default function DataInput({
  label,
  text,
  onChangeText,
  decimal,
  onChangeLabel,
  onRemove,
  unit,
  hint,
  enabled = true,
  onToggleEnabled,
}: DataInputProps) {
  const parsed = useMemo(() => parseData(text, decimal), [text, decimal]);
  const stats = useMemo(() => summary(parsed.values), [parsed]);
  const u = unit ? ` ${unit}` : '';
  const placeholder = decimal === ','
    ? 'Pega o escribe los datos: 71,8  72,4  73,1 …'
    : 'Pega o escribe los datos: 71.8, 72.4, 73.1 …';

  return (
    <View style={[styles.card, !enabled && styles.cardDisabled]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onChangeLabel ? (
            <TextInput
              style={[styles.labelInput, !enabled && styles.labelDisabled]}
              value={label}
              onChangeText={onChangeLabel}
              accessibilityLabel="Nombre del grupo"
              maxLength={30}
            />
          ) : (
            <Text style={[styles.label, !enabled && styles.labelDisabled]}>{label}</Text>
          )}
          {!enabled && (
            <View style={styles.pausedBadge}>
              <Text style={styles.pausedBadgeText}>Excluida</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {onToggleEnabled && (
            <Pressable
              onPress={onToggleEnabled}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionBtn,
                enabled ? styles.activeToggle : styles.pausedToggle,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="switch"
              accessibilityState={{ checked: enabled }}
              accessibilityLabel={enabled ? `Desactivar ${label}` : `Activar ${label}`}
            >
              <Ionicons
                name={enabled ? 'toggle' : 'toggle-outline'}
                size={18}
                color={enabled ? '#15803D' : '#64748B'}
              />
              <Text style={[styles.actionBtnText, { color: enabled ? '#15803D' : '#64748B' }]}>
                {enabled ? 'ON (Activa)' : 'OFF (Pausada)'}
              </Text>
            </Pressable>
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
      </View>

      {!enabled && onToggleEnabled && (
        <Pressable onPress={onToggleEnabled} style={styles.pausedBanner}>
          <Ionicons name="eye-off-outline" size={16} color="#DC2626" />
          <Text style={styles.pausedBannerText}>
            Variable pausada / excluida del cálculo (sus datos se conservan). Toca para reactivar.
          </Text>
        </Pressable>
      )}

      {hint ? (
        <Text style={styles.hint}>
          {!enabled ? 'Variable pausada: los datos se conservan pero no se incluyen en el cálculo.' : hint}
        </Text>
      ) : null}

      <TextInput
        style={[styles.input, !enabled && styles.inputDisabled]}
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
  cardDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  labelDisabled: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  pausedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  pausedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeToggle: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  pausedToggle: {
    backgroundColor: '#F1F5F9',
    borderColor: '#94A3B8',
  },
  pausedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  pausedBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
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
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
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
