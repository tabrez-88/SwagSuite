import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Eye, FileEdit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { UserAvatar } from "@/components/UserAvatar";
import type { Order } from "@shared/schema";

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

export type OrderWithRelations = Order & {
  companyName?: string;
};

export const columns: ColumnDef<OrderWithRelations>[] = [

  {
    accessorKey: "companyName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("companyName") as string;
      return (
        <div className="flex items-center space-x-2">
          <UserAvatar name={name} size="sm" />
          <span>{name}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "orderNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order #" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("orderNumber")}</div>
    ),
  },
  {
    accessorKey: "orderType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order Type" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="text-nowrap">
        {(row.getValue("orderType") as string)?.replace("_", " ").toUpperCase() || "QUOTE"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusDisplayMap;
      const order = row.original;
      const queryClient = useQueryClient();
      const { toast } = useToast();

      const updateStatusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
          const response = await fetch(`/api/orders/${order.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'include',
          });
          if (!response.ok) throw new Error('Failed to update status');
          return response.json();
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${order.id}/activities`] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-orders'] });
          toast({ title: "Status updated successfully" });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        },
      });

      return (
        <Select
          value={status}
          onValueChange={(value) => updateStatusMutation.mutate(value)}
        >
          <SelectTrigger className={`${statusColorMap[status]} h-8 w-[160px] border-0 focus:ring-0`}>
            {statusDisplayMap[status] || status}
          </SelectTrigger>
          <SelectContent>
            <SelectItem className={statusColorMap.quote} value="quote">
              Quote
            </SelectItem>
            <SelectItem className={statusColorMap.pending_approval} value="pending_approval">
              Pending Approval
            </SelectItem>
            <SelectItem className={statusColorMap.approved} value="approved">
              Approved
            </SelectItem>
            <SelectItem className={statusColorMap.in_production} value="in_production">
              In Production
            </SelectItem>
            <SelectItem className={statusColorMap.shipped} value="shipped">
              Shipped
            </SelectItem>
            <SelectItem className={statusColorMap.delivered} value="delivered">
              Delivered
            </SelectItem>
            <SelectItem className={statusColorMap.cancelled} value="cancelled">
              Cancelled
            </SelectItem>
          </SelectContent>
        </Select>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total") || "0");
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="font-semibold">{formatted}</div>;
    },
  },
  {
    accessorKey: "inHandsDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="In-Hands Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("inHandsDate");
      return date ? format(new Date(date as string), "MMM dd, yyyy") : "-";
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt");
      return date ? format(new Date(date as string), "MMM dd, yyyy") : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const order = row.original;
      const meta = table.options.meta as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => meta?.onViewOrder?.(order)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onViewProject?.(order.id)}
            >
              <FileEdit className="mr-2 h-4 w-4" />
              Open Project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.id)}
            >
              Copy Order ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
