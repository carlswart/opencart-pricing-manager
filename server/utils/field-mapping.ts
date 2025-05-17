/**
 * Utility functions to convert between snake_case database fields and camelCase application fields
 */

/**
 * Convert a snake_case field name to camelCase
 * @param str The snake_case string to convert
 * @returns The camelCase version of the string
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert a camelCase field name to snake_case
 * @param str The camelCase string to convert
 * @returns The snake_case version of the string
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Transform an object's keys from snake_case to camelCase
 * @param obj The object with snake_case keys
 * @returns A new object with camelCase keys
 */
export function transformToCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformToCamelCase(item)) as any;
  }

  const newObj: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const camelKey = toCamelCase(key);
    
    newObj[camelKey] = transformToCamelCase(value);
  });
  
  return newObj;
}

/**
 * Transform an object's keys from camelCase to snake_case
 * @param obj The object with camelCase keys
 * @returns A new object with snake_case keys
 */
export function transformToSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformToSnakeCase(item)) as any;
  }

  const newObj: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const snakeKey = toSnakeCase(key);
    
    newObj[snakeKey] = transformToSnakeCase(value);
  });
  
  return newObj;
}