import React, { useState } from 'react';
import DataGrid, { GridCell } from '../../src/components/ui/DataGrid';
import { TableScreen, LookupField, LookupRow, ResultChip, parseNum } from '../../src/components/ui/TableKit';
import { KS_ALPHAS, KS_LARGE_N, KS_TABLE } from '../../src/stats/tables/ks';
import { ksCritical } from '../../src/stats/tests/normality/ks';
import { fix } from '../../src/stats/core/rounding';

const NS = Object.keys(KS_TABLE).map(Number);
const ROW_LABELS = [...NS.map(String), '> 35'];
const CELLS = [
  ...NS.map((n) => KS_TABLE[n].map((d) => fix(d, 3))),
  KS_ALPHAS.map((a) => `${fix(KS_LARGE_N[String(a)], 2)}/√n`),
];

export default function KsTable() {
  const [nInput, setNInput] = useState('');
  const [alphaInput, setAlphaInput] = useState('');
  const [tapped, setTapped] = useState<GridCell | null>(null);

  const n = parseInt(nInput, 10);
  const alpha = parseNum(alphaInput);
  const col = KS_ALPHAS.findIndex((a) => Math.abs(a - alpha) < 1e-9);
  const lookup = n >= 1 && col >= 0 ? ksCritical(n, alpha) : null;
  const lookupCell: GridCell | null = lookup ? { row: n <= 35 ? n - 1 : NS.length, col } : null;
  const highlight = tapped ?? lookupCell;

  const readout = highlight
    ? `n ${ROW_LABELS[highlight.row]}   ·   α = ${KS_ALPHAS[highlight.col]}   ·   D = ${CELLS[highlight.row][highlight.col]}`
    : null;
  const clear = (fn: (s: string) => void) => (s: string) => { fn(s); setTapped(null); };

  return (
    <TableScreen
      title="K-S Table"
      caption="Critical values of D for the one-sample Kolmogorov-Smirnov test with known μ and σ (two-sided). Reject H₀ if D ≥ the value."
      readout={readout}
      controls={
        <LookupRow>
          <LookupField label="n" placeholder="e.g. 20" value={nInput} onChangeText={clear(setNInput)} keyboardType="number-pad" />
          <LookupField label="α" placeholder="e.g. 0.05" value={alphaInput} onChangeText={clear(setAlphaInput)} />
          <ResultChip
            label="D critical"
            value={lookup ? fix(lookup.value, n <= 35 ? 3 : 4) : null}
            note={alphaInput && col < 0 ? 'α: .20 .15 .10 .05 .01' : lookup && n > 35 ? 'c/√n formula' : null}
          />
        </LookupRow>
      }
    >
      <DataGrid
        cornerLabel="n \ α"
        columnLabels={KS_ALPHAS.map(String)}
        rowLabels={ROW_LABELS}
        cells={CELLS}
        highlight={highlight}
        onCellPress={setTapped}
        cellWidth={80}
        rowHeaderWidth={60}
      />
    </TableScreen>
  );
}
