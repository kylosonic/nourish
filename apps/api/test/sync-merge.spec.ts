/**
 * Unit tests: the offline-merge rule (OFF-02).
 *
 * "The latest write per item wins, and the resolution never deletes data
 * silently" is the whole contract, so the rule is pinned independently of the
 * database and the HTTP layer.
 */
import { decideMerge } from '../src/sync/merge';

const t = (iso: string): Date => new Date(iso);

describe('decideMerge (OFF-02)', () => {
  it('applies a write when the server has never seen the row', () => {
    expect(decideMerge({ updatedAt: t('2026-09-19T10:00:00Z') }, null)).toBe('apply');
  });

  it('applies a newer write — the device owns the ordering', () => {
    expect(
      decideMerge(
        { updatedAt: t('2026-09-19T10:00:01Z') },
        { updatedAt: t('2026-09-19T10:00:00Z') },
      ),
    ).toBe('apply');
  });

  it('ignores an older write instead of overwriting newer data', () => {
    expect(
      decideMerge(
        { updatedAt: t('2026-09-19T09:59:59Z') },
        { updatedAt: t('2026-09-19T10:00:00Z') },
      ),
    ).toBe('stale');
  });

  it('breaks an exact timestamp tie with the client sequence number', () => {
    const at = t('2026-09-19T10:00:00Z');
    expect(decideMerge({ updatedAt: at, clientSeq: 2 }, { updatedAt: at, clientSeq: 1 })).toBe(
      'apply',
    );
    expect(decideMerge({ updatedAt: at, clientSeq: 1 }, { updatedAt: at, clientSeq: 2 })).toBe(
      'stale',
    );
    // Identical writes converge without churn.
    expect(decideMerge({ updatedAt: at, clientSeq: 1 }, { updatedAt: at, clientSeq: 1 })).toBe(
      'unchanged',
    );
    expect(decideMerge({ updatedAt: at }, { updatedAt: at })).toBe('unchanged');
  });

  it('is deterministic: the outcome depends only on the two rows', () => {
    const incoming = { updatedAt: t('2026-09-19T10:00:00Z'), clientSeq: 5 };
    const stored = { updatedAt: t('2026-09-19T10:00:00Z'), clientSeq: 5 };
    const first = decideMerge(incoming, stored);
    const second = decideMerge(incoming, stored);
    expect(first).toBe(second);
  });
});
