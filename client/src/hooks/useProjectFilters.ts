import { useState, useEffect, useCallback, useRef } from "react";

interface ProjectFilterPreferences {
  salesRepFilter: string | null;
  activeSOFilter: string | null;
  activeStageFilter: string | null;
  viewMode: "table" | "kanban";
  version: number;
}

const CURRENT_VERSION = 2;

function getStorageKey(userId: string): string {
  return `project-filters:${userId}`;
}

function getRoleDefaults(
  userRole: string,
  currentUserName: string,
  hasOrders: boolean,
): Omit<ProjectFilterPreferences, "version"> {
  switch (userRole) {
    case "sales":
      return {
        salesRepFilter: hasOrders ? currentUserName : "all",
        activeSOFilter: null,
        activeStageFilter: null,
        viewMode: "table",
      };
    case "production":
      return {
        salesRepFilter: "all",
        activeSOFilter: null,
        activeStageFilter: "sales_order",
        viewMode: "table",
      };
    case "finance":
      return {
        salesRepFilter: "all",
        activeSOFilter: null,
        activeStageFilter: "invoice",
        viewMode: "table",
      };
    default:
      // admin, manager, user
      return {
        salesRepFilter: "all",
        activeSOFilter: null,
        activeStageFilter: null,
        viewMode: "table",
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
      version: CURRENT_VERSION,
    });
  }, [isInitialized, userId, salesRepFilter, activeSOFilter, activeStageFilter, viewMode]);

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

  const resetToDefaults = useCallback(() => {
    if (userId) {
      localStorage.removeItem(getStorageKey(userId));
    }
    const defaults = getRoleDefaults(userRole, currentUserName, hasOrders);
    setSalesRepFilterState(defaults.salesRepFilter);
    setActiveSOFilterState(defaults.activeSOFilter);
    setActiveStageFilterState(defaults.activeStageFilter);
    setViewModeState(defaults.viewMode);
  }, [userId, userRole, currentUserName, hasOrders]);

  return {
    salesRepFilter,
    setSalesRepFilter,
    activeSOFilter,
    setActiveSOFilter,
    activeStageFilter,
    setActiveStageFilter,
    viewMode,
    setViewMode,
    resetToDefaults,
    isInitialized,
  };
}
