export const integrationSettingsKeys = {
  all: ["integration-settings"] as const,
  list: ["/api/settings/integrations"] as const,
  configurations: ["/api/integrations/configurations"] as const,
  credentials: ["/api/integrations/credentials"] as const,
  quickbooksAuth: ["/api/integrations/quickbooks/auth"] as const,
};
