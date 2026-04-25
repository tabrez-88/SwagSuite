import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "@/services/projects/keys";
import { invoiceKeys } from "./keys";
import * as requests from "./requests";

function useInvalidateInvoice(projectId: string | number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: invoiceKeys.byOrder(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  };
}

export function useCreateInvoice(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(projectId);
  return useMutation({
    mutationFn: () => requests.createInvoice(projectId),
    onSuccess: () => { invalidate(); toast({ title: "Invoice created successfully" }); },
    onError: () => toast({ title: "Failed to create invoice", variant: "destructive" }),
  });
}

export function useUpdateInvoiceDueDate(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(projectId);
  return useMutation({
    mutationFn: (dueDate: string) => requests.updateInvoice(projectId, { dueDate }),
    onSuccess: () => { invalidate(); toast({ title: "Due date updated" }); },
    onError: () => toast({ title: "Failed to update due date", variant: "destructive" }),
  });
}

export function useUpdateInvoiceNotes(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(projectId);
  return useMutation({
    mutationFn: (notes: string) => requests.updateInvoice(projectId, { notes }),
    onSuccess: () => { invalidate(); toast({ title: "Notes updated" }); },
    onError: () => toast({ title: "Failed to update notes", variant: "destructive" }),
  });
}

export function useRecordManualPayment(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(projectId);
  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string | number; data: Record<string, any> }) =>
      requests.recordManualPayment(invoiceId, data),
    onSuccess: () => { invalidate(); toast({ title: "Payment recorded" }); },
    onError: () => toast({ title: "Failed to record payment", variant: "destructive" }),
  });
}

export function useCreateStripePayment(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(projectId);
  return useMutation({
    mutationFn: (invoiceId: string | number) => requests.createStripePayment(invoiceId),
    onSuccess: () => { invalidate(); toast({ title: "Stripe invoice created!" }); },
    onError: () => toast({ title: "Failed to create Stripe payment", variant: "destructive" }),
  });
}

export function useCreateDepositInvoice(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(projectId);
  return useMutation({
    mutationFn: () => requests.createDepositInvoice(projectId),
    onSuccess: () => { invalidate(); toast({ title: "Deposit invoice created" }); },
    onError: () => toast({ title: "Failed to create deposit invoice", variant: "destructive" }),
  });
}

export function useCreateFinalInvoice(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateInvoice(projectId);
  return useMutation({
    mutationFn: () => requests.createFinalInvoice(projectId),
    onSuccess: () => { invalidate(); toast({ title: "Final invoice created" }); },
    onError: () => toast({ title: "Failed to create final invoice", variant: "destructive" }),
  });
}
