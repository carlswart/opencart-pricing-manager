/**
 * Utility functions for database stats using direct SQL queries
 */
import { join } from 'path';
import Database from 'better-sqlite3';

/**
 * Get the count of completed updates from the database
 * This uses a direct SQL query to avoid ORM issues
 */
export function getCompletedUpdatesCount(): number {
  try {
    const dbPath = join(process.cwd(), 'data', 'app.db');
    const db = new Database(dbPath);
    
    // Direct query to count completed updates
    const query = "SELECT COUNT(*) as count FROM update_details WHERE status = 'completed'";
    const result = db.prepare(query).get();
    db.close();
    
    if (result && typeof result.count === 'number') {
      return result.count;
    }
    
    return 0;
  } catch (error) {
    console.error('Error querying completed updates count:', error);
    return 0;
  }
}