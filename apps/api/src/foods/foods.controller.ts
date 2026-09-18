import { Controller, Get, Headers, Param, Query, Res } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Response } from 'express';
import { FoodsService, toEntityTag } from './foods.service';
import { FoodQueryDto } from './dto/food-query.dto';
import { FoodListResponseDto } from './dto/food-summary.dto';
import { FoodDto } from './dto/food.dto';
import { CatalogDto } from './dto/catalog.dto';
import { CategoriesDto } from './dto/categories.dto';

/**
 * Public read-only food catalog API (blueprint §8). Route order matters:
 * /foods/categories is declared BEFORE /foods/:id so Nest resolves the
 * static route first.
 */
@Controller()
export class FoodsController {
  constructor(private readonly foods: FoodsService) {}

  @Get('foods')
  async list(@Query() query: FoodQueryDto): Promise<FoodListResponseDto> {
    return this.foods.search(query);
  }

  @Get('foods/categories')
  async categories(): Promise<CategoriesDto> {
    return this.foods.categories();
  }

  @Get('foods/:id')
  async byId(@Param('id') id: string): Promise<FoodDto> {
    return this.foods.byId(id);
  }

  /** Version-gated full snapshot; If-None-Match: <version> → 304 (§8). */
  @Get('catalog')
  async catalog(
    @Headers('if-none-match') etag: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CatalogDto | undefined> {
    const result = await this.foods.catalog(etag);
    // RFC 9110 entity-tag: quoted and strong (QA F-10).
    res.setHeader('ETag', toEntityTag(result.version));
    res.setHeader('Cache-Control', 'no-cache');
    if (result.notModified) {
      res.status(304);
      return undefined;
    }
    // End-to-end payload integrity (QA F-05): the mobile client can hash the
    // exact bytes it received and compare. This is the same string Nest will
    // serialize (the service returns a plain object literal), and it is
    // computed here rather than in the service because only the response body
    // bytes can be verified by a client. Additive: clients that ignore the
    // header are unaffected.
    res.setHeader(
      'X-Catalog-Payload-Sha256',
      createHash('sha256').update(JSON.stringify(result.dto), 'utf8').digest('hex'),
    );
    return result.dto;
  }
}
