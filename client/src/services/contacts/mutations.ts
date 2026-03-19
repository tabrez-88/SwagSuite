import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { contactKeys } from "./keys";
import { companyKeys } from "../companies/keys";
import { supplierKeys } from "../suppliers/keys";
import * as requests from "./requests";

/**
 * Create contact from CRM contacts page (may have company or supplier association).
 */
export function useCreateContact() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: requests.createContact,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      // Cross-invalidate company/supplier if associated
      if (variables.associationType === "company" && variables.companyId) {
        qc.invalidateQueries({ queryKey: companyKeys.detail(variables.companyId) });
      }
      if (variables.associationType === "vendor" && variables.supplierId) {
        qc.invalidateQueries({ queryKey: supplierKeys.all });
      }
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to create contact. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Create contact scoped to a company (from ContactsManager on company detail).
 */
export function useCreateCompanyContact(companyId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: requests.createCompanyContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.byCompany(companyId) });
      qc.invalidateQueries({ queryKey: companyKeys.all });
      toast({
        title: "Contact created",
        description: "The contact has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create contact: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

/**
 * Update contact (from ContactsManager on company detail).
 */
export function useUpdateContact(companyId?: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: requests.updateContact,
    onSuccess: () => {
      if (companyId) {
        qc.invalidateQueries({ queryKey: contactKeys.byCompany(companyId) });
      }
      qc.invalidateQueries({ queryKey: contactKeys.all });
      qc.invalidateQueries({ queryKey: companyKeys.all });
      toast({
        title: "Contact updated",
        description: "The contact has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      console.error("Update contact error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Delete contact — used from both CRM contacts page and ContactsManager.
 * When companyId is provided, also invalidates company-scoped queries.
 * When supplierId is provided, also invalidates supplier queries.
 */
export function useDeleteContact(opts?: { companyId?: string; supplierId?: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: requests.deleteContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      if (opts?.companyId) {
        qc.invalidateQueries({ queryKey: contactKeys.byCompany(opts.companyId) });
        qc.invalidateQueries({ queryKey: companyKeys.all });
      }
      if (opts?.supplierId) {
        qc.invalidateQueries({ queryKey: supplierKeys.all });
      }
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    },
  });
}
