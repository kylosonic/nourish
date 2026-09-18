import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfidenceState } from '@prisma/client';
import {
  AiAnalysisPayload,
  AiProviderError,
  AiUnavailableError,
  TEXT_PROVIDER,
  VISION_PROVIDER,
  TextProvider,
  VisionProvider,
} from '../ai/ai-provider';
import { AiOutputValidationError } from '../ai/ai-response.validator';
import { PROMPT_VERSION } from '../ai/prompt';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';
import { AnalysisRepository, RunWithDetail } from './analysis.repository';
import { AnalysisResultDto } from './dto/analysis-result.dto';
import { inspectImage } from './image-input';
import { computeConfidence } from './pipeline/confidence.stage';
import { computeNutrition, sumNutrition } from './pipeline/nutrition.stage';
import { ResolutionStage, ResolvedItem } from './pipeline/resolve.stage';

export interface AnalysisSettings {
  maxImageBytes: number;
  dailyBudget: number;
}

export const ANALYSIS_SETTINGS = 'ANALYSIS_SETTINGS';

/** Process-wide daily analysis counter (per instance — see ADR-0007). */
interface BudgetState {
  day: string;
  used: number;
}

/**
 * The analysis pipeline (ADR-0007).
 *
 *   validate input → provider (vision|text) → schema validation
 *   → retrieval/normalization → portion → deterministic nutrition → confidence
 *   → persist → return
 *
 * The AI proposes; every number the user sees is computed here from the food
 * layer. A provider failure or an off-schema answer fails the run honestly; it
 * never falls back to a guess.
 */
@Injectable()
export class AnalysisService {
  private readonly logger = new Logger('analysis');
  private readonly budget: BudgetState = { day: '', used: 0 };

  constructor(
    // Explicit tokens: a type-only reference would be elided by the esbuild-based
    // CLI runner, leaving Nest with no injection metadata (ADR-0007 tooling note).
    @Inject(AnalysisRepository) private readonly repo: AnalysisRepository,
    @Inject(ResolutionStage) private readonly resolution: ResolutionStage,
    @Inject(VISION_PROVIDER) private readonly vision: VisionProvider,
    @Inject(TEXT_PROVIDER) private readonly text: TextProvider,
    @Inject(ANALYSIS_SETTINGS) private readonly settings: AnalysisSettings,
  ) {}

  async analyzePhoto(buffer: Buffer): Promise<AnalysisResultDto> {
    const image = inspectImage(buffer, this.settings.maxImageBytes);
    this.assertBudget();
    const payload = await this.callProvider(
      () => this.vision.analyzePhoto({ bytes: image.bytes, mimeType: image.mimeType }),
      'Photo',
    );
    return this.finish('Photo', payload);
  }

  async analyzeText(text: string): Promise<AnalysisResultDto> {
    this.assertBudget();
    const payload = await this.callProvider(
      () => this.text.analyzeText({ text }),
      'Text',
    );
    return this.finish('Text', payload);
  }

  async findById(id: string): Promise<AnalysisResultDto> {
    const run = await this.repo.findById(id);
    if (!run || run.status === 'Failed') {
      throw new NourishHttpException(
        HttpStatus.NOT_FOUND,
        ErrorCode.ANALYSIS_NOT_FOUND,
        `Analysis '${id}' not found`,
      );
    }
    return this.toDto(run);
  }

  /**
   * SAFE-07 capture. Best-effort by contract: an unknown run or a storage
   * failure is accepted and logged, never surfaced to the caller, so a
   * correction report can never block the user from saving a meal.
   */
  async recordCorrections(
    runId: string,
    corrections: {
      itemId?: string;
      action: string;
      predictedLabel?: string;
      chosenFoodId?: string;
      chosenAmount?: number;
      chosenUnit?: string;
    }[],
  ): Promise<void> {
    try {
      const run = await this.repo.findById(runId);
      if (!run) {
        this.logger.warn(`corrections for unknown analysis ${runId} ignored`);
        return;
      }
      const count = await this.repo.addCorrections(
        runId,
        run.modelVersion,
        run.promptVersion,
        corrections,
      );
      this.logger.log(`corrections recorded`, { runId, count });
    } catch (error) {
      this.logger.warn(
        `correction capture failed (ignored by design): ${(error as Error).message}`,
      );
    }
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private assertBudget(): void {
    if (this.settings.dailyBudget <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    if (this.budget.day !== today) {
      this.budget.day = today;
      this.budget.used = 0;
    }
    if (this.budget.used >= this.settings.dailyBudget) {
      throw new NourishHttpException(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.AI_BUDGET_EXHAUSTED,
        'The daily analysis budget is exhausted',
      );
    }
    this.budget.used += 1;
  }

  private async callProvider(
    call: () => Promise<AiAnalysisPayload>,
    inputKind: 'Photo' | 'Text',
  ): Promise<AiAnalysisPayload> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof AiUnavailableError) {
        await this.recordFailure(inputKind, ErrorCode.AI_UNAVAILABLE);
        throw new NourishHttpException(
          HttpStatus.SERVICE_UNAVAILABLE,
          ErrorCode.AI_UNAVAILABLE,
          'Meal analysis is not available: no AI provider is configured',
        );
      }
      if (error instanceof AiOutputValidationError) {
        this.logger.warn(`rejected off-schema AI output: ${error.details}`);
        await this.recordFailure(inputKind, ErrorCode.AI_INVALID_OUTPUT);
        throw new NourishHttpException(
          HttpStatus.BAD_GATEWAY,
          ErrorCode.AI_INVALID_OUTPUT,
          'The analysis result was malformed and has been discarded',
        );
      }
      if (error instanceof AiProviderError) {
        await this.recordFailure(
          inputKind,
          error.kind === 'timeout' ? ErrorCode.AI_TIMEOUT : ErrorCode.AI_UNAVAILABLE,
        );
        throw new NourishHttpException(
          error.kind === 'timeout' ? HttpStatus.GATEWAY_TIMEOUT : HttpStatus.BAD_GATEWAY,
          error.kind === 'timeout' ? ErrorCode.AI_TIMEOUT : ErrorCode.AI_UNAVAILABLE,
          error.kind === 'timeout'
            ? 'The analysis timed out — you can try again'
            : 'The analysis service is unavailable',
        );
      }
      throw error;
    }
  }

  private async recordFailure(inputKind: 'Photo' | 'Text', code: ErrorCode): Promise<void> {
    try {
      await this.repo.createFailed({
        inputKind,
        modelVersion: this.modelVersion(),
        promptVersion: PROMPT_VERSION,
        failureCode: code,
        notes: null,
      });
    } catch (error) {
      // Observability must never mask the real failure.
      this.logger.warn(`failed to record analysis failure: ${(error as Error).message}`);
    }
  }

  private modelVersion(): string {
    return this.vision.modelVersion;
  }

  /** Retrieval → nutrition → confidence → persistence. */
  private async finish(
    inputKind: 'Photo' | 'Text',
    payload: AiAnalysisPayload,
  ): Promise<AnalysisResultDto> {
    const resolved: ResolvedItem[] = [];
    for (const candidate of payload.foods) {
      resolved.push(await this.resolution.resolve(candidate));
    }

    const withNutrition = resolved.map((item) => ({
      ...item,
      nutrition: item.per100g == null ? null : computeNutrition(item.per100g, item.portionGrams),
    }));

    const notes: string[] = [];
    if (payload.note) notes.push(payload.note);
    if (withNutrition.length === 0) {
      notes.push('no food detected');
      await this.recordFailure(inputKind, ErrorCode.NO_FOOD_DETECTED);
      throw new NourishHttpException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.NO_FOOD_DETECTED,
        'No food could be identified in that input',
      );
    }
    const unresolvedCount = withNutrition.filter((item) => item.unresolved).length;
    if (unresolvedCount > 0) {
      notes.push(
        `${unresolvedCount} item(s) could not be matched to the food catalog — resolve or remove them`,
      );
    }

    const { overallConfidence, confidenceState } = computeConfidence(
      withNutrition.map((item) => item.confidence),
      unresolvedCount > 0,
    );

    // Alternatives only matter for the low-confidence screen (SCAN-06).
    const candidates: { displayName: string; foodId: string | null; confidence: number }[] = [];
    if (confidenceState === ConfidenceState.Low) {
      for (const item of withNutrition) {
        for (const alternative of await this.resolution.alternatives(item.displayName, 3)) {
          candidates.push({
            displayName: alternative.displayName,
            foodId: alternative.foodId,
            confidence: item.confidence,
          });
          if (candidates.length >= 3) break;
        }
        if (candidates.length >= 3) break;
      }
      if (candidates.length === 0) {
        notes.push('no alternative candidates — search manually');
      }
    }

    const run = await this.repo.createCompleted({
      inputKind,
      overallConfidence,
      confidenceState,
      modelVersion: this.modelVersion(),
      promptVersion: PROMPT_VERSION,
      notes: notes.length ? notes : null,
      items: withNutrition,
      candidates,
    });
    this.logger.log('analysis completed', {
      id: run.id,
      inputKind,
      items: run.items.length,
      confidenceState,
    });
    return this.toDto(run);
  }

  private toDto(run: RunWithDetail): AnalysisResultDto {
    const totals = sumNutrition(
      run.items
        .filter((item) => !item.unresolved && item.kcal != null)
        .map((item) => ({
          kcal: item.kcal!,
          proteinG: item.proteinG ?? 0,
          carbsG: item.carbsG ?? 0,
          fatG: item.fatG ?? 0,
          fiberG: item.fiberG,
          sodiumMg: item.sodiumMg,
        })),
    );
    return {
      id: run.id,
      status: run.status,
      inputKind: run.inputKind,
      confidenceState: run.confidenceState,
      overallConfidence: run.overallConfidence,
      items: run.items.map((item) => ({
        id: item.id,
        displayName: item.displayName,
        foodId: item.foodId,
        sourceFoodCode: item.sourceFoodCode,
        canonicalName: item.canonicalName,
        matchKind: item.matchKind,
        portion: {
          amount: item.portionAmount,
          unit: item.portionUnit,
          grams: item.portionGrams,
          estimated: item.portionEstimated,
          portionSource: item.portionSource,
        },
        nutrition:
          item.kcal == null
            ? null
            : {
                kcal: item.kcal,
                proteinG: item.proteinG ?? 0,
                carbsG: item.carbsG ?? 0,
                fatG: item.fatG ?? 0,
                fiberG: item.fiberG,
                sodiumMg: item.sodiumMg,
              },
        confidence: item.confidence,
        unresolved: item.unresolved,
      })),
      totals,
      candidates: run.candidates.map((candidate) => ({
        displayName: candidate.displayName,
        foodId: candidate.foodId,
        confidence: candidate.confidence,
      })),
      modelVersion: run.modelVersion,
      promptVersion: run.promptVersion,
      notes: Array.isArray(run.notes) ? (run.notes as string[]) : [],
    };
  }
}
