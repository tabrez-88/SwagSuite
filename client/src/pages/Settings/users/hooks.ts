import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Shield, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, PendingInvitation, RoleConfigEntry } from "./types";

const roleConfig: Record<string, RoleConfigEntry> = {
  admin: {
    label: "Admin",
    icon: Crown,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  manager: {
    label: "Manager",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  user: {
    label: "User",
    icon: UserIcon,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

export function useUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [invitationUrl, setInvitationUrl] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: pendingInvitations = [] } = useQuery<PendingInvitation[]>({
    queryKey: ["/api/invitations/pending"],
    enabled: currentUser?.role === "admin" || currentUser?.role === "manager",
  });

  const isAdmin = currentUser?.role === "admin";
  const canInvite = currentUser?.role === "admin" || currentUser?.role === "manager";

  // Debug: Log current user info
  console.log("Current user:", currentUser);
  console.log("Can invite:", canInvite, "Role:", currentUser?.role);

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const response = await apiRequest("POST", "/api/invitations", { email, role });
      return response.json();
    },
    onSuccess: (data) => {
      setInvitationUrl(data.invitationUrl);
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations/pending"] });
      setInviteEmail("");
      setInviteRole("user");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const handleInviteUser = () => {
    if (!inviteEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const copyInvitationUrl = () => {
    navigator.clipboard.writeText(invitationUrl);
    toast({
      title: "Copied",
      description: "Invitation URL copied to clipboard",
    });
  };

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const updateProfileImageMutation = useMutation({
    mutationFn: async (profileImageUrl: string) => {
      const response = await apiRequest("PATCH", "/api/users/profile-image", { profileImageUrl });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile photo has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/team"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile photo",
        variant: "destructive",
      });
    },
  });

  const handleAvatarSelected = (files: any[]) => {
    if (files.length > 0 && files[0].cloudinaryUrl) {
      updateProfileImageMutation.mutate(files[0].cloudinaryUrl);
    }
    setShowAvatarPicker(false);
  };

  const getRoleConfig = (role: string): RoleConfigEntry => {
    return roleConfig[role] || roleConfig.user;
  };

  const closeInviteDialog = () => {
    setInviteDialogOpen(false);
    setInvitationUrl("");
  };

  return {
    // Data
    users,
    currentUser,
    pendingInvitations,
    isLoading,
    isAdmin,
    canInvite,

    // Invite dialog state
    inviteDialogOpen,
    setInviteDialogOpen,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    invitationUrl,
    closeInviteDialog,

    // Avatar picker state
    showAvatarPicker,
    setShowAvatarPicker,

    // Mutations
    inviteUserMutation,
    updateRoleMutation,

    // Handlers
    handleInviteUser,
    copyInvitationUrl,
    handleRoleChange,
    handleAvatarSelected,

    // Helpers
    getRoleConfig,
  };
}
