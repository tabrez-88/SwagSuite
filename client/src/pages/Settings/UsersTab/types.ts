export interface UserPermission {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user" | "sales" | "production" | "finance";
  permissions: string[];
  lastActive: string;
}

export interface UsersTabProps {
  user: any;
}
