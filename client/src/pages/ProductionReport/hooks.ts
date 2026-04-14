import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useLocation } from "@/lib/wouter-compat";
import { useAuth } from "@/hooks/useAuth";
import { useProductionStages } from "@/hooks/useProductionStages";
import { useNextActionTypes } from "@/hooks/useNextActionTypes";
import { usePoReport } from "@/services/production";
import { useSuppliers } from "@/services/suppliers";
import { useTeamMembers } from "@/services/users";
import type { POReportRow, POReportResponse } from "./types";

export function useProductionReport() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();

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
    if (filterAssignee !== "all") params.set("csrUserId", filterAssignee);
    if (filterProofStatus !== "all") params.set("proofStatus", filterProofStatus);
    if (filterDateFrom) params.set("dateFrom", filterDateFrom);
    if (filterDateTo) params.set("dateTo", filterDateTo);
    if (filterDateType) params.set("dateType", filterDateType);
    if (alertFilter) params.set("alertFilter", alertFilter);
    return params.toString();
  }, [page, limit, sortBy, sortOrder, searchQuery, filterStage, filterStatus, filterVendor, filterAssignee, filterProofStatus, filterDateFrom, filterDateTo, filterDateType, alertFilter]);

  // Main data query
  const { data: reportData, isLoading } = usePoReport<POReportResponse>(queryParams);

  // Fetch vendors, users, and production stages for filter dropdowns
  const { data: vendors = [] } = useSuppliers() as unknown as { data: any[] };
  const { data: users = [] } = useTeamMembers() as unknown as { data: any[] };
  const { stages: productionStages } = useProductionStages();
  const { actionTypes } = useNextActionTypes();

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

  const hasActiveFilters = !!(
    searchQuery || filterStage !== "all" || filterStatus !== "all" ||
    filterVendor !== "all" || filterAssignee !== "all" ||
    filterProofStatus !== "all" ||
    filterDateFrom || filterDateTo || alertFilter
  );

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

  const handleRowClick = (row: POReportRow) => {
    setSelectedPOId(row.documentId);
    setPanelOpen(true);
  };

  return {
    // Filter state + setters
    searchQuery,
    setSearchQuery,
    filterStage,
    setFilterStage,
    filterStatus,
    setFilterStatus,
    filterVendor,
    setFilterVendor,
    filterAssignee,
    setFilterAssignee,
    filterProofStatus,
    setFilterProofStatus,
    filterDateType,
    setFilterDateType,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    alertFilter,
    setAlertFilter,

    // Sorting
    sortBy,
    sortOrder,
    handleSort,

    // Pagination
    page,
    setPage,
    pagination,

    // Panel
    selectedPOId,
    panelOpen,
    setPanelOpen,

    // Data
    rows,
    isLoading,

    // Dropdown options
    vendors,
    users,
    productionStages,
    actionTypes,

    // Handlers
    handleAlertClick,
    clearFilters,
    hasActiveFilters,
    applyDatePreset,
    getAggregateProofStatus,
    handleRowClick,

    // Navigation
    setLocation,
  };
}
