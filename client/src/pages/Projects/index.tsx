import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useLocation } from "@/lib/wouter-compat";
import { useAuth } from "@/hooks/useAuth";
import { useProjectFilters } from "@/hooks/useProjectFilters";

import NewProjectWizard from "@/components/modals/NewProjectWizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Order } from "@shared/schema";
import { CheckCircle2, Clock, DollarSign, FileText, Kanban, List, PlusCircle, ShoppingCart, Receipt, RotateCcw } from "lucide-react";
import { columns, OrderWithRelations } from "./components/columns";
import { DataTable } from "./components/data-table";
import { KanbanBoard } from "./components/kanban-board";
import { determineBusinessStage } from "@/constants/businessStages";

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
    resetToDefaults,
  } = useProjectFilters({
    userId: (user as any)?.id || null,
    userRole: (user as any)?.role || "user",
    currentUserName,
    hasOrders,
    isDataLoaded: !isLoading,
  });

  const clearFilters = () => { setActiveSOFilter(null); setActiveStageFilter(null); };
  const toggleSOFilter = (val: string) => { setActiveStageFilter(null); setActiveSOFilter(activeSOFilter === val ? null : val); };
  const toggleStageFilter = (val: string) => { setActiveSOFilter(null); setActiveStageFilter(activeStageFilter === val ? null : val); };

  // Filter by sales rep for summary card counts
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

  // SO approval summary counts
  const awaitingApprovalCount = repFilteredOrders.filter(
    (o) => o.salesOrderStatus === "pending_client_approval"
  ).length;
  const approvedSOCount = repFilteredOrders.filter(
    (o) => o.salesOrderStatus === "client_approved"
  ).length;

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-xl font-bold">{repFilteredOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors hover:border-blue-400 ${activeStageFilter === "sales_order" ? "border-blue-400 bg-blue-50/50" : ""}`}
          onClick={() => toggleStageFilter("sales_order")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Active Sales Orders</p>
                <p className="text-xl font-bold">{salesOrderCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors hover:border-yellow-400 ${activeSOFilter === "pending_client_approval" ? "border-yellow-400 bg-yellow-50/50" : ""}`}
          onClick={() => toggleSOFilter("pending_client_approval")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="text-yellow-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Awaiting Approval</p>
                <p className="text-xl font-bold">{awaitingApprovalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors hover:border-green-400 ${activeSOFilter === "client_approved" ? "border-green-400 bg-green-50/50" : ""}`}
          onClick={() => toggleSOFilter("client_approved")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Approved SO</p>
                <p className="text-xl font-bold">{approvedSOCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors hover:border-green-400 ${activeStageFilter === "invoice" ? "border-green-400 bg-green-50/50" : ""}`}
          onClick={() => toggleStageFilter("invoice")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Receipt className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Ready to Invoice</p>
                <p className="text-xl font-bold">{invoiceCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-bold">
                  ${repFilteredOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0).toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active filter indicator */}
      {(activeSOFilter || activeStageFilter) && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Filtered by:</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            {activeSOFilter === "pending_client_approval" && "Awaiting Approval"}
            {activeSOFilter === "client_approved" && "Approved SO"}
            {activeStageFilter === "sales_order" && "Sales Orders"}
            {activeStageFilter === "invoice" && "Invoice"}
          </span>
          {salesRepFilter && salesRepFilter !== "all" && (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
              {salesRepFilter}
            </span>
          )}
          <button onClick={clearFilters} className="text-gray-400 hover:text-gray-600 underline text-xs">
            Clear
          </button>
          <button onClick={resetToDefaults} className="text-gray-400 hover:text-gray-600 underline text-xs flex items-center gap-1">
            <RotateCcw size={10} />
            Reset to Defaults
          </button>
        </div>
      )}

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
        <DataTable
          columns={columns}
          data={activeSOFilter
            ? ordersWithRelations.filter((o) => o.salesOrderStatus === activeSOFilter)
            : activeStageFilter
            ? ordersWithRelations.filter((o) => o._determinedStage?.stage.id === activeStageFilter)
            : ordersWithRelations
          }
          meta={{
            onViewOrder: (order: Order) => setLocation(`/projects/${order.id}`),
            onViewProject: (projectId: string) => setLocation(`/projects/${projectId}`),
          }}
          salesRepFilter={salesRepFilter}
          onSalesRepFilterChange={setSalesRepFilter}
        />
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
