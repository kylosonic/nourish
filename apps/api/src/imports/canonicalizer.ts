import { FctRow } from './fct-parser';
import { Transliterator } from './transliterator';

/** S0 bootstrap seed foods (name match keeps the seed slug as stable id, §11). */
export interface SeedFoodRef {
  slug: string;
  name: string;
  /** Curated Amharic aliases shipped with the S0 seed (kind: alternate). */
  amAliases: string[];
  /** Curated English alias variants shipped with the S0 seed. */
  enAliases: string[];
}

export const SEED_FOODS: SeedFoodRef[] = [
  { slug: 'injera', name: 'Injera', amAliases: ['እንጀራ'], enAliases: ['enjera'] },
  {
    slug: 'doro_wot',
    name: 'Doro Wot',
    amAliases: ['ዶሮ ወጥ'],
    enAliases: ['doro wet', "doro we't"],
  },
  { slug: 'shiro_wot', name: 'Shiro Wot', amAliases: ['ሽሮ'], enAliases: ['shiro', 'shiro wet'] },
  { slug: 'misir_wot', name: 'Misir Wot', amAliases: ['ምስር ወጥ'], enAliases: ['misir', 'misir wat'] },
  { slug: 'kik_alicha', name: 'Kik Alicha', amAliases: ['ክክ አልጫ'], enAliases: ['kik', 'kik wat'] },
  { slug: 'beef_tibs', name: 'Beef Tibs', amAliases: ['ሥጋ ጥብስ'], enAliases: ['tibs'] },
  { slug: 'chechebsa', name: 'Chechebsa', amAliases: [], enAliases: ['kita firfir'] },
  { slug: 'fuul', name: 'Fuul', amAliases: [], enAliases: ['ful', 'fava beans'] },
  { slug: 'buna', name: 'Buna', amAliases: ['ቡና'], enAliases: ['coffee'] },
  { slug: 'kitfo', name: 'Kitfo', amAliases: ['ክትፎ'], enAliases: ['ketfo'] },
  { slug: 'gomen', name: 'Gomen', amAliases: ['ጎመን'], enAliases: ['collard greens'] },
  { slug: 'atkilt', name: 'Atkilt', amAliases: ['አትክልት'], enAliases: ['atkilt wot'] },
  { slug: 'orange', name: 'Orange', amAliases: ['ብርቱካን'], enAliases: ['birtukan'] },
  { slug: 'avocado', name: 'Avocado', amAliases: ['አቮካዶ'], enAliases: ['avocado pear'] },
  { slug: 'banana', name: 'Banana', amAliases: ['ሙዝ'], enAliases: [] },
  { slug: 'egg', name: 'Egg', amAliases: ['እንቁላል'], enAliases: ['boiled egg'] },
  { slug: 'milk', name: 'Milk', amAliases: ['ወተት'], enAliases: ['whole milk'] },
  { slug: 'bread', name: 'Bread', amAliases: ['ዳቦ'], enAliases: ['dabo'] },
  { slug: 'rice', name: 'Rice', amAliases: ['ሩዝ'], enAliases: ['ruuz'] },
  { slug: 'pasta', name: 'Pasta', amAliases: ['ፓስታ'], enAliases: ['spaghetti', 'macaroni'] },
];

export interface CanonicalAlias {
  alias: string;
  language: 'en' | 'am' | 'om';
  kind: 'alternate' | 'transliteration' | 'misspelling' | 'appTransliteration';
}

export interface CanonicalFood {
  id: string;
  sourceFoodCode: string;
  canonicalName: string;
  nameAm: string | null;
  aliases: CanonicalAlias[];
  per100g: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number | null;
    sodiumMg: number | null;
    extra: Record<string, number | string>;
  };
}

export interface CanonicalizeResult {
  foods: CanonicalFood[];
  warnings: string[];
}

/** Name normalization: trim + collapse internal whitespace. */
export function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

/** Common Latin spelling variants for food terms ("enjera"↔"injera"). */
const SPELLING_VARIANTS: Array<[RegExp, string]> = [
  [/\benjera\b/gi, 'injera'],
  [/\binjera\b/gi, 'enjera'],
];

function latinSpellingVariants(canonicalName: string): string[] {
  const variants: string[] = [];
  for (const [pattern, replacement] of SPELLING_VARIANTS) {
    const original = pattern.source;
    const re = new RegExp(original, 'gi');
    if (re.test(canonicalName)) {
      const variant = canonicalName.replace(re, replacement);
      if (variant !== canonicalName) variants.push(variant);
    }
  }
  return variants;
}

/**
 * Canonicalization stage (blueprint §10 stage 4): stable ids (seed slug on
 * name match, else fct-<code>), name normalization, alias generation
 * (seed-curated EN/AM + app transliterations). Nutrition values pass through
 * UNTOUCHED — the honesty rule forbids any transformation of numbers here.
 */
export class Canonicalizer {
  constructor(private readonly transliterator: Transliterator) {}

  canonicalize(rows: FctRow[]): CanonicalizeResult {
    const foods: CanonicalFood[] = [];
    const warnings: string[] = [];

    for (const row of rows) {
      const canonicalName = normalizeName(row.nameEn);
      const seed = row.seedSlug ? this.seedBySlug(row.seedSlug) : this.matchSeed(canonicalName);

      if (row.seedSlug && !seed) {
        warnings.push(
          `${row.sourceFoodCode}: fixture declares seedSlug '${row.seedSlug}' but no seed food matches the name`,
        );
      }

      const id = seed ? seed.slug : `fct-${row.sourceFoodCode}`;
      const aliases = this.buildAliases(canonicalName, row.nameAm, seed, warnings, row.sourceFoodCode);

      const extra: Record<string, number | string> = {};
      for (const [key, value] of Object.entries(row.per100g)) {
        if (value == null) continue;
        if (typeof value === 'number' || typeof value === 'string') {
          if (
            key !== 'kcal' &&
            key !== 'proteinG' &&
            key !== 'carbsG' &&
            key !== 'fatG' &&
            key !== 'fiberG' &&
            key !== 'sodiumMg'
          ) {
            extra[key] = value;
          }
        }
      }

      foods.push({
        id,
        sourceFoodCode: row.sourceFoodCode,
        canonicalName,
        nameAm: row.nameAm ? normalizeName(row.nameAm) : null,
        aliases,
        per100g: {
          kcal: row.per100g.kcal as number,
          proteinG: row.per100g.proteinG as number,
          carbsG: row.per100g.carbsG as number,
          fatG: row.per100g.fatG as number,
          fiberG: typeof row.per100g.fiberG === 'number' ? row.per100g.fiberG : null,
          sodiumMg: typeof row.per100g.sodiumMg === 'number' ? row.per100g.sodiumMg : null,
          extra,
        },
      });
    }

    return { foods, warnings };
  }

  private seedBySlug(slug: string): SeedFoodRef | undefined {
    return SEED_FOODS.find((s) => s.slug === slug);
  }

  /** Name-match: normalized equality or canonical name starts with seed name. */
  private matchSeed(canonicalName: string): SeedFoodRef | undefined {
    const normalized = normalizeName(canonicalName).toLowerCase();
    return SEED_FOODS.find((s) => {
      const seedName = s.name.toLowerCase();
      return normalized === seedName || normalized.startsWith(`${seedName},`) || normalized.startsWith(`${seedName} `);
    });
  }

  private buildAliases(
    canonicalName: string,
    nameAm: string | null,
    seed: SeedFoodRef | undefined,
    warnings: string[],
    code: string,
  ): CanonicalAlias[] {
    const aliases: CanonicalAlias[] = [];
    const seen = new Set<string>([canonicalName.toLowerCase()]);

    const push = (alias: string, language: CanonicalAlias['language'], kind: CanonicalAlias['kind']): void => {
      const clean = normalizeName(alias);
      if (!clean || clean.toLowerCase() === canonicalName.toLowerCase()) return;
      const key = `${language}:${clean.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      aliases.push({ alias: clean, language, kind });
    };

    // 1. Seed-curated aliases (kind: alternate) — where the food matches an S0 seed.
    if (seed) {
      // The seed's own short display name is how the app (and its users) refer to
      // the food ("Injera", "Doro Wot"), so it must resolve as an alias rather
      // than fall through to a substring match on the long FCT description.
      push(seed.name, 'en', 'alternate');
      for (const en of seed.enAliases) push(en, 'en', 'alternate');
      for (const am of seed.amAliases) push(am, 'am', 'alternate');
    }

    // 1b. Common Latin spelling variants (deterministic, kind: alternate).
    for (const variant of latinSpellingVariants(canonicalName)) {
      push(variant, 'en', 'alternate');
    }

    // 2. FCT-published Amharic name (alternate — from the source table).
    if (nameAm) push(nameAm, 'am', 'alternate');

    // 3. Rule-based transliterations (kind: appTransliteration, search infra only).
    for (const geez of this.transliterator.transliterateEnToAm(canonicalName)) {
      if (!(nameAm && normalizeName(nameAm).toLowerCase() === geez.toLowerCase())) {
        push(geez, 'am', 'appTransliteration');
      }
    }
    if (nameAm) {
      const latin = this.transliterator.transliterateAmToLatin(nameAm);
      if (latin && latin !== canonicalName.toLowerCase()) {
        push(latin, 'am', 'appTransliteration');
      }
    }

    if (aliases.length === 0) {
      warnings.push(`${code}: no aliases generated for '${canonicalName}'`);
    }
    return aliases;
  }
}
