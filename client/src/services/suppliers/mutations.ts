import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { supplierKeys } from "./keys";
import * as requests from "./requests";
import type { VendorFormData, VendorContactFormData } from "@/schemas/crm.schemas";
import type { PreferredBenefits } from "./types";

// ── Shared error handler ─────────────────────────────────────────

function handleMutationError(
  error: unknown,
  toast: ReturnType<typeof useToast>["toast"],
  fallbackMessage: string,
) {
  if (isUnauthorizedError(error as Error)) {
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
    description: fallbackMessage,
    variant: "destructive",
  });
}

// ── Vendor mutations ─────────────────────────────────────────────

export function useCreateVendor() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: VendorFormData) => requests.createVendor(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      toast({ title: "Success", description: "Vendor created successfully" });
    },
    onError: (error) =>
      handleMutationError(error, toast, "Failed to create vendor. Please try again."),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: { id: string; data: Partial<VendorFormData> }) =>
      requests.updateVendor(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      toast({ title: "Success", description: "Vendor updated successfully" });
    },
    onError: (error) =>
      handleMutationError(error, toast, "Failed to update vendor. Please try again."),
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (vendorId: string) => requests.deleteVendor(vendorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      toast({ title: "Success", description: "Vendor deleted successfully" });
    },
    onError: (error) =>
      handleMutationError(error, toast, "Failed to delete vendor. Please try again."),
  });
}

export function useTogglePreferred() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: { vendorId: string; isPreferred: boolean }) =>
      requests.togglePreferred(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      toast({
        title: "Success",
        description: "Vendor preference updated successfully",
      });
    },
    onError: (error) =>
      handleMutationError(
        error,
        toast,
        "Failed to update vendor preference. Please try again.",
      ),
  });
}

export function useUpdateBenefits() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: { vendorId: string; preferredBenefits: PreferredBenefits }) =>
      requests.updateBenefits(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      toast({
        title: "Success",
        description: "Vendor benefits updated successfully",
      });
    },
    onError: (error) =>
      handleMutationError(
        error,
        toast,
        "Failed to update vendor benefits. Please try again.",
      ),
  });
}

// ── Vendor Contact mutations ─────────────────────────────────────

export function useCreateVendorContact(vendorId: string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: VendorContactFormData & { supplierId: string }) =>
      requests.createVendorContact(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.contacts(vendorId!) });
      toast({ title: "Success", description: "Contact added successfully" });
    },
    onError: (error) =>
      handleMutationError(error, toast, "Failed to add contact. Please try again."),
  });
}

export function useUpdateVendorContact(vendorId: string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: { id: string; data: Partial<VendorContactFormData> & { isActive?: boolean } }) =>
      requests.updateVendorContact(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.contacts(vendorId!) });
      toast({ title: "Success", description: "Contact updated successfully" });
    },
    onError: (error) =>
      handleMutationError(error, toast, "Failed to update contact. Please try again."),
  });
}

export function useDeleteVendorContact(vendorId: string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (contactId: string) => requests.deleteVendorContact(contactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.contacts(vendorId!) });
      toast({ title: "Success", description: "Contact deleted successfully" });
    },
    onError: (error) =>
      handleMutationError(error, toast, "Failed to delete contact. Please try again."),
  });
}
