import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MealItem, MealSlot } from '../types';

export type MainTabParamList = {
  Home: undefined;
  Progress: undefined;
  Insights: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Language: undefined;
  Goal: undefined;
  Body: undefined;
  Activity: undefined;
  Pace: undefined;
  FoodPreference: undefined;
  DailyTarget: undefined;
  SignIn: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ScanMenu: { slot?: MealSlot } | undefined;
  Camera: { slot?: MealSlot } | undefined;
  Analysis: {
    slot?: MealSlot;
    imageUri?: string;
    text?: string;
  };
  Result: {
    analysisId: string;
    slot?: MealSlot;
    imageUri?: string;
    items: MealItem[];
    totals: { kcal: number; proteinG: number; carbsG: number; fatG: number };
    confidenceState: 'High' | 'Medium' | 'Low';
    overallConfidence: number;
  };
  LowConfidence: {
    analysisId: string;
    slot?: MealSlot;
    imageUri?: string;
    candidates: { displayName: string; foodId: string | null; confidence: number }[];
  };
  TextLog: { slot?: MealSlot; mode?: 'text' | 'voice' } | undefined;
  FoodSearch: {
    slot?: MealSlot;
    mode?: 'quick-add' | 'edit' | 'candidate';
    analysisId?: string;
    imageUri?: string;
    candidates?: { displayName: string; foodId: string | null; confidence: number }[];
  } | undefined;
  EditMeal: {
    slot?: MealSlot;
    analysisId: string;
    imageUri?: string;
    items: MealItem[];
  };
  Barcode: { slot?: MealSlot } | undefined;
  History: undefined;
  Privacy: undefined;
  Settings: undefined;
  Recommendations: undefined;
};
