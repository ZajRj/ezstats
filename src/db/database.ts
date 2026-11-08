import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import seedData from '../data/seed_data.json';
import { eq } from 'drizzle-orm';

export interface UserProfile {
  id: number;
  name: string | null;
  profile_pic_uri: string | null;
}

// -------------------------------------------------------------
// Web Fallback Data Generator (derived directly from seed_data)
// -------------------------------------------------------------
let tagCounter = 1;
let articleCounter = 1;
let blockCounter = 1;

export interface FallbackArticle {
  id: number;
  title: string;
  taxonomyTagId: number;
  blocks: {
    id: number;
    articleId: number;
    orderIndex: number;
    type: 'TEXT' | 'FORMULA' | 'TIP';
    bodyContent: string;
    metadataJson: any;
  }[];
}

const fallbackArticlesMap = new Map<number, FallbackArticle>();

const fallbackTaxonomyNodes = (seedData.topics || []).map((topicData: any) => {
  const topicId = tagCounter++;
  return {
    id: topicId,
    name: topicData.name,
    type: topicData.type as 'MAIN_TOPIC',
    slug: topicData.slug,
    children: (topicData.chapters || []).map((chapterData: any) => {
      const chapterId = tagCounter++;
      return {
        id: chapterId,
        name: chapterData.name,
        type: chapterData.type as 'CHAPTER',
        slug: chapterData.slug,
        parentId: topicId,
        children: (chapterData.concepts || []).map((conceptData: any) => {
          const conceptId = tagCounter++;
          const currentArticleId = articleCounter++;
          const blocks = (conceptData.blocks || []).map((block: any, idx: number) => ({
            id: blockCounter++,
            articleId: currentArticleId,
            orderIndex: idx,
            type: block.type as 'TEXT' | 'FORMULA' | 'TIP',
            bodyContent: block.content,
            metadataJson: block.metadata || null,
          }));

          fallbackArticlesMap.set(currentArticleId, {
            id: currentArticleId,
            title: conceptData.articleTitle || conceptData.name,
            taxonomyTagId: conceptId,
            blocks,
          });

          return {
            id: conceptId,
            name: conceptData.name,
            type: conceptData.type as 'CONCEPT',
            slug: conceptData.slug,
            parentId: chapterId,
            articles: [
              {
                id: currentArticleId,
                title: conceptData.articleTitle || conceptData.name,
              },
            ],
          };
        }),
      };
    }),
  };
});

let memoryUserProfile: UserProfile = {
  id: 1,
  name: 'User',
  profile_pic_uri: null,
};

let memoryActivities: { id: number; title: string; type: string; path: string; timestamp: number }[] = [];

function loadStorageActivities() {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('zajtistics_activities');
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return memoryActivities;
}

function saveStorageActivities(list: any[]) {
  memoryActivities = list;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('zajtistics_activities', JSON.stringify(list));
    } catch {}
  }
}

// -------------------------------------------------------------
// Database Selection: Native SQLite vs. Safe Fallback
// -------------------------------------------------------------
let expoDbInstance: any = null;
let dbInstance: any = null;
let isFallback = false;

const isSharedArrayBufferSupported = () => {
  return typeof window !== 'undefined' && typeof SharedArrayBuffer !== 'undefined';
};

const shouldUseNativeSQLite = () => {
  if (Platform.OS !== 'web') return true;
  return isSharedArrayBufferSupported();
};

if (shouldUseNativeSQLite()) {
  try {
    expoDbInstance = SQLite.openDatabaseSync('zajtistics.db');
    dbInstance = drizzle(expoDbInstance, { schema });
  } catch (err) {
    console.warn('[Database] Native SQLite initialization failed. Falling back to in-memory mode:', err);
    isFallback = true;
  }
} else {
  isFallback = true;
}

// Mock fallback db matching Drizzle's query shape
const mockDb = {
  query: {
    taxonomyTags: {
      findMany: async () => fallbackTaxonomyNodes,
    },
    articles: {
      findFirst: async (options?: any) => {
        let targetId: number | null = null;
        if (options?.where?.queryChunks) {
          for (const chunk of options.where.queryChunks) {
            if (typeof chunk === 'number') {
              targetId = chunk;
              break;
            }
          }
        }
        if (targetId != null) {
          return fallbackArticlesMap.get(targetId) || null;
        }
        return fallbackArticlesMap.values().next().value || null;
      },
      findMany: async () => Array.from(fallbackArticlesMap.values()),
    },
    activityHistory: {
      findMany: async (options?: any) => {
        const list = loadStorageActivities();
        const limit = options?.limit ?? 20;
        return list.slice(0, limit);
      },
    },
  },
  insert: () => ({ values: () => ({ returning: async () => [] }) }),
  delete: () => ({ where: async () => {} }),
};

export const expoDb = expoDbInstance;
export const db = isFallback ? mockDb : dbInstance;

// -------------------------------------------------------------
// Public Database Operations
// -------------------------------------------------------------
export function setupDatabase() {
  if (isFallback || !expoDbInstance) return;

  try {
    expoDbInstance.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT,
        profile_pic_uri TEXT
      );
    `);

    expoDbInstance.execSync(`
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

    const firstUser = expoDbInstance.getFirstSync('SELECT * FROM users LIMIT 1');
    if (!firstUser) {
      expoDbInstance.runSync('INSERT INTO users (name, profile_pic_uri) VALUES (?, ?)', ['User', null]);
    }
  } catch (e) {
    console.warn('[Database] setupDatabase error:', e);
  }
}

export async function seedDatabase() {
  if (isFallback || !dbInstance || !expoDbInstance) return;

  try {
    const existingTopics = await dbInstance.query.taxonomyTags.findMany({
      where: eq(schema.taxonomyTags.type, 'MAIN_TOPIC'),
    });
    if (existingTopics.length >= (seedData.topics || []).length) return;

    expoDbInstance.execSync(`
      DELETE FROM article_blocks;
      DELETE FROM articles;
      DELETE FROM taxonomy_tags;
    `);

    for (const topicData of seedData.topics) {
      const topicResult: any = await dbInstance.insert(schema.taxonomyTags).values({
        slug: topicData.slug,
        name: topicData.name,
        type: topicData.type as any,
      }).returning();
      const topic = topicResult[0];

      if (!topicData.chapters) continue;

      for (const chapterData of topicData.chapters) {
        const chapterResult: any = await dbInstance.insert(schema.taxonomyTags).values({
          slug: chapterData.slug,
          name: chapterData.name,
          type: chapterData.type as any,
          parentId: topic.id,
        }).returning();
        const chapter = chapterResult[0];

        if (!chapterData.concepts) continue;

        for (const conceptData of chapterData.concepts) {
          const conceptResult: any = await dbInstance.insert(schema.taxonomyTags).values({
            slug: conceptData.slug,
            name: conceptData.name,
            type: conceptData.type as any,
            parentId: chapter.id,
          }).returning();
          const concept = conceptResult[0];

          const articleResult: any = await dbInstance.insert(schema.articles).values({
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

            await dbInstance.insert(schema.articleBlocks).values(blocksToInsert);
          }
        }
      }
    }
  } catch (e) {
    console.warn('[Database] seedDatabase error:', e);
  }
}

export function getUserProfile(): UserProfile | null {
  if (isFallback || !expoDbInstance) {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('zajtistics_user_profile');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return memoryUserProfile;
  }
  try {
    return expoDbInstance.getFirstSync('SELECT * FROM users LIMIT 1');
  } catch {
    return memoryUserProfile;
  }
}

export function updateUserProfile(name: string, profilePicUri: string | null) {
  if (isFallback || !expoDbInstance) {
    memoryUserProfile = { id: 1, name, profile_pic_uri: profilePicUri };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('zajtistics_user_profile', JSON.stringify(memoryUserProfile));
      } catch {}
    }
    return;
  }
  try {
    const user = getUserProfile();
    if (user) {
      expoDbInstance.runSync('UPDATE users SET name = ?, profile_pic_uri = ? WHERE id = ?', [name, profilePicUri, user.id]);
    }
  } catch (e) {
    console.warn('[Database] updateUserProfile error:', e);
  }
}

export async function recordActivity(title: string, type: string, path: string) {
  const timestamp = Math.floor(Date.now() / 1000);

  if (isFallback || !dbInstance || !expoDbInstance) {
    const list = loadStorageActivities();
    const filtered = list.filter((a: any) => a.path !== path);
    filtered.unshift({ id: Date.now(), title, type, path, timestamp });
    saveStorageActivities(filtered.slice(0, 20));
    return;
  }

  try {
    await dbInstance.delete(schema.activityHistory).where(eq(schema.activityHistory.path, path));
    await dbInstance.insert(schema.activityHistory).values({
      title,
      type,
      path,
      timestamp,
    });

    expoDbInstance.execSync(`
      DELETE FROM activity_history 
      WHERE id NOT IN (
        SELECT id FROM activity_history ORDER BY timestamp DESC LIMIT 20
      );
    `);
  } catch (e) {
    console.warn('[Database] recordActivity error:', e);
  }
}

export async function getRecentActivities(limit: number = 5) {
  if (isFallback || !dbInstance) {
    const list = loadStorageActivities();
    return list.slice(0, limit);
  }
  try {
    return await dbInstance.query.activityHistory.findMany({
      orderBy: (activityHistory: any, { desc }: any) => [desc(activityHistory.timestamp)],
      limit: limit,
    });
  } catch {
    return [];
  }
}
