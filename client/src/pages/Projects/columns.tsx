import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Eye, FileEdit, AlertTriangle } from "lucide-react";
import { getDateStatus } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StageBadge } from "@/components/shared/StageBadge";
import { determineBusinessStage, STAGE_ORDER, type DeterminedStage } from "@/constants/businessStages";
import type { Order } from "@shared/schema";

export type OrderWithRelations = Order & {
  companyName?: string;
  _determinedStage?: DeterminedStage;
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
      <div>
        <div className="font-medium">{row.getValue("orderNumber")}</div>
        {row.original.projectName && (
          <div className="text-xs text-muted-foreground truncate max-w-[160px]">{row.original.projectName}</div>
        )}
      </div>
    ),
  },
  {
    id: "stage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stage" />
    ),
    cell: ({ row }) => {
      const determined = row.original._determinedStage || determineBusinessStage(row.original);
      return <StageBadge stage={determined} size="md" />;
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original._determinedStage || determineBusinessStage(rowA.original);
      const b = rowB.original._determinedStage || determineBusinessStage(rowB.original);
      const stageOrderA = STAGE_ORDER.indexOf(a.stage.id);
      const stageOrderB = STAGE_ORDER.indexOf(b.stage.id);
      if (stageOrderA !== stageOrderB) return stageOrderA - stageOrderB;
      return a.currentSubStatus.order - b.currentSubStatus.order;
    },
    filterFn: (row, _columnId, value) => {
      if (!value || value === "all") return true;
      const determined = row.original._determinedStage || determineBusinessStage(row.original);
      return determined.stage.id === value;
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
    accessorKey: "budget",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Budget" />
    ),
    cell: ({ row }) => {
      const budget = row.getValue("budget");
      if (!budget || Number(budget) === 0) return <span className="text-muted-foreground">-</span>;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(budget));
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "inHandsDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="In-Hands Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("inHandsDate");
      if (!date) return "-";
      const status = getDateStatus(date as string);
      return (
        <div className="flex items-center gap-1.5">
          <span>{format(new Date(date as string), "MMM dd, yyyy")}</span>
          {status && (
            <Badge className={`text-[10px] px-1.5 py-0 leading-4 ${status.color}`}>
              {status.label}
            </Badge>
          )}
        </div>
      );
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
