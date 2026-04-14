import { useMutation, useQueryClient } from "@tanstack/react-query";
import { slackKeys } from "./keys";
import * as requests from "./requests";

export function useSendSlackMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.sendSlackMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: slackKeys.messages }),
  });
}

export function useUpdateSlackSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.updateSlackSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: slackKeys.settings }),
  });
}

export function usePostSlackLiveMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.postSlackLiveMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: slackKeys.syncMessages }),
  });
}

export function useSaveSlackConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.saveSlackConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: slackKeys.channels }),
  });
}

export function useTestSlackConnection() {
  return useMutation({ mutationFn: requests.testSlackConnection });
}

export function useSendSlackChannelMessage() {
  return useMutation({ mutationFn: requests.sendSlackChannelMessage });
}
