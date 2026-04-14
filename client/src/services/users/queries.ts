import { useQuery } from "@tanstack/react-query";
import { userKeys } from "./keys";
import * as requests from "./requests";
import type { TeamMember, User } from "./types";

export function useTeamMembers() {
  return useQuery<TeamMember[]>({ queryKey: userKeys.team });
}

export function useUsers() {
  return useQuery<User[]>({ queryKey: userKeys.list });
}

export function useUser(userId: string | undefined) {
  return useQuery<User>({
    queryKey: userKeys.detail(userId ?? ""),
    enabled: !!userId,
  });
}

export function useAuthUser() {
  return useQuery<User | null>({
    queryKey: userKeys.authUser,
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useInvitations() {
  return useQuery<any[]>({
    queryKey: userKeys.invitations,
    queryFn: requests.fetchInvitations,
  });
}

export function usePendingInvitations(enabled = true) {
  return useQuery<any[]>({
    queryKey: userKeys.pendingInvitations,
    queryFn: requests.fetchPendingInvitations,
    enabled,
  });
}

export function useInvitationByToken<T = any>(token: string | undefined) {
  return useQuery<T>({
    queryKey: userKeys.invitationByToken(token ?? ""),
    queryFn: () => requests.verifyInvitationToken<T>(token!),
    enabled: !!token,
    retry: false,
  });
}
