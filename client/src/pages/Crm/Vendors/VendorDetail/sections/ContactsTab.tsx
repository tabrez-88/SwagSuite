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
import {
  AlertTriangle,
  Briefcase,
  Building,
  Edit,
  Eye,
  EyeOff,
  Mail,
  MailX,
  Phone,
  Plus,
  Star,
  StarOff,
  User,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

interface ContactsTabProps {
  vendorId: string;
  vendorName: string;
  contacts: VendorContact[];
  isLoading: boolean;
}

const ContactFormFields = ({ form, isVendor = true }: { form: any; isVendor?: boolean }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField control={form.control} name="title" render={({ field }) => (
        <FormItem>
          <FormLabel>Job Title</FormLabel>
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
              <SelectItem value="none">None</SelectItem>
              {CONTACT_DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept.toLowerCase()}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
    </div>

    <div className="flex gap-4">
      <FormField control={form.control} name="isPrimary" render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 flex-1">
          <FormControl>
            <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300" />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>Primary Contact</FormLabel>
            <p className="text-sm text-muted-foreground">Main point of contact</p>
          </div>
        </FormItem>
      )} />
      <FormField control={form.control} name="noMarketing" render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 flex-1">
          <FormControl>
            <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300" />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>No Marketing</FormLabel>
            <p className="text-sm text-muted-foreground">Opt out of marketing emails</p>
          </div>
        </FormItem>
      )} />
    </div>

    {isVendor && (
      <FormField control={form.control} name="receiveOrderEmails" render={({ field }) => (
        <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
          <div>
            <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" />Receive Order Emails</FormLabel>
            <p className="text-sm text-muted-foreground">Include in vendor order emails</p>
          </div>
          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
    )}
  </>
);

export default function ContactsTab({ vendorId, vendorName, contacts, isLoading }: ContactsTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  const getInitials = (first: string, last: string) =>
    `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

  const handleCreate = (data: VendorContactFormData) => {
    createMutation.mutate(
      { ...data, supplierId: vendorId },
      { onSuccess: () => { setIsCreateOpen(false); form.reset(); } },
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

  const handleTogglePrimary = (contact: VendorContact) => {
    updateMutation.mutate({
      id: contact.id,
      data: { isPrimary: !contact.isPrimary },
    });
  };

  const handleToggleActive = (contact: VendorContact) => {
    updateMutation.mutate({
      id: contact.id,
      data: { isActive: contact.isActive === false },
    });
  };

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
        <Users className="h-4 w-4" />
        <h3 className="text-lg font-semibold">Contacts</h3>
        </div>
        <div className="flex items-center gap-2">
          {inactiveCount > 0 && (
            <Button
              variant={showInactive ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
              className="text-xs"
            >
              {showInactive ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
              {showInactive ? "Hide" : "Show"} Inactive ({inactiveCount})
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => form.reset()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Add a new contact person for {vendorName}.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                  <ContactFormFields form={form} />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isPending} className="bg-swag-primary hover:bg-swag-primary/90">
                      {createMutation.isPending ? "Creating..." : "Create Contact"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredContacts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredContacts.map((contact) => {
            const isInactive = contact.isActive === false;
            return (
              <Card key={contact.id} className={`hover:shadow-md transition-shadow ${isInactive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={isInactive ? "bg-gray-400 font-semibold text-white" : "bg-swag-primary font-semibold text-white"}>
                        {getInitials(contact.firstName, contact.lastName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className={`font-semibold truncate ${isInactive ? "text-gray-500 line-through" : "text-swag-navy"}`}>
                          {contact.firstName} {contact.lastName}
                        </h4>
                        {contact.isPrimary && (
                          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Primary
                          </Badge>
                        )}
                        {isInactive && (
                          <Badge variant="outline" className="text-xs text-gray-500">Inactive</Badge>
                        )}
                        {contact.noMarketing && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                            <MailX className="h-3 w-3 mr-1" />
                            No Marketing
                          </Badge>
                        )}
                        {contact.receiveOrderEmails !== false && contact.email && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            <Mail className="h-3 w-3 mr-1" />
                            Order Emails
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        {contact.title && (
                          <span className="flex items-center gap-1 truncate">
                            <Briefcase className="h-3 w-3" />
                            {contact.title}
                          </span>
                        )}
                        {contact.title && contact.department && <span className="text-gray-300">|</span>}
                        {contact.department && (
                          <span className="flex items-center text-xs capitalize gap-1 truncate">
                            <Building className="h-3 w-3" />
                            {contact.department.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a href={`mailto:${contact.email}`} className="text-swag-orange hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <a href={`tel:${contact.phone}`} className="text-swag-orange hover:underline" onClick={(e) => e.stopPropagation()}>
                              {contact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleTogglePrimary(contact)} title={contact.isPrimary ? "Remove as primary" : "Set as primary"}>
                        {contact.isPrimary ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : <StarOff className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(contact)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(contact)}
                        title={isInactive ? "Reactivate contact" : "Deactivate contact"}
                        className={isInactive ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"}
                      >
                        {isInactive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold text-muted-foreground mb-2">No contacts yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add contact persons to keep track of who you work with at this vendor
            </p>
            <Button onClick={() => { form.reset(); setIsCreateOpen(true); }} size="sm" className="bg-swag-orange hover:bg-swag-orange/90">
              <Plus className="h-4 w-4 mr-2" />
              Add First Contact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Contact Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update the contact information.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
              <ContactFormFields form={form} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-swag-primary hover:bg-swag-primary/90">
                  {updateMutation.isPending ? "Updating..." : "Update Contact"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteContact} onOpenChange={(o) => !o && setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Contact Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteContact?.firstName} {deleteContact?.lastName}</strong>?
              <span className="block mt-2 text-muted-foreground">
                Tip: You can deactivate contacts instead using the <UserX className="inline h-3.5 w-3.5" /> button to keep them for historical records.
              </span>
              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteContact(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteContact) deleteMutation.mutate(deleteContact.id, { onSuccess: () => setDeleteContact(null) });
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
