import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { format } from "date-fns";

interface PresentationDetailsCardProps {
  introduction: string;
  selectedContactName: string;
  expiryDate: string;
  currency: string;
  hidePricing: boolean;
  onEditClick: () => void;
}

export default function PresentationDetailsCard({
  introduction,
  selectedContactName,
  expiryDate,
  currency,
  hidePricing,
  onEditClick,
}: PresentationDetailsCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Presentation Details</CardTitle>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={onEditClick}>
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Introduction */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Introduction</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{introduction || <span className="text-gray-400 italic">No introduction</span>}</p>
        </div>

        {/* Dates, Business, Flags */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Expiry Date</span>
            <span className="text-sm font-medium">{expiryDate ? format(new Date(expiryDate + "T00:00:00"), "MMM d, yyyy") : "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Client Contact</span>
            <span className="text-sm font-medium">{selectedContactName || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Currency</span>
            <span className="text-sm font-medium">{currency || "USD"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Hide Pricing</span>
            <span className="text-sm font-medium">{hidePricing ? "Yes" : "No"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
