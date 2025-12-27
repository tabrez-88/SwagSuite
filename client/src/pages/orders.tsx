import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useLocation } from "wouter";

import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import OrderModal from "@/components/OrderModal";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Order } from "@shared/schema";
import { Calendar, DollarSign, FileText, PlusCircle, Search } from "lucide-react";

const statusColorMap = {
  quote: "bg-blue-100 text-blue-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  in_production: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusDisplayMap = {
  quote: "Quote",
  pending_approval: "Pending Approval",
  approved: "Approved",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [, setLocation] = useLocation();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const getCompanyName = (companyId: string) => {
    const company = companies?.find((c: any) => c.id === companyId);
    return company?.name || "Unknown Company";
  };

  const filteredOrders = orders?.filter((order: Order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCompanyName(order.companyId!).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({
      id: orderId,
      data: { status: newStatus }
    });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage quotes, sales orders, and production</p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-swag-primary hover:bg-swag-primary/90"
        >
          <PlusCircle size={20} />
          New Order
        </Button>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search orders..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="quote">Quote</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_production">In Production</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || statusFilter !== "all" ? "No orders found" : "No orders yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first order to get started"
                }
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-swag-primary hover:bg-swag-primary/90"
                >
                  <PlusCircle className="mr-2" size={20} />
                  Create First Order
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Order #</TableHead>
                  <TableHead className="text-center">Customer</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Value</TableHead>
                  <TableHead className="text-center">In-Hands Date</TableHead>
                  <TableHead className="text-center">Created</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: Order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <UserAvatar
                          name={getCompanyName(order.companyId!)}
                          size="sm"
                        />
                        <span>{getCompanyName(order.companyId!)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-nowrap">
                        {order.orderType?.replace('_', ' ').toUpperCase() || 'QUOTE'}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={order.status || "quote"}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className={`${statusColorMap[order.status as keyof typeof statusColorMap] || "bg-gray-100 text-gray-800"}`}>
                          <SelectValue>
                            <span className="text-nowrap mr-1">{statusDisplayMap[order.status as keyof typeof statusDisplayMap] || order.status}</span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusDisplayMap).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${Number(order.total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.inHandsDate!), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt!), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          data-testid={`button-view-${order.id}`}
                        >
                          View
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/project/${order.id}`);
                          }}
                          data-testid={`button-project-${order.id}`}
                        >
                          Project
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
