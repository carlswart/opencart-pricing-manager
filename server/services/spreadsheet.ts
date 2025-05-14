import { Request, Response } from "express";
import multer from "multer";
import { storage as appStorage } from "../storage";
import { User } from "@shared/schema";
import { calculateDepotPrice, calculateWarehousePrice } from "./pricing";
import * as OpenCartService from "./opencart";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Type for spreadsheet row
interface ProductRow {
  sku: string;
  name?: string;
  regularPrice: number;
  depotPrice?: number;
  warehousePrice?: number;
  quantity?: number;
  row: number;
  hasDepotPriceError?: boolean;
  hasWarehousePriceError?: boolean;
}

// Handle spreadsheet preview
export const handlePreview = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Parse options from request
      const options = req.body.options ? JSON.parse(req.body.options) : {};
      const { stores = [], updateOptions = {} } = options;
      
      if (stores.length === 0) {
        return res.status(400).json({ message: "No stores selected" });
      }
      
      // Parse spreadsheet
      const products = await parseSpreadsheet(req.file.buffer, req.file.originalname);
      
      // Validate SKUs exist in the stores
      const validationIssues = await validateProducts(products, stores);
      
      // Return preview data
      res.json({
        filename: req.file.originalname,
        recordCount: products.length,
        validationIssues,
        rows: products.slice(0, 100), // Limit preview rows
      });
    } catch (error) {
      console.error("Error previewing spreadsheet:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to preview spreadsheet" 
      });
    }
  }
];

// Handle spreadsheet processing
export const handleProcess = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Parse options from request
      const options = req.body.options ? JSON.parse(req.body.options) : {};
      const { stores = [], updateOptions = {} } = options;
      
      if (stores.length === 0) {
        return res.status(400).json({ message: "No stores selected" });
      }
      
      // Parse spreadsheet
      const products = await parseSpreadsheet(req.file.buffer, req.file.originalname);
      
      // Create update record
      const user = req.user as User;
      const update = await appStorage.createUpdate({
        userId: user.id,
        filename: req.file.originalname,
        productsCount: products.length,
        status: 'completed',
        details: {}
      });
      
      // Start processing updates asynchronously
      processUpdates(update.id, products, stores, updateOptions);
      
      // Return the update ID for progress tracking
      res.json({ updateId: update.id });
    } catch (error) {
      console.error("Error processing spreadsheet:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process spreadsheet" 
      });
    }
  }
];

// Parse spreadsheet buffer into product rows
async function parseSpreadsheet(buffer: Buffer, filename: string): Promise<ProductRow[]> {
  try {
    // In a real implementation, this would use a library like xlsx
    // to parse the actual file. For this implementation, we'll simulate parsing.
    
    // Generate some sample data based on file name
    const sampleData: ProductRow[] = [];
    const productCount = Math.floor(Math.random() * 100) + 50;
    
    for (let i = 1; i <= productCount; i++) {
      const sku = `SKU${i.toString().padStart(4, '0')}`;
      const regularPrice = Math.floor(Math.random() * 10000) / 100; // Random price between 0 and 100
      const calculatedDepotPrice = calculateDepotPrice(regularPrice);
      const calculatedWarehousePrice = calculateWarehousePrice(regularPrice);
      
      // Simulate some validation errors
      const hasDepotPriceError = Math.random() > 0.9;
      const hasWarehousePriceError = Math.random() > 0.9;
      
      sampleData.push({
        sku,
        name: `Product ${i}`,
        regularPrice,
        depotPrice: hasDepotPriceError ? calculatedDepotPrice + 1 : calculatedDepotPrice,
        warehousePrice: hasWarehousePriceError ? calculatedWarehousePrice + 1 : calculatedWarehousePrice,
        quantity: Math.floor(Math.random() * 100) + 10,
        row: i,
        hasDepotPriceError,
        hasWarehousePriceError
      });
    }
    
    return sampleData;
  } catch (error) {
    console.error("Error parsing spreadsheet:", error);
    throw new Error(`Failed to parse spreadsheet: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Validate products against store databases
async function validateProducts(products: ProductRow[], storeIds: number[]): Promise<string[]> {
  const issues: string[] = [];
  
  // Check for duplicate SKUs
  const skus = new Set<string>();
  const duplicates = new Set<string>();
  
  products.forEach(product => {
    if (skus.has(product.sku)) {
      duplicates.add(product.sku);
    } else {
      skus.add(product.sku);
    }
  });
  
  if (duplicates.size > 0) {
    issues.push(`Duplicate SKUs found: ${Array.from(duplicates).join(', ')}`);
  }
  
  // Count price validation errors
  let depotPriceErrors = 0;
  let warehousePriceErrors = 0;
  
  products.forEach(product => {
    if (product.hasDepotPriceError) {
      depotPriceErrors++;
    }
    if (product.hasWarehousePriceError) {
      warehousePriceErrors++;
    }
  });
  
  if (depotPriceErrors > 0) {
    issues.push(`${depotPriceErrors} rows have incorrect Depot prices (should be 18% discount, rounded to nearest whole number)`);
  }
  
  if (warehousePriceErrors > 0) {
    issues.push(`${warehousePriceErrors} rows have incorrect Warehouse prices (should be 26% discount, rounded to nearest whole number)`);
  }
  
  // Check if SKUs exist in the stores
  // In a real implementation, this would query each store's database
  // to verify that the SKUs exist. For now, we'll simulate some results.
  const nonExistentSkus = products
    .filter(() => Math.random() > 0.95) // Randomly flag some SKUs as not found
    .map(product => product.sku);
  
  if (nonExistentSkus.length > 0) {
    const sampleSku = nonExistentSkus[0];
    issues.push(`SKU "${sampleSku}" not found in any connected store (row ${products.find(p => p.sku === sampleSku)?.row || 0})`);
  }
  
  return issues;
}

// Process updates asynchronously
async function processUpdates(
  updateId: number, 
  products: ProductRow[], 
  storeIds: number[], 
  updateOptions: any
) {
  try {
    const update = await appStorage.getUpdateById(updateId);
    if (!update) {
      throw new Error(`Update ${updateId} not found`);
    }
    
    let success = true;
    let failedCount = 0;
    
    // Process each store
    for (const storeId of storeIds) {
      const store = await appStorage.getStoreById(storeId);
      if (!store) {
        console.error(`Store ${storeId} not found`);
        continue;
      }
      
      const connection = await appStorage.getDbConnectionByStoreId(storeId);
      if (!connection) {
        console.error(`No database connection found for store ${storeId}`);
        continue;
      }
      
      // Process each product for this store
      for (const product of products) {
        try {
          // In a real implementation, this would use the OpenCart service
          // to update the product in the store's database.
          const result = await OpenCartService.updateProduct(
            connection,
            product.sku,
            {
              regularPrice: updateOptions.updateRegularPrices ? product.regularPrice : undefined,
              depotPrice: updateOptions.updateDepotPrices ? product.depotPrice : undefined,
              warehousePrice: updateOptions.updateWarehousePrices ? product.warehousePrice : undefined,
              quantity: updateOptions.updateQuantities ? product.quantity : undefined,
            }
          );
          
          // Record the update detail
          await appStorage.createUpdateDetail({
            updateId,
            storeId,
            sku: product.sku,
            productId: result.productId,
            oldRegularPrice: result.oldRegularPrice,
            newRegularPrice: result.newRegularPrice,
            oldDepotPrice: result.oldDepotPrice,
            newDepotPrice: result.newDepotPrice,
            oldWarehousePrice: result.oldWarehousePrice,
            newWarehousePrice: result.newWarehousePrice,
            oldQuantity: result.oldQuantity,
            newQuantity: result.newQuantity,
            success: true
          });
        } catch (error) {
          failedCount++;
          
          // Record the failed update
          await appStorage.createUpdateDetail({
            updateId,
            storeId,
            sku: product.sku,
            productId: null,
            oldRegularPrice: null,
            newRegularPrice: null,
            oldDepotPrice: null,
            newDepotPrice: null,
            oldWarehousePrice: null,
            newWarehousePrice: null,
            oldQuantity: null,
            newQuantity: null,
            success: false,
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          });
          
          if (failedCount > products.length * 0.1) { // If more than 10% failed
            success = false;
          }
        }
      }
    }
    
    // Update status
    const status = success ? 'completed' : (failedCount < products.length ? 'partial' : 'failed');
    await appStorage.completeUpdate(updateId, status);
  } catch (error) {
    console.error("Error processing updates:", error);
    await appStorage.completeUpdate(updateId, 'failed');
  }
}
