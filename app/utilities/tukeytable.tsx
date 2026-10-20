import React, { useMemo, useState } from 'react';
import DataGrid, { GridCell } from '../../src/components/ui/DataGrid';
import SegmentedControl from '../../src/components/ui/SegmentedControl';
import { TableScreen, LookupField, LookupRow, ResultChip } from '../../src/components/ui/TableKit';
import { TUKEY_DFS, TUKEY_KS, TUKEY_TABLE } from '../../src/stats/tables/tukey';
import { studentizedRange } from '../../src/stats/core/distributions';

const ALPHAS = [0.05, 0.01];

export default function TukeyTable() {
  const [alphaIdx, setAlphaIdx] = useState(0);
  const [kInput, setKInput] = useState('');
  const [dfInput, setDfInput] = useState('');
  const [tapped, setTapped] = useState<GridCell | null>(null);

  const alpha = ALPHAS[alphaIdx];
  const cells = TUKEY_DFS.map((df) => TUKEY_TABLE[String(alpha)][df].map((q) => q.toFixed(2)));
  const k = parseInt(kInput, 10);
  const df = parseInt(dfInput, 10);
  const valid = k >= 2 && df >= 2 && k <= 50;
  const row = TUKEY_DFS.indexOf(df as (typeof TUKEY_DFS)[number]);
  const col = TUKEY_KS.indexOf(k as (typeof TUKEY_KS)[number]);
  const tabulated = valid && row >= 0 && col >= 0;
  // Untabulated (k, ν): compute the exact quantile instead.
  const exact = useMemo(
    () => (valid && !tabulated ? studentizedRange.quantile(1 - alpha, k, df).toFixed(3) : null),
    [valid, tabulated, alpha, k, df],
  );
  const q = !valid ? null : tabulated ? cells[row][col] : exact;
  const highlight = tapped ?? (tabulated ? { row, col } : row >= 0 ? { row, col: -1 } : null);

  const readout = highlight && highlight.col >= 0
    ? `k ${TUKEY_KS[highlight.col]}   ·   ν ${TUKEY_DFS[highlight.row]}   ·   α = ${alpha}   ·   q = ${cells[highlight.row][highlight.col]}`
    : null;
  const clear = (fn: (s: string) => void) => (s: string) => { fn(s); setTapped(null); };

  return (
    <TableScreen
      title="Tukey q Table"
      caption="Studentized range q(1 − α; k, ν): k means, ν = N − k error degrees of freedom. HSD = q·√(MS_within / n)."
      readout={readout}
      controls={
        <>
          <SegmentedControl compact options={ALPHAS.map((a) => `α ${a}`)} selectedIndex={alphaIdx} onChange={(i) => { setAlphaIdx(i); setTapped(null); }} />
          <LookupRow>
            <LookupField label="k means" placeholder="e.g. 3" value={kInput} onChangeText={clear(setKInput)} keyboardType="number-pad" />
            <LookupField label="ν (error df)" placeholder="e.g. 15" value={dfInput} onChangeText={clear(setDfInput)} keyboardType="number-pad" />
            <ResultChip label="q critical" value={q} note={valid && !tabulated ? 'Exact (not tabulated)' : null} />
          </LookupRow>
        </>
      }
    >
      <DataGrid
        cornerLabel="ν \ k"
        columnLabels={TUKEY_KS.map(String)}
        rowLabels={TUKEY_DFS.map(String)}
        cells={cells}
        highlight={highlight}
        onCellPress={setTapped}
        cellWidth={64}
        rowHeaderWidth={56}
      />
    </TableScreen>
  );
}
