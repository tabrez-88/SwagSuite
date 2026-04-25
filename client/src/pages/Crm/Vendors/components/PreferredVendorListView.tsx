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
import { Edit, Eye, Gift, MoreHorizontal, Star, TrendingUp } from "lucide-react";

interface PreferredVendorListViewProps {
  vendors: Vendor[];
  onViewDetail: (vendor: Vendor) => void;
  onEdit: (vendor: Vendor) => void;
}

export function PreferredVendorListView({ vendors, onViewDetail, onEdit }: PreferredVendorListViewProps) {
  return (
    <Card className="border-yellow-200">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preferred Vendor</TableHead>
              <TableHead>Benefits</TableHead>
              <TableHead>YTD Savings</TableHead>
              <TableHead>YTD Rebates</TableHead>
              <TableHead>Promos Sent</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor: Vendor) => (
              <TableRow
                key={vendor.id}
                className="hover:bg-yellow-50 cursor-pointer bg-gradient-to-r from-yellow-50/50 to-transparent"
                onClick={() => onViewDetail(vendor)}
                data-testid={`preferred-vendor-row-${vendor.id}`}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <UserAvatar name={vendor.name} size="sm" />
                    <div>
                      <div className="font-medium text-swag-navy flex items-center gap-2">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        {vendor.name}
                      </div>
                      {vendor.contactPerson && (
                        <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {vendor.preferredBenefits?.eqpPricing && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        {vendor.preferredBenefits.eqpPricing}% EQP
                      </Badge>
                    )}
                    {vendor.preferredBenefits?.rebatePercentage && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        {vendor.preferredBenefits.rebatePercentage}% Rebate
                      </Badge>
                    )}
                    {vendor.preferredBenefits?.freeSetups && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                        Free Setups
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {vendor.preferredBenefits?.ytdEqpSavings && (
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      ${vendor.preferredBenefits.ytdEqpSavings.toLocaleString()}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {vendor.preferredBenefits?.ytdRebates && (
                    <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                      <Gift className="h-3 w-3" />
                      ${vendor.preferredBenefits.ytdRebates.toLocaleString()}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {vendor.preferredBenefits?.selfPromosSent !== undefined && (
                      <div>Self: {vendor.preferredBenefits.selfPromosSent}</div>
                    )}
                    {vendor.preferredBenefits?.specSamplesSent !== undefined && (
                      <div>Samples: {vendor.preferredBenefits.specSamplesSent}</div>
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
                        data-testid={`preferred-vendor-actions-${vendor.id}`}
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
                        Edit Vendor
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
