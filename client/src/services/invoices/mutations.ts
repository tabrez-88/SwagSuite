import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { orderKeys } from "@/services/orders/keys";
import { invoiceKeys } from "./keys";
import * as requests from "./requests";

function useInvalidateInvoice(orderId: string | number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: invoiceKeys.byOrder(orderId) });
    queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
  };
}

export function useCreateInvoice(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(orderId);
  return useMutation({
    mutationFn: () => requests.createInvoice(orderId),
    onSuccess: () => { invalidate(); toast({ title: "Invoice created successfully" }); },
    onError: () => toast({ title: "Failed to create invoice", variant: "destructive" }),
  });
}

export function useUpdateInvoiceDueDate(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(orderId);
  return useMutation({
    mutationFn: (dueDate: string) => requests.updateInvoice(orderId, { dueDate }),
    onSuccess: () => { invalidate(); toast({ title: "Due date updated" }); },
    onError: () => toast({ title: "Failed to update due date", variant: "destructive" }),
  });
}

export function useUpdateInvoiceNotes(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(orderId);
  return useMutation({
    mutationFn: (notes: string) => requests.updateInvoice(orderId, { notes }),
    onSuccess: () => { invalidate(); toast({ title: "Notes updated" }); },
    onError: () => toast({ title: "Failed to update notes", variant: "destructive" }),
  });
}

export function useRecordManualPayment(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(orderId);
  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string | number; data: Record<string, any> }) =>
      requests.recordManualPayment(invoiceId, data),
    onSuccess: () => { invalidate(); toast({ title: "Payment recorded" }); },
    onError: () => toast({ title: "Failed to record payment", variant: "destructive" }),
  });
}

export function useCreateStripePayment(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(orderId);
  return useMutation({
    mutationFn: (invoiceId: string | number) => requests.createStripePayment(invoiceId),
    onSuccess: () => { invalidate(); toast({ title: "Stripe invoice created!" }); },
    onError: () => toast({ title: "Failed to create Stripe payment", variant: "destructive" }),
  });
}
