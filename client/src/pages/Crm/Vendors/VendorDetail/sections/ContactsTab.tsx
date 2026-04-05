import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vendorContactFormSchema,
  type VendorContactFormData,
  CONTACT_DEPARTMENTS,
} from "@/schemas/crm.schemas";
import {
  useCreateVendorContact,
  useUpdateVendorContact,
  useDeleteVendorContact,
} from "@/services/suppliers";
import type { VendorContact } from "@/services/suppliers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Edit,
  Mail,
  MailX,
  Phone,
  Plus,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

interface ContactsTabProps {
  vendorId: string;
  vendorName: string;
  contacts: VendorContact[];
  isLoading: boolean;
}

export default function ContactsTab({ vendorId, vendorName, contacts, isLoading }: ContactsTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<VendorContact | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [deleteContact, setDeleteContact] = useState<VendorContact | null>(null);

  const createMutation = useCreateVendorContact(vendorId);
  const updateMutation = useUpdateVendorContact(vendorId);
  const deleteMutation = useDeleteVendorContact(vendorId);

  const form = useForm<VendorContactFormData>({
    resolver: zodResolver(vendorContactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      department: "",
      noMarketing: false,
      isPrimary: false,
      receiveOrderEmails: true,
    },
  });

  const filteredContacts = showInactive ? contacts : contacts.filter((c) => c.isActive !== false);
  const inactiveCount = contacts.filter((c) => c.isActive === false).length;

  const handleAdd = (data: VendorContactFormData) => {
    createMutation.mutate(
      { ...data, supplierId: vendorId },
      { onSuccess: () => { setIsAddOpen(false); form.reset(); } },
    );
  };

  const handleEdit = (data: VendorContactFormData) => {
    if (selectedContact) {
      updateMutation.mutate(
        { id: selectedContact.id, data },
        { onSuccess: () => { setIsEditOpen(false); setSelectedContact(null); form.reset(); } },
      );
    }
  };

  const openEdit = (contact: VendorContact) => {
    setSelectedContact(contact);
    form.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      title: contact.title || "",
      department: contact.department || "",
      noMarketing: contact.noMarketing || false,
      isPrimary: contact.isPrimary || false,
      receiveOrderEmails: contact.receiveOrderEmails !== false,
    });
    setIsEditOpen(true);
  };

  const toggleActive = (contact: VendorContact) => {
    updateMutation.mutate({
      id: contact.id,
      data: { isActive: contact.isActive === false ? true : false },
    });
  };

  const contactFormFields = (onSubmit: (data: VendorContactFormData) => void, isPending: boolean, submitLabel: string) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl><Input placeholder="John" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl><Input placeholder="Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Phone</FormLabel>
            <FormControl><Input placeholder="+1 (555) 123-4567" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title/Position</FormLabel>
            <FormControl><Input placeholder="Sales Manager" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="department" render={({ field }) => (
          <FormItem>
            <FormLabel>Department</FormLabel>
            <Select value={field.value || "none"} onValueChange={(val) => field.onChange(val === "none" ? "" : val)}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="none">No Department</SelectItem>
                {CONTACT_DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept.toLowerCase()}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="isPrimary" render={({ field }) => (
          <FormItem className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <FormLabel>Primary Contact</FormLabel>
              <p className="text-sm text-muted-foreground">Mark as main point of contact</p>
            </div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        <FormField control={form.control} name="receiveOrderEmails" render={({ field }) => (
          <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
            <div>
              <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" />Receive Order Emails</FormLabel>
              <p className="text-sm text-muted-foreground">Include in vendor order emails</p>
            </div>
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        <FormField control={form.control} name="noMarketing" render={({ field }) => (
          <FormItem className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <FormLabel className="flex items-center gap-2"><MailX className="h-4 w-4" />No Marketing</FormLabel>
              <p className="text-sm text-muted-foreground">Opt out of marketing communications</p>
            </div>
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); form.reset(); }}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Contacts ({filteredContacts.length})</h3>
          {inactiveCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowInactive(!showInactive)} className="text-xs text-muted-foreground">
              {showInactive ? "Hide" : "Show"} Inactive ({inactiveCount})
            </Button>
          )}
        </div>
        <Button size="sm" onClick={() => { form.reset(); setIsAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Contact
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>
      ) : filteredContacts.length > 0 ? (
        <div className="space-y-3">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className={`border ${contact.isActive === false ? "opacity-50" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <UserAvatar name={`${contact.firstName} ${contact.lastName}`} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-medium ${contact.isActive === false ? "line-through text-muted-foreground" : ""}`}>
                          {contact.firstName} {contact.lastName}
                        </h4>
                        {contact.isActive === false && <Badge variant="outline" className="text-xs text-gray-500"><UserX className="h-3 w-3 mr-1" />Inactive</Badge>}
                        {contact.isPrimary && <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Primary</Badge>}
                        {contact.department && <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">{contact.department}</Badge>}
                        {contact.noMarketing && <Badge variant="outline" className="text-xs text-orange-600 border-orange-200"><MailX className="h-3 w-3 mr-1" />No Marketing</Badge>}
                        {contact.receiveOrderEmails !== false && contact.email && <Badge variant="secondary" className="text-xs bg-green-100 text-green-800"><Mail className="h-3 w-3 mr-1" />Order Emails</Badge>}
                      </div>
                      {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
                      <div className="mt-2 space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a href={`mailto:${contact.email}`} className="text-swag-primary hover:underline">{contact.email}</a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <a href={`tel:${contact.phone}`} className="text-swag-primary hover:underline">{contact.phone}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(contact)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(contact)} className={contact.isActive === false ? "text-green-600" : "text-gray-500"}>
                      {contact.isActive === false ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteContact(contact)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No contacts found for this vendor</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { form.reset(); setIsAddOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add First Contact
          </Button>
        </div>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Contact — {vendorName}</DialogTitle>
          </DialogHeader>
          {contactFormFields(handleAdd, createMutation.isPending, "Add Contact")}
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {contactFormFields(handleEdit, updateMutation.isPending, "Save Changes")}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteContact} onOpenChange={(o) => !o && setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteContact?.firstName} {deleteContact?.lastName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => {
              if (deleteContact) deleteMutation.mutate(deleteContact.id, { onSuccess: () => setDeleteContact(null) });
            }}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
