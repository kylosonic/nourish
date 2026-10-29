import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenFoodFactsProduct } from './open-food-facts';
import type { BarcodeProduct } from '@prisma/client';

@Injectable()
export class ProductsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findByBarcode(barcode: string): Promise<BarcodeProduct | null> {
    return this.prisma.barcodeProduct.findUnique({ where: { barcode } });
  }

  save(product: OpenFoodFactsProduct): Promise<BarcodeProduct> {
    return this.prisma.barcodeProduct.upsert({
      where: { barcode: product.barcode },
      create: {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        servingSizeG: product.servingSizeG,
        kcalPer100g: product.kcalPer100g,
        proteinPer100g: product.proteinPer100g,
        carbsPer100g: product.carbsPer100g,
        fatPer100g: product.fatPer100g,
      },
      update: {
        name: product.name,
        brand: product.brand,
        servingSizeG: product.servingSizeG,
        kcalPer100g: product.kcalPer100g,
        proteinPer100g: product.proteinPer100g,
        carbsPer100g: product.carbsPer100g,
        fatPer100g: product.fatPer100g,
        verifiedAt: new Date(),
      },
    });
  }
}
