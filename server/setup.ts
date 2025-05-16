import { db, initializeSchema } from './sqlite-db';
import { hash } from './auth-utils';
import { users, stores, customerGroups } from '@shared/sqlite-schema';

/**
 * Initialize the database with demo data if it doesn't exist
 */
export async function initializeDemoData() {
  try {
    // Initialize schema first
    await initializeSchema();
    
    // Check if we already have users
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length > 0) {
      console.log("Database already has data, skipping initialization");
      return;
    }
    
    // Create admin user
    const adminPassword = await hash('password');
    await db.insert(users).values({
      username: 'admin',
      password: adminPassword,
      name: 'John Powell',
      role: 'admin'
    });
    
    // Create regular user
    const userPassword = await hash('password123');
    await db.insert(users).values({
      username: 'user',
      password: userPassword,
      name: 'Sarah Miller',
      role: 'user'
    });
    
    // Create sample stores
    const sampleStores = [
      { name: 'Main Warehouse', url: 'https://warehouse.example.com' },
      { name: 'Retail Store Cape Town', url: 'https://capetown.example.com' },
      { name: 'Retail Store Johannesburg', url: 'https://johannesburg.example.com' },
      { name: 'Retail Store Durban', url: 'https://durban.example.com' },
      { name: 'Retail Store Port Elizabeth', url: 'https://portelizabeth.example.com' },
      { name: 'Wholesale Distributor', url: 'https://wholesale.example.com' },
      { name: 'Online Shop', url: 'https://online.example.com' }
    ];
    
    for (const store of sampleStores) {
      await db.insert(stores).values(store);
    }
    
    // Create default customer groups with their respective discount rates
    const defaultCustomerGroups = [
      { name: 'depot', displayName: 'Depots', discountPercentage: 18 },
      { name: 'namibiaSD', displayName: 'Namibia SD', discountPercentage: 26 }
    ];
    
    for (const group of defaultCustomerGroups) {
      await db.insert(customerGroups).values({
        ...group,
        createdAt: new Date().toISOString()
      });
    }
    
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}