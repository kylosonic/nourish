/**
 * The offline-merge rule (OFF-02), as a pure function.
 *
 * "Conflicts resolve deterministically with the latest write per item winning,
 * and the resolution never deletes data silently." The device is the writer, so
 * it owns the ordering: `updatedAt` is the time the user made the change, not
 * the time the server received it. A row that arrives with an older or equal
 * timestamp than the one already stored is therefore stale and is ignored —
 * reported back to the caller rather than dropped in silence.
 */
export type MergeDecision = 'apply' | 'stale' | 'unchanged';

export interface MergeCandidate {
  updatedAt: Date;
  /** Client sequence number, used only to break an exact timestamp tie. */
  clientSeq?: number;
}

export interface StoredRow {
  updatedAt: Date;
  clientSeq?: number;
}

export function decideMerge(
  incoming: MergeCandidate,
  stored: StoredRow | null,
): MergeDecision {
  if (stored == null) return 'apply';

  const incomingTime = incoming.updatedAt.getTime();
  const storedTime = stored.updatedAt.getTime();

  if (incomingTime > storedTime) return 'apply';
  if (incomingTime < storedTime) return 'stale';

  // Same instant: the higher client sequence wins, so a device that made two
  // edits within one millisecond still converges on its own last write.
  const incomingSeq = incoming.clientSeq ?? 0;
  const storedSeq = stored.clientSeq ?? 0;
  if (incomingSeq > storedSeq) return 'apply';
  if (incomingSeq < storedSeq) return 'stale';
  return 'unchanged';
}

/** A deletion is a write: it beats any older row, and is never a hard delete. */
export function tombstoneFor(row: { updatedAt: Date }): { deletedAt: Date } {
  return { deletedAt: row.updatedAt };
}
