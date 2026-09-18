import { FoodDto } from './food.dto';

/** GET /v1/catalog response (§8): version-gated full snapshot. */
export interface CatalogDto {
  version: string;
  generatedAt: string;
  sha256: string;
  foods: FoodDto[];
}
