import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** What the device queues while offline (OFF-02). */
export const SYNC_KINDS = [
  'meal',
  'water',
  'weight',
  'cycle',
  'checkIn',
  'cycleProfile',
] as const;
export type SyncKind = (typeof SYNC_KINDS)[number];

export const SYNC_OPS = ['upsert', 'delete'] as const;
export type SyncOp = (typeof SYNC_OPS)[number];

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack', 'other'] as const;
export const CYCLE_SYMPTOMS = [
  'cramps',
  'headache',
  'fatigue',
  'bloating',
  'backache',
  'mood',
] as const;
export const PORTION_UNITS = [
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

/** One meal item, carrying the nutrition snapshot recorded on the device. */
export class SyncMealItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  clientId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  foodId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  foodName!: string;

  @IsIn(PORTION_UNITS)
  portionUnit!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(1000)
  portionQuantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5000)
  grams!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10000)
  kcal!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(1000)
  proteinG!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(1000)
  carbsG!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(1000)
  fatG!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(1000)
  fiberG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100000)
  sodiumMg?: number;
}

/** One queued operation. `updatedAt` is the device's write time (last-write-wins). */
export class SyncOperationDto {
  @IsIn(SYNC_KINDS)
  kind!: SyncKind;

  @IsIn(SYNC_OPS)
  op!: SyncOp;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  clientId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  clientSeq?: number;

  @IsISO8601()
  updatedAt!: string;

  // ── meal ────────────────────────────────────────────────────────────────
  @IsOptional()
  @IsISO8601()
  loggedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  dateKey?: string;

  @IsOptional()
  @IsIn(MEAL_SLOTS)
  slot?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => SyncMealItemDto)
  items?: SyncMealItemDto[];

  // ── water / weight ──────────────────────────────────────────────────────
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-10000)
  @Max(10000)
  amountMl?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(500)
  weightKg?: number;

  // ── private cycle and wellness data ──────────────────────────────────────
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDateKey?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDateKey?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(CYCLE_SYMPTOMS.length)
  @IsIn(CYCLE_SYMPTOMS, { each: true })
  symptoms?: (typeof CYCLE_SYMPTOMS)[number][];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(21)
  @Max(45)
  cycleLengthDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(10)
  periodLengthDays?: number;
}

/** POST /v1/sync — the device's queue, applied in order. */
export class SyncPushDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations!: SyncOperationDto[];
}

/** GET /v1/sync/changes — everything the device does not have yet. */
export class SyncChangesQueryDto {
  @IsOptional()
  @IsISO8601()
  since?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 500;
}
