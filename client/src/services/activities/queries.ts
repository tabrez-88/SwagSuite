import { useInfiniteQuery } from "@tanstack/react-query";
import { activityKeys } from "./keys";

interface PaginatedActivities {
  data: any[];
  total: number;
  hasMore: boolean;
}

export function useInfiniteActivities(projectId: string | number, limit = 5) {
  return useInfiniteQuery<PaginatedActivities>({
    queryKey: activityKeys.infinite(projectId),
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(
        `/api/projects/${projectId}/activities?limit=${limit}&offset=${pageParam}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      const totalLoaded = allPages.reduce((sum, p) => sum + p.data.length, 0);
      return totalLoaded;
    },
    staleTime: Infinity,
  });
}
