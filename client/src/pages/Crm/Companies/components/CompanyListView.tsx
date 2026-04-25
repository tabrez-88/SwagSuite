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
import type { Company } from "@/services/companies";
import { DollarSign, Edit, Eye, Globe, MoreHorizontal, Trash2 } from "lucide-react";
import { SortableTableHead } from "../../components/SortableTableHead";

const ENGAGEMENT_COLORS = {
  high: "bg-green-100 text-green-800 hover:bg-green-200",
  medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  low: "bg-red-100 text-red-800 hover:bg-red-200",
  undefined: "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

interface CompanyListViewProps {
  companies: Company[];
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  formatCurrency: (value: string | undefined) => string;
  onNavigate: (id: string) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export function CompanyListView({
  companies,
  sortField,
  sortDirection,
  onSort,
  formatCurrency,
  onNavigate,
  onEdit,
  onDelete,
}: CompanyListViewProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Company" field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <SortableTableHead label="Industry" field="industry" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <TableHead>Contact</TableHead>
              <SortableTableHead label="YTD Spend" field="ytdSpend" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <SortableTableHead label="Engagement" field="engagementLevel" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company: Company) => (
              <TableRow
                key={company.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => onNavigate(company.id)}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <UserAvatar name={company.name} size="sm" />
                    <div>
                      <div className="font-medium text-swag-navy">{company.name}</div>
                      {company.website && (
                        <div className="text-sm text-muted-foreground">
                          {company.website.replace(/^https?:\/\//, "")}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {company.industry && (
                    <Badge variant="secondary" className="text-xs">{company.industry}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {company.website && (
                      <div className="flex items-center gap-1 text-sm">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-swag-orange hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    {formatCurrency(company.ytdSpend)}
                  </div>
                </TableCell>
                <TableCell>
                  {company.engagementLevel && (
                    <Badge
                      className={
                        ENGAGEMENT_COLORS[company.engagementLevel as keyof typeof ENGAGEMENT_COLORS] || ENGAGEMENT_COLORS.undefined
                      }
                    >
                      {company.engagementLevel.charAt(0).toUpperCase() + company.engagementLevel.slice(1)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()} data-testid={`company-actions-${company.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onNavigate(company.id); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(company); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(company); }} className="text-red-600">
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
