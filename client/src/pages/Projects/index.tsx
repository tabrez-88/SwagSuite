import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "@/lib/wouter-compat";

import NewProjectWizard from "@/components/modals/NewProjectWizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Order } from "@shared/schema";
import { DollarSign, FileText, Kanban, List, PlusCircle, ShoppingCart, Receipt } from "lucide-react";
import { columns, OrderWithRelations } from "./components/columns";
import { DataTable } from "./components/data-table";
import { KanbanBoard } from "./components/kanban-board";
import { determineBusinessStage } from "@/constants/businessStages";

export default function ProjectsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
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
      _determinedStage: determined,
    };
  });

  const salesOrderCount = ordersWithRelations.filter(
    (o) => o._determinedStage?.stage.id === "sales_order"
  ).length;
  const invoiceCount = ordersWithRelations.filter(
    (o) => o._determinedStage?.stage.id === "invoice"
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-xl font-bold">{orders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
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
        <Card>
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
                  ${orders?.reduce((sum: number, order: Order) => sum + Number(order.total || 0), 0).toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          data={ordersWithRelations}
          meta={{
            onViewOrder: (order: Order) => setLocation(`/projects/${order.id}`),
            onViewProject: (projectId: string) => setLocation(`/projects/${projectId}`),
          }}
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
