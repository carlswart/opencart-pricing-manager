import * as fs from 'fs';
import * as path from 'path';
import { db, sqlite } from './sqlite-db';
import { storeCustomerGroupMappings } from '@shared/sqlite-schema';

/**
 * Check if the store_customer_group_mappings table has the opencart_customer_group_name column
 * If not, recreate the table with the correct schema
 */
export async function migrateStoreCustomerGroupMappings() {
  console.log("Checking if store_customer_group_mappings table needs migration...");

  // Check if the table exists
  const tableExists = sqlite.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='store_customer_group_mappings'
  `).get();

  if (!tableExists) {
    console.log("Table store_customer_group_mappings does not exist, no migration needed.");
    return;
  }

  // Check if the opencart_customer_group_name column exists
  const tableInfo = sqlite.prepare(`PRAGMA table_info(store_customer_group_mappings)`).all();
  const hasOpenCartCustomerGroupName = tableInfo.some((column: any) => 
    column.name === 'opencart_customer_group_name'
  );

  if (hasOpenCartCustomerGroupName) {
    console.log("Table store_customer_group_mappings already has opencart_customer_group_name column, no migration needed.");
    return;
  }

  console.log("Migrating store_customer_group_mappings table...");

  // Create a backup of the table
  const existingMappings = sqlite.prepare(`SELECT * FROM store_customer_group_mappings`).all();
  console.log(`Found ${existingMappings.length} existing mappings to migrate.`);

  // Drop the table and recreate it with the correct schema
  sqlite.exec(`DROP TABLE IF EXISTS store_customer_group_mappings`);
  
  // Create the table with the correct schema
  sqlite.exec(`
    CREATE TABLE store_customer_group_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      customer_group_id INTEGER NOT NULL,
      opencart_customer_group_id INTEGER NOT NULL,
      opencart_customer_group_name TEXT NOT NULL DEFAULT 'Unknown',
      assign_discount INTEGER NOT NULL DEFAULT 1,
      discount_percentage REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_group_id) REFERENCES customer_groups(id) ON DELETE CASCADE
    )
  `);

  // Reinsert the data
  if (existingMappings.length > 0) {
    for (const mapping of existingMappings) {
      sqlite.prepare(`
        INSERT INTO store_customer_group_mappings (
          id, store_id, customer_group_id, opencart_customer_group_id, 
          created_at
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        mapping.id,
        mapping.store_id,
        mapping.customer_group_id,
        mapping.opencart_customer_group_id,
        mapping.created_at || (new Date()).toISOString()
      );
    }
  }

  console.log("Migration of store_customer_group_mappings table completed successfully!");
}