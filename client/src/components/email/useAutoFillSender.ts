import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useAutoFillSender() {
  const { user } = useAuth();

  return useMemo(() => ({
    email: (user as any)?.email || "",
    name: `${(user as any)?.firstName || ""} ${(user as any)?.lastName || ""}`.trim(),
  }), [user]);
}
