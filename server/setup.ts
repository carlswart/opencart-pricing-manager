import { db } from "./db";
import { users, stores, dbConnections, updates, updateDetails } from "@shared/schema";

// Initialize demo data for development
export async function initializeDemoData() {
  try {
    // Check if we already have users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log('Creating demo data...');
      
      // Create admin user
      const adminUser = {
        username: 'admin',
        password: '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', // 'password'
        name: 'John Powell',
        role: 'admin'
      };
      console.log('Creating admin user:', adminUser.username);
      await db.insert(users).values(adminUser);

      // Create sample stores
      const storeNames = [
        'Main Warehouse', 
        'East Coast Depot',
        'West Coast Depot',
        'Midwest Store',
        'Pacific Northwest',
        'Southern Region',
        'Northeast Distribution'
      ];
      
      for (const name of storeNames) {
        await db.insert(stores).values({
          name,
          url: `https://${name.toLowerCase().replace(/\s+/g, '-')}.example.com`,
          active: Math.random() > 0.3 // Randomly set some as inactive
        });
      }
      
      // Get the admin user and stores
      const [admin] = await db.select().from(users);
      const allStores = await db.select().from(stores);
      
      // Create some sample updates
      const statuses: Array<'completed' | 'partial' | 'failed'> = ['completed', 'partial', 'failed'];
      const filenames = ['january_update.xlsx', 'february_pricing.xlsx', 'march_inventory.xlsx', 'q2_prices.xlsx', 'summer_sale.xlsx'];
      
      for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
        
        const [update] = await db.insert(updates).values({
          filename: filenames[Math.floor(Math.random() * filenames.length)],
          productsCount: Math.floor(Math.random() * 500) + 50,
          uploadedBy: admin.id,
          date: date.toISOString(),
          status: statuses[Math.floor(Math.random() * statuses.length)]
        }).returning();
        
        // Create some update details
        const randomStoreCount = Math.floor(Math.random() * allStores.length) + 1;
        
        for (let j = 0; j < randomStoreCount; j++) {
          const store = allStores[Math.floor(Math.random() * allStores.length)];
          const successCount = Math.floor(Math.random() * update.productsCount);
          const failureCount = Math.floor(Math.random() * (update.productsCount - successCount));
          
          await db.insert(updateDetails).values({
            updateId: update.id,
            storeId: store.id,
            successCount,
            failureCount,
            skippedCount: update.productsCount - successCount - failureCount
          });
        }
      }
      
      console.log('Demo data created successfully');
    }
  } catch (error) {
    console.error('Error initializing demo data:', error);
  }
}