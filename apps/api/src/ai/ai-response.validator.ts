import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AiAnalysisPayload, AiFoodCandidate } from './ai-provider';

/**
 * Runtime schema validation at the AI boundary (ADR-0007 D-S2-3, master §16).
 *
 * Uses the project's single validation stack (class-validator), the same one the
 * HTTP DTOs use. `whitelist` + `forbidNonWhitelisted` means a provider that
 * invents extra fields, returns nutrition, or emits the wrong types produces a
 * hard failure instead of a partially-trusted object.
 */

/** Portion units the model may name — must match the domain PortionUnit enum. */
export const ALLOWED_UNITS = [
  'gram',
  'kilogram',
  'milliliter',
  'serving',
  'piece',
  'plate',
  'halfPlate',
  'bowl',
  'cup',
  'glass',
  'spoon',
  'ladle',
  'small',
  'regular',
  'large',
  'halfInjera',
  'injera',
  'largeInjera',
] as const;

export class AiFoodCandidateDto implements AiFoodCandidate {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(100)
  amount?: number;

  @IsOptional()
  @IsIn(ALLOWED_UNITS)
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5000)
  grams?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  confidence!: number;
}

export class AiAnalysisPayloadDto implements AiAnalysisPayload {
  @IsArray()
  @ArrayMaxSize(8, { message: 'a single analysis may name at most 8 foods' })
  @ValidateNested({ each: true })
  @Type(() => AiFoodCandidateDto)
  foods!: AiFoodCandidateDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  overallConfidence?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class AiOutputValidationError extends Error {
  constructor(readonly details: string) {
    super(`AI output failed schema validation: ${details}`);
    this.name = 'AiOutputValidationError';
  }
}

/**
 * Validate a raw provider payload. Throws [AiOutputValidationError] on any
 * violation — the caller fails the run with AI_INVALID_OUTPUT and nothing from
 * the payload is surfaced or persisted as a result.
 */
export function validateAiPayload(raw: unknown): AiAnalysisPayload {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new AiOutputValidationError('payload is not a JSON object');
  }
  const dto = plainToInstance(AiAnalysisPayloadDto, raw, {
    excludeExtraneousValues: false,
    enableImplicitConversion: false,
  });
  const errors = validateSync(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: false,
  });
  if (errors.length) {
    const details = errors
      .map((e) => {
        const children = e.children ?? [];
        const childDetails = children
          .map((c) => `${e.property}[].${c.property}: ${Object.values(c.constraints ?? {}).join(', ')}`)
          .join('; ');
        return childDetails || `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`;
      })
      .join(' | ');
    throw new AiOutputValidationError(details);
  }
  return {
    foods: dto.foods.map((f) => ({
      label: f.label,
      amount: f.amount,
      unit: f.unit,
      grams: f.grams,
      confidence: f.confidence,
    })),
    overallConfidence: dto.overallConfidence,
    note: dto.note,
  };
}
