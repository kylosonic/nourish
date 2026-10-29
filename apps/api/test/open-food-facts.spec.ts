import { mapOpenFoodFacts } from '../src/products/open-food-facts';

describe('Open Food Facts mapping', () => {
  it('maps complete per-100g nutrition and serving mass', () => {
    expect(
      mapOpenFoodFacts('12345678', {
        product_name: 'Roasted chickpeas',
        brands: 'Example Foods',
        serving_quantity: '30',
        serving_size: '30 g',
        nutriments: {
          'energy-kcal_100g': 410,
          proteins_100g: '19.2',
          carbohydrates_100g: 61.5,
          fat_100g: 12.1,
        },
      }),
    ).toEqual({
      barcode: '12345678',
      name: 'Roasted chickpeas',
      brand: 'Example Foods',
      servingSizeG: 30,
      kcalPer100g: 410,
      proteinPer100g: 19.2,
      carbsPer100g: 61.5,
      fatPer100g: 12.1,
    });
  });

  it('rejects incomplete nutrition instead of inventing missing values', () => {
    expect(
      mapOpenFoodFacts('12345678', {
        product_name: 'Unknown bar',
        nutriments: {
          'energy-kcal_100g': 400,
          proteins_100g: 10,
          carbohydrates_100g: 60,
        },
      }),
    ).toBeNull();
  });

  it('defaults serving mass to 100 g only when the label has no mass', () => {
    const mapped = mapOpenFoodFacts('12345678', {
      product_name: 'Simple snack',
      serving_size: '1 pack',
      nutriments: {
        'energy-kcal_100g': 400,
        proteins_100g: 10,
        carbohydrates_100g: 60,
        fat_100g: 15,
      },
    });
    expect(mapped?.servingSizeG).toBe(100);
  });
});
