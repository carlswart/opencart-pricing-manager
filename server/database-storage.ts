import { 
  users, type User, type InsertUser, 
  stores, type Store, type InsertStore, 
  dbConnections, type DbConnection, type InsertDbConnection, 
  updates, type Update, type InsertUpdate, 
  updateDetails, type UpdateDetail, type InsertUpdateDetail 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, gt, sql } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
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
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.username);
  }
  
  async getAllStores(): Promise<Store[]> {
    return db.select().from(stores);
  }
  
  async getStoreById(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }
  
  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }
  
  async updateStore(id: number, store: InsertStore): Promise<Store | undefined> {
    const [updatedStore] = await db
      .update(stores)
      .set(store)
      .where(eq(stores.id, id))
      .returning();
    return updatedStore;
  }
  
  async deleteStore(id: number): Promise<boolean> {
    const result = await db.delete(stores).where(eq(stores.id, id));
    return !!result;
  }
  
  async getAllDbConnections(): Promise<DbConnection[]> {
    return db.select().from(dbConnections);
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
    const [newConnection] = await db
      .insert(dbConnections)
      .values(connection)
      .returning();
    return newConnection;
  }
  
  async updateDbConnection(id: number, connection: InsertDbConnection): Promise<DbConnection | undefined> {
    const [updatedConnection] = await db
      .update(dbConnections)
      .set(connection)
      .where(eq(dbConnections.id, id))
      .returning();
    return updatedConnection;
  }
  
  async deleteDbConnection(id: number): Promise<boolean> {
    const result = await db.delete(dbConnections).where(eq(dbConnections.id, id));
    return !!result;
  }
  
  async getAllUpdates(): Promise<Update[]> {
    return db.select().from(updates).orderBy(desc(updates.createdAt));
  }
  
  async getRecentUpdates(limit: number = 4): Promise<Update[]> {
    return db
      .select()
      .from(updates)
      .orderBy(desc(updates.createdAt))
      .limit(limit);
  }
  
  async getUpdateById(id: number): Promise<Update | undefined> {
    const [update] = await db.select().from(updates).where(eq(updates.id, id));
    return update;
  }
  
  async createUpdate(update: InsertUpdate): Promise<Update> {
    const [newUpdate] = await db.insert(updates).values(update).returning();
    return newUpdate;
  }
  
  async completeUpdate(id: number, status: 'completed' | 'partial' | 'failed', details?: any): Promise<Update | undefined> {
    // If we have both status and details to update
    if (details) {
      const [updatedUpdate] = await db
        .update(updates)
        .set({ 
          status, 
          completedAt: status === 'completed' ? new Date() : undefined,
          details: details
        })
        .where(eq(updates.id, id))
        .returning();
      return updatedUpdate;
    } 
    // If we're just updating the status
    else {
      const [updatedUpdate] = await db
        .update(updates)
        .set({ 
          status,
          completedAt: status === 'completed' ? new Date() : undefined
        })
        .where(eq(updates.id, id))
        .returning();
      return updatedUpdate;
    }
  }
  
  async deleteUpdate(id: number): Promise<boolean> {
    const result = await db.delete(updates).where(eq(updates.id, id));
    return !!result;
  }
  
  async getUpdateDetails(updateId: number): Promise<UpdateDetail[]> {
    return db
      .select()
      .from(updateDetails)
      .where(eq(updateDetails.updateId, updateId));
  }
  
  async getUpdateDetailsByStoreId(storeId: number): Promise<UpdateDetail[]> {
    return db
      .select()
      .from(updateDetails)
      .where(eq(updateDetails.storeId, storeId));
  }
  
  async createUpdateDetail(detail: InsertUpdateDetail): Promise<UpdateDetail> {
    const [newDetail] = await db
      .insert(updateDetails)
      .values(detail)
      .returning();
    return newDetail;
  }
  
  async deleteUpdateDetail(id: number): Promise<boolean> {
    const result = await db.delete(updateDetails).where(eq(updateDetails.id, id));
    return !!result;
  }
  
  async getTotalProducts(): Promise<number> {
    // In a real implementation, this would aggregate data from all stores
    // For demo purposes, we'll return a calculated value based on updates
    const [result] = await db
      .select({ total: sql<number>`SUM(${updates.productsCount})` })
      .from(updates);
    
    return result?.total || 0;
  }
  
  async getRecentUpdatesCount(): Promise<number> {
    // Count updates in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [result] = await db
      .select({ count: count() })
      .from(updates)
      .where(gt(updates.createdAt, thirtyDaysAgo));
    
    return result?.count || 0;
  }
  
  async getConnectedStoresCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(dbConnections);
    
    return result?.count || 0;
  }
  
  async getTotalStoresCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(stores);
    
    return result?.count || 0;
  }
  
  async getLastUpdateTime(): Promise<string | null> {
    const [latestUpdate] = await db
      .select({ date: updates.createdAt })
      .from(updates)
      .orderBy(desc(updates.createdAt))
      .limit(1);
    
    return latestUpdate?.date ? latestUpdate.date.toISOString() : null;
  }
}