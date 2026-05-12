import { useState, useEffect, useCallback, useRef } from "react";

interface ProjectFilterPreferences {
  salesRepFilter: string | null;
  activeSOFilter: string | null;
  activeStageFilter: string | null;
  viewMode: "table" | "kanban";
  searchQuery: string;
  companyFilter: string | null;
  soStatusFilter: string | null;
  dateType: "inHands" | "createdAt";
  dateFrom: string;
  dateTo: string;
  version: number;
}

const CURRENT_VERSION = 3;

function getStorageKey(userId: string): string {
  return `project-filters:${userId}`;
}

function getRoleDefaults(
  userRole: string,
  currentUserName: string,
  hasOrders: boolean,
): Omit<ProjectFilterPreferences, "version"> {
  const base = {
    activeSOFilter: null,
    activeStageFilter: null,
    viewMode: "table" as const,
    searchQuery: "",
    companyFilter: null,
    soStatusFilter: null,
    dateType: "inHands" as const,
    dateFrom: "",
    dateTo: "",
  };

  switch (userRole) {
    case "sales":
      return {
        ...base,
        salesRepFilter: hasOrders ? currentUserName : "all",
      };
    case "production":
      return {
        ...base,
        salesRepFilter: "all",
        activeStageFilter: "sales_order",
      };
    case "finance":
      return {
        ...base,
        salesRepFilter: "all",
        activeStageFilter: "invoice",
      };
    default:
      // admin, manager, user
      return {
        ...base,
        salesRepFilter: "all",
      };
  }
}

function loadFromStorage(userId: string): ProjectFilterPreferences | null {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProjectFilterPreferences;
    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed;
  } catch {
    localStorage.removeItem(getStorageKey(userId));
    return null;
  }
}

function saveToStorage(userId: string, prefs: ProjectFilterPreferences): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(prefs));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

interface UseProjectFiltersParams {
  userId: string | null;
  userRole: string;
  currentUserName: string;
  hasOrders: boolean;
  isDataLoaded: boolean;
}

export function useProjectFilters({
  userId,
  userRole,
  currentUserName,
  hasOrders,
  isDataLoaded,
}: UseProjectFiltersParams) {
  const [salesRepFilter, setSalesRepFilterState] = useState<string | null>(null);
  const [activeSOFilter, setActiveSOFilterState] = useState<string | null>(null);
  const [activeStageFilter, setActiveStageFilterState] = useState<string | null>(null);
  const [viewMode, setViewModeState] = useState<"table" | "kanban">("table");
  const [searchQuery, setSearchQueryState] = useState("");
  const [companyFilter, setCompanyFilterState] = useState<string | null>(null);
  const [soStatusFilter, setSOStatusFilterState] = useState<string | null>(null);
  const [dateType, setDateTypeState] = useState<"inHands" | "createdAt">("inHands");
  const [dateFrom, setDateFromState] = useState("");
  const [dateTo, setDateToState] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const initializedForUser = useRef<string | null>(null);

  // Initialize from localStorage or role defaults
  useEffect(() => {
    if (!userId || !currentUserName) return;
    // Don't re-init for the same user
    if (initializedForUser.current === userId) return;

    // localStorage can restore immediately (user's own saved prefs)
    const saved = loadFromStorage(userId);
    if (saved) {
      setSalesRepFilterState(saved.salesRepFilter);
      setActiveSOFilterState(saved.activeSOFilter);
      setActiveStageFilterState(saved.activeStageFilter);
      setViewModeState(saved.viewMode);
      setSearchQueryState(saved.searchQuery || "");
      setCompanyFilterState(saved.companyFilter || null);
      setSOStatusFilterState(saved.soStatusFilter || null);
      setDateTypeState(saved.dateType || "inHands");
      setDateFromState(saved.dateFrom || "");
      setDateToState(saved.dateTo || "");
      initializedForUser.current = userId;
      setIsInitialized(true);
      return;
    }

    // Role defaults need order data to determine hasOrders — wait for it
    if (!isDataLoaded) return;

    const defaults = getRoleDefaults(userRole, currentUserName, hasOrders);
    setSalesRepFilterState(defaults.salesRepFilter);
    setActiveSOFilterState(defaults.activeSOFilter);
    setActiveStageFilterState(defaults.activeStageFilter);
    setViewModeState(defaults.viewMode);
    setSearchQueryState(defaults.searchQuery);
    setCompanyFilterState(defaults.companyFilter);
    setSOStatusFilterState(defaults.soStatusFilter);
    setDateTypeState(defaults.dateType);
    setDateFromState(defaults.dateFrom);
    setDateToState(defaults.dateTo);

    initializedForUser.current = userId;
    setIsInitialized(true);
  }, [userId, userRole, currentUserName, hasOrders, isDataLoaded]);

  // Persist on any filter change (after initialization)
  useEffect(() => {
    if (!isInitialized || !userId) return;
    saveToStorage(userId, {
      salesRepFilter,
      activeSOFilter,
      activeStageFilter,
      viewMode,
      searchQuery,
      companyFilter,
      soStatusFilter,
      dateType,
      dateFrom,
      dateTo,
      version: CURRENT_VERSION,
    });
  }, [isInitialized, userId, salesRepFilter, activeSOFilter, activeStageFilter, viewMode, searchQuery, companyFilter, soStatusFilter, dateType, dateFrom, dateTo]);

  const setSalesRepFilter = useCallback((value: string | null) => {
    setSalesRepFilterState(value);
  }, []);

  const setActiveSOFilter = useCallback((value: string | null) => {
    setActiveSOFilterState(value);
  }, []);

  const setActiveStageFilter = useCallback((value: string | null) => {
    setActiveStageFilterState(value);
  }, []);

  const setViewMode = useCallback((value: "table" | "kanban") => {
    setViewModeState(value);
  }, []);

  const setSearchQuery = useCallback((value: string) => {
    setSearchQueryState(value);
  }, []);

  const setCompanyFilter = useCallback((value: string | null) => {
    setCompanyFilterState(value);
  }, []);

  const setSOStatusFilter = useCallback((value: string | null) => {
    setSOStatusFilterState(value);
  }, []);

  const setDateType = useCallback((value: "inHands" | "createdAt") => {
    setDateTypeState(value);
  }, []);

  const setDateFrom = useCallback((value: string) => {
    setDateFromState(value);
  }, []);

  const setDateTo = useCallback((value: string) => {
    setDateToState(value);
  }, []);

  const resetToDefaults = useCallback(() => {
    if (userId) {
      localStorage.removeItem(getStorageKey(userId));
    }
    const defaults = getRoleDefaults(userRole, currentUserName, hasOrders);
    setSalesRepFilterState(defaults.salesRepFilter);
    setActiveSOFilterState(defaults.activeSOFilter);
    setActiveStageFilterState(defaults.activeStageFilter);
    setViewModeState(defaults.viewMode);
    setSearchQueryState(defaults.searchQuery);
    setCompanyFilterState(defaults.companyFilter);
    setSOStatusFilterState(defaults.soStatusFilter);
    setDateTypeState(defaults.dateType);
    setDateFromState(defaults.dateFrom);
    setDateToState(defaults.dateTo);
  }, [userId, userRole, currentUserName, hasOrders]);

  const clearAllFilters = useCallback(() => {
    setActiveSOFilterState(null);
    setActiveStageFilterState(null);
    setSearchQueryState("");
    setCompanyFilterState(null);
    setSOStatusFilterState(null);
    setDateFromState("");
    setDateToState("");
  }, []);

  const hasActiveFilters = !!(
    activeSOFilter ||
    activeStageFilter ||
    searchQuery ||
    companyFilter ||
    soStatusFilter ||
    dateFrom ||
    dateTo
  );

  return {
    salesRepFilter,
    setSalesRepFilter,
    activeSOFilter,
    setActiveSOFilter,
    activeStageFilter,
    setActiveStageFilter,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    companyFilter,
    setCompanyFilter,
    soStatusFilter,
    setSOStatusFilter,
    dateType,
    setDateType,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    resetToDefaults,
    clearAllFilters,
    hasActiveFilters,
    isInitialized,
  };
}
