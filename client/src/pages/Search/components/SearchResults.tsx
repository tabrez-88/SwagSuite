import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ResultCard } from "./ResultCard";
import type { EntityType } from "@/services/search/requests";
import { ENTITY_TYPE_LABELS } from "../types";

interface SearchResultsProps {
  results: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    metadata: Record<string, any>;
    url: string;
  }>;
  facets: Record<string, number>;
  total: number;
  isLoading: boolean;
  activeTab: EntityType | "all";
  onTabChange: (tab: EntityType | "all") => void;
}

export function SearchResults({
  results,
  facets,
  total,
  isLoading,
  activeTab,
  onTabChange,
}: SearchResultsProps) {
  // Build tabs from facets that have results
  const tabEntries = Object.entries(facets).filter(([, count]) => count > 0);
  const totalCount = Object.values(facets).reduce((sum, c) => sum + c, 0);

  // Filter results by active tab
  const filteredResults = activeTab === "all" ? results : results.filter((r) => r.type === activeTab);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Searching...</span>
      </div>
    );
  }

  if (total === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Entity Type Tabs */}
      {tabEntries.length > 1 && (
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as EntityType | "all")}>
          <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-gray-200 gap-1">
              All <Badge variant="secondary" className="text-xs px-1.5 py-0">{totalCount}</Badge>
            </TabsTrigger>
            {tabEntries.map(([type, count]) => (
              <TabsTrigger key={type} value={type} className="text-xs data-[state=active]:bg-gray-200 gap-1">
                {ENTITY_TYPE_LABELS[type as EntityType] || type}
                <Badge variant="secondary" className="text-xs px-1.5 py-0">{count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Results List */}
      <div className="space-y-2">
        {filteredResults.map((result, i) => (
          <ResultCard key={`${result.type}-${result.id}-${i}`} result={result} />
        ))}
      </div>

      {filteredResults.length === 0 && activeTab !== "all" && (
        <p className="text-sm text-gray-500 text-center py-4">
          No {ENTITY_TYPE_LABELS[activeTab] || activeTab} results on this page.
        </p>
      )}
    </div>
  );
}
