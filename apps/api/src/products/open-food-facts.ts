export interface OpenFoodFactsProduct {
  barcode: string;
  name: string;
  brand: string | null;
  servingSizeG: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

interface OffNutriments {
  'energy-kcal_100g'?: unknown;
  proteins_100g?: unknown;
  carbohydrates_100g?: unknown;
  fat_100g?: unknown;
}

interface OffProduct {
  product_name?: unknown;
  generic_name?: unknown;
  brands?: unknown;
  serving_quantity?: unknown;
  serving_size?: unknown;
  nutriments?: OffNutriments;
}

function positive(value: unknown): number | null {
  const number =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : NaN;
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function servingGrams(product: OffProduct): number {
  const quantity = positive(product.serving_quantity);
  if (quantity && quantity > 0 && quantity <= 5000) return quantity;
  const label =
    typeof product.serving_size === 'string' ? product.serving_size : '';
  const match = /(\d+(?:\.\d+)?)\s*g/i.exec(label);
  const parsed = match ? Number.parseFloat(match[1]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 5000
    ? parsed
    : 100;
}

/** Map only complete Open Food Facts rows; absent values are not invented. */
export function mapOpenFoodFacts(
  barcode: string,
  product: OffProduct | null | undefined,
): OpenFoodFactsProduct | null {
  if (!product) return null;
  const name =
    typeof product.product_name === 'string' && product.product_name.trim()
      ? product.product_name.trim()
      : typeof product.generic_name === 'string' && product.generic_name.trim()
        ? product.generic_name.trim()
        : null;
  const nutrients = product.nutriments;
  const kcal = positive(nutrients?.['energy-kcal_100g']);
  const protein = positive(nutrients?.proteins_100g);
  const carbs = positive(nutrients?.carbohydrates_100g);
  const fat = positive(nutrients?.fat_100g);
  if (
    !name ||
    kcal == null ||
    protein == null ||
    carbs == null ||
    fat == null
  ) {
    return null;
  }
  return {
    barcode,
    name,
    brand:
      typeof product.brands === 'string' && product.brands.trim()
        ? product.brands.trim()
        : null,
    servingSizeG: servingGrams(product),
    kcalPer100g: kcal,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
  };
}
