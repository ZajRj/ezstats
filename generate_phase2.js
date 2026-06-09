const fs = require('fs');
const path = './src/data/seed_data.json';
const seedData = require(path);

const phase2Content = {
  // PROBABILITY FOUNDATIONS
  'set-theory': [
    { type: 'TEXT', content: 'Set theory is the mathematical foundation of probability. A sample space represents all possible outcomes of an experiment.' },
    { type: 'FORMULA', content: 'S = \\{O_1, O_2, \\dots, O_n\\}', metadata: { 'S': 'The sample space', '\\{ \\}': 'Set notation containing outcomes', 'O_i': 'Individual distinct outcomes' } },
    { type: 'TIP', content: 'For a coin flip, the sample space is S = {Heads, Tails}.' }
  ],
  'axioms-probability': [
    { type: 'TEXT', content: 'Kolmogorov defined three fundamental axioms that all probabilities must obey. Without these, math breaks.' },
    { type: 'FORMULA', content: 'P(A) \\ge 0', metadata: { 'P(A) \\ge 0': 'First Axiom: Probabilities cannot be negative' } },
    { type: 'FORMULA', content: 'P(S) = 1', metadata: { 'P(S) = 1': 'Second Axiom: The probability of the entire sample space occurring is 100%' } },
    { type: 'FORMULA', content: 'P(A \\cup B) = P(A) + P(B)', metadata: { 'P(A \\cup B)': 'Third Axiom: For disjoint (mutually exclusive) events, their union is the sum of their probabilities' } },
    { type: 'TIP', content: 'Every other probability rule (like the complement rule) is derived directly from these three axioms!' }
  ],
  'venn-diagrams': [
    { type: 'TEXT', content: 'Venn diagrams visually represent the relationship between sets (events). The intersection is where they overlap.' },
    { type: 'FORMULA', content: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)', metadata: { 'P(A \\cup B)': 'The probability of A OR B occurring (Union)', 'P(A \\cap B)': 'The probability of A AND B occurring (Intersection)', '-': 'We subtract the intersection because it was counted twice!' } },
    { type: 'TIP', content: 'This formula is known as the Principle of Inclusion-Exclusion.' }
  ],
  'mutually-exclusive': [
    { type: 'TEXT', content: 'Mutually exclusive events cannot happen at the same time. Independent events can happen at the same time, but do not affect each other.' },
    { type: 'TIP', content: 'If A and B are mutually exclusive, P(A and B) = 0. If they are independent, P(A and B) = P(A)*P(B).' }
  ],
  'multiplication-rule': [
    { type: 'TEXT', content: 'The multiplication rule is used to find the probability of two events happening together (their intersection).' },
    { type: 'FORMULA', content: 'P(A \\cap B) = P(A|B) \\cdot P(B)', metadata: { 'P(A \\cap B)': 'Probability of A AND B', 'P(A|B)': 'Probability of A given that B has already occurred' } },
    { type: 'TIP', content: 'If the events are independent, P(A|B) is just P(A), making the formula P(A) * P(B)!' }
  ],
  'law-total-probability': [
    { type: 'TEXT', content: 'The Law of Total Probability allows you to find the overall probability of an event by breaking it down into conditional probabilities across mutually exclusive partitions.' },
    { type: 'FORMULA', content: 'P(A) = \\sum_{i=1}^{n} P(A|B_i)P(B_i)', metadata: { 'P(A)': 'Total probability of event A', 'B_i': 'Mutually exclusive events that partition the sample space', 'P(A|B_i)': 'Conditional probability of A given B_i' } },
    { type: 'TIP', content: 'Think of this as calculating a weighted average of probabilities.' }
  ],
  'tree-diagrams': [
    { type: 'TEXT', content: 'Tree diagrams map out all possible paths of sequential events. You multiply probabilities along a branch, and add probabilities across different branches.' },
    { type: 'TIP', content: 'Tree diagrams are just visual representations of the Multiplication Rule and the Law of Total Probability.' }
  ],
  'counting-principle': [
    { type: 'TEXT', content: 'If one event has m possible outcomes and a second event has n possible outcomes, there are m * n total combinations.' },
    { type: 'TIP', content: 'If you have 3 shirts and 4 pants, you have 12 outfits!' }
  ],
  'distinguishable-perms': [
    { type: 'TEXT', content: 'When calculating permutations where some items are identical (like the letters in \"MISSISSIPPI\"), you must divide out the duplicate arrangements.' },
    { type: 'FORMULA', content: '\\frac{n!}{n_1! n_2! \\dots n_k!}', metadata: { 'n!': 'Total factorial if all items were unique', 'n_i!': 'Factorial of the count of each identical subset' } },
    { type: 'TIP', content: 'For \"MISSISSIPPI\" (11 letters: 4 I, 4 S, 2 P), it would be 11! / (4! * 4! * 2!).' }
  ],

  // RANDOM VARIABLES SPECIFIC FORMULAS
  'pmf-cdf': [
    { type: 'TEXT', content: 'The Probability Mass Function (PMF) gives the probability that a discrete random variable is exactly equal to some value. The CDF gives the cumulative probability up to that value.' },
    { type: 'FORMULA', content: 'F_X(x) = P(X \\le x) = \\sum_{k \\le x} P(X = k)', metadata: { 'F_X(x)': 'Cumulative Distribution Function (CDF)', 'P(X \\le x)': 'Probability that X is less than or equal to x', '\\sum': 'Sum of all PMF probabilities up to x' } },
    { type: 'TIP', content: 'The CDF is always a non-decreasing step function for discrete variables!' }
  ],
  'expected-value-props': [ // Discrete EV
    { type: 'TEXT', content: 'The Expected Value (or Mean) of a discrete random variable is the probability-weighted average of all its possible values.' },
    { type: 'FORMULA', content: 'E[X] = \\mu = \\sum_{i} x_i P(X = x_i)', metadata: { 'E[X]': 'Expected Value', 'x_i': 'Each possible value', 'P(X = x_i)': 'The probability (PMF) of that value occurring' } },
    { type: 'TIP', content: 'If you play a game infinite times, your average payout will converge exactly to the expected value.' }
  ],
  'variance-props': [ // Discrete Variance
    { type: 'TEXT', content: 'The Variance measures the expected squared deviation of a discrete random variable from its mean.' },
    { type: 'FORMULA', content: 'Var(X) = E[(X - \\mu)^2] = \\sum_{i} (x_i - \\mu)^2 P(X = x_i)', metadata: { 'Var(X)': 'Variance', '(x_i - \\mu)^2': 'Squared distance from the mean', 'P(X = x_i)': 'Weighted by the probability' } },
    { type: 'FORMULA', content: 'Var(X) = E[X^2] - (E[X])^2', metadata: { 'E[X^2]': 'The expected value of the squared variable', '(E[X])^2': 'The squared expected value' } },
    { type: 'TIP', content: 'The second formula (E[X^2] - E[X]^2) is almost always much faster and easier to compute by hand!' }
  ],

  // CONTINUOUS RV FORMULAS
  'pdf-cdf-cont': [
    { type: 'TEXT', content: 'The Probability Density Function (PDF) defines the relative likelihood for a continuous random variable. Because there are infinite points, the probability of any single exact point is zero!' },
    { type: 'FORMULA', content: 'F_X(x) = \\int_{-\\infty}^{x} f_X(t) dt', metadata: { 'F_X(x)': 'Cumulative Distribution Function (CDF)', '\\int': 'Integral representing the area under the PDF curve', 'f_X(t)': 'The Probability Density Function (PDF)' } },
    { type: 'TIP', content: 'To get the PDF from a CDF, you simply take the derivative: f(x) = d/dx F(x).' }
  ],
  'integrals-prob': [
    { type: 'TEXT', content: 'To find the probability that a continuous variable falls within a certain range, you calculate the area under the PDF curve using an integral.' },
    { type: 'FORMULA', content: 'P(a \\le X \\le b) = \\int_{a}^{b} f_X(x) dx', metadata: { 'P(a \\le X \\le b)': 'Probability X is between a and b', '\\int_{a}^{b}': 'Definite integral from a to b', 'f_X(x)': 'The PDF' } },
    { type: 'TIP', content: 'Because the probability of an exact point is zero, P(a ≤ X ≤ b) is identical to P(a < X < b) for continuous variables.' }
  ],
  'exp-var-cont': [
    { type: 'TEXT', content: 'Expected Value and Variance for continuous variables mirror the discrete formulas, but sums are replaced with integrals.' },
    { type: 'FORMULA', content: 'E[X] = \\int_{-\\infty}^{\\infty} x f_X(x) dx', metadata: { 'E[X]': 'Expected Value (Continuous)', 'x': 'The value', 'f_X(x)': 'The PDF (analogous to the probability weight)' } },
    { type: 'FORMULA', content: 'Var(X) = \\int_{-\\infty}^{\\infty} (x - \\mu)^2 f_X(x) dx', metadata: { 'Var(X)': 'Variance (Continuous)', '(x - \\mu)^2': 'Squared deviation' } },
    { type: 'TIP', content: 'The shortcut formula Var(X) = E[X^2] - (E[X])^2 still works perfectly for continuous variables!' }
  ],

  // HYPOTHESIS TESTING
  'null-alt-hyp': [
    { type: 'TEXT', content: 'The Null Hypothesis (H0) assumes the status quo or \"no effect\". The Alternative Hypothesis (H1 or Ha) is what you are trying to prove.' },
    { type: 'TIP', content: 'We never \"accept\" the null hypothesis; we only \"fail to reject\" it. Absence of evidence is not evidence of absence!' }
  ],
  'type-errors': [
    { type: 'TEXT', content: 'A Type I error occurs if you reject a true null hypothesis (False Positive). A Type II error occurs if you fail to reject a false null hypothesis (False Negative).' },
    { type: 'FORMULA', content: '\\alpha = P(\\text{Type I Error})', metadata: { '\\alpha': 'Significance level (usually 0.05)' } },
    { type: 'FORMULA', content: '\\beta = P(\\text{Type II Error})', metadata: { '\\beta': 'Probability of a false negative' } },
    { type: 'TIP', content: 'There is an inherent tradeoff: decreasing the chance of a Type I error will increase the chance of a Type II error.' }
  ],
  'p-values': [
    { type: 'TEXT', content: 'The p-value is the probability of observing data at least as extreme as your sample, assuming the null hypothesis is completely true.' },
    { type: 'TIP', content: 'If p < alpha (e.g., p < 0.05), the data is too rare to happen by chance under H0, so we reject H0. \"If P is low, H0 must go!\"' }
  ],
  'test-power': [
    { type: 'TEXT', content: 'Statistical Power is the probability that the test correctly rejects a false null hypothesis (a True Positive).' },
    { type: 'FORMULA', content: '\\text{Power} = 1 - \\beta', metadata: { '\\text{Power}': 'Sensitivity or True Positive Rate', '\\beta': 'Type II error rate' } },
    { type: 'TIP', content: 'You can increase power by increasing your sample size, or by increasing your alpha level.' }
  ],
  'z-test-1': [
    { type: 'TEXT', content: 'Used to test if a sample mean differs from a population mean when the population variance is KNOWN.' },
    { type: 'FORMULA', content: 'Z = \\frac{\\bar{x} - \\mu_0}{\\frac{\\sigma}{\\sqrt{n}}}', metadata: { '\\bar{x}': 'Sample mean', '\\mu_0': 'Hypothesized population mean', '\\sigma / \\sqrt{n}': 'Standard error' } },
    { type: 'TIP', content: 'Z-tests are extremely rare in real life because we almost never know the true population standard deviation.' }
  ],
  't-test-1': [
    { type: 'TEXT', content: 'Used to test if a sample mean differs from a population mean when variance is UNKNOWN (we use sample standard deviation s instead).' },
    { type: 'FORMULA', content: 't = \\frac{\\bar{x} - \\mu_0}{\\frac{s}{\\sqrt{n}}}', metadata: { 't': 't-statistic (compare to t-distribution)', 's': 'Sample standard deviation' } },
    { type: 'TIP', content: 'Degrees of freedom for a one-sample t-test is n - 1.' }
  ],
  't-test-2': [
    { type: 'TEXT', content: 'Tests if there is a significant difference between the means of two independent groups.' },
    { type: 'FORMULA', content: 't = \\frac{\\bar{x}_1 - \\bar{x}_2}{\\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}}}', metadata: { '\\bar{x}_1 - \\bar{x}_2': 'Difference between sample means', '\\sqrt{\\dots}': 'Pooled or unpooled standard error depending on variance assumptions' } },
    { type: 'TIP', content: 'Welch\'s t-test is the safest version to use because it does not assume the two groups have equal variances.' }
  ],
  't-test-paired': [
    { type: 'TEXT', content: 'Tests the difference in means for two related groups (e.g., measuring the same patients before and after treatment).' },
    { type: 'TIP', content: 'Instead of two independent groups, you subtract the pairs to get a single column of differences, then run a ONE-sample t-test on those differences against zero!' }
  ],
  'z-test-prop': [
    { type: 'TEXT', content: 'Tests if a sample proportion differs from a hypothesized population proportion.' },
    { type: 'FORMULA', content: 'Z = \\frac{\\hat{p} - p_0}{\\sqrt{\\frac{p_0(1-p_0)}{n}}}', metadata: { '\\hat{p}': 'Sample proportion', 'p_0': 'Hypothesized proportion' } },
    { type: 'TIP', content: 'Used for A/B testing conversion rates on websites!' }
  ],
  'chi-gof': [
    { type: 'TEXT', content: 'Tests whether the observed frequencies of categorical data match an expected theoretical distribution.' },
    { type: 'FORMULA', content: '\\chi^2 = \\sum \\frac{(O_i - E_i)^2}{E_i}', metadata: { '\\chi^2': 'Chi-Square test statistic', 'O_i': 'Observed count for category i', 'E_i': 'Expected count for category i' } },
    { type: 'TIP', content: 'Degrees of freedom = k - 1, where k is the number of categories.' }
  ],
  'chi-indep': [
    { type: 'TEXT', content: 'Tests whether two categorical variables are independent of each other (using a contingency table).' },
    { type: 'TIP', content: 'Expected frequency = (Row Total * Column Total) / Grand Total. Degrees of freedom = (Rows - 1) * (Columns - 1).' }
  ],
  'chi-homo': [
    { type: 'TEXT', content: 'Tests whether different populations have the same distribution of a single categorical variable.' },
    { type: 'TIP', content: 'The math is exactly identical to the Chi-Square Test for Independence, only the experimental design is different.' }
  ],

  // REGRESSION & ANOVA
  'ols': [
    { type: 'TEXT', content: 'Ordinary Least Squares estimates the parameters of a linear regression model by minimizing the sum of the squared residuals.' },
    { type: 'FORMULA', content: '\\min \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2', metadata: { 'y_i': 'Actual observed value', '\\hat{y}_i': 'Predicted value on the line', '(y_i - \\hat{y}_i)^2': 'Squared residual (error)' } },
    { type: 'TIP', content: 'Squaring the errors prevents positive and negative errors from canceling out, and heavily penalizes massive outliers.' }
  ],
  'line-best-fit': [
    { type: 'TEXT', content: 'The linear equation representing the optimal OLS regression.' },
    { type: 'FORMULA', content: '\\hat{y} = b_0 + b_1 x', metadata: { '\\hat{y}': 'Predicted dependent variable', 'b_0': 'y-intercept', 'b_1': 'Slope coefficient' } },
    { type: 'FORMULA', content: 'b_1 = r \\frac{s_y}{s_x}', metadata: { 'b_1': 'Slope is the correlation (r) times the ratio of standard deviations' } },
    { type: 'TIP', content: 'The line of best fit ALWAYS passes exactly through the point of averages: (mean of X, mean of Y).' }
  ],
  'residuals': [
    { type: 'TEXT', content: 'A residual is the vertical distance between an actual data point and the predicted line.' },
    { type: 'FORMULA', content: 'e_i = y_i - \\hat{y}_i', metadata: { 'e_i': 'Residual error', 'y_i': 'Actual', '\\hat{y}_i': 'Predicted' } },
    { type: 'TIP', content: 'If the model is good, a plot of the residuals should look like completely random white noise with no discernible pattern.' }
  ],
  'r-squared': [
    { type: 'TEXT', content: 'R-squared (Coefficient of Determination) measures the proportion of variance in the dependent variable that is predictable from the independent variable.' },
    { type: 'FORMULA', content: 'R^2 = 1 - \\frac{SSR}{SST}', metadata: { 'R^2': 'R-squared (ranges from 0 to 1)', 'SSR': 'Sum of Squared Residuals (unexplained error)', 'SST': 'Total Sum of Squares (total variance in Y)' } },
    { type: 'TIP', content: 'An R^2 of 0.80 means that 80% of the variation in Y is explained by your regression model.' }
  ],
  'one-way-anova': [
    { type: 'TEXT', content: 'Analysis of Variance compares the means of three or more independent groups to see if at least one is significantly different.' },
    { type: 'FORMULA', content: 'F = \\frac{\\text{Variance Between Groups}}{\\text{Variance Within Groups}}', metadata: { 'F': 'The F-ratio test statistic', '\\text{Between}': 'Variance driven by the treatment/category', '\\text{Within}': 'Random noise/error variance inside the groups' } },
    { type: 'TIP', content: 'It is called Analysis of Variance, but it is actually used to test differences in MEANS.' }
  ],
  'f-dist': [
    { type: 'TEXT', content: 'The F-distribution is right-skewed and is used exclusively for ANOVA and testing equality of variances.' },
    { type: 'TIP', content: 'An F-statistic near 1.0 means the groups are virtually identical. A large F-statistic means there is a significant difference.' }
  ],
  'post-hoc': [
    { type: 'TEXT', content: 'If an ANOVA is significant, you know AT LEAST one group is different, but you don\'t know WHICH one. Post-Hoc tests (like Tukey\'s HSD) figure out exactly which pairs differ.' },
    { type: 'TIP', content: 'We don\'t just run multiple t-tests instead of ANOVA because running multiple tests inflates the Type I error rate (False Positives).' }
  ],
  'two-way-anova': [
    { type: 'TEXT', content: 'Two-Way ANOVA evaluates the effect of TWO categorical independent variables on a continuous dependent variable.' },
    { type: 'TIP', content: 'The most powerful feature of Two-Way ANOVA is testing for \"Interactions\" (e.g., does a drug work differently for men vs women?).' }
  ],

  // ML FOUNDATIONS
  'multiple-regression': [
    { type: 'TEXT', content: 'Extends simple linear regression to multiple independent variables (features).' },
    { type: 'FORMULA', content: '\\hat{y} = \\beta_0 + \\beta_1 x_1 + \\beta_2 x_2 + \\dots + \\beta_p x_p', metadata: { '\\beta_i': 'The weight or coefficient assigned to feature x_i' } },
    { type: 'TIP', content: 'In ML, we often represent this using vector algebra: y = W^T X + b' }
  ],
  'logistic-regression': [
    { type: 'TEXT', content: 'A classification algorithm used to predict binary outcomes (0 or 1). It outputs a probability.' },
    { type: 'FORMULA', content: 'P(y=1|X) = \\frac{1}{1 + e^{-(\\beta_0 + \\beta_1 x)}}', metadata: { 'P(y=1|X)': 'The probability that the outcome is class 1 given features X', 'e': 'Euler\'s number' } },
    { type: 'TIP', content: 'Despite having \"regression\" in its name, it is a CLASSIFICATION algorithm.' }
  ],
  'sigmoid-function': [
    { type: 'TEXT', content: 'The Sigmoid function squashes any real number down into a range strictly between 0 and 1, making it perfect for probabilities.' },
    { type: 'FORMULA', content: '\\sigma(z) = \\frac{1}{1 + e^{-z}}', metadata: { '\\sigma(z)': 'Sigmoid output (0 to 1)', 'z': 'The raw linear output (logit)' } },
    { type: 'TIP', content: 'This is the foundational activation function for neural networks.' }
  ],
  'cost-functions': [
    { type: 'TEXT', content: 'A cost function (or loss function) evaluates how wrong a machine learning model is. The goal of training is to minimize this cost.' },
    { type: 'FORMULA', content: 'J(\\theta) = -\\frac{1}{m}\\sum_{i=1}^{m} [y_i \\log(\\hat{y}_i) + (1-y_i)\\log(1-\\hat{y}_i)]', metadata: { 'J(\\theta)': 'Binary Cross-Entropy Cost Function', 'y_i': 'True label (0 or 1)', '\\hat{y}_i': 'Predicted probability' } },
    { type: 'TIP', content: 'MSE (Mean Squared Error) is used for Regression. Cross-Entropy is used for Classification.' }
  ],
  'confusion-matrix': [
    { type: 'TEXT', content: 'A table that evaluates classification model performance by tallying True Positives, False Positives, True Negatives, and False Negatives.' },
    { type: 'FORMULA', content: '\\text{Precision} = \\frac{TP}{TP + FP}', metadata: { '\\text{Precision}': 'Of all the positive predictions, how many were actually correct?' } },
    { type: 'FORMULA', content: '\\text{Recall} = \\frac{TP}{TP + FN}', metadata: { '\\text{Recall}': 'Of all the actual positives in the dataset, how many did we find? (Sensitivity)' } },
    { type: 'TIP', content: 'F1-Score is the harmonic mean of Precision and Recall.' }
  ],
  'roc-auc': [
    { type: 'TEXT', content: 'The Receiver Operating Characteristic curve plots the True Positive Rate against the False Positive Rate at various thresholds.' },
    { type: 'TIP', content: 'The Area Under the Curve (AUC) represents the probability that the model will rank a random positive example higher than a random negative one. An AUC of 1.0 is perfect; 0.5 is random guessing.' }
  ],
  'bias-variance': [
    { type: 'TEXT', content: 'The fundamental tradeoff in ML: Bias is error from overly simplistic models (Underfitting). Variance is error from overly complex models that memorize noise (Overfitting).' },
    { type: 'TIP', content: 'High Bias = Failing the training set. High Variance = Acing the training set, but failing the test set.' }
  ],
  'cross-validation': [
    { type: 'TEXT', content: 'K-Fold Cross-Validation splits the dataset into K chunks. The model trains on K-1 chunks and tests on the remaining chunk, rotating until all data has been used for testing.' },
    { type: 'TIP', content: 'This gives a much more robust estimate of true model performance than a single train/test split.' }
  ]
};

// Inject Phase 2 content
for (const topic of seedData.topics) {
  if (topic.chapters) {
    for (const chapter of topic.chapters) {
      if (chapter.concepts) {
        for (const concept of chapter.concepts) {
          if (phase2Content[concept.slug]) {
            concept.blocks = phase2Content[concept.slug];
          }
        }
      }
    }
  }
}

// Add Calculus Topic
const calculusTopic = {
  slug: "calculus-ml",
  name: "10. CALCULUS FOR ML (Derivatives)",
  type: "MAIN_TOPIC",
  chapters: [
    {
      slug: "derivatives-basics",
      name: "10.1 Derivative Rules",
      type: "CHAPTER",
      concepts: [
        {
          slug: "derivative-intuition",
          name: "The Derivative (Rate of Change)",
          type: "CONCEPT",
          articleTitle: "Derivatives Overview",
          blocks: [
            { type: 'TEXT', content: 'The derivative represents the instantaneous rate of change of a function. Geometrically, it is the slope of the tangent line at any given point.' },
            { type: 'FORMULA', content: 'f\'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}', metadata: { 'f\'(x)': 'The derivative of f with respect to x', '\\lim_{h \\to 0}': 'As the step size h approaches zero', '\\frac{\\dots}{h}': 'Rise over run' } },
            { type: 'TIP', content: 'In ML, the derivative tells us exactly which direction to adjust our parameters to decrease the error!' }
          ]
        },
        {
          slug: "power-rule",
          name: "Power Rule",
          type: "CONCEPT",
          articleTitle: "The Power Rule",
          blocks: [
            { type: 'TEXT', content: 'The most common shortcut for taking derivatives of polynomials.' },
            { type: 'FORMULA', content: '\\frac{d}{dx} (x^n) = n x^{n-1}', metadata: { '\\frac{d}{dx}': 'The derivative operator', 'n x^{n-1}': 'Bring the exponent down, and subtract 1 from the exponent' } },
            { type: 'TIP', content: 'For f(x) = x^2, the derivative is 2x. This is exactly why the derivative of Mean Squared Error ends up being linear!' }
          ]
        }
      ]
    },
    {
      slug: "advanced-calculus",
      name: "10.2 Multivariate & Chain Rule",
      type: "CHAPTER",
      concepts: [
        {
          slug: "chain-rule",
          name: "The Chain Rule",
          type: "CONCEPT",
          articleTitle: "The Chain Rule",
          blocks: [
            { type: 'TEXT', content: 'Used to take the derivative of composite functions (functions inside of functions).' },
            { type: 'FORMULA', content: '\\frac{d}{dx} f(g(x)) = f\'(g(x)) \\cdot g\'(x)', metadata: { 'f\'(g(x))': 'Derivative of the outside function, leaving inside alone', 'g\'(x)': 'Multiplied by the derivative of the inside function' } },
            { type: 'TIP', content: 'The Chain Rule is the absolute engine of Neural Networks. \"Backpropagation\" is literally just applying the Chain Rule over and over to find how much each weight contributed to the error.' }
          ]
        },
        {
          slug: "partial-derivatives",
          name: "Partial Derivatives",
          type: "CONCEPT",
          articleTitle: "Partial Derivatives",
          blocks: [
            { type: 'TEXT', content: 'When a function has multiple variables, a partial derivative measures the rate of change with respect to ONE variable, while pretending all other variables are constant.' },
            { type: 'FORMULA', content: '\\frac{\\partial f}{\\partial x_1}', metadata: { '\\partial': 'The partial derivative symbol (del)', 'x_1': 'The specific variable we are inspecting' } },
            { type: 'TIP', content: 'In ML, your cost function depends on thousands of weights. You take a partial derivative for EACH individual weight.' }
          ]
        },
        {
          slug: "gradients",
          name: "The Gradient Vector",
          type: "CONCEPT",
          articleTitle: "The Gradient",
          blocks: [
            { type: 'TEXT', content: 'The Gradient is simply a vector packing all the partial derivatives together. It points in the direction of the STEEPEST ASCENT of the function.' },
            { type: 'FORMULA', content: '\\nabla f = \\left[ \\frac{\\partial f}{\\partial x_1}, \\dots, \\frac{\\partial f}{\\partial x_n} \\right]^T', metadata: { '\\nabla f': 'Nabla (The Gradient Vector)', '\\frac{\\partial f}{\\partial x_i}': 'The partial derivative for dimension i' } },
            { type: 'TIP', content: 'Gradient Descent works by calculating the gradient, and then taking a step in the NEGATIVE direction to reach the minimum error!' }
          ]
        }
      ]
    }
  ]
};

seedData.topics.push(calculusTopic);

fs.writeFileSync(path, JSON.stringify(seedData, null, 2));
console.log(`Successfully generated Phase 2 and added Calculus Topic!`);
