import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      try {
        // Check if this looks like an AI query (natural language)
        const isAIQuery = query.includes("?") || 
                         query.toLowerCase().includes("what") ||
                         query.toLowerCase().includes("who") ||
                         query.toLowerCase().includes("when") ||
                         query.toLowerCase().includes("how") ||
                         query.toLowerCase().includes("where");

        if (isAIQuery) {
          // Use AI search endpoint
          const response = await apiRequest("POST", "/api/search/ai", { query });
          const data = await response.json();
          
          toast({
            title: "AI Search",
            description: data.message,
          });
        } else {
          // Use regular universal search
          const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          
          const totalResults = data.companies.length + data.products.length + data.orders.length;
          toast({
            title: "Search Results",
            description: `Found ${totalResults} results across companies, products, and orders.`,
          });
        }
      } catch (error) {
        toast({
          title: "Search Error",
          description: "Failed to perform search. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="text-gray-400" size={20} />
      </div>
      <Input
        type="text"
        placeholder="Search anything or ask AI (e.g., 'What company did we order water bottles from last?')"
        className="pl-10 pr-12 w-96 focus:ring-2 focus:ring-swag-primary focus:border-transparent"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleSearch}
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        <Badge variant="secondary" className="text-xs bg-swag-secondary text-swag-dark">
          AI
        </Badge>
      </div>
    </div>
  );
}
