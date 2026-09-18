import { FoodSummaryDto, Per100gDto } from './food-summary.dto';

export interface FoodAliasDto {
  alias: string;
  language: string;
  kind: string;
}

export interface FoodPortionDto {
  unit: string; // PortionUnit.name
  quantity: number;
  grams: number;
  portionSource: string;
}

export interface FoodSourceDto {
  name: string;
  version: string;
  foodCode: string;
  reference: string;
  importDate: string;
}

/** GET /v1/foods/:id response — FoodSummary + aliases/portions/source (§8). */
export interface FoodDto extends FoodSummaryDto {
  aliases: FoodAliasDto[];
  portions: FoodPortionDto[];
  source: FoodSourceDto;
  per100g: Per100gDto;
}
