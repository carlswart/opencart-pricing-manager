/**
 * Database adapter to handle field mapping between database and application
 */
import { db } from './db';
import { SQL, eq } from 'drizzle-orm';
import { SQLiteTable, SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { transformToCamelCase, transformToSnakeCase } from './utils/field-mapping';

/**
 * Database adapter to handle field mapping between database and application
 */
export class DbAdapter {
  /**
   * Select records from a table and convert field names to camelCase
   * @param table The table to select from
   * @param whereClause Optional where clause
   * @returns Records with camelCase field names
   */
  static async select<T extends SQLiteTable>(
    table: T, 
    whereClause?: SQL<unknown> | undefined
  ): Promise<Record<string, any>[]> {
    const query = db.select().from(table);
    
    if (whereClause) {
      query.where(whereClause);
    }
    
    const results = await query;
    return results.map(record => transformToCamelCase(record));
  }

  /**
   * Get a record by ID
   * @param table The table to select from
   * @param idColumn The ID column
   * @param id The ID value
   * @returns Record with camelCase field names or undefined if not found
   */
  static async getById<T extends SQLiteTable>(
    table: T, 
    idColumn: SQLiteColumn<any>, 
    id: number
  ): Promise<Record<string, any> | undefined> {
    const [result] = await db.select().from(table).where(eq(idColumn, id));
    return result ? transformToCamelCase(result) : undefined;
  }

  /**
   * Insert a record and convert field names to snake_case
   * @param table The table to insert into
   * @param values The values to insert (in camelCase)
   * @returns The inserted record with camelCase field names
   */
  static async insert<T extends SQLiteTable>(
    table: T, 
    values: Record<string, any>
  ): Promise<Record<string, any>> {
    const snakeCaseValues = transformToSnakeCase(values);
    // Fix: Cast as any to avoid TypeScript error with Record<string, any>
    const [result] = await db.insert(table).values(snakeCaseValues as any).returning();
    return transformToCamelCase(result);
  }

  /**
   * Update a record and convert field names to snake_case
   * @param table The table to update
   * @param idColumn The ID column
   * @param id The ID value
   * @param values The values to update (in camelCase)
   * @returns The updated record with camelCase field names or undefined if not found
   */
  static async update<T extends SQLiteTable>(
    table: T, 
    idColumn: SQLiteColumn<any>, 
    id: number, 
    values: Record<string, any>
  ): Promise<Record<string, any> | undefined> {
    const snakeCaseValues = transformToSnakeCase(values);
    // Fix: Cast as any to avoid TypeScript error with Record<string, any>
    const [result] = await db
      .update(table)
      .set(snakeCaseValues as any)
      .where(eq(idColumn, id))
      .returning();
    
    return result ? transformToCamelCase(result) : undefined;
  }

  /**
   * Delete a record
   * @param table The table to delete from
   * @param idColumn The ID column
   * @param id The ID value
   * @returns True if the record was deleted, false otherwise
   */
  static async delete<T extends SQLiteTable>(
    table: T, 
    idColumn: SQLiteColumn<any>, 
    id: number
  ): Promise<boolean> {
    const result = await db.delete(table).where(eq(idColumn, id)).returning({ id: idColumn });
    return result.length > 0;
  }
}