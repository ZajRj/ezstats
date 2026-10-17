import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './Text';
import { colors } from '../../theme/colors';

export interface GridCell {
  row: number;
  col: number;
}

interface DataGridProps {
  cornerLabel: string;
  columnLabels: string[];
  rowLabels: string[];
  cells: string[][];
  cellWidth?: number;
  rowHeaderWidth?: number;
  /** Cell to emphasise. Either index may be -1 to highlight only a row or a column. */
  highlight?: GridCell | null;
  onCellPress?: (cell: GridCell) => void;
}

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 40;

/**
 * Spreadsheet-style grid with a frozen header row and frozen first column.
 * The headers follow the body's scroll position on the native thread, so
 * row and column labels stay visible however far the user scrolls.
 */
export default function DataGrid({
  cornerLabel,
  columnLabels,
  rowLabels,
  cells,
  cellWidth = 68,
  rowHeaderWidth = 64,
  highlight,
  onCellPress,
}: DataGridProps) {
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const vRef = useRef<ScrollView>(null);
  const hRef = useRef<ScrollView>(null);
  const viewport = useRef({ width: 0, height: 0 });

  const hlRow = highlight?.row ?? -1;
  const hlCol = highlight?.col ?? -1;
  const bottomPad = insets.bottom + 16;

  // Bring the highlighted cell into view, centred where possible.
  useEffect(() => {
    const { width, height } = viewport.current;
    if (hlRow >= 0 && height > 0) {
      const y = Math.max(0, hlRow * ROW_HEIGHT - (height - ROW_HEIGHT) / 2);
      vRef.current?.scrollTo({ y, animated: true });
    }
    if (hlCol >= 0 && width > 0) {
      const x = Math.max(0, hlCol * cellWidth - (width - cellWidth) / 2);
      hRef.current?.scrollTo({ x, animated: true });
    }
  }, [hlRow, hlCol, cellWidth]);

  const translateX = Animated.multiply(scrollX, -1);
  const translateY = Animated.multiply(scrollY, -1);

  return (
    <View style={styles.grid}>
      {/* Frozen header row */}
      <View style={styles.headerRow}>
        <View style={[styles.corner, { width: rowHeaderWidth }]}>
          <Text style={styles.cornerText} numberOfLines={1} adjustsFontSizeToFit>
            {cornerLabel}
          </Text>
        </View>
        <View style={styles.clip}>
          <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
            {columnLabels.map((label, c) => (
              <View
                key={c}
                style={[styles.colHeader, { width: cellWidth }, c === hlCol && styles.headerActive]}
              >
                <Text style={[styles.headerText, c === hlCol && styles.headerTextActive]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>

      <View style={styles.bodyRow}>
        {/* Frozen first column */}
        <View style={[styles.clip, { width: rowHeaderWidth, flex: 0 }]}>
          <Animated.View style={{ transform: [{ translateY }], paddingBottom: bottomPad }}>
            {rowLabels.map((label, r) => (
              <View
                key={r}
                style={[styles.rowHeader, r % 2 === 1 && styles.rowHeaderAlt, r === hlRow && styles.headerActive]}
              >
                <Text style={[styles.headerText, r === hlRow && styles.headerTextActive]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Scrollable body */}
        <Animated.ScrollView
          ref={vRef as any}
          style={styles.flex}
          onLayout={(e) => {
            viewport.current.height = e.nativeEvent.layout.height;
            viewport.current.width = e.nativeEvent.layout.width;
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Animated.ScrollView
            ref={hRef as any}
            horizontal
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <View>
              {cells.map((rowCells, r) => (
                <View key={r} style={[styles.row, r % 2 === 1 && styles.rowAlt, r === hlRow && styles.rowActive]}>
                  {rowCells.map((value, c) => {
                    const isTarget = r === hlRow && c === hlCol;
                    const inCross = r === hlRow || c === hlCol;
                    return (
                      <Pressable
                        key={c}
                        onPress={onCellPress ? () => onCellPress({ row: r, col: c }) : undefined}
                        style={[
                          styles.cell,
                          { width: cellWidth },
                          inCross && styles.cellCross,
                          isTarget && styles.cellTarget,
                        ]}
                        accessibilityRole={onCellPress ? 'button' : undefined}
                        accessibilityLabel={`${cornerLabel} ${rowLabels[r]}, ${columnLabels[c]}: ${value}`}
                      >
                        <Text style={[styles.cellText, isTarget && styles.cellTextTarget]}>{value}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </Animated.ScrollView>
        </Animated.ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: {
    flex: 1,
    backgroundColor: colors.card,
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    flexDirection: 'row',
    height: HEADER_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    backgroundColor: colors.primaryLight,
    zIndex: 2,
  },
  bodyRow: {
    flex: 1,
    flexDirection: 'row',
  },
  corner: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
  },
  cornerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.card,
  },
  colHeader: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowHeader: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRightWidth: 1,
    borderRightColor: colors.primary,
  },
  rowHeaderAlt: {
    backgroundColor: '#C6DFF8',
  },
  headerActive: {
    backgroundColor: colors.primary,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  headerTextActive: {
    color: colors.card,
  },
  rowAlt: {
    backgroundColor: colors.rowAlt,
  },
  rowActive: {
    backgroundColor: colors.highlight,
  },
  cell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellCross: {
    backgroundColor: colors.highlight,
  },
  cellTarget: {
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  cellText: {
    fontSize: 15,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  cellTextTarget: {
    color: colors.card,
    fontWeight: 'bold',
  },
});
