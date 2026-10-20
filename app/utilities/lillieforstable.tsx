import React, { useState } from 'react';
import DataGrid, { GridCell } from '../../src/components/ui/DataGrid';
import { TableScreen, LookupField, LookupRow, ResultChip, parseNum } from '../../src/components/ui/TableKit';
import {
  LILLIEFORS_ALPHAS, LILLIEFORS_LARGE_N, LILLIEFORS_TABLE, lillieforsCritical,
} from '../../src/stats/tables/lilliefors';
import { fix } from '../../src/stats/core/rounding';

const NS = Object.keys(LILLIEFORS_TABLE).map(Number);
const ROW_LABELS = [...NS.map(String), '> 30'];
const CELLS = [
  ...NS.map((n) => LILLIEFORS_TABLE[n].map((d) => fix(d, 3))),
  LILLIEFORS_LARGE_N.map((c) => `${fix(c, 3)}/√n`),
];

export default function LillieforsTable() {
  const [nInput, setNInput] = useState('');
  const [alphaInput, setAlphaInput] = useState('');
  const [tapped, setTapped] = useState<GridCell | null>(null);

  const n = parseInt(nInput, 10);
  const alpha = parseNum(alphaInput);
  const col = LILLIEFORS_ALPHAS.findIndex((a) => Math.abs(a - alpha) < 1e-9);
  const lookup = n >= 4 && col >= 0 ? lillieforsCritical(n, alpha) : null;

  let lookupCell: GridCell | null = null;
  if (lookup?.kind === 'table') lookupCell = { row: NS.indexOf(n), col };
  else if (lookup?.kind === 'formula') lookupCell = { row: NS.length, col };
  else if (lookup?.kind === 'interpolated') lookupCell = { row: NS.indexOf(lookup.n1), col };
  const highlight = tapped ?? lookupCell;

  let note: string | null = null;
  if (alphaInput && col < 0) note = 'α: .20 .15 .10 .05 .01';
  else if (n > 0 && n < 4) note = 'Needs n ≥ 4';
  else if (lookup?.kind === 'interpolated') note = `Interpolated ${lookup.n1}–${lookup.n2}`;
  else if (lookup?.kind === 'formula') note = `${fix(lookup.coefficient, 3)}/√${n}`;

  const readout = highlight
    ? `n ${ROW_LABELS[highlight.row]}   ·   α = ${LILLIEFORS_ALPHAS[highlight.col]}   ·   D = ${CELLS[highlight.row][highlight.col]}`
    : null;
  const clear = (fn: (s: string) => void) => (s: string) => { fn(s); setTapped(null); };

  return (
    <TableScreen
      title="Lilliefors Table"
      caption="Critical values of D for the Lilliefors normality test (μ and σ estimated). Reject H₀ if D ≥ the value. Lilliefors (1967)."
      readout={readout}
      controls={
        <LookupRow>
          <LookupField label="n" placeholder="e.g. 22" value={nInput} onChangeText={clear(setNInput)} keyboardType="number-pad" />
          <LookupField label="α" placeholder="e.g. 0.05" value={alphaInput} onChangeText={clear(setAlphaInput)} />
          <ResultChip label="D critical" value={lookup ? fix(lookup.value, lookup.kind === 'table' ? 3 : 4) : null} note={note} />
        </LookupRow>
      }
    >
      <DataGrid
        cornerLabel="n \ α"
        columnLabels={LILLIEFORS_ALPHAS.map(String)}
        rowLabels={ROW_LABELS}
        cells={CELLS}
        highlight={highlight}
        onCellPress={setTapped}
        cellWidth={82}
        rowHeaderWidth={60}
      />
    </TableScreen>
  );
}
