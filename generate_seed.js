const fs = require('fs');

try {
  const oldFormulas = JSON.parse(fs.readFileSync('./src/data/formulas.json', 'utf8'));

  const seed = {
    topics: [
      {
        slug: 'probability',
        name: 'PROBABILITY & DISTRIBUTIONS',
        type: 'MAIN_TOPIC',
        chapters: [
          {
            slug: 'common-formulas',
            name: '0. Common Formulas',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'mean', name: 'Mean (Expected Value)', type: 'CONCEPT', articleTitle: 'Population and Sample Mean',
                blocks: [
                  { type: 'TEXT', content: 'The mean represents the mathematical average of a set of numbers.' },
                  { type: 'FORMULA', content: oldFormulas.mean_population.latex, metadata: oldFormulas.mean_population.tokens },
                  { type: 'FORMULA', content: oldFormulas.mean_sample.latex, metadata: oldFormulas.mean_sample.tokens },
                  { type: 'TIP', content: 'The population mean divides by N, while the sample mean divides by n.' }
                ]
              },
              {
                slug: 'variance', name: 'Variance & Std Dev', type: 'CONCEPT', articleTitle: 'Measuring Spread',
                blocks: [
                  { type: 'TEXT', content: 'Variance measures how far a set of numbers is spread out from their average value. Standard deviation is its square root.' },
                  { type: 'FORMULA', content: oldFormulas.variance_population.latex, metadata: oldFormulas.variance_population.tokens },
                  { type: 'FORMULA', content: oldFormulas.variance_sample.latex, metadata: oldFormulas.variance_sample.tokens },
                  { type: 'FORMULA', content: oldFormulas.std_deviation.latex, metadata: oldFormulas.std_deviation.tokens },
                  { type: 'TIP', content: 'Sample variance uses (n-1) to correct for bias when estimating the population variance!' }
                ]
              },
              {
                slug: 'bayes', name: 'Bayes Theorem', type: 'CONCEPT', articleTitle: 'Conditional Probability',
                blocks: [
                  { type: 'TEXT', content: 'Bayes theorem describes the probability of an event based on prior knowledge of conditions that might be related to the event.' },
                  { type: 'FORMULA', content: oldFormulas.bayes_theorem.latex, metadata: oldFormulas.bayes_theorem.tokens },
                  { type: 'TIP', content: 'It allows us to update our beliefs (probabilities) as new evidence arrives.' }
                ]
              },
              {
                slug: 'combinatorics', name: 'Combinatorics', type: 'CONCEPT', articleTitle: 'Permutations & Combinations',
                blocks: [
                  { type: 'TEXT', content: 'Combinatorics is the study of counting. Permutations count arrangements where order matters, while combinations count selections where order does not matter.' },
                  { type: 'FORMULA', content: oldFormulas.permutations.latex, metadata: oldFormulas.permutations.tokens },
                  { type: 'FORMULA', content: oldFormulas.combinations.latex, metadata: oldFormulas.combinations.tokens },
                  { type: 'TIP', content: "Think of permutations like a password (order matters), and combinations like a fruit salad (order doesn't matter)!" }
                ]
              }
            ]
          },
          {
            slug: 'discrete-dist',
            name: '1. Discrete Dist.',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'binomial-dist', name: 'Binomial Dist.', type: 'CONCEPT', articleTitle: 'Understanding the Binomial Distribution',
                blocks: [
                  { type: 'TEXT', content: 'The Binomial distribution represents the number of successes in a sequence of n independent experiments.' },
                  { type: 'FORMULA', content: oldFormulas.binomial.latex, metadata: oldFormulas.binomial.tokens },
                  { type: 'TIP', content: 'Remember that trials must be independent and the probability of success must be constant!' }
                ]
              },
              {
                slug: 'poisson-dist', name: 'Poisson Dist.', type: 'CONCEPT', articleTitle: 'Introduction to Poisson Distribution',
                blocks: [
                  { type: 'TEXT', content: 'The Poisson distribution expresses the probability of a given number of events occurring in a fixed interval of time or space.' },
                  { type: 'FORMULA', content: oldFormulas.poisson.latex, metadata: oldFormulas.poisson.tokens },
                  { type: 'TIP', content: 'Use Poisson when events happen independently at a constant average rate!' }
                ]
              },
              {
                slug: 'geometric-dist', name: 'Geometric Dist.', type: 'CONCEPT', articleTitle: 'The Geometric Distribution',
                blocks: [
                  { type: 'TEXT', content: 'The Geometric distribution represents the number of trials needed to get the first success in repeated independent Bernoulli trials.' },
                  { type: 'FORMULA', content: oldFormulas.geometric.latex, metadata: oldFormulas.geometric.tokens },
                  { type: 'TIP', content: 'It is the only discrete memoryless random distribution!' }
                ]
              }
            ]
          },
          {
            slug: 'continuous-dist',
            name: '2. Continuous Dist.',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'normal-dist', name: 'Normal Dist.', type: 'CONCEPT', articleTitle: 'The Bell Curve (Normal Distribution)',
                blocks: [
                  { type: 'TEXT', content: 'The Normal distribution is a continuous probability distribution that is symmetrical around its mean, showing that data near the mean are more frequent.' },
                  { type: 'FORMULA', content: oldFormulas.normal.latex, metadata: oldFormulas.normal.tokens },
                  { type: 'TIP', content: 'In a normal distribution, roughly 68% of the data falls within one standard deviation of the mean.' }
                ]
              },
              {
                slug: 'exponential-dist', name: 'Exponential Dist.', type: 'CONCEPT', articleTitle: 'Exponential Distribution',
                blocks: [
                  { type: 'TEXT', content: 'The Exponential distribution describes the time between events in a Poisson point process (e.g., waiting times).' },
                  { type: 'FORMULA', content: oldFormulas.exponential.latex, metadata: oldFormulas.exponential.tokens },
                  { type: 'TIP', content: 'It is the continuous analogue of the geometric distribution, and it is also memoryless.' }
                ]
              },
              {
                slug: 'uniform-dist', name: 'Uniform Dist.', type: 'CONCEPT', articleTitle: 'Continuous Uniform Distribution',
                blocks: [
                  { type: 'TEXT', content: 'The Uniform distribution describes an experiment where there is an arbitrary outcome that lies between certain bounds. All intervals of the same length have equal probability.' },
                  { type: 'FORMULA', content: oldFormulas.uniform.latex, metadata: oldFormulas.uniform.tokens },
                  { type: 'TIP', content: 'Think of it as a completely fair random number generator between two limits.' }
                ]
              }
            ]
          }
        ]
      },
      {
        slug: 'descriptive-stats',
        name: 'DESCRIPTIVE STATISTICS',
        type: 'MAIN_TOPIC',
        chapters: [
          {
            slug: 'central-tendency-dispersion',
            name: '1. Central Tendency & Spread',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'median-mode',
                name: 'Median & Mode',
                type: 'CONCEPT',
                articleTitle: 'Alternatives to the Mean',
                blocks: [
                  { type: 'TEXT', content: 'The median is the middle value when a dataset is ordered, making it robust against outliers. The mode is the most frequently occurring value.' },
                  { type: 'FORMULA', content: 'Median = \\left( \\frac{n + 1}{2} \\right)^{th} \\text{term}', metadata: { 'Median': 'The middle value', 'n': 'Total number of items in the ordered dataset' } },
                  { type: 'TIP', content: 'Use the median instead of the mean when your data is highly skewed (like income brackets)!' }
                ]
              },
              {
                slug: 'iqr',
                name: 'Interquartile Range (IQR)',
                type: 'CONCEPT',
                articleTitle: 'Measuring the Middle 50%',
                blocks: [
                  { type: 'TEXT', content: 'The IQR measures statistical dispersion by finding the difference between the 75th and 25th percentiles of the data. It forms the basis of the box plot.' },
                  { type: 'FORMULA', content: 'IQR = Q_3 - Q_1', metadata: { 'IQR': 'Interquartile Range (spread of the middle 50%)', 'Q_3': '75th percentile (Upper quartile)', 'Q_1': '25th percentile (Lower quartile)' } },
                  { type: 'TIP', content: 'Any data point falling below Q1 - 1.5*IQR or above Q3 + 1.5*IQR is typically considered an outlier.' }
                ]
              }
            ]
          },
          {
            slug: 'shape-distribution',
            name: '2. Shape of the Distribution',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'skewness',
                name: 'Skewness',
                type: 'CONCEPT',
                articleTitle: 'Asymmetry in Data',
                blocks: [
                  { type: 'TEXT', content: 'Skewness is a measure of the asymmetry of the probability distribution. A negative skew means the tail is on the left; a positive skew means the tail is on the right.' },
                  { type: 'FORMULA', content: 'Skewness = \\frac{\\sum_{i=1}^{n} (x_i - \\bar{x})^3}{(n-1)s^3}', metadata: { '\\sum_{i=1}^{n} (x_i - \\bar{x})^3': 'Sum of cubed differences from the mean (third moment)', 's^3': 'Cube of the sample standard deviation', 'n-1': 'Degrees of freedom' } },
                  { type: 'TIP', content: 'If mean > median, the data is usually positively skewed (skewed right).' }
                ]
              }
            ]
          }
        ]
      },
      {
        slug: 'advanced-probability',
        name: 'ADVANCED PROBABILITY',
        type: 'MAIN_TOPIC',
        chapters: [
          {
            slug: 'joint-distributions',
            name: '3. Joint Distributions',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'covariance',
                name: 'Covariance',
                type: 'CONCEPT',
                articleTitle: 'Measuring Joint Variability',
                blocks: [
                  { type: 'TEXT', content: 'Covariance measures the directional relationship between two random variables. A positive covariance means they tend to move together; negative means they move inversely.' },
                  { type: 'FORMULA', content: 'Cov(X,Y) = E[(X - E[X])(Y - E[Y])]', metadata: { 'Cov(X,Y)': 'Covariance of X and Y', 'E[X]': 'Expected value (mean) of X', 'E[Y]': 'Expected value (mean) of Y' } },
                  { type: 'TIP', content: 'Covariance gives direction, but not strength. For strength, you need to normalize it into Correlation!' }
                ]
              },
              {
                slug: 'correlation',
                name: 'Pearson Correlation',
                type: 'CONCEPT',
                articleTitle: 'Standardized Covariance',
                blocks: [
                  { type: 'TEXT', content: 'The Pearson correlation coefficient is the covariance of the two variables divided by the product of their standard deviations. It always falls between -1 and 1.' },
                  { type: 'FORMULA', content: '\\rho_{X,Y} = \\frac{Cov(X,Y)}{\\sigma_X \\sigma_Y}', metadata: { '\\rho_{X,Y}': 'Pearson Correlation Coefficient', 'Cov(X,Y)': 'Covariance between X and Y', '\\sigma_X': 'Standard deviation of X', '\\sigma_Y': 'Standard deviation of Y' } },
                  { type: 'TIP', content: 'Correlation does not imply causation! It only measures linear relationships.' }
                ]
              }
            ]
          },
          {
            slug: 'limit-theorems',
            name: '4. Limit Theorems',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'law-of-large-numbers',
                name: 'Law of Large Numbers',
                type: 'CONCEPT',
                articleTitle: 'Convergence of the Mean',
                blocks: [
                  { type: 'TEXT', content: 'The Law of Large Numbers (LLN) states that as a sample size grows, its mean gets closer to the average of the whole population.' },
                  { type: 'FORMULA', content: '\\lim_{n \\to \\infty} P(|\\bar{X}_n - \\mu| > \\epsilon) = 0', metadata: { '\\bar{X}_n': 'Sample mean of size n', '\\mu': 'True population mean', '\\epsilon': 'An arbitrarily small positive distance' } },
                  { type: 'TIP', content: 'This is why casinos always win in the long run, even if a player wins a few hands in the short term.' }
                ]
              },
              {
                slug: 'central-limit-theorem',
                name: 'Central Limit Theorem (CLT)',
                type: 'CONCEPT',
                articleTitle: 'The Most Important Theorem in Stats',
                blocks: [
                  { type: 'TEXT', content: 'The CLT states that the sampling distribution of the sample mean approaches a normal distribution as the sample size gets larger, no matter what the shape of the population distribution is.' },
                  { type: 'FORMULA', content: '\\bar{X} \\sim N\\left(\\mu, \\frac{\\sigma^2}{n}\\right)', metadata: { '\\bar{X}': 'Distribution of the sample mean', 'N': 'Normal Distribution', '\\mu': 'Population mean', '\\frac{\\sigma^2}{n}': 'Variance of the sample mean (Standard Error squared)' } },
                  { type: 'TIP', content: 'Usually, a sample size of n >= 30 is considered sufficient for the CLT to kick in.' }
                ]
              }
            ]
          }
        ]
      },
      {
        slug: 'hypothesis-testing-advanced',
        name: 'ADVANCED HYPOTHESIS TESTING',
        type: 'MAIN_TOPIC',
        chapters: [
          {
            slug: 'z-tests',
            name: '4.5 Z-Tests',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'one-sample-z-test',
                name: 'One-Sample Z-Test',
                type: 'CONCEPT',
                articleTitle: 'Testing a Population Mean',
                blocks: [
                  { type: 'TEXT', content: 'The Z-test determines whether the mean of a sample is significantly different from a known population mean when the population variance is known.' },
                  { type: 'FORMULA', content: 'Z = \\frac{\\bar{x} - \\mu_0}{\\sigma / \\sqrt{n}}', metadata: { 'Z': 'Test statistic', '\\bar{x}': 'Sample mean', '\\mu_0': 'Hypothesized population mean', '\\sigma / \\sqrt{n}': 'Standard error of the mean' } },
                  { type: 'TIP', content: 'Use the Z-test only if you know the population standard deviation or your sample size is very large (n > 30).' }
                ]
              }
            ]
          },
          {
            slug: 't-tests',
            name: '5. T-Tests',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'students-t-dist',
                name: "Student's t-Distribution",
                type: 'CONCEPT',
                articleTitle: 'Testing with Small Samples',
                blocks: [
                  { type: 'TEXT', content: 'The t-distribution is similar to the normal distribution but has heavier tails. It is used when the sample size is small and the population standard deviation is unknown.' },
                  { type: 'FORMULA', content: 't = \\frac{\\bar{x} - \\mu}{s / \\sqrt{n}}', metadata: { 't': 't-statistic', '\\bar{x}': 'Sample mean', 's': 'Sample standard deviation', 'n': 'Sample size' } },
                  { type: 'TIP', content: 'Degrees of freedom (df) equal n - 1. As df increases, the t-distribution looks exactly like the normal distribution.' }
                ]
              },
              {
                slug: 'two-sample-t-test',
                name: 'Two-Sample T-Test',
                type: 'CONCEPT',
                articleTitle: 'Comparing Two Independent Means',
                blocks: [
                  { type: 'TEXT', content: 'Used to determine if two population means are equal. The data from the two groups must be independent of each other.' },
                  { type: 'FORMULA', content: 't = \\frac{\\bar{X}_1 - \\bar{X}_2}{\\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}}}', metadata: { '\\bar{X}_1 - \\bar{X}_2': 'Difference in sample means', 's_1^2': 'Variance of group 1', 'n_1': 'Size of group 1' } },
                  { type: 'TIP', content: 'If you are testing the same group twice (like before and after a diet), use a Paired T-Test instead!' }
                ]
              }
            ]
          },
          {
            slug: 'categorical-data',
            name: '6. Categorical Data Analysis',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'chi-square',
                name: 'Chi-Square Test',
                type: 'CONCEPT',
                articleTitle: 'Goodness of Fit & Independence',
                blocks: [
                  { type: 'TEXT', content: 'The Chi-Square statistic evaluates how likely it is that an observed distribution is due to chance. It compares observed frequencies to expected frequencies in categorical data.' },
                  { type: 'FORMULA', content: '\\chi^2 = \\sum \\frac{(O_i - E_i)^2}{E_i}', metadata: { '\\chi^2': 'Chi-Square statistic', 'O_i': 'Observed count for category i', 'E_i': 'Expected count for category i under the null hypothesis' } },
                  { type: 'TIP', content: 'This test only works with counts/frequencies, never with percentages or fractions!' }
                ]
              }
            ]
          }
        ]
      },
      {
        slug: 'advanced-models',
        name: 'STATISTICAL MODELING',
        type: 'MAIN_TOPIC',
        chapters: [
          {
            slug: 'multivariate',
            name: '7. Multivariate Models',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'multiple-regression',
                name: 'Multiple Linear Regression',
                type: 'CONCEPT',
                articleTitle: 'Predicting with Multiple Variables',
                blocks: [
                  { type: 'TEXT', content: 'An extension of simple linear regression used to predict an outcome variable based on multiple distinct predictor variables.' },
                  { type: 'FORMULA', content: 'Y = \\beta_0 + \\beta_1 X_1 + \\beta_2 X_2 + \\dots + \\beta_n X_n + \\epsilon', metadata: { 'Y': 'Predicted dependent variable', '\\beta_0': 'Y-intercept', '\\beta_i': 'Coefficients (weights) for each predictor', '\\epsilon': 'Error term (residuals)' } },
                  { type: 'TIP', content: "Watch out for multicollinearity—if your predictor variables are highly correlated with each other, it ruins your model's stability." }
                ]
              },
              {
                slug: 'logistic-regression',
                name: 'Logistic Regression',
                type: 'CONCEPT',
                articleTitle: 'Binary Classification',
                blocks: [
                  { type: 'TEXT', content: 'Despite its name, logistic regression is a classification algorithm. It uses the sigmoid function to map predicted values to probabilities between 0 and 1, usually to predict a binary outcome (Yes/No, True/False).' },
                  { type: 'FORMULA', content: 'P(Y=1) = \\frac{1}{1 + e^{-(\\beta_0 + \\beta_1 X)}}', metadata: { 'P(Y=1)': 'Probability that the outcome is 1 (Success)', 'e^{-(\\beta_0 + \\beta_1 X)}': 'The exponential of the negative linear regression equation' } },
                  { type: 'TIP', content: 'This is essentially the foundational math behind the neurons in a neural network!' }
                ]
              }
            ]
          },
          {
            slug: 'machine-learning',
            name: '8. Machine Learning Math',
            type: 'CHAPTER',
            concepts: [
              {
                slug: 'gradient-descent',
                name: 'Gradient Descent',
                type: 'CONCEPT',
                articleTitle: 'Optimizing Cost Functions',
                blocks: [
                  { type: 'TEXT', content: 'Gradient descent is an optimization algorithm used to minimize some function by iteratively moving in the direction of steepest descent as defined by the negative of the gradient.' },
                  { type: 'FORMULA', content: '\\theta_{new} = \\theta_{old} - \\alpha \\nabla J(\\theta)', metadata: { '\\theta': 'Model parameters (weights)', '\\alpha': 'Learning rate (step size)', '\\nabla J(\\theta)': 'Gradient of the Cost Function' } },
                  { type: 'TIP', content: 'If your learning rate is too high, it might overshoot the minimum. Too small, and it will take forever to converge!' }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  fs.writeFileSync('./src/data/seed_data.json', JSON.stringify(seed, null, 2));
  console.log("Successfully created seed_data.json");
} catch (err) {
  console.error("Error creating seed_data.json", err);
}
