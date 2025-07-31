import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  FileText, 
  Users, 
  Package, 
  ShoppingBag,
  Building2,
  Clock,
  TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'company' | 'order' | 'product' | 'contact' | 'document';
  url: string;
  metadata?: any;
}

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["/api/search", query],
    enabled: query.length > 2,
    staleTime: 30000,
  });

  // Close search on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'company': return Building2;
      case 'order': return ShoppingBag;
      case 'product': return Package;
      case 'contact': return Users;
      case 'document': return FileText;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'company': return 'bg-blue-100 text-blue-600';
      case 'order': return 'bg-green-100 text-green-600';
      case 'product': return 'bg-purple-100 text-purple-600';
      case 'contact': return 'bg-orange-100 text-orange-600';
      case 'document': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    window.location.href = result.url;
    setIsOpen(false);
    setQuery("");
  };

  const quickActions = [
    { label: "New Order", url: "/orders", icon: ShoppingBag },
    { label: "Add Company", url: "/crm", icon: Building2 },
    { label: "View Reports", url: "/reports", icon: TrendingUp },
    { label: "Recent Activity", url: "/", icon: Clock },
  ];

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search everything... (⌘K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4 w-full bg-white/90 backdrop-blur border-gray-200 focus:border-swag-primary focus:ring-swag-primary"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <Card className="shadow-xl border-gray-200">
            <CardContent className="p-0">
              {query.length === 0 ? (
                // Quick Actions when no search
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
                  <div className="space-y-1">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.label}
                          variant="ghost"
                          className="w-full justify-start h-8 px-2"
                          onClick={() => {
                            window.location.href = action.url;
                            setIsOpen(false);
                          }}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : query.length <= 2 ? (
                // Minimum query length message
                <div className="p-4">
                  <p className="text-sm text-gray-500">Type at least 3 characters to search</p>
                </div>
              ) : isLoading ? (
                // Loading state
                <div className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-swag-primary animate-pulse"></div>
                    <p className="text-sm text-gray-500">Searching...</p>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                // No results
                <div className="p-4">
                  <p className="text-sm text-gray-500">No results found for "{query}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try searching for companies, orders, products, or contacts</p>
                </div>
              ) : (
                // Search results
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <p className="text-xs text-gray-500 mb-2 px-2">
                      Found {searchResults.length} results
                    </p>
                    {searchResults.map((result: SearchResult) => {
                      const Icon = getTypeIcon(result.type);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "p-1.5 rounded-md flex-shrink-0",
                              getTypeColor(result.type)
                            )}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900 truncate">
                                  {result.title}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {result.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {result.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}