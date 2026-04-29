import { useState } from "react";
import { Search, Sparkles, SlidersHorizontal, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchFilters } from "./components/SearchFilters";
import { SearchResults } from "./components/SearchResults";
import { SearchPagination } from "./components/SearchPagination";
import { useSearchPage } from "./hooks";

export default function SearchPage() {
  const {
    query,
    setQuery,
    page,
    setPage,
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    results,
    total,
    facets,
    answer,
    aggregation,
    isLoading,
    isFetching,
    totalPages,
  } = useSearchPage();

  const [inputValue, setInputValue] = useState(query);
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputValue);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search</h1>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search orders, products, companies, POs, shipments..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-10 h-10"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </form>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                <SearchFilters filters={filters} onChange={setFilters} />
              </CardContent>
            </Card>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* AI Answer */}
          {answer && (
            <Card className="mb-4 border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex gap-2 items-start">
                <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-900">{answer}</p>
              </CardContent>
            </Card>
          )}

          {/* Aggregation */}
          {aggregation && (
            <Card className="mb-4 border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-emerald-900">{aggregation.label}</span>
                </div>
                <p className="text-2xl font-bold text-emerald-800 ml-6">
                  {aggregation.value > 100 ? `$${aggregation.value.toLocaleString()}` : aggregation.value.toLocaleString()}
                </p>
                {aggregation.breakdown && aggregation.breakdown.length > 0 && (
                  <div className="ml-6 mt-2 space-y-1">
                    {aggregation.breakdown.slice(0, 8).map((b) => (
                      <div key={b.key} className="flex justify-between text-sm text-emerald-700">
                        <span>{b.key}</span>
                        <span className="font-medium">
                          {b.value > 100 ? `$${b.value.toLocaleString()}` : b.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results Summary */}
          {query && !isLoading && (
            <p className="text-sm text-gray-500 mb-3">
              {total > 0
                ? `Found ${total} result${total !== 1 ? "s" : ""} for "${query}"`
                : `No results found for "${query}"`}
              {isFetching && " (updating...)"}
            </p>
          )}

          {/* No Query State */}
          {!query && (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-1">Search across everything</p>
              <p className="text-sm">
                Orders, products, companies, contacts, vendors, POs, and shipments
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {["PO 1234", "tracking 9400", "high margin orders", "orders from Beber"].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setInputValue(example);
                      setQuery(example);
                    }}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <SearchResults
            results={results}
            facets={facets}
            total={total}
            isLoading={isLoading}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Pagination */}
          <SearchPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </main>
      </div>
    </div>
  );
}
