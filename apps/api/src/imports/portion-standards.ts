import { CanonicalFood } from './canonicalizer';

export interface StandardPortion {
  unit: string; // PortionUnit.name (packages/domain)
  quantity: number;
  grams: number;
}

export interface PortionPlan {
  defaultPortion: StandardPortion;
  portions: StandardPortion[];
}

/** Every portion gram weight below is a Nourish-defined standard measure
 * (portionSource: nourish-standard) — NOT FCT data (D3, ADR-0006). The FCT
 * supplies per-100g nutrition only. Weights mirror the S0 seed standards. */
const FAMILY_RULES: Array<{ pattern: RegExp; plan: PortionPlan }> = [
  {
    pattern: /\b(enjera|injera)\b/i,
    plan: {
      defaultPortion: { unit: 'injera', quantity: 1, grams: 150 },
      portions: [
        { unit: 'injera', quantity: 1, grams: 150 },
        { unit: 'halfInjera', quantity: 1, grams: 75 },
        { unit: 'largeInjera', quantity: 1, grams: 300 },
      ],
    },
  },
  {
    pattern: /\b(wot|stew, with|stew with)\b/i,
    plan: {
      defaultPortion: { unit: 'cup', quantity: 1, grams: 240 },
      portions: [
        { unit: 'cup', quantity: 1, grams: 240 },
        { unit: 'bowl', quantity: 1, grams: 300 },
        { unit: 'ladle', quantity: 1, grams: 100 },
      ],
    },
  },
  {
    pattern: /\btibs\b|\bstir fried\b/i,
    plan: {
      defaultPortion: { unit: 'serving', quantity: 1, grams: 200 },
      portions: [
        { unit: 'serving', quantity: 1, grams: 200 },
        { unit: 'plate', quantity: 1, grams: 250 },
        { unit: 'bowl', quantity: 1, grams: 300 },
      ],
    },
  },
  {
    pattern: /\bkitfo\b|\bminced\b/i,
    plan: {
      defaultPortion: { unit: 'serving', quantity: 1, grams: 150 },
      portions: [
        { unit: 'serving', quantity: 1, grams: 150 },
        { unit: 'plate', quantity: 1, grams: 200 },
      ],
    },
  },
  {
    pattern: /\b(coffee|buna)\b/i,
    plan: {
      defaultPortion: { unit: 'cup', quantity: 1, grams: 200 },
      portions: [
        { unit: 'cup', quantity: 1, grams: 200 },
        { unit: 'glass', quantity: 1, grams: 150 },
      ],
    },
  },
  {
    pattern: /\bmilk\b|\bcheese\b|\bbutter milk\b/i,
    plan: {
      defaultPortion: { unit: 'glass', quantity: 1, grams: 250 },
      portions: [
        { unit: 'glass', quantity: 1, grams: 250 },
        { unit: 'cup', quantity: 1, grams: 200 },
      ],
    },
  },
  {
    pattern: /\btea\b|\bjuice\b|\bbeverage\b/i,
    plan: {
      defaultPortion: { unit: 'glass', quantity: 1, grams: 250 },
      portions: [{ unit: 'glass', quantity: 1, grams: 250 }],
    },
  },
  {
    pattern: /\bbread\b|\bdabo\b/i,
    plan: {
      defaultPortion: { unit: 'piece', quantity: 1, grams: 30 },
      portions: [{ unit: 'piece', quantity: 1, grams: 30 }],
    },
  },
  {
    pattern: /\begg\b/i,
    plan: {
      defaultPortion: { unit: 'piece', quantity: 1, grams: 50 },
      portions: [{ unit: 'piece', quantity: 1, grams: 50 }],
    },
  },
  {
    pattern: /\brice\b/i,
    plan: {
      defaultPortion: { unit: 'cup', quantity: 1, grams: 180 },
      portions: [
        { unit: 'cup', quantity: 1, grams: 180 },
        { unit: 'bowl', quantity: 1, grams: 250 },
      ],
    },
  },
  {
    pattern: /\b(pasta|macaroni|spaghetti|noodles)\b/i,
    plan: {
      defaultPortion: { unit: 'bowl', quantity: 1, grams: 180 },
      portions: [
        { unit: 'bowl', quantity: 1, grams: 180 },
        { unit: 'cup', quantity: 1, grams: 140 },
        { unit: 'plate', quantity: 1, grams: 200 },
      ],
    },
  },
  {
    pattern: /\b(porridge|gruel|genfo)\b/i,
    plan: {
      defaultPortion: { unit: 'bowl', quantity: 1, grams: 300 },
      portions: [
        { unit: 'bowl', quantity: 1, grams: 300 },
        { unit: 'cup', quantity: 1, grams: 200 },
      ],
    },
  },
  {
    pattern: /\b(kale|gomen|spinach|greens)\b/i,
    plan: {
      defaultPortion: { unit: 'cup', quantity: 1, grams: 150 },
      portions: [
        { unit: 'cup', quantity: 1, grams: 150 },
        { unit: 'serving', quantity: 1, grams: 150 },
      ],
    },
  },
  {
    pattern: /, fresh, ripe, raw|, fresh, raw|, pulp, raw/i,
    plan: {
      defaultPortion: { unit: 'piece', quantity: 1, grams: 130 },
      portions: [{ unit: 'piece', quantity: 1, grams: 130 }],
    },
  },
];

/** Per-food overrides for the S0-matched fixtures (mirror S0 seed weights). */
const EXACT_GRAMS: Record<string, number> = {
  orange: 130, // seed slug (fruit default already 130 — explicit for clarity)
};

const FALLBACK: PortionPlan = {
  defaultPortion: { unit: 'serving', quantity: 1, grams: 100 },
  portions: [{ unit: 'serving', quantity: 1, grams: 100 }],
};

export class PortionStandards {
  /** Deterministic Nourish standard measure plan for a canonical food. */
  plan(food: CanonicalFood): PortionPlan {
    const exact = EXACT_GRAMS[food.id];
    if (exact) {
      return {
        defaultPortion: { unit: 'piece', quantity: 1, grams: exact },
        portions: [{ unit: 'piece', quantity: 1, grams: exact }],
      };
    }
    const name = `${food.canonicalName} ${food.nameAm ?? ''}`;
    for (const rule of FAMILY_RULES) {
      if (rule.pattern.test(name)) return rule.plan;
    }
    return FALLBACK;
  }
}
