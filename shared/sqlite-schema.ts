import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { 
  sqliteTable, 
  text, 
  integer, 
  real
} from 'drizzle-orm/sqlite-core';

// User schema
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  created_at: text('created_at').notNull().default(''),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

// Store schema
export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  createdAt: text('created_at').notNull().default(''),
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});

// Database connection schema
export const dbConnections = sqliteTable('db_connections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  host: text('host').notNull(),
  port: text('port').notNull(),
  database: text('database').notNull(),
  username: text('username').notNull(),
  password: text('password').notNull(),
  prefix: text('prefix').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(''),
});

export const insertDbConnectionSchema = createInsertSchema(dbConnections).omit({
  id: true,
  createdAt: true,
});

// Update schema
export const updates = sqliteTable('updates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  productsCount: integer('products_count').notNull(),
  status: text('status').notNull(),
  details: text('details'),
  createdAt: text('created_at').notNull().default(''),
  completedAt: text('completed_at'),
});

export const insertUpdateSchema = createInsertSchema(updates).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Update details schema
export const updateDetails = sqliteTable('update_details', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  updateId: integer('update_id').notNull().references(() => updates.id, { onDelete: 'cascade' }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull(),
  sku: text('sku').notNull(),
  oldPrice: real('old_price'),
  newPrice: real('new_price'),
  oldQuantity: integer('old_quantity'),
  newQuantity: integer('new_quantity'),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull().default(''),
});

export const insertUpdateDetailSchema = createInsertSchema(updateDetails).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type DbConnection = typeof dbConnections.$inferSelect;
export type InsertDbConnection = z.infer<typeof insertDbConnectionSchema>;

export type Update = typeof updates.$inferSelect;
export type InsertUpdate = z.infer<typeof insertUpdateSchema>;

// Settings schema
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull().default(''),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
});

export type UpdateDetail = typeof updateDetails.$inferSelect;
export type InsertUpdateDetail = z.infer<typeof insertUpdateDetailSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;