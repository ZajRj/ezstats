import React, { useMemo, useState } from 'react';
import DataGrid, { GridCell } from '../../src/components/ui/DataGrid';
import SegmentedControl from '../../src/components/ui/SegmentedControl';
import { TableScreen, LookupField, LookupRow, ResultChip } from '../../src/components/ui/TableKit';
import { runsCritical, RUNS_TABLE_MAX } from '../../src/stats/tables/runs';

const NS = Array.from({ length: RUNS_TABLE_MAX - 1 }, (_, i) => i + 2); // 2…20
const ALPHAS = [0.05, 0.1, 0.01];
const BOUNDS = ['Lower: reject if R ≤', 'Upper: reject if R ≥'];

export default function RunsTable() {
  const [alphaIdx, setAlphaIdx] = useState(0);
  const [boundIdx, setBoundIdx] = useState(0);
  const [n1Input, setN1Input] = useState('');
  const [n2Input, setN2Input] = useState('');
  const [tapped, setTapped] = useState<GridCell | null>(null);

  const alpha = ALPHAS[alphaIdx];
  const crit = useMemo(() => NS.map((n1) => NS.map((n2) => runsCritical(n1, n2, alpha))), [alpha]);
  const cells = crit.map((row) => row.map((c) => {
    const v = boundIdx === 0 ? c.lower : c.upper;
    return v === null ? '—' : String(v);
  }));

  const n1 = parseInt(n1Input, 10);
  const n2 = parseInt(n2Input, 10);
  const inTable = n1 >= 2 && n2 >= 2 && n1 <= RUNS_TABLE_MAX && n2 <= RUNS_TABLE_MAX;
  const lookup = inTable ? crit[n1 - 2][n2 - 2] : null;
  const highlight = tapped ?? (inTable ? { row: n1 - 2, col: n2 - 2 } : null);

  const readout = highlight
    ? (() => {
        const c = crit[highlight.row][highlight.col];
        return `n₁ ${NS[highlight.row]}   ·   n₂ ${NS[highlight.col]}   ·   reject if R ≤ ${c.lower ?? '—'} or R ≥ ${c.upper ?? '—'}`;
      })()
    : null;
  const clear = (fn: (s: string) => void) => (s: string) => { fn(s); setTapped(null); };

  return (
    <TableScreen
      title="Runs Table"
      caption={`Swed & Eisenhart (1943) critical values for the number of runs R, two-sided α = ${alpha}. “—” means no value of R is that extreme.`}
      readout={readout}
      controls={
        <>
          <SegmentedControl compact options={ALPHAS.map((a) => `α ${a}`)} selectedIndex={alphaIdx} onChange={(i) => { setAlphaIdx(i); setTapped(null); }} />
          <SegmentedControl compact options={BOUNDS} selectedIndex={boundIdx} onChange={setBoundIdx} />
          <LookupRow>
            <LookupField label="n₁ (+)" placeholder="e.g. 7" value={n1Input} onChangeText={clear(setN1Input)} keyboardType="number-pad" />
            <LookupField label="n₂ (−)" placeholder="e.g. 7" value={n2Input} onChangeText={clear(setN2Input)} keyboardType="number-pad" />
            <ResultChip
              label="R ≤ … or R ≥ …"
              value={lookup ? `${lookup.lower ?? '—'} · ${lookup.upper ?? '—'}` : null}
              note={n1 > RUNS_TABLE_MAX || n2 > RUNS_TABLE_MAX ? 'n > 20: use Z' : null}
            />
          </LookupRow>
        </>
      }
    >
      <DataGrid
        cornerLabel="n₁ \ n₂"
        columnLabels={NS.map(String)}
        rowLabels={NS.map(String)}
        cells={cells}
        highlight={highlight}
        onCellPress={setTapped}
        cellWidth={48}
        rowHeaderWidth={60}
      />
    </TableScreen>
  );
}
