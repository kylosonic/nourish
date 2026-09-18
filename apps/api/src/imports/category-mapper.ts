import { FctRow } from './fct-parser';

/** Category codes (FoodCategory.code) and their display labels. */
export const CATEGORIES = [
  { code: 'ethiopian', label: 'Ethiopian' },
  { code: 'breakfast', label: 'Breakfast' },
  { code: 'lunch', label: 'Lunch' },
  { code: 'dinner', label: 'Dinner' },
  { code: 'snacks', label: 'Snacks' },
] as const;

/**
 * Dish→chip category mapping (committed rule table — blueprint §10).
 * Resolution order:
 *  1. exact code table (the S0-matched fixture foods keep their S0 category);
 *  2. ordered keyword rules (first match wins);
 *  3. FCT food-group defaults (documented below).
 */
const EXACT_BY_CODE: Record<string, string> = {
  '010109': 'ethiopian', // Enjera, teff, mixed → injera
  '070152': 'ethiopian', // chicken stew → doro_wot
  '030088': 'ethiopian', // spiced flour stew → shiro_wot
  '030093': 'ethiopian', // lentil stew → misir_wot
  '030094': 'ethiopian', // split pea stew → kik_alicha
  '070156': 'ethiopian', // beef stir fried → beef_tibs
  '070153': 'ethiopian', // minced beef + butter → kitfo
  '040050': 'ethiopian', // boiled kale → gomen
  '040085': 'ethiopian', // cabbage+carrot stew → atkilt
  '010191': 'breakfast', // chechebsa
  '030048': 'breakfast', // boiled broad beans → fuul
  '120007': 'breakfast', // coffee → buna
  '080001': 'breakfast', // egg
  '100008': 'breakfast', // milk
  '010133': 'breakfast', // bread
  '010167': 'lunch', // rice
  '010163': 'dinner', // pasta
  '050012': 'snacks', // orange
};

const KEYWORD_RULES: Array<{ pattern: RegExp; category: string }> = [
  // Ethiopian staple dishes (mixed/compound preparations).
  { pattern: /\b(enjera|injera)\b/i, category: 'ethiopian' },
  { pattern: /\b(wot|tibs|kitfo|shiro|firfir|beyaynetu)\b/i, category: 'ethiopian' },
  { pattern: /stew, with|stir fried|spiced flour/i, category: 'ethiopian' },
  { pattern: /\b(gomen|atkilt|fuul)\b/i, category: 'ethiopian' },
  // Breakfast foods.
  { pattern: /\b(porridge|gruel|genfo|breakfast cereal|chechebsa|firfir)\b/i, category: 'breakfast' },
  { pattern: /\b(coffee|tea|milk|egg|bread)\b/i, category: 'breakfast' },
  // Snacks: fruits, roasted grains, sweets.
  { pattern: /\b(fruit|juice|marmalade|jam|biscuit|cookie|candy|sugar|honey)\b/i, category: 'snacks' },
  { pattern: /, fresh, ripe, raw|, fresh, raw|, pulp, raw/i, category: 'snacks' },
  { pattern: /\b(roasted|popcorn|peanuts|kolo|dabo kolo)\b/i, category: 'snacks' },
  // Dinner: pasta dishes, heavier mixed dishes.
  { pattern: /\b(pasta|macaroni|spaghetti)\b/i, category: 'dinner' },
  { pattern: /\b(rice)\b/i, category: 'lunch' },
];

/**
 * Fallback mapping by EFCT 2025 food group (Table 1 of the document).
 * Raw/ingredient foods default conservatively; dishes take priority via the
 * keyword rules above. Documented; deterministic.
 */
const GROUP_DEFAULTS: Record<string, string> = {
  '01': 'breakfast', // Cereals and their products
  '02': 'lunch', // Starchy roots, tubers
  '03': 'lunch', // Legumes
  '04': 'lunch', // Vegetables
  '05': 'snacks', // Fruits
  '06': 'snacks', // Nuts, seeds
  '07': 'lunch', // Meat, poultry
  '08': 'breakfast', // Eggs
  '09': 'lunch', // Fish
  10: 'breakfast', // Milk
  11: 'lunch', // Fats and oils
  12: 'snacks', // Beverages
  13: 'snacks', // Sugar and sweetened products
  14: 'lunch', // Condiments and spices
  15: 'snacks', // Miscellaneous
  16: 'lunch', // Soups and sauces
  17: 'dinner', // Mixed dishes
};

export class CategoryMapper {
  map(row: FctRow): string {
    if (EXACT_BY_CODE[row.sourceFoodCode]) return EXACT_BY_CODE[row.sourceFoodCode];
    for (const rule of KEYWORD_RULES) {
      if (rule.pattern.test(row.nameEn)) return rule.category;
    }
    if (row.groupCode && GROUP_DEFAULTS[row.groupCode]) {
      return GROUP_DEFAULTS[row.groupCode];
    }
    return 'ethiopian';
  }
}
