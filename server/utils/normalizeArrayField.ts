/**
 * Normalizes a field value to a string array or null.
 * Handles: arrays, JSON strings, plain strings, and other types.
 * Used for product colors/sizes normalization.
 */
export function normalizeArrayField(value: any): string[] | null {
  if (value === undefined || value === null) return null;

  if (Array.isArray(value)) {
    const filtered = value
      .filter((v: any) => v && typeof v === "string")
      .map((v: string) => v.trim());
    return filtered.length > 0 ? filtered : null;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const filtered = parsed
          .filter((v: any) => v && typeof v === "string")
          .map((v: string) => v.trim());
        return filtered.length > 0 ? filtered : null;
      }
      return null;
    } catch {
      const trimmed = value.trim();
      return trimmed ? [trimmed] : null;
    }
  }

  return null;
}
