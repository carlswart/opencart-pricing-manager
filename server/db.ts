import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create SQLite database connection
const dbPath = path.join(dataDir, 'app.db');
export const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle ORM instance with our schema
export const db = drizzle(sqlite, { schema });

// Function to initialize the database schema
export async function initializeSchema() {
  // Check if tables exist and create them if they don't
  const tables = [
    'users',
    'stores',
    'db_connections',
    'updates',
    'update_details',
    'settings',
    'customer_groups',
    'store_customer_group_mappings'
  ];
  
  for (const table of tables) {
    const exists = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
    if (!exists) {
      console.log(`Creating table: ${table}`);
    }
  }
}

// Function to close the database connection
export function closeDatabase() {
  sqlite?.close();
}

// Execute a SQL query directly and return the result
export function executeRawQuery(query: string, params: any[] = []): any {
  try {
    console.log(`Executing raw SQL query: ${query} with params:`, params);
    const statement = sqlite.prepare(query);
    
    // If the query starts with SELECT, execute get or all
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      if (query.includes('COUNT(*)')) {
        return statement.get(...params);
      }
      return statement.all(...params);
    }
    
    // For other operations (INSERT, UPDATE, DELETE)
    return statement.run(...params);
  } catch (error) {
    console.error('Raw SQL query execution failed:', error);
    throw error;
  }
}
