import { apiRequest } from "@/lib/queryClient";
import type { User } from "./types";

export async function updateUserRole(userId: string, role: string): Promise<User> {
  const res = await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
  return res.json();
}

export async function updateUserCommission(userId: string, commissionPercent: number): Promise<User> {
  const res = await apiRequest("PATCH", `/api/users/${userId}/commission`, { commissionPercent });
  return res.json();
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  const res = await apiRequest("PATCH", "/api/auth/user", data);
  return res.json();
}

export async function fetchInvitations(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/invitations");
  return res.json();
}

export async function fetchPendingInvitations(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/invitations/pending");
  return res.json();
}

export async function updateProfileImage(profileImageUrl: string): Promise<User> {
  const res = await apiRequest("PATCH", "/api/users/profile-image", { profileImageUrl });
  return res.json();
}

export async function createInvitation(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/invitations", data);
  return res.json();
}

export async function cancelInvitation(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/invitations/${id}`);
}

export async function verifyInvitationToken<T = any>(token: string): Promise<T> {
  const res = await fetch(`/api/invitations/verify/${token}`);
  if (!res.ok) throw new Error("Invitation invalid or expired");
  return res.json();
}

export async function acceptInvitation(
  token: string,
  data: Record<string, unknown>,
): Promise<any> {
  const res = await apiRequest("POST", "/api/invitations/accept", { token, ...data });
  return res.json();
}

// ---- Auth (Login / 2FA Verify) ----

export async function loginUser(data: { username: string; password: string }): Promise<any> {
  const res = await apiRequest("POST", "/api/auth/login", data);
  return res.json();
}

export async function verify2FALogin(data: { tempToken: string; code: string; trustDevice: boolean }): Promise<any> {
  const res = await apiRequest("POST", "/api/auth/2fa/verify", data);
  return res.json();
}

// ---- Two-Factor Authentication ----

export async function setup2FA(): Promise<any> {
  const res = await apiRequest("POST", "/api/auth/2fa/setup");
  return res.json();
}

export async function verifySetup2FA(code: string): Promise<any> {
  const res = await apiRequest("POST", "/api/auth/2fa/verify-setup", { code });
  return res.json();
}

export async function disable2FA(password: string): Promise<any> {
  const res = await apiRequest("POST", "/api/auth/2fa/disable", { password });
  return res.json();
}

export async function generateBackupCodes(password: string): Promise<any> {
  const res = await apiRequest("POST", "/api/auth/2fa/backup-codes", { password });
  return res.json();
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await fetch("/api/users/avatar", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to upload avatar");
  return res.json();
}
