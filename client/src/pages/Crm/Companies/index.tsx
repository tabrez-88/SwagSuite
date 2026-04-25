import { Building, Plus, Search, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { INDUSTRY_OPTIONS } from "./CompanyDetail/types";
import { useCompaniesPage, type SortField } from "./hooks";
import CompanyFormDialog from "./components/CompanyFormDialog";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { CompanyCardView } from "./components/CompanyCardView";
import { CompanyListView } from "./components/CompanyListView";

export default function Companies() {
  const {
    searchQuery,
    setSearchQuery,
    isFormDialogOpen,
    setIsFormDialogOpen,
    selectedCompany,
    filterIndustry,
    setFilterIndustry,
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    companyToDelete,
    sortField,
    sortDirection,
    handleSort,
    filteredCompanies,
    isLoading,
    createCompanyMutation,
    updateCompanyMutation,
    deleteCompanyMutation,
    handleOpenCreate,
    handleOpenEdit,
    handleFormSubmit,
    handleDeleteCompany,
    handleConfirmDelete,
    handleCancelDelete,
    handleNavigateToCompany,
    editCustomFields,
    setEditCustomFields,
    formatCurrency,
  } = useCompaniesPage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-swag-navy">Companies</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and company records
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-swag-primary hover:bg-swag-primary/90">
          <Plus className="mr-2" size={16} />
          Add Company
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="rounded-r-none"
              data-testid="view-cards"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
              data-testid="view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Select value={filterIndustry} onValueChange={setFilterIndustry}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {INDUSTRY_OPTIONS.map((industry) => (
                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Companies Display */}
      <div className="space-y-4">
        {isLoading ? (
          viewMode === "cards" ? (
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
                      {["Company", "Industry", "Contact", "YTD Spend", "Engagement", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        ) : filteredCompanies.length > 0 ? (
          <>
            {viewMode === "cards" && (
              <CompanyCardView
                companies={filteredCompanies}
                formatCurrency={formatCurrency}
                onNavigate={handleNavigateToCompany}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteCompany}
              />
            )}
            {viewMode === "list" && (
              <CompanyListView
                companies={filteredCompanies}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={(f) => handleSort(f as SortField)}
                formatCurrency={formatCurrency}
                onNavigate={handleNavigateToCompany}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteCompany}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              {searchQuery || filterIndustry !== "all" ? "No companies found" : "No companies yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || filterIndustry !== "all"
                ? "Try adjusting your search criteria or filters"
                : "Get started by adding your first company"}
            </p>
            {!searchQuery && filterIndustry === "all" && (
              <Button onClick={handleOpenCreate} className="bg-swag-orange hover:bg-swag-orange/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CompanyFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        company={selectedCompany}
        onSubmit={handleFormSubmit}
        isPending={selectedCompany ? updateCompanyMutation.isPending : createCompanyMutation.isPending}
        customFields={editCustomFields}
        onCustomFieldsChange={setEditCustomFields}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Company?"
        description={<strong>{companyToDelete?.name}</strong>}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isPending={deleteCompanyMutation.isPending}
        confirmLabel="Delete Company"
      />
    </div>
  );
}
