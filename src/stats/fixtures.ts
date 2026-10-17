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

/** n = 50 sample for the χ² goodness-of-fit test (needs enough data per interval). */
export const DATASET_D = [
  58.2, 63.1, 59.2, 42.2, 38.9, 50.5, 56.9, 54.1, 64.5, 56.0,
  55.1, 44.1, 41.1, 61.9, 50.4, 56.5, 39.0, 46.5, 39.7, 43.8,
  57.2, 38.2, 45.7, 51.3, 44.7, 48.0, 48.2, 53.3, 46.5, 52.2,
  50.5, 53.4, 51.8, 63.3, 44.7, 59.6, 46.8, 42.3, 59.7, 46.5,
  46.9, 38.9, 33.2, 55.1, 40.7, 56.2, 64.8, 49.1, 41.0, 53.2,
];
