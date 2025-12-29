import { useState, useEffect, useRef } from "react";
import { Search, FileText, Package, Users, Building, TrendingUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface SearchResult {
  id: string;
  type: "order" | "product" | "company" | "contact" | "file" | "other";
  title: string;
  description: string;
  metadata?: {
    margin?: string;
    value?: string;
    status?: string;
    date?: string;
    [key: string]: any;
  };
  url?: string;
}

const typeIcons = {
  order: TrendingUp,
  product: Package,
  company: Building,
  contact: Users,
  file: FileText,
  other: Search,
};

const typeColors = {
  order: "bg-green-100 text-green-800",
  product: "bg-blue-100 text-blue-800",
  company: "bg-purple-100 text-purple-800",
  contact: "bg-orange-100 text-orange-800",
  file: "bg-gray-100 text-gray-800",
  other: "bg-gray-100 text-gray-800",
};

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI-powered search mutation
  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const response = await apiRequest("POST", "/api/search/ai", { query: searchQuery });
      return await response.json();
    },
    onSuccess: (data: SearchResult[]) => {
      setResults(data || []);
      setIsOpen(true);
    },
    onError: (error) => {
      console.error("Search error:", error);
      setResults([]);
    },
  });

  // Handle search
  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    searchMutation.mutate(searchQuery.trim());
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (result.url) {
      setLocation(result.url);
    }
    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Escape to close
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

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
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
        />
        {searchMutation.isPending && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full max-w-2xl z-50 shadow-lg border-gray-200">
          <CardContent className="p-0">
            {results.length === 0 && !searchMutation.isPending && query.trim() && (
              <div className="p-4 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try searching for orders, products, companies, or files</p>
              </div>
            )}

            {results.map((result, index) => {
              const Icon = typeIcons[result.type] || Search;
              return (
                <Button
                  key={`${result.type}-${result.id}-${index}`}
                  variant="ghost"
                  className="w-full h-auto p-4 justify-start hover:bg-gray-50 rounded-none border-b border-gray-100 last:border-b-0"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <Icon className="h-5 w-5 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{result.title}</span>
                        <Badge variant="secondary" className={`text-xs ${typeColors[result.type]}`}>
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{result.description}</p>
                      {result.metadata && (
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {result.metadata.margin && (
                            <span>Margin: {result.metadata.margin}</span>
                          )}
                          {result.metadata.value && (
                            <span>Value: {result.metadata.value}</span>
                          )}
                          {result.metadata.status && (
                            <span>Status: {result.metadata.status}</span>
                          )}
                          {result.metadata.date && (
                            <span>Date: {result.metadata.date}</span>
                          )}
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
                  Try natural language queries like "last three orders with margins" or "Beber logo .ai file"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}