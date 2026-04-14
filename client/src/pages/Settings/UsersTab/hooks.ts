import { useToast } from "@/hooks/use-toast";
import { useUsers, useUpdateUserRole, useUpdateUserCommission } from "@/services/users";

export function useUsersTab(user: any) {
  const { toast } = useToast();

  const isAdmin =
    user?.role === "admin" ||
    user?.email === "bgoltzman@liquidscreendesign.com";
  const isManager = user?.role === "manager";

  const { data: usersData, isLoading: usersLoading } = useUsers() as unknown as {
    data: any;
    isLoading: boolean;
  };

  const _updateRole = useUpdateUserRole();
  const _updateCommission = useUpdateUserCommission();

  const updateUserRole = (userId: string, newRole: "admin" | "manager" | "user") => {
    _updateRole.mutate(
      { userId, role: newRole },
      {
        onSuccess: () =>
          toast({
            title: "User Role Updated",
            description: "User permissions have been updated successfully.",
          }),
        onError: (error: Error) =>
          toast({
            title: "Error",
            description: error.message || "Failed to update user role.",
            variant: "destructive",
          }),
      },
    );
  };

  const updateCommission = (userId: string, percent: number) => {
    _updateCommission.mutate(
      { userId, commissionPercent: percent },
      {
        onSuccess: () => toast({ title: "Commission % updated" }),
        onError: (error: Error) =>
          toast({
            title: "Error",
            description: error.message || "Failed to update commission.",
            variant: "destructive",
          }),
      },
    );
  };

  return {
    isAdmin,
    isManager,
    usersData,
    usersLoading,
    updateUserRole,
    updateCommission,
    isUpdatingRole: _updateRole.isPending,
  };
}
