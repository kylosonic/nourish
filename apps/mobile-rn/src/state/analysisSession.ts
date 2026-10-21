import type { MealSlot } from '../types';

interface PendingAnalysisInput {
  imageBase64?: string;
  imageUri?: string;
  text?: string;
  slot?: MealSlot;
}

let pending: PendingAnalysisInput | null = null;

export function setPendingAnalysisInput(input: PendingAnalysisInput): void {
  pending = input;
}

export function getPendingAnalysisInput(): PendingAnalysisInput | null {
  return pending;
}

export function clearPendingAnalysisInput(): void {
  pending = null;
}
