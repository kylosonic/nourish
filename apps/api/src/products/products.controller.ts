import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';
import { BarcodeProductView, ProductsService } from './products.service';
import { ParseLabelDto } from './label.dto';
import {
  NutritionLabelService,
  ParsedNutritionLabel,
} from './label.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly labels: NutritionLabelService,
  ) {}

  @Get('barcode/:barcode')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  barcode(@Param('barcode') barcode: string): Promise<BarcodeProductView> {
    if (!/^\d{8,14}$/.test(barcode)) {
      return Promise.reject(
        new NourishHttpException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
          'Barcode must contain 8 to 14 digits.',
        ),
      );
    }
    return this.products.barcode(barcode);
  }

  @Post('label')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  label(@Body() body: ParseLabelDto): Promise<ParsedNutritionLabel> {
    return this.labels.parse(body.imageBase64, body.mimeType);
  }
}
