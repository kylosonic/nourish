/**
 * Unit tests: Canonicalizer — stable ids, name normalization, alias
 * generation (seed-curated EN/AM + kind-tagged app transliterations).
 */
import { Canonicalizer, CanonicalAlias } from '../src/imports/canonicalizer';
import { Transliterator } from '../src/imports/transliterator';
import { FctRow } from '../src/imports/fct-parser';

const canonicalizer = new Canonicalizer(new Transliterator());

function row(overrides: Partial<FctRow>): FctRow {
  return {
    sourceFoodCode: '070156',
    nameEn: 'Beef, meat, lean, stir fried, with onion, tomato, oil, green pepper, butter and salt',
    nameAm: null,
    page: 213,
    per100g: { kcal: 191, proteinG: 15.4, carbsG: 1, fatG: 12.6 },
    ...overrides,
  };
}

describe('Canonicalizer', () => {
  it('normalizes whitespace and keeps seed slug ids for name-matched foods', () => {
    const result = canonicalizer.canonicalize([
      row({
        sourceFoodCode: '070156',
        seedSlug: 'beef_tibs',
        nameEn: '  Beef,   meat, lean, stir fried, with onion, tomato, oil, green pepper, butter and salt ',
      }),
    ]);
    expect(result.foods).toHaveLength(1);
    expect(result.foods[0].id).toBe('beef_tibs');
    expect(result.foods[0].canonicalName).toBe(
      'Beef, meat, lean, stir fried, with onion, tomato, oil, green pepper, butter and salt',
    );
  });

  it('falls back to fct-<code> ids for foods with no seed match', () => {
    const result = canonicalizer.canonicalize([
      row({ sourceFoodCode: '010001', seedSlug: undefined, nameEn: 'Amaranthus, seed, dry, raw' }),
    ]);
    expect(result.foods[0].id).toBe('fct-010001');
  });

  it('adds curated seed aliases (EN + Amharic) when the food matches a seed food', () => {
    const result = canonicalizer.canonicalize([
      row({ seedSlug: 'doro_wot', nameEn: 'Chicken, meat, without skin, stew, with onion, oil, egg, spices, butter and salt' }),
    ]);
    const aliases = result.foods[0].aliases;
    const findBy = (alias: string): CanonicalAlias | undefined => aliases.find((a) => a.alias === alias);
    expect(findBy('doro wet')?.kind).toBe('alternate');
    expect(findBy('ዶሮ ወጥ')?.kind).toBe('alternate');
    expect(findBy("doro we't")?.language).toBe('en');
  });

  it('tags rule-based transliterations with kind appTransliteration', () => {
    const result = canonicalizer.canonicalize([
      row({ seedSlug: undefined, nameEn: 'Enjera, teff, mixed', nameAm: 'Ye’teff enjera' }),
    ]);
    const am = result.foods[0].aliases.find((a) => a.alias === 'እንጀራ');
    expect(am).toBeDefined();
    expect(am?.kind).toBe('appTransliteration');
    expect(am?.language).toBe('am');
  });

  it('keeps the FCT-published Amharic name as an alternate alias', () => {
    const result = canonicalizer.canonicalize([
      row({ seedSlug: undefined, nameEn: 'Orange, pulp, raw', nameAm: 'Birtukan' }),
    ]);
    expect(result.foods[0].aliases.some((a) => a.alias === 'Birtukan' && a.kind === 'alternate')).toBe(true);
  });

  it('never mutates nutrition values (honesty rule)', () => {
    const input = row({});
    const before = JSON.stringify(input.per100g);
    const result = canonicalizer.canonicalize([input]);
    const after = JSON.stringify({
      kcal: result.foods[0].per100g.kcal,
      proteinG: result.foods[0].per100g.proteinG,
      carbsG: result.foods[0].per100g.carbsG,
      fatG: result.foods[0].per100g.fatG,
    });
    expect(after).toBe(before);
  });

  it('deduplicates aliases across sources', () => {
    const result = canonicalizer.canonicalize([
      row({ seedSlug: 'beef_tibs', nameAm: 'ሥጋ ጥብስ' }),
    ]);
    const aliases = result.foods[0].aliases;
    const dupes = aliases.filter((a) => a.alias === 'ሥጋ ጥብስ');
    expect(dupes).toHaveLength(1);
  });
});
