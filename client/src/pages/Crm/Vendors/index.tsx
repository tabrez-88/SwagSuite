import { CRMViewToggle } from "@/components/shared/CRMViewToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Vendor } from "@/services/suppliers";
import {
  AlertTriangle,
  Award,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Eye,
  Gift,
  Globe,
  Mail,
  MoreHorizontal,
  Package,
  Percent,
  Phone,
  Plus,
  Search,
  Star,
  Target,
  Trash2,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  MailX,
} from "lucide-react";
import { SupplierAddressesManager } from "@/components/feature/SupplierAddressesManager";
import { CONTACT_DEPARTMENTS } from "@/schemas/crm.schemas";
import { useVendors } from "./hooks";

export default function Vendors() {
  const v = useVendors();

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
        <Dialog open={v.isCreateModalOpen} onOpenChange={v.setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-swag-primary hover:bg-swag-primary/90">
              <Plus className="mr-2" size={16} />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <Form {...v.form}>
              <form onSubmit={v.form.handleSubmit(v.onSubmit)} className="space-y-4">
                <FormField
                  control={v.form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter vendor name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={v.form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Contact Management:</strong> After creating the vendor, you can add contacts through the vendor details page.
                  </p>
                  <p className="text-xs text-blue-700">
                    Each vendor can have multiple contacts with their own email, phone, and role information.
                  </p>
                </div>

                <FormField
                  control={v.form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Net 30, COD" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Preferred Vendor Settings */}
                <div className="space-y-4 p-4 border rounded-lg bg-yellow-50/50">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <h3 className="font-medium text-sm">Preferred Vendor Settings</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={v.form.control}
                      name="isPreferred"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Mark as Preferred</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Enable special tracking and benefits
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Preferred vendor benefits - show only when preferred is enabled */}
                  {v.form.watch("isPreferred") && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={v.form.control}
                          name="eqpPricing"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>EQP Pricing %</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g., 15"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={v.form.control}
                          name="rebatePercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rebate %</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g., 5"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={v.form.control}
                          name="freeSetups"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">Free Setups</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={v.form.control}
                          name="freeSpecSamples"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">Free Spec Samples</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={v.form.control}
                          name="freeSelfPromo"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">Free Self Promo</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={v.form.control}
                          name="reducedSpecSamples"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">Reduced Spec Samples</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <FormField
                  control={v.form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes about this vendor" rows={3} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => v.setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={v.createVendorMutation.isPending}
                    className="bg-swag-primary hover:bg-swag-primary/90"
                  >
                    {v.createVendorMutation.isPending ? "Creating..." : "Create Vendor"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
            <CRMViewToggle viewMode={v.viewMode} onViewModeChange={v.setViewMode} />
            <Badge variant="outline" className="whitespace-nowrap">
              {v.filteredVendors.length} vendors
            </Badge>
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
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => v.handleOpenVendorDetail(vendor)}
                      data-testid={`vendor-card-${vendor.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg text-swag-navy">{vendor.name}</CardTitle>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
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
                              >
                                Website
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
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{vendor.paymentTerms}</Badge>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-sm">
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
                        {vendor.apiIntegrationStatus === "active" && (
                          <Badge className="bg-green-100 text-green-800">API Connected</Badge>
                        )}
                        <div className="flex items-center flex-wrap gap-2 justify-between">

                          <Button variant="outline" className="w-full" size="sm">
                            <Package className="mr-1" size={12} />
                            View Products
                          </Button>
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
                                    v.handleEditVendor(vendor);
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
                <Button onClick={() => v.setIsCreateModalOpen(true)} className="bg-swag-primary hover:bg-swag-primary/90">
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
                                    v.handleEditVendor(vendor);
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Vendor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    v.setSelectedVendor(vendor);
                                    v.setIsEditBenefitsOpen(true);
                                  }}>
                                    <Star className="h-4 w-4 mr-2" />
                                    Edit Benefits
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
                <Button onClick={() => v.setIsCreateModalOpen(true)} className="bg-swag-primary hover:bg-swag-primary/90">
                  <Plus className="mr-2" size={16} />
                  Add Preferred Vendor
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Vendor Detail Modal */}
      <Dialog open={v.isVendorDetailOpen} onOpenChange={v.setIsVendorDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <UserAvatar name={v.selectedVendor?.name || ""} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  {v.selectedVendor?.name}
                  {v.selectedVendor?.isPreferred && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
                {v.selectedVendor?.contactPerson && (
                  <p className="text-sm text-muted-foreground font-normal">
                    Contact: {v.selectedVendor.contactPerson}
                  </p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {v.selectedVendor && (
            <div className="space-y-6">
              {/* Preferred Vendor Benefits */}
              {v.selectedVendor.isPreferred && (
                <Card className="border-yellow-200 col-span-2 bg-yellow-50/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-yellow-800">
                        <Star className="h-5 w-5 fill-yellow-500" />
                        Preferred Vendor Benefits & Tracking
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          v.setIsEditBenefitsOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Benefits
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Benefits Section */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Benefits Received
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {v.selectedVendor.preferredBenefits?.eqpPricing && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border">
                            <Percent className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">EQP Pricing</p>
                              <p className="font-semibold text-green-600">{v.selectedVendor.preferredBenefits.eqpPricing}% discount</p>
                            </div>
                          </div>
                        )}
                        {v.selectedVendor.preferredBenefits?.rebatePercentage && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">Rebate</p>
                              <p className="font-semibold text-green-600">{v.selectedVendor.preferredBenefits.rebatePercentage}%</p>
                            </div>
                          </div>
                        )}
                        {v.selectedVendor.preferredBenefits?.freeSetups && (
                          <Badge className="bg-blue-100 text-blue-800 justify-center">Free Setups</Badge>
                        )}
                        {v.selectedVendor.preferredBenefits?.freeSpecSamples && (
                          <Badge className="bg-blue-100 text-blue-800 justify-center">Free Spec Samples</Badge>
                        )}
                        {v.selectedVendor.preferredBenefits?.reducedSpecSamples && (
                          <Badge className="bg-blue-100 text-blue-800 justify-center">Reduced Spec Samples</Badge>
                        )}
                        {v.selectedVendor.preferredBenefits?.freeSelfPromo && (
                          <Badge className="bg-blue-100 text-blue-800 justify-center">Free Self-Promo</Badge>
                        )}
                        {v.selectedVendor.preferredBenefits?.reducedSelfPromo && (
                          <Badge className="bg-blue-100 text-blue-800 justify-center">Reduced Self-Promo</Badge>
                        )}
                      </div>
                    </div>

                    {/* Tracking Metrics */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        YTD Performance Tracking
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-1">EQP Savings</p>
                          <p className="text-lg font-bold text-green-600">
                            ${v.selectedVendor.preferredBenefits?.ytdEqpSavings?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-1">YTD Rebates</p>
                          <p className="text-lg font-bold text-green-600">
                            ${v.selectedVendor.preferredBenefits?.ytdRebates?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-1">Self-Promos</p>
                          <p className="text-lg font-bold text-blue-600">
                            {v.selectedVendor.preferredBenefits?.selfPromosSent || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-1">Spec Samples</p>
                          <p className="text-lg font-bold text-blue-600">
                            {v.selectedVendor.preferredBenefits?.specSamplesSent || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {v.selectedVendor.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Website</p>
                          <a
                            href={v.selectedVendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-swag-primary hover:underline"
                          >
                            {v.selectedVendor.website}
                          </a>
                        </div>
                      </div>
                    )}
                    {v.selectedVendor.apiIntegrationStatus && (
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">API Integration</p>
                          <Badge className={v.selectedVendor.apiIntegrationStatus === "active" ? "bg-green-100 text-green-800" : ""}>
                            {v.selectedVendor.apiIntegrationStatus}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {/* Legacy fields - show only if no contacts exist */}
                    {v.vendorContacts.length === 0 && (
                      <>
                        {v.selectedVendor.email && (
                          <div className="flex items-center gap-3 opacity-60">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Legacy Email</p>
                              <a
                                href={`mailto:${v.selectedVendor.email}`}
                                className="text-sm text-swag-primary hover:underline"
                              >
                                {v.selectedVendor.email}
                              </a>
                              <p className="text-xs text-muted-foreground mt-1">
                                Consider adding this to a contact
                              </p>
                            </div>
                          </div>
                        )}
                        {v.selectedVendor.phone && (
                          <div className="flex items-center gap-3 opacity-60">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Legacy Phone</p>
                              <a
                                href={`tel:${v.selectedVendor.phone}`}
                                className="text-sm text-swag-primary hover:underline"
                              >
                                {v.selectedVendor.phone}
                              </a>
                              <p className="text-xs text-muted-foreground mt-1">
                                Consider adding this to a contact
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Financial Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {v.selectedVendor.paymentTerms && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Payment Terms</p>
                          <Badge variant="secondary">{v.selectedVendor.paymentTerms}</Badge>
                        </div>
                      </div>
                    )}
                    {v.selectedVendor.ytdSpend && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">YTD Spend</p>
                          <p className="text-lg font-semibold text-green-600">
                            ${v.selectedVendor.ytdSpend.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {v.selectedVendor.lastYearSpend && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Last Year Spend</p>
                          <p className="text-lg font-medium text-muted-foreground">
                            ${v.selectedVendor.lastYearSpend.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {v.selectedVendor.lastOrderDate && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Last Order Date</p>
                          <p className="text-muted-foreground">
                            {new Date(v.selectedVendor.lastOrderDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>


              </div>

              {/* Supplier Addresses */}
              <SupplierAddressesManager
                supplierId={v.selectedVendor.id}
                supplierName={v.selectedVendor.name}
              />

              {/* Vendor Contacts */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Contacts ({v.filteredContacts.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {v.inactiveContactCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => v.setShowInactiveContacts(!v.showInactiveContacts)}
                          className="text-xs text-muted-foreground"
                        >
                          {v.showInactiveContacts ? "Hide" : "Show"} Inactive ({v.inactiveContactCount})
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => v.setIsAddContactOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Contact
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {v.isLoadingContacts ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : v.filteredContacts && v.filteredContacts.length > 0 ? (
                    <div className="space-y-3">
                      {v.filteredContacts.map((contact) => (
                        <Card key={contact.id} className={`border ${contact.isActive === false ? "opacity-50" : ""}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <UserAvatar
                                  name={`${contact.firstName} ${contact.lastName}`}
                                  size="sm"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className={`font-medium ${contact.isActive === false ? "line-through text-muted-foreground" : ""}`}>
                                      {contact.firstName} {contact.lastName}
                                    </h4>
                                    {contact.isActive === false && (
                                      <Badge variant="outline" className="text-xs text-gray-500">
                                        <UserX className="h-3 w-3 mr-1" />
                                        Inactive
                                      </Badge>
                                    )}
                                    {contact.isPrimary && (
                                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                        Primary
                                      </Badge>
                                    )}
                                    {contact.department && (
                                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                        {contact.department.charAt(0).toUpperCase() + contact.department.slice(1)}
                                      </Badge>
                                    )}
                                    {contact.noMarketing && (
                                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                                        <MailX className="h-3 w-3 mr-1" />
                                        No Marketing
                                      </Badge>
                                    )}
                                    {contact.receiveOrderEmails !== false && contact.email && (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                        <Mail className="h-3 w-3 mr-1" />
                                        Order Emails
                                      </Badge>
                                    )}
                                    {contact.receiveOrderEmails === false && (
                                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                        No Order Emails
                                      </Badge>
                                    )}
                                  </div>
                                  {contact.title && (
                                    <p className="text-sm text-muted-foreground">{contact.title}</p>
                                  )}
                                  <div className="mt-2 space-y-1">
                                    {contact.email && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        <a
                                          href={`mailto:${contact.email}`}
                                          className="text-swag-primary hover:underline"
                                        >
                                          {contact.email}
                                        </a>
                                      </div>
                                    )}
                                    {contact.phone && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <a
                                          href={`tel:${contact.phone}`}
                                          className="text-swag-primary hover:underline"
                                        >
                                          {contact.phone}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => v.handleEditContact(contact)}
                                  title="Edit contact"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => v.handleToggleActive(contact)}
                                  title={contact.isActive === false ? "Reactivate contact" : "Deactivate contact"}
                                  className={contact.isActive === false ? "text-green-600 hover:text-green-700" : "text-gray-500 hover:text-gray-700"}
                                >
                                  {contact.isActive === false ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No contacts found for this vendor</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => v.setIsAddContactOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Contact
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status and Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Vendor Status & Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {v.selectedVendor.isPreferred && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Preferred Vendor
                      </Badge>
                    )}
                    {v.selectedVendor.doNotOrder && (
                      <Badge variant="destructive">
                        Do Not Order
                      </Badge>
                    )}
                    {v.selectedVendor.apiIntegrationStatus === "active" && (
                      <Badge className="bg-green-100 text-green-800">
                        API Connected
                      </Badge>
                    )}
                  </div>
                  {v.selectedVendor.notes && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Notes</p>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {v.selectedVendor.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Products List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Products ({v.selectedVendor.productCount || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {v.isLoadingProducts ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : v.vendorProducts && v.vendorProducts.length > 0 ? (
                    <div className="space-y-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Min Qty</TableHead>
                            <TableHead>Lead Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {v.vendorProducts.map((product: any) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {product.imageUrl && (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    {product.description && (
                                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                        {product.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {product.sku || product.supplierSku || '-'}
                                </code>
                              </TableCell>
                              <TableCell>
                                {product.basePrice ? (
                                  <span className="font-medium text-green-600">
                                    ${parseFloat(product.basePrice).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {product.minimumQuantity || 1}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {product.leadTime ? (
                                  <span className="text-sm text-muted-foreground">
                                    {product.leadTime} days
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No products found for this vendor</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={v.handleEditVendorFromDetail}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Vendor
                </Button>
                {v.selectedVendor.isPreferred && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      v.setIsEditBenefitsOpen(true);
                    }}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Edit Benefits
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={v.handleDeleteVendorFromDetail}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Vendor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Preferred Benefits Dialog */}
      <Dialog open={v.isEditBenefitsOpen} onOpenChange={v.setIsEditBenefitsOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Edit Preferred Vendor Benefits - {v.selectedVendor?.name}
            </DialogTitle>
          </DialogHeader>
          {v.selectedVendor && (
            <div className="space-y-6">
              {/* Benefits Section */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Benefits Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">EQP Pricing (%)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 15"
                      value={v.benefitsForm.eqpPricing}
                      onChange={(e) => v.setBenefitsForm({ ...v.benefitsForm, eqpPricing: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rebate (%)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 5"
                      value={v.benefitsForm.rebatePercentage}
                      onChange={(e) => v.setBenefitsForm({ ...v.benefitsForm, rebatePercentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="text-sm font-medium">Free Setups</label>
                    <Switch
                      checked={v.benefitsForm.freeSetups}
                      onCheckedChange={(checked) => v.setBenefitsForm({ ...v.benefitsForm, freeSetups: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="text-sm font-medium">Free Spec Samples</label>
                    <Switch
                      checked={v.benefitsForm.freeSpecSamples}
                      onCheckedChange={(checked) => v.setBenefitsForm({ ...v.benefitsForm, freeSpecSamples: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="text-sm font-medium">Reduced Spec Samples</label>
                    <Switch
                      checked={v.benefitsForm.reducedSpecSamples}
                      onCheckedChange={(checked) => v.setBenefitsForm({ ...v.benefitsForm, reducedSpecSamples: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="text-sm font-medium">Free Self-Promo</label>
                    <Switch
                      checked={v.benefitsForm.freeSelfPromo}
                      onCheckedChange={(checked) => v.setBenefitsForm({ ...v.benefitsForm, freeSelfPromo: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="text-sm font-medium">Reduced Self-Promo</label>
                    <Switch
                      checked={v.benefitsForm.reducedSelfPromo}
                      onCheckedChange={(checked) => v.setBenefitsForm({ ...v.benefitsForm, reducedSelfPromo: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Tracking Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tracking Metrics (Optional)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">YTD EQP Savings ($)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={v.benefitsForm.ytdEqpSavings}
                      onChange={(e) => v.setBenefitsForm({ ...v.benefitsForm, ytdEqpSavings: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">YTD Rebates ($)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={v.benefitsForm.ytdRebates}
                      onChange={(e) => v.setBenefitsForm({ ...v.benefitsForm, ytdRebates: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Self-Promos Sent</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={v.benefitsForm.selfPromosSent}
                      onChange={(e) => v.setBenefitsForm({ ...v.benefitsForm, selfPromosSent: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Spec Samples Sent</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={v.benefitsForm.specSamplesSent}
                      onChange={(e) => v.setBenefitsForm({ ...v.benefitsForm, specSamplesSent: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => v.setIsEditBenefitsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={v.handleSaveBenefits}>
                  <Star className="h-4 w-4 mr-2" />
                  Save Benefits
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={v.isEditVendorOpen} onOpenChange={v.setIsEditVendorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Vendor - {v.selectedVendor?.name}
            </DialogTitle>
          </DialogHeader>
          <Form {...v.form}>
            <form onSubmit={v.form.handleSubmit(v.onUpdateSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Basic Information</h3>
                <FormField
                  control={v.form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter vendor name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={v.form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://vendor.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Addresses & Contacts:</strong> Manage addresses and contacts in the vendor detail view.
                  </p>
                </div>
              </div>

              {/* Business Terms */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Business Terms
                </h3>
                <FormField
                  control={v.form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Net 30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={v.form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this vendor"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Vendor Status */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Vendor Status
                </h3>
                <FormField
                  control={v.form.control}
                  name="isPreferred"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                      <div>
                        <FormLabel className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-600" />
                          Preferred Vendor
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Mark this vendor as preferred for priority treatment
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={v.form.control}
                  name="doNotOrder"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
                      <div>
                        <FormLabel className="flex items-center gap-2 text-red-700">
                          <Trash2 className="h-4 w-4" />
                          Do Not Order
                        </FormLabel>
                        <p className="text-sm text-red-600">
                          Block orders from this vendor - requires admin approval
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Show benefits fields if preferred */}
              {v.form.watch("isPreferred") && (
                <div className="space-y-4 pt-4 border-t bg-yellow-50/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Gift className="h-4 w-4 text-yellow-600" />
                    Preferred Benefits
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={v.form.control}
                      name="eqpPricing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>EQP Pricing (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 15"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={v.form.control}
                      name="rebatePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rebate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 5"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={v.form.control}
                      name="freeSetups"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <FormLabel>Free Setups</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={v.form.control}
                      name="freeSpecSamples"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <FormLabel>Free Spec Samples</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={v.form.control}
                      name="reducedSpecSamples"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <FormLabel>Reduced Spec Samples</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={v.form.control}
                      name="freeSelfPromo"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <FormLabel>Free Self-Promo</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    v.setIsEditVendorOpen(false);
                    v.form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={v.updateVendorMutation.isPending}>
                  {v.updateVendorMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={v.isAddContactOpen} onOpenChange={v.setIsAddContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Contact - {v.selectedVendor?.name}
            </DialogTitle>
          </DialogHeader>
          <Form {...v.contactForm}>
            <form onSubmit={v.contactForm.handleSubmit(v.handleAddContactSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={v.contactForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={v.contactForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={v.contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Sales Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Department</SelectItem>
                        {CONTACT_DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept.toLowerCase()}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <FormLabel>Primary Contact</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark as the main point of contact
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="receiveOrderEmails"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Receive Order Emails
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Include in vendor order communication emails
                      </p>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="noMarketing"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <FormLabel className="flex items-center gap-2">
                        <MailX className="h-4 w-4" />
                        No Marketing
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Opt out of marketing communications
                      </p>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    v.setIsAddContactOpen(false);
                    v.contactForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={v.createContactMutation.isPending}>
                  {v.createContactMutation.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={v.isEditContactOpen} onOpenChange={v.setIsEditContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Contact
            </DialogTitle>
          </DialogHeader>
          <Form {...v.contactForm}>
            <form onSubmit={v.contactForm.handleSubmit(v.handleEditContactSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={v.contactForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={v.contactForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={v.contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Sales Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Department</SelectItem>
                        {CONTACT_DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept.toLowerCase()}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <FormLabel>Primary Contact</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark as the main point of contact
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="receiveOrderEmails"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Receive Order Emails
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Include in vendor order communication emails
                      </p>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={v.contactForm.control}
                name="noMarketing"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <FormLabel className="flex items-center gap-2">
                        <MailX className="h-4 w-4" />
                        No Marketing
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Opt out of marketing communications
                      </p>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    v.setIsEditContactOpen(false);
                    v.setSelectedContact(null);
                    v.contactForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={v.updateContactMutation.isPending}>
                  {v.updateContactMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Vendor Confirmation Dialog */}
      <AlertDialog open={v.isDeleteVendorDialogOpen} onOpenChange={v.setIsDeleteVendorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Vendor?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{v.vendorToDelete?.name}</strong>?
              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                v.setVendorToDelete(null);
                v.setIsDeleteVendorDialogOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={v.handleConfirmDeleteVendor}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={v.deleteVendorMutation.isPending}
            >
              {v.deleteVendorMutation.isPending ? "Deleting..." : "Delete Vendor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Contact Confirmation Dialog */}
      <AlertDialog open={v.isDeleteContactDialogOpen} onOpenChange={v.setIsDeleteContactDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Contact?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{v.contactToDelete?.firstName} {v.contactToDelete?.lastName}</strong>?
              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                v.setContactToDelete(null);
                v.setIsDeleteContactDialogOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={v.handleConfirmDeleteContact}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={v.deleteContactMutation.isPending}
            >
              {v.deleteContactMutation.isPending ? "Deleting..." : "Delete Contact"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
