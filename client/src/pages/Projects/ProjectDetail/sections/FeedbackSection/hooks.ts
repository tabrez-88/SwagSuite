import { useToast } from "@/hooks/use-toast";
import { useCreatePortalToken } from "@/services/projects/mutations";
import type { FeedbackSectionProps } from "./types";

export function useFeedbackSection({ projectId, data }: FeedbackSectionProps) {
  const { portalTokens, approvals, quoteApprovals, companyName, primaryContact } = data;
  const { toast } = useToast();

  const createPortalTokenMutation = useCreatePortalToken(projectId);

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
