/**
 * This file contains adapters to update database storage methods to use snake_case field names
 */

import { storage } from '../database-storage';
import { db } from '../db';
import { 
  User, 
  InsertUser, 
  InsertStore, 
  InsertDbConnection, 
  InsertUpdate, 
  InsertUpdateDetail,
  updateDetails 
} from '@shared/schema';

/**
 * Creates an update detail with correct snake_case field names
 */
export async function createUpdateDetail(detail: any) {
  try {
    // Bypass the storage interface and directly insert into the database
    console.log("Creating update detail with values:", JSON.stringify(detail));
    
    // Map directly to the database schema fields
    const result = await db.insert(updateDetails).values({
      update_id: detail.update_id,
      store_id: detail.store_id,
      sku: detail.sku,
      product_id: detail.product_id || 0,
      old_price: detail.old_regular_price,
      new_price: detail.new_regular_price,
      old_quantity: detail.old_quantity,
      new_quantity: detail.new_quantity,
      status: detail.success ? 'success' : 'failed',
      created_at: new Date().toISOString()
    }).returning();
    
    return result[0];
  } catch (error) {
    console.error("Error creating update detail:", error);
    throw error;
  }
}

/**
 * Create update record with correct snake_case field names
 */
export async function createUpdate(update: {
  user_id: number;
  filename: string;
  products_count: number;
  status: string;
  details: any;
}) {
  // Convert snake_case to camelCase for database-storage module
  return storage.createUpdate({
    userId: update.user_id,
    filename: update.filename,
    productsCount: update.products_count,
    status: update.status,
    details: update.details
  });
}

/**
 * Get update by ID wrapper function
 */
export async function getUpdateById(id: number) {
  return storage.getUpdateById(id);
}

/**
 * Complete update wrapper function
 */
export async function completeUpdate(id: number, status: 'completed' | 'partial' | 'failed', details?: any) {
  return storage.completeUpdate(id, status, details);
}

/**
 * Get store by ID wrapper function
 */
export async function getStoreById(id: number) {
  return storage.getStoreById(id);
}

/**
 * Get DB connection by store ID wrapper function
 */
export async function getDbConnectionByStoreId(id: number) {
  return storage.getDbConnectionByStoreId(id);
}

/**
 * Get update details wrapper function
 */
export async function getUpdateDetails(id: number) {
  return storage.getUpdateDetails(id);
}