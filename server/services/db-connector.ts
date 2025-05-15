import mysql from 'mysql2/promise';
import { DbConnection } from "@shared/schema";
import fs from 'fs';
import path from 'path';

/**
 * Get SSL configuration for MySQL connection
 * Supports both basic TLS (CA only) and mutual TLS (CA, client cert, client key)
 * @returns SSL configuration for MySQL connection
 */
function getSslConfiguration() {
  const sslDir = path.join(process.cwd(), 'ssl');
  const caPath = path.join(sslDir, 'ca-cert.pem');
  const certPath = path.join(sslDir, 'client-cert.pem');
  const keyPath = path.join(sslDir, 'client-key.pem');
  
  // Basic SSL config with CA certificate (required)
  if (fs.existsSync(caPath)) {
    const config: any = {
      ca: fs.readFileSync(caPath).toString(),
    };
    
    // Add client certificate and key if available (for mutual TLS)
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      config.cert = fs.readFileSync(certPath).toString();
      config.key = fs.readFileSync(keyPath).toString();
    }
    
    return config;
  }
  
  console.warn('SSL is enabled but no CA certificate found at', caPath);
  return undefined;
}

/**
 * Create a secure database connection with SSL/TLS support
 * @param connection Database connection details
 * @returns MySQL connection pool
 */
export async function createSecureConnection(connection: DbConnection) {
  try {
    // Create connection options with SSL/TLS if available
    const connectionOptions: mysql.PoolOptions = {
      host: connection.host,
      port: parseInt(connection.port || '3306'),
      database: connection.database,
      user: connection.username,
      password: connection.password,
      // Enable SSL if environment supports it and certificates are available
      ssl: process.env.USE_SSL === 'true' ? getSslConfiguration() : undefined,
      // Include a connection timeout
      connectTimeout: 10000,
      // For production systems, adjust these pool settings based on load requirements
      connectionLimit: 10,
      queueLimit: 0
    };

    // Create a connection pool
    const pool = mysql.createPool(connectionOptions);
    
    // Test the connection
    await pool.query('SELECT 1 as test');
    
    return pool;
  } catch (error) {
    console.error(`Failed to create secure connection to ${connection.host}:${connection.port}/${connection.database}:`, error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Execute a query with proper parameter sanitization to prevent SQL injection
 * @param pool Database connection pool
 * @param query SQL query with placeholders
 * @param params Parameters to bind to the query
 * @returns Query result
 */
export async function executeQuery(pool: mysql.Pool, query: string, params: any[] = []) {
  try {
    // Use prepared statements with parameter binding to prevent SQL injection
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error(`Query execution failed: ${query}`, error);
    throw new Error(`Query execution failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Close database connection pool
 * @param pool Database connection pool
 */
export async function closeConnection(pool: mysql.Pool) {
  try {
    await pool.end();
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
}

/**
 * Create a transaction for atomic operations
 * @param pool Database connection pool
 * @returns Transaction connection
 */
export async function beginTransaction(pool: mysql.Pool) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Commit a transaction
 * @param connection Transaction connection
 */
export async function commitTransaction(connection: mysql.PoolConnection) {
  try {
    await connection.commit();
  } finally {
    connection.release();
  }
}

/**
 * Rollback a transaction
 * @param connection Transaction connection
 */
export async function rollbackTransaction(connection: mysql.PoolConnection) {
  try {
    await connection.rollback();
  } finally {
    connection.release();
  }
}

/**
 * Check if a database connection is using SSL/TLS
 * @param pool Database connection pool
 * @returns Information about the SSL/TLS connection
 */
export async function checkConnectionSecurity(pool: mysql.Pool) {
  try {
    // Query to check SSL status
    const query = `
      SELECT 
        variable_value as cipher
      FROM information_schema.session_status 
      WHERE variable_name = 'Ssl_cipher'
    `;
    
    const results = await executeQuery(pool, query);
    
    if (Array.isArray(results) && results.length > 0) {
      // @ts-ignore - We know this exists because we selected it
      const cipher = results[0].cipher;
      
      if (cipher && cipher !== '') {
        // Also get the SSL version
        const versionQuery = `
          SELECT 
            variable_value as version
          FROM information_schema.session_status 
          WHERE variable_name = 'Ssl_version'
        `;
        
        const versionResults = await executeQuery(pool, versionQuery);
        // @ts-ignore - We know this exists because we selected it
        const version = Array.isArray(versionResults) && versionResults.length > 0 ? versionResults[0].version : 'Unknown';
        
        return {
          isSecure: true,
          cipher,
          version
        };
      }
    }
    
    return {
      isSecure: false,
      cipher: null,
      version: null
    };
  } catch (error) {
    console.error("Error checking connection security:", error);
    return {
      isSecure: false,
      cipher: null,
      version: null,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}