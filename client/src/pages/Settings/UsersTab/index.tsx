import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Users } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useUsersTab } from "./hooks";
import type { UsersTabProps } from "./types";

export function UsersTab({ user }: UsersTabProps) {
  const {
    isAdmin,
    isManager,
    usersData,
    usersLoading,
    updateUserRole,
    updateCommission,
    isUpdatingRole,
  } = useUsersTab(user);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage user roles and permissions for system access control.
            {isManager && (
              <span className="block mt-1 text-amber-600 font-medium">
                Managers can view user roles but only admins can modify
                them.
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = "/settings/users")}
          className="w-full sm:w-auto"
        >
          <Users className="w-4 h-4 mr-2" />
          Open Full User Management
        </Button>
      </CardHeader>
      <CardContent>
        {usersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Settings2 className="w-6 h-6 text-gray-400 animate-spin mr-2" />
            <span className="text-gray-600">Loading users...</span>
          </div>
        ) : usersData &&
          Array.isArray(usersData) &&
          usersData.length > 0 ? (
          <div className="space-y-4">
            {usersData.map((userItem: any) => (
              <div
                key={userItem.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar user={userItem} size="md" />
                  <div>
                    <h4 className="font-medium text-sm">
                      {userItem.firstName} {userItem.lastName}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {userItem.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last active:{" "}
                      {userItem.updatedAt
                        ? new Date(
                            userItem.updatedAt,
                          ).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1" title="Commission %">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="w-20 h-8 text-xs text-right"
                      placeholder="—"
                      defaultValue={userItem.commissionPercent ?? ""}
                      disabled={!isAdmin}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val !== parseFloat(userItem.commissionPercent || "0")) {
                          updateCommission(userItem.id, val);
                        }
                      }}
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Select
                    value={userItem.role || "user"}
                    onValueChange={(
                      value: "admin" | "manager" | "user",
                    ) => updateUserRole(userItem.id, value)}
                    disabled={isUpdatingRole || !isAdmin}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge
                    variant={
                      userItem.role === "admin"
                        ? "default"
                        : userItem.role === "manager"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {userItem.role || "user"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
