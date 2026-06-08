import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import formulas from '../data/formulas.json';
import { eq } from 'drizzle-orm';

export const expoDb = SQLite.openDatabaseSync('zajtistics.db');
export const db = drizzle(expoDb, { schema });

export interface UserProfile {
  id: number;
  name: string | null;
  profile_pic_uri: string | null;
}

export function setupDatabase() {
  // Legacy users table
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT,
      profile_pic_uri TEXT
    );
  `);
  
  // Create Taxonomy and Article tables
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS taxonomy_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('MAIN_TOPIC', 'CHAPTER', 'CONCEPT')),
      parent_id INTEGER,
      FOREIGN KEY (parent_id) REFERENCES taxonomy_tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      taxonomy_tag_id INTEGER,
      FOREIGN KEY (taxonomy_tag_id) REFERENCES taxonomy_tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS article_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER,
      order_index INTEGER DEFAULT 0,
      type TEXT CHECK(type IN ('TEXT', 'FORMULA', 'TIP')),
      body_content TEXT NOT NULL,
      metadata_json TEXT,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      path TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  // Seed the first user if none exists
  const firstUser = expoDb.getFirstSync<UserProfile>('SELECT * FROM users LIMIT 1');
  if (!firstUser) {
    expoDb.runSync('INSERT INTO users (name, profile_pic_uri) VALUES (?, ?)', ['User', null]);
  }
}

export async function seedDatabase() {
  const existingTags = await db.query.taxonomyTags.findMany();
  // We expect at least 14 tags (1 main + 3 chapters + 10 concepts). If not, we reseed.
  if (existingTags.length >= 14) return; 

  // Clear existing tags to forcefully reseed the new and improved content
  expoDb.execSync(`
    DELETE FROM article_blocks;
    DELETE FROM articles;
    DELETE FROM taxonomy_tags;
  `);

  // Insert MAIN_TOPIC
  const [probTopic] = await db.insert(schema.taxonomyTags).values({
    slug: 'probability',
    name: 'PROBABILITY',
    type: 'MAIN_TOPIC',
  }).returning();

  // Insert CHAPTERS
  const [commonChapter] = await db.insert(schema.taxonomyTags).values({
    slug: 'common-formulas',
    name: '0. Common Formulas',
    type: 'CHAPTER',
    parentId: probTopic.id,
  }).returning();

  const [discreteChapter] = await db.insert(schema.taxonomyTags).values({
    slug: 'discrete-dist',
    name: '1. Discrete Dist.',
    type: 'CHAPTER',
    parentId: probTopic.id,
  }).returning();

  const [continuousChapter] = await db.insert(schema.taxonomyTags).values({
    slug: 'continuous-dist',
    name: '2. Continuous Dist.',
    type: 'CHAPTER',
    parentId: probTopic.id,
  }).returning();

  // Insert CONCEPTS and Articles

  // COMMON FORMULAS
  // MEAN
  const [meanConcept] = await db.insert(schema.taxonomyTags).values({
    slug: 'mean', name: 'Mean (Expected Value)', type: 'CONCEPT', parentId: commonChapter.id,
  }).returning();
  const [meanArticle] = await db.insert(schema.articles).values({
    title: 'Population and Sample Mean', taxonomyTagId: meanConcept.id,
  }).returning();
  await db.insert(schema.articleBlocks).values([
    { articleId: meanArticle.id, orderIndex: 0, type: 'TEXT', bodyContent: 'The mean represents the mathematical average of a set of numbers.' },
    { articleId: meanArticle.id, orderIndex: 1, type: 'FORMULA', bodyContent: formulas.mean_population.latex, metadataJson: formulas.mean_population.tokens },
    { articleId: meanArticle.id, orderIndex: 2, type: 'FORMULA', bodyContent: formulas.mean_sample.latex, metadataJson: formulas.mean_sample.tokens },
    { articleId: meanArticle.id, orderIndex: 3, type: 'TIP', bodyContent: 'The population mean divides by N, while the sample mean divides by n.' }
  ]);

  // VARIANCE & STD DEV
  const [varianceConcept] = await db.insert(schema.taxonomyTags).values({
    slug: 'variance', name: 'Variance & Std Dev', type: 'CONCEPT', parentId: commonChapter.id,
  }).returning();
  const [varianceArticle] = await db.insert(schema.articles).values({
    title: 'Measuring Spread', taxonomyTagId: varianceConcept.id,
  }).returning();
  await db.insert(schema.articleBlocks).values([
    { articleId: varianceArticle.id, orderIndex: 0, type: 'TEXT', bodyContent: 'Variance measures how far a set of numbers is spread out from their average value. Standard deviation is its square root.' },
    { articleId: varianceArticle.id, orderIndex: 1, type: 'FORMULA', bodyContent: formulas.variance_population.latex, metadataJson: formulas.variance_population.tokens },
    { articleId: varianceArticle.id, orderIndex: 2, type: 'FORMULA', bodyContent: formulas.variance_sample.latex, metadataJson: formulas.variance_sample.tokens },
    { articleId: varianceArticle.id, orderIndex: 3, type: 'FORMULA', bodyContent: formulas.std_deviation.latex, metadataJson: formulas.std_deviation.tokens },
    { articleId: varianceArticle.id, orderIndex: 4, type: 'TIP', bodyContent: 'Sample variance uses (n-1) to correct for bias when estimating the population variance!' }
  ]);

  // BAYES THEOREM
  const [bayesConcept] = await db.insert(schema.taxonomyTags).values({
    slug: 'bayes', name: 'Bayes Theorem', type: 'CONCEPT', parentId: commonChapter.id,
  }).returning();
  const [bayesArticle] = await db.insert(schema.articles).values({
    title: 'Conditional Probability', taxonomyTagId: bayesConcept.id,
  }).returning();
  await db.insert(schema.articleBlocks).values([
    { articleId: bayesArticle.id, orderIndex: 0, type: 'TEXT', bodyContent: 'Bayes theorem describes the probability of an event based on prior knowledge of conditions that might be related to the event.' },
    { articleId: bayesArticle.id, orderIndex: 1, type: 'FORMULA', bodyContent: formulas.bayes_theorem.latex, metadataJson: formulas.bayes_theorem.tokens },
    { articleId: bayesArticle.id, orderIndex: 2, type: 'TIP', bodyContent: 'It allows us to update our beliefs (probabilities) as new evidence arrives.' }
  ]);

  // COMBINATORICS
  const [combinatoricsConcept] = await db.insert(schema.taxonomyTags).values({
    slug: 'combinatorics', name: 'Combinatorics', type: 'CONCEPT', parentId: commonChapter.id,
  }).returning();
  const [combinatoricsArticle] = await db.insert(schema.articles).values({
    title: 'Permutations & Combinations', taxonomyTagId: combinatoricsConcept.id,
  }).returning();
  await db.insert(schema.articleBlocks).values([
    { articleId: combinatoricsArticle.id, orderIndex: 0, type: 'TEXT', bodyContent: 'Combinatorics is the study of counting. Permutations count arrangements where order matters, while combinations count selections where order does not matter.' },
    { articleId: combinatoricsArticle.id, orderIndex: 1, type: 'FORMULA', bodyContent: formulas.permutations.latex, metadataJson: formulas.permutations.tokens },
    { articleId: combinatoricsArticle.id, orderIndex: 2, type: 'FORMULA', bodyContent: formulas.combinations.latex, metadataJson: formulas.combinations.tokens },
    { articleId: combinatoricsArticle.id, orderIndex: 3, type: 'TIP', bodyContent: 'Think of permutations like a password (order matters), and combinations like a fruit salad (order doesn\'t matter)!' }
  ]);

  // Insert CONCEPTS and Articles
  
  // BINOMIAL
  const [binomialConcept] = await db.insert(schema.taxonomyTags).values({
    slug: 'binomial-dist', name: 'Binomial Dist.', type: 'CONCEPT', parentId: discreteChapter.id,
  }).returning();
  const [binomialArticle] = await db.insert(schema.articles).values({
    title: 'Understanding the Binomial Distribution', taxonomyTagId: binomialConcept.id,
  }).returning();
  await db.insert(schema.articleBlocks).values([
    { articleId: binomialArticle.id, orderIndex: 0, type: 'TEXT', bodyContent: 'The Binomial distribution represents the number of successes in a sequence of n independent experiments.' },
    { articleId: binomialArticle.id, orderIndex: 1, type: 'FORMULA', bodyContent: formulas.binomial.latex, metadataJson: formulas.binomial.tokens },
    { articleId: binomialArticle.id, orderIndex: 2, type: 'TIP', bodyContent: 'Remember that trials must be independent and the probability of success must be constant!' }
  ]);

  // POISSON
  const [poissonConcept] = await db.insert(schema.taxonomyTags).values({
    slug: 'poisson-dist', name: 'Poisson Dist.', type: 'CONCEPT', parentId: discreteChapter.id,
  }).returning();
  const [poissonArticle] = await db.insert(schema.articles).values({
    title: 'Introduction to Poisson Distribution', taxonomyTagId: poissonConcept.id,
  }).returning();
  await db.insert(schema.articleBlocks).values([
    { articleId: poissonArticle.id, orderIndex: 0, type: 'TEXT', bodyContent: 'The Poisson distribution expresses the probability of a given number of events occurring in a fixed interval of time or space.' },
    { articleId: poissonArticle.id, orderIndex: 1, type: 'FORMULA', bodyContent: formulas.poisson.latex, metadataJson: formulas.poisson.tokens },
    { articleId: poissonArticle.id, orderIndex: 2, type: 'TIP', bodyContent: 'Use Poisson when events happen independently at a constant average rate!' }
  ]);

  // GEOMETRIC
  const [geometricConcept] = await db.insert(schema.taxonomyTags).values({
    slug: 'geometric-dist', name: 'Geometric Dist.', type: 'CONCEPT', parentId: discreteChapter.id,
  }).returning();
  const [geometricArticle] = await db.insert(schema.articles).values({
    title: 'The Geometric Distribution', taxonomyTagId: geometricConcept.id,
  }).returning();
  await db.insert(schema.articleBlocks).values([
    { articleId: geometricArticle.id, orderIndex: 0, type: 'TEXT', bodyContent: 'The Geometric distribution represents the number of trials needed to get the first success in repeated independent Bernoulli trials.' },
    { articleId: geometricArticle.id, orderIndex: 1, type: 'FORMULA', bodyContent: formulas.geometric.latex, metadataJson: formulas.geometric.tokens },
    { articleId: geometricArticle.id, orderIndex: 2, type: 'TIP', bodyContent: 'It is the only discrete memoryless random distribution!' }
  ]);

  // NORMAL
  const [normalConcept] = await db.insert(schema.taxonomyTags).values({
    slug: 'normal-dist', name: 'Normal Dist.', type: 'CONCEPT', parentId: continuousChapter.id,
  }).returning();
  const [normalArticle] = await db.insert(schema.articles).values({
    title: 'The Bell Curve (Normal Distribution)', taxonomyTagId: normalConcept.id,
  }).returning();
  await db.insert(schema.articleBlocks).values([
    { articleId: normalArticle.id, orderIndex: 0, type: 'TEXT', bodyContent: 'The Normal distribution is a continuous probability distribution that is symmetrical around its mean, showing that data near the mean are more frequent.' },
    { articleId: normalArticle.id, orderIndex: 1, type: 'FORMULA', bodyContent: formulas.normal.latex, metadataJson: formulas.normal.tokens },
    { articleId: normalArticle.id, orderIndex: 2, type: 'TIP', bodyContent: 'In a normal distribution, roughly 68% of the data falls within one standard deviation of the mean.' }
  ]);

  // EXPONENTIAL
  const [exponentialConcept] = await db.insert(schema.taxonomyTags).values({
    slug: 'exponential-dist', name: 'Exponential Dist.', type: 'CONCEPT', parentId: continuousChapter.id,
  }).returning();
  const [exponentialArticle] = await db.insert(schema.articles).values({
    title: 'Exponential Distribution', taxonomyTagId: exponentialConcept.id,
  }).returning();
  await db.insert(schema.articleBlocks).values([
    { articleId: exponentialArticle.id, orderIndex: 0, type: 'TEXT', bodyContent: 'The Exponential distribution describes the time between events in a Poisson point process (e.g., waiting times).' },
    { articleId: exponentialArticle.id, orderIndex: 1, type: 'FORMULA', bodyContent: formulas.exponential.latex, metadataJson: formulas.exponential.tokens },
    { articleId: exponentialArticle.id, orderIndex: 2, type: 'TIP', bodyContent: 'It is the continuous analogue of the geometric distribution, and it is also memoryless.' }
  ]);

  // UNIFORM
  const [uniformConcept] = await db.insert(schema.taxonomyTags).values({
    slug: 'uniform-dist', name: 'Uniform Dist.', type: 'CONCEPT', parentId: continuousChapter.id,
  }).returning();
  const [uniformArticle] = await db.insert(schema.articles).values({
    title: 'Continuous Uniform Distribution', taxonomyTagId: uniformConcept.id,
  }).returning();
  await db.insert(schema.articleBlocks).values([
    { articleId: uniformArticle.id, orderIndex: 0, type: 'TEXT', bodyContent: 'The Uniform distribution describes an experiment where there is an arbitrary outcome that lies between certain bounds. All intervals of the same length have equal probability.' },
    { articleId: uniformArticle.id, orderIndex: 1, type: 'FORMULA', bodyContent: formulas.uniform.latex, metadataJson: formulas.uniform.tokens },
    { articleId: uniformArticle.id, orderIndex: 2, type: 'TIP', bodyContent: 'Think of it as a completely fair random number generator between two limits.' }
  ]);
}

export function getUserProfile(): UserProfile | null {
  return expoDb.getFirstSync<UserProfile>('SELECT * FROM users LIMIT 1');
}

export function updateUserProfile(name: string, profilePicUri: string | null) {
  const user = getUserProfile();
  if (user) {
    expoDb.runSync('UPDATE users SET name = ?, profile_pic_uri = ? WHERE id = ?', [name, profilePicUri, user.id]);
  }
}

export async function recordActivity(title: string, type: string, path: string) {
  // Insert the new activity (with current unix timestamp)
  const timestamp = Math.floor(Date.now() / 1000);
  
  // To prevent duplicates from cluttering the top, we delete any existing activity with the exact same path first
  await db.delete(schema.activityHistory).where(eq(schema.activityHistory.path, path));
  
  await db.insert(schema.activityHistory).values({
    title,
    type,
    path,
    timestamp
  });

  // Keep table size small by pruning activities older than the top 20
  // Note: We use a raw query because Drizzle's SQLite delete doesn't easily support NOT IN with LIMIT directly without subqueries
  expoDb.execSync(`
    DELETE FROM activity_history 
    WHERE id NOT IN (
      SELECT id FROM activity_history ORDER BY timestamp DESC LIMIT 20
    );
  `);
}

export async function getRecentActivities(limit: number = 5) {
  return await db.query.activityHistory.findMany({
    orderBy: (activityHistory, { desc }) => [desc(activityHistory.timestamp)],
    limit: limit,
  });
}
