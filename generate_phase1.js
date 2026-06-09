const fs = require('fs');
const path = './src/data/seed_data.json';
const seedData = require(path);

const phase1Content = {
  // JOINT DISTRIBUTIONS & MULTIVARIATE
  'joint-pmf-pdf': [
    { type: 'TEXT', content: 'A joint distribution describes the probability of two or more random variables occurring simultaneously.' },
    { type: 'FORMULA', content: 'P(X=x, Y=y) = p_{X,Y}(x,y)', metadata: { 'P(X=x, Y=y)': 'Probability that X is x and Y is y', 'p_{X,Y}': 'The Joint PMF or PDF' } },
    { type: 'TIP', content: 'For continuous variables, you integrate over both variables to find probabilities!' }
  ],
  'marginal-dist': [
    { type: 'TEXT', content: 'The marginal distribution gives the probability of a single variable without reference to the values of the other variables.' },
    { type: 'FORMULA', content: 'P_X(x) = \\sum_y P_{X,Y}(x,y)', metadata: { 'P_X(x)': 'Marginal probability of X', '\\sum_y': 'Summing over all possible values of Y', 'P_{X,Y}(x,y)': 'The joint probability' } },
    { type: 'TIP', content: 'You \"marginalize out\" the other variable by summing (or integrating) across its entire domain.' }
  ],
  'conditional-dist': [
    { type: 'TEXT', content: 'The conditional distribution describes the probability of one variable given that another has taken a specific value.' },
    { type: 'FORMULA', content: 'P(X|Y=y) = \\frac{P_{X,Y}(x,y)}{P_Y(y)}', metadata: { 'P(X|Y=y)': 'Probability of X given Y=y', 'P_{X,Y}': 'The Joint probability', 'P_Y(y)': 'The marginal probability of Y' } },
    { type: 'TIP', content: 'This is the exact same logic as Bayes Theorem, just applied to distributions!' }
  ],
  'independence-rvs': [
    { type: 'TEXT', content: 'Two random variables are independent if knowing the outcome of one provides no information about the outcome of the other.' },
    { type: 'FORMULA', content: 'P_{X,Y}(x,y) = P_X(x) P_Y(y)', metadata: { 'P_{X,Y}': 'Joint distribution', 'P_X P_Y': 'The product of their marginal distributions' } },
    { type: 'TIP', content: 'If variables are independent, their Covariance is exactly zero!' }
  ],

  // DESCRIPTIVE STATISTICS
  'median-mode': [
    { type: 'TEXT', content: 'The median is the middle value when data is sorted. The mode is the most frequently occurring value.' },
    { type: 'TIP', content: 'The median is robust to outliers, while the mean will get pulled heavily by extreme values.' }
  ],
  'weighted-mean': [
    { type: 'TEXT', content: 'A weighted mean gives certain data points more importance (weight) than others, rather than treating all equally.' },
    { type: 'FORMULA', content: '\\bar{x}_w = \\frac{\\sum w_i x_i}{\\sum w_i}', metadata: { '\\bar{x}_w': 'Weighted mean', 'w_i': 'The weight of the i-th observation', 'x_i': 'The value of the i-th observation' } },
    { type: 'TIP', content: 'Your class GPA is a perfect example of a weighted mean (credits are the weights).' }
  ],
  'range-iqr': [
    { type: 'TEXT', content: 'The range is the maximum minus the minimum. The Interquartile Range (IQR) measures the spread of the middle 50% of the data.' },
    { type: 'FORMULA', content: 'IQR = Q_3 - Q_1', metadata: { 'IQR': 'Interquartile Range', 'Q_3': '75th Percentile (Third quartile)', 'Q_1': '25th Percentile (First quartile)' } },
    { type: 'TIP', content: 'Any data point below Q1 - 1.5*IQR or above Q3 + 1.5*IQR is typically considered an outlier!' }
  ],
  'percentiles': [
    { type: 'TEXT', content: 'A percentile indicates the value below which a given percentage of observations fall.' },
    { type: 'TIP', content: 'The 50th percentile is exactly the median.' }
  ],
  'z-scores': [
    { type: 'TEXT', content: 'A Z-score (standard score) tells you how many standard deviations a value is away from the mean.' },
    { type: 'FORMULA', content: 'Z = \\frac{X - \\mu}{\\sigma}', metadata: { 'Z': 'The Z-score', 'X': 'The observed value', '\\mu': 'The population mean', '\\sigma': 'The population standard deviation' } },
    { type: 'TIP', content: 'A Z-score of 0 means the value is exactly the mean. A Z-score of +2.0 means it is two standard deviations above average.' }
  ],
  'skewness': [
    { type: 'TEXT', content: 'Skewness measures the asymmetry of a distribution around its mean.' },
    { type: 'FORMULA', content: '\\text{Skew} = E\\left[\\left(\\frac{X-\\mu}{\\sigma}\\right)^3\\right]', metadata: { '\\text{Skew}': 'Skewness coefficient', '^3': 'Cubed standardized deviations (preserves signs)' } },
    { type: 'TIP', content: 'Positive skew has a long right tail (mean > median). Negative skew has a long left tail (mean < median).' }
  ],
  'kurtosis': [
    { type: 'TEXT', content: 'Kurtosis measures the \"tailedness\" or sharpness of a distribution.' },
    { type: 'FORMULA', content: '\\text{Kurt} = E\\left[\\left(\\frac{X-\\mu}{\\sigma}\\right)^4\\right]', metadata: { '\\text{Kurt}': 'Kurtosis coefficient', '^4': 'Power of 4 heavily weights extreme outliers' } },
    { type: 'TIP', content: 'A normal distribution has a kurtosis of 3. Distributions with higher kurtosis have \"fat tails\" (more outliers).' }
  ],
  'box-plots': [
    { type: 'TEXT', content: 'A box-and-whisker plot visually displays the five-number summary: minimum, first quartile, median, third quartile, and maximum.' },
    { type: 'TIP', content: 'The \"box\" represents the IQR, containing the middle 50% of your data.' }
  ],

  // SAMPLING & ESTIMATION
  'srs': [
    { type: 'TEXT', content: 'Simple Random Sampling (SRS) ensures every subset of size n has an equal probability of being selected.' },
    { type: 'TIP', content: 'SRS is the gold standard, avoiding sampling bias so that the sample properly represents the population.' }
  ],
  'lln': [
    { type: 'TEXT', content: 'The Law of Large Numbers states that as a sample size grows, its mean gets closer to the average of the whole population.' },
    { type: 'FORMULA', content: '\\lim_{n\\to\\infty} P(|\\bar{X}_n - \\mu| > \\epsilon) = 0', metadata: { '\\bar{X}_n': 'Sample mean of size n', '\\mu': 'True population mean', '\\epsilon': 'Any tiny margin of error' } },
    { type: 'TIP', content: 'This is why casinos always win in the long run. The math guarantees it as the number of players increases.' }
  ],
  'clt': [
    { type: 'TEXT', content: 'The Central Limit Theorem states that the sum (or average) of many independent random variables tends toward a Normal distribution, EVEN IF the original variables are not normally distributed.' },
    { type: 'FORMULA', content: '\\bar{X}_n \\sim N\\left(\\mu, \\frac{\\sigma^2}{n}\\right)', metadata: { '\\bar{X}_n': 'The distribution of sample means', 'N': 'Approaches a Normal Distribution', '\\mu': 'The original population mean', '\\frac{\\sigma^2}{n}': 'The variance shrinks as sample size n grows' } },
    { type: 'TIP', content: 'This is the most important theorem in statistics. It allows us to use normal bells curves to test hypotheses about almost anything!' }
  ],
  'standard-error': [
    { type: 'TEXT', content: 'The Standard Error (SE) is the standard deviation of its sampling distribution. It measures how much the sample mean is expected to vary from the true population mean.' },
    { type: 'FORMULA', content: 'SE_{\\bar{x}} = \\frac{\\sigma}{\\sqrt{n}}', metadata: { 'SE': 'Standard Error', '\\sigma': 'Population standard deviation', '\\sqrt{n}': 'Square root of sample size' } },
    { type: 'TIP', content: 'Notice how n is in the denominator. To cut your error in half, you need 4 times as much data!' }
  ],
  'mle': [
    { type: 'TEXT', content: 'Maximum Likelihood Estimation (MLE) is a method of estimating the parameters of a statistical model. It finds the parameters that make the observed data most probable.' },
    { type: 'FORMULA', content: '\\hat{\\theta}_{MLE} = \\arg\\max_{\\theta} L(\\theta | x)', metadata: { '\\hat{\\theta}_{MLE}': 'The estimated best parameter', 'L(\\theta | x)': 'The likelihood function of the parameter given the data' } },
    { type: 'TIP', content: 'We almost always maximize the Log-Likelihood instead, because adding logs is mathematically easier than multiplying probabilities.' }
  ],
  'moments': [
    { type: 'TEXT', content: 'The Method of Moments estimates population parameters by setting sample moments (like sample mean and variance) equal to theoretical moments and solving the equations.' },
    { type: 'TIP', content: 'It is usually simpler than MLE but sometimes produces estimates that are less accurate or outside valid parameter ranges.' }
  ],
  'ci-z': [
    { type: 'TEXT', content: 'A Z-Interval estimates a population mean when the population variance is KNOWN or the sample size is large.' },
    { type: 'FORMULA', content: '\\bar{x} \\pm Z_{\\alpha/2} \\frac{\\sigma}{\\sqrt{n}}', metadata: { '\\bar{x}': 'Sample mean', 'Z_{\\alpha/2}': 'Critical Z-score for the desired confidence level (e.g. 1.96 for 95%)', '\\frac{\\sigma}{\\sqrt{n}}': 'Standard Error' } },
    { type: 'TIP', content: '95% Confidence does NOT mean there is a 95% chance the true mean is in your specific interval. It means that 95% of all randomly generated intervals will contain the true mean.' }
  ],
  'ci-t': [
    { type: 'TEXT', content: 'A T-Interval estimates a population mean when the population variance is UNKNOWN and the sample size is small. It uses the Student\'s t-distribution which has fatter tails.' },
    { type: 'FORMULA', content: '\\bar{x} \\pm t_{\\alpha/2, n-1} \\frac{s}{\\sqrt{n}}', metadata: { 't_{\\alpha/2, n-1}': 'Critical t-score with n-1 degrees of freedom', 's': 'Sample standard deviation' } },
    { type: 'TIP', content: 'As n gets very large (usually > 30), the t-distribution becomes practically identical to the Z-distribution.' }
  ],
  'ci-props': [
    { type: 'TEXT', content: 'A confidence interval for a proportion (like a polling percentage) uses the normal approximation to the binomial distribution.' },
    { type: 'FORMULA', content: '\\hat{p} \\pm Z_{\\alpha/2} \\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}}', metadata: { '\\hat{p}': 'Sample proportion (successes / trials)', '\\sqrt{\\dots}': 'Standard error of a proportion' } },
    { type: 'TIP', content: 'This is the math behind political polling margins of error!' }
  ],
  'ci-var': [
    { type: 'TEXT', content: 'A confidence interval for a population variance relies on the Chi-Square distribution.' },
    { type: 'FORMULA', content: '\\left[ \\frac{(n-1)s^2}{\\chi^2_{\\alpha/2}}, \\frac{(n-1)s^2}{\\chi^2_{1-\\alpha/2}} \\right]', metadata: { '(n-1)s^2': 'Degrees of freedom times sample variance', '\\chi^2': 'Critical Chi-Square values from the table' } },
    { type: 'TIP', content: 'Unlike Z and T intervals, the Chi-Square distribution is asymmetric, so the confidence interval is NOT centered around the sample variance!' }
  ]
};

// Loop through seed data and inject phase 1 content
let updatedCount = 0;
for (const topic of seedData.topics) {
  if (topic.chapters) {
    for (const chapter of topic.chapters) {
      if (chapter.concepts) {
        for (const concept of chapter.concepts) {
          if (phase1Content[concept.slug]) {
            concept.blocks = phase1Content[concept.slug];
            updatedCount++;
          }
        }
      }
    }
  }
}

fs.writeFileSync(path, JSON.stringify(seedData, null, 2));
console.log(`Successfully injected Phase 1 content into ${updatedCount} concepts in seed_data.json!`);
