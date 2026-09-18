/**
 * Geez↔Latin transliteration for food names (kind: appTransliteration).
 * Aliases produced here are search infrastructure ONLY — explicitly not FCT
 * nutrition data (D3). Coverage: the syllables/terms that occur in the
 * EFCT 2025 food-name vocabulary; the rule maps are committed so results
 * are deterministic.
 */

/** Curated term map: Latin food terms → Geez (used to build Amharic aliases). */
const LATIN_TO_GEEZ_TERMS: Array<[string, string]> = [
  ['enjera', 'እንጀራ'],
  ['injera', 'እንጀራ'],
  ['wot', 'ወጥ'],
  ['wet', 'ወጥ'],
  ['doro', 'ዶሮ'],
  ['shiro', 'ሽሮ'],
  ['misir', 'ምስር'],
  ['kik', 'ክክ'],
  ['alicha', 'አልጫ'],
  ['tibs', 'ጥብስ'],
  ['kitfo', 'ክትፎ'],
  ['gomen', 'ጎመን'],
  ['kale', 'ጎመን'],
  ['atkilt', 'አትክልት'],
  ['buna', 'ቡና'],
  ['coffee', 'ቡና'],
  ['dabo', 'ዳቦ'],
  ['bread', 'ዳቦ'],
  ['milk', 'ወተት'],
  ['watet', 'ወተት'],
  ['egg', 'እንቁላል'],
  ['enqulal', 'እንቁላል'],
  ['rice', 'ሩዝ'],
  ['pasta', 'ፓስታ'],
  ['firfir', 'ፍርፍር'],
  ['genfo', 'ገንፎ'],
  ['kolo', 'ቆሎ'],
  ['beso', 'ብሶ'],
  ['teff', 'ጤፍ'],
  ['tef', 'ጤፍ'],
  ['sorghum', 'ማሽላ'],
  ['mashila', 'ማሽላ'],
  ['barley', 'ገብስ'],
  ['gebs', 'ገብስ'],
  ['maize', 'በቆሎ'],
  ['bekolo', 'በቆሎ'],
  ['chicken', 'ዶሮ'],
  ['beef', 'የበሬ ሥጋ'],
  ['lentil', 'ምስር'],
  ['pea', 'አተር'],
  ['ater', 'አተር'],
  ['banana', 'ሙዝ'],
  ['muz', 'ሙዝ'],
  ['orange', 'ብርቱካን'],
  ['birtukan', 'ብርቱካን'],
  ['avocado', 'አቮካዶ'],
  ['potato', 'ድንች'],
  ['dinch', 'ድንች'],
  ['cabbage', 'ጎመን'],
  ['carrot', 'ካሮት'],
  ['onion', 'ሽንኩርት'],
  ['shinkurt', 'ሽንኩርት'],
  ['butter', 'ቅቤ'],
  ['kibe', 'ቅቤ'],
  ['honey', 'ማር'],
  ['mar', 'ማር'],
  ['sugar', 'ስኳር'],
  ['sukuar', 'ስኳር'],
  ['salt', 'ጨው'],
  ['chew', 'ጨው'],
  ['fish', 'ዓሣ'],
  ['asa', 'ዓሣ'],
  ['water', 'ውሃ'],
  ['wuha', 'ውሃ'],
];

/**
 * Geez syllable → Latin mapping (the fidel subset occurring in food names).
 * A syllable is read consonant+vowel; ejective consonants get a trailing
 * apostrophe ("ጥ" → "t'"). Coverage is documented; unmapped syllables pass
 * through unchanged.
 */
const GEEZ_TO_LATIN: Record<string, string> = {
  ሀ: 'ha', ሁ: 'hu', ሂ: 'hi', ሃ: 'ha', ሄ: 'he', ህ: 'h', ሆ: 'ho',
  ለ: 'le', ሉ: 'lu', ሊ: 'li', ላ: 'la', ሌ: 'le', ል: 'l', ሎ: 'lo',
  ሐ: 'ha', ሑ: 'hu', ሒ: 'hi', ሓ: 'ha', ሔ: 'he', ሕ: 'h', ሖ: 'ho',
  መ: 'me', ሙ: 'mu', ሚ: 'mi', ማ: 'ma', ሜ: 'me', ም: 'm', ሞ: 'mo',
  ሠ: 'se', ሡ: 'su', ሢ: 'si', ሣ: 'sa', ሤ: 'se', ሥ: 's', ሦ: 'so',
  ረ: 're', ሩ: 'ru', ሪ: 'ri', ራ: 'ra', ሬ: 're', ር: 'r', ሮ: 'ro',
  ሰ: 'se', ሱ: 'su', ሲ: 'si', ሳ: 'sa', ሴ: 'se', ስ: 's', ሶ: 'so',
  ሸ: 'she', ሹ: 'shu', ሺ: 'shi', ሻ: 'sha', ሼ: 'she', ሽ: 'sh', ሾ: 'sho',
  ቀ: "q'e", ቁ: "q'u", ቂ: "q'i", ቃ: "q'a", ቄ: "q'e", ቅ: "q'", ቆ: "q'o",
  በ: 'be', ቡ: 'bu', ቢ: 'bi', ባ: 'ba', ቤ: 'be', ብ: 'b', ቦ: 'bo',
  ተ: 'te', ቱ: 'tu', ቲ: 'ti', ታ: 'ta', ቴ: 'te', ት: 't', ቶ: 'to',
  ቸ: 'che', ቹ: 'chu', ቺ: 'chi', ቻ: 'cha', ቼ: 'che', ች: 'ch', ቾ: 'cho',
  ኀ: 'ha', ኁ: 'hu', ኂ: 'hi', ኃ: 'ha', ኄ: 'he', ኅ: 'h', ኆ: 'ho',
  ነ: 'ne', ኑ: 'nu', ኒ: 'ni', ና: 'na', ኔ: 'ne', ን: 'n', ኖ: 'no',
  አ: 'a', ኡ: 'u', ኢ: 'i', ኣ: 'a', ኤ: 'e', እ: 'e', ኦ: 'o',
  ከ: 'ke', ኩ: 'ku', ኪ: 'ki', ካ: 'ka', ኬ: 'ke', ክ: 'k', ኮ: 'ko',
  ኸ: 'he', ኹ: 'hu', ኺ: 'hi', ኻ: 'ha', ኼ: 'he', ኽ: 'h', ኾ: 'ho',
  ወ: 'we', ዉ: 'wu', ዊ: 'wi', ዋ: 'wa', ዌ: 'we', ው: 'w', ዎ: 'wo',
  ዐ: 'a', ዑ: 'u', ዒ: 'i', ዓ: 'a', ዔ: 'e', ዕ: 'e', ዖ: 'o',
  ዘ: 'ze', ዙ: 'zu', ዚ: 'zi', ዛ: 'za', ዜ: 'ze', ዝ: 'z', ዞ: 'zo',
  ዠ: 'zhe', ዡ: 'zhu', ዢ: 'zhi', ዣ: 'zha', ዤ: 'zhe', ዥ: 'zh', ዦ: 'zho',
  የ: 'ye', ዩ: 'yu', ዪ: 'yi', ያ: 'ya', ዬ: 'ye', ይ: 'y', ዮ: 'yo',
  ደ: 'de', ዱ: 'du', ዲ: 'di', ዳ: 'da', ዴ: 'de', ድ: 'd', ዶ: 'do',
  ጀ: 'je', ጁ: 'ju', ጂ: 'ji', ጃ: 'ja', ጄ: 'je', ጅ: 'j', ጆ: 'jo',
  ገ: 'ge', ጉ: 'gu', ጊ: 'gi', ጋ: 'ga', ጌ: 'ge', ግ: 'g', ጎ: 'go',
  ጠ: "t'e", ጡ: "t'u", ጢ: "t'i", ጣ: "t'a", ጤ: "t'e", ጥ: "t'", ጦ: "t'o",
  ጨ: "ch'e", ጩ: "ch'u", ጪ: "ch'i", ጫ: "ch'a", ጬ: "ch'e", ጭ: "ch'", ጮ: "ch'o",
  ጰ: "p'e", ጱ: "p'u", ጲ: "p'i", ጳ: "p'a", ጴ: "p'e", ጵ: "p'", ጶ: "p'o",
  ጸ: "ts'e", ጹ: "ts'u", ጺ: "ts'i", ጻ: "ts'a", ጼ: "ts'e", ጽ: "ts'", ጾ: "ts'o",
  ፀ: "ts'e", ፁ: "ts'u", ፂ: "ts'i", ፃ: "ts'a", ፄ: "ts'e", ፅ: "ts'", ፆ: "ts'o",
  ፈ: 'fe', ፉ: 'fu', ፊ: 'fi', ፋ: 'fa', ፌ: 'fe', ፍ: 'f', ፎ: 'fo',
  ፐ: 'pe', ፑ: 'pu', ፒ: 'pi', ፓ: 'pa', ፔ: 'pe', ፕ: 'p', ፖ: 'po',
  ፗ: 'wa', ፘ: 'ya', ፙ: 'mya',
};

/**
 * Version of the local canonicalization rules (aliases, transliteration,
 * component-word filtering). Stored on every ImportRun and part of the
 * idempotency key, so editing a rule re-derives the food layer instead of
 * silently keeping the output of the previous rules.
 */
export const CANONICALIZATION_RULES_VERSION = '2026-09-19.3';

/**
 * Ingredient words that describe a *component* of a dish rather than the dish
 * itself. QA finding F-04: transliterating every word of the FCT description
 * made "ጨው" (salt) an alias of 11 different foods and "ሽንኩርት" (onion) an alias
 * of 6, so a search for a common ingredient returned stews before the food the
 * user asked for. These terms are only used when NOTHING more specific matched
 * (so a condiment actually named "Salt" keeps its own alias).
 */
const COMPONENT_STOP_WORDS = new Set<string>([
  'salt',
  'chew',
  'onion',
  'shinkurt',
  'butter',
  'kibe',
  'water',
  'wuha',
  'oil',
]);

export class Transliterator {
  /** Latin-script transliteration of an Amharic string (documented coverage). */
  transliterateAmToLatin(amharic: string): string {
    let out = '';
    for (const ch of amharic) {
      out += GEEZ_TO_LATIN[ch] ?? ch;
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  /**
   * Amharic aliases built from Latin food terms present in an English name.
   * Returns [] when no known term matches (never fabricates a translation).
   *
   * Two filters keep the alias set honest (QA F-04):
   *  - component words (salt, onion, butter, water, oil) are dropped whenever the
   *    name also carries a specific food term, so composite dishes no longer
   *    inherit their ingredients' names as search aliases;
   *  - a term the name explicitly negates is never generated, so
   *    "…(without salt)" does not become an alias for ጨው.
   * Terms match with an optional plural "s" ("peas" → pea).
   */
  transliterateEnToAm(nameEn: string): string[] {
    const lower = nameEn.toLowerCase();
    const specific = new Set<string>();
    const components = new Set<string>();
    for (const [term, geez] of LATIN_TO_GEEZ_TERMS) {
      const boundary = new RegExp(`\\b${term}s?\\b`, 'i');
      if (!boundary.test(lower)) continue;
      if (new RegExp(`\\bwithout\\s+${term}s?\\b`, 'i').test(lower)) continue;
      if (COMPONENT_STOP_WORDS.has(term)) components.add(geez);
      else specific.add(geez);
    }
    return [...(specific.size > 0 ? specific : components)];
  }
}
