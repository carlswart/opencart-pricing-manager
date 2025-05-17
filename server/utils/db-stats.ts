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
    
    // Direct query to count completed updates - we confirmed this query works
    const result = db.prepare("SELECT COUNT(*) FROM update_details WHERE status = 'completed'").get();
    db.close();
    
    // SQLite returns the count as the first column with no name
    if (result && typeof result['COUNT(*)'] === 'number') {
      console.log('Found completed updates count:', result['COUNT(*)']);
      return result['COUNT(*)'];
    }
    
    return 0;
  } catch (error) {
    console.error('Error querying completed updates count:', error);
    return 0;
  }
}