import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { companyKeys } from "./keys";
import * as requests from "./requests";

export function useCreateCompany() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: requests.createCompany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.all });
      toast({
        title: "Company created",
        description: "The company has been successfully created.",
      });
    },
    onError: (error: any) => {
      console.error("Create company error:", error);
      toast({
        title: "Error",
        description: `Failed to create company: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: requests.updateCompany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.all });
      toast({
        title: "Company updated",
        description: "The company has been successfully updated.",
      });
    },
    onError: (error: any) => {
      console.error("Update company error:", error);
      toast({
        title: "Error",
        description: `Failed to update company: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCompanyDetail(companyId: string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: requests.updateCompany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.detail(companyId!) });
      qc.invalidateQueries({ queryKey: companyKeys.all });
      toast({
        title: "Company updated",
        description: "The company has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update company: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: requests.deleteCompany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.all });
      toast({
        title: "Company deleted",
        description: "The company has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete company. Please try again.",
        variant: "destructive",
      });
    },
  });
}
