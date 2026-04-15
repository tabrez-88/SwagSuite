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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldAlert } from "lucide-react";

interface VendorBlockDialogProps {
  open: boolean;
  supplierName: string;
  approvalReason: string;
  setApprovalReason: (v: string) => void;
  onDismiss: () => void;
  vendorApprovalMutation: { isPending: boolean; mutate: () => void };
}

export function VendorBlockDialog({
  open,
  supplierName,
  approvalReason,
  setApprovalReason,
  onDismiss,
  vendorApprovalMutation,
}: VendorBlockDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onDismiss(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Vendor Not Approved
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                <span className="font-semibold">{supplierName}</span> is currently marked as "Do Not Order."
                You cannot add products from this vendor without admin approval.
              </p>
              <p>Would you like to send an approval request to an administrator?</p>
              <div className="pt-1">
                <Label htmlFor="approval-reason" className="text-sm font-medium">Reason (optional)</Label>
                <Textarea
                  id="approval-reason"
                  placeholder="Explain why you need to order from this vendor..."
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={vendorApprovalMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); vendorApprovalMutation.mutate(); }}
            disabled={vendorApprovalMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {vendorApprovalMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Request Approval
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
