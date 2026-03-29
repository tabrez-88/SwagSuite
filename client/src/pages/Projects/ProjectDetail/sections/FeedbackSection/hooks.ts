import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackSectionProps } from "./types";

export function useFeedbackSection({ projectId, data }: FeedbackSectionProps) {
  const { portalTokens, approvals, quoteApprovals, companyName, primaryContact } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPortalTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/portal-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create portal link");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/portal-tokens`] });
      toast({ title: "Portal link created" });
    },
    onError: () => {
      toast({ title: "Failed to create portal link", variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copied to clipboard" });
  };

  return {
    portalTokens,
    approvals,
    quoteApprovals,
    companyName,
    primaryContact,
    createPortalTokenMutation,
    copyToClipboard,
  };
}
