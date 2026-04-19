export const settingsKeys = {
  all: ["settings"] as const,
  branding: ["/api/settings/branding"] as const,
  general: ["/api/admin/settings/general"] as const,
  features: ["/api/settings/features"] as const,
  admin: ["/api/admin/settings"] as const,
  integration: ["/api/settings/integration"] as const,
  notificationPrefs: ["/api/users/me/notification-preferences"] as const,
  emailCredentials: ["/api/user-email-settings"] as const,
};
