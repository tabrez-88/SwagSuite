import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
    orderType: "quote",
    inHandsDate: "",
    eventDate: "",
    notes: "",
    shippingAddress: "",
    billingAddress: "",
    trackingNumber: "",
    shippingMethod: "",
    supplierId: "",
    tax: "0",
    shipping: "0",
  });
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [openCustomerCombo, setOpenCustomerCombo] = useState(false);
  const [openSupplierCombo, setOpenSupplierCombo] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset or populate form when opening 
  useEffect(() => {
    if (open) {
      if (order) {
        setFormData({
          companyId: order.companyId || "",
          orderType: order.orderType || "quote",
          inHandsDate: order.inHandsDate ? new Date(order.inHandsDate).toISOString().split('T')[0] : "",
          eventDate: order.eventDate ? new Date(order.eventDate).toISOString().split('T')[0] : "",
          notes: order.notes || "",
          shippingAddress: (order as any).shippingAddress || "",
          billingAddress: (order as any).billingAddress || "",
          trackingNumber: (order as any).trackingNumber || "",
          shippingMethod: (order as any).shippingMethod || "",
          supplierId: (order as any).supplierId || "",
          tax: (order as any).tax || "0",
          shipping: (order as any).shipping || "0",
        });
      } else {
        setFormData({
          companyId: initialCompanyId || "",
          orderType: "quote",
          inHandsDate: "",
          eventDate: "",
          notes: "",
          shippingAddress: "",
          billingAddress: "",
          trackingNumber: "",
          shippingMethod: "",
          supplierId: "",
          tax: "0",
          shipping: "0",
        });
        setOrderItems([]);
      }
    }
  }, [open, order, initialCompanyId]); // depend on open, order, and initialCompanyId

  // Helper to update specific fields
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
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

  // Filter products based on search
  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Add product to order items
  const addProduct = (product: any) => {
    const existingItem = orderItems.find(item => item.productId === product.id);
    if (existingItem) {
      updateItemQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem = {
        id: `temp-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: parseFloat(product.basePrice || "0"),
        totalPrice: parseFloat(product.basePrice || "0"),
      };
      setOrderItems([...orderItems, newItem]);
    }
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
      items.map(item =>
        item.id === itemId
          ? { ...item, unitPrice, totalPrice: unitPrice * item.quantity }
          : item
      )
    );
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setOrderItems(items => items.filter(item => item.id !== itemId));
  };

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = parseFloat(formData.tax || "0");
  const shippingAmount = parseFloat(formData.shipping || "0");
  const total = subtotal + taxAmount + shippingAmount;

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

    if (order) {
      updateOrderMutation.mutate(payload);
    } else {
      // Create order with items
      createOrderMutation.mutate({
        ...payload,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          totalPrice: item.totalPrice.toFixed(2),
        })),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? `Edit Order ${order.orderNumber || ''}` : "Create New Order"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer and Order Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="customer">Customer</Label>
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
                      {companies?.map((company) => (
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
                          {company.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
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
            <div>
              <Label htmlFor="supplier">Vendor/Supplier</Label>
              <Popover open={openSupplierCombo} onOpenChange={setOpenSupplierCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSupplierCombo}
                    className="w-full justify-between"
                  >
                    {formData.supplierId
                      ? suppliers?.find((supplier) => supplier.id === formData.supplierId)?.name
                      : "Select vendor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search vendor..." />
                    <CommandEmpty>No vendor found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {suppliers?.map((supplier) => (
                        <CommandItem
                          key={supplier.id}
                          value={supplier.name}
                          onSelect={() => {
                            handleFieldChange("supplierId", supplier.id);
                            setOpenSupplierCombo(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.supplierId === supplier.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {supplier.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Product Selection */}
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
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.slice(0, 10).map((product: any) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.sku || 'No SKU'}</div>
                      </div>
                      <div className="text-swag-primary font-semibold">
                        ${parseFloat(product.basePrice || "0").toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Items Table */}
          {orderItems.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orderItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.sku || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-20 text-right"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                          className="w-28 text-right"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${item.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pricing Summary */}
              <div className="bg-gray-50 px-4 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax" className="text-xs">Tax Amount</Label>
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.tax}
                      onChange={(e) => handleFieldChange("tax", e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping" className="text-xs">Shipping Amount</Label>
                    <Input
                      id="shipping"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shipping}
                      onChange={(e) => handleFieldChange("shipping", e.target.value)}
                      className="text-right"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total:</span>
                  <span className="text-swag-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}



          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="inHandsDate">In-Hands Date</Label>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="shippingMethod">Shipping Method</Label>
              <Select
                value={formData.shippingMethod}
                onValueChange={(value) => handleFieldChange("shippingMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shipping method..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="USPS">USPS</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                type="text"
                placeholder="Enter tracking number..."
                value={formData.trackingNumber}
                onChange={(e) => handleFieldChange("trackingNumber", e.target.value)}
              />
            </div>
            </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Textarea
                id="shippingAddress"
                placeholder="Enter shipping address..."
                value={formData.shippingAddress}
                onChange={(e) => handleFieldChange("shippingAddress", e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Textarea
                id="billingAddress"
                placeholder="Enter billing address..."
                value={formData.billingAddress}
                onChange={(e) => handleFieldChange("billingAddress", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional order information..."
              value={formData.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          {/* Artwork Upload Placeholder */}
          <div>
            <Label>Artwork Files</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-swag-primary transition-colors">
              <div className="text-gray-400 text-3xl mb-2">☁️</div>
              <p className="text-sm text-gray-600">Drop files here or click to upload</p>
              <p className="text-xs text-gray-500 mt-1">Supports: AI, EPS, PDF, PNG, JPG</p>
              <input
                type="file"
                className="hidden"
                multiple
                accept=".ai,.eps,.pdf,.png,.jpg,.jpeg"
              />
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
