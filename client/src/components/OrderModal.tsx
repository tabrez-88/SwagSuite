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
        if ((order as any).shippingAddress) {
          try {
            const parsed = JSON.parse((order as any).shippingAddress);
            // Try new format first
            if (parsed.street) {
              shippingStreet = parsed.street || "";
              shippingCity = parsed.city || "";
              shippingState = parsed.state || "";
              shippingZipCode = parsed.zipCode || "";
              shippingCountry = parsed.country || "US";
              shippingPhone = parsed.phone || "";
            } else {
              // Fallback to old format (address field)
              shippingStreet = parsed.address || "";
            }
          } catch {
            shippingStreet = (order as any).shippingAddress;
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
          orderDiscount: (order as any).orderDiscount || "0",
          billingContact: (order as any).billingContact || "",
          billingEmail: (order as any).billingEmail || "",
          billingStreet: "",
          billingCity: "",
          billingState: "",
          billingZipCode: "",
          billingCountry: "US",
          billingPhone: "",
          shippingContact: (order as any).shippingContact || "",
          shippingEmail: (order as any).shippingEmail || "",
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
              billingCountry: billingAddr.country || "US",
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
              shippingCountry: shippingAddr.country || "US",
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

    // Prepare billing address with contact info
    if (formData.billingStreet || formData.billingCity) {
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

    // Prepare shipping address with contact info
    if (formData.shippingStreet || formData.shippingCity) {
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

    // Add items to payload (both create and update)
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

          {/* Product Selection - Only show when editing existing order */}
          {order && (
            <div>
              <Label>Add Products</Label>
              <div className="relative">
                <Input
                  placeholder="Search products by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pr-10"
                />
                {productSearch && filteredProducts.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.slice(0, 10).map((product: any) => {
                      const colorsArray = ensureArray(product.colors);
                      const sizesArray = ensureArray(product.sizes);

                      return (
                        <div
                          key={product.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addProduct(product);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between items-start border-b last:border-b-0 cursor-pointer"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku || 'No SKU'}</div>
                            <div className="text-xs text-gray-400 mt-1 space-x-2">
                              {colorsArray.length > 0 && (
                                <span>Colors: {colorsArray.slice(0, 3).join(', ')}{colorsArray.length > 3 ? '...' : ''}</span>
                              )}
                              {sizesArray.length > 0 && (
                                <span>• Sizes: {sizesArray.slice(0, 3).join(', ')}{sizesArray.length > 3 ? '...' : ''}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-swag-primary font-semibold ml-4">
                            ${parseFloat(product.basePrice || "0").toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items Table */}
          {orderItems.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Price</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">Disc%</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Total</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Edit</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orderItems.map((item) => {
                      const itemSupplier = suppliers.find((s: any) => s.id === item.supplierId);
                      const isEditing = editingItemId === item.id;

                      return (
                        <>
                          <tr key={item.id} className={isEditing ? "bg-blue-50" : ""}>
                            <td className="px-3 py-3">
                              <div className="text-sm font-medium">{item.productName}</div>
                              <div className="text-xs text-gray-500">{item.sku || '-'}</div>
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">
                              {itemSupplier ? itemSupplier.name : 'No vendor'}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-20 text-right text-sm h-8"
                              />
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                className="w-28 text-right text-sm h-8"
                              />
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={item.discount}
                                onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                                className="w-20 text-right text-sm h-8"
                              />
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-sm">
                              ${item.totalPrice.toFixed(2)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingItemId(isEditing ? null : item.id)}
                                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                {isEditing ? "Done" : "Details"}
                              </Button>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>

                          {/* Item Details Row (collapsed/expanded) */}
                          {isEditing && (
                            <tr className="bg-blue-50">
                              <td colSpan={8} className="px-3 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <Label htmlFor={`color-${item.id}`} className="text-xs">Color</Label>
                                    {item.availableColors && item.availableColors.length > 0 ? (
                                      <Select
                                        value={item.color}
                                        onValueChange={(value) => updateItemVariant(item.id, "color", value)}
                                      >
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue placeholder="Select color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {item.availableColors.map((color: string) => (
                                            <SelectItem key={color} value={color}>
                                              {color}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        id={`color-${item.id}`}
                                        placeholder="Navy, Red, etc."
                                        value={item.color}
                                        onChange={(e) => updateItemVariant(item.id, "color", e.target.value)}
                                        className="text-sm h-8"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <Label htmlFor={`size-${item.id}`} className="text-xs">Size</Label>
                                    {item.availableSizes && item.availableSizes.length > 0 ? (
                                      <Select
                                        value={item.size}
                                        onValueChange={(value) => updateItemVariant(item.id, "size", value)}
                                      >
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {item.availableSizes.map((size: string) => (
                                            <SelectItem key={size} value={size}>
                                              {size}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        id={`size-${item.id}`}
                                        placeholder="S, M, L, XL, etc."
                                        value={item.size}
                                        onChange={(e) => updateItemVariant(item.id, "size", e.target.value)}
                                        className="text-sm h-8"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <Label htmlFor={`imprintLocation-${item.id}`} className="text-xs">Imprint Location</Label>
                                    <Input
                                      id={`imprintLocation-${item.id}`}
                                      placeholder="Front, Back, Left Chest..."
                                      value={item.imprintLocation}
                                      onChange={(e) => updateItemVariant(item.id, "imprintLocation", e.target.value)}
                                      className="text-sm h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`imprintMethod-${item.id}`} className="text-xs">Imprint Method</Label>
                                    <Input
                                      id={`imprintMethod-${item.id}`}
                                      placeholder="Screen Print, Embroidery..."
                                      value={item.imprintMethod}
                                      onChange={(e) => updateItemVariant(item.id, "imprintMethod", e.target.value)}
                                      className="text-sm h-8"
                                    />
                                  </div>
                                  <div className="col-span-2 md:col-span-4">
                                    <Label htmlFor={`notes-${item.id}`} className="text-xs">Item Notes</Label>
                                    <Textarea
                                      id={`notes-${item.id}`}
                                      placeholder="Special instructions for this item..."
                                      value={item.notes}
                                      onChange={(e) => updateItemVariant(item.id, "notes", e.target.value)}
                                      className="text-sm"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 px-4 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="orderDiscount" className="text-xs">Order Discount (%)</Label>
                    <span className="text-sm text-gray-500">-${orderDiscountAmount.toFixed(2)}</span>
                  </div>
                  <Input
                    id="orderDiscount"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.orderDiscount}
                    onChange={(e) => handleFieldChange("orderDiscount", e.target.value)}
                    className="text-right h-8"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total:</span>
                  <span className="text-swag-primary">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                  <span>Estimated Margin:</span>
                  <span className={cn(
                    "font-semibold",
                    marginPercent >= 30 ? "text-green-600" : marginPercent >= 20 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {marginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Notes */}
          <div>
            <Label htmlFor="notes">Order Description</Label>
            <Textarea
              id="notes"
              placeholder="Additional order information, special instructions..."
              value={formData.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              rows={3}
            />
          </div>


          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold">Shipping Details</h3>
          </div>
          {/* Customer Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="inHandsDate">Customer Requested In-Hands Date</Label>
              <Input
                id="inHandsDate"
                type="date"
                value={formData.inHandsDate}
                onChange={(e) => handleFieldChange("inHandsDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="eventDate">Customer Event Date</Label>
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
              <Label htmlFor="supplierInHandsDate">Supplier In-Hands Date</Label>
              <Input
                id="supplierInHandsDate"
                type="date"
                value={formData.supplierInHandsDate}
                onChange={(e) => handleFieldChange("supplierInHandsDate", e.target.value)}
              />
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
                  <Input
                    id="billingStreet"
                    placeholder="123 Main St"
                    value={formData.billingStreet}
                    onChange={(e) => handleFieldChange("billingStreet", e.target.value)}
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
                  <Input
                    id="shippingStreet"
                    placeholder="123 Main St"
                    value={formData.shippingStreet}
                    onChange={(e) => handleFieldChange("shippingStreet", e.target.value)}
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
