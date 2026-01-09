import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";

import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import OrderModal from "@/components/OrderModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Order } from "@shared/schema";
import { Calendar, DollarSign, FileText, PlusCircle } from "lucide-react";
import { columns, OrderWithRelations } from "./orders/columns";
import { DataTable } from "./orders/data-table";

export default function Orders() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [, setLocation] = useLocation();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
  });

  const getCompanyName = (companyId: string) => {
    const company = companies?.find((c: any) => c.id === companyId);
    return company?.name || "Unknown Company";
  };

  const getSupplierName = (supplierId: string | undefined) => {
    if (!supplierId) return undefined;
    const supplier = suppliers?.find((s: any) => s.id === supplierId);
    return supplier?.name || "Unknown Vendor";
  };

  // Prepare data with relations for the table
  const ordersWithRelations: OrderWithRelations[] = orders.map((order) => ({
    ...order,
    companyName: getCompanyName(order.companyId!),
    supplierName: getSupplierName((order as any).supplierId),
  }));

  return (
    <div className="space-y-6 p-6 pb-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage quotes, sales orders, and production</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setLocation('/production-report')}
          >
            <Calendar size={20} className="mr-2" />
            Production Report
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-swag-primary hover:bg-swag-primary/90"
          >
            <PlusCircle size={20} />
            New Order
          </Button>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-xl font-bold">{orders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="text-purple-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">In Production</p>
                <p className="text-xl font-bold">
                  {orders?.filter((o: Order) => o.status === 'in_production').length || 0}
                </p>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="text-yellow-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-xl font-bold">
                  {orders?.filter((o: Order) => o.status === 'pending_approval').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders DataTable */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-swag-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </CardContent>
        </Card>
      ) : ordersWithRelations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-4">Create your first order to get started</p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-swag-primary hover:bg-swag-primary/90"
            >
              <PlusCircle className="mr-2" size={20} />
              Create First Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={ordersWithRelations}
          meta={{
            onViewOrder: (order: Order) => setSelectedOrder(order),
            onViewProject: (orderId: string) => setLocation(`/project/${orderId}`),
          }}
        />
      )}

      {/* Order Modals */}
      <OrderModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <OrderDetailsModal
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        order={selectedOrder}
        companyName={selectedOrder ? getCompanyName(selectedOrder.companyId!) : ""}
      />
    </div>
  );
}
