import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Vendor } from "@/services/suppliers";
import {
  Award,
  DollarSign,
  Gift,
  Globe,
  Package,
  Percent,
  Star,
  Target,
  Trash2,
} from "lucide-react";

interface VendorCardViewProps {
  vendors: Vendor[];
  onViewDetail: (vendor: Vendor) => void;
  onTogglePreferred: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
  isTogglePending: boolean;
}

export function VendorCardView({
  vendors,
  onViewDetail,
  onTogglePreferred,
  onDelete,
  isTogglePending,
}: VendorCardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor: Vendor) => (
        <Card
          key={vendor.id}
          className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between"
          onClick={() => onViewDetail(vendor)}
          data-testid={`vendor-card-${vendor.id}`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start flex-col gap-2">
                  <CardTitle className="text-[16px] lg:text-lg text-swag-navy">{vendor.name}</CardTitle>
                  {vendor.apiIntegrationStatus === "active" && (
                    <Badge className="bg-green-100 text-green-800">From SAGE</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePreferred(vendor);
                  }}
                  className={vendor.isPreferred
                    ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    : "text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50"
                  }
                  disabled={isTogglePending}
                  title={vendor.isPreferred ? "Remove from preferred" : "Add to preferred"}
                >
                  <Star size={14} className={vendor.isPreferred ? "fill-current" : ""} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(vendor);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {vendor.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(() => { try { return new URL(vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`).hostname.replace("www.", ""); } catch { return vendor.website; } })()}
                  </a>
                </div>
              )}
            </div>

            {/* Show benefits for preferred vendors */}
            {vendor.isPreferred && (
              <div className="bg-yellow-50 rounded-md p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-3 w-3 text-yellow-600 fill-current" />
                  <span className="text-xs font-medium text-yellow-800">Preferred Benefits</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {vendor.preferredBenefits?.eqpPricing && (
                    <div className="flex items-center gap-2 text-xs">
                      <Percent className="h-3 w-3 text-green-600" />
                      <span>{vendor.preferredBenefits.eqpPricing}% EQP</span>
                    </div>
                  )}
                  {vendor.preferredBenefits?.rebatePercentage && (
                    <div className="flex items-center gap-2 text-xs">
                      <Gift className="h-3 w-3 text-blue-600" />
                      <span>{vendor.preferredBenefits.rebatePercentage}% Rebate</span>
                    </div>
                  )}
                  {vendor.preferredBenefits?.freeSetups && (
                    <div className="flex items-center gap-2 text-xs">
                      <Award className="h-3 w-3 text-purple-600" />
                      <span>Free Setups</span>
                    </div>
                  )}
                  {vendor.preferredBenefits?.freeSpecSamples && (
                    <div className="flex items-center gap-2 text-xs">
                      <Target className="h-3 w-3 text-indigo-600" />
                      <span>Free Samples</span>
                    </div>
                  )}
                </div>
                {(vendor.preferredBenefits?.ytdEqpSavings || vendor.preferredBenefits?.ytdRebates) && (
                  <div className="pt-2 border-t border-yellow-200 space-y-1">
                    {vendor.preferredBenefits?.ytdEqpSavings && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">YTD Savings:</span>
                        <span className="font-medium text-green-600">
                          ${vendor.preferredBenefits.ytdEqpSavings.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {vendor.preferredBenefits?.ytdRebates && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">YTD Rebates:</span>
                        <span className="font-medium text-blue-600">
                          ${vendor.preferredBenefits.ytdRebates.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {vendor.paymentTerms && (
              <div className="flex items-center text-sm gap-2">
                <Badge variant="outline">{vendor.paymentTerms}</Badge>
              </div>
            )}

            <div className="flex justify-between gap-2 text-sm">
              {vendor.productCount !== undefined && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-muted-foreground">{vendor.productCount} products</span>
                </div>
              )}

              {vendor.ytdSpend && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">YTD: ${vendor.ytdSpend.toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
