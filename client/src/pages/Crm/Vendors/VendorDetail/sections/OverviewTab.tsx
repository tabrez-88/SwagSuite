import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  Globe,
  Mail,
  Package,
  Phone,
  Star,
  Gift,
  Percent,
  TrendingUp,
  Award,
  Target,
  AlertTriangle,
} from "lucide-react";
import type { Vendor, VendorContact } from "@/services/suppliers";

interface OverviewTabProps {
  vendor: Vendor;
  vendorContacts: VendorContact[];
}

export default function OverviewTab({ vendor, vendorContacts }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Do Not Order Warning */}
      {vendor.doNotOrder && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Do Not Order</p>
            <p className="text-sm text-red-600">This vendor has been flagged — orders require admin approval.</p>
          </div>
        </div>
      )}

      {/* Preferred Vendor Benefits */}
      {vendor.isPreferred && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Star className="h-5 w-5 fill-yellow-500" />
              Preferred Vendor Benefits & Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Benefits Received
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {vendor.preferredBenefits?.eqpPricing ? (
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    <Percent className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">EQP Pricing</p>
                      <p className="font-semibold text-green-600">{vendor.preferredBenefits.eqpPricing}% discount</p>
                    </div>
                  </div>
                ) : null}
                {vendor.preferredBenefits?.rebatePercentage ? (
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Rebate</p>
                      <p className="font-semibold text-green-600">{vendor.preferredBenefits.rebatePercentage}%</p>
                    </div>
                  </div>
                ) : null}
                {vendor.preferredBenefits?.freeSetups && (
                  <Badge className="bg-blue-100 text-blue-800 justify-center py-2">
                    <Award className="h-3 w-3 mr-1" /> Free Setups
                  </Badge>
                )}
                {vendor.preferredBenefits?.freeSpecSamples && (
                  <Badge className="bg-blue-100 text-blue-800 justify-center py-2">
                    <Target className="h-3 w-3 mr-1" /> Free Spec Samples
                  </Badge>
                )}
                {vendor.preferredBenefits?.reducedSpecSamples && (
                  <Badge className="bg-blue-100 text-blue-800 justify-center py-2">Reduced Spec Samples</Badge>
                )}
                {vendor.preferredBenefits?.freeSelfPromo && (
                  <Badge className="bg-blue-100 text-blue-800 justify-center py-2">Free Self-Promo</Badge>
                )}
                {vendor.preferredBenefits?.reducedSelfPromo && (
                  <Badge className="bg-blue-100 text-blue-800 justify-center py-2">Reduced Self-Promo</Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                YTD Performance Tracking
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">EQP Savings</p>
                  <p className="text-lg font-bold text-green-600">
                    ${vendor.preferredBenefits?.ytdEqpSavings?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">YTD Rebates</p>
                  <p className="text-lg font-bold text-green-600">
                    ${vendor.preferredBenefits?.ytdRebates?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Self-Promos</p>
                  <p className="text-lg font-bold text-blue-600">
                    {vendor.preferredBenefits?.selfPromosSent || 0}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Spec Samples</p>
                  <p className="text-lg font-bold text-blue-600">
                    {vendor.preferredBenefits?.specSamplesSent || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendor.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-swag-primary hover:underline">
                    {vendor.website}
                  </a>
                </div>
              </div>
            )}
            {vendor.apiIntegrationStatus && (
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">API Integration</p>
                  <Badge className={vendor.apiIntegrationStatus === "active" ? "bg-green-100 text-green-800" : ""}>
                    {vendor.apiIntegrationStatus}
                  </Badge>
                </div>
              </div>
            )}
            {/* Legacy fields - show only if no contacts exist */}
            {vendorContacts.length === 0 && (
              <>
                {vendor.email && (
                  <div className="flex items-center gap-3 opacity-60">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Legacy Email</p>
                      <a href={`mailto:${vendor.email}`} className="text-sm text-swag-primary hover:underline">
                        {vendor.email}
                      </a>
                    </div>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-3 opacity-60">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Legacy Phone</p>
                      <a href={`tel:${vendor.phone}`} className="text-sm text-swag-primary hover:underline">
                        {vendor.phone}
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
            {vendor.notes && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Notes</p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-muted-foreground whitespace-pre-wrap">{vendor.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(vendor as any).defaultTerms && (
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Default Terms</p>
                  <Badge variant="secondary">{(vendor as any).defaultTerms}</Badge>
                </div>
              </div>
            )}
            {vendor.paymentTerms && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Payment Terms</p>
                  <Badge variant="secondary">{vendor.paymentTerms}</Badge>
                </div>
              </div>
            )}
            {(vendor as any).accountNumber && (
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Account Number</p>
                  <p className="text-sm">#{(vendor as any).accountNumber}</p>
                </div>
              </div>
            )}
            {vendor.ytdSpend && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">YTD Spend</p>
                  <p className="text-lg font-semibold text-green-600">${Number(vendor.ytdSpend).toLocaleString()}</p>
                </div>
              </div>
            )}
            {vendor.lastYearSpend && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Year Spend</p>
                  <p className="text-lg font-medium text-muted-foreground">${Number(vendor.lastYearSpend).toLocaleString()}</p>
                </div>
              </div>
            )}
            {vendor.lastOrderDate && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Order Date</p>
                  <p className="text-muted-foreground">{new Date(vendor.lastOrderDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
