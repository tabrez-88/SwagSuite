export const customerPortalKeys = {
  all: ["customer-portal"] as const,
  data: (token: string) => [`/api/portal/${token}`] as const,
};
