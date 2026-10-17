/**
 * Critical values of the Lilliefors statistic D.
 * Source: H. W. Lilliefors (1967), "On the Kolmogorov-Smirnov test for normality
 * with mean and variance unknown", JASA 62(318), Table 1.
 */
import { round } from '../core/rounding';

export const LILLIEFORS_ALPHAS = [0.2, 0.15, 0.1, 0.05, 0.01] as const;

const TABLE: Record<number, [number, number, number, number, number]> = {
  4: [0.3, 0.319, 0.352, 0.381, 0.417],
  5: [0.285, 0.299, 0.315, 0.337, 0.405],
  6: [0.265, 0.277, 0.294, 0.319, 0.364],
  7: [0.247, 0.258, 0.276, 0.3, 0.348],
  8: [0.233, 0.244, 0.261, 0.285, 0.331],
  9: [0.223, 0.233, 0.249, 0.271, 0.311],
  10: [0.215, 0.224, 0.239, 0.258, 0.294],
  11: [0.206, 0.217, 0.23, 0.249, 0.284],
  12: [0.199, 0.212, 0.223, 0.242, 0.275],
  13: [0.19, 0.202, 0.214, 0.234, 0.268],
  14: [0.183, 0.194, 0.207, 0.227, 0.261],
  15: [0.177, 0.187, 0.201, 0.22, 0.257],
  16: [0.173, 0.182, 0.195, 0.213, 0.25],
  17: [0.169, 0.177, 0.189, 0.206, 0.245],
  18: [0.166, 0.173, 0.184, 0.2, 0.239],
  19: [0.163, 0.169, 0.179, 0.195, 0.235],
  20: [0.16, 0.166, 0.174, 0.19, 0.231],
  25: [0.142, 0.147, 0.158, 0.18, 0.203],
  30: [0.131, 0.136, 0.144, 0.161, 0.187],
};

/** Large-sample coefficients c such that D_crit = c / √n for n > 30. */
const LARGE_N = [0.736, 0.768, 0.805, 0.886, 1.031];

export type LillieforsLookup =
  | { kind: 'table'; value: number; n: number }
  | { kind: 'interpolated'; value: number; n1: number; n2: number; d1: number; d2: number }
  | { kind: 'formula'; value: number; coefficient: number };

export function lillieforsAlphaIndex(alpha: number): number {
  return LILLIEFORS_ALPHAS.findIndex((a) => Math.abs(a - alpha) < 1e-9);
}

/** Returns null when α is not tabulated or n < 4. */
export function lillieforsCritical(n: number, alpha: number): LillieforsLookup | null {
  const j = lillieforsAlphaIndex(alpha);
  if (j < 0 || n < 4) return null;
  if (TABLE[n]) return { kind: 'table', value: TABLE[n][j], n };
  if (n > 30) {
    const coefficient = LARGE_N[j];
    return { kind: 'formula', value: round(coefficient / Math.sqrt(n), 4), coefficient };
  }
  // 21–24 interpolate between 20 and 25; 26–29 between 25 and 30.
  const n1 = n < 25 ? 20 : 25;
  const n2 = n < 25 ? 25 : 30;
  const d1 = TABLE[n1][j];
  const d2 = TABLE[n2][j];
  const value = round(d1 + ((n - n1) / (n2 - n1)) * (d2 - d1), 4);
  return { kind: 'interpolated', value, n1, n2, d1, d2 };
}

/**
 * Approximate p-value: Dallal & Wilkinson (1986) for p ≤ 0.1, with the
 * Stephens-type polynomial used by R's nortest::lillie.test above that.
 */
export function lillieforsPValue(D: number, n: number): number {
  const Kd = n <= 100 ? D : D * Math.pow(n / 100, 0.49);
  const nd = n <= 100 ? n : 100;
  let p = Math.exp(
    -7.01256 * Kd * Kd * (nd + 2.78019) +
      2.99587 * Kd * Math.sqrt(nd + 2.78019) -
      0.122119 +
      0.974598 / Math.sqrt(nd) +
      1.67997 / nd,
  );
  if (p > 0.1) {
    const KK = (Math.sqrt(n) - 0.01 + 0.85 / Math.sqrt(n)) * D;
    if (KK <= 0.302) p = 1;
    else if (KK <= 0.5) p = 2.76773 - 19.828315 * KK + 80.709644 * KK ** 2 - 138.55152 * KK ** 3 + 81.218052 * KK ** 4;
    else if (KK <= 0.9) p = -4.901232 + 40.662806 * KK - 97.490286 * KK ** 2 + 94.029866 * KK ** 3 - 32.355711 * KK ** 4;
    else if (KK <= 1.31) p = 6.198765 - 19.558097 * KK + 23.186922 * KK ** 2 - 12.234627 * KK ** 3 + 2.423045 * KK ** 4;
    else p = 0;
  }
  return Math.min(1, Math.max(0, p));
}
