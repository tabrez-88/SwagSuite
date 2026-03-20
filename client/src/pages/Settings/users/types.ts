import type { LucideIcon } from "lucide-react";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  token: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface RoleConfigEntry {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}
