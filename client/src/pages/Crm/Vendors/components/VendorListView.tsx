import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Vendor } from "@/services/suppliers";
import { DollarSign, Edit, Eye, Globe, MoreHorizontal, Package, Trash2 } from "lucide-react";
import { SortableTableHead } from "../../components/SortableTableHead";
import type { SortField, SortDirection } from "../hooks";

interface VendorListViewProps {
  vendors: Vendor[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onViewDetail: (vendor: Vendor) => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
}

export function VendorListView({
  vendors,
  sortField,
  sortDirection,
  onSort,
  onViewDetail,
  onEdit,
  onDelete,
}: VendorListViewProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Vendor" field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <TableHead>Contact Info</TableHead>
              <SortableTableHead label="Terms" field="paymentTerms" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <SortableTableHead label="Products" field="productCount" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <SortableTableHead label="YTD Spend" field="ytdSpend" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <SortableTableHead label="Status" field="isPreferred" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor: Vendor) => (
              <TableRow
                key={vendor.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => onViewDetail(vendor)}
                data-testid={`vendor-row-${vendor.id}`}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <UserAvatar name={vendor.name} size="sm" />
                    <div>
                      <div className="font-medium text-swag-navy flex items-center gap-2">
                        {vendor.name}
                      </div>
                      {vendor.contactPerson && (
                        <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {vendor.website && (
                      <div className="flex items-center gap-1 text-sm">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Website
                        </a>
                      </div>
                    )}
                    {vendor.apiIntegrationStatus === "active" && (
                      <Badge className="bg-green-100 text-green-800 text-xs">API Active</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {vendor.paymentTerms && (
                    <Badge variant="secondary" className="text-xs">
                      {vendor.paymentTerms}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {vendor.productCount !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      <Package className="h-3 w-3 text-blue-600" />
                      <span>{vendor.productCount}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {vendor.ytdSpend && (
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      ${vendor.ytdSpend.toLocaleString()}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {vendor.isPreferred && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">Preferred</Badge>
                    )}
                    {vendor.apiIntegrationStatus === "active" && (
                      <Badge className="bg-green-100 text-green-800 text-xs">API Connected</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`vendor-actions-${vendor.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail(vendor);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit(vendor);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(vendor);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
