import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

interface CreateInvoiceButtonProps {
  hasDeposit: boolean;
  depositReceived: boolean;
  createInvoiceMutation: { mutate: () => void; isPending: boolean };
  createDepositInvoiceMutation: { mutate: () => void; isPending: boolean };
  createFinalInvoiceMutation: { mutate: () => void; isPending: boolean };
}

export default function CreateInvoiceButton({
  hasDeposit,
  depositReceived,
  createInvoiceMutation,
  createDepositInvoiceMutation,
  createFinalInvoiceMutation,
}: CreateInvoiceButtonProps) {
  if (hasDeposit && !depositReceived) {
    return (
      <Button
        onClick={() => createDepositInvoiceMutation.mutate()}
        disabled={createDepositInvoiceMutation.isPending}
      >
        {createDepositInvoiceMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        {createDepositInvoiceMutation.isPending ? "Creating..." : "Create Deposit Invoice"}
      </Button>
    );
  }

  if (hasDeposit && depositReceived) {
    return (
      <Button
        onClick={() => createFinalInvoiceMutation.mutate()}
        disabled={createFinalInvoiceMutation.isPending}
      >
        {createFinalInvoiceMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        {createFinalInvoiceMutation.isPending ? "Creating..." : "Create Final Invoice"}
      </Button>
    );
  }

  return (
    <Button
      onClick={() => createInvoiceMutation.mutate()}
      disabled={createInvoiceMutation.isPending}
    >
      {createInvoiceMutation.isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Plus className="w-4 h-4 mr-2" />
      )}
      {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
    </Button>
  );
}
