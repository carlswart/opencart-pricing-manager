import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import * as SpreadsheetService from "./services/spreadsheet";
import * as OpenCartService from "./services/opencart";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertStoreSchema, 
  insertUpdateSchema, 
  insertDbConnectionSchema,
  insertUserSchema,
  InsertUser
} from "@shared/sqlite-schema";
import { hash } from "./auth-utils";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Admin-only middleware
  const adminOnly = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user?.role === 'admin') {
      return next();
    }
    res.status(403).json({ message: "Admin privileges required" });
  };
  
  // Dashboard stats
  app.get("/api/dashboard/stats", authenticate, async (req, res) => {
    try {
      const totalProducts = await storage.getTotalProducts();
      const recentUpdates = await storage.getRecentUpdatesCount();
      const connectedStores = await storage.getConnectedStoresCount();
      const totalStores = await storage.getTotalStoresCount();
      const lastUpdate = await storage.getLastUpdateTime();
      const productsChange = "+3.2%"; // For demonstration, would calculate this in a real app
      
      res.json({
        totalProducts,
        recentUpdates,
        connectedStores: `${connectedStores}/${totalStores}`,
        lastUpdateTime: lastUpdate || "Never",
        productsChange,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  
  // User routes - admin only
  app.get("/api/users", adminOnly, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.post("/api/users", adminOnly, async (req, res) => {
    try {
      
      // Validate request data
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password before saving
      const hashedPassword = await hash(validatedData.password);
      
      // Create the user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  app.put("/api/users/:id", adminOnly, async (req, res) => {
    try {
      
      const id = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Extract and validate update data
      const { username, password, name, role } = req.body;
      
      // Create update object
      const updateData: Partial<InsertUser> = {};
      if (name) updateData.name = name;
      if (role) updateData.role = role;
      
      // Only update password if provided
      if (password) {
        updateData.password = await hash(password);
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(id, updateData);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  app.delete("/api/users/:id", adminOnly, async (req, res) => {
    try {
      
      const id = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deleting your own account
      if (id === req.user.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      
      // Delete the user
      const success = await storage.deleteUser(id);
      
      if (success) {
        res.json({ success: true, message: "User deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Store routes - admin only
  app.get("/api/stores", adminOnly, async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });
  
  app.post("/api/stores", adminOnly, async (req, res) => {
    try {
      const validatedData = insertStoreSchema.parse(req.body);
      const store = await storage.createStore(validatedData);
      res.status(201).json(store);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating store:", error);
      res.status(500).json({ message: "Failed to create store" });
    }
  });
  
  app.delete("/api/stores/:id", adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if store exists
      const store = await storage.getStoreById(id);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Get the references from update_details for this store
      const updateDetails = await storage.getUpdateDetailsByStoreId(id);
      
      // Get unique update IDs to check if we need to delete any updates
      const updateIds = Array.from(new Set(updateDetails.map(detail => detail.updateId)));
      
      // For each update detail related to this store, delete it
      for (const detail of updateDetails) {
        await storage.deleteUpdateDetail(detail.id);
      }
      
      // After clearing update details, check if any updates are now empty and can be deleted
      for (const updateId of updateIds) {
        const remainingDetails = await storage.getUpdateDetails(updateId);
        if (remainingDetails.length === 0) {
          // If no details remain, delete the update
          await storage.deleteUpdate(updateId);
        }
      }
      
      // Check if store has database connection and delete if present
      const connection = await storage.getDbConnectionByStoreId(id);
      if (connection) {
        await storage.deleteDbConnection(connection.id);
      }
      
      // Finally delete the store
      const success = await storage.deleteStore(id);
      
      if (success) {
        res.json({ success: true, message: "Store deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete store" });
      }
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).json({ message: "Failed to delete store" });
    }
  });
  
  // Database connection routes - admin only
  app.get("/api/database/connections", adminOnly, async (req, res) => {
    try {
      const connections = await storage.getAllDbConnections();
      res.json(connections);
    } catch (error) {
      console.error("Error fetching database connections:", error);
      res.status(500).json({ message: "Failed to fetch database connections" });
    }
  });
  
  app.post("/api/database/test-connection", adminOnly, async (req, res) => {
    try {
      const connectionData = req.body;
      const result = await OpenCartService.testConnection(connectionData);
      if (result.success) {
        res.json({ 
          success: true, 
          message: "Connection successful",
          isSecure: result.isSecure,
          securityDetails: result.securityDetails
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Connection failed", 
          error: result.error 
        });
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      res.status(500).json({ 
        message: "Failed to test connection",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.post("/api/database/connections", adminOnly, async (req, res) => {
    try {
      const validatedData = insertDbConnectionSchema.parse(req.body);
      const connection = await storage.createDbConnection(validatedData);
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating connection:", error);
      res.status(500).json({ message: "Failed to create connection" });
    }
  });
  
  app.put("/api/database/connections/:id", adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDbConnectionSchema.parse(req.body);
      const connection = await storage.updateDbConnection(id, validatedData);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      res.json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating connection:", error);
      res.status(500).json({ message: "Failed to update connection" });
    }
  });
  
  app.delete("/api/database/connections/:id", adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDbConnection(id);
      if (!success) {
        return res.status(404).json({ message: "Connection not found" });
      }
      res.json({ success: true, message: "Connection deleted successfully" });
    } catch (error) {
      console.error("Error deleting connection:", error);
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });
  
  // Spreadsheet processing routes
  app.post("/api/spreadsheet/preview", authenticate, SpreadsheetService.handlePreview);
  app.post("/api/spreadsheet/process", authenticate, SpreadsheetService.handleProcess);
  
  // Backup restore endpoint
  app.post("/api/backups/restore", authenticate, async (req, res) => {
    try {
      const { storeId, backupName } = req.body;
      
      if (!storeId || !backupName) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required parameters: storeId and backupName are required" 
        });
      }
      
      // Get the store to verify it exists
      const store = await storage.getStoreById(storeId);
      if (!store) {
        return res.status(404).json({ 
          success: false, 
          message: "Store not found" 
        });
      }
      
      // Get the database connection for this store
      const connection = await storage.getDbConnectionByStoreId(storeId);
      if (!connection) {
        return res.status(404).json({ 
          success: false, 
          message: "No database connection found for this store" 
        });
      }
      
      // Attempt to restore from the backup
      const result = await OpenCartService.restoreFromBackup(connection, storeId, backupName);
      
      // Return the result
      res.json(result);
    } catch (error) {
      console.error("Error restoring from backup:", error);
      res.status(500).json({ 
        success: false, 
        message: `Failed to restore from backup: ${error instanceof Error ? error.message : "Unknown error"}` 
      });
    }
  });
  
  // Update history routes
  app.get("/api/updates/recent", authenticate, async (req, res) => {
    try {
      const updates = await storage.getRecentUpdates();
      res.json(updates);
    } catch (error) {
      console.error("Error fetching recent updates:", error);
      res.status(500).json({ message: "Failed to fetch recent updates" });
    }
  });
  
  app.get("/api/updates/history", authenticate, async (req, res) => {
    try {
      const updates = await storage.getAllUpdates();
      res.json(updates);
    } catch (error) {
      console.error("Error fetching update history:", error);
      res.status(500).json({ message: "Failed to fetch update history" });
    }
  });
  
  app.get("/api/updates/:id/details", authenticate, async (req, res) => {
    try {
      const updateId = parseInt(req.params.id);
      const update = await storage.getUpdateById(updateId);
      if (!update) {
        return res.status(404).json({ message: "Update not found" });
      }
      
      const details = await storage.getUpdateDetails(updateId);
      
      if (!details || details.length === 0) {
        return res.status(404).json({ message: "No details found for this update" });
      }
      
      // Check if there are any backups stored in the update details
      let backupInfo: any = {};
      if (update.details && typeof update.details === 'object') {
        const details = update.details as any;
        if (details.backups) {
          backupInfo = details.backups;
        }
      }
      
      // Get all stores to display store names with backups
      const stores = await storage.getAllStores();
      const storeMap = new Map(stores.map(store => [store.id, store]));
      
      // Format according to what SpreadsheetPreviewModal expects
      const previewData = {
        filename: update.filename || "Unknown File",
        recordCount: update.productsCount || details.length,
        validationIssues: [], // These would be stored in the update.details in a real app
        rows: details.map(detail => ({
          sku: detail.sku,
          name: `Product ${detail.sku}`, // Use the SKU as a fallback name
          regularPrice: detail.newRegularPrice || 0,
          depotPrice: detail.newDepotPrice || 0,
          warehousePrice: detail.newWarehousePrice || 0,
          quantity: detail.newQuantity || 0,
          hasDepotPriceError: false,
          hasWarehousePriceError: false,
        })),
        // Add backup information
        backups: Object.entries(backupInfo).map(([storeId, backupName]) => ({
          storeId: parseInt(storeId),
          storeName: storeMap.get(parseInt(storeId))?.name || 'Unknown Store',
          backupName: backupName as string
        })),
        hasBackups: Object.keys(backupInfo).length > 0
      };
      
      res.json(previewData);
    } catch (error) {
      console.error("Error fetching update details:", error);
      res.status(500).json({ message: "Failed to fetch update details" });
    }
  });
  
  app.get("/api/updates/:id/progress", authenticate, async (req, res) => {
    try {
      const updateId = parseInt(req.params.id);
      const update = await storage.getUpdateById(updateId);
      if (!update) {
        return res.status(404).json({ message: "Update not found" });
      }
      
      // Find all unique store IDs that were actually updated in this batch
      // by checking the update details
      const updateDetails = await storage.getUpdateDetails(updateId);
      
      // Extract unique store IDs from the update details
      const updatedStoreIds = [...new Set(updateDetails.map(detail => detail.storeId))];
      
      // If no stores were found in details, return an empty list
      if (updatedStoreIds.length === 0) {
        res.json({
          overall: update.completedAt ? 100 : 0,
          stores: [],
        });
        return;
      }
      
      // Fetch only the stores that were actually updated
      const allStores = await storage.getAllStores();
      const updatedStores = allStores.filter(store => updatedStoreIds.includes(store.id));
      
      // For a complete update, return 100% progress
      if (update.completedAt) {
        res.json({
          overall: 100,
          stores: updatedStores.map(store => ({
            id: store.id,
            name: store.name,
            progress: 100,
          })),
        });
        return;
      }
      
      // In a real app, this would fetch the actual progress from a tracking system
      // Simulate progress for this example
      const progress = Math.min(
        Math.floor(
          (Date.now() - new Date(update.createdAt).getTime()) / 100
        ),
        100
      );
      
      res.json({
        overall: progress,
        stores: updatedStores.map(store => ({
          id: store.id,
          name: store.name,
          // Randomly vary progress per store for demonstration
          progress: Math.min(
            Math.floor(progress * (0.5 + Math.random() * 0.5)),
            100
          ),
        })),
      });
    } catch (error) {
      console.error("Error fetching update progress:", error);
      res.status(500).json({ message: "Failed to fetch update progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
