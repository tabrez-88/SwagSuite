import type { Request } from "express";

/**
 * Extracts the current user's ID from the request object.
 * Supports both direct `id` and `claims.sub` patterns.
 */
export function getUserId(req: Request): string {
  const user = req.user as any;
  return user?.id || user?.claims?.sub;
}
