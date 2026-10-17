import { StatsNumericError } from '../types';

const EPS = 1e-16;
const FPMIN = 1e-300;
const MAX_ITER = 1000;

// Lanczos approximation, g = 7, n = 9 (relative error ~1e-15).
const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];

/** Natural log of the gamma function for x > 0. */
export function lnGamma(x: number): number {
  if (x <= 0) throw new StatsNumericError('lnGamma requires x > 0');
  if (x < 0.5) {
    // Reflection: Γ(x)Γ(1−x) = π / sin(πx)
    return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGamma(1 - x);
  }
  const z = x - 1;
  let a = LANCZOS[0];
  const t = z + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Series for the regularized lower incomplete gamma P(a, x); converges for x < a + 1. */
function gammaPSeries(a: number, x: number): number {
  let ap = a;
  let sum = 1 / a;
  let del = sum;
  for (let n = 0; n < MAX_ITER; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) {
      return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
    }
  }
  throw new StatsNumericError('gammaP series did not converge');
}

/** Continued fraction (modified Lentz) for Q(a, x); converges for x ≥ a + 1. */
function gammaQContinuedFraction(a: number, x: number): number {
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < MAX_ITER; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) {
      return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
    }
  }
  throw new StatsNumericError('gammaQ continued fraction did not converge');
}

/** Regularized lower incomplete gamma P(a, x). */
export function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  if (!isFinite(x)) return 1;
  return x < a + 1 ? gammaPSeries(a, x) : 1 - gammaQContinuedFraction(a, x);
}

/** Regularized upper incomplete gamma Q(a, x) = 1 − P(a, x), accurate in the tail. */
export function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (!isFinite(x)) return 0;
  return x < a + 1 ? 1 - gammaPSeries(a, x) : gammaQContinuedFraction(a, x);
}

// W. J. Cody (1969), "Rational Chebyshev approximations for the error function",
// as implemented in Netlib SPECFUN CALERF. Relative error below 1e-15.
const CODY_A = [3.1611237438705656, 113.864154151050156, 377.485237685302021, 3209.37758913846947, 0.185777706184603153];
const CODY_B = [23.6012909523441209, 244.024637934444173, 1282.61652607737228, 2844.23683343917062];
const CODY_C = [
  0.564188496988670089, 8.88314979438837594, 66.1191906371416295, 298.635138197400131,
  881.95222124176909, 1712.04761263407058, 2051.07837782607147, 1230.33935479799725, 2.15311535474403846e-8,
];
const CODY_D = [
  15.7449261107098347, 117.693950891312499, 537.181101862009858, 1621.38957456669019,
  3290.79923573345963, 4362.61909014324716, 3439.36767414372164, 1230.33935480374942,
];
const CODY_P = [0.305326634961232344, 0.360344899949804439, 0.125781726111229246, 0.0160837851487422766, 6.58749161529837803e-4, 0.0163153871373020978];
const CODY_Q = [2.56852019228982242, 1.87295284992346725, 0.527905102951428412, 0.0605183413124413191, 0.00233520497626869185];
const INV_SQRT_PI = 0.56418958354775628695;

/** exp(−y²) split to avoid cancellation, as in CALERF. */
function expNegSquare(y: number): number {
  const ysq = Math.trunc(y * 16) / 16;
  const del = (y - ysq) * (y + ysq);
  return Math.exp(-ysq * ysq) * Math.exp(-del);
}

/** Complementary error function (Cody's rational approximations). */
export function erfc(x: number): number {
  const y = Math.abs(x);
  let result: number;
  if (y <= 0.46875) {
    return 1 - erf(x);
  } else if (y <= 4) {
    let xnum = CODY_C[8] * y;
    let xden = y;
    for (let i = 0; i < 7; i++) {
      xnum = (xnum + CODY_C[i]) * y;
      xden = (xden + CODY_D[i]) * y;
    }
    result = ((xnum + CODY_C[7]) / (xden + CODY_D[7])) * expNegSquare(y);
  } else if (y >= 26.543) {
    result = 0;
  } else {
    const ysq = 1 / (y * y);
    let xnum = CODY_P[5] * ysq;
    let xden = ysq;
    for (let i = 0; i < 4; i++) {
      xnum = (xnum + CODY_P[i]) * ysq;
      xden = (xden + CODY_Q[i]) * ysq;
    }
    result = (ysq * (xnum + CODY_P[4])) / (xden + CODY_Q[4]);
    result = ((INV_SQRT_PI - result) / y) * expNegSquare(y);
  }
  return x < 0 ? 2 - result : result;
}

export function erf(x: number): number {
  const y = Math.abs(x);
  if (y <= 0.46875) {
    const ysq = y > 1.11e-16 ? y * y : 0;
    let xnum = CODY_A[4] * ysq;
    let xden = ysq;
    for (let i = 0; i < 3; i++) {
      xnum = (xnum + CODY_A[i]) * ysq;
      xden = (xden + CODY_B[i]) * ysq;
    }
    return (x * (xnum + CODY_A[3])) / (xden + CODY_B[3]);
  }
  return x < 0 ? erfc(-x) - 1 : 1 - erfc(x);
}

/** Continued fraction for the incomplete beta (modified Lentz). */
function betaContinuedFraction(a: number, b: number, x: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX_ITER; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) return h;
  }
  throw new StatsNumericError('incomplete beta continued fraction did not converge');
}

/** Regularized incomplete beta I_x(a, b). */
export function betaInc(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnFront =
    lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const front = Math.exp(lnFront);
  if (x < (a + 1) / (a + b + 2)) {
    return (front * betaContinuedFraction(a, b, x)) / a;
  }
  return 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}
