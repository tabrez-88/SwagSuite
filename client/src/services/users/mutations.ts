import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "./keys";
import * as requests from "./requests";

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: userKeys.list });
    queryClient.invalidateQueries({ queryKey: userKeys.team });
  };
}

export function useUpdateUserRole() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      requests.updateUserRole(userId, role),
    onSuccess: invalidate,
  });
}

export function useUpdateUserCommission() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, commissionPercent }: { userId: string; commissionPercent: number }) =>
      requests.updateUserCommission(userId, commissionPercent),
    onSuccess: invalidate,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.authUser }),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.uploadAvatar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.authUser }),
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.createInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.invitations }),
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.cancelInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.invitations }),
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: Record<string, unknown> }) =>
      requests.acceptInvitation(token, data),
  });
}

export function useUpdateProfileImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.updateProfileImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.authUser });
      queryClient.invalidateQueries({ queryKey: userKeys.list });
      queryClient.invalidateQueries({ queryKey: userKeys.team });
    },
  });
}
