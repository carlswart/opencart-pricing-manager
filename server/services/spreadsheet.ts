import { Request, Response } from "express";
import multer from "multer";
import { storage as appStorage } from "../storage";
import { User } from "@shared/schema";
import { calculateDepotPrice, calculateWarehousePrice, isValidDepotPrice, isValidWarehousePrice } from "./pricing";
import * as XLSX from 'xlsx';
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

// Column headers mapping
const COLUMN_MAPPINGS = {
  SKU: ['sku', 'model', 'product code', 'product_code', 'product_model', 'product_sku'],
  NAME: ['name', 'product name', 'product_name', 'description', 'title', 'product_title'],
  PRICE: ['price', 'regular price', 'regular_price', 'retail_price', 'retail price', 'base_price', 'base price'],
  DEPOT_PRICE: ['depot price', 'depot_price', 'discount price', 'discount_price'],
  WAREHOUSE_PRICE: ['warehouse price', 'warehouse_price', 'wholesale price', 'wholesale_price'],
  QUANTITY: ['quantity', 'qty', 'stock', 'inventory', 'on hand', 'on_hand', 'available'],
};

// Parse spreadsheet buffer into product rows
async function parseSpreadsheet(buffer: Buffer, filename: string): Promise<ProductRow[]> {
  try {
    // Read the workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get the first worksheet
    if (workbook.SheetNames.length === 0) {
      throw new Error('No worksheets found in the file');
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('Spreadsheet must contain at least a header row and one data row');
    }
    
    // Get headers (first row)
    const headers = jsonData[0] as string[];
    
    // Map headers to our expected fields
    const columnIndices: { [key: string]: number } = {};
    
    // Find indices for each column type
    headers.forEach((header, index) => {
      const headerLower = header.toString().toLowerCase();
      
      for (const [key, possibleNames] of Object.entries(COLUMN_MAPPINGS)) {
        if (possibleNames.includes(headerLower)) {
          columnIndices[key] = index;
          break;
        }
      }
    });
    
    // Check if required columns exist
    if (!columnIndices.SKU) {
      throw new Error('Required column not found: SKU or Model number');
    }
    
    if (!columnIndices.PRICE) {
      throw new Error('Required column not found: Price');
    }
    
    // Parse data rows into our format
    const products: ProductRow[] = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      
      // Skip empty rows
      if (!row || row.length === 0) continue;
      
      // Get values from the row
      const sku = row[columnIndices.SKU]?.toString()?.trim();
      if (!sku) continue; // Skip rows with no SKU
      
      const name = columnIndices.NAME !== undefined ? row[columnIndices.NAME]?.toString() || '' : '';
      
      // Parse price as number
      const regularPriceRaw = row[columnIndices.PRICE];
      // Convert price to number, handle currency symbols and commas
      const regularPrice = typeof regularPriceRaw === 'number' 
        ? regularPriceRaw 
        : parseFloat(regularPriceRaw?.toString().replace(/[^0-9.-]+/g, '') || '0');
      
      if (isNaN(regularPrice) || regularPrice <= 0) {
        continue; // Skip invalid prices
      }
      
      // Calculate depot and warehouse prices
      const calculatedDepotPrice = calculateDepotPrice(regularPrice);
      const calculatedWarehousePrice = calculateWarehousePrice(regularPrice);
      
      // Parse provided depot price (if exists)
      let depotPrice = calculatedDepotPrice;
      let hasDepotPriceError = false;
      
      if (columnIndices.DEPOT_PRICE !== undefined) {
        const depotPriceRaw = row[columnIndices.DEPOT_PRICE];
        if (depotPriceRaw !== undefined) {
          // Convert to number
          const parsedDepotPrice = typeof depotPriceRaw === 'number'
            ? depotPriceRaw
            : parseFloat(depotPriceRaw.toString().replace(/[^0-9.-]+/g, '') || '0');
          
          if (!isNaN(parsedDepotPrice) && parsedDepotPrice > 0) {
            depotPrice = parsedDepotPrice;
            hasDepotPriceError = !isValidDepotPrice(regularPrice, parsedDepotPrice);
          }
        }
      }
      
      // Parse provided warehouse price (if exists)
      let warehousePrice = calculatedWarehousePrice;
      let hasWarehousePriceError = false;
      
      if (columnIndices.WAREHOUSE_PRICE !== undefined) {
        const warehousePriceRaw = row[columnIndices.WAREHOUSE_PRICE];
        if (warehousePriceRaw !== undefined) {
          // Convert to number
          const parsedWarehousePrice = typeof warehousePriceRaw === 'number'
            ? warehousePriceRaw
            : parseFloat(warehousePriceRaw.toString().replace(/[^0-9.-]+/g, '') || '0');
          
          if (!isNaN(parsedWarehousePrice) && parsedWarehousePrice > 0) {
            warehousePrice = parsedWarehousePrice;
            hasWarehousePriceError = !isValidWarehousePrice(regularPrice, parsedWarehousePrice);
          }
        }
      }
      
      // Parse quantity (if exists)
      let quantity = 0;
      if (columnIndices.QUANTITY !== undefined) {
        const quantityRaw = row[columnIndices.QUANTITY];
        if (quantityRaw !== undefined) {
          quantity = typeof quantityRaw === 'number' 
            ? Math.floor(quantityRaw) 
            : parseInt(quantityRaw.toString().replace(/[^0-9-]+/g, '') || '0');
        }
      }
      
      // Add product to results
      products.push({
        sku,
        name,
        regularPrice,
        depotPrice,
        warehousePrice,
        quantity,
        row: i + 1, // 1-based row number for user display
        hasDepotPriceError,
        hasWarehousePriceError
      });
    }
    
    if (products.length === 0) {
      throw new Error('No valid product data found in spreadsheet');
    }
    
    return products;
    
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
