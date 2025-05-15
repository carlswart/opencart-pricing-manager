import { IStorage } from './storage';
import { db } from './sqlite-db';
import { 
  User, InsertUser, 
  Store, InsertStore, 
  DbConnection, InsertDbConnection,
  Update, InsertUpdate,
  UpdateDetail, InsertUpdateDetail,
  users, stores, dbConnections, updates, updateDetails
} from '@shared/sqlite-schema';
import { eq, desc, and, count } from 'drizzle-orm';
import session from 'express-session';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
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

  // Dashboard stats methods
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
}