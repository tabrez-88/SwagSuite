import {
  Search, Package, Users, Building, TrendingUp, Truck, ClipboardList, FileText, MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "@/lib/wouter-compat";
import { formatLabel } from "@/lib/utils";

const typeIcons: Record<string, any> = {
  order: TrendingUp,
  product: Package,
  company: Building,
  contact: Users,
  vendor: Truck,
  purchase_order: ClipboardList,
  shipment: Truck,
  activity: MessageSquare,
  file: FileText,
  other: Search,
};

const typeColors: Record<string, string> = {
  order: "bg-green-100 text-green-800",
  product: "bg-blue-100 text-blue-800",
  company: "bg-purple-100 text-purple-800",
  contact: "bg-orange-100 text-orange-800",
  vendor: "bg-teal-100 text-teal-800",
  purchase_order: "bg-amber-100 text-amber-800",
  shipment: "bg-cyan-100 text-cyan-800",
  activity: "bg-pink-100 text-pink-800",
};

const typeLabels: Record<string, string> = {
  order: "Order",
  product: "Product",
  company: "Company",
  contact: "Contact",
  vendor: "Vendor",
  purchase_order: "PO",
  shipment: "Shipment",
  activity: "Activity",
};

interface ResultCardProps {
  result: {
    id: string;
    type: string;
    title: string;
    description: string;
    metadata: Record<string, any>;
    url: string;
  };
}

export function ResultCard({ result }: ResultCardProps) {
  const [, setLocation] = useLocation();
  const Icon = typeIcons[result.type] || Search;

  const metaItems = Object.entries(result.metadata || {})
    .filter(([, v]) => v && typeof v === "string" && v.length > 0)
    .slice(0, 5);

  return (
    <div
      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => result.url && setLocation(result.url)}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-gray-900 truncate">{result.title}</span>
            <Badge variant="secondary" className={`text-xs flex-shrink-0 ${typeColors[result.type] || "bg-gray-100 text-gray-800"}`}>
              {typeLabels[result.type] || result.type}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mb-1">{formatLabel(result.description)}</p>
          {metaItems.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
              {metaItems.map(([key, value]) => (
                <span key={key}>
                  <span className="text-gray-500 capitalize">{formatLabel(key)}:</span> {formatLabel(value)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
