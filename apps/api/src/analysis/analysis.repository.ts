import { AnalysisRun, AnalysisItem, AnalysisCandidate } from '@prisma/client';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResolvedItem } from './pipeline/resolve.stage';
import { ComputedNutrition } from './pipeline/nutrition.stage';

export type RunWithDetail = AnalysisRun & {
  items: AnalysisItem[];
  candidates: AnalysisCandidate[];
};

export interface CreateRunInput {
  inputKind: 'Photo' | 'Text';
  overallConfidence: number;
  confidenceState: 'High' | 'Medium' | 'Low';
  modelVersion: string;
  promptVersion: string;
  notes: string[] | null;
  items: (ResolvedItem & { nutrition: ComputedNutrition | null })[];
  candidates: { displayName: string; foodId: string | null; confidence: number }[];
}

export interface CorrectionInput {
  itemId?: string;
  action: string;
  predictedLabel?: string;
  chosenFoodId?: string;
  chosenAmount?: number;
  chosenUnit?: string;
}

/**
 * Persistence for analysis runs. Writes are parameterized Prisma calls and the
 * run + its items + candidates are created in ONE transaction, so a failed
 * analysis can never leave a half-written result behind.
 */
@Injectable()
export class AnalysisRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createCompleted(input: CreateRunInput): Promise<RunWithDetail> {
    return this.prisma.$transaction(async (tx) => {
      const run = await tx.analysisRun.create({
        data: {
          status: 'Completed',
          inputKind: input.inputKind,
          overallConfidence: input.overallConfidence,
          confidenceState: input.confidenceState,
          modelVersion: input.modelVersion,
          promptVersion: input.promptVersion,
          notes: input.notes ?? undefined,
          items: {
            create: input.items.map((item) => ({
              displayName: item.displayName,
              foodId: item.foodId,
              sourceFoodCode: item.sourceFoodCode,
              canonicalName: item.canonicalName,
              matchKind: item.matchKind,
              portionAmount: item.portionAmount,
              portionUnit: item.portionUnit,
              portionGrams: item.portionGrams,
              portionEstimated: item.portionEstimated,
              portionSource: item.portionSource,
              kcal: item.nutrition?.kcal ?? null,
              proteinG: item.nutrition?.proteinG ?? null,
              carbsG: item.nutrition?.carbsG ?? null,
              fatG: item.nutrition?.fatG ?? null,
              fiberG: item.nutrition?.fiberG ?? null,
              sodiumMg: item.nutrition?.sodiumMg ?? null,
              confidence: item.confidence,
              unresolved: item.unresolved,
            })),
          },
          candidates: {
            create: input.candidates.map((candidate, index) => ({
              displayName: candidate.displayName,
              foodId: candidate.foodId,
              confidence: candidate.confidence,
              rank: index,
            })),
          },
        },
        include: { items: true, candidates: true },
      });
      return run;
    });
  }

  /** A failed attempt is recorded for observability; it carries no result. */
  async createFailed(input: {
    inputKind: 'Photo' | 'Text';
    modelVersion: string;
    promptVersion: string;
    failureCode: string;
    notes: string[] | null;
  }): Promise<AnalysisRun> {
    return this.prisma.analysisRun.create({
      data: {
        status: 'Failed',
        inputKind: input.inputKind,
        overallConfidence: 0,
        confidenceState: 'Low',
        modelVersion: input.modelVersion,
        promptVersion: input.promptVersion,
        failureCode: input.failureCode,
        notes: input.notes ?? undefined,
      },
    });
  }

  async findById(id: string): Promise<RunWithDetail | null> {
    return this.prisma.analysisRun.findUnique({
      where: { id },
      include: {
        items: { orderBy: { id: 'asc' } },
        candidates: { orderBy: { rank: 'asc' } },
      },
    });
  }

  /** Best-effort capture; a failure here must never surface (SAFE-07). */
  async addCorrections(
    runId: string,
    modelVersion: string,
    promptVersion: string,
    corrections: CorrectionInput[],
  ): Promise<number> {
    const result = await this.prisma.analysisCorrection.createMany({
      data: corrections.map((correction) => ({
        runId,
        itemId: correction.itemId ?? null,
        action: correction.action,
        predictedLabel: correction.predictedLabel ?? null,
        chosenFoodId: correction.chosenFoodId ?? null,
        chosenAmount: correction.chosenAmount ?? null,
        chosenUnit: correction.chosenUnit ?? null,
        modelVersion,
        promptVersion,
      })),
    });
    return result.count;
  }

  async countCreatedSince(since: Date): Promise<number> {
    return this.prisma.analysisRun.count({ where: { createdAt: { gte: since } } });
  }

  /** Retention purge; returns how many runs were deleted (cascades to detail). */
  async purgeOlderThan(cutoff: Date): Promise<number> {
    const result = await this.prisma.analysisRun.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  }
}
