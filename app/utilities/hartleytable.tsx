import React, { useState } from 'react';
import DataGrid, { GridCell } from '../../src/components/ui/DataGrid';
import SegmentedControl from '../../src/components/ui/SegmentedControl';
import { TableScreen, LookupField, LookupRow, ResultChip } from '../../src/components/ui/TableKit';
import { HARTLEY_DFS, HARTLEY_TABLE, hartleyCritical } from '../../src/stats/tables/hartley';
import { fmt } from '../../src/stats/core/rounding';

const ALPHAS = [0.05, 0.01];
const KS = Array.from({ length: 11 }, (_, i) => i + 2);
const cellText = (v: number) => (v >= 100 ? String(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2));

export default function HartleyTable() {
  const [alphaIdx, setAlphaIdx] = useState(0);
  const [kInput, setKInput] = useState('');
  const [dfInput, setDfInput] = useState('');
  const [tapped, setTapped] = useState<GridCell | null>(null);

  const alpha = ALPHAS[alphaIdx];
  const cells = HARTLEY_DFS.map((df) => HARTLEY_TABLE[String(alpha)][df].map(cellText));
  const k = parseInt(kInput, 10);
  const df = parseInt(dfInput, 10);
  const lookup = k >= 2 && df >= 2 ? hartleyCritical(k, df, alpha) : null;
  const lookupCell: GridCell | null = lookup
    ? { row: HARTLEY_DFS.indexOf(lookup.dfUsed as (typeof HARTLEY_DFS)[number]), col: k - 2 }
    : null;
  const highlight = tapped ?? lookupCell;

  const readout = highlight
    ? `k ${KS[highlight.col]}   ·   ν ${HARTLEY_DFS[highlight.row]}   ·   α = ${alpha}   ·   Fmax = ${cells[highlight.row][highlight.col]}`
    : null;
  const clear = (fn: (s: string) => void) => (s: string) => { fn(s); setTapped(null); };
  const note = k > 12 ? 'Table goes to k = 12' : lookup && !lookup.exactDf ? `Uses ν = ${lookup.dfUsed} row` : null;

  return (
    <TableScreen
      title="Hartley Fmax Table"
      caption="Critical values of Fmax = s²max/s²min for k groups of equal size, ν = n − 1. Reject H₀ (equal variances) if Fmax ≥ the value."
      readout={readout}
      controls={
        <>
          <SegmentedControl compact options={ALPHAS.map((a) => `α ${a}`)} selectedIndex={alphaIdx} onChange={(i) => { setAlphaIdx(i); setTapped(null); }} />
          <LookupRow>
            <LookupField label="k groups" placeholder="2–12" value={kInput} onChangeText={clear(setKInput)} keyboardType="number-pad" />
            <LookupField label="ν = n − 1" placeholder="e.g. 5" value={dfInput} onChangeText={clear(setDfInput)} keyboardType="number-pad" />
            <ResultChip label="Fmax critical" value={lookup ? fmt(lookup.value) : null} note={note} />
          </LookupRow>
        </>
      }
    >
      <DataGrid
        cornerLabel="ν \ k"
        columnLabels={KS.map(String)}
        rowLabels={HARTLEY_DFS.map(String)}
        cells={cells}
        highlight={highlight}
        onCellPress={setTapped}
        cellWidth={64}
        rowHeaderWidth={56}
      />
    </TableScreen>
  );
}
