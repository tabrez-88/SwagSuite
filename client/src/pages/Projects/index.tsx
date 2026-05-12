import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useLocation } from "@/lib/wouter-compat";
import { useAuth } from "@/hooks/useAuth";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isBefore, startOfDay } from "date-fns";

import NewProjectWizard from "@/components/modals/NewProjectWizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order } from "@shared/schema";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Kanban,
  List,
  PlusCircle,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { columns, OrderWithRelations } from "./components/columns";
import { DataTable } from "./components/data-table";
import { KanbanBoard } from "./components/kanban-board";
import { determineBusinessStage } from "@/constants/businessStages";

const SO_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "pending_client_approval", label: "Pending Approval" },
  { value: "client_change_requested", label: "Change Requested" },
  { value: "client_approved", label: "Client Approved" },
  { value: "in_production", label: "In Production" },
  { value: "shipped", label: "Shipped" },
  { value: "ready_to_invoice", label: "Ready to Invoice" },
  { value: "invoiced", label: "Invoiced" },
  { value: "closed", label: "Closed" },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const currentUserName = user ? `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() : "";
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/projects"],
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });

  const getCompanyName = (companyId: string) => {
    const company = companies?.find((c: any) => c.id === companyId);
    return company?.name || "Unknown Company";
  };

  const ordersWithRelations: OrderWithRelations[] = orders.map((order) => {
    const determined = determineBusinessStage(order);
    return {
      ...order,
      companyName: getCompanyName(order.companyId!),
      assignedUserName: (order as any).assignedUserName || undefined,
      _determinedStage: determined,
    };
  });

  const hasOrders = ordersWithRelations.some((o) => o.assignedUserName === currentUserName);

  const {
    salesRepFilter, setSalesRepFilter,
    activeSOFilter, setActiveSOFilter,
    activeStageFilter, setActiveStageFilter,
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    companyFilter, setCompanyFilter,
    soStatusFilter, setSOStatusFilter,
    dateType, setDateType,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    resetToDefaults,
    clearAllFilters,
    hasActiveFilters,
  } = useProjectFilters({
    userId: (user as any)?.id || null,
    userRole: (user as any)?.role || "user",
    currentUserName,
    hasOrders,
    isDataLoaded: !isLoading,
  });

  const toggleSOFilter = (val: string) => {
    setActiveStageFilter(null);
    setActiveSOFilter(activeSOFilter === val ? null : val);
  };
  const toggleStageFilter = (val: string) => {
    setActiveSOFilter(null);
    setActiveStageFilter(activeStageFilter === val ? null : val);
  };

  // --- Filtering chain ---
  const filteredData = useMemo(() => {
    let result = ordersWithRelations;

    // Sales rep filter
    if (salesRepFilter && salesRepFilter !== "all") {
      result = result.filter((o) => o.assignedUserName === salesRepFilter);
    }

    // Stage filter (from card click or dropdown)
    if (activeStageFilter) {
      result = result.filter((o) => o._determinedStage?.stage.id === activeStageFilter);
    }

    // SO filter (from card click)
    if (activeSOFilter) {
      result = result.filter((o) => o.salesOrderStatus === activeSOFilter);
    }

    // SO status dropdown filter
    if (soStatusFilter) {
      result = result.filter((o) => o.salesOrderStatus === soStatusFilter);
    }

    // Company filter
    if (companyFilter) {
      result = result.filter((o) => o.companyId === companyFilter);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.companyName && o.companyName.toLowerCase().includes(q)) ||
        (o.projectName && (o.projectName as string).toLowerCase().includes(q))
      );
    }

    // Date range filter
    if (dateFrom || dateTo) {
      result = result.filter((o) => {
        const dateField = dateType === "inHands" ? o.inHandsDate : o.createdAt;
        if (!dateField) return false;
        const d = new Date(dateField as unknown as string);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo) {
          const toEnd = new Date(dateTo);
          toEnd.setHours(23, 59, 59, 999);
          if (d > toEnd) return false;
        }
        return true;
      });
    }

    return result;
  }, [ordersWithRelations, salesRepFilter, activeStageFilter, activeSOFilter, soStatusFilter, companyFilter, searchQuery, dateType, dateFrom, dateTo]);

  // Summary counts use rep-filtered data (before other filters)
  const repFilteredOrders = useMemo(() => {
    if (!salesRepFilter || salesRepFilter === "all") return ordersWithRelations;
    return ordersWithRelations.filter((o) => o.assignedUserName === salesRepFilter);
  }, [ordersWithRelations, salesRepFilter]);

  const salesOrderCount = repFilteredOrders.filter(
    (o) => o._determinedStage?.stage.id === "sales_order"
  ).length;
  const invoiceCount = repFilteredOrders.filter(
    (o) => o._determinedStage?.stage.id === "invoice"
  ).length;
  const awaitingApprovalCount = repFilteredOrders.filter(
    (o) => o.salesOrderStatus === "pending_client_approval"
  ).length;
  const approvedSOCount = repFilteredOrders.filter(
    (o) => o.salesOrderStatus === "client_approved"
  ).length;

  // Unique sales reps for dropdown
  const salesReps = useMemo(() => {
    return Array.from(
      new Set(
        ordersWithRelations
          .map((o) => o.assignedUserName)
          .filter(Boolean) as string[]
      )
    ).sort();
  }, [ordersWithRelations]);

  // Unique companies for dropdown
  const companyOptions = useMemo(() => {
    return Array.from(
      new Set(
        ordersWithRelations
          .map((o) => o.companyId)
          .filter(Boolean) as string[]
      )
    ).map((id) => ({
      id,
      name: getCompanyName(id),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [ordersWithRelations, companies]);

  const applyDatePreset = (preset: "overdue" | "thisWeek" | "thisMonth") => {
    const today = new Date();
    switch (preset) {
      case "overdue":
        setDateFrom("");
        setDateTo(format(startOfDay(today), "yyyy-MM-dd"));
        break;
      case "thisWeek":
        setDateFrom(format(startOfWeek(today), "yyyy-MM-dd"));
        setDateTo(format(endOfWeek(today), "yyyy-MM-dd"));
        break;
      case "thisMonth":
        setDateFrom(format(startOfMonth(today), "yyyy-MM-dd"));
        setDateTo(format(endOfMonth(today), "yyyy-MM-dd"));
        break;
    }
  };

  // Card filter label for alert bar
  const cardFilterLabel = activeSOFilter === "pending_client_approval"
    ? "Awaiting Approval"
    : activeSOFilter === "client_approved"
    ? "Approved SO"
    : activeStageFilter === "sales_order"
    ? "Sales Orders"
    : activeStageFilter === "invoice"
    ? "Invoice"
    : null;

  const summaryCards = [
    {
      key: "total",
      label: "Total Projects",
      value: repFilteredOrders.length,
      icon: <FileText className="h-5 w-5" />,
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      textColor: "text-slate-700",
      onClick: undefined,
      isActive: false,
    },
    {
      key: "sales_order",
      label: "Active Sales Orders",
      value: salesOrderCount,
      icon: <ShoppingCart className="h-5 w-5" />,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      onClick: () => toggleStageFilter("sales_order"),
      isActive: activeStageFilter === "sales_order",
    },
    {
      key: "awaiting",
      label: "Awaiting Approval",
      value: awaitingApprovalCount,
      icon: <Clock className="h-5 w-5" />,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700",
      onClick: () => toggleSOFilter("pending_client_approval"),
      isActive: activeSOFilter === "pending_client_approval",
    },
    {
      key: "approved",
      label: "Approved SO",
      value: approvedSOCount,
      icon: <CheckCircle2 className="h-5 w-5" />,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      onClick: () => toggleSOFilter("client_approved"),
      isActive: activeSOFilter === "client_approved",
    },
    {
      key: "invoice",
      label: "Ready to Invoice",
      value: invoiceCount,
      icon: <Receipt className="h-5 w-5" />,
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
      onClick: () => toggleStageFilter("invoice"),
      isActive: activeStageFilter === "invoice",
    },
    {
      key: "value",
      label: "Total Value",
      value: `$${repFilteredOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0).toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5" />,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      onClick: undefined,
      isActive: false,
    },
  ];

  return (
    <div className="space-y-6 p-6 pb-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage quotes, sales orders, and production</p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex border rounded-lg overflow-hidden mr-2">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={`rounded-none px-3 ${viewMode === "table" ? "bg-swag-primary hover:bg-swag-primary/90" : ""}`}
            >
              <List size={16} />
              Table
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className={`rounded-none px-3 ${viewMode === "kanban" ? "bg-swag-primary hover:bg-swag-primary/90" : ""}`}
            >
              <Kanban size={16} />
              Kanban
            </Button>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-swag-primary hover:bg-swag-primary/90"
          >
            <PlusCircle size={20} />
            New Project
          </Button>
        </div>
      </div>

      {/* Summary Cards — Production Report tile style */}
      <div className="flex w-full flex-wrap gap-3">
        {summaryCards.map((card) => (
          <Card
            key={card.key}
            className={`flex-1 min-w-[140px] transition-all ${
              card.onClick ? "cursor-pointer hover:shadow-md" : ""
            } ${
              card.isActive
                ? `${card.bgColor} ${card.borderColor} border-2 shadow-md`
                : `${card.bgColor} ${card.borderColor} border`
            }`}
            onClick={card.onClick}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className={card.textColor}>{card.icon}</span>
                <span className={`text-xl font-bold ${card.textColor}`}>{card.value}</span>
              </div>
              <p className={`text-xs font-medium leading-tight ${card.textColor}`}>
                {card.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active card filter indicator */}
      {cardFilterLabel && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            Filtered by: <strong>{cardFilterLabel}</strong>
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 ml-auto"
            onClick={() => { setActiveSOFilter(null); setActiveStageFilter(null); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Filters Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={clearAllFilters}>
                Clear all
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs ml-auto flex items-center gap-1"
              onClick={resetToDefaults}
            >
              <RotateCcw size={10} />
              Reset to Defaults
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="relative col-span-2 md:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search order #, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Stage filter */}
            <Select
              value={activeStageFilter || "all"}
              onValueChange={(v) => {
                setActiveSOFilter(null);
                setActiveStageFilter(v === "all" ? null : v);
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="presentation">Presentation</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
                <SelectItem value="sales_order">Sales Order</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
              </SelectContent>
            </Select>

            {/* Sales Rep filter */}
            <Select
              value={salesRepFilter || "all"}
              onValueChange={(v) => setSalesRepFilter(v === "all" ? "all" : v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Sales Rep" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales Reps</SelectItem>
                {salesReps.map((rep) => (
                  <SelectItem key={rep} value={rep}>{rep}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Company filter */}
            <Select
              value={companyFilter || "all"}
              onValueChange={(v) => setCompanyFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companyOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* SO Status filter */}
            <Select
              value={soStatusFilter || "all"}
              onValueChange={(v) => setSOStatusFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="SO Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {SO_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <Select
              value={dateType}
              onValueChange={(v) => setDateType(v as "inHands" | "createdAt")}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inHands">In-Hands Date</SelectItem>
                <SelectItem value="createdAt">Order Date</SelectItem>
              </SelectContent>
            </Select>
            <DatePickerInput
              value={dateFrom}
              onChange={setDateFrom}
              className="h-8 w-36 text-xs"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <DatePickerInput
              value={dateTo}
              onChange={setDateTo}
              className="h-8 w-36 text-xs"
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

      {/* Projects View */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-swag-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </CardContent>
        </Card>
      ) : ordersWithRelations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Create your first project to get started</p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-swag-primary hover:bg-swag-primary/90"
            >
              <PlusCircle className="mr-2" size={20} />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filteredData}
              meta={{
                onViewOrder: (order: Order) => setLocation(`/projects/${order.id}`),
                onViewProject: (projectId: string) => setLocation(`/projects/${projectId}`),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <KanbanBoard
          data={ordersWithRelations}
          onViewOrder={(order) => setLocation(`/projects/${order.id}`)}
          onViewProject={(projectId) => setLocation(`/projects/${projectId}`)}
        />
      )}

      {/* Create Modal */}
      <NewProjectWizard
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
