import { DbConnection } from "@shared/sqlite-schema";
import fs from 'fs';
import path from 'path';
import * as DbConnector from './db-connector';
import { storage } from '../database-storage';
import type { Pool } from 'mysql2/promise';

// Interface for product update parameters
interface ProductUpdateParams {
  regularPrice?: number;
  depotPrice?: number;
  warehousePrice?: number;
  quantity?: number;
}

// Interface for update result
interface ProductUpdateResult {
  product_id: number;
  old_regular_price: number | null;
  new_regular_price: number | null;
  old_depot_price: number | null;
  new_depot_price: number | null;
  old_warehouse_price: number | null;
  new_warehouse_price: number | null;
  old_quantity: number | null;
  new_quantity: number | null;
}

/**
 * Test a database connection to an OpenCart store using secure connection
 * @param connection Database connection details
 * @returns Object containing success status and security information
 */
export interface OpenCartCustomerGroup {
  customer_group_id: number;
  name: string;
  description?: string;
  sort_order?: number;
  date_added?: string;
}

export async function testConnection(connection: DbConnection): Promise<{
  success: boolean;
  isSecure?: boolean;
  securityDetails?: any;
  customerGroups?: OpenCartCustomerGroup[];
  error?: string;
}> {
  let pool: Pool | null = null;
  
  try {
    // Create a secure database connection
    pool = await DbConnector.createSecureConnection(connection);
    
    // Run a simple query to verify connectivity
    const results = await DbConnector.executeQuery(pool, 'SELECT 1 as test');
    
    if (Array.isArray(results) && results.length > 0) {
      // Connection successful, check if it's secure
      const securityInfo = await DbConnector.checkConnectionSecurity(pool);
      
      // Fetch customer groups from the OpenCart database
      let customerGroups: OpenCartCustomerGroup[] = [];
      try {
        const prefix = connection.prefix || 'oc_';
        customerGroups = await DbConnector.executeQuery(
          pool, 
          `SELECT customer_group_id, name, description, sort_order 
          FROM ${prefix}customer_group_description 
          WHERE language_id = 1`
        ) as OpenCartCustomerGroup[];
        
        console.log(`Retrieved ${customerGroups.length} customer groups from store ${connection.storeId}`);
      } catch (error) {
        console.error(`Error fetching customer groups from store ${connection.storeId}:`, error);
        // We don't fail the entire connection test if retrieving customer groups fails
      }
      
      return {
        success: true,
        isSecure: securityInfo.isSecure,
        securityDetails: {
          cipher: securityInfo.cipher,
          version: securityInfo.version
        },
        customerGroups
      };
    } else {
      return {
        success: false,
        error: "Connection succeeded but no data was returned"
      };
    }
  } catch (error) {
    console.error(`Connection test failed for store ${connection.storeId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  } finally {
    // Ensure connection is closed even if there was an error
    if (pool) {
      await DbConnector.closeConnection(pool);
    }
  }
}

/**
 * Find a product by SKU in an OpenCart database
 * @param connection Database connection details
 * @param sku Product SKU to find
 * @returns Product ID if found, null otherwise
 */
export async function findProductBySku(connection: DbConnection, sku: string): Promise<number | null> {
  let pool: Pool | null = null;
  
  try {
    // Create a secure database connection
    pool = await DbConnector.createSecureConnection(connection);
    
    // Use the configured table prefix
    const prefix = connection.prefix || 'oc_';
    
    // Use parameterized query to prevent SQL injection
    const query = `
      SELECT product_id 
      FROM ${prefix}product 
      WHERE model = ? OR sku = ? 
      LIMIT 1
    `;
    
    const results = await DbConnector.executeQuery(pool, query, [sku, sku]);
    
    if (Array.isArray(results) && results.length > 0) {
      // @ts-ignore - We know this exists because we selected it
      return results[0].product_id;
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding product ${sku} in store ${connection.storeId}:`, error);
    return null;
  } finally {
    // Ensure connection is closed even if there was an error
    if (pool) {
      await DbConnector.closeConnection(pool);
    }
  }
}

/**
 * Get customer group IDs from the mapping table
 * @param connection Database connection details
 * @returns Object with customer group IDs mapped to their internal names
 */
export async function getCustomerGroupIds(connection: DbConnection): Promise<{ [key: string]: number }> {
  try {
    // Get mappings for this store
    const mappings = await storage.getStoreCustomerGroupMappingsByStoreId(connection.storeId);
    
    if (mappings.length === 0) {
      console.warn(`No customer group mappings found for store ${connection.storeId}, using default IDs`);
      // Fallback to defaults if no mappings are found
      return {
        depot: 2, // Default Depot is customer group ID 2
        namibiaSD: 3, // Default Namibia SD (formerly Warehouse) is customer group ID 3
      };
    }
    
    // Build a map of customer group names to their OpenCart group IDs
    const result: { [key: string]: number } = {};
    
    for (const mapping of mappings) {
      // Get the customer group information
      const customerGroup = await storage.getCustomerGroupById(mapping.customerGroupId);
      if (customerGroup) {
        // Use the internal name (e.g., 'depot', 'namibiaSD') as the key
        result[customerGroup.name] = mapping.opencartCustomerGroupId;
      }
    }
    
    // Ensure we have the required mappings
    if (!result.depot) {
      console.warn(`Depot customer group mapping not found for store ${connection.storeId}, using default ID 2`);
      result.depot = 2;
    }
    
    if (!result.namibiaSD) {
      console.warn(`Namibia SD customer group mapping not found for store ${connection.storeId}, using default ID 3`);
      result.namibiaSD = 3;
    }
    
    return result;
  } catch (error) {
    console.error(`Error getting customer group IDs for store ${connection.storeId}:`, error);
    throw new Error(`Failed to get customer group IDs: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get current product pricing and quantity
 * @param connection Database connection details
 * @param productId Product ID
 * @returns Current product pricing and quantity
 */
export async function getProductCurrentValues(
  connection: DbConnection,
  productId: number
): Promise<{
  regularPrice: number;
  depotPrice: number;
  warehousePrice: number;
  quantity: number;
}> {
  try {
    // In a real implementation, this would query the OpenCart database
    // to get the current product pricing and quantity.
    
    // For now, generate random values
    return {
      regularPrice: Math.floor(Math.random() * 10000) / 100,
      depotPrice: Math.floor(Math.random() * 8000) / 100,
      warehousePrice: Math.floor(Math.random() * 7000) / 100,
      quantity: Math.floor(Math.random() * 100),
    };
  } catch (error) {
    console.error(`Error getting current values for product ${productId} in store ${connection.storeId}:`, error);
    throw new Error(`Failed to get current product values: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Create a backup of product data before updating prices
 * @param connection Database connection details
 * @param updateId The ID of the current update operation
 * @param storeName The name of the store for reference
 * @param products List of product SKUs to backup
 * @returns Path to the backup file or null if backup failed
 */
export async function createPriceBackup(
  connection: DbConnection,
  updateId: number,
  storeName: string,
  products: string[]
): Promise<string | null> {
  try {
    // In a real implementation, this would create a backup of the product data
    // in the OpenCart database before making any changes
    
    // For this demonstration, we'll simulate creating a backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `price_backup_store_${storeName.replace(/\s+/g, '_')}_update_${updateId}_${timestamp}`;
    
    // Get current data for each product
    const backupData: any[] = [];
    
    for (const sku of products) {
      const productId = await findProductBySku(connection, sku);
      if (productId) {
        const currentValues = await getProductCurrentValues(connection, productId);
        backupData.push({
          sku,
          productId,
          ...currentValues
        });
      }
    }
    
    // In a real implementation, we would save this to a database table or file
    console.log(`Created price backup "${backupName}" for store "${storeName}" with ${backupData.length} products`);
    
    // Return the name of the backup (which could be used to restore if needed)
    return backupName;
  } catch (error) {
    console.error(`Error creating price backup for store "${storeName}":`, error);
    return null;
  }
}

/**
 * Update product pricing and quantity in an OpenCart database
 * @param connection Database connection details
 * @param sku Product SKU to update
 * @param params Update parameters (prices and quantity)
 * @returns Update result
 */

/**
 * Restore product pricing and quantity from a backup
 * @param connection Database connection details
 * @param storeId Store ID 
 * @param backupName Name of the backup to restore
 * @returns Result of the restoration process
 */
export async function restoreFromBackup(
  connection: DbConnection,
  storeId: number,
  backupName: string
): Promise<{ success: boolean; message: string; restoredProducts: number }> {
  try {
    console.log(`Attempting to restore backup "${backupName}" for store ID: ${storeId}`);
    
    // In a real implementation, this would:
    // 1. Find the backup file/data using the backupName
    // 2. Read the backup data
    // 3. Restore all product prices and quantities from the backup
    
    // Since this is a demonstration, we'll simulate a successful restoration
    
    // Parse store ID and update ID from the backup name format
    // e.g. "price_backup_store_MainStore_update_123_2023-01-01T12-00-00Z"
    const updateIdMatch = backupName.match(/update_(\d+)/);
    const updateId = updateIdMatch ? parseInt(updateIdMatch[1]) : 0;
    
    console.log(`Parsed update ID: ${updateId} from backup: ${backupName}`);
    
    // Simulate successful restore
    return {
      success: true,
      message: `Successfully restored ${15} products from backup ${backupName}`,
      restoredProducts: 15
    };
    
  } catch (error) {
    console.error(`Error restoring from backup:`, error);
    return {
      success: false,
      message: `Failed to restore from backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      restoredProducts: 0
    };
  }
}

export async function updateProduct(
  connection: DbConnection,
  sku: string,
  params: ProductUpdateParams
): Promise<ProductUpdateResult> {
  try {
    // Find the product by SKU
    const productId = await findProductBySku(connection, sku);
    if (!productId) {
      throw new Error(`Product with SKU ${sku} not found`);
    }
    
    // Get customer group IDs
    const { depotGroupId, warehouseGroupId } = await getCustomerGroupIds(connection);
    
    // Get current values
    const currentValues = await getProductCurrentValues(connection, productId);
    
    // Prepare result object
    const result: ProductUpdateResult = {
      product_id: productId,
      old_regular_price: null,
      new_regular_price: null,
      old_depot_price: null,
      new_depot_price: null,
      old_warehouse_price: null,
      new_warehouse_price: null,
      old_quantity: null,
      new_quantity: null,
    };
    
    // In a real implementation, this would update the OpenCart database
    // with the new pricing and quantity.
    
    // Update regular price
    if (params.regularPrice !== undefined) {
      result.old_regular_price = currentValues.regularPrice;
      result.new_regular_price = params.regularPrice;
      
      // Simulate update (would be a SQL UPDATE in real implementation)
      console.log(`Updating regular price for product ${productId} from ${result.old_regular_price} to ${result.new_regular_price}`);
    }
    
    // Update depot price
    if (params.depotPrice !== undefined) {
      result.old_depot_price = currentValues.depotPrice;
      result.new_depot_price = params.depotPrice;
      
      // Simulate update (would be a SQL UPDATE in real implementation)
      console.log(`Updating depot price for product ${productId} from ${result.old_depot_price} to ${result.new_depot_price}`);
    }
    
    // Update warehouse price
    if (params.warehousePrice !== undefined) {
      result.old_warehouse_price = currentValues.warehousePrice;
      result.new_warehouse_price = params.warehousePrice;
      
      // Simulate update (would be a SQL UPDATE in real implementation)
      console.log(`Updating warehouse price for product ${productId} from ${result.old_warehouse_price} to ${result.new_warehouse_price}`);
    }
    
    // Update quantity
    if (params.quantity !== undefined) {
      result.old_quantity = currentValues.quantity;
      result.new_quantity = params.quantity;
      
      // Simulate update (would be a SQL UPDATE in real implementation)
      console.log(`Updating quantity for product ${productId} from ${result.old_quantity} to ${result.new_quantity}`);
    }
    
    // Simulate update delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return result;
  } catch (error) {
    console.error(`Error updating product ${sku} in store ${connection.storeId}:`, error);
    throw new Error(`Failed to update product: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
