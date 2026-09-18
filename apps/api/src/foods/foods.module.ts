import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { FoodsPrismaRepository } from './foods.prisma-repository';

@Module({
  controllers: [FoodsController],
  providers: [FoodsService, FoodsPrismaRepository],
  exports: [FoodsService],
})
export class FoodsModule {}
