export type Language = 'en' | 'am' | 'om';
export type Sex = 'female' | 'male';
export type Goal = 'lose' | 'muscle' | 'maintain' | 'healthy';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'veryActive' | 'athlete';
export type Pace = 'conservative' | 'moderate' | 'aggressive';
export type FoodPreference = 'ethiopian' | 'mixed' | 'international';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export type PortionUnit =
  | 'gram'
  | 'kilogram'
  | 'milliliter'
  | 'serving'
  | 'piece'
  | 'plate'
  | 'halfPlate'
  | 'bowl'
  | 'cup'
  | 'glass'
  | 'spoon'
  | 'ladle'
  | 'small'
  | 'regular'
  | 'large'
  | 'halfInjera'
  | 'injera'
  | 'largeInjera';

export interface Nutrition {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sodiumMg?: number;
}

export interface Portion {
  unit: PortionUnit;
  quantity: number;
  grams: number;
}

export interface Food {
  id: string;
  canonicalName: string;
  category: string;
  defaultPortion: Portion;
  portions: Portion[];
  per100g: Nutrition;
  aliases: string[];
  sourceName: string;
  sourceVersion?: string;
  isSeed?: boolean;
}

export interface DailyTarget {
  targetKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  floorKcal: number;
  formulaVersion: string;
  generatedAt: string;
}

export interface OnboardingData {
  started: boolean;
  completed: boolean;
  step: number;
  language: Language;
  goal: Goal | null;
  sex: Sex;
  age: string;
  heightCm: string;
  currentWeightKg: string;
  targetWeightKg: string;
  activity: Activity;
  pace: Pace | null;
  foodPreference: FoodPreference;
}

export interface MealItem {
  id: string;
  foodId: string;
  foodName: string;
  category: string;
  portionUnit: PortionUnit;
  portionQuantity: number;
  grams: number;
  nutrition: Nutrition;
  estimated?: boolean;
}

export interface Meal {
  id: string;
  dateKey: string;
  slot: MealSlot;
  loggedAt: string;
  createdAt: string;
  updatedAt?: string;
  clientSeq?: number;
  items: MealItem[];
  source: 'photo' | 'text' | 'search' | 'manual';
  analysisId?: string;
  photoUri?: string;
}

export interface WaterLog {
  id: string;
  dateKey: string;
  amountMl: number;
  loggedAt: string;
  updatedAt?: string;
}

export interface WeightLog {
  id: string;
  dateKey: string;
  weightKg: number;
  loggedAt: string;
  updatedAt?: string;
}

export interface AccountSession {
  accessToken: string;
  refreshToken: string;
  phone: string | null;
  email: string | null;
  displayName: string | null;
  authProviders: ('phone' | 'email' | 'google')[];
  plan: string;
  createdAt: string;
}

export interface SyncOperation {
  id: string;
  kind: 'meal' | 'water' | 'weight';
  op: 'upsert' | 'delete';
  clientId: string;
  clientSeq: number;
  updatedAt: string;
  loggedAt?: string;
  dateKey?: string;
  slot?: MealSlot;
  items?: MealItem[];
  amountMl?: number;
  weightKg?: number;
}

export interface RemoteMealItem {
  clientId: string;
  foodId: string;
  foodName: string;
  portionUnit: string;
  portionQuantity: number;
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number | null;
  sodiumMg?: number | null;
}

export interface RemoteMeal {
  clientId: string;
  dateKey: string;
  slot: string;
  loggedAt: string;
  updatedAt: string;
  deletedAt: string | null;
  clientSeq: number;
  items: RemoteMealItem[];
}

export interface RemoteWater {
  clientId: string;
  dateKey: string;
  amountMl: number;
  loggedAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RemoteWeight {
  clientId: string;
  dateKey: string;
  weightKg: number;
  loggedAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SyncChanges {
  meals: RemoteMeal[];
  water: RemoteWater[];
  weight: RemoteWeight[];
  serverTime: string;
}

export interface ConsentPatch {
  healthDataProcessing?: boolean;
  aiImprovement?: boolean;
  analytics?: boolean;
}

export interface AccountConsent {
  version: string;
  healthDataProcessing: { granted: boolean; updatedAt: string | null };
  aiImprovement: { granted: boolean; updatedAt: string | null };
  analytics: { granted: boolean; updatedAt: string | null };
}

export type AnalysisNutrition = Nutrition;

export interface AnalysisItem {
  id: string;
  displayName: string;
  foodId: string | null;
  sourceFoodCode: string | null;
  canonicalName: string | null;
  matchKind: string;
  portion: {
    amount: number;
    unit: string;
    grams: number;
    estimated: boolean;
    portionSource: string;
  };
  nutrition: AnalysisNutrition | null;
  confidence: number;
  unresolved: boolean;
}

export interface AnalysisCandidate {
  displayName: string;
  foodId: string | null;
  confidence: number;
}

export interface AnalysisResult {
  id: string;
  status: 'Completed' | 'Failed';
  inputKind: 'Photo' | 'Text';
  confidenceState: 'High' | 'Medium' | 'Low';
  overallConfidence: number;
  items: AnalysisItem[];
  totals: AnalysisNutrition;
  candidates: AnalysisCandidate[];
  modelVersion: string;
  promptVersion: string;
  notes: string[];
}

export interface Settings {
  waterTargetMl: number;
  aiImprovementConsent: boolean;
  analyticsConsent: boolean;
  remindersEnabled: boolean;
  reminderStartMinutes: number;
  reminderEndMinutes: number;
  reminderIntervalMinutes: number;
}

export interface InsightHighlight {
  kind: 'positive' | 'cautionary' | 'informational';
  title: string;
  detail: string;
}

export interface DayInsight {
  dateKey: string;
  weekday: string;
  logged: boolean;
  nutrition: Nutrition;
  exceededTarget: boolean;
  ethiopianItems: number;
  otherItems: number;
}

export interface WeeklyInsights {
  days: DayInsight[];
  target: DailyTarget;
  average: Nutrition;
  highlights: InsightHighlight[];
  loggedDays: number;
  isEmpty: boolean;
  ethiopianShare: number | null;
}

export interface MealDraftItem {
  food: Food;
  unit: PortionUnit;
  quantity: number;
}

export interface AppData {
  onboarding: OnboardingData;
  target: DailyTarget | null;
  settings: Settings;
  meals: Meal[];
  water: WaterLog[];
  weights: WeightLog[];
  catalog: Food[];
  catalogVersion: string | null;
  queue: SyncOperation[];
  syncCursor: string | null;
  pendingConsents: ConsentPatch;
}

export interface AppState extends AppData {
  hydrated: boolean;
  session: AccountSession | null;
  syncState: 'idle' | 'syncing' | 'error';
  syncMessage: string | null;
  lastSyncedAt: string | null;
}
