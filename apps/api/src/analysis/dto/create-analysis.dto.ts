import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBase64,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** POST /v1/analyses — either an image (base64) or a text description. */
export class CreateAnalysisDto {
  /** Base64 image bytes (no data-URL prefix). Validated by magic bytes server-side. */
  @IsOptional()
  @IsBase64()
  @MaxLength(8 * 1024 * 1024)
  imageBase64?: string;

  /** Free-text description, e.g. "2 injera with shiro and an orange" (LOG-01). */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  text?: string;
}

export const CORRECTION_ACTIONS = ['swap', 'portion', 'remove', 'add'] as const;

export class CorrectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  itemId?: string;

  @IsIn(CORRECTION_ACTIONS)
  action!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  predictedLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  chosenFoodId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  chosenAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  chosenUnit?: string;
}

/** POST /v1/analyses/:id/corrections (SAFE-07, best-effort). */
export class RecordCorrectionsDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CorrectionDto)
  items!: CorrectionDto[];
}
