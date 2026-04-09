import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useUsersTab(user: any) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin =
    user?.role === "admin" ||
    user?.email === "bgoltzman@liquidscreendesign.com";
  const isManager = user?.role === "manager";

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin" || user?.role === "manager",
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "manager" | "user";
    }) => {
      return await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Role Updated",
        description: "User permissions have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  const updateUserRole = (
    userId: string,
    newRole: "admin" | "manager" | "user",
  ) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const updateCommissionMutation = useMutation({
    mutationFn: async ({
      userId,
      commissionPercent,
    }: {
      userId: string;
      commissionPercent: number;
    }) => {
      return await apiRequest("PATCH", `/api/users/${userId}/commission`, {
        commissionPercent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Commission % updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission.",
        variant: "destructive",
      });
    },
  });

  const updateCommission = (userId: string, percent: number) => {
    updateCommissionMutation.mutate({ userId, commissionPercent: percent });
  };

  return {
    isAdmin,
    isManager,
    usersData,
    usersLoading,
    updateUserRole,
    updateCommission,
    isUpdatingRole: updateUserRoleMutation.isPending,
  };
}
