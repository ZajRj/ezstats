import Text from './Text';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  /** Smaller variant for dense control panels. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function SegmentedControl({ options, selectedIndex, onChange, compact = false, style }: SegmentedControlProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact, style]} accessibilityRole="tablist">
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Pressable
            key={option}
            style={({ pressed }) => [
              styles.segment,
              compact && styles.segmentCompact,
              isSelected && styles.segmentActive,
              pressed && !isSelected && styles.segmentPressed,
            ]}
            onPress={() => onChange(index)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[styles.text, compact && styles.textCompact, isSelected && styles.textActive]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  containerCompact: {
    borderRadius: 10,
    padding: 3,
    marginBottom: 0,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentCompact: {
    minHeight: 38,
    paddingVertical: 6,
    borderRadius: 7,
  },
  segmentActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentPressed: {
    backgroundColor: colors.border,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  textCompact: {
    fontSize: 13,
  },
  textActive: {
    color: colors.primary,
  },
});
