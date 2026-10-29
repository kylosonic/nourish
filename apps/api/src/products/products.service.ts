import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';
import { mapOpenFoodFacts } from './open-food-facts';
import { ProductsRepository } from './products.repository';

export interface BarcodeProductView {
  id: string;
  barcode: string;
  canonicalName: string;
  category: string;
  brand: string | null;
  defaultPortion: { unit: 'gram'; quantity: number; grams: number };
  portions: { unit: 'serving' | 'gram'; quantity: number; grams: number }[];
  per100g: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  aliases: string[];
  sourceName: string;
  sourceVersion: string;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('products');

  constructor(
    @Inject(ProductsRepository) private readonly repo: ProductsRepository,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async barcode(barcode: string): Promise<BarcodeProductView> {
    const cached = await this.repo.findByBarcode(barcode);
    if (cached) return toView(cached);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await this.fetchImpl(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
          barcode,
        )}.json?fields=product_name,generic_name,brands,serving_quantity,serving_size,nutriments`,
        {
          headers: {
            'user-agent': 'Nourish/1.3.5 (nutrition tracking; contact@nourish.app)',
          },
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        throw new NourishHttpException(
          HttpStatus.BAD_GATEWAY,
          ErrorCode.PRODUCT_SERVICE_UNAVAILABLE,
          'The packaged-food catalog is temporarily unavailable.',
        );
      }
      const body = (await response.json()) as {
        status?: number;
        product?: Record<string, unknown>;
      };
      const mapped =
        body.status === 1
          ? mapOpenFoodFacts(barcode, body.product)
          : null;
      if (!mapped) {
        throw new NourishHttpException(
          HttpStatus.NOT_FOUND,
          ErrorCode.PRODUCT_NOT_FOUND,
          'No complete verified nutrition record was found for that barcode.',
        );
      }
      const saved = await this.repo.save(mapped);
      return toView(saved);
    } catch (error) {
      if (error instanceof NourishHttpException) throw error;
      this.logger.warn('Open Food Facts lookup failed');
      throw new NourishHttpException(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.PRODUCT_SERVICE_UNAVAILABLE,
        'The packaged-food catalog is temporarily unavailable.',
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

function toView(product: {
  barcode: string;
  name: string;
  brand: string | null;
  servingSizeG: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}): BarcodeProductView {
  return {
    id: `off:${product.barcode}`,
    barcode: product.barcode,
    canonicalName: product.brand
      ? `${product.name} · ${product.brand}`
      : product.name,
    category: 'Packaged food',
    brand: product.brand,
    defaultPortion: {
      unit: 'gram',
      quantity: product.servingSizeG,
      grams: product.servingSizeG,
    },
    portions: [
      { unit: 'serving', quantity: 1, grams: product.servingSizeG },
      { unit: 'gram', quantity: 100, grams: 100 },
    ],
    per100g: {
      kcal: product.kcalPer100g,
      proteinG: product.proteinPer100g,
      carbsG: product.carbsPer100g,
      fatG: product.fatPer100g,
    },
    aliases: [product.barcode],
    sourceName: 'Open Food Facts',
    sourceVersion: 'v2',
  };
}
