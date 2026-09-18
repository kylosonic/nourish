/** One staged extract row (fct-2025-extract.jsonl / fixture subset schema). */
export interface FctRow {
  sourceFoodCode: string;
  nameEn: string;
  nameAm: string | null;
  groupCode?: string;
  groupName?: string | null;
  /** Printed page in the source document (citation). */
  page?: number | null;
  /** Present in the fixture subset: the S0 seed slug this row matches. */
  seedSlug?: string;
  /** Per-100g values as published. Values are number | 'tr' | '<0.1' | null. */
  per100g: Record<string, number | string | null | undefined>;
}

/** Parses newline-delimited JSONL extract files into FctRow[]. */
export class FctParser {
  parse(text: string): FctRow[] {
    const rows: FctRow[] = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch (err) {
        throw new Error(`invalid JSON on line ${i + 1}: ${err instanceof Error ? err.message : String(err)}`);
      }
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error(`line ${i + 1}: expected a JSON object`);
      }
      const row = parsed as Record<string, unknown>;
      if (typeof row.sourceFoodCode !== 'string' || typeof row.nameEn !== 'string') {
        throw new Error(`line ${i + 1}: missing sourceFoodCode or nameEn`);
      }
      if (typeof row.per100g !== 'object' || row.per100g === null) {
        throw new Error(`line ${i + 1}: missing per100g object`);
      }
      rows.push({
        sourceFoodCode: row.sourceFoodCode,
        nameEn: row.nameEn,
        nameAm: typeof row.nameAm === 'string' ? row.nameAm : null,
        groupCode: typeof row.groupCode === 'string' ? row.groupCode : undefined,
        groupName: typeof row.groupName === 'string' ? row.groupName : null,
        page: typeof row.page === 'number' ? row.page : null,
        seedSlug: typeof row.seedSlug === 'string' ? row.seedSlug : undefined,
        per100g: row.per100g as FctRow['per100g'],
      });
    }
    return rows;
  }
}
