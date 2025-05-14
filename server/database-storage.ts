import { users, type User, type InsertUser, stores, type Store, type InsertStore, dbConnections, type DbConnection, type InsertDbConnection, updates, type Update, type InsertUpdate, updateDetails, type UpdateDetail, type InsertUpdateDetail } from "@shared/schema";
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
    return db.select().from(updates).orderBy(desc(updates.date));
  }
  
  async getRecentUpdates(limit: number = 4): Promise<Update[]> {
    return db
      .select()
      .from(updates)
      .orderBy(desc(updates.date))
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
  
  async completeUpdate(id: number, status: 'completed' | 'partial' | 'failed'): Promise<Update | undefined> {
    const [updatedUpdate] = await db
      .update(updates)
      .set({ status })
      .where(eq(updates.id, id))
      .returning();
    return updatedUpdate;
  }
  
  async getUpdateDetails(updateId: number): Promise<UpdateDetail[]> {
    return db
      .select()
      .from(updateDetails)
      .where(eq(updateDetails.updateId, updateId));
  }
  
  async createUpdateDetail(detail: InsertUpdateDetail): Promise<UpdateDetail> {
    const [newDetail] = await db
      .insert(updateDetails)
      .values(detail)
      .returning();
    return newDetail;
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
      .where(gt(updates.date, thirtyDaysAgo.toISOString()));
    
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
      .select({ date: updates.date })
      .from(updates)
      .orderBy(desc(updates.date))
      .limit(1);
    
    return latestUpdate?.date || null;
  }
}