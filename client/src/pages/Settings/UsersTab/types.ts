export interface UserPermission {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
  permissions: string[];
  lastActive: string;
}

export interface UsersTabProps {
  user: any;
}
