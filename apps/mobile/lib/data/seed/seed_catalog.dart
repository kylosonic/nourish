import 'package:nourish_domain/domain.dart';

/// Provenance label for every S0 seed value (PPA-8 / ADR-0004(e)):
/// provisional placeholders, superseded by the Ethiopian FCT 2025 import
/// in S1. Search UI must carry the provisional-values disclaimer.
const String seedSourceName = 'provisional-seed';

/// One provisional seed food with its portions and aliases.
class SeedFood {
  const SeedFood({
    required this.id,
    required this.canonicalName,
    required this.category,
    required this.defaultUnit,
    required this.defaultQuantity,
    required this.defaultGrams,
    required this.portions,
    required this.per100g,
    required this.aliases,
  });

  final String id;
  final String canonicalName;

  /// One of: Ethiopian, Breakfast, Lunch, Dinner, Snacks.
  final String category;
  final PortionUnit defaultUnit;
  final double defaultQuantity;
  final double defaultGrams;

  /// The food's own conversion table (a bowl of shiro ≠ a bowl of pasta).
  final List<Portion> portions;

  final NutritionPer100g per100g;
  final List<FoodAlias> aliases;
}

/// The S0 seed catalog: exactly 20 foods (blueprint §11).
///
/// Anchor values per the S0 design cards:
/// - Injera  1 piece 150g → 225 kcal (150/100g)  — exact.
/// - Beef tibs 1 serving 200g → 350 kcal (175/100g) — exact.
/// - Shiro 1 cup 240g → 281 kcal (117/100g); design card shows 280
///   (280.8 rounds half-away-from-zero to 281 — see deviation report).
/// - Misir 1 cup 200g → 216 kcal (108/100g); design card shows 215
///   (216.0 is exact from 108/100g — see deviation report).
final List<SeedFood> kSeedFoods = [
  SeedFood(
    id: 'injera',
    canonicalName: 'Injera',
    category: 'Ethiopian',
    defaultUnit: PortionUnit.injera,
    defaultQuantity: 1,
    defaultGrams: 150,
    portions: const [
      Portion(unit: PortionUnit.injera, grams: 150),
      Portion(unit: PortionUnit.halfInjera, grams: 75),
      Portion(unit: PortionUnit.largeInjera, grams: 300),
    ],
    per100g: NutritionPer100g(
      kcal: 150,
      proteinG: 5,
      carbsG: 30,
      fatG: 0.5,
      fiberG: 2,
      sodiumMg: 10,
    ),
    aliases: const [
      FoodAlias(alias: 'enjera', language: AppLanguage.en),
      FoodAlias(alias: 'እንጀራ', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'doro_wot',
    canonicalName: 'Doro Wot',
    category: 'Ethiopian',
    defaultUnit: PortionUnit.serving,
    defaultQuantity: 1,
    defaultGrams: 200,
    portions: const [
      Portion(unit: PortionUnit.serving, grams: 200),
      Portion(unit: PortionUnit.bowl, grams: 300),
      Portion(unit: PortionUnit.cup, grams: 240),
      Portion(unit: PortionUnit.ladle, grams: 100),
    ],
    per100g: NutritionPer100g(
      kcal: 160,
      proteinG: 12,
      carbsG: 4,
      fatG: 11,
      fiberG: 1,
      sodiumMg: 400,
    ),
    aliases: const [
      FoodAlias(alias: 'doro wet', language: AppLanguage.en),
      FoodAlias(alias: "doro we't", language: AppLanguage.en),
      FoodAlias(alias: 'ዶሮ ወጥ', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'shiro_wot',
    canonicalName: 'Shiro Wot',
    category: 'Ethiopian',
    defaultUnit: PortionUnit.cup,
    defaultQuantity: 1,
    defaultGrams: 240,
    portions: const [
      Portion(unit: PortionUnit.cup, grams: 240),
      Portion(unit: PortionUnit.bowl, grams: 300),
      Portion(unit: PortionUnit.ladle, grams: 100),
    ],
    per100g: NutritionPer100g(
      kcal: 117,
      proteinG: 4.5,
      carbsG: 16,
      fatG: 4.5,
      fiberG: 3,
      sodiumMg: 350,
    ),
    aliases: const [
      FoodAlias(alias: 'shiro', language: AppLanguage.en),
      FoodAlias(alias: 'shiro wet', language: AppLanguage.en),
      FoodAlias(alias: 'ሽሮ', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'misir_wot',
    canonicalName: 'Misir Wot',
    category: 'Ethiopian',
    defaultUnit: PortionUnit.cup,
    defaultQuantity: 1,
    defaultGrams: 200,
    portions: const [
      Portion(unit: PortionUnit.cup, grams: 200),
      Portion(unit: PortionUnit.bowl, grams: 280),
      Portion(unit: PortionUnit.ladle, grams: 100),
    ],
    per100g: NutritionPer100g(
      kcal: 108,
      proteinG: 5,
      carbsG: 13,
      fatG: 4.5,
      fiberG: 4,
      sodiumMg: 380,
    ),
    aliases: const [
      FoodAlias(alias: 'misir', language: AppLanguage.en),
      FoodAlias(alias: 'misir wat', language: AppLanguage.en),
      FoodAlias(alias: 'ምስር ወጥ', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'kik_alicha',
    canonicalName: 'Kik Alicha',
    category: 'Ethiopian',
    defaultUnit: PortionUnit.cup,
    defaultQuantity: 1,
    defaultGrams: 200,
    portions: const [
      Portion(unit: PortionUnit.cup, grams: 200),
      Portion(unit: PortionUnit.bowl, grams: 280),
      Portion(unit: PortionUnit.ladle, grams: 100),
    ],
    per100g: NutritionPer100g(
      kcal: 105,
      proteinG: 5,
      carbsG: 14,
      fatG: 3.5,
      fiberG: 3,
      sodiumMg: 300,
    ),
    aliases: const [
      FoodAlias(alias: 'kik', language: AppLanguage.en),
      FoodAlias(alias: 'kik wat', language: AppLanguage.en),
      FoodAlias(alias: 'ክክ አልጫ', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'beef_tibs',
    canonicalName: 'Beef Tibs',
    category: 'Ethiopian',
    defaultUnit: PortionUnit.serving,
    defaultQuantity: 1,
    defaultGrams: 200,
    portions: const [
      Portion(unit: PortionUnit.serving, grams: 200),
      Portion(unit: PortionUnit.plate, grams: 250),
      Portion(unit: PortionUnit.bowl, grams: 300),
    ],
    per100g: NutritionPer100g(
      kcal: 175,
      proteinG: 22,
      carbsG: 2,
      fatG: 9,
      sodiumMg: 300,
    ),
    aliases: const [
      FoodAlias(alias: 'tibs', language: AppLanguage.en),
      FoodAlias(alias: 'ሥጋ ጥብስ', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'chechebsa',
    canonicalName: 'Chechebsa',
    category: 'Breakfast',
    defaultUnit: PortionUnit.plate,
    defaultQuantity: 1,
    defaultGrams: 250,
    portions: const [
      Portion(unit: PortionUnit.plate, grams: 250),
      Portion(unit: PortionUnit.bowl, grams: 300),
    ],
    per100g: NutritionPer100g(
      kcal: 220,
      proteinG: 6,
      carbsG: 38,
      fatG: 6,
      fiberG: 2,
      sodiumMg: 250,
    ),
    aliases: const [FoodAlias(alias: 'kita firfir', language: AppLanguage.en)],
  ),
  SeedFood(
    id: 'fuul',
    canonicalName: 'Fuul',
    category: 'Breakfast',
    defaultUnit: PortionUnit.bowl,
    defaultQuantity: 1,
    defaultGrams: 250,
    portions: const [
      Portion(unit: PortionUnit.bowl, grams: 250),
      Portion(unit: PortionUnit.cup, grams: 200),
    ],
    per100g: NutritionPer100g(
      kcal: 130,
      proteinG: 7,
      carbsG: 18,
      fatG: 4,
      fiberG: 4,
      sodiumMg: 350,
    ),
    aliases: const [
      FoodAlias(alias: 'ful', language: AppLanguage.en),
      FoodAlias(alias: 'fava beans', language: AppLanguage.en),
    ],
  ),
  SeedFood(
    id: 'buna',
    canonicalName: 'Buna',
    category: 'Breakfast',
    defaultUnit: PortionUnit.cup,
    defaultQuantity: 1,
    defaultGrams: 200,
    portions: const [
      Portion(unit: PortionUnit.cup, grams: 200),
      Portion(unit: PortionUnit.glass, grams: 150),
    ],
    per100g: NutritionPer100g(
      kcal: 1,
      proteinG: 0.1,
      carbsG: 0.2,
      fatG: 0,
      sodiumMg: 2,
    ),
    aliases: const [
      FoodAlias(alias: 'coffee', language: AppLanguage.en),
      FoodAlias(alias: 'ቡና', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'kitfo',
    canonicalName: 'Kitfo',
    category: 'Ethiopian',
    defaultUnit: PortionUnit.serving,
    defaultQuantity: 1,
    defaultGrams: 150,
    portions: const [
      Portion(unit: PortionUnit.serving, grams: 150),
      Portion(unit: PortionUnit.plate, grams: 200),
    ],
    per100g: NutritionPer100g(
      kcal: 240,
      proteinG: 18,
      carbsG: 1,
      fatG: 19,
      sodiumMg: 350,
    ),
    aliases: const [
      FoodAlias(alias: 'ketfo', language: AppLanguage.en),
      FoodAlias(alias: 'ክትፎ', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'gomen',
    canonicalName: 'Gomen',
    category: 'Ethiopian',
    defaultUnit: PortionUnit.cup,
    defaultQuantity: 1,
    defaultGrams: 150,
    portions: const [
      Portion(unit: PortionUnit.cup, grams: 150),
      Portion(unit: PortionUnit.serving, grams: 150),
    ],
    per100g: NutritionPer100g(
      kcal: 45,
      proteinG: 3,
      carbsG: 5,
      fatG: 2.5,
      fiberG: 3,
      sodiumMg: 250,
    ),
    aliases: const [
      FoodAlias(alias: 'collard greens', language: AppLanguage.en),
      FoodAlias(alias: 'ጎመን', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'atkilt',
    canonicalName: 'Atkilt',
    category: 'Ethiopian',
    defaultUnit: PortionUnit.cup,
    defaultQuantity: 1,
    defaultGrams: 150,
    portions: const [
      Portion(unit: PortionUnit.cup, grams: 150),
      Portion(unit: PortionUnit.serving, grams: 150),
    ],
    per100g: NutritionPer100g(
      kcal: 60,
      proteinG: 2,
      carbsG: 10,
      fatG: 2,
      fiberG: 3,
      sodiumMg: 200,
    ),
    aliases: const [
      FoodAlias(alias: 'atkilt wot', language: AppLanguage.en),
      FoodAlias(alias: 'አትክልት', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'orange',
    canonicalName: 'Orange',
    category: 'Snacks',
    defaultUnit: PortionUnit.piece,
    defaultQuantity: 1,
    defaultGrams: 130,
    portions: const [Portion(unit: PortionUnit.piece, grams: 130)],
    per100g: NutritionPer100g(
      kcal: 47,
      proteinG: 0.9,
      carbsG: 11.8,
      fatG: 0.1,
      fiberG: 2.4,
    ),
    aliases: const [
      FoodAlias(alias: 'birtukan', language: AppLanguage.en),
      FoodAlias(alias: 'ብርቱካን', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'avocado',
    canonicalName: 'Avocado',
    category: 'Snacks',
    defaultUnit: PortionUnit.piece,
    defaultQuantity: 1,
    defaultGrams: 150,
    portions: const [
      Portion(unit: PortionUnit.piece, grams: 150),
      Portion(unit: PortionUnit.halfPlate, grams: 75),
    ],
    per100g: NutritionPer100g(
      kcal: 160,
      proteinG: 2,
      carbsG: 8.5,
      fatG: 14.7,
      fiberG: 6.7,
      sodiumMg: 7,
    ),
    aliases: const [
      FoodAlias(alias: 'avocado pear', language: AppLanguage.en),
      FoodAlias(alias: 'አቮካዶ', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'banana',
    canonicalName: 'Banana',
    category: 'Snacks',
    defaultUnit: PortionUnit.piece,
    defaultQuantity: 1,
    defaultGrams: 118,
    portions: const [Portion(unit: PortionUnit.piece, grams: 118)],
    per100g: NutritionPer100g(
      kcal: 89,
      proteinG: 1.1,
      carbsG: 22.8,
      fatG: 0.3,
      fiberG: 2.6,
      sodiumMg: 1,
    ),
    aliases: const [FoodAlias(alias: 'ሙዝ', language: AppLanguage.am)],
  ),
  SeedFood(
    id: 'egg',
    canonicalName: 'Egg',
    category: 'Breakfast',
    defaultUnit: PortionUnit.piece,
    defaultQuantity: 1,
    defaultGrams: 50,
    portions: const [Portion(unit: PortionUnit.piece, grams: 50)],
    per100g: NutritionPer100g(
      kcal: 155,
      proteinG: 13,
      carbsG: 1.1,
      fatG: 11,
      sodiumMg: 124,
    ),
    aliases: const [
      FoodAlias(alias: 'boiled egg', language: AppLanguage.en),
      FoodAlias(alias: 'እንቁላል', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'milk',
    canonicalName: 'Milk',
    category: 'Breakfast',
    defaultUnit: PortionUnit.glass,
    defaultQuantity: 1,
    defaultGrams: 250,
    portions: const [
      Portion(unit: PortionUnit.glass, grams: 250),
      Portion(unit: PortionUnit.cup, grams: 200),
    ],
    per100g: NutritionPer100g(
      kcal: 42,
      proteinG: 3.4,
      carbsG: 5,
      fatG: 1,
      sodiumMg: 44,
    ),
    aliases: const [
      FoodAlias(alias: 'whole milk', language: AppLanguage.en),
      FoodAlias(alias: 'ወተት', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'bread',
    canonicalName: 'Bread',
    category: 'Breakfast',
    defaultUnit: PortionUnit.piece,
    defaultQuantity: 1,
    defaultGrams: 30,
    portions: const [Portion(unit: PortionUnit.piece, grams: 30)],
    per100g: NutritionPer100g(
      kcal: 265,
      proteinG: 9,
      carbsG: 49,
      fatG: 3.2,
      fiberG: 2.7,
      sodiumMg: 490,
    ),
    aliases: const [
      FoodAlias(alias: 'dabo', language: AppLanguage.en),
      FoodAlias(alias: 'ዳቦ', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'rice',
    canonicalName: 'Rice',
    category: 'Lunch',
    defaultUnit: PortionUnit.cup,
    defaultQuantity: 1,
    defaultGrams: 180,
    portions: const [
      Portion(unit: PortionUnit.cup, grams: 180),
      Portion(unit: PortionUnit.bowl, grams: 250),
    ],
    per100g: NutritionPer100g(
      kcal: 130,
      proteinG: 2.7,
      carbsG: 28,
      fatG: 0.3,
      fiberG: 0.4,
      sodiumMg: 1,
    ),
    aliases: const [
      FoodAlias(alias: 'ruuz', language: AppLanguage.en),
      FoodAlias(alias: 'ሩዝ', language: AppLanguage.am),
    ],
  ),
  SeedFood(
    id: 'pasta',
    canonicalName: 'Pasta',
    category: 'Dinner',
    defaultUnit: PortionUnit.bowl,
    defaultQuantity: 1,
    defaultGrams: 180,
    portions: const [
      Portion(unit: PortionUnit.bowl, grams: 180),
      Portion(unit: PortionUnit.cup, grams: 140),
      Portion(unit: PortionUnit.plate, grams: 200),
    ],
    per100g: NutritionPer100g(
      kcal: 131,
      proteinG: 5,
      carbsG: 25,
      fatG: 1.1,
      fiberG: 1.8,
      sodiumMg: 5,
    ),
    aliases: const [
      FoodAlias(alias: 'spaghetti', language: AppLanguage.en),
      FoodAlias(alias: 'macaroni', language: AppLanguage.en),
      FoodAlias(alias: 'ፓስታ', language: AppLanguage.am),
    ],
  ),
];
