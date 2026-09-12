

export interface FieldDiff {
  field: string;
  before: unknown;
  after: unknown;
}

export function diffContent(
  before: Record<string, unknown> | null,
  after: Record<string, unknown>
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after)]);

  for (const key of keys) {
    const beforeVal = before?.[key];
    const afterVal = after[key];
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      diffs.push({ field: key, before: beforeVal ?? null, after: afterVal ?? null });
    }
  }

  return diffs;
}
