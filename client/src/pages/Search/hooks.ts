import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "@/lib/wouter-compat";
import { advancedSearch } from "@/services/search/requests";
import type { EntityType, AdvancedSearchParams } from "@/services/search/requests";
import type { FilterState } from "./types";
import { DEFAULT_FILTERS } from "./types";

const RESULTS_PER_PAGE = 10;

export function useSearchPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = useMemo(() => new URLSearchParams(searchString), [searchString]);

  // Parse URL params into state
  const queryFromUrl = urlParams.get("q") || "";
  const pageFromUrl = parseInt(urlParams.get("page") || "1", 10);
  const entityTypesFromUrl = urlParams.get("entityTypes")?.split(",").filter(Boolean) as EntityType[] | undefined;

  const [query, setQuery] = useState(queryFromUrl);
  const [page, setPage] = useState(pageFromUrl);
  const [activeTab, setActiveTab] = useState<EntityType | "all">("all");
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    entityTypes: entityTypesFromUrl || [],
    stage: urlParams.get("stage") || "",
    marginMin: urlParams.get("marginMin") || "",
    marginMax: urlParams.get("marginMax") || "",
    dateFrom: urlParams.get("dateFrom") || "",
    dateTo: urlParams.get("dateTo") || "",
    industry: urlParams.get("industry") || "",
  });

  // Sync URL when query/filters/page change
  const syncUrl = useCallback(
    (q: string, f: FilterState, p: number) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (p > 1) params.set("page", String(p));
      if (f.entityTypes.length) params.set("entityTypes", f.entityTypes.join(","));
      if (f.stage) params.set("stage", f.stage);
      if (f.marginMin) params.set("marginMin", f.marginMin);
      if (f.marginMax) params.set("marginMax", f.marginMax);
      if (f.dateFrom) params.set("dateFrom", f.dateFrom);
      if (f.dateTo) params.set("dateTo", f.dateTo);
      if (f.industry) params.set("industry", f.industry);

      const qs = params.toString();
      setLocation(`/search${qs ? `?${qs}` : ""}`, { replace: true });
    },
    [setLocation],
  );

  // Build query params for API
  const searchParams = useMemo((): AdvancedSearchParams => {
    const entityTypes =
      activeTab !== "all" ? [activeTab] : filters.entityTypes.length ? filters.entityTypes : undefined;

    return {
      q: query,
      limit: RESULTS_PER_PAGE,
      offset: (page - 1) * RESULTS_PER_PAGE,
      entityTypes,
      stage: filters.stage || undefined,
      marginMin: filters.marginMin ? parseFloat(filters.marginMin) : undefined,
      marginMax: filters.marginMax ? parseFloat(filters.marginMax) : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      industry: filters.industry || undefined,
    };
  }, [query, page, activeTab, filters]);

  // API query
  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["/api/search/advanced", searchParams],
    queryFn: () => advancedSearch(searchParams),
    enabled: !!query.trim(),
    staleTime: 30_000,
  });

  const handleSearch = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      setPage(1);
      setActiveTab("all");
      syncUrl(newQuery, filters, 1);
    },
    [filters, syncUrl],
  );

  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      setPage(1);
      syncUrl(query, newFilters, 1);
    },
    [query, syncUrl],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      syncUrl(query, filters, newPage);
    },
    [query, filters, syncUrl],
  );

  // Initialize query from URL on mount
  useEffect(() => {
    if (queryFromUrl && queryFromUrl !== query) {
      setQuery(queryFromUrl);
    }
  }, []);

  const totalPages = data ? Math.ceil(data.total / RESULTS_PER_PAGE) : 0;

  return {
    query,
    setQuery: handleSearch,
    page,
    setPage: handlePageChange,
    activeTab,
    setActiveTab,
    filters,
    setFilters: handleFilterChange,
    results: data?.results || [],
    total: data?.total || 0,
    facets: data?.facets || {},
    answer: data?.answer,
    aggregation: data?.aggregation,
    isLoading,
    isFetching,
    totalPages,
  };
}
