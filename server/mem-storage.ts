import { 
  User, InsertUser, 
  Store, InsertStore, 
  DbConnection, InsertDbConnection,
  Update, InsertUpdate,
  UpdateDetail, InsertUpdateDetail
} from '@shared/sqlite-schema';
import { IStorage, SessionStore } from './storage';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { hash } from './auth-utils';

export class MemStorage implements IStorage {
  sessionStore: SessionStore;
  private users: Map<number, User>;
  private stores: Map<number, Store>;
  private dbConnections: Map<number, DbConnection>;
  private updates: Map<number, Update>;
  private updateDetails: Map<number, UpdateDetail>;
  
  private userIdCounter: number;
  private storeIdCounter: number;
  private dbConnectionIdCounter: number;
  private updateIdCounter: number;
  private updateDetailIdCounter: number;
  
  constructor() {
    // Initialize session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.users = new Map();
    this.stores = new Map();
    this.dbConnections = new Map();
    this.updates = new Map();
    this.updateDetails = new Map();
    
    this.userIdCounter = 1;
    this.storeIdCounter = 1;
    this.dbConnectionIdCounter = 1;
    this.updateIdCounter = 1;
    this.updateDetailIdCounter = 1;
    
    // Create default admin user
    const adminUser: InsertUser = {
      username: 'admin',
      password: 'password', // This will be hashed before storage
      name: 'Administrator',
      role: 'admin'
    };
    
    // Hash the password
    hash(adminUser.password).then(hashedPassword => {
      adminUser.password = hashedPassword;
      console.log('Creating admin user:', adminUser.username);
      this.createUser(adminUser);
      
      // Create sample stores
      this.initializeSampleData();
    });
  }
  
  // Initialize sample data for demonstration
  private initializeSampleData() {
    // Create sample stores
    this.createStore({
      name: 'Store 1',
      url: 'store1.example.com'
    }).then(store1 => {
      // Create sample DB connections
      this.createDbConnection({
        storeId: store1.id,
        host: 'db.store1.example.com',
        port: '3306',
        database: 'store1_opencart',
        username: 'store1_user',
        password: 'password1',
        prefix: 'oc_',
        isActive: true
      });
    });
    
    this.createStore({
      name: 'Store 2',
      url: 'store2.example.com'
    }).then(store2 => {
      this.createDbConnection({
        storeId: store2.id,
        host: 'db.store2.example.com',
        port: '3306',
        database: 'store2_opencart',
        username: 'store2_user',
        password: 'password2',
        prefix: 'oc_',
        isActive: true
      });
    });
    
    this.createStore({
      name: 'Store 3',
      url: 'store3.example.com'
    }).then(store3 => {
      this.createDbConnection({
        storeId: store3.id,
        host: 'db.store3.example.com',
        port: '3306',
        database: 'store3_opencart',
        username: 'store3_user',
        password: 'password3',
        prefix: 'oc_',
        isActive: false
      });
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date().toISOString();
    
    const newUser: User = {
      id,
      ...user,
      createdAt: now
    };
    
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...userData
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Store methods
  async getAllStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }
  
  async getStoreById(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }
  
  async createStore(store: InsertStore): Promise<Store> {
    const id = this.storeIdCounter++;
    const now = new Date().toISOString();
    
    const newStore: Store = {
      ...store,
      id,
      createdAt: now
    };
    
    this.stores.set(id, newStore);
    return newStore;
  }
  
  async updateStore(id: number, store: InsertStore): Promise<Store | undefined> {
    const existingStore = this.stores.get(id);
    if (!existingStore) return undefined;
    
    const updatedStore: Store = {
      ...existingStore,
      ...store,
    };
    
    this.stores.set(id, updatedStore);
    return updatedStore;
  }
  
  async deleteStore(id: number): Promise<boolean> {
    return this.stores.delete(id);
  }
  
  // Database connection methods
  async getAllDbConnections(): Promise<DbConnection[]> {
    return Array.from(this.dbConnections.values());
  }
  
  async getDbConnectionById(id: number): Promise<DbConnection | undefined> {
    return this.dbConnections.get(id);
  }
  
  async getDbConnectionByStoreId(storeId: number): Promise<DbConnection | undefined> {
    return Array.from(this.dbConnections.values()).find(
      (conn) => conn.storeId === storeId
    );
  }
  
  async createDbConnection(connection: InsertDbConnection): Promise<DbConnection> {
    const id = this.dbConnectionIdCounter++;
    const now = new Date().toISOString();
    
    const newConnection: DbConnection = {
      ...connection,
      id,
      createdAt: now
    };
    
    this.dbConnections.set(id, newConnection);
    return newConnection;
  }
  
  async updateDbConnection(id: number, connection: InsertDbConnection): Promise<DbConnection | undefined> {
    const existingConnection = this.dbConnections.get(id);
    if (!existingConnection) return undefined;
    
    const updatedConnection: DbConnection = {
      ...existingConnection,
      ...connection
    };
    
    this.dbConnections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  async deleteDbConnection(id: number): Promise<boolean> {
    return this.dbConnections.delete(id);
  }
  
  // Update methods
  async getAllUpdates(): Promise<Update[]> {
    return Array.from(this.updates.values());
  }
  
  async getRecentUpdates(limit: number = 4): Promise<Update[]> {
    return Array.from(this.updates.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async getUpdateById(id: number): Promise<Update | undefined> {
    return this.updates.get(id);
  }
  
  async createUpdate(update: InsertUpdate): Promise<Update> {
    const id = this.updateIdCounter++;
    const now = new Date().toISOString();
    
    const newUpdate: Update = {
      ...update,
      id,
      createdAt: now,
      completedAt: null
    };
    
    this.updates.set(id, newUpdate);
    return newUpdate;
  }
  
  async completeUpdate(id: number, status: 'completed' | 'partial' | 'failed', details?: any): Promise<Update | undefined> {
    const update = this.updates.get(id);
    if (!update) return undefined;
    
    const now = new Date().toISOString();
    const completedUpdate: Update = {
      ...update,
      status,
      completedAt: now,
      details: details ? JSON.stringify(details) : null
    };
    
    this.updates.set(id, completedUpdate);
    return completedUpdate;
  }
  
  async deleteUpdate(id: number): Promise<boolean> {
    return this.updates.delete(id);
  }
  
  // Update details methods
  async getUpdateDetails(updateId: number): Promise<UpdateDetail[]> {
    return Array.from(this.updateDetails.values()).filter(
      (detail) => detail.updateId === updateId
    );
  }
  
  async getUpdateDetailsByStoreId(storeId: number): Promise<UpdateDetail[]> {
    return Array.from(this.updateDetails.values()).filter(
      (detail) => detail.storeId === storeId
    );
  }
  
  async createUpdateDetail(detail: InsertUpdateDetail): Promise<UpdateDetail> {
    const id = this.updateDetailIdCounter++;
    const now = new Date().toISOString();
    
    const newDetail: UpdateDetail = {
      ...detail,
      id,
      createdAt: now
    };
    
    this.updateDetails.set(id, newDetail);
    return newDetail;
  }
  
  async deleteUpdateDetail(id: number): Promise<boolean> {
    return this.updateDetails.delete(id);
  }
  
  // Dashboard stats methods
  async getTotalProducts(): Promise<number> {
    // In memory implementation, just return a sample count
    return 1250;
  }
  
  async getRecentUpdatesCount(): Promise<number> {
    // Count updates in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return Array.from(this.updates.values()).filter(
      update => new Date(update.createdAt) >= sevenDaysAgo
    ).length;
  }
  
  async getConnectedStoresCount(): Promise<number> {
    return Array.from(this.dbConnections.values()).filter(
      conn => conn.isActive
    ).length;
  }
  
  async getTotalStoresCount(): Promise<number> {
    return this.stores.size;
  }
  
  async getLastUpdateTime(): Promise<string | null> {
    const updates = Array.from(this.updates.values())
      .filter(update => update.status === 'completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return updates.length > 0 ? updates[0].createdAt : null;
  }
}