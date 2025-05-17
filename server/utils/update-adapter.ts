/**
 * Adapter for update-related database operations
 * Handles field name conversions between database (snake_case) and application (camelCase)
 */
import { db } from '../db';
import { transformToCamelCase, transformToSnakeCase } from './field-mapping';
import * as schema from '@shared/schema';

/**
 * Get all updates with proper field mapping
 * @returns Array of updates with camelCase field names
 */
export async function getAllUpdates() {
  try {
    // Directly query the database with SQL for maximum flexibility
    const results = await db.query.updates.findMany({
      orderBy: (updates, { desc }) => [desc(updates.created_at)],
    });
    
    // Convert from snake_case to camelCase
    return results.map(update => transformToCamelCase(update));
  } catch (error) {
    console.error('Error in getAllUpdates:', error);
    return [];
  }
}

/**
 * Get update details for a specific update
 * @param updateId The ID of the update to get details for
 * @returns Array of update details with camelCase field names
 */
export async function getUpdateDetails(updateId: number) {
  try {
    // Directly query the database for maximum flexibility
    // Using the correct schema field name (updateDetails instead of update_details)
    const results = await db.query.updateDetails.findMany({
      where: (details, { eq }) => eq(details.updateId, updateId),
    });
    
    // Convert from snake_case to camelCase
    return results.map(detail => {
      const transformed = transformToCamelCase(detail);
      
      // Add fallback product name if it doesn't exist
      if (!transformed.name) {
        transformed.name = `Product ${transformed.sku || transformed.productId || 'Unknown'}`;
      }
      
      return transformed;
    });
  } catch (error) {
    console.error(`Error in getUpdateDetails for updateId ${updateId}:`, error);
    return [];
  }
}

/**
 * Create a realistic fallback update record for demonstration when using test data
 * @param updateId The ID of the update (usually a timestamp)
 * @returns A realistic update record
 */
export function createFallbackUpdate(updateId: number) {
  return {
    id: updateId,
    createdAt: new Date(updateId).toISOString(),
    filename: "Pricelist - Test1.xlsx",
    status: "completed",
    productsCount: 2,
    userId: 1,
    stores: ["MP Test 2"]
  };
}

/**
 * Create realistic fallback update details for demonstration
 * @returns Array of realistic update details
 */
export function createFallbackUpdateDetails() {
  return [
    {
      id: 1,
      sku: "BT-540-002",
      model: "BT-540-002",
      name: "Table Lamp",
      oldRegularPrice: 70,
      newRegularPrice: 70,
      oldDepotPrice: 57,
      newDepotPrice: 57,
      oldWarehousePrice: 52,
      newWarehousePrice: 52,
      oldQuantity: 10,
      newQuantity: 10,
      store: "MP Test 2",
      status: "updated"
    },
    {
      id: 2,
      sku: "H-590-071",
      model: "H-590-071",
      name: "Office Chair",
      oldRegularPrice: 350,
      newRegularPrice: 350,
      oldDepotPrice: 287,
      newDepotPrice: 287,
      oldWarehousePrice: 259,
      newWarehousePrice: 259,
      oldQuantity: 33,
      newQuantity: 33,
      store: "MP Test 2",
      status: "updated"
    }
  ];
}