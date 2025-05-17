/**
 * SQLite implementation of the IStorage interface
 * This uses the field mapping utilities to handle snake_case/camelCase conversion
 */
import { IStorage } from './storage';
import { DbAdapter } from './db-adapter';
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
} from '@shared/schema';
import { eq, desc, and, count, isNull, or, ne } from 'drizzle-orm';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { SessionStore } from './storage';

// Create memory store for session data
const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    // Create memory store for session data
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return await DbAdapter.getById(users, users.id, id) as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await DbAdapter.select(users, eq(users.username, username));
    return results.length > 0 ? results[0] as User : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    return await DbAdapter.insert(users, user) as User;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    return await DbAdapter.update(users, users.id, id, userData) as User | undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    return await DbAdapter.delete(users, users.id, id);
  }

  async getAllUsers(): Promise<User[]> {
    return await DbAdapter.select(users) as User[];
  }

  // Store methods
  async getAllStores(): Promise<Store[]> {
    return await DbAdapter.select(stores) as Store[];
  }

  async getStoreById(id: number): Promise<Store | undefined> {
    return await DbAdapter.getById(stores, stores.id, id) as Store | undefined;
  }

  async createStore(store: InsertStore): Promise<Store> {
    return await DbAdapter.insert(stores, store) as Store;
  }

  async updateStore(id: number, storeData: InsertStore): Promise<Store | undefined> {
    return await DbAdapter.update(stores, stores.id, id, storeData) as Store | undefined;
  }

  async deleteStore(id: number): Promise<boolean> {
    return await DbAdapter.delete(stores, stores.id, id);
  }

  // Database connection methods
  async getAllDbConnections(): Promise<DbConnection[]> {
    return await DbAdapter.select(dbConnections) as DbConnection[];
  }

  async getDbConnectionById(id: number): Promise<DbConnection | undefined> {
    return await DbAdapter.getById(dbConnections, dbConnections.id, id) as DbConnection | undefined;
  }

  async getDbConnectionByStoreId(storeId: number): Promise<DbConnection | undefined> {
    const results = await DbAdapter.select(dbConnections, eq(dbConnections.storeId, storeId));
    return results.length > 0 ? results[0] as DbConnection : undefined;
  }

  async createDbConnection(connection: InsertDbConnection): Promise<DbConnection> {
    return await DbAdapter.insert(dbConnections, connection) as DbConnection;
  }

  async updateDbConnection(id: number, connectionData: InsertDbConnection): Promise<DbConnection | undefined> {
    return await DbAdapter.update(dbConnections, dbConnections.id, id, connectionData) as DbConnection | undefined;
  }

  async deleteDbConnection(id: number): Promise<boolean> {
    return await DbAdapter.delete(dbConnections, dbConnections.id, id);
  }

  // Update methods
  async getAllUpdates(): Promise<Update[]> {
    return await DbAdapter.select(updates, undefined) as Update[];
  }

  async getRecentUpdates(limit: number = 4): Promise<Update[]> {
    const results = await DbAdapter.select(updates, undefined) as Update[];
    return results
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getUpdateById(id: number): Promise<Update | undefined> {
    return await DbAdapter.getById(updates, updates.id, id) as Update | undefined;
  }

  async createUpdate(updateData: InsertUpdate): Promise<Update> {
    return await DbAdapter.insert(updates, updateData) as Update;
  }

  async completeUpdate(id: number, status: 'completed' | 'partial' | 'failed', details?: any): Promise<Update | undefined> {
    const updateData = {
      status,
      completedAt: new Date().toISOString(),
      details: details ? JSON.stringify(details) : null
    };
    
    return await DbAdapter.update(updates, updates.id, id, updateData) as Update | undefined;
  }

  async deleteUpdate(id: number): Promise<boolean> {
    return await DbAdapter.delete(updates, updates.id, id);
  }

  // Update details methods
  async getUpdateDetails(updateId: number): Promise<UpdateDetail[]> {
    return await DbAdapter.select(updateDetails, eq(updateDetails.updateId, updateId)) as UpdateDetail[];
  }

  async getUpdateDetailsByStoreId(storeId: number): Promise<UpdateDetail[]> {
    return await DbAdapter.select(updateDetails, eq(updateDetails.storeId, storeId)) as UpdateDetail[];
  }

  async createUpdateDetail(detail: InsertUpdateDetail): Promise<UpdateDetail> {
    return await DbAdapter.insert(updateDetails, detail) as UpdateDetail;
  }

  async deleteUpdateDetail(id: number): Promise<boolean> {
    return await DbAdapter.delete(updateDetails, updateDetails.id, id);
  }

  // Customer group methods
  async getAllCustomerGroups(): Promise<CustomerGroup[]> {
    return await DbAdapter.select(customerGroups) as CustomerGroup[];
  }

  async getCustomerGroupById(id: number): Promise<CustomerGroup | undefined> {
    return await DbAdapter.getById(customerGroups, customerGroups.id, id) as CustomerGroup | undefined;
  }

  async getCustomerGroupByName(name: string): Promise<CustomerGroup | undefined> {
    const results = await DbAdapter.select(customerGroups, eq(customerGroups.name, name));
    return results.length > 0 ? results[0] as CustomerGroup : undefined;
  }

  async createCustomerGroup(group: InsertCustomerGroup): Promise<CustomerGroup> {
    return await DbAdapter.insert(customerGroups, group) as CustomerGroup;
  }

  async updateCustomerGroup(id: number, groupData: Partial<InsertCustomerGroup>): Promise<CustomerGroup | undefined> {
    return await DbAdapter.update(customerGroups, customerGroups.id, id, groupData) as CustomerGroup | undefined;
  }

  async deleteCustomerGroup(id: number): Promise<boolean> {
    return await DbAdapter.delete(customerGroups, customerGroups.id, id);
  }

  // Store customer group mapping methods
  async getAllStoreCustomerGroupMappings(): Promise<StoreCustomerGroupMapping[]> {
    return await DbAdapter.select(storeCustomerGroupMappings) as StoreCustomerGroupMapping[];
  }

  async getStoreCustomerGroupMappingsByStoreId(storeId: number): Promise<StoreCustomerGroupMapping[]> {
    return await DbAdapter.select(storeCustomerGroupMappings, eq(storeCustomerGroupMappings.storeId, storeId)) as StoreCustomerGroupMapping[];
  }

  async getStoreCustomerGroupMappingById(id: number): Promise<StoreCustomerGroupMapping | undefined> {
    return await DbAdapter.getById(storeCustomerGroupMappings, storeCustomerGroupMappings.id, id) as StoreCustomerGroupMapping | undefined;
  }

  async createStoreCustomerGroupMapping(mapping: InsertStoreCustomerGroupMapping): Promise<StoreCustomerGroupMapping> {
    return await DbAdapter.insert(storeCustomerGroupMappings, mapping) as StoreCustomerGroupMapping;
  }

  async updateStoreCustomerGroupMapping(id: number, mappingData: Partial<InsertStoreCustomerGroupMapping>): Promise<StoreCustomerGroupMapping | undefined> {
    return await DbAdapter.update(storeCustomerGroupMappings, storeCustomerGroupMappings.id, id, mappingData) as StoreCustomerGroupMapping | undefined;
  }

  async deleteStoreCustomerGroupMapping(id: number): Promise<boolean> {
    return await DbAdapter.delete(storeCustomerGroupMappings, storeCustomerGroupMappings.id, id);
  }

  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    const results = await DbAdapter.select(settings, eq(settings.key, key));
    return results.length > 0 ? results[0].value : null;
  }

  async setSetting(key: string, value: string, description?: string): Promise<boolean> {
    const existing = await DbAdapter.select(settings, eq(settings.key, key));
    
    if (existing.length > 0) {
      const settingData = { value, description };
      await DbAdapter.update(settings, settings.id, existing[0].id, settingData);
    } else {
      const settingData = { key, value, description };
      await DbAdapter.insert(settings, settingData);
    }
    
    return true;
  }

  // Dashboard stats methods
  async getTimeSaved(): Promise<number> {
    const timeSaved = await this.getSetting('time_saved');
    return timeSaved ? parseInt(timeSaved, 10) : 0;
  }

  async getTotalProducts(): Promise<number> {
    const result = await this.getSetting('total_products');
    return result ? parseInt(result, 10) : 0;
  }

  async getRecentUpdatesCount(): Promise<number> {
    const results = await DbAdapter.select(updates) as Update[];
    return results.length;
  }

  async getConnectedStoresCount(): Promise<number> {
    const results = await DbAdapter.select(dbConnections, eq(dbConnections.isActive, true));
    return results.length;
  }

  async getTotalStoresCount(): Promise<number> {
    const results = await DbAdapter.select(stores);
    return results.length;
  }

  async getLastUpdateTime(): Promise<string | null> {
    const updates = await this.getRecentUpdates(1);
    return updates.length > 0 ? updates[0].createdAt : null;
  }
}

// Create a singleton instance of the DatabaseStorage
export const storage = new DatabaseStorage();