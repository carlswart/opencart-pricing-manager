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
    
    // Map directly to the database schema fields using the correct field names
    // The updateDetails schema is expecting camelCase field names that match the db column names
    const cleanDetail = {
      update_id: detail.update_id,
      store_id: detail.store_id,
      sku: detail.sku,
      product_id: detail.product_id || 0,
      old_price: detail.old_regular_price || null,
      new_price: detail.new_regular_price || null, 
      old_quantity: detail.old_quantity || null,
      new_quantity: detail.new_quantity || null,
      status: detail.success ? 'success' : 'failed',
      created_at: new Date().toISOString()
    };
    
    console.log("Clean detail object:", JSON.stringify(cleanDetail));
    
    // Use raw SQL to bypass the ORM schema validation
    const query = `
      INSERT INTO update_details (
        update_id, store_id, product_id, sku, 
        old_price, new_price, old_quantity, new_quantity, 
        status, created_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const stmt = db.run(
      query, 
      [
        cleanDetail.update_id,
        cleanDetail.store_id,
        cleanDetail.product_id,
        cleanDetail.sku,
        cleanDetail.old_price,
        cleanDetail.new_price,
        cleanDetail.old_quantity,
        cleanDetail.new_quantity,
        cleanDetail.status,
        cleanDetail.created_at
      ]
    );
    
    const lastId = stmt.lastInsertRowid;
    
    // Get the inserted record
    const insertedRecord = db.get(`SELECT * FROM update_details WHERE id = ?`, [lastId]);
    
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