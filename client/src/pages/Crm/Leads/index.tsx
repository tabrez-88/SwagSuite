import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_SOURCES } from "@/constants/leadSources";
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
  Search,
  Plus,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Trash2,
  Edit,
  MoreHorizontal,
  BarChart3,
} from "lucide-react";
import { CRMViewToggle } from "@/components/shared/CRMViewToggle";
import type { Lead } from "@/services/leads";
import { useLeadsPage } from "./hooks";
import { LEAD_STATUSES, STATUS_COLORS } from "./types";
import LeadFormDialog from "./components/LeadFormDialog";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { SortableTableHead } from "../components/SortableTableHead";

export default function Leads() {
  const {
    searchQuery,
    setSearchQuery,
    isFormDialogOpen,
    setIsFormDialogOpen,
    selectedLead,
    filterStatus,
    setFilterStatus,
    filterSource,
    setFilterSource,
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    leadToDelete,
    sortField,
    sortDirection,
    handleSort,
    isLoading,
    filteredLeads,
    leadSourceReport,
    createLeadMutation,
    updateLeadMutation,
    deleteLeadMutation,
    handleOpenCreate,
    handleOpenEdit,
    handleFormSubmit,
    handleDeleteLead,
    confirmDeleteLead,
    cancelDeleteLead,
    getLeadScore,
  } = useLeadsPage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-swag-navy">Leads</h1>
          <p className="text-muted-foreground">
            Track and manage your sales leads and prospects
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-swag-primary hover:bg-swag-primary/90">
          <Plus className="mr-2" size={16} />
          Add Lead
        </Button>
      </div>

      {/* Lead Sources Summary */}
      {leadSourceReport.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Leads by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {leadSourceReport.map((item) => {
                const isActive = filterSource === item.source;
                return (
                  <button
                    key={item.source}
                    type="button"
                    onClick={() => setFilterSource(isActive ? "all" : item.source)}
                    className={`flex flex-col border shadow-sm items-center p-2 rounded-lg text-center transition-colors ${
                      isActive ? "bg-swag-primary/10 border-swag-primary" : "bg-muted/50 hover:bg-muted"
                    }`}
                    data-testid={`lead-source-tile-${item.source}`}
                  >
                    <span className="text-lg font-bold text-swag-navy">{item.total}</span>
                    <span className="text-xs text-muted-foreground truncate w-full">{item.source}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {item.leads} leads · {item.contacts} contacts
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Search leads by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <CRMViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {LEAD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {LEAD_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="whitespace-nowrap">
            {filteredLeads.length} leads
          </Badge>
        </div>
      </div>

      {/* Leads Display */}
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
                    <TableHead>Lead</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Value</TableHead>
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
      ) : filteredLeads.length > 0 ? (
        <>
          {/* Cards View */}
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLeads.map((lead: Lead) => {
                const leadScore = getLeadScore(lead);
                return (
                  <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <UserAvatar
                            name={`${lead.firstName} ${lead.lastName}`}
                            size="md"
                          />
                          <div>
                            <CardTitle className="text-lg text-swag-navy">
                              {lead.firstName} {lead.lastName}
                            </CardTitle>
                            {lead.company && (
                              <p className="text-sm text-muted-foreground">
                                {lead.company}
                              </p>
                            )}
                            {lead.title && (
                              <p className="text-xs text-muted-foreground">
                                {lead.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS]
                            }
                          >
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {lead.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{lead.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{lead.source}</Badge>
                        </div>
                      </div>

                      {lead.estimatedValue && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground">
                            ${lead.estimatedValue.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {lead.nextFollowUpDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span className="text-muted-foreground">
                            Follow-up: {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(lead)}
                        >
                          <Edit className="mr-1" size={12} />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLead(lead)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead label="Lead" field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} />
                      <TableHead>Contact Info</TableHead>
                      <SortableTableHead label="Source" field="source" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Value" field="estimatedValue" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Status" field="status" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Follow-up" field="nextFollowUpDate" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} />
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead: Lead) => (
                      <TableRow
                        key={lead.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        data-testid={`lead-row-${lead.id}`}
                        onClick={() => handleOpenEdit(lead)}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <UserAvatar
                              name={`${lead.firstName} ${lead.lastName}`}
                              size="sm"
                            />
                            <div>
                              <div className="font-medium text-swag-navy">
                                {lead.firstName} {lead.lastName}
                              </div>
                              {lead.company && (
                                <div className="text-sm text-muted-foreground">
                                  {lead.company}
                                </div>
                              )}
                              {lead.title && (
                                <div className="text-xs text-muted-foreground">
                                  {lead.title}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {lead.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate">{lead.email}</span>
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {lead.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lead.estimatedValue ? (
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              ${lead.estimatedValue.toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS]
                            }
                          >
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lead.nextFollowUpDate ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{new Date(lead.nextFollowUpDate).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`lead-actions-${lead.id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(lead)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteLead(lead)}
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
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No leads found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms or create a new lead."
                : "Get started by adding your first lead to track prospects and opportunities."}
            </p>
            <Button
              onClick={handleOpenCreate}
              className="bg-swag-primary hover:bg-swag-primary/90"
            >
              <Plus className="mr-2" size={16} />
              Add Lead
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog (create/edit) */}
      <LeadFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        lead={selectedLead}
        onSubmit={handleFormSubmit}
        isPending={selectedLead ? updateLeadMutation.isPending : createLeadMutation.isPending}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Lead?"
        description={<strong>{leadToDelete?.firstName} {leadToDelete?.lastName}</strong>}
        onConfirm={confirmDeleteLead}
        onCancel={cancelDeleteLead}
        isPending={deleteLeadMutation.isPending}
        confirmLabel="Delete Lead"
      />
    </div>
  );
}
