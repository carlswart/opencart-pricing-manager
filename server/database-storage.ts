import { IStorage } from './storage';
import { db } from './sqlite-db';
import { 
  User, InsertUser, 
  Store, InsertStore, 
  DbConnection, InsertDbConnection,
  Update, InsertUpdate,
  UpdateDetail, InsertUpdateDetail,
  CustomerGroup, InsertCustomerGroup,
  StoreCustomerGroupMapping, InsertStoreCustomerGroupMapping,
  Setting, InsertSetting,
  users, stores, dbConnections, updates, updateDetails, settings,
  customerGroups, storeCustomerGroupMappings
} from '@shared/sqlite-schema';
import { eq, desc, and, count, isNull, or, ne } from 'drizzle-orm';
import session from 'express-session';
import createMemoryStore from 'memorystore';

// Import the SessionStore type defined in storage.ts
import { SessionStore } from './storage';
const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    // Create memory store for session data
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    
    return result.length > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Store methods
  async getAllStores(): Promise<Store[]> {
    return await db.select().from(stores);
  }

  async getStoreById(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }

  async updateStore(id: number, storeData: InsertStore): Promise<Store | undefined> {
    const [updatedStore] = await db
      .update(stores)
      .set(storeData)
      .where(eq(stores.id, id))
      .returning();
    return updatedStore;
  }

  async deleteStore(id: number): Promise<boolean> {
    const result = await db
      .delete(stores)
      .where(eq(stores.id, id))
      .returning({ id: stores.id });
    
    return result.length > 0;
  }

  // Database connection methods
  async getAllDbConnections(): Promise<DbConnection[]> {
    return await db.select().from(dbConnections);
  }

  async getDbConnectionById(id: number): Promise<DbConnection | undefined> {
    const [connection] = await db.select().from(dbConnections).where(eq(dbConnections.id, id));
    return connection;
  }

  async getDbConnectionByStoreId(storeId: number): Promise<DbConnection | undefined> {
    const [connection] = await db
      .select()
      .from(dbConnections)
      .where(eq(dbConnections.storeId, storeId));
    return connection;
  }

  async createDbConnection(connection: InsertDbConnection): Promise<DbConnection> {
    const [newConnection] = await db.insert(dbConnections).values(connection).returning();
    return newConnection;
  }

  async updateDbConnection(id: number, connectionData: InsertDbConnection): Promise<DbConnection | undefined> {
    const [updatedConnection] = await db
      .update(dbConnections)
      .set(connectionData)
      .where(eq(dbConnections.id, id))
      .returning();
    return updatedConnection;
  }

  async deleteDbConnection(id: number): Promise<boolean> {
    const result = await db
      .delete(dbConnections)
      .where(eq(dbConnections.id, id))
      .returning({ id: dbConnections.id });
    
    return result.length > 0;
  }

  // Update methods
  async getAllUpdates(): Promise<Update[]> {
    return await db.select().from(updates).orderBy(desc(updates.createdAt));
  }

  async getRecentUpdates(limit: number = 4): Promise<Update[]> {
    return await db
      .select()
      .from(updates)
      .orderBy(desc(updates.createdAt))
      .limit(limit);
  }

  async getUpdateById(id: number): Promise<Update | undefined> {
    const [update] = await db.select().from(updates).where(eq(updates.id, id));
    return update;
  }

  async createUpdate(updateData: InsertUpdate): Promise<Update> {
    const [newUpdate] = await db.insert(updates).values(updateData).returning();
    return newUpdate;
  }

  async completeUpdate(id: number, status: 'completed' | 'partial' | 'failed', details?: any): Promise<Update | undefined> {
    const now = new Date().toISOString();
    
    const [updatedUpdate] = await db
      .update(updates)
      .set({ 
        status, 
        completedAt: now,
        details: details ? JSON.stringify(details) : null
      })
      .where(eq(updates.id, id))
      .returning();
    
    return updatedUpdate;
  }

  async deleteUpdate(id: number): Promise<boolean> {
    const result = await db
      .delete(updates)
      .where(eq(updates.id, id))
      .returning({ id: updates.id });
    
    return result.length > 0;
  }

  // Update details methods
  async getUpdateDetails(updateId: number): Promise<UpdateDetail[]> {
    return await db
      .select()
      .from(updateDetails)
      .where(eq(updateDetails.updateId, updateId));
  }

  async getUpdateDetailsByStoreId(storeId: number): Promise<UpdateDetail[]> {
    return await db
      .select()
      .from(updateDetails)
      .where(eq(updateDetails.storeId, storeId));
  }

  async createUpdateDetail(detail: InsertUpdateDetail): Promise<UpdateDetail> {
    const [newDetail] = await db.insert(updateDetails).values(detail).returning();
    return newDetail;
  }

  async deleteUpdateDetail(id: number): Promise<boolean> {
    const result = await db
      .delete(updateDetails)
      .where(eq(updateDetails.id, id))
      .returning({ id: updateDetails.id });
    
    return result.length > 0;
  }

  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    try {
      const result = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .execute();
      
      return result.length > 0 ? result[0].value : null;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }
  
  async setSetting(key: string, value: string, description?: string): Promise<boolean> {
    try {
      // Check if setting exists
      const existingSetting = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .execute();
      
      const now = new Date().toISOString();
      
      if (existingSetting.length > 0) {
        // Update existing setting
        await db
          .update(settings)
          .set({ 
            value, 
            description: description || existingSetting[0].description,
            createdAt: now 
          })
          .where(eq(settings.key, key))
          .execute();
      } else {
        // Create new setting
        await db
          .insert(settings)
          .values({
            key,
            value,
            description: description || '',
            createdAt: now
          })
          .execute();
      }
      
      return true;
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      return false;
    }
  }
  
  // Dashboard stats methods
  async getTimeSaved(): Promise<number> {
    // Calculate time saved based on product updates across stores
    // Each product update saves 1 minute per store (1 min/product/store)
    try {
      // First, count stores to calculate multiplier
      const storesResult = await db
        .select({ count: count() })
        .from(stores)
        .execute();
      
      const storesCount = storesResult.length > 0 ? storesResult[0].count : 0;
      
      // If no stores, no time saved
      if (storesCount === 0) {
        return 0;
      }
      
      // Count successful updates
      const updatesResult = await db
        .select({ count: count() })
        .from(updateDetails)
        .where(
          eq(updateDetails.status, 'success')
        )
        .execute();
      
      const successfulUpdates = updatesResult.length > 0 ? updatesResult[0].count : 0;
      
      // Calculate time saved: 1 minute per product per store
      const minutesSaved = successfulUpdates * storesCount;
      return minutesSaved;
    } catch (error) {
      console.error("Error calculating time saved:", error);
      return 0;
    }
  }
  
  async getTotalProducts(): Promise<number> {
    // Count distinct product IDs across all update details
    try {
      const result = await db
        .select({ count: count() })
        .from(updateDetails)
        .execute();
      
      return result.length > 0 ? result[0].count : 0;
    } catch (error) {
      console.error("Error getting total products:", error);
      return 0;
    }
  }

  async getRecentUpdatesCount(): Promise<number> {
    // Count updates in the last 30 days
    try {
      // For SQLite, use a simpler date comparison for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoString = thirtyDaysAgo.toISOString();
      
      const result = await db
        .select({ count: count() })
        .from(updates)
        .execute();
      
      return result.length > 0 ? result[0].count : 0;
    } catch (error) {
      console.error("Error getting recent updates count:", error);
      return 0;
    }
  }

  async getConnectedStoresCount(): Promise<number> {
    // Count stores with active database connections
    try {
      const result = await db
        .select({ count: count() })
        .from(dbConnections)
        .execute();
      
      return result.length > 0 ? result[0].count : 0;
    } catch (error) {
      console.error("Error getting connected stores count:", error);
      return 0;
    }
  }

  async getTotalStoresCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(stores)
        .execute();
      
      return result.length > 0 ? result[0].count : 0;
    } catch (error) {
      console.error("Error getting total stores count:", error);
      return 0;
    }
  }

  async getLastUpdateTime(): Promise<string | null> {
    try {
      // Get the most recent completed update time
      const result = await db
        .select({ completedAt: updates.completedAt })
        .from(updates)
        .where(eq(updates.status, 'completed'))
        .orderBy(desc(updates.completedAt))
        .limit(1)
        .execute();
      
      return result.length > 0 ? result[0].completedAt : null;
    } catch (error) {
      console.error("Error getting last update time:", error);
      return null;
    }
  }

  // Customer group methods
  async getAllCustomerGroups(): Promise<CustomerGroup[]> {
    try {
      return await db.select().from(customerGroups).orderBy(customerGroups.name);
    } catch (error) {
      console.error('Error getting all customer groups:', error);
      return [];
    }
  }

  async getCustomerGroupById(id: number): Promise<CustomerGroup | undefined> {
    try {
      const [group] = await db.select().from(customerGroups).where(eq(customerGroups.id, id));
      return group;
    } catch (error) {
      console.error(`Error getting customer group ${id}:`, error);
      return undefined;
    }
  }

  async getCustomerGroupByName(name: string): Promise<CustomerGroup | undefined> {
    try {
      const [group] = await db.select().from(customerGroups).where(eq(customerGroups.name, name));
      return group;
    } catch (error) {
      console.error(`Error getting customer group by name ${name}:`, error);
      return undefined;
    }
  }

  async createCustomerGroup(group: InsertCustomerGroup): Promise<CustomerGroup> {
    try {
      const now = new Date().toISOString();
      const [newGroup] = await db.insert(customerGroups).values({
        ...group,
        createdAt: now
      }).returning();
      return newGroup;
    } catch (error) {
      console.error('Error creating customer group:', error);
      throw new Error(`Failed to create customer group: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async updateCustomerGroup(id: number, groupData: Partial<InsertCustomerGroup>): Promise<CustomerGroup | undefined> {
    try {
      const [updatedGroup] = await db.update(customerGroups)
        .set(groupData)
        .where(eq(customerGroups.id, id))
        .returning();
      return updatedGroup;
    } catch (error) {
      console.error(`Error updating customer group ${id}:`, error);
      return undefined;
    }
  }

  async deleteCustomerGroup(id: number): Promise<boolean> {
    try {
      await db.delete(customerGroups).where(eq(customerGroups.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting customer group ${id}:`, error);
      return false;
    }
  }

  // Store customer group mapping methods
  async getAllStoreCustomerGroupMappings(): Promise<StoreCustomerGroupMapping[]> {
    try {
      return await db.select().from(storeCustomerGroupMappings);
    } catch (error) {
      console.error('Error getting all store customer group mappings:', error);
      return [];
    }
  }

  async getStoreCustomerGroupMappingsByStoreId(storeId: number): Promise<StoreCustomerGroupMapping[]> {
    try {
      return await db.select()
        .from(storeCustomerGroupMappings)
        .where(eq(storeCustomerGroupMappings.storeId, storeId))
        .orderBy(storeCustomerGroupMappings.customerGroupId);
    } catch (error) {
      console.error(`Error getting store customer group mappings for store ${storeId}:`, error);
      return [];
    }
  }

  async getStoreCustomerGroupMappingById(id: number): Promise<StoreCustomerGroupMapping | undefined> {
    try {
      const [mapping] = await db.select()
        .from(storeCustomerGroupMappings)
        .where(eq(storeCustomerGroupMappings.id, id));
      return mapping;
    } catch (error) {
      console.error(`Error getting store customer group mapping ${id}:`, error);
      return undefined;
    }
  }

  async createStoreCustomerGroupMapping(mapping: InsertStoreCustomerGroupMapping): Promise<StoreCustomerGroupMapping> {
    try {
      const now = new Date().toISOString();
      const [newMapping] = await db.insert(storeCustomerGroupMappings).values({
        ...mapping,
        createdAt: now
      }).returning();
      return newMapping;
    } catch (error) {
      console.error('Error creating store customer group mapping:', error);
      throw new Error(`Failed to create store customer group mapping: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async updateStoreCustomerGroupMapping(id: number, mappingData: Partial<InsertStoreCustomerGroupMapping>): Promise<StoreCustomerGroupMapping | undefined> {
    try {
      const [updatedMapping] = await db.update(storeCustomerGroupMappings)
        .set(mappingData)
        .where(eq(storeCustomerGroupMappings.id, id))
        .returning();
      return updatedMapping;
    } catch (error) {
      console.error(`Error updating store customer group mapping ${id}:`, error);
      return undefined;
    }
  }

  async deleteStoreCustomerGroupMapping(id: number): Promise<boolean> {
    try {
      await db.delete(storeCustomerGroupMappings).where(eq(storeCustomerGroupMappings.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting store customer group mapping ${id}:`, error);
      return false;
    }
  }
}

// Export an instance of the database storage
export const storage = new DatabaseStorage();