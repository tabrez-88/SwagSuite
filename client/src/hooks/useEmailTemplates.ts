import {
  useEmailTemplatesQuery,
  useDefaultEmailTemplateQuery,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useSetDefaultEmailTemplate,
} from "@/services/email-templates";

export {
  applyTemplate,
  TEMPLATE_MERGE_FIELDS,
  TEMPLATE_TYPE_LABELS,
} from "@/services/email-templates";
export type { EmailTemplate } from "@/services/email-templates";

/**
 * @deprecated Import from `@/services/email-templates` directly. Re-exports
 * preserve the old names used across the codebase.
 */
export function useEmailTemplates(templateType?: string) {
  return useEmailTemplatesQuery(templateType);
}

/** @deprecated Import from `@/services/email-templates`. */
export function useDefaultEmailTemplate(templateType: string) {
  return useDefaultEmailTemplateQuery(templateType);
}

/** @deprecated Import the individual mutation hooks from `@/services/email-templates`. */
export function useEmailTemplateMutations() {
  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();
  const deleteMutation = useDeleteEmailTemplate();
  const setDefaultMutation = useSetDefaultEmailTemplate();
  return { createMutation, updateMutation, deleteMutation, setDefaultMutation };
}
