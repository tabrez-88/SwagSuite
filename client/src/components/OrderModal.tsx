import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Company, Order } from "@shared/schema";
import { Separator } from "./ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

// Normalize various country name/code formats to standard 2-letter codes
function normalizeCountryCode(country: string): string {
  if (!country) return "US";
  const c = country.trim().toUpperCase();
  // Already a valid code
  if (c === "US" || c === "CA" || c === "MX") return c;
  // Common name variants
  const mapping: Record<string, string> = {
    "USA": "US",
    "U.S.": "US",
    "U.S.A.": "US",
    "UNITED STATES": "US",
    "UNITED STATES OF AMERICA": "US",
    "CANADA": "CA",
    "CAN": "CA",
    "MEXICO": "MX",
    "MEX": "MX",
    "MÉXICO": "MX",
  };
  return mapping[c] || "US";
}

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  initialCompanyId?: string;
}

export default function OrderModal({ open, onOpenChange, order, initialCompanyId }: OrderModalProps) {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    companyId: "",
    contactId: "",
    assignedUserId: "",
    orderType: "quote",
    inHandsDate: "",
    eventDate: "",
    supplierInHandsDate: "",
    isFirm: false,
    notes: "",
    supplierNotes: "",
    additionalInformation: "",
    orderDiscount: "0",
    billingContact: "",
    billingEmail: "",
    billingStreet: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
    billingCountry: "US",
    billingPhone: "",
    shippingContact: "",
    shippingEmail: "",
    shippingStreet: "",
    shippingCity: "",
    shippingState: "",
    shippingZipCode: "",
    shippingCountry: "US",
    shippingPhone: "",
  });
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [openCustomerCombo, setOpenCustomerCombo] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user first so it's available for form initialization
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    enabled: open,
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: open,
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
    enabled: open,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users/team"],
    enabled: open,
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    enabled: open,
  });

  // Fetch existing order items when editing
  const { data: existingOrderItems = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${order?.id}/items`],
    enabled: open && !!order?.id,
  });

  // Reset or populate form when opening 
  useEffect(() => {
    if (open) {
      if (order) {
        // Parse shipping address if it's JSON
        let shippingStreet = "";
        let shippingCity = "";
        let shippingState = "";
        let shippingZipCode = "";
        let shippingCountry = "US";
        let shippingPhone = "";
        let shippingContact = "";
        let shippingEmail = "";
        if ((order as any).shippingAddress) {
          try {
            const parsed = JSON.parse((order as any).shippingAddress);
            // Try new format first
            if (parsed.street) {
              shippingStreet = parsed.street || "";
              shippingCity = parsed.city || "";
              shippingState = parsed.state || "";
              shippingZipCode = parsed.zipCode || "";
              shippingCountry = normalizeCountryCode(parsed.country || "US");
              shippingPhone = parsed.phone || "";
              shippingContact = parsed.contactName || "";
              shippingEmail = parsed.email || "";
            } else {
              // Fallback to old format (address field)
              shippingStreet = parsed.address || "";
            }
          } catch {
            shippingStreet = (order as any).shippingAddress;
          }
        }

        // Parse billing address if it's JSON
        let billingStreet = "";
        let billingCity = "";
        let billingState = "";
        let billingZipCode = "";
        let billingCountry = "US";
        let billingPhone = "";
        let billingContact = "";
        let billingEmail = "";
        if ((order as any).billingAddress) {
          try {
            const parsed = JSON.parse((order as any).billingAddress);
            if (parsed.street) {
              billingStreet = parsed.street || "";
              billingCity = parsed.city || "";
              billingState = parsed.state || "";
              billingZipCode = parsed.zipCode || "";
              billingCountry = normalizeCountryCode(parsed.country || "US");
              billingPhone = parsed.phone || "";
              billingContact = parsed.contactName || "";
              billingEmail = parsed.email || "";
            } else {
              // Fallback to old format
              billingStreet = parsed.address || "";
            }
          } catch {
            billingStreet = (order as any).billingAddress;
          }
        }

        setFormData({
          companyId: order.companyId || "",
          contactId: (order as any).contactId || "",
          assignedUserId: (order as any).assignedUserId || "",
          orderType: order.orderType || "quote",
          inHandsDate: order.inHandsDate ? new Date(order.inHandsDate).toISOString().split('T')[0] : "",
          eventDate: order.eventDate ? new Date(order.eventDate).toISOString().split('T')[0] : "",
          supplierInHandsDate: (order as any).supplierInHandsDate ? new Date((order as any).supplierInHandsDate).toISOString().split('T')[0] : "",
          isFirm: (order as any).isFirm || false,
          notes: order.notes || "",
          supplierNotes: (order as any).supplierNotes || "",
          additionalInformation: (order as any).additionalInformation || "",
          orderDiscount: (order as any).orderDiscount || "0",
          billingContact,
          billingEmail,
          billingStreet,
          billingCity,
          billingState,
          billingZipCode,
          billingCountry,
          billingPhone,
          shippingContact,
          shippingEmail,
          shippingStreet,
          shippingCity,
          shippingState,
          shippingZipCode,
          shippingCountry,
          shippingPhone,
        });
      } else {
        setFormData({
          companyId: initialCompanyId || "",
          contactId: "",
          assignedUserId: currentUser?.id || "",
          orderType: "quote",
          inHandsDate: "",
          eventDate: "",
          supplierInHandsDate: "",
          isFirm: false,
          notes: "",
          supplierNotes: "",
          additionalInformation: "",
          orderDiscount: "0",
          billingContact: "",
          billingEmail: "",
          billingStreet: "",
          billingCity: "",
          billingState: "",
          billingZipCode: "",
          billingCountry: "US",
          billingPhone: "",
          shippingContact: "",
          shippingEmail: "",
          shippingStreet: "",
          shippingCity: "",
          shippingState: "",
          shippingZipCode: "",
          shippingCountry: "US",
          shippingPhone: "",
        });
        setOrderItems([]);
      }
    }
  }, [open, order, initialCompanyId, currentUser]); // depend on open, order, initialCompanyId, and currentUser

  // Auto-select contact when editing and contacts load
  useEffect(() => {
    if (open && order && contacts.length > 0 && !formData.contactId) {
      const companyContacts = contacts.filter((c: any) => c.companyId === order.companyId);
      const primaryContact = companyContacts.find((c: any) => c.isPrimary);
      const orderContactId = (order as any).contactId || primaryContact?.id || "";
      if (orderContactId) {
        setFormData((prev) => ({ ...prev, contactId: orderContactId }));
      }
    }
  }, [open, order, contacts, formData.contactId]);

  // Helper to update specific fields
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Sync shipping address with billing when checkbox is checked
  useEffect(() => {
    if (sameAsBilling) {
      setFormData((prev) => ({
        ...prev,
        shippingContact: prev.billingContact,
        shippingEmail: prev.billingEmail,
        shippingStreet: prev.billingStreet,
        shippingCity: prev.billingCity,
        shippingState: prev.billingState,
        shippingZipCode: prev.billingZipCode,
        shippingCountry: prev.billingCountry,
        shippingPhone: prev.billingPhone,
      }));
    }
  }, [sameAsBilling, formData.billingContact, formData.billingEmail, formData.billingStreet, formData.billingCity, formData.billingState, formData.billingZipCode, formData.billingCountry, formData.billingPhone]);

  // Auto-fill billing and shipping address when contact is selected
  useEffect(() => {
    if (formData.contactId && contacts.length > 0) {
      const selectedContact = contacts.find((c: any) => c.id === formData.contactId);
      if (selectedContact) {
        const contactFullName = `${selectedContact.firstName} ${selectedContact.lastName}`;
        const contactEmail = selectedContact.email || "";

        // Parse billing address from contact if available
        if (selectedContact.billingAddress) {
          try {
            const billingAddr = JSON.parse(selectedContact.billingAddress);
            setFormData((prev) => ({
              ...prev,
              billingContact: contactFullName,
              billingEmail: contactEmail,
              billingStreet: billingAddr.street || "",
              billingCity: billingAddr.city || "",
              billingState: billingAddr.state || "",
              billingZipCode: billingAddr.zipCode || "",
              billingCountry: normalizeCountryCode(billingAddr.country || "US"),
              billingPhone: selectedContact.phone || "",
            }));
          } catch {
            // If not JSON, just set contact info and phone
            setFormData((prev) => ({
              ...prev,
              billingContact: contactFullName,
              billingEmail: contactEmail,
              billingPhone: selectedContact.phone || "",
            }));
          }
        } else {
          // Just set contact info and phone if no billing address
          setFormData((prev) => ({
            ...prev,
            billingContact: contactFullName,
            billingEmail: contactEmail,
            billingPhone: selectedContact.phone || "",
          }));
        }

        // Parse shipping address from contact if available
        if (selectedContact.shippingAddress) {
          try {
            const shippingAddr = JSON.parse(selectedContact.shippingAddress);
            setFormData((prev) => ({
              ...prev,
              shippingContact: contactFullName,
              shippingEmail: contactEmail,
              shippingStreet: shippingAddr.street || "",
              shippingCity: shippingAddr.city || "",
              shippingState: shippingAddr.state || "",
              shippingZipCode: shippingAddr.zipCode || "",
              shippingCountry: normalizeCountryCode(shippingAddr.country || "US"),
              shippingPhone: shippingAddr.phone || "",
            }));
          } catch {
            // If not JSON, just set contact info
            setFormData((prev) => ({
              ...prev,
              shippingContact: contactFullName,
              shippingEmail: contactEmail,
            }));
          }
        } else {
          // Just set contact info if no shipping address
          setFormData((prev) => ({
            ...prev,
            shippingContact: contactFullName,
            shippingEmail: contactEmail,
          }));
        }
      }
    }
  }, [formData.contactId, contacts]);

  // Populate order items when editing
  useEffect(() => {
    if (open && order && existingOrderItems.length > 0) {
      const formattedItems = existingOrderItems.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.productSku,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice || "0"),
        discount: 0, // Calculate from prices if needed
        totalPrice: parseFloat(item.totalPrice || "0"),
        supplierId: item.supplierId,
        color: item.color || "",
        size: item.size || "",
        imprintLocation: item.imprintLocation || "",
        imprintMethod: item.imprintMethod || "",
        notes: item.notes || "",
      }));
      setOrderItems(formattedItems);
    }
  }, [open, order, existingOrderItems]);

  // Reset items only when modal first opens for new order
  useEffect(() => {
    if (open && !order) {
      setOrderItems([]);
    }
  }, [open, order?.id]); // Only depend on open and order.id, not order object

  // Helper to ensure array format
  const ensureArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Filter products based on search
  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Add product to order items
  const addProduct = (product: any) => {
    // Warn if product doesn't have a supplier
    if (!product.supplierId) {
      toast({
        title: "Warning: No Vendor Assigned",
        description: `Product "${product.name}" doesn't have a vendor assigned. Please update the product in the catalog to assign a vendor.`,
        variant: "default",
      });
    }

    // Get first color and size from arrays if available
    const colorsArray = ensureArray(product.colors);
    const sizesArray = ensureArray(product.sizes);

    const firstColor = colorsArray.length > 0 ? colorsArray[0] : "";
    const firstSize = sizesArray.length > 0 ? sizesArray[0] : "";

    const newItem = {
      id: `temp-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: parseFloat(product.basePrice || "0"),
      discount: 0,
      totalPrice: parseFloat(product.basePrice || "0"),
      supplierId: product.supplierId || null,
      color: firstColor,
      size: firstSize,
      imprintLocation: "",
      imprintMethod: "",
      notes: "",
      // Store available colors/sizes for selection
      availableColors: colorsArray,
      availableSizes: sizesArray,
    };

    setOrderItems(prev => [...prev, newItem]);
    setEditingItemId(newItem.id);
    setProductSearch("");
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    setOrderItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
          : item
      )
    );
  };

  // Update item unit price
  const updateItemPrice = (itemId: string, unitPrice: number) => {
    setOrderItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const discountAmount = (unitPrice * item.quantity * item.discount) / 100;
          const totalPrice = (unitPrice * item.quantity) - discountAmount;
          return { ...item, unitPrice, totalPrice };
        }
        return item;
      })
    );
  };

  // Update item discount
  const updateItemDiscount = (itemId: string, discount: number) => {
    setOrderItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const discountAmount = (item.unitPrice * item.quantity * discount) / 100;
          const totalPrice = (item.unitPrice * item.quantity) - discountAmount;
          return { ...item, discount, totalPrice };
        }
        return item;
      })
    );
  };

  // Update item variant field
  const updateItemVariant = (itemId: string, field: string, value: string) => {
    setOrderItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setOrderItems(items => items.filter(item => item.id !== itemId));
  };

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const orderDiscountAmount = (subtotal * parseFloat(formData.orderDiscount || "0")) / 100;
  const total = subtotal - orderDiscountAmount;

  // Calculate margin (assuming 30% cost for now - should be from product cost)
  const estimatedCost = subtotal * 0.70; // 70% of selling price
  const profit = total - estimatedCost;
  const marginPercent = total > 0 ? (profit / total) * 100 : 0;

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: (newOrder) => {
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onOpenChange(false);

      // Redirect to the project page
      if (newOrder.id) {
        setLocation(`/project/${newOrder.id}`);
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      // Only send fields that are being updated
      const payload: any = { ...data };

      // Convert date strings to Date objects, or set to null if empty
      if (payload.inHandsDate) {
        payload.inHandsDate = new Date(payload.inHandsDate);
      } else if (payload.inHandsDate === "") {
        payload.inHandsDate = null;
      }

      if (payload.eventDate) {
        payload.eventDate = new Date(payload.eventDate);
      } else if (payload.eventDate === "") {
        payload.eventDate = null;
      }

      if (payload.supplierInHandsDate) {
        payload.supplierInHandsDate = new Date(payload.supplierInHandsDate);
      } else if (payload.supplierInHandsDate === "") {
        payload.supplierInHandsDate = null;
      }

      // Include firm in-hands date flag
      payload.isFirm = payload.isFirm || false;

      const response = await apiRequest("PATCH", `/api/orders/${order?.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] }); // Refresh supplier data
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyId) {
      toast({
        title: "Validation Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    const payload: any = {
      ...formData,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
    };

    // Convert date strings to Date objects or null
    if (formData.inHandsDate) {
      payload.inHandsDate = new Date(formData.inHandsDate);
    } else {
      payload.inHandsDate = null;
    }

    if (formData.eventDate) {
      payload.eventDate = new Date(formData.eventDate);
    } else {
      payload.eventDate = null;
    }

    if (formData.supplierInHandsDate) {
      payload.supplierInHandsDate = new Date(formData.supplierInHandsDate);
    } else {
      payload.supplierInHandsDate = null;
    }

    // Include firm in-hands date flag
    payload.isFirm = formData.isFirm;

    // Prepare billing address with contact info (always build JSON so phone/country changes are saved)
    const hasBillingData = formData.billingStreet || formData.billingCity || formData.billingPhone || formData.billingContact || formData.billingEmail;
    if (hasBillingData) {
      payload.billingAddress = JSON.stringify({
        street: formData.billingStreet,
        city: formData.billingCity,
        state: formData.billingState,
        zipCode: formData.billingZipCode,
        country: formData.billingCountry,
        phone: formData.billingPhone,
        contactName: formData.billingContact,
        email: formData.billingEmail,
      });
    }

    // Prepare shipping address with contact info (always build JSON so phone/country changes are saved)
    const hasShippingData = formData.shippingStreet || formData.shippingCity || formData.shippingPhone || formData.shippingContact || formData.shippingEmail;
    if (hasShippingData) {
      payload.shippingAddress = JSON.stringify({
        street: formData.shippingStreet,
        city: formData.shippingCity,
        state: formData.shippingState,
        zipCode: formData.shippingZipCode,
        country: formData.shippingCountry,
        phone: formData.shippingPhone,
        contactName: formData.shippingContact,
        email: formData.shippingEmail,
      });
    }

    // Remove individual billing/shipping form fields that are not DB columns
    delete payload.billingContact;
    delete payload.billingEmail;
    delete payload.billingStreet;
    delete payload.billingCity;
    delete payload.billingState;
    delete payload.billingZipCode;
    delete payload.billingCountry;
    delete payload.billingPhone;
    delete payload.shippingContact;
    delete payload.shippingEmail;
    delete payload.shippingStreet;
    delete payload.shippingCity;
    delete payload.shippingState;
    delete payload.shippingZipCode;
    delete payload.shippingCountry;
    delete payload.shippingPhone;

    // Only add items to payload when creating new order
    // When editing, items should be managed via the Products tab
    if (!order) {
      payload.items = orderItems.map(item => ({
        productId: item.productId,
        supplierId: item.supplierId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: item.totalPrice.toFixed(2),
        color: item.color || null,
        size: item.size || null,
        imprintLocation: item.imprintLocation || null,
        imprintMethod: item.imprintMethod || null,
        notes: item.notes || null,
      }));
    }

    if (order) {
      updateOrderMutation.mutate(payload);
    } else {
      createOrderMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="max-w-7xl max-h-screen h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? `Edit Order ${order.orderNumber || ''}` : "Create New Quote / Sales Order"}</DialogTitle>
        </DialogHeader>
        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer, Contact, and Order Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <Popover open={openCustomerCombo} onOpenChange={setOpenCustomerCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCustomerCombo}
                    className="w-full justify-between"
                  >
                    {formData.companyId
                      ? companies?.find((company) => company.id === formData.companyId)?.name
                      : "Select customer..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {companies?.map((company) => {
                        const contactCount = contacts.filter((c: any) => c.companyId === company.id).length;
                        return (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => {
                              handleFieldChange("companyId", company.id);
                              setOpenCustomerCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.companyId === company.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex-1">
                              <div>{company.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {contactCount} {contactCount === 1 ? 'contact' : 'contacts'}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="contactId">Contact Person</Label>
              <Select
                value={formData.contactId}
                onValueChange={(value) => handleFieldChange("contactId", value)}
                disabled={!formData.companyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts
                    .filter((c: any) => c.companyId === formData.companyId)
                    .map((contact: any) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName}
                        {contact.isPrimary && " (Primary)"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>


          </div>

          {/* Sales Rep Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="assignedUserId">Sales Rep</Label>
              <Select
                value={formData.assignedUserId}
                onValueChange={(value) => handleFieldChange("assignedUserId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sales rep..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="orderType">Order Type</Label>
              <Select
                value={formData.orderType}
                onValueChange={(value) => handleFieldChange("orderType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="sales_order">Sales Order</SelectItem>
                  <SelectItem value="rush_order">Rush Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Order Description</Label>
              <Textarea
                id="notes"
                placeholder="General order information and instructions..."
                value={formData.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierNotes">Supplier Notes</Label>
                <Textarea
                  id="supplierNotes"
                  placeholder="Notes visible only to suppliers on purchase orders..."
                  value={formData.supplierNotes}
                  onChange={(e) => handleFieldChange("supplierNotes", e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Only visible to suppliers</p>
              </div>

              <div>
                <Label htmlFor="additionalInformation">Additional Information</Label>
                <Textarea
                  id="additionalInformation"
                  placeholder="Any other relevant details..."
                  value={formData.additionalInformation}
                  onChange={(e) => handleFieldChange("additionalInformation", e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">General additional information</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold">Shipping Details</h3>
          </div>
          {/* Customer Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="inHandsDate">Customer IHD (In-Hands Date)</Label>
              <Input
                id="inHandsDate"
                type="date"
                value={formData.inHandsDate}
                onChange={(e) => handleFieldChange("inHandsDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => handleFieldChange("eventDate", e.target.value)}
              />
            </div>
          </div>

          {/* Supplier Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="supplierInHandsDate">Supplier IHD (In-Hands Date)</Label>
              <Input
                id="supplierInHandsDate"
                type="date"
                value={formData.supplierInHandsDate}
                onChange={(e) => handleFieldChange("supplierInHandsDate", e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Visible to supplier on purchase orders</p>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="isFirm"
                checked={formData.isFirm}
                onCheckedChange={(checked) => handleFieldChange("isFirm", checked)}
              />
              <Label htmlFor="isFirm" className="text-sm font-normal cursor-pointer">
                Firm In-Hands Date
              </Label>
            </div>
          </div>

          {/* Addresses Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Billing Address Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Billing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="billingStreet">Street Address</Label>
                  <AddressAutocomplete
                    id="billingStreet"
                    value={formData.billingStreet}
                    onChange={(val) => handleFieldChange("billingStreet", val)}
                    onAddressSelect={(addr) => {
                      handleFieldChange("billingCity", addr.city);
                      handleFieldChange("billingState", addr.state);
                      handleFieldChange("billingZipCode", addr.zipCode);
                      handleFieldChange("billingCountry", normalizeCountryCode(addr.country));
                    }}
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <Label htmlFor="billingCity">City</Label>
                  <Input
                    id="billingCity"
                    placeholder="City"
                    value={formData.billingCity}
                    onChange={(e) => handleFieldChange("billingCity", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="billingState">State</Label>
                  <Input
                    id="billingState"
                    placeholder="CA"
                    value={formData.billingState}
                    onChange={(e) => handleFieldChange("billingState", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="billingZipCode">ZIP Code</Label>
                  <Input
                    id="billingZipCode"
                    placeholder="12345"
                    value={formData.billingZipCode}
                    onChange={(e) => handleFieldChange("billingZipCode", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="billingCountry">Country</Label>
                  <Select
                    value={formData.billingCountry}
                    onValueChange={(value) => handleFieldChange("billingCountry", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="MX">Mexico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="billingPhone">Billing Phone</Label>
                  <Input
                    id="billingPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.billingPhone}
                    onChange={(e) => handleFieldChange("billingPhone", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold">Shipping Address</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAsBilling"
                    checked={sameAsBilling}
                    onCheckedChange={(checked) => setSameAsBilling(checked as boolean)}
                  />
                  <Label htmlFor="sameAsBilling" className="text-sm font-normal cursor-pointer">
                    Same as Billing Address
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="shippingStreet">Street Address</Label>
                  <AddressAutocomplete
                    id="shippingStreet"
                    value={formData.shippingStreet}
                    onChange={(val) => handleFieldChange("shippingStreet", val)}
                    onAddressSelect={(addr) => {
                      handleFieldChange("shippingCity", addr.city);
                      handleFieldChange("shippingState", addr.state);
                      handleFieldChange("shippingZipCode", addr.zipCode);
                      handleFieldChange("shippingCountry", normalizeCountryCode(addr.country));
                    }}
                    placeholder="123 Main St"
                    disabled={sameAsBilling}
                  />
                </div>
                <div>
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    placeholder="City"
                    value={formData.shippingCity}
                    onChange={(e) => handleFieldChange("shippingCity", e.target.value)}
                    disabled={sameAsBilling}
                  />
                </div>
                <div>
                  <Label htmlFor="shippingState">State</Label>
                  <Input
                    id="shippingState"
                    placeholder="CA"
                    value={formData.shippingState}
                    onChange={(e) => handleFieldChange("shippingState", e.target.value)}
                    disabled={sameAsBilling}
                  />
                </div>
                <div>
                  <Label htmlFor="shippingZipCode">ZIP Code</Label>
                  <Input
                    id="shippingZipCode"
                    placeholder="12345"
                    value={formData.shippingZipCode}
                    onChange={(e) => handleFieldChange("shippingZipCode", e.target.value)}
                    disabled={sameAsBilling}
                  />
                </div>
                <div>
                  <Label htmlFor="shippingCountry">Country</Label>
                  <Select
                    value={formData.shippingCountry}
                    onValueChange={(value) => handleFieldChange("shippingCountry", value)}
                    disabled={sameAsBilling}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="MX">Mexico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="shippingPhone">Shipping Phone</Label>
                  <Input
                    id="shippingPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.shippingPhone}
                    onChange={(e) => handleFieldChange("shippingPhone", e.target.value)}
                    disabled={sameAsBilling}
                  />
                </div>
              </div>
            </div>
          </div>




          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-swag-primary hover:bg-swag-primary/90"
              disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
            >
              {order ? (
                updateOrderMutation.isPending ? "Updating..." : "Update Order"
              ) : (
                createOrderMutation.isPending ? "Creating..." : "Create Order"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
