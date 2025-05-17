/**
 * This file contains adapters to update database storage methods to use snake_case field names
 */

import { storage } from '../database-storage';
import { db } from '../db';
import Database from 'better-sqlite3';
import path from 'path';
import { 
  User, 
  InsertUser, 
  InsertStore, 
  InsertDbConnection, 
  InsertUpdate, 
  InsertUpdateDetail,
  updateDetails 
} from '@shared/schema';

// Create direct connection to the database for raw SQL operations
const dbPath = path.join(process.cwd(), 'data', 'app.db');
const sqlite = new Database(dbPath);

/**
 * Creates an update detail with correct snake_case field names
 */
export async function createUpdateDetail(detail: any) {
  try {
    // Use raw SQL to directly insert the record, bypassing all ORMs to avoid any field mapping issues
    console.log("Creating update detail with values:", JSON.stringify(detail));
    
    // Prepare the values for direct insertion with SQL
    const status = detail.success ? 'success' : 'failed';
    const product_id = detail.product_id || 0;
    const old_price = detail.old_regular_price !== undefined ? detail.old_regular_price : null;
    const new_price = detail.new_regular_price !== undefined ? detail.new_regular_price : null;
    const old_quantity = detail.old_quantity !== undefined ? detail.old_quantity : null;
    const new_quantity = detail.new_quantity !== undefined ? detail.new_quantity : null;
    const created_at = new Date().toISOString();
    
    // Use direct SQL insertion
    const stmt = sqlite.prepare(`
      INSERT INTO update_details 
      (update_id, store_id, product_id, sku, old_price, new_price, old_quantity, new_quantity, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Use the prepared statement to insert the data
    const info = stmt.run(
      detail.update_id,
      detail.store_id,
      product_id,
      detail.sku,
      old_price,
      new_price,
      old_quantity,
      new_quantity,
      status,
      created_at
    );
    
    // Get the inserted ID
    const id = info.lastInsertRowid;
    
    // Fetch the inserted record
    const selectStmt = sqlite.prepare("SELECT * FROM update_details WHERE id = ?");
    const record = selectStmt.get(id);
    
    // Convert to camelCase for return
    return {
      id: record.id,
      updateId: record.update_id,
      storeId: record.store_id,
      productId: record.product_id,
      sku: record.sku,
      oldPrice: record.old_price,
      newPrice: record.new_price,
      oldQuantity: record.old_quantity,
      newQuantity: record.new_quantity,
      status: record.status,
      createdAt: record.created_at
    };
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