import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 30 * 1000, // 30 seconds - faster updates for profile changes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}
