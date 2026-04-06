import {
  Building,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Globe,
  DollarSign,
  Eye,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Grid,
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Company } from "@/services/companies";
import { usePaymentTerms } from "@/services/payment-terms";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useCompaniesPage } from "./hooks";
import CompanyFormDialog from "./components/CompanyFormDialog";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { SortableTableHead } from "../components/SortableTableHead";

// Industry options for the select dropdown
const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Non-Profit",
  "Government",
  "Entertainment",
  "Real Estate",
  "Construction",
  "Transportation",
  "Food & Beverage",
  "Professional Services",
  "Other",
];

// Engagement level colors
const ENGAGEMENT_COLORS = {
  high: "bg-green-100 text-green-800 hover:bg-green-200",
  medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  low: "bg-red-100 text-red-800 hover:bg-red-200",
  undefined: "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

function getSocialMediaIcon(platform: string) {
  switch (platform) {
    case "linkedin":
      return <Linkedin className="h-4 w-4" />;
    case "twitter":
      return <Twitter className="h-4 w-4" />;
    case "facebook":
      return <Facebook className="h-4 w-4" />;
    case "instagram":
      return <Instagram className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
}

export default function Companies() {
  const { data: paymentTermsOptions = [] } = usePaymentTerms();
  const { data: taxCodes } = useQuery<any[]>({
    queryKey: ["/api/tax-codes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

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
          {/* View Toggle */}
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
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
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
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>YTD Spend</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        ) : filteredCompanies.length > 0 ? (
          <>
            {/* Cards View */}
            {viewMode === "cards" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company: Company) => (
                  <Card
                    key={company.id}
                    onClick={() => handleNavigateToCompany(company.id)}
                    className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <UserAvatar name={company.name} size="md" />
                          <div>
                            <CardTitle className="text-lg text-swag-navy line-clamp-1">
                              {company.name}
                            </CardTitle>
                            {company.industry && (
                              <p className="text-sm text-muted-foreground">
                                {company.industry}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {company.engagementLevel && (
                            <Badge
                              className={
                                ENGAGEMENT_COLORS[
                                  company.engagementLevel as keyof typeof ENGAGEMENT_COLORS
                                ] || ENGAGEMENT_COLORS.undefined
                              }
                            >
                              {company.engagementLevel.charAt(0).toUpperCase() +
                                company.engagementLevel.slice(1)}
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavigateToCompany(company.id);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(company);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCompany(company);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {company.website && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {company.website.replace(/^https?:\/\//, "")}
                            </a>
                          </div>
                        )}
                        {company.industry && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs">
                              {company.industry}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Social Media Links */}
                      {company.socialMediaLinks &&
                        Object.values(company.socialMediaLinks).some(
                          (link) => link
                        ) && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                              Social:
                            </span>
                            <div className="flex gap-1">
                              {Object.entries(company.socialMediaLinks).map(
                                ([platform, url]) =>
                                  url && (
                                    <a
                                      key={platform}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-swag-orange transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {getSocialMediaIcon(platform)}
                                    </a>
                                  )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Company Stats */}
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">YTD:</span>
                          <span className="font-medium">
                            {formatCurrency(company.ytdSpend)}
                          </span>
                        </div>
                        {company.customerScore && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">
                              Score:
                            </span>
                            <span className="font-medium">
                              {company.customerScore}
                            </span>
                          </div>
                        )}
                      </div>

                      {company.notes && (
                        <div className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
                          {company.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead
                          label="Company"
                          field="name"
                          currentSortField={sortField}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                        <SortableTableHead
                          label="Industry"
                          field="industry"
                          currentSortField={sortField}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                        <TableHead>Contact</TableHead>
                        <SortableTableHead
                          label="YTD Spend"
                          field="ytdSpend"
                          currentSortField={sortField}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                        <SortableTableHead
                          label="Engagement"
                          field="engagementLevel"
                          currentSortField={sortField}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company: Company) => (
                        <TableRow
                          key={company.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleNavigateToCompany(company.id)}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <UserAvatar name={company.name} size="sm" />
                              <div>
                                <div className="font-medium text-swag-navy">
                                  {company.name}
                                </div>
                                {company.website && (
                                  <div className="text-sm text-muted-foreground">
                                    {company.website.replace(
                                      /^https?:\/\//,
                                      ""
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {company.industry && (
                              <Badge variant="secondary" className="text-xs">
                                {company.industry}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {company.website && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                  <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-swag-orange hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Website
                                  </a>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              {formatCurrency(company.ytdSpend)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {company.engagementLevel && (
                              <Badge
                                className={
                                  ENGAGEMENT_COLORS[
                                    company.engagementLevel as keyof typeof ENGAGEMENT_COLORS
                                  ] || ENGAGEMENT_COLORS.undefined
                                }
                              >
                                {company.engagementLevel
                                  .charAt(0)
                                  .toUpperCase() +
                                  company.engagementLevel.slice(1)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`company-actions-${company.id}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigateToCompany(company.id);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(company);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCompany(company);
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
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              {searchQuery || filterIndustry !== "all"
                ? "No companies found"
                : "No companies yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || filterIndustry !== "all"
                ? "Try adjusting your search criteria or filters"
                : "Get started by adding your first company"}
            </p>
            {!searchQuery && filterIndustry === "all" && (
              <Button
                onClick={handleOpenCreate}
                className="bg-swag-orange hover:bg-swag-orange/90"
              >
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
        taxCodes={taxCodes}
        paymentTermsOptions={paymentTermsOptions}
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
