import type { Mode, Step, TestOptions, TestResult } from '../types';
import { StatsInputError } from '../types';
import { fix, fmt } from '../core/rounding';

export function hypothesesStep(h: { h0: string; h1: string }): Step {
  return { kind: 'text', title: 'Hipótesis', body: `H₀: ${h.h0}\nH₁: ${h.h1}` };
}

export function dataStep(values: number[], title = 'Datos', note?: string): Step {
  return {
    kind: 'text',
    title,
    body: `${values.map((v) => fmt(v)).join(', ')}${note ? `\n${note}` : ''}\n(n = ${values.length})`,
  };
}

export function modeNote(mode: Mode): Step {
  return {
    kind: 'text',
    title: 'Modo de cálculo',
    body:
      mode === 'tabla'
        ? 'Modo tabla: z se redondea a 2 decimales antes de buscar Φ(z), las probabilidades se muestran con 4 decimales y los valores críticos salen de tablas impresas.'
        : 'Modo exacto: precisión completa y valor p calculado con la distribución correspondiente.',
  };
}

export function decisionStep(phrase: string): Step {
  return { kind: 'text', title: 'Decisión', body: `${phrase}.` };
}

export function conclusionStep(text: string): Step {
  return { kind: 'text', title: 'Conclusión', body: text };
}

export function requireN(values: number[], min: number, testName: string) {
  if (values.length < min) {
    throw new StatsInputError(`${testName} necesita al menos ${min} datos (hay ${values.length}).`);
  }
}

export function requireGroups(groups: number[][], minGroups: number, minEach: number, testName: string) {
  if (groups.length < minGroups) {
    throw new StatsInputError(`${testName} necesita al menos ${minGroups} grupos.`);
  }
  groups.forEach((g, i) => {
    if (g.length < minEach) {
      throw new StatsInputError(`El grupo ${i + 1} necesita al menos ${minEach} datos para ${testName} (hay ${g.length}).`);
    }
  });
}

export function requireAlpha(alpha: number) {
  if (!(alpha > 0 && alpha < 1)) throw new StatsInputError('α debe estar entre 0 y 1.');
}

/** Formats an F/χ²-style quantile reference like "χ²(0.95; 19)". */
export function quantileLabel(symbol: string, p: number, df: number | [number, number]): string {
  const d = Array.isArray(df) ? `${df[0]}, ${df[1]}` : `${df}`;
  return `${symbol}(${fmt(p)}; ${d})`;
}

export function critSource(mode: Mode, table: string): string {
  return mode === 'tabla' ? `Tabla ${table}` : `Cuantil exacto ${table}`;
}

export function digitsFor(mode: Mode, tableDigits: number): number {
  return mode === 'tabla' ? tableDigits : 4;
}

export { fix, fmt };
export type { TestOptions, TestResult };
