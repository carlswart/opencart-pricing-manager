/**
 * Calculates the discounted price based on discount percentage, rounded to the nearest whole number
 * @param regularPrice The regular price
 * @param discountPercentage The discount percentage (e.g., 18 for 18%)
 * @returns The calculated discounted price
 */
export function calculateDiscountedPrice(regularPrice: number, discountPercentage: number): number {
  const discountMultiplier = (100 - discountPercentage) / 100;
  const discountedPrice = regularPrice * discountMultiplier;
  return Math.round(discountedPrice);
}

/**
 * Calculates the Depot price with configurable discount, rounded to the nearest whole number
 * Defaults to 18% if no discount percentage is provided
 * @param regularPrice The regular price
 * @param discountPercentage Optional discount percentage (defaults to 18%)
 * @returns The calculated depot price
 */
export function calculateDepotPrice(regularPrice: number, discountPercentage: number = 18): number {
  return calculateDiscountedPrice(regularPrice, discountPercentage);
}

/**
 * Calculates the Namibia SD (previously Warehouse) price with configurable discount, rounded to the nearest whole number
 * Defaults to 26% if no discount percentage is provided
 * @param regularPrice The regular price
 * @param discountPercentage Optional discount percentage (defaults to 26%)
 * @returns The calculated warehouse price
 */
export function calculateWarehousePrice(regularPrice: number, discountPercentage: number = 26): number {
  return calculateDiscountedPrice(regularPrice, discountPercentage);
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
