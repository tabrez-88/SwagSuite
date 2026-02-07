import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Send, CheckCircle2 } from "lucide-react";

interface OrderItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface SendApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  orderItems: OrderItem[];
  defaultClientEmail?: string;
  defaultClientName?: string;
}

export function SendApprovalDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  orderItems,
  defaultClientEmail = "",
  defaultClientName = "",
}: SendApprovalDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientEmail, setClientEmail] = useState(defaultClientEmail);
  const [clientName, setClientName] = useState(defaultClientName);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch existing approvals
  const { data: existingApprovals } = useQuery({
    queryKey: [`/api/orders/${orderId}/approvals`],
    enabled: open,
  });

  // Generate approval links mutation
  const generateApprovalsMutation = useMutation({
    mutationFn: async () => {
      const approvals = [];
      
      // If no items selected, create one approval for entire order
      if (selectedItems.size === 0) {
        const res = await fetch(`/api/orders/${orderId}/generate-approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            clientEmail,
            clientName,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        approvals.push(await res.json());
      } else {
        // Create approval for each selected item
        const itemArray = Array.from(selectedItems);
        for (const itemId of itemArray) {
          const res = await fetch(`/api/orders/${orderId}/generate-approval`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              orderItemId: itemId,
              clientEmail,
              clientName,
            }),
          });
          if (!res.ok) throw new Error(await res.text());
          approvals.push(await res.json());
        }
      }
      
      return approvals;
    },
    onSuccess: (approvals) => {
      toast({
        title: "Approval Links Generated",
        description: `${approvals.length} approval link(s) have been generated. You can now send them via email.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/approvals`] });
      // Don't close dialog - show the generated links
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate approval links",
        variant: "destructive",
      });
    },
  });

  // Send approval emails mutation (placeholder - will implement with email service)
  const sendEmailsMutation = useMutation({
    mutationFn: async (approvals: any[]) => {
      // TODO: Implement email sending with Resend
      // For now, just copy links to clipboard
      const links = approvals.map(a => a.approvalUrl).join("\n\n");
      await navigator.clipboard.writeText(links);
      return approvals;
    },
    onSuccess: () => {
      toast({
        title: "Links Copied",
        description: "Approval links have been copied to clipboard. You can now paste them into your email.",
      });
      onOpenChange(false);
    },
  });

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === orderItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(orderItems.map(item => item.id)));
    }
  };

  const handleGenerateAndSend = () => {
    if (!clientEmail) {
      toast({
        title: "Validation Error",
        description: "Please enter client email",
        variant: "destructive",
      });
      return;
    }

    generateApprovalsMutation.mutate();
  };

  const hasPendingApprovals = Array.isArray(existingApprovals) && existingApprovals.some((a: any) => a.status === "pending");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Artwork Approval - Order #{orderNumber}
          </DialogTitle>
          <DialogDescription>
            Generate unique approval links for client to approve or decline artwork.
            Each product can have its own approval link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientEmail">Client Email *</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="clientName">Client Name (Optional)</Label>
              <Input
                id="clientName"
                type="text"
                placeholder="John Doe"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
          </div>

          {/* Product Selection */}
          {orderItems.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Products to Approve</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedItems.size === orderItems.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                {selectedItems.size === 0 && (
                  <div className="text-sm text-gray-600 p-2 bg-blue-50 rounded">
                    No items selected - will generate one approval link for entire order
                  </div>
                )}
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => handleToggleItem(item.id)}
                    />
                    <label
                      htmlFor={`item-${item.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {item.productName || "Unknown Product"} - Qty: {item.quantity}
                      {item.color && ` - ${item.color}`}
                      {item.size && ` - ${item.size}`}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Approvals Warning */}
          {hasPendingApprovals && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Pending Approvals Exist</p>
                <p className="text-yellow-700">
                  This order already has pending approval links. Generating new links will not affect existing ones.
                </p>
              </div>
            </div>
          )}

          {/* Generated Links Display */}
          {generateApprovalsMutation.isSuccess && generateApprovalsMutation.data && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="font-medium text-green-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Approval Links Generated Successfully
              </p>
              <div className="space-y-2 mt-2">
                {generateApprovalsMutation.data.map((approval: any, idx: number) => (
                  <div key={approval.id} className="bg-white p-2 rounded text-sm">
                    <p className="font-medium text-gray-700">Link {idx + 1}:</p>
                    <p className="text-blue-600 break-all font-mono text-xs">
                      {approval.approvalUrl}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendEmailsMutation.mutate(generateApprovalsMutation.data)}
                className="w-full mt-2"
              >
                Copy All Links to Clipboard
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generateApprovalsMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateAndSend}
            disabled={generateApprovalsMutation.isPending || !clientEmail}
          >
            {generateApprovalsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Generate Approval Links
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
