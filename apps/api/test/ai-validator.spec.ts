/**
 * Unit tests: the AI boundary (ADR-0007 D-S2-3, master §16).
 *
 * Everything a model returns is untrusted input. These tests pin the two rules
 * that matter most: malformed output is rejected outright, and output that tries
 * to supply nutrition (the thing the AI must never decide) is rejected too.
 */
import 'reflect-metadata';
import { AiOutputValidationError, validateAiPayload } from '../src/ai/ai-response.validator';
import { createAiProviders } from '../src/ai/ai-provider.factory';
import { stripCodeFence } from '../src/ai/openai-compatible.provider';

describe('AI output validation', () => {
  it('accepts a well-formed payload', () => {
    const payload = validateAiPayload({
      foods: [{ label: 'doro wet', amount: 1, unit: 'cup', confidence: 0.91 }],
      overallConfidence: 0.9,
    });
    expect(payload.foods).toHaveLength(1);
    expect(payload.foods[0].label).toBe('doro wet');
  });

  it('accepts an empty result (the model found nothing)', () => {
    expect(validateAiPayload({ foods: [] }).foods).toEqual([]);
  });

  it.each([
    ['not an object', 'nope'],
    ['an array', []],
    ['null', null],
    ['missing foods', { overallConfidence: 0.5 }],
    ['foods not an array', { foods: 'shiro' }],
    ['a label that is not a string', { foods: [{ label: 42, confidence: 0.5 }] }],
    ['an empty label', { foods: [{ label: '', confidence: 0.5 }] }],
    ['a confidence above 1', { foods: [{ label: 'shiro', confidence: 1.4 }] }],
    ['a negative confidence', { foods: [{ label: 'shiro', confidence: -0.2 }] }],
    ['a missing confidence', { foods: [{ label: 'shiro' }] }],
    ['an unknown portion unit', { foods: [{ label: 'shiro', unit: 'bucket', confidence: 0.5 }] }],
    ['more than 8 foods', { foods: Array.from({ length: 9 }, () => ({ label: 'x', confidence: 0.5 })) }],
  ])('rejects %s', (_name, raw) => {
    expect(() => validateAiPayload(raw)).toThrow(AiOutputValidationError);
  });

  it('rejects nutrition smuggled into the model output (the AI never decides nutrition)', () => {
    expect(() =>
      validateAiPayload({
        foods: [{ label: 'shiro', confidence: 0.9, kcal: 146, proteinG: 3.2 }],
      }),
    ).toThrow(AiOutputValidationError);
    expect(() => validateAiPayload({ foods: [], kcal: 500 })).toThrow(
      AiOutputValidationError,
    );
  });

  it('rejects a portion the food layer could not honour (absurd grams)', () => {
    expect(() =>
      validateAiPayload({ foods: [{ label: 'shiro', grams: 99999, confidence: 0.9 }] }),
    ).toThrow(AiOutputValidationError);
  });
});

describe('AI provider factory (ADR-0007 D-S2-1)', () => {
  const base = {
    visionModel: 'v',
    textModel: 't',
    timeoutMs: 1000,
  };

  it('refuses the fixture provider in production even when configured', () => {
    expect(() =>
      createAiProviders({ ...base, kind: 'fixture', nodeEnv: 'production' }),
    ).toThrow(/refused when NODE_ENV=production/);
  });

  it('allows the fixture provider outside production', () => {
    const providers = createAiProviders({ ...base, kind: 'fixture', nodeEnv: 'test' });
    expect(providers.modelVersion).toBe('fixture-1');
  });

  it('requires a key and base URL for the real provider', () => {
    expect(() =>
      createAiProviders({ ...base, kind: 'openai-compatible', nodeEnv: 'production' }),
    ).toThrow(/AI_API_KEY and AI_BASE_URL/);
  });

  it('defaults to the honest null provider', () => {
    const providers = createAiProviders({ ...base, kind: 'none', nodeEnv: 'production' });
    expect(providers.modelVersion).toBe('none');
  });
});

describe('provider content handling', () => {
  it('unwraps a fenced JSON answer', () => {
    expect(stripCodeFence('```json\n{"foods":[]}\n```')).toBe('{"foods":[]}');
    expect(stripCodeFence('{"foods":[]}')).toBe('{"foods":[]}');
  });
});
