export const approvalKeys = {
  all: ["approvals"] as const,
  client: (token: string) => [`/api/client-approvals/${token}`] as const,
  po: (token: string) => [`/api/po-confirmations/${token}`] as const,
  artwork: (token: string) => [`/api/approvals/${token}`] as const,
  publicPresentation: (token: string) => [`/api/presentation/${token}`] as const,
  vendorApprovals: ["/api/vendor-approvals"] as const,
};
