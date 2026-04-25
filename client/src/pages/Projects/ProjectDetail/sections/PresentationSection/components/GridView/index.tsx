import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Package } from "lucide-react";
interface GridViewProps {
  items: any[];
  hidePricing: boolean;
  onPreview: (item: any) => void;
  onToggleVisibility: (id: string) => void;
}

export default function GridView({ items, hidePricing, onPreview, onToggleVisibility }: GridViewProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {items.map((item) => (
        <Card key={item.id} className={`overflow-hidden hover:shadow-md transition-shadow group ${!item.isVisible ? "opacity-50" : ""}`}>
          <div className="aspect-square bg-gray-50 relative overflow-hidden cursor-pointer" onClick={() => onPreview(item)}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.productName || "Product"} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-gray-200" /></div>
            )}
            {!item.isVisible && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs bg-gray-800 text-white">Hidden</Badge>
              </div>
            )}
          </div>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm truncate flex-1">{item.productName || "Unnamed Product"}</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(item.id); }}
              >
                {item.isVisible ? <Eye className="w-3.5 h-3.5 text-gray-400" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
              </Button>
            </div>
            {item.productSku && <p className="text-xs text-gray-400">{item.productSku}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
              {!hidePricing && <span className="text-sm font-semibold">${Number(item.unitPrice || 0).toFixed(2)}</span>}
            </div>
            {item.colors && item.colors.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {item.colors.slice(0, 8).map((color: string, idx: number) => (
                  <div key={idx} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: color.toLowerCase() }} title={color} />
                ))}
                {item.colors.length > 8 && <span className="text-xs text-gray-400 self-center">+{item.colors.length - 8}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
