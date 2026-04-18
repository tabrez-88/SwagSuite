import type { ImprintOptionType } from "./types";

export const imprintOptionKeys = {
  all: ["/api/imprint-options"] as const,
  byType: (type: ImprintOptionType, includeInactive = false) =>
    ["/api/imprint-options", { type, ...(includeInactive ? { includeInactive: "true" } : {}) }] as const,
  suggestions: (status?: string) =>
    ["/api/imprint-option-suggestions", status ? { status } : {}] as const,
  pendingCount: ["/api/imprint-option-suggestions/pending-count"] as const,
};
