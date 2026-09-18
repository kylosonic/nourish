import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Shared pagination params: page ≥ 1 (default 1), limit 1..100 (default 20). */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  // QA F-09: an unbounded page lets `(page - 1) * limit` grow without limit in
  // the OFFSET. 10 000 pages is far beyond the catalog's real depth (722 rows
  // at limit 100 = 8 pages) and keeps the value provably safe.
  @Max(10000, { message: 'page must be at most 10000' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must be at most 100' })
  limit: number = 20;
}
