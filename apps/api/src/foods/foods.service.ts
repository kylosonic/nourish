import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { FoodsPrismaRepository, FoodWithRelations } from './foods.prisma-repository';
import { FoodQueryDto } from './dto/food-query.dto';
import { FoodListResponseDto, FoodSummaryDto, Per100gDto } from './dto/food-summary.dto';
import { CatalogDto } from './dto/catalog.dto';
import { FoodDto } from './dto/food.dto';
import { CategoriesDto } from './dto/categories.dto';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';
import { NourishLogger } from '../common/logger/nourish-logger';
import { CATEGORIES } from '../imports/category-mapper';

interface CatalogCacheEntry {
  version: string;
  sha256: string;
  generatedAt: Date;
  foods: FoodDto[];
}

/** Strong entity-tag for a catalog version (RFC 9110: quoted). QA F-10. */
export function toEntityTag(version: string): string {
  return `"${version}"`;
}

/**
 * RFC-tolerant `If-None-Match` comparison (QA finding F-10). The previous
 * implementation required the header to equal the raw version string, so a
 * client echoing the server's own (unquoted, non-RFC) ETag — or any weak
 * validator or comma-separated list — got a 200 instead of a 304. Accepts
 * `*`, `W/"x"`, `"x"` and bare `x`, across a comma-separated list.
 */
export function matchesEntityTag(header: string | undefined, version: string): boolean {
  if (!header) return false;
  return header
    .split(',')
    .map((candidate) => candidate.trim())
    .some((candidate) => {
      if (candidate === '*') return true;
      return candidate.replace(/^W\//i, '').replace(/^"(.*)"$/, '$1') === version;
    });
}

/**
 * Catalog read service: search, detail, categories, and the version-gated
 * catalog snapshot. Nutrition numbers are returned exactly as stored —
 * they originate from the FCT extract/fixture and are never modified here.
 */
@Injectable()
export class FoodsService {
  private readonly logger = new NourishLogger('catalog');
  private readonly catalogCache = new Map<string, CatalogCacheEntry>();

  constructor(private readonly repo: FoodsPrismaRepository) {}

  async search(query: FoodQueryDto): Promise<FoodListResponseDto> {
    const { q, category, page, limit } = query;
    this.logger.log('search', { q: q ?? null, category: category ?? null, page, limit });

    const { rows, total } = await this.repo.search({
      q,
      category,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: rows.map((r) => this.toSummary(r)),
      meta: {
        page,
        limit,
        total,
        hasNextPage: page * limit < total,
      },
    };
  }

  async byId(id: string): Promise<FoodDto> {
    const food = await this.repo.findById(id);
    if (!food) {
      throw new NourishHttpException(
        HttpStatus.NOT_FOUND,
        ErrorCode.FOOD_NOT_FOUND,
        `Food '${id}' not found`,
      );
    }
    return this.toDto(food);
  }

  async categories(): Promise<CategoriesDto> {
    const rows = await this.repo.listCategories();
    // Canonical §8 order: Ethiopian, Breakfast, Lunch, Dinner, Snacks.
    const byCode = new Map(rows.map((r) => [r.code, r.label]));
    return { data: CATEGORIES.map((c) => byCode.get(c.code) ?? c.label) };
  }

  /**
   * Catalog snapshot. `version` = sha256(importId + canonical JSON) — a stable,
   * deterministic version id per committed import (blueprint §10). `sha256` is
   * the payload hash. Both are recomputed deterministically; results are
   * memoized per import id.
   */
  async catalog(etag: string | undefined): Promise<{ dto?: CatalogDto; notModified: boolean; version: string }> {
    const entry = await this.buildCatalog();
    if (matchesEntityTag(etag, entry.version)) {
      return { notModified: true, version: entry.version };
    }
    return {
      notModified: false,
      version: entry.version,
      dto: {
        version: entry.version,
        generatedAt: entry.generatedAt.toISOString(),
        sha256: entry.sha256,
        foods: entry.foods,
      },
    };
  }

  private async buildCatalog(): Promise<CatalogCacheEntry> {
    // Latest committed import anchors the catalog.
    const lastImport = await this.repo.latestCommittedImport();
    if (!lastImport) {
      throw new NourishHttpException(
        HttpStatus.NOT_FOUND,
        ErrorCode.FOOD_NOT_FOUND,
        'No catalog import has been committed yet',
      );
    }
    const cached = this.catalogCache.get(lastImport.id);
    if (cached) return cached;

    const rows = await this.repo.findAllActive();
    const foods = rows
      .filter((r) => r.importId === lastImport.id)
      .map((r) => this.toDto(r));

    const canonicalJson = JSON.stringify(foods);
    const sha256 = createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
    const version = createHash('sha256')
      .update(lastImport.id + canonicalJson, 'utf8')
      .digest('hex');

    const entry: CatalogCacheEntry = {
      version,
      sha256,
      generatedAt: lastImport.finishedAt ?? lastImport.startedAt,
      foods,
    };
    this.catalogCache.set(lastImport.id, entry);
    return entry;
  }

  toSummary(food: FoodWithRelations): FoodSummaryDto {
    const per100g: Per100gDto = {
      kcal: food.per100gKcal,
      proteinG: food.per100gProtein,
      carbsG: food.per100gCarbs,
      fatG: food.per100gFat,
    };
    if (food.per100gFiber != null) per100g.fiberG = food.per100gFiber;
    if (food.per100gSodiumMg != null) per100g.sodiumMg = food.per100gSodiumMg;

    return {
      id: food.id,
      canonicalName: food.canonicalName,
      category: food.category.label,
      defaultPortion: {
        unit: food.defaultPortionUnit,
        quantity: food.defaultPortionQty,
        grams: food.defaultPortionGrams,
      },
      per100g,
      source: {
        name: food.import.sourceName,
        version: food.import.sourceVersion,
      },
    };
  }

  toDto(food: FoodWithRelations): FoodDto {
    const summary = this.toSummary(food);
    return {
      ...summary,
      aliases: food.aliases.map((a) => ({
        alias: a.alias,
        language: a.language,
        kind: a.kind,
      })),
      portions: food.portions.map((p) => ({
        unit: p.unit,
        quantity: p.quantity,
        grams: p.grams,
        portionSource: p.portionSource,
      })),
      source: {
        name: food.import.sourceName,
        version: food.import.sourceVersion,
        foodCode: food.sourceFoodCode,
        reference: food.import.sourceReference,
        importDate: food.import.startedAt.toISOString(),
      },
    };
  }
}
