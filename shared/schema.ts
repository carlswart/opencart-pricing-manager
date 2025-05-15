import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

// Stores table
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  created_at: true,
});

// Database connections table
export const dbConnections = pgTable("db_connections", {
  id: serial("id").primaryKey(),
  store_id: integer("store_id").references(() => stores.id).notNull(),
  host: text("host").notNull(),
  port: text("port").notNull(),
  database: text("database").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  prefix: text("prefix").notNull().default("oc_"),
  is_active: boolean("is_active").notNull().default(true),
  last_connected: timestamp("last_connected"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDbConnectionSchema = createInsertSchema(dbConnections).omit({
  id: true,
  last_connected: true,
  created_at: true,
  updated_at: true,
});

// Updates history table
export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  filename: text("filename").notNull(),
  products_count: integer("products_count").notNull(),
  status: text("status").notNull(), // completed, partial, failed
  date: timestamp("date").notNull().defaultNow(), // For sorting and display
  details: jsonb("details"),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertUpdateSchema = createInsertSchema(updates).omit({
  id: true,
  created_at: true,
  completed_at: true,
});

// Update details table for products updated in each batch
export const updateDetails = pgTable("update_details", {
  id: serial("id").primaryKey(),
  update_id: integer("update_id").references(() => updates.id).notNull(),
  store_id: integer("store_id").references(() => stores.id).notNull(),
  sku: text("sku").notNull(),
  product_id: integer("product_id"),
  old_regular_price: integer("old_regular_price"),
  new_regular_price: integer("new_regular_price"),
  old_depot_price: integer("old_depot_price"),
  new_depot_price: integer("new_depot_price"),
  old_warehouse_price: integer("old_warehouse_price"),
  new_warehouse_price: integer("new_warehouse_price"),
  old_quantity: integer("old_quantity"),
  new_quantity: integer("new_quantity"),
  success: boolean("success").notNull().default(true),
  error_message: text("error_message"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertUpdateDetailSchema = createInsertSchema(updateDetails).omit({
  id: true,
  created_at: true,
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

export type UpdateDetail = typeof updateDetails.$inferSelect;
export type InsertUpdateDetail = z.infer<typeof insertUpdateDetailSchema>;
