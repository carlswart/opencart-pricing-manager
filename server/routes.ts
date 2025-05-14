import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import * as SpreadsheetService from "./services/spreadsheet";
import * as OpenCartService from "./services/opencart";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertStoreSchema, insertUpdateSchema, insertDbConnectionSchema } from "@shared/schema";

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
  
  // Store routes
  app.get("/api/stores", authenticate, async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });
  
  app.post("/api/stores", authenticate, async (req, res) => {
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
  
  // Database connection routes
  app.get("/api/database/connections", authenticate, async (req, res) => {
    try {
      const connections = await storage.getAllDbConnections();
      res.json(connections);
    } catch (error) {
      console.error("Error fetching database connections:", error);
      res.status(500).json({ message: "Failed to fetch database connections" });
    }
  });
  
  app.post("/api/database/test-connection", authenticate, async (req, res) => {
    try {
      const connectionData = req.body;
      const success = await OpenCartService.testConnection(connectionData);
      if (success) {
        res.json({ success: true, message: "Connection successful" });
      } else {
        res.status(400).json({ success: false, message: "Connection failed" });
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      res.status(500).json({ message: "Failed to test connection" });
    }
  });
  
  app.post("/api/database/connections", authenticate, async (req, res) => {
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
  
  app.put("/api/database/connections/:id", authenticate, async (req, res) => {
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
  
  app.delete("/api/database/connections/:id", authenticate, async (req, res) => {
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
      const previewData = {
        filename: update.filename,
        recordCount: update.productsCount,
        validationIssues: [], // These would be stored in the update.details in a real app
        rows: details.map(detail => ({
          sku: detail.sku,
          name: "Product Name", // This would be stored in the update.details in a real app
          regularPrice: detail.newRegularPrice,
          depotPrice: detail.newDepotPrice,
          warehousePrice: detail.newWarehousePrice,
          quantity: detail.newQuantity,
          hasDepotPriceError: false,
          hasWarehousePriceError: false,
        })),
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
      
      // For a complete update, return 100% progress
      if (update.completedAt) {
        const stores = await storage.getAllStores();
        res.json({
          overall: 100,
          stores: stores.map(store => ({
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
      
      const stores = await storage.getAllStores();
      res.json({
        overall: progress,
        stores: stores.map(store => ({
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
