import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Vendor } from "@/services/suppliers";
import { Gift, Percent, Star } from "lucide-react";

interface PreferredVendorCardViewProps {
  vendors: Vendor[];
  onViewDetail: (vendor: Vendor) => void;
}

export function PreferredVendorCardView({ vendors, onViewDetail }: PreferredVendorCardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor: Vendor) => (
        <Card
          key={vendor.id}
          className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50"
          onClick={() => onViewDetail(vendor)}
          data-testid={`preferred-vendor-card-${vendor.id}`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg text-swag-navy flex items-center gap-2">
                    {vendor.name}
                  </CardTitle>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Benefits Summary */}
            <div className="grid grid-cols-2 gap-3">
              {vendor.preferredBenefits?.eqpPricing && (
                <div className="flex items-center gap-2 text-sm bg-green-100 rounded-md p-2">
                  <Percent className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{vendor.preferredBenefits.eqpPricing}% EQP</span>
                </div>
              )}
              {vendor.preferredBenefits?.rebatePercentage && (
                <div className="flex items-center gap-2 text-sm bg-blue-100 rounded-md p-2">
                  <Gift className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{vendor.preferredBenefits.rebatePercentage}% Rebate</span>
                </div>
              )}
            </div>

            {/* YTD Tracking */}
            <div className="space-y-2 pt-2 border-t">
              {vendor.preferredBenefits?.ytdEqpSavings && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">YTD EQP Savings:</span>
                  <span className="font-medium text-green-600">
                    ${vendor.preferredBenefits.ytdEqpSavings.toLocaleString()}
                  </span>
                </div>
              )}
              {vendor.preferredBenefits?.ytdRebates && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">YTD Rebates:</span>
                  <span className="font-medium text-blue-600">
                    ${vendor.preferredBenefits.ytdRebates.toLocaleString()}
                  </span>
                </div>
              )}
              {vendor.preferredBenefits?.selfPromosSent !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Self Promos:</span>
                  <span className="font-medium">{vendor.preferredBenefits.selfPromosSent}</span>
                </div>
              )}
              {vendor.preferredBenefits?.specSamplesSent !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Spec Samples:</span>
                  <span className="font-medium">{vendor.preferredBenefits.specSamplesSent}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge className="bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Preferred
              </Badge>
              {vendor.ytdSpend && (
                <span className="text-sm font-medium text-swag-navy">
                  ${vendor.ytdSpend.toLocaleString()} YTD
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
