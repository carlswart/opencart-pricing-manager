import { initializeSchema, sqlite } from './server/sqlite-db';

// This is a one-time script to fix the store_customer_group_mappings table
async function fixCustomerGroupMappings() {
  console.log("Starting database migration to fix customer group mappings table...");
  
  try {
    // First ensure the schema is initialized
    await initializeSchema();
    
    // Check if the table exists
    const tableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='store_customer_group_mappings'
    `).get();
    
    if (!tableExists) {
      console.log("Table store_customer_group_mappings does not exist, creating it from scratch");
      
      // Create the table with all required columns
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
      
      console.log("Table created successfully");
      return;
    }
    
    // Check if the opencart_customer_group_name column exists
    try {
      const tableInfo = sqlite.prepare(`PRAGMA table_info(store_customer_group_mappings)`).all();
      console.log("Current table structure:", tableInfo);
      
      const hasOpenCartCustomerGroupName = tableInfo.some((column: any) => 
        column.name === 'opencart_customer_group_name'
      );
      
      if (!hasOpenCartCustomerGroupName) {
        console.log("Missing required column opencart_customer_group_name, recreating table");
        
        // First backup existing mappings
        const existingMappings = sqlite.prepare(`SELECT * FROM store_customer_group_mappings`).all();
        console.log(`Found ${existingMappings.length} existing mappings to migrate`);
        
        // Drop the existing table
        sqlite.exec(`DROP TABLE store_customer_group_mappings`);
        
        // Create the new table with all required columns
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
        
        // Restore existing mappings if any
        if (existingMappings && existingMappings.length > 0) {
          for (const mapping of existingMappings) {
            sqlite.prepare(`
              INSERT INTO store_customer_group_mappings (
                id, store_id, customer_group_id, opencart_customer_group_id, 
                opencart_customer_group_name, created_at
              ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              mapping.id,
              mapping.store_id,
              mapping.customer_group_id,
              mapping.opencart_customer_group_id,
              'Migrated Group', // Default name since we didn't have it before
              mapping.created_at || new Date().toISOString()
            );
          }
          console.log(`Restored ${existingMappings.length} existing mappings`);
        }
      } else {
        console.log("Table schema is already correct, no migration needed");
      }
    } catch (error) {
      console.error("Error checking table structure:", error);
      
      // If there was an error checking the structure, recreate the table from scratch
      console.log("Recreating table from scratch due to error");
      
      // Drop the existing table if it exists
      sqlite.exec(`DROP TABLE IF EXISTS store_customer_group_mappings`);
      
      // Create the new table with all required columns
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
    }
    
    // Verify the table structure after migration
    const finalTableInfo = sqlite.prepare(`PRAGMA table_info(store_customer_group_mappings)`).all();
    console.log("Final table structure:", finalTableInfo);
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run the migration
fixCustomerGroupMappings()
  .then(() => {
    console.log("Migration script completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });