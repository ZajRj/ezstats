/**
 * Small-sample critical values for the number of runs R (two-sided).
 *
 * Swed & Eisenhart (1943), "Tables for testing randomness of grouping in a
 * sequence of alternatives", Ann. Math. Statist. 14(1), tabulate the exact
 * distribution of R for n₁, n₂ ≤ 20. Instead of transcribing those tables, the
 * same exact distribution is evaluated here:
 *   P(R = 2m)     = 2·C(n₁−1, m−1)·C(n₂−1, m−1) / C(N, n₁)
 *   P(R = 2m + 1) = [C(n₁−1, m)·C(n₂−1, m−1) + C(n₁−1, m−1)·C(n₂−1, m)] / C(N, n₁)
 * and the critical values are chosen as in the printed table: reject when
 * R ≤ lower or R ≥ upper, with each tail ≤ α/2.
 */
import { lnGamma } from '../core/special';

const lnChoose = (n: number, k: number) =>
  k < 0 || k > n ? -Infinity : lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);

/** Exact probability mass P(R = r) for n₁ and n₂ symbols. */
export function runsPmf(r: number, n1: number, n2: number): number {
  const lnTotal = lnChoose(n1 + n2, n1);
  if (r % 2 === 0) {
    const m = r / 2;
    return 2 * Math.exp(lnChoose(n1 - 1, m - 1) + lnChoose(n2 - 1, m - 1) - lnTotal);
  }
  const m = (r - 1) / 2;
  return (
    Math.exp(lnChoose(n1 - 1, m) + lnChoose(n2 - 1, m - 1) - lnTotal) +
    Math.exp(lnChoose(n1 - 1, m - 1) + lnChoose(n2 - 1, m) - lnTotal)
  );
}

export interface RunsCritical {
  /** Reject if R ≤ lower; null when no R is extreme enough. */
  lower: number | null;
  /** Reject if R ≥ upper; null when no R is extreme enough. */
  upper: number | null;
}

export const RUNS_TABLE_MAX = 20;

export function runsCritical(n1: number, n2: number, alpha: number): RunsCritical {
  const maxR = 2 * Math.min(n1, n2) + (n1 === n2 ? 0 : 1);
  const tail = alpha / 2;
  let lower: number | null = null;
  let cum = 0;
  for (let r = 2; r <= maxR; r++) {
    cum += runsPmf(r, n1, n2);
    if (cum <= tail + 1e-12) lower = r;
    else break;
  }
  let upper: number | null = null;
  cum = 0;
  for (let r = maxR; r >= 2; r--) {
    cum += runsPmf(r, n1, n2);
    if (cum <= tail + 1e-12) upper = r;
    else break;
  }
  return { lower, upper };
}
