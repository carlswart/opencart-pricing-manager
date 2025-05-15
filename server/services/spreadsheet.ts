import { Request, Response } from "express";
import multer from "multer";
import { storage as appStorage } from "../database-storage";
import { User, DbConnection } from "@shared/sqlite-schema";
import { calculateDepotPrice, calculateWarehousePrice, isValidDepotPrice, isValidWarehousePrice } from "./pricing";
import * as XLSX from 'xlsx';

// Extend the Request type to include multer's file property
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}
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
      // Return a more useful error message to the client
      res.status(400).json({ 
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
        user_id: user.id,
        filename: req.file.originalname,
        products_count: products.length,
        status: 'completed',
        details: {}
      });
      
      // Start processing updates asynchronously
      processUpdates(update.id, products, stores, updateOptions);
      
      // Return the update ID for progress tracking
      res.json({ updateId: update.id });
    } catch (error) {
      console.error("Error processing spreadsheet:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to process spreadsheet" 
      });
    }
  }
];

// Column headers mapping
const COLUMN_MAPPINGS = {
  SKU: ['sku', 'model', 'product code', 'product_code', 'product_model', 'product_sku', 'product sku', 'model number', 'model_number', 'item code', 'item_code', 'item number', 'item_number', 'article', 'article number', 'article_number', 'code', 'id', 'product id', 'product_id', 'reference', 'ref', 'ref no', 'part number', 'part no'],
  NAME: ['name', 'product name', 'product_name', 'description', 'title', 'product_title', 'product title', 'item', 'item name', 'item_name', 'product description', 'product_description', 'item description', 'item_description'],
  PRICE: ['price', 'regular price', 'regular_price', 'retail_price', 'retail price', 'base_price', 'base price', 'normal price', 'normal_price', 'selling price', 'selling_price', 'unit price', 'unit_price', 'list price', 'list_price', 'price (regular)', 'price_regular', 'srp', 'recommended price', 'full price', 'price (zar)', 'price zar', 'zar price', 'zar', 'rand price', 'price (rand)', 'rrp', 'recommended retail price', 'msrp'],
  DEPOT_PRICE: ['depot price', 'depot_price', 'discount price', 'discount_price', 'depot', 'special price', 'special_price', 'sale price', 'sale_price', 'depot discount', 'depot_discount', 'price (depot)', 'price_depot', 'tier 1 price', 'tier1 price', 'tier_1_price', 'tier1', 'tier 1', 'tier_1', 'dealer price', 'dealer_price', 'trade price', 'trade_price'],
  WAREHOUSE_PRICE: ['warehouse price', 'warehouse_price', 'wholesale price', 'wholesale_price', 'warehouse', 'bulk price', 'bulk_price', 'distributor price', 'distributor_price', 'trade price', 'trade_price', 'price (warehouse)', 'price_warehouse', 'b2b price', 'b2b_price', 'tier 2 price', 'tier2 price', 'tier_2_price', 'tier2', 'tier 2', 'tier_2'],
  QUANTITY: ['quantity', 'qty', 'stock', 'inventory', 'on hand', 'on_hand', 'available', 'stock level', 'stock_level', 'count', 'on-hand', 'in stock', 'in_stock', 'stock quantity', 'stock_quantity', 'units', 'on shelf', 'on_shelf', 'available stock', 'available_stock', 'qty on hand', 'qty_on_hand'],
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
    
    // Find indices for each column type using fuzzy matching
    headers.forEach((header, index) => {
      if (!header) return; // Skip empty headers
      
      const headerLower = header.toString().toLowerCase().trim();
      
      // Try exact match first
      for (const [key, possibleNames] of Object.entries(COLUMN_MAPPINGS)) {
        if (possibleNames.includes(headerLower)) {
          columnIndices[key] = index;
          break;
        }
      }
      
      // If no exact match, try partial match (contains)
      if (Object.keys(columnIndices).length < Object.keys(COLUMN_MAPPINGS).length) {
        for (const [key, possibleNames] of Object.entries(COLUMN_MAPPINGS)) {
          // Skip if we already found this column
          if (columnIndices[key] !== undefined) continue;
          
          // Try to find a column that contains one of our known names
          for (const name of possibleNames) {
            if (headerLower.includes(name)) {
              columnIndices[key] = index;
              console.log(`Found partial match for ${key}: "${header}" contains "${name}"`);
              break;
            }
          }
        }
      }
    });
    
    console.log("Detected columns:", columnIndices);
    
    // Check if required columns exist and provide helpful error messages
    const missingColumns = [];
    
    if (columnIndices.SKU === undefined) {
      missingColumns.push("SKU/Model Number");
    }
    
    if (columnIndices.PRICE === undefined) {
      missingColumns.push("Price");
    }
    
    if (missingColumns.length > 0) {
      // Create a helpful error message with column examples
      const errorMessage = `Required columns not found: ${missingColumns.join(", ")}.\n\n` +
        `Your spreadsheet should include the following column headers:\n` +
        `- SKU/Model: ${COLUMN_MAPPINGS.SKU.slice(0, 5).join(", ")}...\n` +
        `- Price: ${COLUMN_MAPPINGS.PRICE.slice(0, 5).join(", ")}...\n\n` +
        `Optional columns:\n` +
        `- Product Name: ${COLUMN_MAPPINGS.NAME.slice(0, 3).join(", ")}...\n` +
        `- Depot Price: ${COLUMN_MAPPINGS.DEPOT_PRICE.slice(0, 3).join(", ")}...\n` +
        `- Warehouse Price: ${COLUMN_MAPPINGS.WAREHOUSE_PRICE.slice(0, 3).join(", ")}...\n` +
        `- Quantity: ${COLUMN_MAPPINGS.QUANTITY.slice(0, 3).join(", ")}...`;
      
      throw new Error(errorMessage);
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
  
  // Check if SKUs exist in the selected stores
  try {
    const notFoundSkus = new Map<string, string[]>(); // SKU -> store names where not found
    
    // Fetch all store connections first
    const storeConnections = new Map<number, { store: { id: number, name: string }, connection: DbConnection }>();
    
    for (const storeId of storeIds) {
      const store = await appStorage.getStoreById(storeId);
      if (!store) {
        issues.push(`Store ID ${storeId} not found`);
        continue;
      }
      
      const connection = await appStorage.getDbConnectionByStoreId(storeId);
      if (!connection) {
        issues.push(`No database connection found for store "${store.name}"`);
        continue;
      }
      
      storeConnections.set(storeId, { store, connection });
    }
    
    // Check each product SKU across all selected stores
    // Use Promise.all for better performance when checking many products
    await Promise.all(products.map(async (product) => {
      let foundInAnyStore = false;
      
      // Convert Map iterator to array for compatibility
      for (const [_, { store, connection }] of Array.from(storeConnections.entries())) {
        try {
          const productId = await OpenCartService.findProductBySku(connection, product.sku);
          
          if (productId) {
            foundInAnyStore = true;
          } else {
            // Track stores where this SKU isn't found
            if (!notFoundSkus.has(product.sku)) {
              notFoundSkus.set(product.sku, []);
            }
            notFoundSkus.get(product.sku)!.push(store.name);
          }
        } catch (error) {
          console.error(`Error checking SKU ${product.sku} in store ${store.name}:`, error);
          // Don't add to issues, as connection errors will be shown separately
        }
      }
    }));
    
    // Report issues with SKUs not found in stores
    // Convert Map iterator to array for compatibility
    for (const [sku, storeNames] of Array.from(notFoundSkus.entries())) {
      if (storeNames.length === storeConnections.size) {
        issues.push(`SKU ${sku} not found in any store`);
      } else {
        issues.push(`SKU ${sku} not found in stores: ${storeNames.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error("Error validating products:", error);
    issues.push(`Error validating products: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  
  return issues;
}

// Main function to process updates for all products across stores
async function processUpdates(
  updateId: number, 
  products: ProductRow[], 
  storeIds: number[], 
  updateOptions: any = {}): Promise<void> {
  console.log(`Processing update #${updateId} with ${products.length} products across ${storeIds.length} stores`);
  
  try {
    // Get update record to update status
    const update = await appStorage.getUpdateById(updateId);
    if (!update) {
      throw new Error(`Update ${updateId} not found`);
    }
    
    // Track success/failure stats
    let successCount = 0;
    let failedCount = 0;
    
    // Load store connections
    console.log(`Loading connections for ${storeIds.length} stores...`);
    for (const storeId of storeIds) {
      const store = await appStorage.getStoreById(storeId);
      if (!store) {
        console.error(`Store ID ${storeId} not found, skipping`);
        // Create an update detail to record this error
        for (const product of products) {
          await appStorage.createUpdateDetail({
            update_id: updateId,
            store_id: storeId,
            sku: product.sku,
            product_id: null,
            old_regular_price: null,
            new_regular_price: null,
            old_depot_price: null,
            new_depot_price: null,
            old_warehouse_price: null,
            new_warehouse_price: null,
            old_quantity: null,
            new_quantity: null,
            success: false,
            error_message: `Store with ID ${storeId} not found`
          });
          failedCount++;
        }
        continue;
      }
      
      console.log(`Processing store: ${store.name} (ID: ${store.id})`);
      
      // Get database connection for this store
      const connection = await appStorage.getDbConnectionByStoreId(storeId);
      if (!connection) {
        console.error(`No database connection found for store "${store.name}", skipping`);
        // Create an update detail to record this error
        for (const product of products) {
          await appStorage.createUpdateDetail({
            update_id: updateId,
            store_id: storeId,
            sku: product.sku,
            product_id: null,
            old_regular_price: null,
            new_regular_price: null,
            old_depot_price: null,
            new_depot_price: null,
            old_warehouse_price: null,
            new_warehouse_price: null,
            old_quantity: null,
            new_quantity: null,
            success: false,
            error_message: `No database connection configured for store "${store.name}"`
          });
          failedCount++;
        }
        continue;
      }
      
      // Test connection
      try {
        const isConnected = await OpenCartService.testConnection(connection);
        if (!isConnected) {
          console.error(`Failed to connect to database for store "${store.name}", skipping`);
          
          // Create update details for all products to record this error
          for (const product of products) {
            await appStorage.createUpdateDetail({
              update_id: updateId,
              store_id: storeId,
              sku: product.sku,
              product_id: null,
              old_regular_price: null,
              new_regular_price: null,
              old_depot_price: null,
              new_depot_price: null,
              old_warehouse_price: null,
              new_warehouse_price: null,
              old_quantity: null,
              new_quantity: null,
              success: false,
              error_message: `Failed to connect to database for store "${store.name}"`
            });
            failedCount++;
          }
          continue;
        }
      } catch (error) {
        console.error(`Error testing connection for store "${store.name}":`, error);
        
        // Create update details for all products to record this error
        for (const product of products) {
          await appStorage.createUpdateDetail({
            update_id: updateId,
            store_id: storeId,
            sku: product.sku,
            product_id: null,
            old_regular_price: null,
            new_regular_price: null,
            old_depot_price: null,
            new_depot_price: null,
            old_warehouse_price: null,
            new_warehouse_price: null,
            old_quantity: null,
            new_quantity: null,
            success: false,
            error_message: `Connection error for store "${store.name}": ${error instanceof Error ? error.message : "Unknown error"}`
          });
          failedCount++;
        }
        continue;
      }
      
      // Process each product for this store
      console.log(`Processing ${products.length} products for store "${store.name}"`);
      
      let storeSuccessCount = 0;
      let storeFailedCount = 0;
      
      // Process products sequentially to avoid database connection issues
      for (const product of products) {
        try {
          // Find product in store
          const productId = await OpenCartService.findProductBySku(connection, product.sku);
          
          if (!productId) {
            console.log(`Product with SKU "${product.sku}" not found in store "${store.name}", skipping`);
            
            await appStorage.createUpdateDetail({
              update_id: updateId,
              store_id: storeId,
              sku: product.sku,
              product_id: null,
              old_regular_price: null,
              new_regular_price: null,
              old_depot_price: null,
              new_depot_price: null,
              old_warehouse_price: null,
              new_warehouse_price: null,
              old_quantity: null,
              new_quantity: null,
              success: false,
              error_message: `Product with SKU "${product.sku}" not found in store "${store.name}"`
            });
            
            storeFailedCount++;
            continue;
          }
          
          // Get current values
          const currentValues = await OpenCartService.getProductCurrentValues(connection, productId);
          
          // Determine what needs to be updated based on options
          const updatePrices = updateOptions.updatePrices !== false; // Default true
          const updateQuantity = updateOptions.updateQuantity === true; // Default false
          const updateSpecialPrices = updateOptions.updateSpecialPrices !== false; // Default true
          
          let changesMade = false;
          
          // Update the product data
          const result = await OpenCartService.updateProduct(
            connection, 
            productId, 
            product,
            {
              updatePrices,
              updateQuantity,
              updateSpecialPrices,
              currentValues
            }
          );
          
          if (result.changes > 0) {
            changesMade = true;
          }
          
          // Record the updates
          if (changesMade) {
            await appStorage.createUpdateDetail({
              update_id: updateId,
              store_id: storeId,
              sku: product.sku,
              product_id: result.productId,
              old_regular_price: result.oldRegularPrice,
              new_regular_price: result.newRegularPrice,
              old_depot_price: result.oldDepotPrice,
              new_depot_price: result.newDepotPrice,
              old_warehouse_price: result.oldWarehousePrice,
              new_warehouse_price: result.newWarehousePrice,
              old_quantity: result.oldQuantity,
              new_quantity: result.newQuantity,
              success: true,
              error_message: null
            });
            
            storeSuccessCount++;
          } else {
            // No changes needed (values already match)
            await appStorage.createUpdateDetail({
              update_id: updateId,
              store_id: storeId,
              sku: product.sku,
              product_id: result.productId,
              old_regular_price: result.oldRegularPrice,
              new_regular_price: result.oldRegularPrice, // No change
              old_depot_price: result.oldDepotPrice,
              new_depot_price: result.oldDepotPrice, // No change
              old_warehouse_price: result.oldWarehousePrice,
              new_warehouse_price: result.oldWarehousePrice, // No change
              old_quantity: result.oldQuantity,
              new_quantity: result.oldQuantity, // No change
              success: true,
              error_message: 'No changes needed based on selected update options'
            });
            
            // Still count as success since we found the product and processed it
            storeSuccessCount++;
          }
          
        } catch (error) {
          console.error(`Error updating product "${product.sku}" in store "${store.name}":`, error);
          
          await appStorage.createUpdateDetail({
            update_id: updateId,
            store_id: storeId,
            sku: product.sku,
            product_id: null,
            old_regular_price: null,
            new_regular_price: null,
            old_depot_price: null,
            new_depot_price: null,
            old_warehouse_price: null,
            new_warehouse_price: null,
            old_quantity: null,
            new_quantity: null,
            success: false,
            error_message: `Update failed: ${error instanceof Error ? error.message : "Unknown error"}`
          });
          
          storeFailedCount++;
        }
      }
      
      console.log(`Completed processing for store "${store.name}": ${storeSuccessCount} successful, ${storeFailedCount} failed`);
      successCount += storeSuccessCount;
      failedCount += storeFailedCount;
    }
    
    // Record update completion
    console.log(`Completed update #${updateId}: ${successCount} successful, ${failedCount} failed`);
    
    if (failedCount === 0) {
      // All products succeeded
      await appStorage.completeUpdate(updateId, 'completed');
    } else if (successCount === 0) {
      // All products failed
      await appStorage.completeUpdate(updateId, 'failed');
    } else {
      // Mixed results
      const updateDetails = {
        success_count: successCount,
        failed_count: failedCount,
        total_count: successCount + failedCount
      };
      
      await appStorage.completeUpdate(updateId, 'partial', updateDetails);
    }
    
  } catch (error) {
    console.error(`Error processing update #${updateId}:`, error);
    try {
      await appStorage.completeUpdate(updateId, 'failed', {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } catch (e) {
      console.error(`Failed to update the status of update #${updateId}:`, e);
    }
  }
}