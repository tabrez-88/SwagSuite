import axios from "axios";
import { toast } from "@/hooks/use-toast";
import type { ApiErrorResponse } from "@/types";

export type NotifyType = "success" | "error" | "info" | "warning";

/**
 * Extracts a human-readable error message from axios errors, native Errors,
 * or raw strings. Falls back to `fallback` when nothing useful is present.
 *
 * Why: error shapes vary across the codebase (`AxiosError<ApiErrorResponse>`,
 * thrown `Error("401: ...")` from `apiRequest`, unknown rejections). Callers
 * shouldn't have to branch — they pass the raw error and a sensible fallback.
 */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const apiMessage = error.response?.data?.message;
    if (apiMessage) return translateBackendMessage(apiMessage);
    if (error.message) return error.message;
  }
  if (error instanceof Error) {
    // apiRequest throws `Error("<status>: <body>")` — strip the numeric prefix.
    const stripped = error.message.replace(/^\d{3}:\s*/, "");
    return translateBackendMessage(stripped) || fallback;
  }
  if (typeof error === "string") return translateBackendMessage(error) || fallback;
  return fallback;
}

// Stub for future i18n / backend-message translation. Keep signature stable.
export function translateBackendMessage(message: string): string {
  return message;
}

/**
 * Fire-and-forget toast. Safe to call outside React components because
 * shadcn's `toast()` is not a hook.
 */
export function notify(message: string, type: NotifyType = "info"): void {
  const variant = type === "error" ? "destructive" : "default";
  toast({
    title: titleFor(type),
    description: message,
    variant,
  });
}

function titleFor(type: NotifyType): string {
  switch (type) {
    case "success": return "Success";
    case "error": return "Error";
    case "warning": return "Warning";
    case "info":
    default: return "Info";
  }
}

/** Convenience: show a toast extracted from an unknown error. */
export function notifyError(error: unknown, fallback = "Something went wrong"): void {
  notify(getErrorMessage(error, fallback), "error");
}
