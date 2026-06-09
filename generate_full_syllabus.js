const fs = require('fs');
const oldData = require('./src/data/seed_data.json');

// Helper to find blocks from existing data
function getBlocks(slug, placeholderTitle = '') {
  for (const topic of oldData.topics) {
    if (topic.chapters) {
      for (const chapter of topic.chapters) {
        if (chapter.concepts) {
          for (const concept of chapter.concepts) {
            if (concept.slug === slug) {
              return concept.blocks;
            }
          }
        }
      }
    }
  }
  // Return placeholder if not found
  return [
    { type: 'TEXT', content: `Educational content for ${placeholderTitle} is coming soon. Stay tuned for future app updates!` }
  ];
}

const newData = {
  topics: [
    {
      slug: "probability-foundations",
      name: "1. PROBABILITY (FOUNDATIONS)",
      type: "MAIN_TOPIC",
      chapters: [
        {
          slug: "basic-probability",
          name: "1.1 Basic Probability Concepts",
          type: "CHAPTER",
          concepts: [
            { slug: "set-theory", name: "Set Theory & Sample Spaces", type: "CONCEPT", articleTitle: "Sample Spaces", blocks: getBlocks("set-theory", "Set Theory") },
            { slug: "axioms-probability", name: "Axioms of Probability", type: "CONCEPT", articleTitle: "Probability Axioms", blocks: getBlocks("axioms-probability", "Axioms of Probability") },
            { slug: "venn-diagrams", name: "Venn Diagrams & Intersections", type: "CONCEPT", articleTitle: "Venn Diagrams", blocks: getBlocks("venn-diagrams", "Venn Diagrams") },
            { slug: "mutually-exclusive", name: "Mutually Exclusive vs Independent", type: "CONCEPT", articleTitle: "Exclusive vs Independent", blocks: getBlocks("mutually-exclusive", "Mutually Exclusive vs Independent") }
          ]
        },
        {
          slug: "conditional-probability",
          name: "1.2 Conditional Probability",
          type: "CHAPTER",
          concepts: [
            { slug: "multiplication-rule", name: "The Multiplication Rule", type: "CONCEPT", articleTitle: "Multiplication Rule", blocks: getBlocks("multiplication-rule", "Multiplication Rule") },
            { slug: "law-total-probability", name: "Law of Total Probability", type: "CONCEPT", articleTitle: "Total Probability", blocks: getBlocks("law-total-probability", "Total Probability") },
            { slug: "bayes", name: "Bayes' Theorem", type: "CONCEPT", articleTitle: "Conditional Probability", blocks: getBlocks("bayes", "Bayes' Theorem") },
            { slug: "tree-diagrams", name: "Tree Diagrams", type: "CONCEPT", articleTitle: "Tree Diagrams", blocks: getBlocks("tree-diagrams", "Tree Diagrams") }
          ]
        },
        {
          slug: "combinatorics-chapter",
          name: "1.3 Combinatorics",
          type: "CHAPTER",
          concepts: [
            { slug: "counting-principle", name: "Fundamental Counting Principle", type: "CONCEPT", articleTitle: "Counting Principle", blocks: getBlocks("counting-principle", "Counting Principle") },
            { slug: "combinatorics", name: "Permutations & Combinations", type: "CONCEPT", articleTitle: "Permutations & Combinations", blocks: getBlocks("combinatorics", "Combinatorics") },
            { slug: "distinguishable-perms", name: "Distinguishable Permutations", type: "CONCEPT", articleTitle: "Anagrams", blocks: getBlocks("distinguishable-perms", "Distinguishable Permutations") }
          ]
        }
      ]
    },
    {
      slug: "discrete-distributions",
      name: "2. DISCRETE DISTRIBUTIONS",
      type: "MAIN_TOPIC",
      chapters: [
        {
          slug: "random-variables-discrete",
          name: "2.1 Random Variables (Discrete)",
          type: "CHAPTER",
          concepts: [
            { slug: "random-variable", name: "Random Variable (X)", type: "CONCEPT", articleTitle: "Random Variables", blocks: getBlocks("random-variable", "Random Variables") },
            { slug: "pmf-cdf", name: "PMF & CDF", type: "CONCEPT", articleTitle: "PMF and CDF", blocks: getBlocks("pmf-cdf", "PMF & CDF") },
            { slug: "expected-value-props", name: "Expected Value", type: "CONCEPT", articleTitle: "Expected Value", blocks: getBlocks("expected-value-props", "Expected Value") },
            { slug: "variance-props", name: "Variance", type: "CONCEPT", articleTitle: "Variance", blocks: getBlocks("variance-props", "Variance") }
          ]
        },
        {
          slug: "core-discrete-models",
          name: "2.2 Core Discrete Models",
          type: "CHAPTER",
          concepts: [
            { slug: "bernoulli", name: "Bernoulli Trials", type: "CONCEPT", articleTitle: "Bernoulli Trials", blocks: getBlocks("bernoulli", "Bernoulli Trials") },
            { slug: "binomial-dist", name: "Binomial Distribution", type: "CONCEPT", articleTitle: "Binomial Distribution", blocks: getBlocks("binomial-dist", "Binomial Distribution") },
            { slug: "geometric-dist", name: "Geometric Distribution", type: "CONCEPT", articleTitle: "Geometric Distribution", blocks: getBlocks("geometric-dist", "Geometric Distribution") },
            { slug: "poisson-dist", name: "Poisson Distribution", type: "CONCEPT", articleTitle: "Poisson Distribution", blocks: getBlocks("poisson-dist", "Poisson Distribution") },
            { slug: "hypergeometric", name: "Hypergeometric Distribution", type: "CONCEPT", articleTitle: "Hypergeometric Distribution", blocks: getBlocks("hypergeometric", "Hypergeometric Distribution") },
            { slug: "negative-binomial", name: "Negative Binomial Distribution", type: "CONCEPT", articleTitle: "Negative Binomial", blocks: getBlocks("negative-binomial", "Negative Binomial") }
          ]
        }
      ]
    },
    {
      slug: "continuous-distributions",
      name: "3. CONTINUOUS DISTRIBUTIONS",
      type: "MAIN_TOPIC",
      chapters: [
        {
          slug: "random-variables-continuous",
          name: "3.1 Random Variables (Continuous)",
          type: "CHAPTER",
          concepts: [
            { slug: "pdf-cdf-cont", name: "PDF and CDF", type: "CONCEPT", articleTitle: "Continuous PDF & CDF", blocks: getBlocks("pdf-cdf-cont", "Continuous PDFs") },
            { slug: "integrals-prob", name: "Probabilities with Integrals", type: "CONCEPT", articleTitle: "Integrals for Probabilities", blocks: getBlocks("integrals-prob", "Integrals") },
            { slug: "exp-var-cont", name: "Expected Value & Variance", type: "CONCEPT", articleTitle: "Expectation (Continuous)", blocks: getBlocks("exp-var-cont", "Continuous Expected Value") }
          ]
        },
        {
          slug: "core-continuous-models",
          name: "3.2 Core Continuous Models",
          type: "CHAPTER",
          concepts: [
            { slug: "uniform-dist", name: "Continuous Uniform", type: "CONCEPT", articleTitle: "Uniform Distribution", blocks: getBlocks("uniform-dist", "Uniform Distribution") },
            { slug: "normal-dist", name: "Normal Distribution (Bell Curve)", type: "CONCEPT", articleTitle: "Normal Distribution", blocks: getBlocks("normal-dist", "Normal Distribution") },
            { slug: "standard-normal", name: "Standard Normal (Z)", type: "CONCEPT", articleTitle: "Standard Normal", blocks: getBlocks("standard-normal", "Standard Normal") },
            { slug: "exponential-dist", name: "Exponential Distribution", type: "CONCEPT", articleTitle: "Exponential Distribution", blocks: getBlocks("exponential-dist", "Exponential Distribution") },
            { slug: "gamma-dist", name: "Gamma Distribution", type: "CONCEPT", articleTitle: "Gamma Distribution", blocks: getBlocks("gamma-dist", "Gamma Distribution") },
            { slug: "beta-dist", name: "Beta Distribution", type: "CONCEPT", articleTitle: "Beta Distribution", blocks: getBlocks("beta-dist", "Beta Distribution") }
          ]
        }
      ]
    },
    {
      slug: "joint-multivariate",
      name: "4. JOINT DISTRIBUTIONS & MULTIVARIATE",
      type: "MAIN_TOPIC",
      chapters: [
        {
          slug: "multiple-rvs",
          name: "4.1 Multiple Random Variables",
          type: "CHAPTER",
          concepts: [
            { slug: "joint-pmf-pdf", name: "Joint PMFs and PDFs", type: "CONCEPT", articleTitle: "Joint Distributions", blocks: getBlocks("joint-pmf-pdf", "Joint Distributions") },
            { slug: "marginal-dist", name: "Marginal Distributions", type: "CONCEPT", articleTitle: "Marginal Distributions", blocks: getBlocks("marginal-dist", "Marginal Distributions") },
            { slug: "conditional-dist", name: "Conditional Distributions", type: "CONCEPT", articleTitle: "Conditional Distributions", blocks: getBlocks("conditional-dist", "Conditional Distributions") }
          ]
        },
        {
          slug: "relationships-variables",
          name: "4.2 Relationships Between Variables",
          type: "CHAPTER",
          concepts: [
            { slug: "covariance", name: "Covariance", type: "CONCEPT", articleTitle: "Covariance", blocks: getBlocks("covariance", "Covariance") },
            { slug: "correlation", name: "Pearson Correlation", type: "CONCEPT", articleTitle: "Correlation Coefficient", blocks: getBlocks("correlation", "Pearson Correlation") },
            { slug: "independence-rvs", name: "Independence of RVs", type: "CONCEPT", articleTitle: "Independent Random Variables", blocks: getBlocks("independence-rvs", "Independence of RVs") },
            { slug: "linear-combos", name: "Linear Combinations", type: "CONCEPT", articleTitle: "Linear Combinations of RVs", blocks: getBlocks("linear-combos", "Linear Combinations") }
          ]
        }
      ]
    },
    {
      slug: "descriptive-statistics",
      name: "5. DESCRIPTIVE STATISTICS",
      type: "MAIN_TOPIC",
      chapters: [
        {
          slug: "central-tendency",
          name: "5.1 Measures of Central Tendency",
          type: "CHAPTER",
          concepts: [
            { slug: "mean", name: "Population vs Sample Mean", type: "CONCEPT", articleTitle: "Mean", blocks: getBlocks("mean", "Mean") },
            { slug: "median-mode", name: "Median and Mode", type: "CONCEPT", articleTitle: "Median & Mode", blocks: getBlocks("median-mode", "Median and Mode") },
            { slug: "weighted-mean", name: "Weighted Mean", type: "CONCEPT", articleTitle: "Weighted Mean", blocks: getBlocks("weighted-mean", "Weighted Mean") }
          ]
        },
        {
          slug: "dispersion",
          name: "5.2 Measures of Dispersion",
          type: "CHAPTER",
          concepts: [
            { slug: "range-iqr", name: "Range and IQR", type: "CONCEPT", articleTitle: "Range & IQR", blocks: getBlocks("range-iqr", "Range and IQR") },
            { slug: "variance", name: "Variance (Pop. vs Sample)", type: "CONCEPT", articleTitle: "Variance", blocks: getBlocks("variance", "Variance") },
            { slug: "std-deviation", name: "Standard Deviation", type: "CONCEPT", articleTitle: "Standard Deviation", blocks: getBlocks("std-deviation", "Standard Deviation") },
            { slug: "coeff-variation", name: "Coefficient of Variation", type: "CONCEPT", articleTitle: "Coefficient of Variation", blocks: getBlocks("coeff-variation", "Coefficient of Variation") }
          ]
        },
        {
          slug: "shape-position",
          name: "5.3 Shape and Position",
          type: "CHAPTER",
          concepts: [
            { slug: "percentiles", name: "Percentiles & Quartiles", type: "CONCEPT", articleTitle: "Percentiles", blocks: getBlocks("percentiles", "Percentiles") },
            { slug: "z-scores", name: "Z-Scores", type: "CONCEPT", articleTitle: "Standardized Values", blocks: getBlocks("z-scores", "Z-Scores") },
            { slug: "skewness", name: "Skewness", type: "CONCEPT", articleTitle: "Skewness", blocks: getBlocks("skewness", "Skewness") },
            { slug: "kurtosis", name: "Kurtosis", type: "CONCEPT", articleTitle: "Kurtosis", blocks: getBlocks("kurtosis", "Kurtosis") },
            { slug: "box-plots", name: "Box-and-Whisker Plots", type: "CONCEPT", articleTitle: "Box Plots", blocks: getBlocks("box-plots", "Box Plots") }
          ]
        }
      ]
    },
    {
      slug: "sampling-estimation",
      name: "6. SAMPLING & ESTIMATION",
      type: "MAIN_TOPIC",
      chapters: [
        {
          slug: "sampling-theory",
          name: "6.1 Sampling Theory",
          type: "CHAPTER",
          concepts: [
            { slug: "srs", name: "Simple Random Sampling", type: "CONCEPT", articleTitle: "Simple Random Sampling", blocks: getBlocks("srs", "Simple Random Sampling") },
            { slug: "lln", name: "Law of Large Numbers", type: "CONCEPT", articleTitle: "Law of Large Numbers", blocks: getBlocks("lln", "Law of Large Numbers") },
            { slug: "clt", name: "Central Limit Theorem", type: "CONCEPT", articleTitle: "Central Limit Theorem", blocks: getBlocks("clt", "Central Limit Theorem") },
            { slug: "standard-error", name: "Standard Error of the Mean", type: "CONCEPT", articleTitle: "Standard Error", blocks: getBlocks("standard-error", "Standard Error") }
          ]
        },
        {
          slug: "estimation",
          name: "6.2 Point and Interval Estimation",
          type: "CHAPTER",
          concepts: [
            { slug: "mle", name: "Maximum Likelihood Estimation", type: "CONCEPT", articleTitle: "MLE", blocks: getBlocks("mle", "MLE") },
            { slug: "moments", name: "Method of Moments", type: "CONCEPT", articleTitle: "Method of Moments", blocks: getBlocks("moments", "Method of Moments") },
            { slug: "ci-z", name: "Confidence Intervals (Z)", type: "CONCEPT", articleTitle: "Z-Intervals", blocks: getBlocks("ci-z", "Z-Intervals") },
            { slug: "ci-t", name: "Confidence Intervals (T)", type: "CONCEPT", articleTitle: "T-Intervals", blocks: getBlocks("ci-t", "T-Intervals") },
            { slug: "ci-props", name: "Confidence Intervals for Proportions", type: "CONCEPT", articleTitle: "Proportion CI", blocks: getBlocks("ci-props", "Proportion CI") },
            { slug: "ci-var", name: "Confidence Intervals for Variance", type: "CONCEPT", articleTitle: "Variance CI", blocks: getBlocks("ci-var", "Variance CI") }
          ]
        }
      ]
    },
    {
      slug: "hypothesis-testing",
      name: "7. HYPOTHESIS TESTING",
      type: "MAIN_TOPIC",
      chapters: [
        {
          slug: "testing-fundamentals",
          name: "7.1 Testing Fundamentals",
          type: "CHAPTER",
          concepts: [
            { slug: "null-alt-hyp", name: "Null vs Alternative", type: "CONCEPT", articleTitle: "Hypotheses", blocks: getBlocks("null-alt-hyp", "Hypotheses") },
            { slug: "type-errors", name: "Type I and Type II Errors", type: "CONCEPT", articleTitle: "Errors in Testing", blocks: getBlocks("type-errors", "Type I and II Errors") },
            { slug: "p-values", name: "P-Values and Significance", type: "CONCEPT", articleTitle: "P-Values", blocks: getBlocks("p-values", "P-Values") },
            { slug: "test-power", name: "Power of a Statistical Test", type: "CONCEPT", articleTitle: "Statistical Power", blocks: getBlocks("test-power", "Statistical Power") }
          ]
        },
        {
          slug: "sample-tests",
          name: "7.2 One and Two-Sample Tests",
          type: "CHAPTER",
          concepts: [
            { slug: "z-test-1", name: "One-Sample Z-Test", type: "CONCEPT", articleTitle: "One-Sample Z-Test", blocks: getBlocks("z-test-1", "Z-Test") },
            { slug: "t-test-1", name: "One-Sample T-Test", type: "CONCEPT", articleTitle: "One-Sample T-Test", blocks: getBlocks("t-test-1", "T-Test") },
            { slug: "t-test-2", name: "Two-Sample T-Test", type: "CONCEPT", articleTitle: "Two-Sample T-Test", blocks: getBlocks("t-test-2", "Two-Sample T-Test") },
            { slug: "t-test-paired", name: "Paired T-Test", type: "CONCEPT", articleTitle: "Paired T-Test", blocks: getBlocks("t-test-paired", "Paired T-Test") },
            { slug: "z-test-prop", name: "Z-Test for Proportions", type: "CONCEPT", articleTitle: "Proportion Z-Test", blocks: getBlocks("z-test-prop", "Proportion Z-Test") }
          ]
        },
        {
          slug: "categorical-tests",
          name: "7.3 Categorical Tests",
          type: "CHAPTER",
          concepts: [
            { slug: "chi-gof", name: "Chi-Square Goodness of Fit", type: "CONCEPT", articleTitle: "Goodness of Fit", blocks: getBlocks("chi-gof", "Chi-Square Goodness of Fit") },
            { slug: "chi-indep", name: "Chi-Square Independence", type: "CONCEPT", articleTitle: "Independence Test", blocks: getBlocks("chi-indep", "Chi-Square Independence") },
            { slug: "chi-homo", name: "Chi-Square Homogeneity", type: "CONCEPT", articleTitle: "Homogeneity Test", blocks: getBlocks("chi-homo", "Chi-Square Homogeneity") }
          ]
        }
      ]
    },
    {
      slug: "regression-anova",
      name: "8. REGRESSION & ANOVA",
      type: "MAIN_TOPIC",
      chapters: [
        {
          slug: "linear-regression",
          name: "8.1 Linear Regression",
          type: "CHAPTER",
          concepts: [
            { slug: "ols", name: "Ordinary Least Squares", type: "CONCEPT", articleTitle: "OLS", blocks: getBlocks("ols", "OLS") },
            { slug: "line-best-fit", name: "Line of Best Fit", type: "CONCEPT", articleTitle: "Best Fit Line", blocks: getBlocks("line-best-fit", "Line of Best Fit") },
            { slug: "residuals", name: "Residuals & Sum of Squares", type: "CONCEPT", articleTitle: "Residuals", blocks: getBlocks("residuals", "Residuals") },
            { slug: "r-squared", name: "R-squared", type: "CONCEPT", articleTitle: "Coefficient of Determination", blocks: getBlocks("r-squared", "R-squared") }
          ]
        },
        {
          slug: "anova",
          name: "8.2 Analysis of Variance",
          type: "CHAPTER",
          concepts: [
            { slug: "one-way-anova", name: "One-Way ANOVA", type: "CONCEPT", articleTitle: "One-Way ANOVA", blocks: getBlocks("one-way-anova", "One-Way ANOVA") },
            { slug: "f-dist", name: "F-Distribution", type: "CONCEPT", articleTitle: "F-Distribution", blocks: getBlocks("f-dist", "F-Distribution") },
            { slug: "post-hoc", name: "Post-Hoc Testing (Tukey)", type: "CONCEPT", articleTitle: "Post-Hoc Tests", blocks: getBlocks("post-hoc", "Post-Hoc Tests") },
            { slug: "two-way-anova", name: "Two-Way ANOVA", type: "CONCEPT", articleTitle: "Two-Way ANOVA", blocks: getBlocks("two-way-anova", "Two-Way ANOVA") }
          ]
        }
      ]
    },
    {
      slug: "ml-foundations",
      name: "9. STATISTICAL FOUNDATIONS FOR MACHINE LEARNING",
      type: "MAIN_TOPIC",
      chapters: [
        {
          slug: "predictive-modeling",
          name: "9.1 Predictive Modeling Basics",
          type: "CHAPTER",
          concepts: [
            { slug: "multiple-regression", name: "Multiple Linear Regression", type: "CONCEPT", articleTitle: "Multiple Regression", blocks: getBlocks("multiple-regression", "Multiple Regression") },
            { slug: "logistic-regression", name: "Logistic Regression", type: "CONCEPT", articleTitle: "Logistic Regression", blocks: getBlocks("logistic-regression", "Logistic Regression") },
            { slug: "sigmoid-function", name: "The Sigmoid Function", type: "CONCEPT", articleTitle: "Sigmoid Function", blocks: getBlocks("sigmoid-function", "Sigmoid Function") },
            { slug: "cost-functions", name: "Cost Functions", type: "CONCEPT", articleTitle: "MSE & Cross-Entropy", blocks: getBlocks("cost-functions", "Cost Functions") }
          ]
        },
        {
          slug: "model-evaluation",
          name: "9.2 Model Evaluation",
          type: "CHAPTER",
          concepts: [
            { slug: "confusion-matrix", name: "Confusion Matrix", type: "CONCEPT", articleTitle: "Accuracy, Precision, Recall", blocks: getBlocks("confusion-matrix", "Confusion Matrix") },
            { slug: "roc-auc", name: "ROC & AUC", type: "CONCEPT", articleTitle: "ROC Curves", blocks: getBlocks("roc-auc", "ROC and AUC") },
            { slug: "bias-variance", name: "Bias-Variance Tradeoff", type: "CONCEPT", articleTitle: "Bias vs Variance", blocks: getBlocks("bias-variance", "Bias-Variance Tradeoff") },
            { slug: "cross-validation", name: "Cross-Validation", type: "CONCEPT", articleTitle: "K-Fold CV", blocks: getBlocks("cross-validation", "Cross-Validation") }
          ]
        }
      ]
    }
  ]
};

fs.writeFileSync('./src/data/seed_data.json', JSON.stringify(newData, null, 2));
console.log("Successfully generated massive 9-topic syllabus in seed_data.json!");
