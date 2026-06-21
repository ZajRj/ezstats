import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import Text from './Text';
import { colors } from '../../theme/colors';

interface TableProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Table = ({ children, style }: TableProps) => (
  <ScrollView style={[styles.tableWrapper, style]} horizontal showsHorizontalScrollIndicator={true}>
    <ScrollView showsVerticalScrollIndicator={true}>
      <View style={styles.tablePadding}>
        <View style={styles.tableInner}>
          {children}
        </View>
      </View>
    </ScrollView>
  </ScrollView>
);

export const TableHead = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.row}>
    {children}
  </View>
);

export const TableRow = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.row}>
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
    <Text style={[styles.cellText, isHeader && styles.headerText]}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  tableWrapper: {
    flex: 1,
  },
  tablePadding: {
    padding: 16,
    paddingBottom: 40,
  },
  tableInner: {
    borderRadius: 8,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  row: { 
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cell: { 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: 'transparent',
  },
  headerCell: { 
    backgroundColor: colors.primaryLight 
  },
  headerText: { 
    fontWeight: 'bold', 
    color: colors.primary, 
    fontSize: 13 
  },
  cellText: { 
    color: colors.text, 
    fontSize: 13 
  },
});
