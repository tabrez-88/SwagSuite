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
import type { Contact } from "@/services/contacts";
import { Building2, Edit, Eye, Mail, MoreHorizontal, Phone, Star, Target, Trash2, Truck } from "lucide-react";
import { SortableTableHead } from "../../components/SortableTableHead";

function getAssociationBadge(contact: Contact) {
  if (contact.companyId) {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Building2 className="h-3 w-3" />
        {contact.companyName || "Company"}
      </Badge>
    );
  }
  if (contact.supplierId) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Truck className="h-3 w-3" />
        {contact.supplierName || "Vendor"}
      </Badge>
    );
  }
  return null;
}

interface ContactListViewProps {
  contacts: Contact[];
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onView: (id: string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export function ContactListView({
  contacts,
  sortField,
  sortDirection,
  onSort,
  onView,
  onEdit,
  onDelete,
}: ContactListViewProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Contact" field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <SortableTableHead label="Company / Vendor" field="company" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <TableHead>Contact Info</TableHead>
              <SortableTableHead label="Title" field="title" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <SortableTableHead label="Lead Source" field="leadSource" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort} />
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact: Contact) => (
              <TableRow
                key={contact.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => onView(contact.id)}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <UserAvatar name={`${contact.firstName} ${contact.lastName}`} size="sm" />
                    <div>
                      <div className="font-medium text-swag-navy flex items-center gap-2">
                        {contact.firstName} {contact.lastName}
                        {contact.isPrimary && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getAssociationBadge(contact)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {contact.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{contact.title || "-"}</span>
                </TableCell>
                <TableCell>
                  {contact.leadSource ? (
                    <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
                      <Target className="h-3 w-3" />
                      {contact.leadSource}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(contact); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(contact.id); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(contact); }} className="text-red-600">
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
