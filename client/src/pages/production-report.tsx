import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Factory,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Truck,
  Palette,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getDateStatus } from "@/lib/dateUtils";
import {
  PO_STAGES,
  PO_STAGES_ORDERED,
  PO_OPEN_STAGES,
  PO_STATUSES,
  PROOF_STATUSES,
  PROOF_ACTIVE_STATUSES,
  getPOStageBadgeClass,
  getPOStatusBadgeClass,
  getProofStatusBadgeClass,
} from "@/lib/poStages";
import ProductionAlerts from "@/components/dashboard/ProductionAlerts";
import PODetailPanel from "@/components/production/PODetailPanel";

interface POReportRow {
  documentId: string;
  documentNumber: string;
  orderId: string;
  vendorId: string;
  vendorName: string;
  fileUrl: string;
  documentStatus: string;
  sentAt: string;
  metadata: any;
  createdAt: string;
  orderNumber: string;
  inHandsDate: string;
  supplierInHandsDate: string;
  eventDate: string;
  nextActionDate: string;
  nextActionNotes: string;
  isFirm: boolean;
  isRush: boolean;
  salesOrderStatus: string;
  assignedUserId: string;
  csrUserId: string;
  companyName: string;
  companyId: string;
  assignedUserName: string;
  csrUserName: string;
  // Enriched
  poStage: string;
  poStatus: string;
  totalCost: number;
  itemCount: number;
  proofItems: Array<{ status: string; name: string }>;
  shipments: Array<{ carrier: string; trackingNumber: string; status: string; shipDate: string }>;
}

interface POReportResponse {
  data: POReportRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ProductionReport() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterProofStatus, setFilterProofStatus] = useState("all");
  const [filterDateType, setFilterDateType] = useState<"inHands" | "nextAction">("inHands");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [alertFilter, setAlertFilter] = useState("");

  // Sorting & pagination
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Slide-out panel
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    if (searchQuery) params.set("search", searchQuery);
    if (filterStage !== "all") params.set("stage", filterStage);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterVendor !== "all") params.set("vendorId", filterVendor);
    if (filterAssignee !== "all") params.set("assigneeId", filterAssignee);
    if (filterProofStatus !== "all") params.set("proofStatus", filterProofStatus);
    if (filterDateFrom) params.set("dateFrom", filterDateFrom);
    if (filterDateTo) params.set("dateTo", filterDateTo);
    if (filterDateType) params.set("dateType", filterDateType);
    if (alertFilter) params.set("alertFilter", alertFilter);
    return params.toString();
  }, [page, limit, sortBy, sortOrder, searchQuery, filterStage, filterStatus, filterVendor, filterAssignee, filterProofStatus, filterDateFrom, filterDateTo, filterDateType, alertFilter]);

  // Main data query
  const { data: reportData, isLoading } = useQuery<POReportResponse>({
    queryKey: ["/api/production/po-report", queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/production/po-report?${queryParams}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch PO report");
      return response.json();
    },
  });

  // Fetch vendors and users for filter dropdowns
  const { data: vendors = [] } = useQuery<any[]>({ queryKey: ["/api/suppliers"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users/team"] });

  const rows = reportData?.data || [];
  const pagination = reportData?.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 };

  // Handle sort column click
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Handle alert tile click
  const handleAlertClick = (filter: string) => {
    setAlertFilter(filter);
    setFilterStage("all");
    setFilterStatus("all");
    setPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterStage("all");
    setFilterStatus("all");
    setFilterVendor("all");
    setFilterAssignee("all");
    setFilterProofStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setAlertFilter("");
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery || filterStage !== "all" || filterStatus !== "all" ||
    filterVendor !== "all" || filterAssignee !== "all" ||
    filterProofStatus !== "all" || filterDateFrom || filterDateTo || alertFilter;

  // Quick date presets
  const applyDatePreset = (preset: "overdue" | "thisWeek" | "thisMonth") => {
    const now = new Date();
    setFilterDateType("inHands");
    if (preset === "overdue") {
      setFilterDateFrom("");
      setFilterDateTo(format(addDays(now, -1), "yyyy-MM-dd"));
    } else if (preset === "thisWeek") {
      setFilterDateFrom(format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setFilterDateTo(format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
    } else if (preset === "thisMonth") {
      setFilterDateFrom(format(startOfMonth(now), "yyyy-MM-dd"));
      setFilterDateTo(format(endOfMonth(now), "yyyy-MM-dd"));
    }
    setPage(1);
  };

  // Get aggregate proof status for a PO row
  const getAggregateProofStatus = (proofItems: Array<{ status: string }>) => {
    if (!proofItems || proofItems.length === 0) return null;
    const statuses = proofItems.map((p) => p.status);
    if (statuses.includes("change_requested")) return "change_requested";
    if (statuses.includes("pending_approval")) return "pending_approval";
    if (statuses.includes("awaiting_proof")) return "awaiting_proof";
    if (statuses.includes("proof_received")) return "proof_received";
    if (statuses.every((s) => s === "proofing_complete" || s === "approved")) return "proofing_complete";
    if (statuses.every((s) => s === "pending")) return "pending";
    return statuses[0];
  };

  // Sort icon
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortOrder === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const handleRowClick = (row: POReportRow) => {
    setSelectedPOId(row.documentId);
    setPanelOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
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
                {PO_STAGES_ORDERED.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
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
                  <TableRow className="bg-muted/30">
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs"
                      onClick={() => handleSort("document_number")}
                    >
                      <span className="flex items-center">PO# <SortIcon column="document_number" /></span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs"
                      onClick={() => handleSort("order_number")}
                    >
                      <span className="flex items-center">Order <SortIcon column="order_number" /></span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs"
                      onClick={() => handleSort("vendor_name")}
                    >
                      <span className="flex items-center">Vendor <SortIcon column="vendor_name" /></span>
                    </TableHead>
                    <TableHead className="text-xs">Company</TableHead>
                    <TableHead className="text-xs">Stage</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Proof</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-xs"
                      onClick={() => handleSort("in_hands_date")}
                    >
                      <span className="flex items-center">In-Hands <SortIcon column="in_hands_date" /></span>
                    </TableHead>
                    <TableHead className="text-xs">Shipping</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs">Flags</TableHead>
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
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => handleRowClick(row)}
                      >
                        {/* PO Number */}
                        <TableCell className="font-mono text-sm font-medium">
                          {row.documentNumber}
                        </TableCell>

                        {/* Order Number */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="text-sm text-primary hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/project/${row.orderId}`);
                                }}
                              >
                                #{row.orderNumber}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Open project</TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Vendor */}
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {row.vendorName || "—"}
                        </TableCell>

                        {/* Company */}
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {row.companyName || "—"}
                        </TableCell>

                        {/* Stage */}
                        <TableCell>
                          <Badge className={`text-xs ${getPOStageBadgeClass(row.poStage)}`}>
                            {PO_STAGES[row.poStage]?.label || row.poStage}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={`text-xs ${getPOStatusBadgeClass(row.poStatus)}`}>
                            {PO_STATUSES[row.poStatus]?.label || row.poStatus}
                          </Badge>
                        </TableCell>

                        {/* Proof Status */}
                        <TableCell>
                          {aggProofStatus ? (
                            <Badge className={`text-xs ${getProofStatusBadgeClass(aggProofStatus)}`}>
                              {PROOF_STATUSES[aggProofStatus]?.label || aggProofStatus}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* In-Hands Date */}
                        <TableCell>
                          {row.inHandsDate ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">
                                {format(new Date(row.inHandsDate), "MMM d")}
                              </span>
                              {inHandsStatus && inHandsStatus.urgency !== "normal" && (
                                <Badge className={`text-[10px] px-1 py-0 ${inHandsStatus.color} border-0`}>
                                  {inHandsStatus.label}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Shipping */}
                        <TableCell>
                          {latestShipment ? (
                            <div className="flex items-center gap-1">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{latestShipment.status}</span>
                              {latestShipment.trackingNumber && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {latestShipment.trackingNumber.slice(0, 8)}...
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Total */}
                        <TableCell className="text-right text-sm font-medium">
                          {row.totalCost > 0 ? `$${Number(row.totalCost).toFixed(2)}` : "—"}
                        </TableCell>

                        {/* Flags */}
                        <TableCell>
                          <div className="flex gap-1">
                            {row.isFirm && (
                              <Badge className="bg-blue-100 text-blue-800 border-0 text-[10px] px-1 py-0">
                                FIRM
                              </Badge>
                            )}
                            {row.isRush && (
                              <Badge className="bg-red-100 text-red-800 border-0 text-[10px] px-1 py-0">
                                RUSH
                              </Badge>
                            )}
                          </div>
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
