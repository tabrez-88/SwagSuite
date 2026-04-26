import { Search, FileText, Package, Users, Building, TrendingUp, Loader2, Truck, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductDetailModal } from "@/components/modals/ProductDetailModal";
import type { SearchResult } from "./types";
import { useGlobalSearch } from "./hooks";

const typeIcons: Record<string, any> = {
  order: TrendingUp,
  product: Package,
  company: Building,
  contact: Users,
  vendor: Truck,
  file: FileText,
  other: Search,
};

const typeColors: Record<string, string> = {
  order: "bg-green-100 text-green-800",
  product: "bg-blue-100 text-blue-800",
  company: "bg-purple-100 text-purple-800",
  contact: "bg-orange-100 text-orange-800",
  vendor: "bg-teal-100 text-teal-800",
  file: "bg-gray-100 text-gray-800",
  other: "bg-gray-100 text-gray-800",
};

/** Show relevant metadata keys per result type */
function getDisplayMeta(result: SearchResult) {
  const m = result.metadata || {};
  const items: { label: string; value: string }[] = [];

  if (m.value) items.push({ label: "Value", value: m.value });
  if (m.margin) items.push({ label: "Margin", value: m.margin });
  if (m.stage) items.push({ label: "Stage", value: m.stage });
  if (m.date) items.push({ label: "Date", value: m.date });
  if (m.email) items.push({ label: "Email", value: m.email });
  if (m.phone) items.push({ label: "Phone", value: m.phone });
  if (m.sku) items.push({ label: "SKU", value: m.sku });
  if (m.carrier) items.push({ label: "Carrier", value: m.carrier });
  if (m.tracking) items.push({ label: "Tracking", value: m.tracking });
  if (m.shipStatus) items.push({ label: "Ship Status", value: m.shipStatus });
  if (m.shippingPrice) items.push({ label: "Ship Price", value: m.shippingPrice });
  if (m.company) items.push({ label: "Company", value: m.company });
  if (m.website) items.push({ label: "Website", value: m.website });

  return items.slice(0, 4); // Max 4 items to keep it clean
}

export default function GlobalSearch() {
  const {
    query,
    setQuery,
    results,
    answer,
    isOpen,
    searchRef,
    inputRef,
    isProductModalOpen,
    selectedProduct,
    supplierName,
    searchMutation,
    handleResultClick,
    handleFocus,
    handleProductModalChange,
  } = useGlobalSearch();

  return (
    <div className="relative w-full max-w-xl" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search anything... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200 focus:bg-white"
          onFocus={handleFocus}
        />
        {searchMutation.isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="text-gray-400 h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full max-w-3xl z-50 shadow-lg border-gray-200 max-h-[70vh] overflow-y-auto">
          <CardContent className="p-0 w-full flex flex-col">
            {/* AI Answer */}
            {answer && (
              <div className="p-3 bg-blue-50 border-b border-blue-100 flex gap-2 items-start">
                <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-900">{answer}</p>
              </div>
            )}

            {results.length === 0 && !searchMutation.isPending && query.trim() && !answer && (
              <div className="p-4 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try natural language: "shipping for Beber" or "high margin orders this month"</p>
              </div>
            )}

            {results.map((result: SearchResult, index: number) => {
              const Icon = typeIcons[result.type] || Search;
              const meta = getDisplayMeta(result);
              return (
                <Button
                  key={`${result.type}-${result.id}-${index}`}
                  variant="ghost"
                  className="flex relative w-full h-auto p-4 justify-start hover:bg-gray-50 rounded-none border-b border-gray-100 last:border-b-0"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex relative items-start gap-3 w-full">
                    <Icon className="h-5 w-5 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div className="flex relative w-full flex-wrap flex-col text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-900">{result.title}</span>
                        <Badge variant="secondary" className={`text-xs ${typeColors[result.type] || typeColors.other}`}>
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{result.description}</p>
                      {meta.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                          {meta.map((m) => (
                            <span key={m.label}>
                              <span className="text-gray-500">{m.label}:</span> {m.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}

            {query.trim() && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  Try: "shipping for Beber" · "high margin orders" · "Katie contact" · "S&S vendor"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product Details Modal */}
      <ProductDetailModal
        open={isProductModalOpen && !!selectedProduct}
        onOpenChange={handleProductModalChange}
        product={(selectedProduct ?? null) as any}
        supplierName={supplierName}
      />
    </div>
  );
}
