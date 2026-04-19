import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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

export function useGenerateApproval(projectId: string | number) {
  return useMutation({
    mutationFn: (payload: Parameters<typeof requests.generateApproval>[1]) =>
      requests.generateApproval(projectId, payload),
  });
}

export function useCalculateTax(projectId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => requests.calculateTax(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
  });
}

export function usePostProductComment(projectId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { orderItemId: string; content: string }) =>
      requests.postProductComment(projectId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.productComments(projectId) }),
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

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (payload: Record<string, any>) => requests.createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Project created" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Failed to create project", variant: "destructive" });
    },
  });
}

export function useUploadProjectFiles(projectId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => requests.uploadProjectFiles(projectId, formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.files(projectId) }),
  });
}

export function useLinkLibraryFiles(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { mediaLibraryIds: string[]; fileType: string }) =>
      requests.linkLibraryFiles(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.files(projectId) });
      toast({ title: "Files added", description: "Files from library have been linked to this order." });
    },
    onError: (error: Error) => toast({ title: "Failed to add files", description: error.message, variant: "destructive" }),
  });
}

export function useDeleteProjectFile(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (fileId: string) => requests.deleteProjectFile(projectId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.files(projectId) });
      toast({ title: "File deleted", description: "File has been deleted successfully" });
    },
    onError: (error: Error) => toast({ title: "Delete failed", description: error.message, variant: "destructive" }),
  });
}

export function useUnlockSection(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (sectionKey: string) => {
      const order = await requests.fetchProject(projectId);
      const currentStageData = order.stageData || {};
      const updatedStageData = {
        ...currentStageData,
        unlocks: {
          ...(currentStageData.unlocks || {}),
          [sectionKey]: { unlockedAt: new Date().toISOString() },
        },
      };
      await requests.updateProject(projectId, { stageData: updatedStageData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast({ title: "Section unlocked", description: "This action has been logged." });
    },
    onError: () => toast({ title: "Failed to unlock section", variant: "destructive" }),
  });
}

export function useUpdateProjectStage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ projectId, updates }: { projectId: string; updates: Record<string, any> }) =>
      requests.updateProject(projectId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      toast({ title: "Stage updated successfully" });
    },
    onError: () => toast({ title: "Failed to update stage", variant: "destructive" }),
  });
}
