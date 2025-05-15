/**
 * This file contains adapters to update database storage methods to use snake_case field names
 */

import { storage as appStorage } from '../database-storage';
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
export async function createUpdateDetail(detail: {
  update_id: number;
  store_id: number;
  sku: string;
  product_id: number | null;
  old_regular_price: number | null;
  new_regular_price: number | null;
  old_depot_price: number | null;
  new_depot_price: number | null;
  old_warehouse_price: number | null;
  new_warehouse_price: number | null;
  old_quantity: number | null;
  new_quantity: number | null;
  success: boolean;
  error_message: string | null;
}) {
  // Convert to camelCase for existing function
  return appStorage.createUpdateDetail({
    updateId: detail.update_id,
    storeId: detail.store_id,
    sku: detail.sku,
    productId: detail.product_id,
    oldPrice: detail.old_regular_price,  // Simplified for compatibility
    newPrice: detail.new_regular_price,  // Simplified for compatibility
    oldQuantity: detail.old_quantity,
    newQuantity: detail.new_quantity,
    success: detail.success,
    errorMessage: detail.error_message
  });
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
  // Convert to camelCase for existing function
  return appStorage.createUpdate({
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
  return appStorage.getUpdateById(id);
}

/**
 * Complete update wrapper function
 */
export async function completeUpdate(id: number, status: 'completed' | 'partial' | 'failed', details?: any) {
  return appStorage.completeUpdate(id, status, details);
}

/**
 * Get store by ID wrapper function
 */
export async function getStoreById(id: number) {
  return appStorage.getStoreById(id);
}

/**
 * Get DB connection by store ID wrapper function
 */
export async function getDbConnectionByStoreId(id: number) {
  return appStorage.getDbConnectionByStoreId(id);
}

/**
 * Get update details wrapper function
 */
export async function getUpdateDetails(id: number) {
  return appStorage.getUpdateDetails(id);
}