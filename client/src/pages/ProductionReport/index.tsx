import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PO_STATUSES,
  PROOF_STATUSES,
  getPOStatusBadgeClass
} from "@/constants/poStages";
import { getStageBadgeClass } from "@/constants/productionStages";
import { getActionTypeBadgeClass } from "@/hooks/useNextActionTypes";
import { getDateStatus } from "@/lib/dateUtils";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Factory,
  FileText,
  Loader2,
  Search,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";
import PODetailPanel from "./components/PODetailPanel";
import ProductionAlerts from "./components/ProductionAlerts";
import { useProductionReport } from "./hooks";

// Sort icon render helper
function SortIcon({ column, sortBy, sortOrder }: { column: string; sortBy: string; sortOrder: "asc" | "desc" }) {
  if (sortBy !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
  return sortOrder === "asc"
    ? <ArrowUp className="h-3 w-3 ml-1" />
    : <ArrowDown className="h-3 w-3 ml-1" />;
}

export default function ProductionReport() {
  const {
    searchQuery, setSearchQuery,
    filterStage, setFilterStage,
    filterStatus, setFilterStatus,
    filterVendor, setFilterVendor,
    filterAssignee, setFilterAssignee,
    filterProofStatus, setFilterProofStatus,
    filterDateType, setFilterDateType,
    filterDateFrom, setFilterDateFrom,
    filterDateTo, setFilterDateTo,
    alertFilter, setAlertFilter,
    sortBy, sortOrder, handleSort,
    page, setPage, pagination,
    selectedPOId, panelOpen, setPanelOpen,
    rows, isLoading,
    vendors, users, productionStages, actionTypes,
    handleAlertClick, clearFilters, hasActiveFilters,
    applyDatePreset, getAggregateProofStatus, handleRowClick,
    setLocation,
  } = useProductionReport();

  return (
    <div className="p-6 space-y-6 w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Production Report</h1>
            <p className="text-sm text-muted-foreground">
              Track purchase orders across production stages
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {pagination.total} PO{pagination.total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Alert Tiles */}
      <ProductionAlerts onAlertClick={handleAlertClick} />

      {/* Active alert filter indicator */}
      {alertFilter && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            Filtered by alert: <strong>{alertFilter.replace(/_/g, " ")}</strong>
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 ml-auto"
            onClick={() => setAlertFilter("")}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Search */}
            <div className="relative col-span-2 md:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search PO#, order, vendor..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Stage filter */}
            <Select value={filterStage} onValueChange={(v) => { setFilterStage(v); setPage(1); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="open" className="font-medium text-blue-700">Open POs</SelectItem>
                {productionStages.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(PO_STATUSES).map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Vendor filter */}
            <Select value={filterVendor} onValueChange={(v) => { setFilterVendor(v); setPage(1); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Assignee filter */}
            <Select value={filterAssignee} onValueChange={(v) => { setFilterAssignee(v); setPage(1); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName || `${u.firstName} ${u.lastName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Proof status filter */}
            <Select value={filterProofStatus} onValueChange={(v) => { setFilterProofStatus(v); setPage(1); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Proof Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Proof Statuses</SelectItem>
                {Object.values(PROOF_STATUSES).map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {/* Date range row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <Select
              value={filterDateType}
              onValueChange={(v) => setFilterDateType(v as "inHands" | "nextAction")}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inHands">In-Hands Date</SelectItem>
                <SelectItem value="nextAction">Next Action</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="h-8 w-36 text-xs"
              placeholder="From"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
              className="h-8 w-36 text-xs"
              placeholder="To"
            />
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => applyDatePreset("overdue")}>
                Overdue
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => applyDatePreset("thisWeek")}>
                This Week
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => applyDatePreset("thisMonth")}>
                This Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading purchase orders...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No purchase orders found</p>
              <p className="text-sm mt-1">
                {hasActiveFilters ? "Try adjusting your filters." : "POs will appear here once generated from sales orders."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b-2">
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs py-3 pl-4"
                      onClick={() => handleSort("document_number")}
                    >
                      <span className="flex items-center">PO / Order <SortIcon column="document_number" sortBy={sortBy} sortOrder={sortOrder} /></span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs py-3"
                      onClick={() => handleSort("vendor_name")}
                    >
                      <span className="flex items-center">Vendor / Company <SortIcon column="vendor_name" sortBy={sortBy} sortOrder={sortOrder} /></span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs py-3"
                      onClick={() => handleSort("csr_user_id")}
                    >
                      <span className="flex items-center">Assigned <SortIcon column="csr_user_id" sortBy={sortBy} sortOrder={sortOrder} /></span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs py-3"
                      onClick={() => handleSort("po_stage")}
                    >
                      <span className="flex items-center">Stage<SortIcon column="po_stage" sortBy={sortBy} sortOrder={sortOrder} /></span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs py-3"
                      onClick={() => handleSort("status")}
                    >
                      <span className="flex items-center">Status <SortIcon column="status" sortBy={sortBy} sortOrder={sortOrder} /></span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs py-3"
                      onClick={() => handleSort("next_action_type")}
                    >
                      <span className="flex items-center">Next Action<SortIcon column="next_action_type" sortBy={sortBy} sortOrder={sortOrder} /></span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs py-3"
                      onClick={() => handleSort("next_action_date")}
                    >
                      <span className="flex items-center">Next Action Date<SortIcon column="next_action_date" sortBy={sortBy} sortOrder={sortOrder} /></span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs py-3"
                      onClick={() => handleSort("in_hands_date")}
                    >
                      <span className="flex items-center">In-Hands <SortIcon column="in_hands_date" sortBy={sortBy} sortOrder={sortOrder} /></span>
                    </TableHead>
                    <TableHead className="text-xs py-3">Shipping</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs py-3 text-right pr-4"
                      onClick={() => handleSort("total_cost")}
                    >
                      <span className="flex items-center justify-end">Total <SortIcon column="total_cost" sortBy={sortBy} sortOrder={sortOrder} /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const aggProofStatus = getAggregateProofStatus(row.proofItems);
                    const inHandsStatus = row.inHandsDate ? getDateStatus(row.inHandsDate) : null;
                    const latestShipment = row.shipments?.[0];

                    return (
                      <TableRow
                        key={row.documentId}
                        className="cursor-pointer hover:bg-muted/40 transition-colors group"
                        onClick={() => handleRowClick(row)}
                      >
                        {/* PO + Order (stacked) */}
                        <TableCell className="py-3.5 pl-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{row.documentNumber}</span>
                              {(row.isFirm || row.isRush) && (
                                <div className="flex gap-1">
                                  {row.isFirm && (
                                    <Badge className="bg-blue-100 text-blue-800 border-0 text-[10px] px-1.5 py-0 font-semibold">
                                      FIRM
                                    </Badge>
                                  )}
                                  {row.isRush && (
                                    <Badge className="bg-red-100 text-red-800 border-0 text-[10px] px-1.5 py-0 font-semibold">
                                      RUSH
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocation(`/projects/${row.orderId}`);
                                  }}
                                >
                                  #{row.orderNumber}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Open project</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>

                        {/* Vendor + Company (stacked) */}
                        <TableCell className="py-3.5">
                          <div className="space-y-0.5 max-w-[200px]">
                            <div className="text-sm font-medium truncate">{row.vendorName || "\u2014"}</div>
                            <div className="text-xs text-muted-foreground truncate">{row.companyName || ""}</div>
                          </div>
                        </TableCell>

                        {/* Assigned (CSR) */}
                        <TableCell className="py-3.5">
                          {row.csrUserName ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <UserAvatar
                                    name={row.csrUserName}
                                    imageUrl={row.csrUserImage || undefined}
                                    size="sm"
                                  />
                                  <span className="text-sm truncate max-w-[80px] hidden lg:inline">
                                    {row.csrUserName.split(" ")[0]}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{row.csrUserName}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground">{"\u2014"}</span>
                          )}
                        </TableCell>

                        {/* Stage + Status (stacked) */}
                        <TableCell className="py-3.5">
                          <Badge className={`text-xs w-fit ${getStageBadgeClass(productionStages, row.poStage)}`}>
                            {productionStages.find((s: any) => s.id === row.poStage)?.name || row.poStage}
                          </Badge>
                        </TableCell>

                        {/* Proof Status */}
                        <TableCell className="py-3.5">
                          <Badge className={`text-[10px] w-fit ${getPOStatusBadgeClass(row.poStatus)}`}>
                            {PO_STATUSES[row.poStatus]?.label || row.poStatus}
                          </Badge>
                        </TableCell>

                        {/* Next Action */}
                        <TableCell className="py-3.5">
                          {row.nextActionType && row.nextActionType !== "no_action" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="space-y-1">
                                  <Badge className={`text-xs ${getActionTypeBadgeClass(actionTypes, row.nextActionType)}`}>
                                    {actionTypes.find(t => t.id === row.nextActionType)?.name || row.nextActionType}
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px]">{row.nextActionNotes || "No notes"}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground">{"\u2014"}</span>
                          )}
                        </TableCell>
                        {/* Next Action Date*/}
                        <TableCell className="py-3.5">
                          {row.nextActionType && row.nextActionType !== "no_action" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="space-y-1">
                                  {row.nextActionDate && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(row.nextActionDate), "MMM d")}
                                      </span>
                                      {(() => {
                                        const s = getDateStatus(row.nextActionDate);
                                        return s && s.urgency !== "normal" ? (
                                          <Badge className={`text-[10px] px-1.5 py-0 ${s.color} border-0`}>{s.label}</Badge>
                                        ) : null;
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px]">{row.nextActionNotes || "No notes"}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground">{"\u2014"}</span>
                          )}
                        </TableCell>

                        {/* In-Hands Date */}
                        <TableCell className="py-3.5">
                          {row.inHandsDate ? (
                            <div className="space-y-1">
                              <span className="text-sm font-medium">
                                {format(new Date(row.inHandsDate), "MMM d")}
                              </span>
                              {inHandsStatus && inHandsStatus.urgency !== "normal" && (
                                <div>
                                  <Badge className={`text-[10px] px-1.5 py-0 ${inHandsStatus.color} border-0`}>
                                    {inHandsStatus.label}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{"\u2014"}</span>
                          )}
                        </TableCell>

                        {/* Shipping */}
                        <TableCell className="py-3.5">
                          {latestShipment ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm capitalize">{latestShipment.status}</span>
                              </div>
                              {latestShipment.trackingNumber && (
                                <span className="text-[11px] font-mono text-muted-foreground block">
                                  {latestShipment.trackingNumber.slice(0, 12)}{latestShipment.trackingNumber.length > 12 ? "..." : ""}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{"\u2014"}</span>
                          )}
                        </TableCell>

                        {/* Total */}
                        <TableCell className="text-right py-3.5 pr-4">
                          <span className="text-sm font-semibold">
                            {row.totalCost > 0 ? `$${Number(row.totalCost).toFixed(2)}` : "\u2014"}
                          </span>
                        </TableCell>

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-xs text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PO Detail Slide-out Panel */}
      <PODetailPanel
        documentId={selectedPOId}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </div>
  );
}
