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
import type { Lead } from "@/services/leads";
import { Calendar, DollarSign, Edit, Mail, MoreHorizontal, Phone, Trash2 } from "lucide-react";
import { STATUS_COLORS } from "../types";
import { SortableTableHead } from "../../components/SortableTableHead";

interface LeadListViewProps {
  leads: Lead[];
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadListView({
  leads,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
}: LeadListViewProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Lead" field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <TableHead>Contact Info</TableHead>
              <SortableTableHead label="Source" field="source" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <SortableTableHead label="Value" field="estimatedValue" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <SortableTableHead label="Status" field="status" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <SortableTableHead label="Follow-up" field="nextFollowUpDate" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead: Lead) => (
              <TableRow
                key={lead.id}
                className="hover:bg-muted/50 cursor-pointer"
                data-testid={`lead-row-${lead.id}`}
                onClick={() => onEdit(lead)}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <UserAvatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
                    <div>
                      <div className="font-medium text-swag-navy">
                        {lead.firstName} {lead.lastName}
                      </div>
                      {lead.company && (
                        <div className="text-sm text-muted-foreground">{lead.company}</div>
                      )}
                      {lead.title && (
                        <div className="text-xs text-muted-foreground">{lead.title}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {lead.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{lead.source}</Badge>
                </TableCell>
                <TableCell>
                  {lead.estimatedValue ? (
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      ${lead.estimatedValue.toLocaleString()}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS]}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.nextFollowUpDate ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{new Date(lead.nextFollowUpDate).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`lead-actions-${lead.id}`} onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(lead)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(lead)} className="text-red-600">
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
