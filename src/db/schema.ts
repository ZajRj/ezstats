import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Enums
export const nodeTypes = ['MAIN_TOPIC', 'CHAPTER', 'CONCEPT'] as const;
export type NodeType = typeof nodeTypes[number];

export const blockTypes = ['TEXT', 'FORMULA', 'TIP'] as const;
export type BlockType = typeof blockTypes[number];

// Tables
export const taxonomyTags = sqliteTable('taxonomy_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').unique(),
  name: text('name').notNull(),
  type: text('type', { enum: nodeTypes }).notNull(),
  parentId: integer('parent_id').references(() => taxonomyTags.id, { onDelete: 'cascade' }),
});

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  taxonomyTagId: integer('taxonomy_tag_id').references(() => taxonomyTags.id, { onDelete: 'cascade' }),
});

export const articleBlocks = sqliteTable('article_blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  articleId: integer('article_id').references(() => articles.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').default(0),
  type: text('type', { enum: blockTypes }).notNull(),
  bodyContent: text('body_content').notNull(),
  // Drizzle SQLite doesn't have native JSON, so we use text/blob and parse it, or we can use custom type
  metadataJson: text('metadata_json', { mode: 'json' }), 
});

export const activityHistory = sqliteTable('activity_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  type: text('type').notNull(), // e.g., 'TOOL' or 'ARTICLE'
  path: text('path').notNull(),
  timestamp: integer('timestamp').notNull(),
});

// Relations
export const taxonomyTagsRelations = relations(taxonomyTags, ({ one, many }) => ({
  parent: one(taxonomyTags, {
    fields: [taxonomyTags.parentId],
    references: [taxonomyTags.id],
    relationName: 'taxonomyParentChild',
  }),
  children: many(taxonomyTags, {
    relationName: 'taxonomyParentChild',
  }),
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  taxonomyTag: one(taxonomyTags, {
    fields: [articles.taxonomyTagId],
    references: [taxonomyTags.id],
  }),
  blocks: many(articleBlocks),
}));

export const articleBlocksRelations = relations(articleBlocks, ({ one }) => ({
  article: one(articles, {
    fields: [articleBlocks.articleId],
    references: [articles.id],
  }),
}));
