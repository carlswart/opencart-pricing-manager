/**
 * A service to store and retrieve update details for products that are processed
 * This ensures we keep accurate records of what changes were made
 */

// Store update details in memory for quick access
interface ProductUpdateDetail {
  id: number;
  sku: string;
  model: string;
  name: string;
  store: string;
  storeId: number;
  oldRegularPrice?: number | null;
  newRegularPrice?: number | null;
  oldDepotPrice?: number | null;
  newDepotPrice?: number | null;
  oldWarehousePrice?: number | null;
  newWarehousePrice?: number | null;
  oldQuantity?: number | null;
  newQuantity?: number | null;
  status: string;
}

// Update tracking for each processed update
interface UpdateTracker {
  id: number;
  filename: string;
  startTime: string;
  endTime?: string;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  productDetails: ProductUpdateDetail[];
  totalProducts: number;
  successfulProducts: number;
  failedProducts: number;
}

// In-memory store for updates
const updateStore: Record<number, UpdateTracker> = {};

/**
 * Start tracking a new update
 * @param id The update ID (timestamp)
 * @param filename The name of the uploaded file
 * @param totalProducts The number of products to process
 * @returns The created update tracker
 */
export function startUpdate(id: number, filename: string, totalProducts: number): UpdateTracker {
  const update: UpdateTracker = {
    id,
    filename,
    startTime: new Date().toISOString(),
    status: 'processing',
    productDetails: [],
    totalProducts,
    successfulProducts: 0,
    failedProducts: 0
  };
  
  updateStore[id] = update;
  return update;
}

/**
 * Add product details to the update
 * @param updateId The update ID
 * @param detail The product update detail to add
 * @param success Whether the product update was successful
 */
export function addProductDetail(updateId: number, detail: ProductUpdateDetail, success: boolean = true): void {
  const update = updateStore[updateId];
  if (!update) return;
  
  // Add product detail
  update.productDetails.push(detail);
  
  // Update counters
  if (success) {
    update.successfulProducts++;
  } else {
    update.failedProducts++;
  }
}

/**
 * Complete the update
 * @param updateId The update ID
 * @param status The final status of the update
 */
export function completeUpdate(updateId: number, status: 'completed' | 'failed' | 'partial'): void {
  const update = updateStore[updateId];
  if (!update) return;
  
  update.status = status;
  update.endTime = new Date().toISOString();
}

/**
 * Get the update tracker
 * @param updateId The update ID
 * @returns The update tracker or undefined if not found
 */
export function getUpdate(updateId: number): UpdateTracker | undefined {
  return updateStore[updateId];
}

/**
 * Get all product details for an update
 * @param updateId The update ID
 * @returns The product details or empty array if not found
 */
export function getProductDetails(updateId: number): ProductUpdateDetail[] {
  const update = updateStore[updateId];
  return update?.productDetails || [];
}

/**
 * Get a list of all updates
 * @returns Array of updates, sorted by start time (most recent first)
 */
export function getAllUpdates(): UpdateTracker[] {
  return Object.values(updateStore).sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}