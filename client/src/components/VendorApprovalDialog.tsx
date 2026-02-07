import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Ban, Send } from "lucide-react";

interface VendorApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: {
    id: string;
    name: string;
  };
  productId?: string;
  orderId?: string;
  onApprovalRequested?: () => void;
  onCancel?: () => void;
}

export function VendorApprovalDialog({
  open,
  onOpenChange,
  vendor,
  productId,
  orderId,
  onApprovalRequested,
  onCancel,
}: VendorApprovalDialogProps) {
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestApprovalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/vendor-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supplierId: vendor.id,
          productId,
          orderId,
          reason,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to request approval");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Approval Request Sent",
        description: "Your request has been sent to the administrator for approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-approvals"] });
      setReason("");
      onOpenChange(false);
      onApprovalRequested?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
    onCancel?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Ban className="h-5 w-5" />
            Restricted Vendor Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">
                  {vendor.name} is marked as "Do Not Order"
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This vendor is not approved for ordering. You need administrator approval before proceeding.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-foreground">
                Reason for requesting approval (optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="Explain why you need to order from this vendor..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => requestApprovalMutation.mutate()}
            disabled={requestApprovalMutation.isPending}
            className="bg-swag-primary hover:bg-swag-primary/90"
          >
            <Send className="h-4 w-4 mr-2" />
            {requestApprovalMutation.isPending ? "Sending..." : "Request Approval"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook to check if a vendor requires approval
export function useVendorApprovalCheck() {
  const checkVendor = async (supplierId: string) => {
    const response = await fetch(`/api/vendor-approvals/check/${supplierId}`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to check vendor approval status");
    }
    return response.json();
  };

  return { checkVendor };
}
