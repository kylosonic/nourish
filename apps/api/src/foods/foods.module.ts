import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { FoodsPrismaRepository } from './foods.prisma-repository';

@Module({
  controllers: [FoodsController],
  providers: [FoodsService, FoodsPrismaRepository],
  // The S2 analysis pipeline resolves model labels through the same repository
  // the public catalog API reads from, so both share one food layer.
  exports: [FoodsService, FoodsPrismaRepository],
})
export class FoodsModule {}
