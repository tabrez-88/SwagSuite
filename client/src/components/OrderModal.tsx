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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Company, Order } from "@shared/schema";

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
}

export default function OrderModal({ open, onOpenChange, order }: OrderModalProps) {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    companyId: "",
    orderType: "quote",
    inHandsDate: "",
    eventDate: "",
    notes: "",
    shippingAddress: "",
    billingAddress: "",
  });

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
        });
      } else {
        setFormData({
          companyId: "",
          orderType: "quote",
          inHandsDate: "",
          eventDate: "",
          notes: "",
          shippingAddress: "",
          billingAddress: "",
        });
      }
    }
  }, [open, order]); // depend on open and order

  // Helper to update specific fields
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: open,
  });

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
      const response = await apiRequest("PATCH", `/api/orders/${order?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order?.id}`] });
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

    const payload = {
      ...formData,
      inHandsDate: formData.inHandsDate ? new Date(formData.inHandsDate) : null,
      eventDate: formData.eventDate ? new Date(formData.eventDate) : null,
    };

    if (order) {
      updateOrderMutation.mutate(payload);
    } else {
      createOrderMutation.mutate(payload);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => handleFieldChange("companyId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
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
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
