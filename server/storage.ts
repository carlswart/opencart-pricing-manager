// A collection of storage interfaces
import { 
  User, InsertUser, 
  Store, InsertStore, 
  DbConnection, InsertDbConnection,
  Update, InsertUpdate,
  UpdateDetail, InsertUpdateDetail 
} from "@shared/sqlite-schema";

// Import memorystore for session store type
import createMemoryStore from 'memorystore';
import session from 'express-session';

// Define session store type for consistency
export type SessionStore = ReturnType<typeof createMemoryStore>;

export interface IStorage {
  // Session store
  sessionStore: SessionStore;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Store methods
  getAllStores(): Promise<Store[]>;
  getStoreById(id: number): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: InsertStore): Promise<Store | undefined>;
  deleteStore(id: number): Promise<boolean>;
  
  // Database connection methods
  getAllDbConnections(): Promise<DbConnection[]>;
  getDbConnectionById(id: number): Promise<DbConnection | undefined>;
  getDbConnectionByStoreId(storeId: number): Promise<DbConnection | undefined>;
  createDbConnection(connection: InsertDbConnection): Promise<DbConnection>;
  updateDbConnection(id: number, connection: InsertDbConnection): Promise<DbConnection | undefined>;
  deleteDbConnection(id: number): Promise<boolean>;
  
  // Update methods
  getAllUpdates(): Promise<Update[]>;
  getRecentUpdates(limit?: number): Promise<Update[]>;
  getUpdateById(id: number): Promise<Update | undefined>;
  createUpdate(update: InsertUpdate): Promise<Update>;
  completeUpdate(id: number, status: 'completed' | 'partial' | 'failed', details?: any): Promise<Update | undefined>;
  deleteUpdate(id: number): Promise<boolean>;
  
  // Update details methods
  getUpdateDetails(updateId: number): Promise<UpdateDetail[]>;
  getUpdateDetailsByStoreId(storeId: number): Promise<UpdateDetail[]>;
  createUpdateDetail(detail: InsertUpdateDetail): Promise<UpdateDetail>;
  deleteUpdateDetail(id: number): Promise<boolean>;
  
  // Dashboard stats methods
  getTimeSaved(): Promise<number>;
  getTotalProducts(): Promise<number>;
  getRecentUpdatesCount(): Promise<number>;
  getConnectedStoresCount(): Promise<number>;
  getTotalStoresCount(): Promise<number>;
  getLastUpdateTime(): Promise<string | null>;
}

// Import our storage implementation
import { storage } from './database-storage';