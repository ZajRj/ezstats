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

const DF1S = Array.from({ length: 20 }, (_, i) => i + 1); // numerator df (columns)
const DF2S = Array.from({ length: 30 }, (_, i) => i + 1); // denominator df (rows)
const TABLE_ALPHAS = [0.10, 0.05, 0.025, 0.01];
const TAILS = ['Right tail', 'Left tail'];
const TAIL_FORMULAS = ['P(F ≥ f) = α', 'P(F ≤ f) = α'];
const LOOKUP_MODES = ['α → critical F', 'F → p-value'];

export default function FTable() {
  const [tailIdx, setTailIdx] = useState(0);
  const [alphaIdx, setAlphaIdx] = useState(1);
  const [lookupMode, setLookupMode] = useState(0);
  const [df1Input, setDf1Input] = useState('');
  const [df2Input, setDf2Input] = useState('');
  const [alphaInput, setAlphaInput] = useState('');
  const [fInput, setFInput] = useState('');
  const [tapped, setTapped] = useState<GridCell | null>(null);

  const tableAlpha = TABLE_ALPHAS[alphaIdx];
  const critical = (alpha: number, d1: number, d2: number) =>
    jStat.centralF.inv(tailIdx === 0 ? 1 - alpha : alpha, d1, d2);

  const cells = useMemo(
    () => DF2S.map((d2) => DF1S.map((d1) => critical(tableAlpha, d1, d2).toFixed(2))),
    [tableAlpha, tailIdx],
  );

  const d1 = parseInt(df1Input, 10);
  const d2 = parseInt(df2Input, 10);
  const dfsValid = d1 > 0 && d2 > 0;
  // An empty α field falls back to the α the table is showing.
  const alpha = alphaInput ? parseNum(alphaInput) : tableAlpha;
  const alphaValid = !isNaN(alpha) && alpha > 0 && alpha < 1;
  const f = parseNum(fInput);
  const fValid = !isNaN(f) && f >= 0;

  const criticalF = lookupMode === 0 && dfsValid && alphaValid ? critical(alpha, d1, d2) : null;
  const pValue = lookupMode === 1 && dfsValid && fValid
    ? (tailIdx === 0 ? 1 - jStat.centralF.cdf(f, d1, d2) : jStat.centralF.cdf(f, d1, d2))
    : null;

  const onTable = dfsValid && d1 <= DF1S.length && d2 <= DF2S.length;
  const showsSameAlpha = lookupMode === 1 || Math.abs(alpha - tableAlpha) < 1e-9;
  const lookupCell = onTable && showsSameAlpha ? { row: d2 - 1, col: d1 - 1 } : null;
  const highlight = tapped ?? lookupCell;

  const readout = highlight
    ? `d₁ ${DF1S[highlight.col]}   ·   d₂ ${DF2S[highlight.row]}   ·   α = ${tableAlpha}   ·   F = ${cells[highlight.row][highlight.col]}`
    : null;

  const onAlphaChange = (text: string) => {
    setAlphaInput(text);
    setTapped(null);
    const a = parseNum(text);
    const idx = TABLE_ALPHAS.findIndex((x) => Math.abs(x - a) < 1e-9);
    if (idx >= 0) setAlphaIdx(idx);
  };

  const clearTap = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setTapped(null); };
  const dfNote = dfsValid && !onTable ? 'df beyond table' : null;

  return (
    <TableScreen
      title="F-Table"
      caption={`Critical values f where ${TAIL_FORMULAS[tailIdx]}. Rows are d₂ (denominator), columns are d₁ (numerator).`}
      readout={readout}
      controls={
        <>
          <SegmentedControl compact options={TAILS} selectedIndex={tailIdx} onChange={setTailIdx} />
          <SegmentedControl
            compact
            options={TABLE_ALPHAS.map((a) => `α ${a}`)}
            selectedIndex={alphaIdx}
            onChange={(i) => { setAlphaIdx(i); setAlphaInput(''); setTapped(null); }}
          />
          <SegmentedControl compact options={LOOKUP_MODES} selectedIndex={lookupMode} onChange={clearTap(setLookupMode)} />
          <LookupRow>
            {lookupMode === 1 && (
              <LookupField label="F" placeholder="3.10" value={fInput} onChangeText={clearTap(setFInput)} />
            )}
            <LookupField label="d₁" placeholder="5" value={df1Input} onChangeText={clearTap(setDf1Input)} keyboardType="number-pad" />
            <LookupField label="d₂" placeholder="12" value={df2Input} onChangeText={clearTap(setDf2Input)} keyboardType="number-pad" />
            {lookupMode === 0 && (
              <LookupField label="α" placeholder={String(tableAlpha)} value={alphaInput} onChangeText={onAlphaChange} />
            )}
            {lookupMode === 0 ? (
              <ResultChip
                label="Critical F"
                value={criticalF !== null ? criticalF.toFixed(3) : null}
                note={alphaInput && !alphaValid ? 'Enter 0 < α < 1' : dfNote}
              />
            ) : (
              <ResultChip
                label={tailIdx === 0 ? 'P(F ≥ f)' : 'P(F ≤ f)'}
                value={pValue !== null ? pValue.toFixed(4) : null}
                note={dfNote}
              />
            )}
          </LookupRow>
        </>
      }
    >
      <DataGrid
        cornerLabel="d₂ \ d₁"
        columnLabels={DF1S.map(String)}
        rowLabels={DF2S.map(String)}
        cells={cells}
        highlight={highlight}
        onCellPress={setTapped}
        cellWidth={60}
        rowHeaderWidth={60}
      />
    </TableScreen>
  );
}
