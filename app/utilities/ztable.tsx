import React, { useMemo, useState } from 'react';
import { jStat } from 'jstat';
import DataGrid, { GridCell } from '../../src/components/ui/DataGrid';
import SegmentedControl from '../../src/components/ui/SegmentedControl';
import {
  TableScreen,
  LookupField,
  LookupRow,
  ControlRow,
  ResultChip,
  parseNum,
  SIGNED_KEYBOARD,
} from '../../src/components/ui/TableKit';

const Z_ROWS = Array.from({ length: 40 }, (_, i) => i / 10); // 0.0 to 3.9
const Z_COLS = Array.from({ length: 10 }, (_, i) => i / 100); // .00 to .09
const TAILS = ['P(Z ≤ z)', 'P(Z ≥ z)'];
const SIGNS = ['z ≥ 0', 'z ≤ 0'];
const LOOKUP_MODES = ['z → probability', 'probability → z'];

/** Grid position of a z-score rounded to two decimals, or null if off the table. */
function cellForZ(z: number): GridCell | null {
  const hundredths = Math.round(Math.abs(z) * 100);
  const row = Math.floor(hundredths / 10);
  if (row >= Z_ROWS.length) return null;
  return { row, col: hundredths % 10 };
}

export default function ZTable() {
  const [tailIdx, setTailIdx] = useState(0);
  const [negative, setNegative] = useState(false);
  const [lookupMode, setLookupMode] = useState(0);
  const [zInput, setZInput] = useState('');
  const [pInput, setPInput] = useState('');
  const [tapped, setTapped] = useState<GridCell | null>(null);

  const prob = (z: number) => {
    const p = jStat.normal.cdf(z, 0, 1);
    return tailIdx === 0 ? p : 1 - p;
  };

  const zAt = (cell: GridCell) => {
    const z = Z_ROWS[cell.row] + Z_COLS[cell.col];
    return negative ? -z : z;
  };

  const cells = useMemo(
    () => Z_ROWS.map((r) => Z_COLS.map((c) => prob(negative ? -(r + c) : r + c).toFixed(4))),
    [negative, tailIdx],
  );

  // Forward: z → probability
  const zVal = parseNum(zInput);
  const forwardP = lookupMode === 0 && !isNaN(zVal) ? prob(zVal) : null;

  // Reverse: probability → z
  const pVal = parseNum(pInput);
  const pValid = !isNaN(pVal) && pVal > 0 && pVal < 1;
  const reverseZ = lookupMode === 1 && pValid
    ? jStat.normal.inv(tailIdx === 0 ? pVal : 1 - pVal, 0, 1)
    : null;

  const lookupZ = lookupMode === 0 ? (isNaN(zVal) ? null : zVal) : reverseZ;

  const onZChange = (text: string) => {
    setZInput(text);
    setTapped(null);
    const z = parseNum(text);
    if (!isNaN(z) && z !== 0) setNegative(z < 0);
  };

  const onPChange = (text: string) => {
    setPInput(text);
    setTapped(null);
    const p = parseNum(text);
    if (!isNaN(p) && p > 0 && p < 1) {
      const z = jStat.normal.inv(tailIdx === 0 ? p : 1 - p, 0, 1);
      if (Math.abs(z) > 1e-9) setNegative(z < 0);
    }
  };

  // Only point at the lookup cell while the matching half of the table is shown.
  const lookupOnScreen = lookupZ !== null && (lookupZ === 0 || lookupZ < 0 === negative);
  const highlight = tapped ?? (lookupOnScreen ? cellForZ(lookupZ) : null);

  const readout = highlight
    ? `z = ${zAt(highlight).toFixed(2)}   ·   ${TAILS[tailIdx]} = ${cells[highlight.row][highlight.col]}`
    : null;

  const offTable = lookupZ !== null && cellForZ(lookupZ) === null;

  return (
    <TableScreen
      title="Z-Table"
      caption={`Cells show ${TAILS[tailIdx]}. Row gives z to one decimal; column adds the second decimal.`}
      readout={readout}
      controls={
        <>
          <ControlRow>
            <SegmentedControl compact style={{ flex: 1 }} options={TAILS} selectedIndex={tailIdx} onChange={setTailIdx} />
            <SegmentedControl
              compact
              style={{ flex: 1 }}
              options={SIGNS}
              selectedIndex={negative ? 1 : 0}
              onChange={(i) => { setNegative(i === 1); setTapped(null); }}
            />
          </ControlRow>
          <SegmentedControl compact options={LOOKUP_MODES} selectedIndex={lookupMode} onChange={(i) => { setLookupMode(i); setTapped(null); }} />
          <LookupRow>
            {lookupMode === 0 ? (
              <LookupField label="z-score" placeholder="e.g. 1.96" value={zInput} onChangeText={onZChange} keyboardType={SIGNED_KEYBOARD} />
            ) : (
              <LookupField label="Probability" placeholder="e.g. 0.975" value={pInput} onChangeText={onPChange} />
            )}
            {lookupMode === 0 ? (
              <ResultChip
                label={TAILS[tailIdx]}
                value={forwardP !== null ? forwardP.toFixed(4) : null}
                note={offTable ? 'Beyond table range' : null}
              />
            ) : (
              <ResultChip
                label="z"
                value={reverseZ !== null ? reverseZ.toFixed(4) : null}
                note={pInput && !pValid ? 'Enter 0 < p < 1' : offTable ? 'Beyond table range' : null}
              />
            )}
          </LookupRow>
        </>
      }
    >
      <DataGrid
        cornerLabel="z"
        columnLabels={Z_COLS.map((c) => c.toFixed(2))}
        rowLabels={Z_ROWS.map((r) => (negative ? '−' : '') + r.toFixed(1))}
        cells={cells}
        highlight={highlight}
        onCellPress={setTapped}
        cellWidth={68}
        rowHeaderWidth={56}
      />
    </TableScreen>
  );
}
