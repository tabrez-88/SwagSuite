import { useQuery } from "@tanstack/react-query";
import { slackKeys } from "./keys";
import type { SlackChannel, SlackMessage, SlackNotificationSettings } from "./types";

export function useSlackChannels() {
  return useQuery<SlackChannel[]>({ queryKey: slackKeys.channels });
}

export function useSlackMessages() {
  return useQuery<SlackMessage[]>({
    queryKey: slackKeys.messages,
    refetchInterval: 30_000,
  });
}

export function useSlackSettings() {
  return useQuery<SlackNotificationSettings>({ queryKey: slackKeys.settings });
}

export function useSlackSyncMessages<T = { messages: SlackMessage[] }>() {
  return useQuery<T>({
    queryKey: slackKeys.syncMessages,
    queryFn: () => import("./requests").then((m) => m.syncSlackMessages<T>()),
    refetchInterval: 30_000,
    retry: false,
  });
}
