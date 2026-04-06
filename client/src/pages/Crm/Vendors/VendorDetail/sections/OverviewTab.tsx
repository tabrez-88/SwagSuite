import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Package,
  Star,
  Gift,
  Percent,
  TrendingUp,
  Award,
  Target,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import type { Vendor, VendorContact } from "@/services/suppliers";
import type { SupplierAddress } from "@/services/supplier-addresses";

interface OverviewTabProps {
  vendor: Vendor;
  vendorContacts: VendorContact[];
  vendorAddresses: SupplierAddress[];
  vendorProducts: any[] | undefined;
  onTabChange: (tab: string) => void;
}

export default function OverviewTab({ vendor, vendorContacts, vendorAddresses, vendorProducts, onTabChange }: OverviewTabProps) {
  return (
    <>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card — compact grid like Company Detail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                {/* Payment Terms */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Payment Terms</p>
                  <p className="text-sm font-medium">
                    {vendor.paymentTerms || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </p>
                </div>

                {/* Account Number */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                  <p className="text-sm font-medium">
                    {(vendor as any).accountNumber ? `#${(vendor as any).accountNumber}` : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </p>
                </div>

                {/* API Integration */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">API Integration</p>
                  {vendor.apiIntegrationStatus ? (
                    <Badge className={vendor.apiIntegrationStatus === "active" ? "bg-green-100 text-green-800" : ""}>
                      {vendor.apiIntegrationStatus}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">None</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Website</p>
                  {vendor.website ? (
                    <a
                      href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-swag-orange hover:underline flex items-center gap-1"
                    >
                      {vendor.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not set</p>
                  )}
                </div>

                {/* Last Order Date */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Order Date</p>
                  <p className="text-sm font-medium">
                    {vendor.lastOrderDate
                      ? format(new Date(vendor.lastOrderDate), "MMM d, yyyy")
                      : <span className="text-muted-foreground italic">N/A</span>
                    }
                  </p>
                </div>
              </div>

              {/* Notes */}
              {vendor.notes && (
                <div className="pt-4 mt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vendor.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metrics Row — like Company Detail */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      ${vendor.ytdSpend ? Number(vendor.ytdSpend).toLocaleString() : "0"}
                    </p>
                    <p className="text-xs text-muted-foreground">YTD Spend</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      ${vendor.lastYearSpend ? Number(vendor.lastYearSpend).toLocaleString() : "0"}
                    </p>
                    <p className="text-xs text-muted-foreground">Last Year Spend</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">
                      {vendor.createdAt
                        ? format(new Date(vendor.createdAt), "MMM d, yyyy")
                        : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">Vendor Since</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contacts Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Contacts
                </CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-swag-orange"
                  onClick={() => onTabChange("contacts")}
                >
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vendorContacts.length > 0 ? (
                <div className="space-y-3">
                  {vendorContacts.slice(0, 4).map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gray-100">
                          {contact.firstName?.[0]}{contact.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate flex items-center gap-1">
                          {contact.firstName} {contact.lastName}
                          {contact.isPrimary && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              Primary
                            </Badge>
                          )}
                        </span>
                        {contact.email && (
                          <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {vendorContacts.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{vendorContacts.length - 4} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No contacts yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Addresses Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  Addresses
                </CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-swag-orange"
                  onClick={() => onTabChange("addresses")}
                >
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vendorAddresses.length > 0 ? (
                <div className="space-y-3">
                  {vendorAddresses.slice(0, 3).map((addr) => (
                    <div key={addr.id} className="text-sm">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium">{addr.addressName || "Address"}</p>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {addr.addressType === "both"
                            ? "Bill & Ship"
                            : addr.addressType === "billing"
                              ? "Billing"
                              : "Shipping"}
                        </Badge>
                        {addr.isDefault && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[addr.street, addr.city, addr.state, addr.zipCode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  ))}
                  {vendorAddresses.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{vendorAddresses.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No addresses yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Products Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4" />
                  Products
                </CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-swag-orange"
                  onClick={() => onTabChange("products")}
                >
                  View All ({vendor.productCount || 0})
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vendorProducts && vendorProducts.length > 0 ? (
                <div className="space-y-3">
                  {vendorProducts.slice(0, 5).map((product: any) => (
                    <div key={product.id} className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name || product.productName}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {product.name || product.productName}
                        </p>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground truncate">{product.sku}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {(vendorProducts?.length || 0) > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{(vendorProducts?.length || 0) - 5} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No products yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
