import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { NutritionLabelService } from './label.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsRepository, ProductsService, NutritionLabelService],
})
export class ProductsModule {}
