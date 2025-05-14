/**
 * Calculates the Depot price with 18% discount, rounded to the nearest whole number
 * @param regularPrice The regular price
 * @returns The calculated depot price
 */
export function calculateDepotPrice(regularPrice: number): number {
  const discountMultiplier = 0.82; // 100% - 18%
  const depotPrice = regularPrice * discountMultiplier;
  return Math.round(depotPrice);
}

/**
 * Calculates the Warehouse price with 26% discount, rounded to the nearest whole number
 * @param regularPrice The regular price
 * @returns The calculated warehouse price
 */
export function calculateWarehousePrice(regularPrice: number): number {
  const discountMultiplier = 0.74; // 100% - 26%
  const warehousePrice = regularPrice * discountMultiplier;
  return Math.round(warehousePrice);
}

/**
 * Validates if the depot price is correctly calculated
 * @param regularPrice The regular price
 * @param depotPrice The depot price to validate
 * @returns True if the depot price is valid, false otherwise
 */
export function isValidDepotPrice(regularPrice: number, depotPrice: number): boolean {
  const calculatedPrice = calculateDepotPrice(regularPrice);
  return calculatedPrice === depotPrice;
}

/**
 * Validates if the warehouse price is correctly calculated
 * @param regularPrice The regular price
 * @param warehousePrice The warehouse price to validate
 * @returns True if the warehouse price is valid, false otherwise
 */
export function isValidWarehousePrice(regularPrice: number, warehousePrice: number): boolean {
  const calculatedPrice = calculateWarehousePrice(regularPrice);
  return calculatedPrice === warehousePrice;
}
