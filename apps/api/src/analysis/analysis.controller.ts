import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HttpStatus as Status } from '@nestjs/common';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';
import { AnalysisService } from './analysis.service';
import { AnalysisResultDto } from './dto/analysis-result.dto';
import { CreateAnalysisDto, RecordCorrectionsDto } from './dto/create-analysis.dto';

/**
 * The analysis surface (S2 blueprint §5).
 *
 * Anonymous in S2: no auth exists yet, so the protection is a per-route
 * rate-limit override that is far tighter than the global read bucket, plus the
 * process-wide daily budget guard. Both fail closed with explicit error codes
 * rather than degrading silently.
 *
 * The decorator is evaluated when this module is first imported, so the values
 * are read from the environment at that moment (the e2e suite raises them via
 * `test/env.setup.ts`); the defaults are the shipped production limits.
 */
export const ANALYSIS_RATE_LIMIT = {
  limit: Number(process.env.AI_RATE_LIMIT_LIMIT ?? 10),
  ttl: Number(process.env.AI_RATE_LIMIT_TTL_MS ?? 60000),
} as const;
export const CORRECTION_RATE_LIMIT = { limit: 60, ttl: 60000 } as const;

@Controller('analyses')
export class AnalysisController {
  constructor(private readonly analysis: AnalysisService) {}

  @Post()
  @Throttle({ default: ANALYSIS_RATE_LIMIT })
  async create(@Body() body: CreateAnalysisDto): Promise<AnalysisResultDto> {
    const hasImage = typeof body.imageBase64 === 'string' && body.imageBase64.length > 0;
    const hasText = typeof body.text === 'string' && body.text.trim().length > 0;

    if (hasImage && hasText) {
      throw new NourishHttpException(
        Status.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        'Provide either an image or a text description, not both',
      );
    }
    if (!hasImage && !hasText) {
      throw new NourishHttpException(
        Status.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        'Provide an image or a text description',
      );
    }

    if (hasImage) {
      return this.analysis.analyzePhoto(Buffer.from(body.imageBase64!, 'base64'));
    }
    return this.analysis.analyzeText(body.text!.trim());
  }

  @Get(':id')
  async byId(@Param('id') id: string): Promise<AnalysisResultDto> {
    return this.analysis.findById(id);
  }

  /**
   * SAFE-07 correction capture. Always 204, even when the run is unknown or the
   * write fails: capturing quality data must never block saving a meal.
   */
  @Post(':id/corrections')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: CORRECTION_RATE_LIMIT })
  async corrections(
    @Param('id') id: string,
    @Body() body: RecordCorrectionsDto,
  ): Promise<void> {
    await this.analysis.recordCorrections(id, body.items);
  }
}
