export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  role?: string;
  [key: string]: unknown;
}

export interface User extends TeamMember {
  twoFactorEnabled?: boolean;
  commissionRate?: string | number | null;
  [key: string]: unknown;
}
