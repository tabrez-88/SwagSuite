export const userKeys = {
  all: ["users"] as const,
  team: ["/api/users/team"] as const,
  list: ["/api/users"] as const,
  detail: (id: string | number) => [`/api/users/${id}`] as const,
  authUser: ["/api/auth/user"] as const,
  invitations: ["/api/invitations"] as const,
  pendingInvitations: ["/api/invitations/pending"] as const,
  invitationByToken: (token: string) => [`/api/invitations/verify/${token}`] as const,
  twoFaStatus: ["/api/auth/2fa/status"] as const,
};
