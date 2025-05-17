/**
 * This file contains adapters to update database storage methods to use snake_case field names
 */

import { storage } from '../database-storage';
import { 
  User, 
  InsertUser, 
  InsertStore, 
  InsertDbConnection, 
  InsertUpdate, 
  InsertUpdateDetail 
} from '@shared/schema';

/**
 * Creates an update detail with correct snake_case field names
 */
export async function createUpdateDetail(detail: any) {
  // Create a clean object with only the fields needed by the database schema
  const cleanDetail = {
    updateId: detail.update_id,
    storeId: detail.store_id,
    sku: detail.sku,
    productId: detail.product_id || 0,
    oldPrice: detail.old_regular_price || null,
    newPrice: detail.new_regular_price || null,
    oldQuantity: detail.old_quantity || null,
    newQuantity: detail.new_quantity || null,
    status: detail.success ? 'success' : 'failed'
  };
  
  try {
    return await storage.createUpdateDetail(cleanDetail);
  } catch (error) {
    console.error("Error creating update detail:", error, "Detail:", cleanDetail);
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