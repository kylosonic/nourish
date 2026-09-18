import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/** Whitelisted categories (lowercase codes; labels are FoodCategory.label). */
export const FOOD_CATEGORIES = ['ethiopian', 'breakfast', 'lunch', 'dinner', 'snacks'] as const;
export type FoodCategoryCode = (typeof FOOD_CATEGORIES)[number];

/** GET /v1/foods query: q ≤ 100 chars, category whitelist, pagination bounds. */
export class FoodQueryDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'q must be a string' })
  @MaxLength(100, { message: 'q must be at most 100 characters' })
  q?: string;

  @IsOptional()
  @IsIn(FOOD_CATEGORIES, {
    message: `category must be one of: ${FOOD_CATEGORIES.join(', ')}`,
  })
  category?: FoodCategoryCode;
}
