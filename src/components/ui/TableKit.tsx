import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TextInputProps,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
} from 'react-native';
import { Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { Ionicons } from '@expo/vector-icons';
import Text from './Text';
import { colors } from '../../theme/colors';

/** Parses user input, accepting a comma as decimal separator. */
export function parseNum(s: string): number {
  return parseFloat(s.trim().replace(',', '.'));
}

/** Keyboard that offers a minus sign on both platforms. */
export const SIGNED_KEYBOARD: TextInputProps['keyboardType'] =
  Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric';

interface TableScreenProps {
  title: string;
  /** One line that tells the reader what a cell contains. */
  caption: string;
  /** Status line under the controls: what the highlighted cell means. */
  readout: string | null;
  controls: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared shell for statistical-table screens: a collapsible control panel,
 * a readout line for the highlighted cell, and the grid filling the rest.
 */
export function TableScreen({ title, caption, readout, controls, children }: TableScreenProps) {
  const headerHeight = useHeaderHeight();
  const [expanded, setExpanded] = useState(true);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <Stack.Screen options={{ title }} />
      <View style={styles.panel}>
        {expanded && (
          <View style={styles.controls}>
            <Text style={styles.caption}>{caption}</Text>
            {controls}
          </View>
        )}
        <View style={styles.toolbar}>
          <View style={styles.readoutWrap}>
            <Ionicons
              name={readout ? 'locate' : 'hand-left-outline'}
              size={16}
              color={readout ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.readout, !readout && styles.readoutHint]} numberOfLines={2}>
              {readout ?? 'Tap a cell to read it'}
            </Text>
          </View>
          <Pressable
            onPress={toggle}
            hitSlop={8}
            style={({ pressed }) => [styles.toggleBtn, pressed && styles.toggleBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Hide lookup controls' : 'Show lookup controls'}
          >
            <Ionicons name={expanded ? 'chevron-up' : 'options-outline'} size={16} color={colors.primary} />
            <Text style={styles.toggleText}>{expanded ? 'Hide' : 'Lookup'}</Text>
          </Pressable>
        </View>
      </View>
      {children}
    </KeyboardAvoidingView>
  );
}

interface LookupFieldProps extends TextInputProps {
  label: string;
}

export function LookupField({ label, style, ...props }: LookupFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel} numberOfLines={1}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#718096"
        keyboardType="decimal-pad"
        returnKeyType="done"
        autoCorrect={false}
        {...props}
      />
    </View>
  );
}

interface ResultChipProps {
  label: string;
  value: string | null;
  note?: string | null;
}

export function ResultChip({ label, value, note }: ResultChipProps) {
  return (
    <View style={styles.chip} accessibilityLiveRegion="polite">
      <Text style={styles.chipLabel} numberOfLines={1}>{label}</Text>
      <Text style={[styles.chipValue, value === null && styles.chipValueEmpty]} numberOfLines={1} adjustsFontSizeToFit>
        {value ?? '—'}
      </Text>
      {note ? <Text style={styles.chipNote} numberOfLines={2}>{note}</Text> : null}
    </View>
  );
}

/** Lays out lookup fields with the result chip on the right. */
export function LookupRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.lookupRow}>{children}</View>;
}

export function ControlRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.controlRow}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  panel: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  controls: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  readoutWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readout: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  readoutHint: {
    fontWeight: '400',
    color: colors.textSecondary,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },
  toggleBtnPressed: {
    opacity: 0.7,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  field: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  chip: {
    minWidth: 104,
    maxWidth: 140,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  chipValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.card,
    fontVariant: ['tabular-nums'],
  },
  chipValueEmpty: {
    opacity: 0.6,
  },
  chipNote: {
    fontSize: 11,
    color: colors.primaryLight,
    textAlign: 'center',
  },
});
