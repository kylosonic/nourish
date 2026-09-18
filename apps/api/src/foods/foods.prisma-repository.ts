import { Injectable } from '@nestjs/common';
import { Food, ImportRun, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Selected relations loaded for every food read. */
export const FOOD_INCLUDE = {
  category: true,
  aliases: true,
  portions: true,
  import: true,
} satisfies Prisma.FoodInclude;

export type FoodWithRelations = Prisma.FoodGetPayload<{ include: typeof FOOD_INCLUDE }>;

export interface FoodSearchParams {
  q?: string;
  category?: string;
  skip: number;
  take: number;
}

/**
 * Escape LIKE/ILIKE metacharacters so `q` is always matched literally
 * (QA finding F-08: `?q=%` used to return the whole catalog because Prisma's
 * `contains` builds a `%<value>%` pattern without escaping). Backslash is
 * PostgreSQL's default LIKE escape character, so it must be escaped first.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Read-side repository for the food catalog. Every query is a parameterized
 * Prisma call — no raw SQL, no interpolation (blueprint §13).
 */
@Injectable()
export class FoodsPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Paginated search over Active foods. `q` matches the canonical name
   * (case-insensitive) or any alias — via the precomputed lowercase
   * `normalized` alias column (covers EN variants and Amharic aliases, which
   * are case-neutral by nature).
   */
  async search(params: FoodSearchParams): Promise<{ rows: FoodWithRelations[]; total: number }> {
    const where: Prisma.FoodWhereInput = { status: 'Active' };

    if (params.category) {
      where.categoryCode = params.category;
    }

    if (params.q) {
      const q = params.q.trim();
      const pattern = escapeLikePattern(q);
      where.OR = [
        { canonicalName: { contains: pattern, mode: 'insensitive' } },
        { aliases: { some: { normalized: { contains: escapeLikePattern(q.toLowerCase()) } } } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.food.findMany({
        where,
        include: FOOD_INCLUDE,
        orderBy: [{ canonicalName: 'asc' }, { id: 'asc' }],
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.food.count({ where }),
    ]);
    return { rows, total };
  }

  async findById(id: string): Promise<FoodWithRelations | null> {
    return this.prisma.food.findFirst({
      where: { id, status: 'Active' },
      include: FOOD_INCLUDE,
    });
  }

  /** All Active foods, deterministically ordered for catalog assembly. */
  async findAllActive(): Promise<FoodWithRelations[]> {
    return this.prisma.food.findMany({
      where: { status: 'Active' },
      include: FOOD_INCLUDE,
      orderBy: [{ canonicalName: 'asc' }, { id: 'asc' }],
    });
  }

  async listCategories(): Promise<{ code: string; label: string }[]> {
    return this.prisma.foodCategory.findMany({ orderBy: { label: 'asc' } });
  }

  async findBySourceFoodCode(code: string): Promise<Food | null> {
    return this.prisma.food.findUnique({ where: { sourceFoodCode: code } });
  }

  /** Most recently committed ImportRun (anchors the catalog snapshot). */
  async latestCommittedImport(): Promise<ImportRun | null> {
    return this.prisma.importRun.findFirst({
      where: { status: 'Committed' },
      orderBy: { startedAt: 'desc' },
    });
  }
}
