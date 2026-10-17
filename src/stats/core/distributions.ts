import { StatsNumericError } from '../types';
import { betaInc, erfc, gammaP, gammaQ, lnGamma } from './special';

const SQRT2 = Math.SQRT2;
const SQRT_2PI = Math.sqrt(2 * Math.PI);

function checkProbability(p: number) {
  if (!(p > 0 && p < 1)) throw new StatsNumericError(`probability must be in (0, 1), got ${p}`);
}

/**
 * Inverts a continuous distribution by bisection on a bracketed interval.
 * Uses the survival function for upper-tail probabilities to keep precision.
 */
function invert(
  cdf: (x: number) => number,
  sf: (x: number) => number,
  p: number,
  lo: number,
  hi: number,
  lowerBound = -Infinity,
): number {
  checkProbability(p);
  const upper = p > 0.5;
  const target = upper ? 1 - p : p;
  // f is increasing in x in both branches
  const f = upper ? (x: number) => target - sf(x) : (x: number) => cdf(x) - target;

  let expand = 0;
  while (f(hi) < 0) {
    lo = hi;
    hi *= 2;
    if (++expand > 200) throw new StatsNumericError('quantile bracket expansion failed');
  }
  expand = 0;
  while (f(lo) > 0) {
    hi = lo;
    lo = lowerBound > -Infinity ? (lo + lowerBound) / 2 : lo * 2 - 1;
    if (++expand > 200) throw new StatsNumericError('quantile bracket expansion failed');
  }
  for (let i = 0; i < 300; i++) {
    const mid = 0.5 * (lo + hi);
    if (f(mid) < 0) lo = mid;
    else hi = mid;
    if (hi - lo <= 1e-13 * Math.max(1, Math.abs(mid))) return 0.5 * (lo + hi);
  }
  return 0.5 * (lo + hi);
}

// ---------------------------------------------------------------- Normal

export const normal = {
  pdf(x: number, mu = 0, sigma = 1): number {
    const z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z) / (sigma * SQRT_2PI);
  },
  cdf(x: number, mu = 0, sigma = 1): number {
    return 0.5 * erfc(-(x - mu) / (sigma * SQRT2));
  },
  sf(x: number, mu = 0, sigma = 1): number {
    return 0.5 * erfc((x - mu) / (sigma * SQRT2));
  },
  /** Wichura (1988) AS241 PPND16, polished with one Newton step on the exact CDF. */
  quantile(p: number, mu = 0, sigma = 1): number {
    checkProbability(p);
    const q = p - 0.5;
    let z: number;
    if (Math.abs(q) <= 0.425) {
      const r = 0.180625 - q * q;
      z =
        (q *
          (((((((2509.0809287301226727 * r + 33430.575583588128105) * r + 67265.770927008700853) * r +
            45921.953931549871457) * r + 13731.693765509461125) * r + 1971.5909503065514427) * r +
            133.14166789178437745) * r + 3.387132872796366608)) /
        (((((((5226.495278852545925 * r + 28729.085735721942674) * r + 39307.89580009271061) * r +
          21213.794301586595867) * r + 5394.1960214247511077) * r + 687.1870074920579083) * r +
          42.313330701600911252) * r + 1);
    } else {
      let r = q < 0 ? p : 1 - p;
      r = Math.sqrt(-Math.log(r));
      if (r <= 5) {
        r -= 1.6;
        z =
          (((((((7.7454501427834140764e-4 * r + 0.0227238449892691845833) * r + 0.24178072517745061177) * r +
            1.27045825245236838258) * r + 3.64784832476320460504) * r + 5.7694972214606914055) * r +
            4.6303378461565452959) * r + 1.42343711074968357734) /
          (((((((1.05075007164441684324e-9 * r + 5.475938084995344946e-4) * r + 0.0151986665636164571966) * r +
            0.14810397642748007459) * r + 0.68976733498510000455) * r + 1.6763848301838038494) * r +
            2.05319162663775882187) * r + 1);
      } else {
        r -= 5;
        z =
          (((((((2.01033439929228813265e-7 * r + 2.71155556874348757815e-5) * r + 0.0012426609473880784386) * r +
            0.026532189526576123093) * r + 0.29656057182850489123) * r + 1.7848265399172913358) * r +
            5.4637849111641143699) * r + 6.6579046435011037772) /
          (((((((2.04426310338993978564e-15 * r + 1.4215117583164458887e-7) * r + 1.8463183175100546818e-5) * r +
            7.868691311456132591e-4) * r + 0.0148753612908506148525) * r + 0.13692988092273580531) * r +
            0.59983220655588793769) * r + 1);
      }
      if (q < 0) z = -z;
    }
    const dens = normal.pdf(z);
    if (dens > 1e-300) {
      const err = p < 0.5 ? normal.cdf(z) - p : (1 - p) - normal.sf(z);
      z -= err / dens;
    }
    return mu + sigma * z;
  },
};

// ---------------------------------------------------------------- Chi-square

export const chiSquare = {
  pdf(x: number, k: number): number {
    if (x <= 0) return 0;
    return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lnGamma(k / 2));
  },
  cdf(x: number, k: number): number {
    return gammaP(k / 2, x / 2);
  },
  sf(x: number, k: number): number {
    return gammaQ(k / 2, x / 2);
  },
  quantile(p: number, k: number): number {
    return invert((x) => chiSquare.cdf(x, k), (x) => chiSquare.sf(x, k), p, 0, Math.max(1, 2 * k), 0);
  },
};

// ---------------------------------------------------------------- Student t

export const studentT = {
  cdf(t: number, df: number): number {
    const x = df / (df + t * t);
    const tail = 0.5 * betaInc(x, df / 2, 0.5);
    return t > 0 ? 1 - tail : tail;
  },
  sf(t: number, df: number): number {
    return studentT.cdf(-t, df);
  },
  quantile(p: number, df: number): number {
    return invert((x) => studentT.cdf(x, df), (x) => studentT.sf(x, df), p, -10, 10);
  },
};

// ---------------------------------------------------------------- F

export const fDist = {
  cdf(x: number, d1: number, d2: number): number {
    if (x <= 0) return 0;
    return betaInc((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2);
  },
  sf(x: number, d1: number, d2: number): number {
    if (x <= 0) return 1;
    return betaInc(d2 / (d2 + d1 * x), d2 / 2, d1 / 2);
  },
  quantile(p: number, d1: number, d2: number): number {
    return invert((x) => fDist.cdf(x, d1, d2), (x) => fDist.sf(x, d1, d2), p, 0, 10, 0);
  },
};

// ---------------------------------------------------------------- Studentized range

// Gauss-Legendre nodes/weights as used by Copenhaver & Holland (1988) and R's ptukey.c.
const XLEG = [
  0.98156063424671925069, 0.904117256370474856678, 0.769902674194304687037,
  0.587317954286617447297, 0.367831498998180193753, 0.125233408511468915472,
];
const ALEG = [
  0.047175336386511827195, 0.106939325995318430960, 0.160078328543346226335,
  0.203167426723065921749, 0.233492536538354808761, 0.249147045813402785001,
];
const XLEGQ = [
  0.98940093499164993260, 0.944575023073232576078, 0.865631202387831743880,
  0.755404408355003033895, 0.617876244402643748447, 0.458016777657227386342,
  0.281603550779258913230, 0.0950125098376374401853,
];
const ALEGQ = [
  0.0271524594117540948518, 0.0622535239386478928628, 0.0951585116824927848099,
  0.124628971255533872052, 0.149595988816576732082, 0.169156519395002538189,
  0.182603415044923588867, 0.189450610455068496285,
];

/** Probability integral of the range of cc normal means (Hartley's form). */
function wprob(w: number, rr: number, cc: number): number {
  const nleg = 12;
  const ihalf = 6;
  const C1 = -30;
  const C2 = -50;
  const C3 = 60;
  const bb = 8;
  const wlar = 3;
  const qsqz = w * 0.5;
  if (qsqz >= bb) return 1;

  let prW = 2 * normal.cdf(qsqz) - 1;
  prW = prW >= Math.exp(C2 / cc) ? Math.pow(prW, cc) : 0;

  const wincr = w > wlar ? 2 : 3;
  let blb = qsqz;
  const binc = (bb - qsqz) / wincr;
  let bub = blb + binc;
  let einsum = 0;
  const cc1 = cc - 1;

  for (let wi = 1; wi <= wincr; wi++) {
    let elsum = 0;
    const a = 0.5 * (bub + blb);
    const b = 0.5 * (bub - blb);
    for (let jj = 1; jj <= nleg; jj++) {
      let j: number;
      let xx: number;
      if (ihalf < jj) {
        j = nleg - jj + 1;
        xx = XLEG[j - 1];
      } else {
        j = jj;
        xx = -XLEG[j - 1];
      }
      const ac = a + b * xx;
      const qexpo = ac * ac;
      if (qexpo > C3) break;
      const pplus = 2 * normal.cdf(ac);
      const pminus = 2 * normal.cdf(ac, w, 1);
      let rinsum = pplus * 0.5 - pminus * 0.5;
      if (rinsum >= Math.exp(C1 / cc1)) {
        rinsum = ALEG[j - 1] * Math.exp(-(0.5 * qexpo)) * Math.pow(rinsum, cc1);
        elsum += rinsum;
      }
    }
    elsum *= (2 * b * cc) / SQRT_2PI;
    einsum += elsum;
    blb = bub;
    bub += binc;
  }

  prW += einsum;
  if (prW <= Math.exp(C1 / rr)) return 0;
  prW = Math.pow(prW, rr);
  return prW >= 1 ? 1 : prW;
}

export const studentizedRange = {
  /** P(Q ≤ q) for k means and df error degrees of freedom (Copenhaver & Holland 1988). */
  cdf(q: number, k: number, df: number): number {
    if (q <= 0) return 0;
    if (df < 2 || k < 2) throw new StatsNumericError('ptukey requires k ≥ 2 and df ≥ 2');
    const rr = 1;
    if (df > 25000) return wprob(q, rr, k);

    const nlegq = 16;
    const ihalfq = 8;
    const f2 = df * 0.5;
    let f2lf = f2 * Math.log(df) - df * Math.LN2 - lnGamma(f2);
    const f21 = f2 - 1;
    const ff4 = df * 0.25;
    const ulen = df <= 100 ? 1 : df <= 800 ? 0.5 : df <= 5000 ? 0.25 : 0.125;
    f2lf += Math.log(ulen);

    let ans = 0;
    for (let i = 1; i <= 50; i++) {
      let otsum = 0;
      const twa1 = (2 * i - 1) * ulen;
      for (let jj = 1; jj <= nlegq; jj++) {
        let j: number;
        let t1: number;
        if (ihalfq < jj) {
          j = jj - ihalfq - 1;
          t1 = f2lf + f21 * Math.log(twa1 + XLEGQ[j] * ulen) - (XLEGQ[j] * ulen + twa1) * ff4;
        } else {
          j = jj - 1;
          t1 = f2lf + f21 * Math.log(twa1 - XLEGQ[j] * ulen) + (XLEGQ[j] * ulen - twa1) * ff4;
        }
        if (t1 >= -30) {
          const qsqz =
            ihalfq < jj
              ? q * Math.sqrt((XLEGQ[j] * ulen + twa1) * 0.5)
              : q * Math.sqrt((-(XLEGQ[j] * ulen) + twa1) * 0.5);
          otsum += wprob(qsqz, rr, k) * ALEGQ[j] * Math.exp(t1);
        }
      }
      if (i * ulen >= 1 && otsum <= 1e-14) break;
      ans += otsum;
    }
    return Math.min(ans, 1);
  },
  sf(q: number, k: number, df: number): number {
    return 1 - studentizedRange.cdf(q, k, df);
  },
  quantile(p: number, k: number, df: number): number {
    checkProbability(p);
    const f = (x: number) => studentizedRange.cdf(x, k, df) - p;
    let lo = 0;
    let hi = 5;
    let flo = -p;
    let fhi = f(hi);
    let guard = 0;
    while (fhi < 0) {
      lo = hi;
      flo = fhi;
      hi *= 2;
      fhi = f(hi);
      if (++guard > 50) throw new StatsNumericError('qtukey bracket expansion failed');
    }
    // Illinois (modified regula falsi): bracketed and superlinear, so each
    // costly ptukey call counts.
    let side = 0;
    for (let i = 0; i < 100; i++) {
      const x = (lo * fhi - hi * flo) / (fhi - flo);
      const fx = f(x);
      if (Math.abs(fx) < 1e-12 || hi - lo < 1e-10) return x;
      if (fx < 0) {
        lo = x;
        flo = fx;
        if (side === -1) fhi /= 2;
        side = -1;
      } else {
        hi = x;
        fhi = fx;
        if (side === 1) flo /= 2;
        side = 1;
      }
    }
    throw new StatsNumericError('qtukey did not converge');
  },
};

// ---------------------------------------------------------------- Kolmogorov

function matMul(A: number[], B: number[], m: number): number[] {
  const C = new Array(m * m).fill(0);
  for (let i = 0; i < m; i++)
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let k = 0; k < m; k++) s += A[i * m + k] * B[k * m + j];
      C[i * m + j] = s;
    }
  return C;
}

function matPow(A: number[], eA: number, m: number, n: number): { V: number[]; e: number } {
  if (n === 1) return { V: A.slice(), e: eA };
  const half = matPow(A, eA, m, Math.floor(n / 2));
  const B = matMul(half.V, half.V, m);
  const eB = 2 * half.e;
  let V: number[];
  let e: number;
  if (n % 2 === 0) {
    V = B;
    e = eB;
  } else {
    V = matMul(A, B, m);
    e = eA + eB;
  }
  const mid = Math.floor(m / 2) * m + Math.floor(m / 2);
  if (V[mid] > 1e140) {
    V = V.map((v) => v * 1e-140);
    e += 140;
  }
  return { V, e };
}

export const kolmogorov = {
  /** P(Dₙ < d) for the two-sided one-sample statistic (Marsaglia, Tsang & Wang 2003). */
  cdf(d: number, n: number): number {
    if (d <= 0) return 0;
    if (d >= 1) return 1;
    const s = d * d * n;
    if (s > 7.24 || (s > 3.76 && n > 99)) {
      return 1 - 2 * Math.exp(-(2.000071 + 0.331 / Math.sqrt(n) + 1.409 / n) * s);
    }
    const k = Math.floor(n * d) + 1;
    const m = 2 * k - 1;
    const h = k - n * d;
    const H = new Array(m * m);
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) H[i * m + j] = i - j + 1 < 0 ? 0 : 1;
    for (let i = 0; i < m; i++) {
      H[i * m] -= Math.pow(h, i + 1);
      H[(m - 1) * m + i] -= Math.pow(h, m - i);
    }
    H[(m - 1) * m] += 2 * h - 1 > 0 ? Math.pow(2 * h - 1, m) : 0;
    for (let i = 0; i < m; i++)
      for (let j = 0; j < m; j++)
        if (i - j + 1 > 0) for (let g = 1; g <= i - j + 1; g++) H[i * m + j] /= g;
    const { V, e } = matPow(H, 0, m, n);
    let sum = V[(k - 1) * m + k - 1];
    let eQ = e;
    for (let i = 1; i <= n; i++) {
      sum = (sum * i) / n;
      if (sum < 1e-140) {
        sum *= 1e140;
        eQ -= 140;
      }
    }
    return sum * Math.pow(10, eQ);
  },
  sf(d: number, n: number): number {
    return Math.min(1, Math.max(0, 1 - kolmogorov.cdf(d, n)));
  },
  /** Critical value d such that P(Dₙ ≥ d) = α. */
  critical(alpha: number, n: number): number {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 100; i++) {
      const mid = 0.5 * (lo + hi);
      if (kolmogorov.sf(mid, n) > alpha) lo = mid;
      else hi = mid;
    }
    return 0.5 * (lo + hi);
  },
};
