import { read, utils, WorkBook } from 'xlsx';
import { calculateDepotPrice, calculateWarehousePrice } from './pricing';

// Interface for parsed product data
export interface ProductData {
  sku: string;
  name?: string;
  regularPrice: number;
  depotPrice?: number;
  warehousePrice?: number;
  quantity?: number;
  row: number;
  hasDepotPriceError?: boolean;
  hasWarehousePriceError?: boolean;
  hasMissingValues?: boolean;
}

// Interface for column mapping
export interface ColumnMapping {
  sku: string;
  name?: string;
  regularPrice: string;
  depotPrice?: string;
  warehousePrice?: string;
  quantity?: string;
}

// Default column mapping
export const defaultColumnMapping: ColumnMapping = {
  sku: 'SKU',
  name: 'Product Name',
  regularPrice: 'Regular Price',
  depotPrice: 'Depot Price',
  warehousePrice: 'Warehouse Price',
  quantity: 'Quantity',
};

/**
 * Parse a spreadsheet file into product data
 * @param file The spreadsheet file to parse
 * @param mapping Column mapping to use (defaults to standard mapping)
 * @returns Array of parsed product data
 */
export async function parseSpreadsheet(
  file: File,
  mapping: ColumnMapping = defaultColumnMapping
): Promise<ProductData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target || !e.target.result) {
          throw new Error('Failed to read file');
        }
        
        // Parse the spreadsheet
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook: WorkBook = read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length <= 1) {
          throw new Error('Spreadsheet is empty or contains only headers');
        }
        
        // Find column indices based on mapping
        const headers = jsonData[0] as string[];
        const columnIndices: Record<string, number> = {};
        
        // Map column names to indices
        Object.keys(mapping).forEach(key => {
          const columnName = mapping[key as keyof ColumnMapping];
          if (columnName) {
            const index = headers.findIndex(
              header => header.toLowerCase() === columnName.toLowerCase()
            );
            if (index !== -1) {
              columnIndices[key] = index;
            }
          }
        });
        
        // SKU is required
        if (!('sku' in columnIndices)) {
          throw new Error(`Could not find SKU column (${mapping.sku})`);
        }
        
        // Regular Price is required
        if (!('regularPrice' in columnIndices)) {
          throw new Error(`Could not find Regular Price column (${mapping.regularPrice})`);
        }
        
        // Parse data rows
        const products: ProductData[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row[columnIndices.sku]) continue; // Skip rows without SKU
          
          const sku = row[columnIndices.sku].toString();
          const regularPrice = parseFloat(row[columnIndices.regularPrice]);
          
          if (isNaN(regularPrice)) continue; // Skip rows with invalid price
          
          const product: ProductData = {
            sku,
            regularPrice,
            row: i + 1, // Excel rows are 1-based, and we skipped header
          };
          
          // Add optional fields if columns exist
          if ('name' in columnIndices) {
            product.name = row[columnIndices.name]?.toString() || '';
          }
          
          if ('quantity' in columnIndices) {
            const qty = parseInt(row[columnIndices.quantity], 10);
            if (!isNaN(qty)) {
              product.quantity = qty;
            }
          }
          
          // Add depot price if column exists or calculate it
          if ('depotPrice' in columnIndices) {
            const depotPrice = parseFloat(row[columnIndices.depotPrice]);
            if (!isNaN(depotPrice)) {
              product.depotPrice = depotPrice;
              const calculatedDepotPrice = calculateDepotPrice(regularPrice);
              product.hasDepotPriceError = depotPrice !== calculatedDepotPrice;
            } else {
              product.depotPrice = calculateDepotPrice(regularPrice);
            }
          } else {
            product.depotPrice = calculateDepotPrice(regularPrice);
          }
          
          // Add warehouse price if column exists or calculate it
          if ('warehousePrice' in columnIndices) {
            const warehousePrice = parseFloat(row[columnIndices.warehousePrice]);
            if (!isNaN(warehousePrice)) {
              product.warehousePrice = warehousePrice;
              const calculatedWarehousePrice = calculateWarehousePrice(regularPrice);
              product.hasWarehousePriceError = warehousePrice !== calculatedWarehousePrice;
            } else {
              product.warehousePrice = calculateWarehousePrice(regularPrice);
            }
          } else {
            product.warehousePrice = calculateWarehousePrice(regularPrice);
          }
          
          products.push(product);
        }
        
        resolve(products);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate parsed product data and return validation issues
 * @param products Array of parsed product data
 * @returns Array of validation issue messages
 */
export function validateProductData(products: ProductData[]): string[] {
  const issues: string[] = [];
  
  // Check for duplicate SKUs
  const skus = new Set<string>();
  const duplicates = new Set<string>();
  
  products.forEach(product => {
    if (skus.has(product.sku)) {
      duplicates.add(product.sku);
    } else {
      skus.add(product.sku);
    }
  });
  
  if (duplicates.size > 0) {
    issues.push(`Duplicate SKUs found: ${Array.from(duplicates).join(', ')}`);
  }
  
  // Check for price validation errors
  let depotPriceErrors = 0;
  let warehousePriceErrors = 0;
  
  products.forEach(product => {
    if (product.hasDepotPriceError) {
      depotPriceErrors++;
    }
    if (product.hasWarehousePriceError) {
      warehousePriceErrors++;
    }
  });
  
  if (depotPriceErrors > 0) {
    issues.push(`${depotPriceErrors} rows have incorrect Depot prices (should be 18% discount, rounded to nearest whole number)`);
  }
  
  if (warehousePriceErrors > 0) {
    issues.push(`${warehousePriceErrors} rows have incorrect Warehouse prices (should be 26% discount, rounded to nearest whole number)`);
  }
  
  return issues;
}
