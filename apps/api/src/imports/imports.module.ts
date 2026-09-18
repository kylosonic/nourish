import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsRepository } from './imports.repository';
import { FctParser } from './fct-parser';
import { FctRowValidator } from './fct-row-validator';
import { Canonicalizer } from './canonicalizer';
import { Transliterator } from './transliterator';
import { CategoryMapper } from './category-mapper';
import { PortionStandards } from './portion-standards';

@Module({
  providers: [
    ImportsService,
    ImportsRepository,
    FctParser,
    FctRowValidator,
    Transliterator,
    Canonicalizer,
    CategoryMapper,
    PortionStandards,
  ],
  exports: [ImportsService],
})
export class ImportsModule {}
