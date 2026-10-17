import React, { useMemo, useState } from 'react';
import { jStat } from 'jstat';
import DataGrid, { GridCell } from '../../src/components/ui/DataGrid';
import SegmentedControl from '../../src/components/ui/SegmentedControl';
import {
  TableScreen,
  LookupField,
  LookupRow,
  ResultChip,
  parseNum,
} from '../../src/components/ui/TableKit';

const DFS = Array.from({ length: 50 }, (_, i) => i + 1);
const ALPHAS = [0.99, 0.975, 0.95, 0.90, 0.10, 0.05, 0.025, 0.01, 0.005];
const TAILS = ['Right tail', 'Left tail'];
const TAIL_FORMULAS = ['P(χ² ≥ x) = α', 'P(χ² ≤ x) = α'];
const LOOKUP_MODES = ['α → critical χ²', 'χ² → p-value'];

export default function ChiTable() {
  const [tailIdx, setTailIdx] = useState(0);
  const [lookupMode, setLookupMode] = useState(0);
  const [dfInput, setDfInput] = useState('');
  const [alphaInput, setAlphaInput] = useState('');
  const [tInput, setTInput] = useState('');
  const [tapped, setTapped] = useState<GridCell | null>(null);

  const critical = (alpha: number, df: number) =>
    jStat.chisquare.inv(tailIdx === 0 ? 1 - alpha : alpha, df);

  const cells = useMemo(
    () => DFS.map((df) => ALPHAS.map((a) => critical(a, df).toFixed(3))),
    [tailIdx],
  );

  const df = parseInt(dfInput, 10);
  const dfValid = !isNaN(df) && df > 0;
  const alpha = parseNum(alphaInput);
  const alphaValid = !isNaN(alpha) && alpha > 0 && alpha < 1;
  const t = parseNum(tInput);

  const criticalT = lookupMode === 0 && dfValid && alphaValid ? critical(alpha, df) : null;
  const pValue = lookupMode === 1 && dfValid && !isNaN(t)
    ? (tailIdx === 0 ? 1 - jStat.chisquare.cdf(t, df) : jStat.chisquare.cdf(t, df))
    : null;

  const row = dfValid && df <= DFS.length ? df - 1 : -1;
  let lookupCell: GridCell | null = null;
  if (row >= 0 && lookupMode === 0 && alphaValid) {
    lookupCell = { row, col: ALPHAS.findIndex((a) => Math.abs(a - alpha) < 1e-9) };
  } else if (row >= 0 && lookupMode === 1 && !isNaN(t)) {
    // Point at the column whose critical value is closest to the entered statistic.
    const values = cells[row].map(Number);
    const col = values.reduce((best, v, i) => (Math.abs(v - t) < Math.abs(values[best] - t) ? i : best), 0);
    lookupCell = { row, col };
  } else if (row >= 0) {
    lookupCell = { row, col: -1 };
  }

  const highlight = tapped ?? lookupCell;
  const readout = highlight && highlight.col >= 0
    ? `df ${DFS[highlight.row]}   ·   α = ${ALPHAS[highlight.col]}   ·   χ² = ${cells[highlight.row][highlight.col]}`
    : highlight ? `df ${DFS[highlight.row]}` : null;

  const clearTap = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setTapped(null); };

  return (
    <TableScreen
      title="Chi-Square Table"
      caption={`Critical values x where ${TAIL_FORMULAS[tailIdx]}. Rows are degrees of freedom, columns are α.`}
      readout={readout}
      controls={
        <>
          <SegmentedControl compact options={TAILS} selectedIndex={tailIdx} onChange={setTailIdx} />
          <SegmentedControl compact options={LOOKUP_MODES} selectedIndex={lookupMode} onChange={clearTap(setLookupMode)} />
          <LookupRow>
            <LookupField label="df" placeholder="e.g. 12" value={dfInput} onChangeText={clearTap(setDfInput)} keyboardType="number-pad" />
            {lookupMode === 0 ? (
              <LookupField label="α" placeholder="e.g. 0.05" value={alphaInput} onChangeText={clearTap(setAlphaInput)} />
            ) : (
              <LookupField label="χ² statistic" placeholder="e.g. 21.03" value={tInput} onChangeText={clearTap(setTInput)} />
            )}
            {lookupMode === 0 ? (
              <ResultChip
                label="Critical χ²"
                value={criticalT !== null ? criticalT.toFixed(3) : null}
                note={alphaInput && !alphaValid ? 'Enter 0 < α < 1' : dfValid && row < 0 ? 'df beyond table' : null}
              />
            ) : (
              <ResultChip
                label={tailIdx === 0 ? 'P(χ² ≥ x)' : 'P(χ² ≤ x)'}
                value={pValue !== null ? pValue.toFixed(4) : null}
                note={dfValid && row < 0 ? 'df beyond table' : null}
              />
            )}
          </LookupRow>
        </>
      }
    >
      <DataGrid
        cornerLabel="df \ α"
        columnLabels={ALPHAS.map(String)}
        rowLabels={DFS.map(String)}
        cells={cells}
        highlight={highlight}
        onCellPress={setTapped}
        cellWidth={72}
        rowHeaderWidth={60}
      />
    </TableScreen>
  );
}
