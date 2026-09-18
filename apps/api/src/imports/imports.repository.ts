import { Inject, Injectable } from '@nestjs/common';
import { ImportRun, ImportStatus, Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CanonicalFood } from './canonicalizer';
import { CATEGORIES } from './category-mapper';

export interface CreateImportRunInput {
  sourceName: string;
  sourceVersion: string;
  sourceReference: string;
  sourceUrl?: string;
  fileName: string;
  fileSha256: string;
  extractSha256?: string;
  rulesVersion: string;
  rowCount: number;
}

export interface FoodUpsertInput {
  food: CanonicalFood;
  categoryCode: string;
  defaultPortion: { unit: string; quantity: number; grams: number };
  portions: { unit: string; quantity: number; grams: number }[];
  extraNutrients: Prisma.InputJsonValue;
  canonicalName: string;
}

/**
 * Persistence for the import pipeline. All writes are Prisma parameterized
 * queries; the upsert+deprecate step runs in ONE transaction (atomicity A22).
 */
@Injectable()
export class ImportsRepository {
  // Injected by token so Nest resolves PrismaService while plain PrismaClient
  // instances (seed.ts, tests) remain valid arguments.
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async createRun(input: CreateImportRunInput): Promise<ImportRun> {
    return this.prisma.importRun.create({
      data: {
        sourceName: input.sourceName,
        sourceVersion: input.sourceVersion,
        sourceReference: input.sourceReference,
        sourceUrl: input.sourceUrl,
        fileName: input.fileName,
        fileSha256: input.fileSha256,
        extractSha256: input.extractSha256,
        rulesVersion: input.rulesVersion,
        rowCount: input.rowCount,
        status: ImportStatus.Pending,
      },
    });
  }

  /**
   * Idempotency gate: a committed run with the same (source, version, file
   * hash, rules version) is a no-op re-import. The rules version is part of the
   * key so that editing canonicalization rules re-derives the food layer
   * instead of silently keeping the previous run's aliases.
   */
  async findCommittedByTriple(
    sourceName: string,
    sourceVersion: string,
    fileSha256: string,
    rulesVersion: string,
  ): Promise<ImportRun | null> {
    return this.prisma.importRun.findFirst({
      where: {
        sourceName,
        sourceVersion,
        fileSha256,
        rulesVersion,
        status: ImportStatus.Committed,
      },
    });
  }

  async markStatus(
    id: string,
    status: ImportStatus,
    notes: string | null,
  ): Promise<ImportRun> {
    return this.prisma.importRun.update({
      where: { id },
      data: { status, notes, finishedAt: status === ImportStatus.Pending ? null : new Date() },
    });
  }

  async listRuns(): Promise<ImportRun[]> {
    return this.prisma.importRun.findMany({ orderBy: { startedAt: 'desc' }, take: 10 });
  }

  /**
   * Transactional write: upsert every food by sourceFoodCode, deprecate codes
   * of the same source absent from this extract (never delete), and ensure
   * the category reference rows exist.
   */
  async applyImport(
    run: ImportRun,
    inputs: FoodUpsertInput[],
  ): Promise<{ upserted: number; deprecated: number }> {
    return this.prisma.$transaction(async (tx) => {
      for (const cat of CATEGORIES) {
        await tx.foodCategory.upsert({
          where: { code: cat.code },
          update: { label: cat.label },
          create: { code: cat.code, label: cat.label },
        });
      }

      for (const input of inputs) {
        const { food } = input;
        await tx.food.upsert({
          where: { sourceFoodCode: food.sourceFoodCode },
          update: {
            canonicalName: input.canonicalName,
            categoryCode: input.categoryCode,
            status: 'Active',
            defaultPortionUnit: input.defaultPortion.unit,
            defaultPortionQty: input.defaultPortion.quantity,
            defaultPortionGrams: input.defaultPortion.grams,
            per100gKcal: food.per100g.kcal,
            per100gProtein: food.per100g.proteinG,
            per100gCarbs: food.per100g.carbsG,
            per100gFat: food.per100g.fatG,
            per100gFiber: food.per100g.fiberG,
            per100gSodiumMg: food.per100g.sodiumMg,
            extraNutrients: input.extraNutrients,
            importId: run.id,
            aliases: {
              deleteMany: {},
              create: food.aliases.map((a) => ({
                alias: a.alias,
                language: a.language,
                kind: a.kind,
                normalized: a.alias.toLowerCase().replace(/\s+/g, ' ').trim(),
              })),
            },
            portions: {
              deleteMany: {},
              create: input.portions.map((p) => ({
                unit: p.unit,
                quantity: p.quantity,
                grams: p.grams,
                portionSource: 'nourish-standard',
              })),
            },
          },
          create: {
            id: food.id,
            canonicalName: input.canonicalName,
            categoryCode: input.categoryCode,
            defaultPortionUnit: input.defaultPortion.unit,
            defaultPortionQty: input.defaultPortion.quantity,
            defaultPortionGrams: input.defaultPortion.grams,
            per100gKcal: food.per100g.kcal,
            per100gProtein: food.per100g.proteinG,
            per100gCarbs: food.per100g.carbsG,
            per100gFat: food.per100g.fatG,
            per100gFiber: food.per100g.fiberG,
            per100gSodiumMg: food.per100g.sodiumMg,
            extraNutrients: input.extraNutrients,
            sourceFoodCode: food.sourceFoodCode,
            importId: run.id,
            aliases: {
              create: food.aliases.map((a) => ({
                alias: a.alias,
                language: a.language,
                kind: a.kind,
                normalized: a.alias.toLowerCase().replace(/\s+/g, ' ').trim(),
              })),
            },
            portions: {
              create: input.portions.map((p) => ({
                unit: p.unit,
                quantity: p.quantity,
                grams: p.grams,
                portionSource: 'nourish-standard',
              })),
            },
          },
        });
      }

      // Supersession: foods of this source whose code left the extract → Deprecated.
      const codes = inputs.map((i) => i.food.sourceFoodCode);
      const stale = await tx.food.updateMany({
        where: {
          import: { sourceName: run.sourceName, sourceVersion: run.sourceVersion },
          sourceFoodCode: { notIn: codes },
          status: { not: 'Deprecated' },
        },
        data: { status: 'Deprecated' },
      });

      return { upserted: inputs.length, deprecated: stale.count };
    });
  }

  async countFoodsByImport(importId: string): Promise<number> {
    return this.prisma.food.count({ where: { importId, status: 'Active' } });
  }
}
