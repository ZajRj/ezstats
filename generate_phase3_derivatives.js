const fs = require('fs');

const dataPath = './src/data/seed_data.json';
let data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const calculusTopic = data.topics.find(t => t.slug === 'calculus-ml');

// 1. Fundamental Rules (replacing basic 'derivatives-basics' chapter content)
const basicRules = {
  slug: 'derivatives-basics',
  name: '10.1 Reglas Algebraicas Fundamentales',
  type: 'CHAPTER',
  concepts: [
    {
      slug: 'derivada-constante',
      name: 'Derivada de una constante',
      type: 'CONCEPT',
      articleTitle: 'Derivada de una constante',
      blocks: [
        { type: 'TEXT', content: 'La derivada de cualquier número solo es cero.' },
        { type: 'FORMULA', content: '\\frac{d}{dx}[c] = 0', metadata: { '\\frac{d}{dx}': 'Operador derivada', 'c': 'Una constante cualquiera' } }
      ]
    },
    {
      slug: 'regla-identidad',
      name: 'Regla de la identidad',
      type: 'CONCEPT',
      articleTitle: 'Variable simple',
      blocks: [
        { type: 'TEXT', content: 'La derivada de la variable respecto a sí misma es 1.' },
        { type: 'FORMULA', content: '\\frac{d}{dx}[x] = 1', metadata: { '\\frac{d}{dx}': 'Operador derivada', 'x': 'Variable independiente' } }
      ]
    },
    {
      slug: 'power-rule',
      name: 'Regla de la potencia',
      type: 'CONCEPT',
      articleTitle: 'Regla de la potencia',
      blocks: [
        { type: 'TEXT', content: 'Bajas el exponente a multiplicar y le restas 1 al exponente original.' },
        { type: 'FORMULA', content: '\\frac{d}{dx}[x^n] = nx^{n-1}', metadata: { 'n': 'El exponente original', 'n-1': 'El nuevo exponente' } },
        { type: 'TIP', content: 'Para f(x) = x^2, la derivada es 2x.' }
      ]
    },
    {
      slug: 'multiplo-constante',
      name: 'Múltiplo constante',
      type: 'CONCEPT',
      articleTitle: 'Regla del múltiplo constante',
      blocks: [
        { type: 'TEXT', content: 'Si un número multiplica a una función, el número se queda quieto y solo derivas la función.' },
        { type: 'FORMULA', content: "\\frac{d}{dx}[c \\cdot f(x)] = c \\cdot f'(x)", metadata: { 'c': 'Constante multiplicativa', "f'(x)": 'Derivada de la función' } }
      ]
    },
    {
      slug: 'suma-resta',
      name: 'Regla de suma y resta',
      type: 'CONCEPT',
      articleTitle: 'Suma y resta',
      blocks: [
        { type: 'TEXT', content: 'La derivada de una suma es la suma de las derivadas.' },
        { type: 'FORMULA', content: "\\frac{d}{dx}[f(x) \\pm g(x)] = f'(x) \\pm g'(x)", metadata: { '\\pm': 'Más o menos', "f'(x)": 'Derivada de f', "g'(x)": 'Derivada de g' } }
      ]
    }
  ]
};

// 2. Operaciones
const opsChapter = {
  slug: 'derivatives-ops',
  name: '10.2 Reglas de Operaciones',
  type: 'CHAPTER',
  concepts: [
    {
      slug: 'regla-producto',
      name: 'Regla del Producto',
      type: 'CONCEPT',
      articleTitle: 'Regla del Producto',
      blocks: [
        { type: 'TEXT', content: 'La derivada del primero por el segundo sin derivar, más el primero sin derivar por la derivada del segundo.' },
        { type: 'FORMULA', content: "\\frac{d}{dx}[f(x) \\cdot g(x)] = f'(x)g(x) + f(x)g'(x)", metadata: { "f'(x)g(x)": 'Derivada del primero por segundo normal', "f(x)g'(x)": 'Primero normal por derivada del segundo' } }
      ]
    },
    {
      slug: 'regla-cociente',
      name: 'Regla del Cociente',
      type: 'CONCEPT',
      articleTitle: 'Regla del Cociente',
      blocks: [
        { type: 'TEXT', content: 'El de abajo por la derivada del de arriba, menos el de arriba por la derivada del de abajo, todo sobre el de abajo al cuadrado.' },
        { type: 'FORMULA', content: "\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f'(x)g(x) - f(x)g'(x)}{[g(x)]^2}", metadata: { "f'(x)g(x) - f(x)g'(x)": 'Numerador derivado estilo producto con resta', '[g(x)]^2': 'Denominador al cuadrado' } }
      ]
    },
    {
      slug: 'chain-rule',
      name: 'Regla de la Cadena',
      type: 'CONCEPT',
      articleTitle: 'Regla de la Cadena',
      blocks: [
        { type: 'TEXT', content: 'Sirve para derivar funciones dentro de funciones. Derivada de la función externa (evaluada en la interna) por la derivada de la función interna.' },
        { type: 'FORMULA', content: "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)", metadata: { "f'(g(x))": 'Derivada externa', "g'(x)": 'Derivada interna' } },
        { type: 'TIP', content: 'La regla de la cadena es vital para el Backpropagation en Redes Neuronales.' }
      ]
    }
  ]
};

// 3. Exponenciales y Logarítmicas
const expChapter = {
  slug: 'derivatives-exp',
  name: '10.3 Funciones Exponenciales y Logarítmicas',
  type: 'CHAPTER',
  concepts: [
    {
      slug: 'exp-natural',
      name: 'Exponencial natural',
      type: 'CONCEPT',
      articleTitle: 'Exponencial natural',
      blocks: [
        { type: 'TEXT', content: 'La invencible: Su derivada es ella misma.' },
        { type: 'FORMULA', content: '\\frac{d}{dx}[e^x] = e^x', metadata: { 'e^x': 'Función exponencial base e' } }
      ]
    },
    {
      slug: 'exp-base-a',
      name: 'Exponencial base a',
      type: 'CONCEPT',
      articleTitle: 'Exponencial base cualquiera',
      blocks: [
        { type: 'TEXT', content: 'Para base cualquiera a:' },
        { type: 'FORMULA', content: '\\frac{d}{dx}[a^x] = a^x \\ln(a)', metadata: { 'a^x': 'Función', '\\ln(a)': 'Logaritmo natural de la base' } }
      ]
    },
    {
      slug: 'log-natural',
      name: 'Logaritmo natural',
      type: 'CONCEPT',
      articleTitle: 'Logaritmo natural',
      blocks: [
        { type: 'TEXT', content: 'La derivada del logaritmo natural de x es 1/x.' },
        { type: 'FORMULA', content: '\\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}', metadata: { '\\frac{1}{x}': 'Inverso multiplicativo' } }
      ]
    },
    {
      slug: 'log-base-a',
      name: 'Logaritmo base a',
      type: 'CONCEPT',
      articleTitle: 'Logaritmo base cualquiera',
      blocks: [
        { type: 'TEXT', content: 'Para logaritmo de base cualquiera a:' },
        { type: 'FORMULA', content: '\\frac{d}{dx}[\\log_a(x)] = \\frac{1}{x \\ln(a)}', metadata: { 'x \\ln(a)': 'El factor de conversión de base' } }
      ]
    }
  ]
};

// 4. Trigonométricas
const trigChapter = {
  slug: 'derivatives-trig',
  name: '10.4 Funciones Trigonométricas',
  type: 'CHAPTER',
  concepts: [
    {
      slug: 'seno-coseno',
      name: 'Seno y Coseno',
      type: 'CONCEPT',
      articleTitle: 'Seno y Coseno',
      blocks: [
        { type: 'TEXT', content: 'Las más básicas y cíclicas.' },
        { type: 'FORMULA', content: '\\frac{d}{dx}[\\sin(x)] = \\cos(x)', metadata: { '\\cos(x)': 'Derivada positiva' } },
        { type: 'FORMULA', content: '\\frac{d}{dx}[\\cos(x)] = -\\sin(x)', metadata: { '-\\sin(x)': 'Ojo con el signo negativo' } }
      ]
    },
    {
      slug: 'tan-cot',
      name: 'Tangente y Cotangente',
      type: 'CONCEPT',
      articleTitle: 'Tangente y Cotangente',
      blocks: [
        { type: 'TEXT', content: 'Derivadas con funciones secantes y cosecantes al cuadrado.' },
        { type: 'FORMULA', content: '\\frac{d}{dx}[\\tan(x)] = \\sec^2(x)', metadata: { '\\sec^2(x)': 'Secante al cuadrado' } },
        { type: 'FORMULA', content: '\\frac{d}{dx}[\\cot(x)] = -\\csc^2(x)', metadata: { '-\\csc^2(x)': 'Signo negativo y cosecante al cuadrado' } }
      ]
    },
    {
      slug: 'sec-csc',
      name: 'Secante y Cosecante',
      type: 'CONCEPT',
      articleTitle: 'Secante y Cosecante',
      blocks: [
        { type: 'TEXT', content: 'Funciones recíprocas.' },
        { type: 'FORMULA', content: '\\frac{d}{dx}[\\sec(x)] = \\sec(x)\\tan(x)', metadata: { '\\sec(x)\\tan(x)': 'Producto de secante y tangente' } },
        { type: 'FORMULA', content: '\\frac{d}{dx}[\\csc(x)] = -\\csc(x)\\cot(x)', metadata: { '-\\csc(x)\\cot(x)': 'Negativo y producto de cosecante y cotangente' } }
      ]
    }
  ]
};

// Keep advanced calculus for ML (partial derivatives and gradients)
const advancedChapter = {
  slug: 'advanced-calculus',
  name: '10.5 Gradientes y Parciales',
  type: 'CHAPTER',
  concepts: [
    {
      slug: 'partial-derivatives',
      name: 'Derivadas Parciales',
      type: 'CONCEPT',
      articleTitle: 'Derivadas Parciales',
      blocks: [
        { type: 'TEXT', content: 'Cuando una función tiene múltiples variables, una derivada parcial mide la tasa de cambio respecto a UNA variable, mientras asume que las demás son constantes.' },
        { type: 'FORMULA', content: '\\frac{\\partial f}{\\partial x_1}', metadata: { '\\partial': 'El símbolo de derivada parcial (del)', 'x_1': 'La variable específica' } },
        { type: 'TIP', content: 'En ML, tu función de costo depende de miles de pesos. Tomas una derivada parcial para CADA peso.' }
      ]
    },
    {
      slug: 'gradients',
      name: 'El Gradiente',
      type: 'CONCEPT',
      articleTitle: 'El Vector Gradiente',
      blocks: [
        { type: 'TEXT', content: 'El Gradiente es simplemente un vector que agrupa todas las derivadas parciales. Apunta en la dirección del ASCENSO MÁS EMPINADO de la función.' },
        { type: 'FORMULA', content: '\\nabla f = \\left[ \\frac{\\partial f}{\\partial x_1}, \\dots, \\frac{\\partial f}{\\partial x_n} \\right]^T', metadata: { '\\nabla f': 'Nabla (El Vector Gradiente)', '\\frac{\\partial f}{\\partial x_i}': 'Derivada parcial para la dimensión i' } },
        { type: 'TIP', content: 'El Descenso de Gradiente funciona calculando el gradiente y luego dando un paso en la dirección NEGATIVA para alcanzar el error mínimo.' }
      ]
    }
  ]
};

calculusTopic.chapters = [basicRules, opsChapter, expChapter, trigChapter, advancedChapter];

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Successfully added all derivatives to seed_data.json!');
