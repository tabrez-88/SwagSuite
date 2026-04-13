import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "./keys";
import * as requests from "./requests";

export function useUpdateProject(projectId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Record<string, any>) => requests.updateProject(projectId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
  });
}

export function useDuplicateProject(projectId: string | number) {
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => requests.duplicateProject(projectId),
    onSuccess: (data: any) => {
      toast({ title: "Project duplicated!", description: `New project #${data.orderNumber || ""}` });
    },
    onError: () => toast({ title: "Failed to duplicate project", variant: "destructive" }),
  });
}

export function useRecalculateTotal(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => requests.recalculateTotal(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast({ title: "Total recalculated" });
    },
    onError: () => toast({ title: "Failed to recalculate total", variant: "destructive" }),
  });
}

export function useReassignProject(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ field, userId }: { field: "assignedUserId" | "csrUserId"; userId: string | null }) =>
      requests.updateProject(projectId, { [field]: userId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      const label = variables.field === "assignedUserId" ? "Sales Rep" : "CSR";
      toast({ title: `${label} updated` });
    },
    onError: () => toast({ title: "Failed to update assignment", variant: "destructive" }),
  });
}

export function useUpdateProjectStatus(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (updates: Record<string, any>) => requests.updateProject(projectId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });
}

export function useSavePresentationSettings(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ stageData }: { stageData: Record<string, any> }) =>
      requests.updateProject(projectId, { stageData }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
    onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
  });
}

export function useCreateShareLink(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => requests.createShareLink(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
    onError: () => toast({ title: "Failed to generate link", variant: "destructive" }),
  });
}

export function useCreatePortalToken(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => requests.createPortalToken(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.portalTokens(projectId) });
      toast({ title: "Portal link created" });
    },
    onError: () => toast({ title: "Failed to create portal link", variant: "destructive" }),
  });
}

function useInvalidateVendorInvoices(projectId: string | number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.vendorInvoices(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.documents(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.activities(projectId) });
  };
}

export function useCreateVendorInvoice(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateVendorInvoices(projectId);
  return useMutation({
    mutationFn: (data: Record<string, any>) => requests.createVendorInvoice(projectId, data),
    onSuccess: () => { invalidate(); toast({ title: "Vendor bill created" }); },
    onError: () => toast({ title: "Failed to create bill", variant: "destructive" }),
  });
}

export function useUpdateVendorInvoice(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateVendorInvoices(projectId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      requests.updateVendorInvoice(projectId, id, data),
    onSuccess: () => { invalidate(); toast({ title: "Vendor bill updated" }); },
    onError: () => toast({ title: "Failed to update bill", variant: "destructive" }),
  });
}
