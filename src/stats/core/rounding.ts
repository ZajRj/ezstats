import type { Mode } from '../types';

/**
 * Rounds half away from zero to `digits` decimals. The toPrecision pass removes
 * binary noise first, so 1.005 rounds to 1.01 the way it would on paper.
 */
export function round(x: number, digits: number): number {
  if (!isFinite(x)) return x;
  const f = Math.pow(10, digits);
  const y = Number((Math.abs(x) * f).toPrecision(12));
  return (Math.sign(x) * Math.round(y)) / f;
}

/** "Modo tabla" helpers: identity in exact mode. */
export function tableRounder(mode: Mode) {
  const r = (digits: number) => (x: number) => (mode === 'tabla' ? round(x, digits) : x);
  return {
    /** z-scores looked up in a normal table: 2 decimals. */
    z: r(2),
    /** Probabilities read from a table: 4 decimals. */
    p: r(4),
    /** Critical values printed with 3 decimals (χ², t, D). */
    crit3: r(3),
    /** F and q tables are printed with 2 decimals. */
    crit2: r(2),
  };
}

const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

/** Up to `digits` decimals, without trailing zeros. */
export function fmt(x: number, digits = 4): string {
  if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  const s = round(x, digits).toFixed(digits);
  const trimmed = s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  return trimmed === '-0' ? '0' : trimmed;
}

/** Exactly `digits` decimals (table columns, critical values). */
export function fix(x: number, digits = 4): string {
  if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
  const s = round(x, digits).toFixed(digits);
  return s === `-${(0).toFixed(digits)}` ? (0).toFixed(digits) : s;
}

/** p-values: 4 decimals, or scientific notation like 2.5457 × 10⁻⁵ when tiny. */
export function fmtP(p: number): string {
  if (p === 0) return '< 1 × 10⁻¹⁵';
  if (p >= 1e-4) return fix(p, 4);
  const [mant, exp] = p.toExponential(4).split('e');
  const e = String(Number(exp)).split('').map((c) => SUPERSCRIPT[c] ?? c).join('');
  return `${mant} × 10${e}`;
}

/** Percentage of α for conclusions: 0.05 → "5 %". */
export function fmtAlphaPct(alpha: number): string {
  return `${fmt(alpha * 100, 2)} %`;
}
