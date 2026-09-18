import { createHash } from 'node:crypto';
import {
  AiAnalysisPayload,
  PhotoAnalysisInput,
  TextAnalysisInput,
  TextProvider,
  VisionProvider,
} from './ai-provider';

/**
 * Deterministic provider for tests and local development (ADR-0007 D-S2-1).
 *
 * It exists so the pipeline, the endpoint contract and the mobile screens can be
 * exercised without a model. It is **refused in production** by the factory, and
 * it never invents nutrition — it only proposes labels, which the same
 * retrieval and deterministic nutrition stages then resolve.
 *
 * The response is a pure function of the input, so tests are reproducible.
 */
export class FixtureProvider implements VisionProvider, TextProvider {
  readonly modelVersion = 'fixture-1';

  analyzePhoto(input: PhotoAnalysisInput): Promise<AiAnalysisPayload> {
    const digest = createHash('sha256').update(input.bytes).digest();
    // Three scripted scenarios, selected by the image bytes.
    switch (digest[0] % 3) {
      case 0:
        return Promise.resolve(HIGH_CONFIDENCE_MEAL);
      case 1:
        return Promise.resolve(LOW_CONFIDENCE_STEW);
      default:
        return Promise.resolve(NO_FOOD);
    }
  }

  analyzeText(input: TextAnalysisInput): Promise<AiAnalysisPayload> {
    const text = input.text.toLowerCase();
    if (/injera|እንጀራ/.test(text)) {
      const amount = /(^|\s)(\d+)(\s|$)/.exec(text);
      const quantity = amount ? Number(amount[2]) : 1;
      return Promise.resolve({
        foods: [
          { label: 'injera', amount: quantity, unit: 'injera', confidence: 0.93 },
          { label: 'shiro', amount: 1, unit: 'bowl', confidence: 0.88 },
        ],
        overallConfidence: 0.9,
      });
    }
    if (/orange|ብርቱካን/.test(text)) {
      return Promise.resolve({
        foods: [{ label: 'orange', amount: 1, unit: 'piece', confidence: 0.95 }],
        overallConfidence: 0.95,
      });
    }
    return Promise.resolve(NO_FOOD);
  }
}

const HIGH_CONFIDENCE_MEAL: AiAnalysisPayload = {
  foods: [
    { label: 'injera', amount: 1, unit: 'injera', confidence: 0.94 },
    { label: 'doro wet', amount: 1, unit: 'cup', confidence: 0.91 },
    { label: 'gomen', amount: 1, unit: 'cup', confidence: 0.86 },
  ],
  overallConfidence: 0.94,
};

const LOW_CONFIDENCE_STEW: AiAnalysisPayload = {
  foods: [
    { label: 'shiro', amount: 1, unit: 'bowl', confidence: 0.41 },
    { label: 'misir wot', amount: 1, unit: 'bowl', confidence: 0.38 },
    { label: 'kik alicha', amount: 1, unit: 'bowl', confidence: 0.22 },
  ],
  overallConfidence: 0.41,
  note: 'several stews look alike',
};

const NO_FOOD: AiAnalysisPayload = {
  foods: [],
  overallConfidence: 0,
  note: 'no food detected',
};
