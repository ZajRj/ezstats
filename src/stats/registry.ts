/**
 * Catalog of tests for the UI: what each one needs, how to run it and a short
 * "¿Qué es esta prueba?" sheet. The math lives in tests/; this file only wires it.
 */
import type { Family, Tail, TestOptions, TestResult } from './types';
import type { Group } from './tests/anova/anovaCore';
import { lilliefors } from './tests/normality/lilliefors';
import { kolmogorovSmirnov } from './tests/normality/ks';
import { shapiroWilk } from './tests/normality/shapiroWilk';
import { chiSquareGof } from './tests/normality/chiSquareGof';
import { andersonDarling } from './tests/normality/andersonDarling';
import { jarqueBera } from './tests/normality/jarqueBera';
import { chiSquareVariance } from './tests/variance/chiSquareVariance';
import { fTwoVariances } from './tests/variance/fTwoVariances';
import { bartlett } from './tests/variance/bartlett';
import { levene } from './tests/variance/levene';
import { hartley } from './tests/variance/hartley';
import { runsMedian } from './tests/randomness/runsMedian';
import { runsUpDown } from './tests/randomness/runsUpDown';
import { ljungBox } from './tests/randomness/ljungBox';
import { oneWayAnova } from './tests/anova/oneWay';
import { tukeyHsd } from './tests/anova/tukeyHsd';
import { kruskalWallis } from './tests/anova/kruskalWallis';
import { ANOVA_GROUPS, DATASET_A, DATASET_B, DATASET_C, DATASET_D, RUNS_SEQUENCE } from './fixtures';

export type InputKind = 'single' | 'sequence' | 'two' | 'groups';

export type ParamDef =
  | { key: string; kind: 'number'; label: string; placeholder?: string; optional?: boolean; hint?: string }
  | { key: string; kind: 'choice'; label: string; options: { value: string; label: string }[]; default: string };

export type ParamValues = Record<string, number | string | undefined>;

export interface Example {
  label: string;
  groups: Group[];
  params?: ParamValues;
  variableName?: string;
  unit?: string;
}

export interface TestInfo {
  what: string;
  assumptions: string;
  when: string;
  formula: string;
}

export interface TestDef {
  id: string;
  name: string;
  family: Family;
  /** One line: cuándo usarla. */
  when: string;
  requirements: string;
  input: InputKind;
  params: ParamDef[];
  tails: boolean;
  info: TestInfo;
  examples: Example[];
  run: (groups: Group[], params: ParamValues, opts: TestOptions) => TestResult;
}

const g = (label: string, values: number[]): Group => ({ label, values });
const num = (p: ParamValues, k: string) => (typeof p[k] === 'number' ? (p[k] as number) : NaN);
const tail = (p: ParamValues) => ((p.tail as Tail) ?? 'two');

const NORMAL_EXAMPLES: Example[] = [
  { label: 'A: contenido neto (normal)', groups: [g('Muestra', DATASET_A)], variableName: 'el contenido neto', unit: 'g' },
  { label: 'B: tiempo de resolución (asimétrico)', groups: [g('Muestra', DATASET_B)], variableName: 'el tiempo de resolución', unit: 'h' },
  { label: 'C: muestra pequeña', groups: [g('Muestra', DATASET_C)], variableName: 'la duración', unit: 'min' },
];
const ANOVA_EXAMPLE: Example[] = [
  { label: 'Tres grupos', groups: [g('Grupo 1', ANOVA_GROUPS.G1), g('Grupo 2', ANOVA_GROUPS.G2), g('Grupo 3', ANOVA_GROUPS.G3)] },
];
const TAIL_PARAM: ParamDef = {
  key: 'tail',
  kind: 'choice',
  label: 'Hipótesis alternativa',
  options: [
    { value: 'two', label: 'Bilateral (≠)' },
    { value: 'left', label: 'Izquierda (<)' },
    { value: 'right', label: 'Derecha (>)' },
  ],
  default: 'two',
};

export const TESTS: TestDef[] = [
  // ------------------------------------------------------------ Normalidad
  {
    id: 'lilliefors',
    name: 'Lilliefors',
    family: 'normalidad',
    when: 'Normalidad cuando μ y σ se estiman con la muestra.',
    requirements: 'n ≥ 4',
    input: 'single',
    params: [],
    tails: false,
    info: {
      what: 'Compara la distribución acumulada empírica con la normal de media x̄ y desviación s.',
      assumptions: 'Datos continuos e independientes.',
      when: 'Prueba de normalidad de referencia en el curso cuando no conoces μ ni σ.',
      formula: 'D = máx(Fᵢ/n − Φ(zᵢ), Φ(zᵢ) − Fᵢ₋₁/n),  zᵢ = (xᵢ − x̄)/s',
    },
    examples: NORMAL_EXAMPLES,
    run: (gr, _p, o) => lilliefors(gr[0].values, o),
  },
  {
    id: 'shapiroWilk',
    name: 'Shapiro-Wilk',
    family: 'normalidad',
    when: 'La prueba de normalidad más potente para muestras pequeñas y medianas.',
    requirements: '3 ≤ n ≤ 5000',
    input: 'single',
    params: [],
    tails: false,
    info: {
      what: 'Mide qué tan bien se alinean los datos ordenados con los cuantiles esperados de una normal.',
      assumptions: 'Datos independientes; sensible a empates muy frecuentes.',
      when: 'Cuando quieres la prueba de normalidad con mayor potencia, sobre todo con n < 50.',
      formula: 'W = [Σ aᵢ (x₍ₙ₋ᵢ₊₁₎ − x₍ᵢ₎)]² / Σ(xᵢ − x̄)²',
    },
    examples: NORMAL_EXAMPLES,
    run: (gr, _p, o) => shapiroWilk(gr[0].values, o),
  },
  {
    id: 'ks',
    name: 'Kolmogorov-Smirnov',
    family: 'normalidad',
    when: 'Normalidad cuando el enunciado da μ y σ conocidos.',
    requirements: 'n ≥ 2, μ y σ conocidos',
    input: 'single',
    params: [
      { key: 'mu', kind: 'number', label: 'μ conocida', placeholder: 'ej. 75' },
      { key: 'sigma', kind: 'number', label: 'σ conocida', placeholder: 'ej. 2' },
    ],
    tails: false,
    info: {
      what: 'Distancia máxima entre la acumulada empírica y la de una normal N(μ, σ) totalmente especificada.',
      assumptions: 'Datos continuos; μ y σ no se estiman con la misma muestra.',
      when: 'Si μ y σ salen de la muestra, usa Lilliefors: K-S con parámetros estimados es demasiado conservadora.',
      formula: 'D = máx |Fₙ(x) − Φ((x − μ)/σ)|',
    },
    examples: [{ ...NORMAL_EXAMPLES[0], params: { mu: 75, sigma: 2 } }],
    run: (gr, p, o) => kolmogorovSmirnov(gr[0].values, { mu: num(p, 'mu'), sigma: num(p, 'sigma') }, o),
  },
  {
    id: 'chiSquareGof',
    name: 'χ² de bondad de ajuste',
    family: 'normalidad',
    when: 'Normalidad con datos agrupados en intervalos; requiere muestras grandes.',
    requirements: 'n ≥ 10 y Eᵢ ≥ 5 tras unir intervalos',
    input: 'single',
    params: [{ key: 'k', kind: 'number', label: 'Número de intervalos k', placeholder: 'Sturges', optional: true }],
    tails: false,
    info: {
      what: 'Compara frecuencias observadas por intervalo con las esperadas bajo la normal.',
      assumptions: 'Frecuencias esperadas de al menos 5 por intervalo (se unen intervalos si hace falta).',
      when: 'Muestras grandes o datos ya agrupados en una tabla de frecuencias.',
      formula: 'χ² = Σ (Oᵢ − Eᵢ)² / Eᵢ,  gl = k − 1 − 2',
    },
    examples: [{ label: 'D: n = 50', groups: [g('Muestra', DATASET_D)] }],
    run: (gr, p, o) => chiSquareGof(gr[0].values, { k: isNaN(num(p, 'k')) ? undefined : num(p, 'k') }, o),
  },
  {
    id: 'andersonDarling',
    name: 'Anderson-Darling',
    family: 'normalidad',
    when: 'Normalidad dando más peso a las colas de la distribución.',
    requirements: 'n ≥ 8',
    input: 'single',
    params: [],
    tails: false,
    info: {
      what: 'Suma ponderada de las diferencias entre la acumulada empírica y la normal, con más peso en las colas.',
      assumptions: 'Datos continuos e independientes; μ y σ estimados.',
      when: 'Cuando importa detectar colas pesadas o valores extremos.',
      formula: 'A² = −n − (1/n) Σ (2i − 1)[ln Φ(zᵢ) + ln(1 − Φ(zₙ₊₁₋ᵢ))],  A*² = A²(1 + 0.75/n + 2.25/n²)',
    },
    examples: NORMAL_EXAMPLES,
    run: (gr, _p, o) => andersonDarling(gr[0].values, o),
  },
  {
    id: 'jarqueBera',
    name: 'Jarque-Bera',
    family: 'normalidad',
    when: 'Normalidad a partir de la asimetría y la curtosis; para muestras grandes.',
    requirements: 'n ≥ 3 (confiable con n ≥ 30)',
    input: 'single',
    params: [],
    tails: false,
    info: {
      what: 'Combina la asimetría S y el exceso de curtosis K − 3 en un estadístico χ² con 2 gl.',
      assumptions: 'Muestra grande: el valor p es asintótico.',
      when: 'Muestras grandes, por ejemplo residuos de un modelo.',
      formula: 'JB = (n/6)[S² + (K − 3)²/4]',
    },
    examples: NORMAL_EXAMPLES,
    run: (gr, _p, o) => jarqueBera(gr[0].values, o),
  },
  // ------------------------------------------------------------ Varianza
  {
    id: 'chiSquareVariance',
    name: 'χ² para una varianza',
    family: 'varianza',
    when: 'Comparar la varianza de una población con un valor σ₀².',
    requirements: 'n ≥ 2, población normal',
    input: 'single',
    params: [{ key: 'sigma0sq', kind: 'number', label: 'σ₀² (varianza de H₀)', placeholder: 'ej. 4' }, TAIL_PARAM],
    tails: true,
    info: {
      what: 'Evalúa si la varianza poblacional es igual a un valor dado.',
      assumptions: 'Población normal; es muy sensible a la falta de normalidad.',
      when: 'Control de calidad: ¿la variabilidad del proceso cumple la especificación?',
      formula: 'χ² = (n − 1)s² / σ₀²,  gl = n − 1',
    },
    examples: [{ ...NORMAL_EXAMPLES[0], params: { sigma0sq: 4, tail: 'two' } }],
    run: (gr, p, o) => chiSquareVariance(gr[0].values, { sigma0sq: num(p, 'sigma0sq'), tail: tail(p) }, o),
  },
  {
    id: 'fTwoVariances',
    name: 'F para dos varianzas',
    family: 'varianza',
    when: 'Comparar las varianzas de dos poblaciones normales.',
    requirements: 'n ≥ 2 en cada muestra',
    input: 'two',
    params: [TAIL_PARAM],
    tails: true,
    info: {
      what: 'Cociente de las dos varianzas muestrales comparado con la distribución F.',
      assumptions: 'Ambas poblaciones normales e independientes.',
      when: 'Antes de una prueba t de dos muestras, para decidir si se asumen varianzas iguales.',
      formula: 'F = s₁² / s₂²,  gl = (n₁ − 1, n₂ − 1)',
    },
    examples: [{ label: 'G1 vs G2', groups: [g('Grupo 1', ANOVA_GROUPS.G1), g('Grupo 2', ANOVA_GROUPS.G2)], params: { tail: 'two' } }],
    run: (gr, p, o) => fTwoVariances([gr[0], gr[1]], { tail: tail(p) }, o),
  },
  {
    id: 'levene',
    name: 'Levene / Brown-Forsythe',
    family: 'varianza',
    when: 'Homogeneidad de varianzas de k grupos, robusta a la falta de normalidad.',
    requirements: 'k ≥ 2 grupos, n ≥ 2 por grupo',
    input: 'groups',
    params: [
      {
        key: 'center',
        kind: 'choice',
        label: 'Centro',
        options: [
          { value: 'mean', label: 'Media (Levene)' },
          { value: 'median', label: 'Mediana (Brown-Forsythe)' },
        ],
        default: 'mean',
      },
    ],
    tails: false,
    info: {
      what: 'ANOVA aplicado a las desviaciones absolutas de cada dato respecto al centro de su grupo.',
      assumptions: 'Grupos independientes; no exige normalidad (Brown-Forsythe es aún más robusta).',
      when: 'Supuesto de homocedasticidad del ANOVA, sobre todo si dudas de la normalidad.',
      formula: 'zᵢⱼ = |xᵢⱼ − x̄ⱼ|,  W = F del ANOVA sobre los zᵢⱼ',
    },
    examples: ANOVA_EXAMPLE.map((e) => ({ ...e, params: { center: 'mean' } })),
    run: (gr, p, o) => levene(gr, { center: p.center === 'median' ? 'median' : 'mean' }, o),
  },
  {
    id: 'bartlett',
    name: 'Bartlett',
    family: 'varianza',
    when: 'Homogeneidad de varianzas de k grupos normales.',
    requirements: 'k ≥ 2 grupos, n ≥ 2 por grupo, normalidad',
    input: 'groups',
    params: [],
    tails: false,
    info: {
      what: 'Compara el logaritmo de la varianza combinada con los logaritmos de las varianzas de cada grupo.',
      assumptions: 'Normalidad en cada grupo; es sensible a su falta.',
      when: 'Cuando todos los grupos pasaron la prueba de normalidad.',
      formula: 'B = [(N − k) ln sₚ² − Σ(nⱼ − 1) ln sⱼ²] / C',
    },
    examples: ANOVA_EXAMPLE,
    run: (gr, _p, o) => bartlett(gr, o),
  },
  {
    id: 'hartley',
    name: 'Hartley (Fmax)',
    family: 'varianza',
    when: 'Prueba rápida de homogeneidad con grupos del mismo tamaño.',
    requirements: '2 ≤ k ≤ 12, mismo n en todos, α = 0.05 o 0.01',
    input: 'groups',
    params: [],
    tails: false,
    info: {
      what: 'Cociente entre la mayor y la menor varianza muestral.',
      assumptions: 'Normalidad y grupos de igual tamaño.',
      when: 'Cálculo a mano rápido; con tamaños distintos usa Levene.',
      formula: 'Fmax = s²máx / s²mín',
    },
    examples: ANOVA_EXAMPLE,
    run: (gr, _p, o) => hartley(gr, o),
  },
  // ------------------------------------------------------------ Aleatoriedad
  {
    id: 'runsMedian',
    name: 'Rachas sobre y bajo la mediana',
    family: 'aleatoriedad',
    when: 'Independencia de una secuencia en el orden en que se observó.',
    requirements: 'n ≥ 4, en orden de observación',
    input: 'sequence',
    params: [],
    tails: false,
    info: {
      what: 'Cuenta rachas de valores por encima (+) y por debajo (−) de la mediana.',
      assumptions: 'El orden de los datos es el orden de observación.',
      when: 'Supuesto de independencia antes de un ANOVA o de un análisis de control.',
      formula: 'Z = (R − μ_R)/σ_R,  μ_R = 2n₁n₂/(n₁ + n₂) + 1',
    },
    examples: [{ label: 'Secuencia de 16 datos', groups: [g('Secuencia', RUNS_SEQUENCE)] }],
    run: (gr, _p, o) => runsMedian(gr[0].values, o),
  },
  {
    id: 'runsUpDown',
    name: 'Rachas ascendentes y descendentes',
    family: 'aleatoriedad',
    when: 'Detectar tendencias u oscilaciones en una secuencia.',
    requirements: 'n ≥ 5 (mejor n ≥ 20), en orden',
    input: 'sequence',
    params: [],
    tails: false,
    info: {
      what: 'Cuenta rachas de subidas (↑) y bajadas (↓) entre valores consecutivos.',
      assumptions: 'Orden de observación; los empates consecutivos se ignoran.',
      when: 'Generadores de números aleatorios y series en el tiempo.',
      formula: 'μ_R = (2n − 1)/3,  σ²_R = (16n − 29)/90',
    },
    examples: [{ label: 'Secuencia de 16 datos', groups: [g('Secuencia', RUNS_SEQUENCE)] }],
    run: (gr, _p, o) => runsUpDown(gr[0].values, o),
  },
  {
    id: 'ljungBox',
    name: 'Ljung-Box',
    family: 'aleatoriedad',
    when: 'Autocorrelación conjunta de una serie en varios rezagos.',
    requirements: 'n ≥ 6 (mejor n ≥ 30), h < n',
    input: 'sequence',
    params: [{ key: 'h', kind: 'number', label: 'Rezagos h', placeholder: 'mín(10, n/5)', optional: true }],
    tails: false,
    info: {
      what: 'Suma ponderada de los cuadrados de las autocorrelaciones hasta el rezago h.',
      assumptions: 'Serie en orden temporal; aproximación χ² para n grande.',
      when: 'Residuos de un modelo o series temporales.',
      formula: 'Q = n(n + 2) Σₖ₌₁ʰ ρ̂ₖ²/(n − k),  gl = h',
    },
    examples: [{ label: 'Serie de 50 datos', groups: [g('Serie', DATASET_D)] }],
    run: (gr, p, o) => ljungBox(gr[0].values, { h: isNaN(num(p, 'h')) ? undefined : num(p, 'h') }, o),
  },
  // ------------------------------------------------------------ ANOVA
  {
    id: 'oneWayAnova',
    name: 'ANOVA de un factor',
    family: 'anova',
    when: 'Comparar las medias de k grupos independientes.',
    requirements: 'k ≥ 2, normalidad y varianzas iguales',
    input: 'groups',
    params: [],
    tails: false,
    info: {
      what: 'Descompone la variabilidad total en la parte entre grupos y la parte dentro de los grupos.',
      assumptions: 'Independencia, normalidad en cada grupo y homogeneidad de varianzas.',
      when: 'Comparar 3 o más medias. Si rechaza H₀, Tukey indica qué pares difieren.',
      formula: 'F = CM_entre / CM_dentro,  gl = (k − 1, N − k)',
    },
    examples: ANOVA_EXAMPLE,
    run: (gr, _p, o) => oneWayAnova(gr, o),
  },
  {
    id: 'tukeyHsd',
    name: 'Tukey HSD',
    family: 'anova',
    when: 'Qué pares de medias difieren después de un ANOVA significativo.',
    requirements: 'k ≥ 2 grupos, n ≥ 2 por grupo',
    input: 'groups',
    params: [],
    tails: false,
    info: {
      what: 'Compara cada par de medias con la diferencia honestamente significativa basada en el rango studentizado.',
      assumptions: 'Los mismos del ANOVA.',
      when: 'Después de un ANOVA que rechaza H₀ (se ejecuta solo en ese caso).',
      formula: 'HSD = q(α; k, N − k)·√(CM_dentro/n)',
    },
    examples: ANOVA_EXAMPLE,
    run: (gr, _p, o) => tukeyHsd(gr, o),
  },
  {
    id: 'kruskalWallis',
    name: 'Kruskal-Wallis',
    family: 'anova',
    when: 'Alternativa no paramétrica al ANOVA cuando fallan los supuestos.',
    requirements: 'k ≥ 2 grupos',
    input: 'groups',
    params: [],
    tails: false,
    info: {
      what: 'ANOVA sobre los rangos de los datos.',
      assumptions: 'Grupos independientes y distribuciones de forma similar.',
      when: 'Datos no normales o varianzas distintas.',
      formula: 'H = [12/(N(N + 1))] Σ Rⱼ²/nⱼ − 3(N + 1), corregido por empates',
    },
    examples: ANOVA_EXAMPLE,
    run: (gr, _p, o) => kruskalWallis(gr, o),
  },
];

export const FAMILIES: { id: Family; title: string; description: string }[] = [
  { id: 'normalidad', title: 'Normalidad', description: 'H₀: los datos siguen una distribución normal.' },
  { id: 'varianza', title: 'Varianza', description: 'H₀: las varianzas son iguales (o σ² = σ₀²).' },
  { id: 'aleatoriedad', title: 'Aleatoriedad', description: 'H₀: la secuencia es aleatoria.' },
  { id: 'anova', title: 'ANOVA', description: 'H₀: las medias de los grupos son iguales.' },
];

export function getTest(id: string): TestDef | undefined {
  return TESTS.find((t) => t.id === id);
}

/**
 * Runs the test in the requested mode and, quietly, in the other one. If the
 * decisions disagree the result is borderline, which the user should know.
 */
export function runWithModeCheck(def: TestDef, groups: Group[], params: ParamValues, opts: TestOptions): TestResult {
  const result = def.run(groups, params, opts);
  const otherMode = opts.mode === 'tabla' ? 'exacto' : 'tabla';
  try {
    const other = def.run(groups, params, { ...opts, mode: otherMode });
    if (other.decision !== result.decision) {
      result.warnings.unshift(
        `Resultado límite: en modo ${otherMode} la decisión es la contraria (${other.decision === 'reject' ? 'se rechaza' : 'no se rechaza'} H₀). ` +
          'El estadístico está muy cerca del valor crítico.',
      );
    }
  } catch {
    // The other mode may be unavailable (e.g. α without a table); nothing to compare.
  }
  return result;
}
