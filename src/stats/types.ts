export type Decision = 'reject' | 'fail_to_reject';
export type Mode = 'tabla' | 'exacto';
export type Family = 'normalidad' | 'varianza' | 'aleatoriedad' | 'anova';
export type Tail = 'two' | 'left' | 'right';

export type Step =
  | { kind: 'text'; title?: string; body: string }
  | { kind: 'formula'; title?: string; expression: string; substituted?: string; result?: string }
  | {
      kind: 'table';
      title?: string;
      columns: string[];
      rows: (string | number)[][];
      highlight?: { row: number; col: number }[];
    };

export type ChartSpec =
  | {
      kind: 'ecdf';
      /** Sorted distinct values with the ECDF height after each one. */
      points: { x: number; F: number; Fprev: number }[];
      mean: number;
      sd: number;
      /** Where the largest discrepancy occurs. */
      dAt: { x: number; from: number; to: number };
    }
  | { kind: 'runs'; values: number[]; median: number; signs: (1 | -1 | 0)[] }
  | { kind: 'updown'; values: number[]; signs: (1 | -1 | 0)[] }
  | { kind: 'acf'; lags: number[]; rho: number[]; bound: number }
  | { kind: 'means'; labels: string[]; means: number[]; sds: number[]; ns: number[]; grandMean: number };

export interface TestResult {
  testId: string;
  testName: string;
  family: Family;
  alpha: number;
  mode: Mode;
  hypotheses: { h0: string; h1: string };
  statistic: { symbol: string; value: number };
  df?: number | [number, number];
  criticalValue?: { value: number; source: string; interpolated?: boolean };
  /** Second bound for two-sided tests whose critical region has two different limits. */
  criticalLower?: { value: number; source: string };
  pValue?: number;
  pValueApprox?: boolean;
  decision: Decision;
  conclusion: string;
  warnings: string[];
  steps: Step[];
  chart?: ChartSpec;
  /** Tests run automatically afterwards, e.g. Tukey HSD after a significant ANOVA. */
  followUp?: TestResult[];
}

export interface TestOptions {
  alpha: number;
  mode: Mode;
  /** Optional variable name used in conclusions, e.g. "el contenido neto". */
  variableName?: string;
  unit?: string;
}

/** Thrown for invalid input; `message` is a user-facing Spanish sentence. */
export class StatsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StatsInputError';
  }
}

/** Thrown when an iterative numerical routine fails to converge. */
export class StatsNumericError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StatsNumericError';
  }
}
