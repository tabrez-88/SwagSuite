import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Star,
  StarOff,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "./ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Contact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary: boolean;
  billingAddress?: string;
  shippingAddress?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Normalize various country name/code formats to standard 2-letter codes
function normalizeCountryCode(country: string): string {
  if (!country) return "US";
  const c = country.trim().toUpperCase();
  if (c === "US" || c === "CA" || c === "MX") return c;
  const mapping: Record<string, string> = {
    "USA": "US", "U.S.": "US", "U.S.A.": "US",
    "UNITED STATES": "US", "UNITED STATES OF AMERICA": "US",
    "CANADA": "CA", "CAN": "CA",
    "MEXICO": "MX", "MEX": "MX", "MÉXICO": "MX",
  };
  return mapping[c] || "US";
}

interface ContactsManagerProps {
  companyId: string;
  companyName?: string;
}

const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  isPrimary: z.boolean().default(false),
  billingStreet: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZipCode: z.string().optional(),
  billingCountry: z.string().optional(),
  shippingStreet: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZipCode: z.string().optional(),
  shippingCountry: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

// Move ContactFormFields outside to prevent re-creation on every render
const ContactFormFields = ({ form, sameAsBilling, setSameAsBilling }: { form: any; sameAsBilling: boolean; setSameAsBilling: (value: boolean) => void }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>First Name *</FormLabel>
            <FormControl>
              <Input placeholder="John" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name *</FormLabel>
            <FormControl>
              <Input placeholder="Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="john.doe@company.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone</FormLabel>
            <FormControl>
              <Input placeholder="(555) 123-4567" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Job Title</FormLabel>
          <FormControl>
            <Input placeholder="Sales Manager" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="isPrimary"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <FormControl>
            <input
              type="checkbox"
              checked={field.value}
              onChange={field.onChange}
              className="h-4 w-4 rounded border-gray-300"
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>Primary Contact</FormLabel>
            <p className="text-sm text-muted-foreground">
              Set this person as the primary contact for the company
            </p>
          </div>
        </FormItem>
      )}
    />

    <Separator />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Billing Address Section */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Billing Address</h4>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="billingStreet"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <AddressAutocomplete
                    value={field.value || ""}
                    onChange={field.onChange}
                    onAddressSelect={(addr) => {
                      form.setValue("billingCity", addr.city);
                      form.setValue("billingState", addr.state);
                      form.setValue("billingZipCode", addr.zipCode);
                      form.setValue("billingCountry", addr.country);
                    }}
                    placeholder="123 Main St"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billingCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billingState"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="CA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billingZipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billingCountry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select
                  value={field.value || "US"}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="MX">Mexico</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Shipping Address Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">Shipping Address</h4>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsBilling"
              checked={sameAsBilling}
              onCheckedChange={(checked) => setSameAsBilling(checked as boolean)}
            />
            <label htmlFor="sameAsBilling" className="text-sm cursor-pointer">
              Same as Billing Address
            </label>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shippingStreet"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <AddressAutocomplete
                    value={field.value || ""}
                    onChange={field.onChange}
                    onAddressSelect={(addr) => {
                      form.setValue("shippingCity", addr.city);
                      form.setValue("shippingState", addr.state);
                      form.setValue("shippingZipCode", addr.zipCode);
                      form.setValue("shippingCountry", addr.country);
                    }}
                    placeholder="456 Oak Ave"
                    disabled={sameAsBilling}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} disabled={sameAsBilling} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingState"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="CA" {...field} disabled={sameAsBilling} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingZipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="12345" {...field} disabled={sameAsBilling} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingCountry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select
                  value={field.value || "US"}
                  onValueChange={field.onChange}
                  disabled={sameAsBilling}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="MX">Mexico</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  </>
);

export function ContactsManager({ companyId, companyName }: ContactsManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sameAsBillingCreate, setSameAsBillingCreate] = useState(false);
  const [sameAsBillingEdit, setSameAsBillingEdit] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Separate forms for create and edit to prevent focus issues
  const createForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      isPrimary: false,
      billingStreet: "",
      billingCity: "",
      billingState: "",
      billingZipCode: "",
      billingCountry: "",
      shippingStreet: "",
      shippingCity: "",
      shippingState: "",
      shippingZipCode: "",
      shippingCountry: "",
    },
  });

  const editForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      isPrimary: false,
      billingStreet: "",
      billingCity: "",
      billingState: "",
      billingZipCode: "",
      billingCountry: "",
      shippingStreet: "",
      shippingCity: "",
      shippingState: "",
      shippingZipCode: "",
      shippingCountry: "",
    },
  });

  // Sync shipping address with billing for edit form
  const billingStreetEdit = editForm.watch("billingStreet");
  const billingCityEdit = editForm.watch("billingCity");
  const billingStateEdit = editForm.watch("billingState");
  const billingZipCodeEdit = editForm.watch("billingZipCode");
  const billingCountryEdit = editForm.watch("billingCountry");

  React.useEffect(() => {
    if (sameAsBillingEdit) {
      editForm.setValue("shippingStreet", billingStreetEdit || "");
      editForm.setValue("shippingCity", billingCityEdit || "");
      editForm.setValue("shippingState", billingStateEdit || "");
      editForm.setValue("shippingZipCode", billingZipCodeEdit || "");
      editForm.setValue("shippingCountry", billingCountryEdit || "");
    }
  }, [sameAsBillingEdit, billingStreetEdit, billingCityEdit, billingStateEdit, billingZipCodeEdit, billingCountryEdit, editForm]);

  // Sync shipping address with billing for create form
  const billingStreetCreate = createForm.watch("billingStreet");
  const billingCityCreate = createForm.watch("billingCity");
  const billingStateCreate = createForm.watch("billingState");
  const billingZipCodeCreate = createForm.watch("billingZipCode");
  const billingCountryCreate = createForm.watch("billingCountry");

  React.useEffect(() => {
    if (sameAsBillingCreate) {
      createForm.setValue("shippingStreet", billingStreetCreate || "");
      createForm.setValue("shippingCity", billingCityCreate || "");
      createForm.setValue("shippingState", billingStateCreate || "");
      createForm.setValue("shippingZipCode", billingZipCodeCreate || "");
      createForm.setValue("shippingCountry", billingCountryCreate || "");
    }
  }, [sameAsBillingCreate, billingStreetCreate, billingCityCreate, billingStateCreate, billingZipCodeCreate, billingCountryCreate, createForm]);

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts", companyId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts?companyId=${companyId}`);
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },
    enabled: !!companyId,
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Convert address fields to JSON
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        isPrimary: data.isPrimary,
        companyId,
      };

      // Build billing address JSON if any field is filled
      if (data.billingStreet || data.billingCity || data.billingState || data.billingZipCode || data.billingCountry) {
        payload.billingAddress = JSON.stringify({
          street: data.billingStreet || "",
          city: data.billingCity || "",
          state: data.billingState || "",
          zipCode: data.billingZipCode || "",
          country: data.billingCountry || "",
          phone: "",
        });
      }

      // Build shipping address JSON if any field is filled
      if (data.shippingStreet || data.shippingCity || data.shippingState || data.shippingZipCode || data.shippingCountry) {
        payload.shippingAddress = JSON.stringify({
          street: data.shippingStreet || "",
          city: data.shippingCity || "",
          state: data.shippingState || "",
          zipCode: data.shippingZipCode || "",
          country: data.shippingCountry || "",
          phone: "",
        });
      }

      const response = await apiRequest("POST", "/api/contacts", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", companyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCreateModalOpen(false);
      createForm.reset();
      toast({
        title: "Contact created",
        description: "The contact has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create contact: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContactFormData> }) => {
      console.log('Updating contact:', id, 'with data:', data);

      // Convert address fields to JSON
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        isPrimary: data.isPrimary,
      };

      // Build billing address JSON if any field is filled
      if (data.billingStreet || data.billingCity || data.billingState || data.billingZipCode || data.billingCountry) {
        payload.billingAddress = JSON.stringify({
          street: data.billingStreet || "",
          city: data.billingCity || "",
          state: data.billingState || "",
          zipCode: data.billingZipCode || "",
          country: data.billingCountry || "",
          phone: "",
        });
      }

      // Build shipping address JSON if any field is filled
      if (data.shippingStreet || data.shippingCity || data.shippingState || data.shippingZipCode || data.shippingCountry) {
        payload.shippingAddress = JSON.stringify({
          street: data.shippingStreet || "",
          city: data.shippingCity || "",
          state: data.shippingState || "",
          zipCode: data.shippingZipCode || "",
          country: data.shippingCountry || "",
          phone: "",
        });
      }

      const response = await apiRequest("PATCH", `/api/contacts/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", companyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsEditModalOpen(false);
      setSelectedContact(null);
      editForm.reset();
      toast({
        title: "Contact updated",
        description: "The contact has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      console.error('Update contact error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", companyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Contact deleted",
        description: "The contact has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateContact = (data: ContactFormData) => {
    createContactMutation.mutate(data);
  };

  const handleUpdateContact = (data: ContactFormData) => {
    if (selectedContact) {
      updateContactMutation.mutate({ id: selectedContact.id, data });
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    
    // Reset checkbox
    setSameAsBillingEdit(false);

    // Parse billing address
    let billingStreet = "", billingCity = "", billingState = "", billingZipCode = "", billingCountry = "";
    if (contact.billingAddress) {
      try {
        const billing = JSON.parse(contact.billingAddress);
        billingStreet = billing.street || "";
        billingCity = billing.city || "";
        billingState = billing.state || "";
        billingZipCode = billing.zipCode || "";
        billingCountry = normalizeCountryCode(billing.country || "");
      } catch { }
    }

    // Parse shipping address
    let shippingStreet = "", shippingCity = "", shippingState = "", shippingZipCode = "", shippingCountry = "";
    if (contact.shippingAddress) {
      try {
        const shipping = JSON.parse(contact.shippingAddress);
        shippingStreet = shipping.street || "";
        shippingCity = shipping.city || "";
        shippingState = shipping.state || "";
        shippingZipCode = shipping.zipCode || "";
        shippingCountry = normalizeCountryCode(shipping.country || "");
      } catch { }
    }

    editForm.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      title: contact.title || "",
      isPrimary: contact.isPrimary,
      billingStreet,
      billingCity,
      billingState,
      billingZipCode,
      billingCountry,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingZipCode,
      shippingCountry,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleTogglePrimary = (contact: Contact) => {
    updateContactMutation.mutate({
      id: contact.id,
      data: { isPrimary: !contact.isPrimary },
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contacts</h3>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Add a new contact person for {companyName || "this company"}.
              </DialogDescription>
            </DialogHeader>

            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateContact)} className="space-y-4">
                <ContactFormFields form={createForm} sameAsBilling={sameAsBillingCreate} setSameAsBilling={setSameAsBillingCreate} />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createContactMutation.isPending}
                    className="bg-swag-primary hover:bg-swag-primary/90"
                  >
                    {createContactMutation.isPending ? "Creating..." : "Create Contact"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
      ) : contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-swag-primary text-white">
                      {getInitials(contact.firstName, contact.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-swag-navy truncate">
                        {contact.firstName} {contact.lastName}
                      </h4>
                      {contact.isPrimary && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Primary
                        </Badge>
                      )}
                    </div>

                    {contact.title && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <Briefcase className="h-3 w-3" />
                        <span className="truncate">{contact.title}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-swag-orange hover:underline truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contact.email}
                          </a>
                        </div>
                      )}

                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-swag-orange hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contact.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePrimary(contact)}
                      title={contact.isPrimary ? "Remove as primary" : "Set as primary"}
                    >
                      {contact.isPrimary ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditContact(contact)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContact(contact)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold text-muted-foreground mb-2">
              No contacts yet
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add contact persons to keep track of who you work with at this company
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="bg-swag-orange hover:bg-swag-orange/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Contact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Contact Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update the contact information.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateContact)} className="space-y-4">
              <ContactFormFields form={editForm} sameAsBilling={sameAsBillingEdit} setSameAsBilling={setSameAsBillingEdit} />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateContactMutation.isPending}
                  className="bg-swag-primary hover:bg-swag-primary/90"
                >
                  {updateContactMutation.isPending ? "Updating..." : "Update Contact"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Contact?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{contactToDelete?.firstName} {contactToDelete?.lastName}</strong>?
              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setContactToDelete(null);
                setIsDeleteDialogOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (contactToDelete) {
                  deleteContactMutation.mutate(contactToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? "Deleting..." : "Delete Contact"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
