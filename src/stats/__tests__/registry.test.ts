import { describe, test, expect } from '@jest/globals';
import { TESTS, runWithModeCheck, getTest } from '../registry';
import { resultToText } from '../export';
import type { Mode } from '../types';

describe('every catalog entry runs its examples in both modes', () => {
  for (const def of TESTS) {
    for (const mode of ['tabla', 'exacto'] as Mode[]) {
      test(`${def.id} · ${mode}`, () => {
        for (const ex of def.examples) {
          const params = Object.fromEntries(
            def.params.map((p) => [p.key, ex.params?.[p.key] ?? (p.kind === 'choice' ? p.default : undefined)]),
          );
          const r = runWithModeCheck(def, ex.groups, params, { alpha: 0.05, mode, variableName: ex.variableName });
          expect(r.testId.length).toBeGreaterThan(0);
          if (def.id !== 'tukeyHsd') expect(r.conclusion).toMatch(/H₀/);
          expect(r.conclusion).not.toMatch(/se acepta/i);
          expect(r.steps.length).toBeGreaterThan(2);
          expect(Number.isFinite(r.statistic.value)).toBe(true);
        }
      });
    }
  }
});

describe('text export', () => {
  test('includes hypotheses, decision and procedure tables in Markdown', () => {
    const def = getTest('lilliefors')!;
    const r = def.run(def.examples[2].groups, {}, { alpha: 0.05, mode: 'tabla' });
    const text = resultToText(r);
    expect(text).toContain('H₀:');
    expect(text).toContain('**No se rechaza H₀.**');
    expect(text).toContain('| xᵢ | fᵢ | Fᵢ | Fᵢ/n | Fᵢ₋₁/n | zᵢ | Φ(zᵢ) | D⁺ | D⁻ |');
  });
});
