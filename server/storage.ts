import { 
  User, 
  InsertUser, 
  Store, 
  InsertStore, 
  DbConnection, 
  InsertDbConnection, 
  Update, 
  InsertUpdate, 
  UpdateDetail, 
  InsertUpdateDetail 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  completeUpdate(id: number, status: 'completed' | 'partial' | 'failed'): Promise<Update | undefined>;
  
  // Update details methods
  getUpdateDetails(updateId: number): Promise<UpdateDetail[]>;
  createUpdateDetail(detail: InsertUpdateDetail): Promise<UpdateDetail>;
  
  // Dashboard stats methods
  getTotalProducts(): Promise<number>;
  getRecentUpdatesCount(): Promise<number>;
  getConnectedStoresCount(): Promise<number>;
  getTotalStoresCount(): Promise<number>;
  getLastUpdateTime(): Promise<string | null>;
}

export class MemStorage implements IStorage {
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
    
    // Create initial admin user
    const adminUser = {
      username: 'admin',
      password: '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', // 'password'
      name: 'John Powell',
      role: 'admin'
    };
    
    console.log('Creating admin user:', adminUser.username);
    this.createUser(adminUser);
    
    // Create sample stores
    this.initializeSampleData();
  }
  
  // Initialize sample data for demonstration
  private initializeSampleData() {
    // Create sample stores
    const store1 = this.createStore({
      name: 'Store 1',
      url: 'store1.example.com'
    });
    
    const store2 = this.createStore({
      name: 'Store 2',
      url: 'store2.example.com'
    });
    
    const store3 = this.createStore({
      name: 'Store 3',
      url: 'store3.example.com'
    });
    
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
    
    this.createDbConnection({
      storeId: store3.id,
      host: 'db.store3.example.com',
      port: '3306',
      database: 'store3_opencart',
      username: 'store3_user',
      password: 'password3',
      prefix: 'oc_',
      isActive: true
    });
    
    // Create sample updates
    const update1 = this.createUpdate({
      userId: 1,
      filename: 'october_price_update.xlsx',
      productsCount: 124,
      status: 'completed',
      details: { validationIssues: [] }
    });
    
    const update2 = this.createUpdate({
      userId: 1,
      filename: 'seasonal_discount.xlsx',
      productsCount: 56,
      status: 'completed',
      details: { validationIssues: [] }
    });
    
    const update3 = this.createUpdate({
      userId: 1,
      filename: 'inventory_update.xlsx',
      productsCount: 87,
      status: 'partial',
      details: { validationIssues: ['Some products not found'] }
    });
    
    const update4 = this.createUpdate({
      userId: 1,
      filename: 'q4_adjustments.xlsx',
      productsCount: 215,
      status: 'failed',
      details: { validationIssues: ['Database connection error'] }
    });
    
    // Complete the updates
    this.completeUpdate(update1.id, 'completed');
    this.completeUpdate(update2.id, 'completed');
    this.completeUpdate(update3.id, 'partial');
    this.completeUpdate(update4.id, 'failed');
    
    // Add some update details
    this.createUpdateDetail({
      updateId: update1.id,
      storeId: store1.id,
      sku: 'ABC123',
      productId: 1001,
      oldRegularPrice: 1999,
      newRegularPrice: 2499,
      oldDepotPrice: 1639,
      newDepotPrice: 2049,
      oldWarehousePrice: 1479,
      newWarehousePrice: 1849,
      oldQuantity: 50,
      newQuantity: 75,
      success: true
    });
    
    this.createUpdateDetail({
      updateId: update1.id,
      storeId: store2.id,
      sku: 'DEF456',
      productId: 1002,
      oldRegularPrice: 1799,
      newRegularPrice: 1999,
      oldDepotPrice: 1475,
      newDepotPrice: 1639,
      oldWarehousePrice: 1331,
      newWarehousePrice: 1479,
      oldQuantity: 100,
      newQuantity: 120,
      success: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const newUser: User = {
      ...user,
      id,
      createdAt: now
    };
    this.users.set(id, newUser);
    return newUser;
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
    const now = new Date();
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
    const now = new Date();
    const newConnection: DbConnection = {
      ...connection,
      id,
      lastConnected: null,
      createdAt: now,
      updatedAt: now
    };
    this.dbConnections.set(id, newConnection);
    return newConnection;
  }
  
  async updateDbConnection(id: number, connection: InsertDbConnection): Promise<DbConnection | undefined> {
    const existingConnection = this.dbConnections.get(id);
    if (!existingConnection) return undefined;
    
    const now = new Date();
    const updatedConnection: DbConnection = {
      ...existingConnection,
      ...connection,
      updatedAt: now
    };
    this.dbConnections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  async deleteDbConnection(id: number): Promise<boolean> {
    return this.dbConnections.delete(id);
  }
  
  // Update methods
  async getAllUpdates(): Promise<Update[]> {
    return Array.from(this.updates.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    const now = new Date();
    const newUpdate: Update = {
      ...update,
      id,
      completedAt: null,
      createdAt: now
    };
    this.updates.set(id, newUpdate);
    return newUpdate;
  }
  
  async completeUpdate(id: number, status: 'completed' | 'partial' | 'failed'): Promise<Update | undefined> {
    const existingUpdate = this.updates.get(id);
    if (!existingUpdate) return undefined;
    
    const now = new Date();
    const completedUpdate: Update = {
      ...existingUpdate,
      status,
      completedAt: now
    };
    this.updates.set(id, completedUpdate);
    return completedUpdate;
  }
  
  // Update details methods
  async getUpdateDetails(updateId: number): Promise<UpdateDetail[]> {
    return Array.from(this.updateDetails.values())
      .filter(detail => detail.updateId === updateId);
  }
  
  async createUpdateDetail(detail: InsertUpdateDetail): Promise<UpdateDetail> {
    const id = this.updateDetailIdCounter++;
    const now = new Date();
    const newDetail: UpdateDetail = {
      ...detail,
      id,
      createdAt: now
    };
    this.updateDetails.set(id, newDetail);
    return newDetail;
  }
  
  // Dashboard stats methods
  async getTotalProducts(): Promise<number> {
    // In a real app, this would query the store databases
    // For now, return a mock number
    return 2458;
  }
  
  async getRecentUpdatesCount(): Promise<number> {
    // Count updates in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return Array.from(this.updates.values())
      .filter(update => new Date(update.createdAt) >= thirtyDaysAgo)
      .length;
  }
  
  async getConnectedStoresCount(): Promise<number> {
    // Count stores that have an active database connection
    const storeIds = new Set(Array.from(this.dbConnections.values())
      .filter(conn => conn.isActive)
      .map(conn => conn.storeId));
      
    return storeIds.size;
  }
  
  async getTotalStoresCount(): Promise<number> {
    return this.stores.size;
  }
  
  async getLastUpdateTime(): Promise<string | null> {
    // Find the most recent completed update
    const updates = Array.from(this.updates.values())
      .filter(update => update.completedAt !== null)
      .sort((a, b) => {
        // TypeScript safe handling of potentially null completedAt
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      });
      
    if (updates.length === 0 || !updates[0].completedAt) {
      return null;
    }
    
    // Format the date
    const date = new Date(updates[0].completedAt);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const storage = new MemStorage();
