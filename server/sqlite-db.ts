import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/sqlite-schema";
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create SQLite database connection
const dbPath = path.join(dataDir, 'app.db');
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle ORM instance with our schema
export const db = drizzle(sqlite, { schema });

// Function to initialize the database schema
export async function initializeSchema() {
  // Create tables if they don't exist
  const tables = [
    'users',
    'stores',
    'db_connections',
    'updates',
    'update_details',
    'settings'
  ];

  for (const table of tables) {
    const result = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
    if (!result) {
      console.log(`Creating table: ${table}`);
      
      let createTableSQL = '';
      
      switch (table) {
        case 'users':
          createTableSQL = `
            CREATE TABLE users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              name TEXT NOT NULL,
              role TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            )
          `;
          break;
          
        case 'stores':
          createTableSQL = `
            CREATE TABLE stores (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              url TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            )
          `;
          break;
          
        case 'db_connections':
          createTableSQL = `
            CREATE TABLE db_connections (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              store_id INTEGER NOT NULL,
              host TEXT NOT NULL,
              port TEXT NOT NULL,
              database TEXT NOT NULL,
              username TEXT NOT NULL,
              password TEXT NOT NULL,
              prefix TEXT NOT NULL,
              is_active INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
              FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
            )
          `;
          break;
          
        case 'updates':
          createTableSQL = `
            CREATE TABLE updates (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              filename TEXT NOT NULL,
              products_count INTEGER NOT NULL,
              status TEXT NOT NULL,
              details TEXT,
              created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
              completed_at TEXT,
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
          `;
          break;
          
        case 'update_details':
          createTableSQL = `
            CREATE TABLE update_details (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              update_id INTEGER NOT NULL,
              store_id INTEGER NOT NULL,
              product_id INTEGER NOT NULL,
              sku TEXT NOT NULL,
              old_price REAL,
              new_price REAL,
              old_quantity INTEGER,
              new_quantity INTEGER,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
              FOREIGN KEY (update_id) REFERENCES updates (id) ON DELETE CASCADE,
              FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
            )
          `;
          break;
          
        case 'settings':
          createTableSQL = `
            CREATE TABLE settings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              key TEXT NOT NULL UNIQUE,
              value TEXT NOT NULL,
              description TEXT,
              created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            )
          `;
          break;
      }
      
      if (createTableSQL) {
        sqlite.exec(createTableSQL);
      }
      
      // Seed settings table with defaults
      if (table === 'settings') {
        // Add default session timeout (15 minutes = 900000 milliseconds)
        const sessionTimeout = sqlite.prepare(`SELECT * FROM settings WHERE key = 'session_timeout'`).get();
        if (!sessionTimeout) {
          sqlite.prepare(`
            INSERT INTO settings (key, value, description) 
            VALUES (?, ?, ?)
          `).run('session_timeout', '900000', 'Session timeout in milliseconds (default: 15 minutes)');
        }
        
        // Add server version to detect restarts
        const serverVersion = sqlite.prepare(`SELECT * FROM settings WHERE key = 'server_version'`).get();
        if (!serverVersion) {
          sqlite.prepare(`
            INSERT INTO settings (key, value, description) 
            VALUES (?, ?, ?)
          `).run('server_version', Date.now().toString(), 'Server version timestamp to detect restarts');
        }
      }
    }
  }
}

// Function to close the database connection
export function closeDatabase() {
  sqlite.close();
}