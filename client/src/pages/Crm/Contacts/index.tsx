import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  Building2,
  Trash2,
  Star,
  Eye,
  Edit,
  MoreHorizontal,
  Truck,
  Target,
  BarChart3,
} from "lucide-react";
import { CRMViewToggle } from "@/components/shared/CRMViewToggle";
import { useLocation } from "wouter";
import type { Contact } from "@/services/contacts";
import { useContactsPage } from "./hooks";
import { ContactFormDialog } from "./components/ContactFormDialog";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { SortableTableHead } from "../components/SortableTableHead";

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

export default function Contacts() {
  const {
    searchQuery,
    setSearchQuery,
    isFormDialogOpen,
    setIsFormDialogOpen,
    selectedContact,
    filterType,
    setFilterType,
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    contactToDelete,
    sortField,
    sortDirection,
    handleSort,
    isLoading,
    companies,
    suppliers,
    leadSourceReport,
    filteredContacts,
    createContactMutation,
    updateContactMutation,
    deleteContactMutation,
    handleOpenCreate,
    handleOpenEdit,
    handleFormSubmit,
    handleDeleteContact,
    handleConfirmDelete,
    handleCancelDelete,
  } = useContactsPage();

  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-swag-navy">Contacts</h1>
          <p className="text-muted-foreground">
            Manage all your contacts from companies and vendors
          </p>
        </div>
        <Button
          className="bg-swag-primary hover:bg-swag-primary/90"
          onClick={handleOpenCreate}
        >
          <Plus className="mr-2" size={16} />
          Add Contact
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search contacts by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <CRMViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contacts</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="unlinked">Unlinked</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="whitespace-nowrap">
            {filteredContacts.length} contacts
          </Badge>
        </div>
      </div>

      {/* Lead Source Summary */}
      {leadSourceReport.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {leadSourceReport.map((item) => (
                <div key={item.source} className="flex flex-col border shadow-sm items-center p-2 rounded-lg bg-muted/50 text-center">
                  <span className="text-lg font-bold text-swag-navy">{item.total}</span>
                  <span className="text-xs text-muted-foreground truncate w-full">{item.source}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Display */}
      {isLoading ? (
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company / Vendor</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Lead Source</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : filteredContacts.length > 0 ? (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContacts.map((contact: Contact) => (
                <Card key={contact.id} className="hover:shadow-lg transition-shadow flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <UserAvatar
                          name={`${contact.firstName} ${contact.lastName}`}
                          size="md"
                        />
                        <div>
                          <CardTitle className="text-lg text-swag-navy">
                            {contact.firstName} {contact.lastName}
                          </CardTitle>
                          {contact.title && (
                            <p className="text-xs text-muted-foreground">{contact.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.isPrimary && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs gap-1">
                            <Star className="h-3 w-3" />
                            Primary
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getAssociationBadge(contact)}
                      {contact.leadSource && (
                        <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
                          <Target className="h-3 w-3" />
                          {contact.leadSource}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setLocation(`/crm/contacts/${contact.id}`)}
                        className="bg-swag-primary hover:bg-swag-primary/90"
                      >
                        <Eye className="mr-1" size={12} />
                        View
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(contact)}
                        >
                          <Edit className="mr-1" size={12} />
                          Edit
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContact(contact)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        label="Contact"
                        field="name"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      />
                      <SortableTableHead
                        label="Company / Vendor"
                        field="company"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      />
                      <TableHead>Contact Info</TableHead>
                      <SortableTableHead
                        label="Title"
                        field="title"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      />
                      <SortableTableHead
                        label="Lead Source"
                        field="leadSource"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      />
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact: Contact) => (
                      <TableRow
                        key={contact.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => setLocation(`/crm/contacts/${contact.id}`)}
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
                        <TableCell>
                          {getAssociationBadge(contact)}
                        </TableCell>
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
                          <span className="text-sm text-muted-foreground">
                            {contact.title || "-"}
                          </span>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(contact);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/crm/contacts/${contact.id}`);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteContact(contact);
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
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No contacts found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms or create a new contact."
                : "Get started by adding your first contact."}
            </p>
            <Button onClick={handleOpenCreate} className="bg-swag-primary hover:bg-swag-primary/90">
              <Plus className="mr-2" size={16} />
              Add Contact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Form Dialog (Create / Edit) */}
      <ContactFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        contact={selectedContact}
        onSubmit={handleFormSubmit}
        isPending={selectedContact ? updateContactMutation.isPending : createContactMutation.isPending}
        companies={companies}
        suppliers={suppliers}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Contact?"
        description={<strong>{contactToDelete?.firstName} {contactToDelete?.lastName}</strong>}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isPending={deleteContactMutation.isPending}
        confirmLabel="Delete Contact"
      />
    </div>
  );
}
