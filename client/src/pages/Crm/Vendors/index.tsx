import { CRMViewToggle } from "@/components/shared/CRMViewToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Search, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { useVendors } from "./hooks";
import { VendorFormDialog } from "./components/VendorFormDialog";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { VendorCardView } from "./components/VendorCardView";
import { VendorListView } from "./components/VendorListView";
import { PreferredVendorCardView } from "./components/PreferredVendorCardView";
import { PreferredVendorListView } from "./components/PreferredVendorListView";

function CardSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
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
  );
}

function TableSkeleton({ headers, count }: { headers: string[]; count: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: count }).map((_, i) => (
              <TableRow key={i}>
                {headers.map((h) => (
                  <TableCell key={h}><Skeleton className="h-4 w-24" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

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
          {v.isLoading ? (
            v.viewMode === "cards"
              ? <CardSkeleton count={6} />
              : <TableSkeleton headers={["Vendor", "Contact Info", "Terms", "Products", "YTD Spend", "Status", "Actions"]} count={6} />
          ) : v.filteredVendors.length > 0 ? (
            <>
              {v.viewMode === "cards" && (
                <VendorCardView
                  vendors={v.filteredVendors}
                  onViewDetail={v.handleOpenVendorDetail}
                  onTogglePreferred={v.handleTogglePreferred}
                  onDelete={v.handleDeleteVendor}
                  isTogglePending={v.togglePreferredMutation.isPending}
                />
              )}
              {v.viewMode === "list" && (
                <VendorListView
                  vendors={v.filteredVendors}
                  sortField={v.sortField}
                  sortDirection={v.sortDirection}
                  onSort={v.handleSort}
                  onViewDetail={v.handleOpenVendorDetail}
                  onEdit={v.handleOpenEdit}
                  onDelete={v.handleDeleteVendor}
                />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No vendors found</h3>
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
          {v.isLoading ? (
            v.viewMode === "cards"
              ? <CardSkeleton count={3} />
              : <TableSkeleton headers={["Preferred Vendor", "Benefits", "YTD Savings", "YTD Rebates", "Promos Sent", "Actions"]} count={3} />
          ) : v.preferredVendors.length > 0 ? (
            <>
              {v.viewMode === "cards" && (
                <PreferredVendorCardView
                  vendors={v.preferredVendors}
                  onViewDetail={v.handleOpenVendorDetail}
                />
              )}
              {v.viewMode === "list" && (
                <PreferredVendorListView
                  vendors={v.preferredVendors}
                  onViewDetail={v.handleOpenVendorDetail}
                  onEdit={v.handleOpenEdit}
                />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No preferred vendors found</h3>
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
