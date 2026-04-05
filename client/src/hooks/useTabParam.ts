import { useState, useCallback } from "react";
import { useLocation, useSearch } from "wouter";

/**
 * Persists the active tab in the URL query string (?tab=overview).
 * On refresh the tab is restored from the URL.
 *
 * @param defaultTab  – the tab to show when no ?tab param is present
 * @param paramName   – query-string key (default "tab")
 */
export function useTabParam(defaultTab: string, paramName = "tab") {
  const search = useSearch();
  const [, setLocation] = useLocation();

  // Read initial value from URL
  const params = new URLSearchParams(search);
  const initialTab = params.get(paramName) || defaultTab;

  const [activeTab, setActiveTabState] = useState(initialTab);

  const setActiveTab = useCallback(
    (tab: string) => {
      setActiveTabState(tab);

      // Update URL without full navigation
      const url = new URL(window.location.href);
      if (tab === defaultTab) {
        url.searchParams.delete(paramName);
      } else {
        url.searchParams.set(paramName, tab);
      }
      // Replace state so back button isn't polluted with every tab switch
      window.history.replaceState({}, "", url.pathname + url.search);
    },
    [defaultTab, paramName],
  );

  return [activeTab, setActiveTab] as const;
}
