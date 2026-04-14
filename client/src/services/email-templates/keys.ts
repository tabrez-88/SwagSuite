export const emailTemplateKeys = {
  all: ["/api/settings/email-templates"] as const,
  list: (type?: string) => ["/api/settings/email-templates", { type }] as const,
  default: (type: string) =>
    ["/api/settings/email-templates", { type, default: true }] as const,
};
