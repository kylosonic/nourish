import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { EnvVars } from '../config/env';
import { FoodsModule } from '../foods/foods.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalysisController } from './analysis.controller';
import { ANALYSIS_SETTINGS, AnalysisService } from './analysis.service';
import { AnalysisRepository } from './analysis.repository';
import { ResolutionStage } from './pipeline/resolve.stage';

/**
 * S2 analysis module. `FoodsModule` supplies the retrieval read-side repository
 * so the pipeline resolves labels against exactly the same catalog the public
 * API serves — one source of truth for the food layer.
 */
@Module({
  imports: [PrismaModule, FoodsModule, AiModule],
  controllers: [AnalysisController],
  providers: [
    AnalysisRepository,
    AnalysisService,
    ResolutionStage,
    {
      provide: ANALYSIS_SETTINGS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars, true>) => ({
        maxImageBytes: config.get('AI_MAX_IMAGE_BYTES', { infer: true }),
        dailyBudget: config.get('AI_DAILY_BUDGET', { infer: true }),
      }),
    },
  ],
  exports: [AnalysisService, AnalysisRepository],
})
export class AnalysisModule {}
