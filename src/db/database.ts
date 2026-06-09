import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import seedData from '../data/seed_data.json';
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
  const existingTopics = await db.query.taxonomyTags.findMany({ where: eq(schema.taxonomyTags.type, 'MAIN_TOPIC') });
  // If the number of main topics matches the seed data, assume we are fully seeded.
  if (existingTopics.length >= seedData.topics.length) return;

  // Clear existing tags to forcefully reseed the new and improved content
  expoDb.execSync(`
    DELETE FROM article_blocks;
    DELETE FROM articles;
    DELETE FROM taxonomy_tags;
  `);

  for (const topicData of seedData.topics) {
    const topicResult: any = await db.insert(schema.taxonomyTags).values({
      slug: topicData.slug,
      name: topicData.name,
      type: topicData.type as any,
    }).returning();
    const topic = topicResult[0];

    if (!topicData.chapters) continue;

    for (const chapterData of topicData.chapters) {
      const chapterResult: any = await db.insert(schema.taxonomyTags).values({
        slug: chapterData.slug,
        name: chapterData.name,
        type: chapterData.type as any,
        parentId: topic.id,
      }).returning();
      const chapter = chapterResult[0];

      if (!chapterData.concepts) continue;

      for (const conceptData of chapterData.concepts) {
        const conceptResult: any = await db.insert(schema.taxonomyTags).values({
          slug: conceptData.slug,
          name: conceptData.name,
          type: conceptData.type as any,
          parentId: chapter.id,
        }).returning();
        const concept = conceptResult[0];

        const articleResult: any = await db.insert(schema.articles).values({
          title: conceptData.articleTitle,
          taxonomyTagId: concept.id,
        }).returning();
        const article = articleResult[0];

        if (conceptData.blocks && conceptData.blocks.length > 0) {
          const blocksToInsert = conceptData.blocks.map((block: any, index: number) => ({
            articleId: article.id,
            orderIndex: index,
            type: block.type as any,
            bodyContent: block.content,
            metadataJson: block.metadata ? block.metadata : null,
          }));

          await db.insert(schema.articleBlocks).values(blocksToInsert);
        }
      }
    }
  }
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
