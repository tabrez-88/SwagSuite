import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Plus, User, BarChart3 } from "lucide-react";
import { CRMViewToggle } from "@/components/shared/CRMViewToggle";
import { useLocation } from "@/lib/wouter-compat";
import { useContactsPage, type SortField } from "./hooks";
import { ContactFormDialog } from "./components/ContactFormDialog";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { ContactCardView } from "./components/ContactCardView";
import { ContactListView } from "./components/ContactListView";

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
        <Button className="bg-swag-primary hover:bg-swag-primary/90" onClick={handleOpenCreate}>
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
        viewMode === "cards" ? (
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
                    {["Contact", "Company / Vendor", "Contact Info", "Title", "Lead Source", "Actions"].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : filteredContacts.length > 0 ? (
        <>
          {viewMode === "cards" && (
            <ContactCardView
              contacts={filteredContacts}
              onView={(id) => setLocation(`/crm/contacts/${id}`)}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteContact}
            />
          )}
          {viewMode === "list" && (
            <ContactListView
              contacts={filteredContacts}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={(f) => handleSort(f as SortField)}
              onView={(id) => setLocation(`/crm/contacts/${id}`)}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteContact}
            />
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No contacts found</h3>
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
