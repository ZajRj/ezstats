import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import Text from './Text';
import { colors } from '../../theme/colors';

interface TableProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Height cap so the table scrolls inside a page instead of stretching it. */
  maxHeight?: number;
}

/**
 * Inline table for result breakdowns. The header row stays pinned while the
 * body scrolls vertically; the whole table scrolls horizontally.
 */
export const Table = ({ children, style, maxHeight = 420 }: TableProps) => {
  const items = React.Children.toArray(children);
  const head = items.filter((c) => React.isValidElement(c) && c.type === TableHead);
  const rows = items.filter((c) => !(React.isValidElement(c) && c.type === TableHead));

  return (
    <View style={[styles.frame, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
        <View>
          {head}
          <ScrollView style={{ maxHeight }} nestedScrollEnabled showsVerticalScrollIndicator>
            {rows.map((row, i) =>
              React.isValidElement<TableRowProps>(row) && row.type === TableRow
                ? React.cloneElement(row, { striped: i % 2 === 1 })
                : row,
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export const TableHead = ({ children }: { children: React.ReactNode }) => (
  <View style={[styles.row, styles.headRow]}>
    {children}
  </View>
);

interface TableRowProps {
  children: React.ReactNode;
  striped?: boolean;
}

export const TableRow = ({ children, striped }: TableRowProps) => (
  <View style={[styles.row, striped && styles.rowStriped]}>
    {children}
  </View>
);

interface TableCellProps {
  children: React.ReactNode;
  width?: number;
  isHeader?: boolean;
}

export const TableCell = ({ children, width = 70, isHeader = false }: TableCellProps) => (
  <View style={[styles.cell, isHeader && styles.headerCell, { width }]}>
    <Text style={[styles.cellText, isHeader && styles.headerText]} numberOfLines={isHeader ? 3 : 2}>
      {children}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  frame: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  rowStriped: {
    backgroundColor: colors.rowAlt,
  },
  cell: {
    minHeight: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCell: {
    minHeight: 44,
    backgroundColor: colors.primaryLight,
  },
  headerText: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  cellText: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
