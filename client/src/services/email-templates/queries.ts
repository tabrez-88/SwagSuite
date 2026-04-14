import { useQuery } from "@tanstack/react-query";
import { emailTemplateKeys } from "./keys";
import * as requests from "./requests";
import type { EmailTemplate } from "./types";

export function useEmailTemplatesQuery(templateType?: string) {
  return useQuery<EmailTemplate[]>({
    queryKey: emailTemplateKeys.list(templateType),
    queryFn: () => requests.listTemplates(templateType),
  });
}

/** Fetch the default (or first active) template for a given type. */
export function useDefaultEmailTemplateQuery(templateType: string) {
  return useQuery<EmailTemplate | null>({
    queryKey: emailTemplateKeys.default(templateType),
    queryFn: async () => {
      const templates = await requests.listTemplates(templateType);
      return (
        templates.find((t) => t.isDefault && t.isActive) ??
        templates.find((t) => t.isActive) ??
        null
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}
