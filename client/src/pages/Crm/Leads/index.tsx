import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LEAD_SOURCES } from "@/constants/leadSources";
import { Search, Plus, User, BarChart3 } from "lucide-react";
import { CRMViewToggle } from "@/components/shared/CRMViewToggle";
import { useLeadsPage, type SortField } from "./hooks";
import { LEAD_STATUSES } from "./types";
import LeadFormDialog from "./components/LeadFormDialog";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { LeadCardView } from "./components/LeadCardView";
import { LeadListView } from "./components/LeadListView";

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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
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
                <SelectItem key={source} value={source}>{source}</SelectItem>
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
                    {["Lead", "Contact Info", "Source", "Value", "Status", "Actions"].map((h) => (
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
      ) : filteredLeads.length > 0 ? (
        <>
          {viewMode === "cards" && (
            <LeadCardView
              leads={filteredLeads}
              getLeadScore={getLeadScore}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteLead}
            />
          )}
          {viewMode === "list" && (
            <LeadListView
              leads={filteredLeads}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={(f) => handleSort(f as SortField)}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteLead}
            />
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No leads found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms or create a new lead."
                : "Get started by adding your first lead to track prospects and opportunities."}
            </p>
            <Button onClick={handleOpenCreate} className="bg-swag-primary hover:bg-swag-primary/90">
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
