import { CRMViewToggle } from "@/components/shared/CRMViewToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Vendor } from "@/services/suppliers";
import {
  Award,
  Building2,
  DollarSign,
  Edit,
  Eye,
  Gift,
  Globe,
  MoreHorizontal,
  Package,
  Percent,
  Plus,
  Search,
  Star,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { usePaymentTerms } from "@/services/payment-terms";
import { useVendors } from "./hooks";
import { Separator } from "@/components/ui/separator";
import { VendorFormDialog } from "./components/VendorFormDialog";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { SortableTableHead } from "../components/SortableTableHead";

export default function Vendors() {
  const v = useVendors();
  const { data: paymentTermsOptions = [] } = usePaymentTerms();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-swag-navy">Vendors</h1>
          <p className="text-muted-foreground">
            Manage your supplier relationships and vendor information
          </p>
        </div>
        <Button onClick={v.handleOpenCreate} className="bg-swag-primary hover:bg-swag-primary/90">
          <Plus className="mr-2" size={16} />
          Add Vendor
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={v.activeTab} onValueChange={v.setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              All Vendors ({v.vendors.length})
            </TabsTrigger>
            <TabsTrigger value="preferred" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Preferred ({v.preferredVendors.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search vendors..."
                value={v.searchQuery}
                onChange={(e) => v.setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-vendors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="whitespace-nowrap">
              {v.filteredVendors.length} Vendors
            </Badge>
            <Separator orientation="vertical" className="h-8" />
            <CRMViewToggle viewMode={v.viewMode} onViewModeChange={v.setViewMode} />
          </div>
        </div>

        {/* Tab Content - All Vendors */}
        <TabsContent value="all" className="space-y-6">

          {/* Vendors Display */}
          {v.isLoading ? (
            v.viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Terms</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>YTD Spend</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          ) : v.filteredVendors.length > 0 ? (
            <>
              {/* Cards View */}
              {v.viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {v.filteredVendors.map((vendor: Vendor) => (
                    <Card
                      key={vendor.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between"
                      onClick={() => v.handleOpenVendorDetail(vendor)}
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
                                v.handleTogglePreferred(vendor);
                              }}
                              className={vendor.isPreferred
                                ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                : "text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50"
                              }
                              disabled={v.togglePreferredMutation.isPending}
                              title={vendor.isPreferred ? "Remove from preferred" : "Add to preferred"}
                            >
                              <Star size={14} className={vendor.isPreferred ? "fill-current" : ""} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                v.handleDeleteVendor(vendor);
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
              )}

              {/* List View */}
              {v.viewMode === 'list' && (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableTableHead label="Vendor" field="name" currentSortField={v.sortField} currentSortDirection={v.sortDirection} onSort={v.handleSort} />
                          <TableHead>Contact Info</TableHead>
                          <SortableTableHead label="Terms" field="paymentTerms" currentSortField={v.sortField} currentSortDirection={v.sortDirection} onSort={v.handleSort} />
                          <SortableTableHead label="Products" field="productCount" currentSortField={v.sortField} currentSortDirection={v.sortDirection} onSort={v.handleSort} />
                          <SortableTableHead label="YTD Spend" field="ytdSpend" currentSortField={v.sortField} currentSortDirection={v.sortDirection} onSort={v.handleSort} />
                          <SortableTableHead label="Status" field="isPreferred" currentSortField={v.sortField} currentSortDirection={v.sortDirection} onSort={v.handleSort} />
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {v.filteredVendors.map((vendor: Vendor) => (
                          <TableRow
                            key={vendor.id}
                            className="hover:bg-muted/50 cursor-pointer"
                            onClick={() => v.handleOpenVendorDetail(vendor)}
                            data-testid={`vendor-row-${vendor.id}`}
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <UserAvatar name={vendor.name} size="sm" />
                                <div>
                                  <div className="font-medium text-swag-navy flex items-center gap-2">
                                    {vendor.name}
                                  </div>
                                  {vendor.contactPerson && (
                                    <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {vendor.website && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Globe className="h-3 w-3 text-muted-foreground" />
                                    <a
                                      href={vendor.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Website
                                    </a>
                                  </div>
                                )}
                                {vendor.apiIntegrationStatus === "active" && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">API Active</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {vendor.paymentTerms && (
                                <Badge variant="secondary" className="text-xs">
                                  {vendor.paymentTerms}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {vendor.productCount !== undefined && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Package className="h-3 w-3 text-blue-600" />
                                  <span>{vendor.productCount}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {vendor.ytdSpend && (
                                <div className="flex items-center gap-1 text-sm font-medium">
                                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                                  ${vendor.ytdSpend.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {vendor.isPreferred && (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">Preferred</Badge>
                                )}

                                {vendor.apiIntegrationStatus === "active" && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">API Connected</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`vendor-actions-${vendor.id}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    v.handleOpenVendorDetail(vendor);
                                  }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    v.handleOpenEdit(vendor);
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      v.handleDeleteVendor(vendor);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No vendors found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {v.searchQuery
                    ? "Try adjusting your search terms or create a new vendor."
                    : "Get started by adding your first vendor to manage supplier relationships."
                  }
                </p>
                <Button onClick={v.handleOpenCreate} className="bg-swag-primary hover:bg-swag-primary/90">
                  <Plus className="mr-2" size={16} />
                  Add Vendor
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Content - Preferred Vendors */}
        <TabsContent value="preferred" className="space-y-6">
          {/* Preferred Vendors Display */}
          {v.isLoading ? (
            v.viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Preferred Vendor</TableHead>
                        <TableHead>Benefits</TableHead>
                        <TableHead>YTD Savings</TableHead>
                        <TableHead>YTD Rebates</TableHead>
                        <TableHead>Promos Sent</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          ) : v.preferredVendors.length > 0 ? (
            <>
              {/* Cards View - Preferred */}
              {v.viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {v.preferredVendors.map((vendor: Vendor) => (
                    <Card
                      key={vendor.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50"
                      onClick={() => v.handleOpenVendorDetail(vendor)}
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
              )}

              {/* List View - Preferred */}
              {v.viewMode === 'list' && (
                <Card className="border-yellow-200">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Preferred Vendor</TableHead>
                          <TableHead>Benefits</TableHead>
                          <TableHead>YTD Savings</TableHead>
                          <TableHead>YTD Rebates</TableHead>
                          <TableHead>Promos Sent</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {v.preferredVendors.map((vendor: Vendor) => (
                          <TableRow
                            key={vendor.id}
                            className="hover:bg-yellow-50 cursor-pointer bg-gradient-to-r from-yellow-50/50 to-transparent"
                            onClick={() => v.handleOpenVendorDetail(vendor)}
                            data-testid={`preferred-vendor-row-${vendor.id}`}
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <UserAvatar name={vendor.name} size="sm" />
                                <div>
                                  <div className="font-medium text-swag-navy flex items-center gap-2">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    {vendor.name}
                                  </div>
                                  {vendor.contactPerson && (
                                    <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {vendor.preferredBenefits?.eqpPricing && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                    {vendor.preferredBenefits.eqpPricing}% EQP
                                  </Badge>
                                )}
                                {vendor.preferredBenefits?.rebatePercentage && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                    {vendor.preferredBenefits.rebatePercentage}% Rebate
                                  </Badge>
                                )}
                                {vendor.preferredBenefits?.freeSetups && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                    Free Setups
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {vendor.preferredBenefits?.ytdEqpSavings && (
                                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                  <TrendingUp className="h-3 w-3" />
                                  ${vendor.preferredBenefits.ytdEqpSavings.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {vendor.preferredBenefits?.ytdRebates && (
                                <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                                  <Gift className="h-3 w-3" />
                                  ${vendor.preferredBenefits.ytdRebates.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {vendor.preferredBenefits?.selfPromosSent !== undefined && (
                                  <div>Self: {vendor.preferredBenefits.selfPromosSent}</div>
                                )}
                                {vendor.preferredBenefits?.specSamplesSent !== undefined && (
                                  <div>Samples: {vendor.preferredBenefits.specSamplesSent}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`preferred-vendor-actions-${vendor.id}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    v.handleOpenVendorDetail(vendor);
                                  }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    v.handleOpenEdit(vendor);
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Vendor
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No preferred vendors found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Mark vendors as preferred to track special benefits, EQP pricing, and rebates.
                </p>
                <Button onClick={v.handleOpenCreate} className="bg-swag-primary hover:bg-swag-primary/90">
                  <Plus className="mr-2" size={16} />
                  Add Preferred Vendor
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Vendor Form Dialog (Create / Edit) */}
      <VendorFormDialog
        open={v.isFormDialogOpen}
        onOpenChange={v.setIsFormDialogOpen}
        vendor={v.selectedVendor}
        onSubmit={v.handleFormSubmit}
        isPending={v.selectedVendor ? v.updateVendorMutation.isPending : v.createVendorMutation.isPending}
        paymentTermsOptions={paymentTermsOptions}
      />

      {/* Delete Vendor Confirmation */}
      <DeleteConfirmDialog
        open={v.isDeleteVendorDialogOpen}
        onOpenChange={v.setIsDeleteVendorDialogOpen}
        title="Delete Vendor?"
        description={<strong>{v.vendorToDelete?.name}</strong>}
        onConfirm={v.handleConfirmDeleteVendor}
        onCancel={() => { v.setVendorToDelete(null); v.setIsDeleteVendorDialogOpen(false); }}
        isPending={v.deleteVendorMutation.isPending}
        confirmLabel="Delete Vendor"
      />
    </div>
  );
}
