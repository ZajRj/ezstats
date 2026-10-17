/**
 * Example datasets. Used by the "Cargar ejemplo" buttons and by the unit tests;
 * expected results are in src/stats/__tests__ (checked against SciPy and hand calculation).
 */

/** Normal — contenido neto (g), n = 20. */
export const DATASET_A = [
  71.8, 72.4, 73.1, 73.5, 73.5, 74.0, 74.2, 74.6, 74.6, 74.6,
  75.1, 75.3, 75.3, 75.8, 76.2, 76.5, 76.5, 77.3, 78.0, 79.1,
];

/** Right-skewed — tiempo de resolución (h), n = 20. */
export const DATASET_B = [
  0.5, 0.5, 0.8, 1.0, 1.0, 1.0, 1.2, 1.5, 1.5, 1.8,
  2.0, 2.4, 2.4, 3.1, 3.6, 4.5, 6.0, 8.2, 11.5, 17.0,
];

/** Small sample — minutos, n = 8. */
export const DATASET_C = [15, 18, 12, 15, 21, 16, 14, 17];

export const ANOVA_GROUPS = {
  G1: [23, 25, 21, 22, 24, 26],
  G2: [28, 30, 27, 29, 31, 28],
  G3: [22, 24, 23, 25, 21, 24],
};

/** Sequence for the runs tests (order matters). */
export const RUNS_SEQUENCE = [12, 15, 11, 18, 14, 9, 16, 13, 17, 10, 19, 12, 14, 16, 11, 15];
