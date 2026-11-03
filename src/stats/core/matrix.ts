import { StatsInputError } from '../types';

/** Dense row-major matrix. */
export type Matrix = number[][];

export function transpose(A: Matrix): Matrix {
  return A[0].map((_, j) => A.map((row) => row[j]));
}

export function multiply(A: Matrix, B: Matrix): Matrix {
  const n = A.length;
  const m = B[0].length;
  const inner = B.length;
  if (A[0].length !== inner) throw new Error(`Incompatible dimensions ${n}×${A[0].length} · ${inner}×${m}`);
  const C: Matrix = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < n; i++)
    for (let k = 0; k < inner; k++) {
      const a = A[i][k];
      if (a === 0) continue;
      for (let j = 0; j < m; j++) C[i][j] += a * B[k][j];
    }
  return C;
}

export function identity(n: number): Matrix {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

export function column(v: number[]): Matrix {
  return v.map((x) => [x]);
}

export function trace(A: Matrix): number {
  return A.reduce((s, row, i) => s + row[i], 0);
}

export interface InverseResult {
  inverse: Matrix;
  determinant: number;
}

/**
 * Gauss-Jordan elimination with partial pivoting. Throws when the matrix is
 * singular (relative pivot below 1e-12), which for XᵀX means exact multicollinearity.
 */
export function invert(A: Matrix): InverseResult {
  const n = A.length;
  const M = A.map((row, i) => [...row, ...identity(n)[i]]);
  const scale = Math.max(...A.flat().map(Math.abs)) || 1;
  let det = 1;
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-12 * scale) {
      throw new StatsInputError(
        'La matriz XᵀX es singular (no invertible): hay multicolinealidad exacta o una regresora constante. Elimina la variable redundante.',
      );
    }
    if (piv !== c) {
      [M[piv], M[c]] = [M[c], M[piv]];
      det = -det;
    }
    const p = M[c][c];
    det *= p;
    for (let j = 0; j < 2 * n; j++) M[c][j] /= p;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return { inverse: M.map((row) => row.slice(n)), determinant: det };
}
