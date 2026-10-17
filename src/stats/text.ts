/**
 * Spanish text templates shared by every test. Conclusions are always built
 * from these, never written per dataset.
 */
import type { Decision, TestOptions } from './types';
import { fix, fmt, fmtAlphaPct, fmtP } from './core/rounding';

export interface Comparison {
  decision: Decision;
  /** "Como D = 0.1022 < 0.190, no se rechaza H₀" */
  phrase: string;
}

const verdict = (d: Decision) => (d === 'reject' ? 'se rechaza H₀' : 'no se rechaza H₀');

/** Reject when the statistic is at or above the critical value. */
export function compareUpper(symbol: string, value: number, critical: number, critDigits = 4): Comparison {
  const decision: Decision = value >= critical ? 'reject' : 'fail_to_reject';
  const op = decision === 'reject' ? '≥' : '<';
  return { decision, phrase: `Como ${symbol} = ${fmt(value)} ${op} ${fix(critical, critDigits)}, ${verdict(decision)}` };
}

/** Reject when the statistic is at or below the critical value. */
export function compareLower(symbol: string, value: number, critical: number, critDigits = 4): Comparison {
  const decision: Decision = value <= critical ? 'reject' : 'fail_to_reject';
  const op = decision === 'reject' ? '≤' : '>';
  return { decision, phrase: `Como ${symbol} = ${fmt(value)} ${op} ${fix(critical, critDigits)}, ${verdict(decision)}` };
}

/** Reject outside [lower, upper]. */
export function compareTwoSided(
  symbol: string,
  value: number,
  lower: number,
  upper: number,
  critDigits = 4,
): Comparison {
  if (value <= lower) {
    return { decision: 'reject', phrase: `Como ${symbol} = ${fmt(value)} ≤ ${fix(lower, critDigits)}, se rechaza H₀` };
  }
  if (value >= upper) {
    return { decision: 'reject', phrase: `Como ${symbol} = ${fmt(value)} ≥ ${fix(upper, critDigits)}, se rechaza H₀` };
  }
  return {
    decision: 'fail_to_reject',
    phrase: `Como ${fix(lower, critDigits)} < ${symbol} = ${fmt(value)} < ${fix(upper, critDigits)}, no se rechaza H₀`,
  };
}

export function compareP(p: number, alpha: number): Comparison {
  const decision: Decision = p <= alpha ? 'reject' : 'fail_to_reject';
  const op = decision === 'reject' ? (p < alpha ? '<' : '≤') : '>';
  return { decision, phrase: `Como p = ${fmtP(p)} ${op} α = ${fmt(alpha)}, ${verdict(decision)}` };
}

export function significance(alpha: number): string {
  return `Con un nivel de significancia del ${fmtAlphaPct(alpha)}`;
}

/** Subject for conclusions: "los datos" or the user's variable name. */
export function subject(opts: TestOptions): { text: string; plural: boolean } {
  const name = opts.variableName?.trim();
  if (!name) return { text: 'los datos', plural: true };
  return { text: name, plural: false };
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------- Families

export function normalityHypotheses(opts: TestOptions) {
  const s = subject(opts);
  const verb = s.plural ? 'siguen' : 'sigue';
  return {
    h0: `${capitalize(s.text)} ${verb} una distribución normal.`,
    h1: `${capitalize(s.text)} no ${verb} una distribución normal.`,
  };
}

export function normalityConclusion(c: Comparison, alpha: number, opts: TestOptions): string {
  const s = subject(opts);
  const verb = s.plural ? 'siguen' : 'sigue';
  const tail =
    c.decision === 'reject'
      ? `${s.text} no ${verb} una distribución normal.`
      : `no hay evidencia para afirmar que ${s.text} no ${verb} una distribución normal.`;
  return `${c.phrase}. ${significance(alpha)}, ${tail}`;
}

export function randomnessHypotheses() {
  return {
    h0: 'La secuencia es aleatoria (las observaciones son independientes).',
    h1: 'La secuencia no es aleatoria.',
  };
}

export function randomnessConclusion(c: Comparison, alpha: number, direction?: string): string {
  const tail =
    c.decision === 'reject'
      ? `la secuencia no es aleatoria${direction ? `: ${direction}` : ''}.`
      : 'no hay evidencia para afirmar que la secuencia no es aleatoria.';
  return `${c.phrase}. ${significance(alpha)}, ${tail}`;
}

export function equalVarianceConclusion(c: Comparison, alpha: number, k: number): string {
  const groups = k === 2 ? 'las dos poblaciones' : `las ${k} poblaciones`;
  const tail =
    c.decision === 'reject'
      ? `las varianzas de ${groups} no son todas iguales.`
      : `no hay evidencia para afirmar que las varianzas de ${groups} sean diferentes.`;
  return `${c.phrase}. ${significance(alpha)}, ${tail}`;
}

export function equalMeansConclusion(c: Comparison, alpha: number, what = 'las medias'): string {
  const tail =
    c.decision === 'reject'
      ? `al menos una de ${what} es diferente.`
      : `no hay evidencia para afirmar que ${what} sean diferentes.`;
  return `${c.phrase}. ${significance(alpha)}, ${tail}`;
}
