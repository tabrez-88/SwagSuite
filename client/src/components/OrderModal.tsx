import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrderModal({ open, onOpenChange }: OrderModalProps) {
  const [formData, setFormData] = useState({
    companyId: "",
    orderType: "quote",
    inHandsDate: "",
    eventDate: "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies } = useQuery({
    queryKey: ["/api/companies"],
    enabled: open,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onOpenChange(false);
      setFormData({
        companyId: "",
        orderType: "quote",
        inHandsDate: "",
        eventDate: "",
        notes: "",
      });
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

    createOrderMutation.mutate({
      ...formData,
      inHandsDate: formData.inHandsDate ? new Date(formData.inHandsDate) : null,
      eventDate: formData.eventDate ? new Date(formData.eventDate) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer and Order Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select 
                value={formData.companyId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company: any) => (
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, orderType: value }))}
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

          {/* Product Search Placeholder */}
          <div>
            <Label htmlFor="productSearch">Product Search</Label>
            <div className="relative">
              <Input
                placeholder="Search products from ASI, ESP, SAGE databases..."
                className="pr-10"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                🔍
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Product integration with ASI/ESP/SAGE will be implemented
            </p>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="inHandsDate">In-Hands Date</Label>
              <Input
                type="date"
                value={formData.inHandsDate}
                onChange={(e) => setFormData(prev => ({ ...prev, inHandsDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              placeholder="Additional order information..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
