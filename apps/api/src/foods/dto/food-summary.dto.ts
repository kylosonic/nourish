/** Per-100g nutrition block (§8). Optional fields omitted when null. */
export interface Per100gDto {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sodiumMg?: number;
}

export interface DefaultPortionDto {
  unit: string;
  quantity: number;
  grams: number;
}

export interface SourceSummaryDto {
  name: string;
  version: string;
}

/** GET /v1/foods list item (§8). */
export interface FoodSummaryDto {
  id: string;
  canonicalName: string;
  category: string;
  defaultPortion: DefaultPortionDto;
  per100g: Per100gDto;
  source: SourceSummaryDto;
}

export interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
}

export interface FoodListResponseDto {
  data: FoodSummaryDto[];
  meta: PaginationMetaDto;
}
