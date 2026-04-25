import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Banknote, Loader2 } from "lucide-react";

interface ManualPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  paymentReference: string;
  onPaymentReferenceChange: (value: string) => void;
  paymentAmount: string;
  onPaymentAmountChange: (value: string) => void;
  totalAmount: string;
  isPending: boolean;
  onRecordPayment: () => void;
}

export default function ManualPaymentDialog({
  open,
  onOpenChange,
  invoiceNumber,
  paymentMethod,
  onPaymentMethodChange,
  paymentReference,
  onPaymentReferenceChange,
  paymentAmount,
  onPaymentAmountChange,
  totalAmount,
  isPending,
  onRecordPayment,
}: ManualPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Record Manual Payment
          </DialogTitle>
          <DialogDescription>
            Record an offline payment for Invoice #{invoiceNumber}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Payment Method
            </label>
            <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="wire">Wire Transfer</SelectItem>
                <SelectItem value="ach">ACH</SelectItem>
                <SelectItem value="manual_card">Credit Card (Manual)</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Store Credit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Reference # (optional)
            </label>
            <Input
              value={paymentReference}
              onChange={(e) => onPaymentReferenceChange(e.target.value)}
              placeholder="Check #, Wire ref, etc."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Amount
            </label>
            <Input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => onPaymentAmountChange(e.target.value)}
              placeholder={totalAmount}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onRecordPayment} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
