import { apiRequest } from "@/lib/queryClient";
import type { SlackNotificationSettings } from "./types";

export async function sendSlackMessage(input: { channel: string; message: string }): Promise<void> {
  await apiRequest("POST", "/api/integrations/slack/send", input);
}

export async function updateSlackSettings(
  settings: Partial<SlackNotificationSettings>,
): Promise<void> {
  await apiRequest("POST", "/api/integrations/slack/settings", settings);
}

export async function syncSlackMessages<T = any>(): Promise<T> {
  const res = await apiRequest("GET", "/api/slack/sync-messages");
  return res.json();
}

export async function postSlackLiveMessage(content: string): Promise<any> {
  const res = await apiRequest("POST", "/api/slack/send-message", { content });
  return res.json();
}

export async function saveSlackConfig(config: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/integrations/slack/config", config);
  return res.json();
}

export async function testSlackConnection(input: {
  message: string;
  channel: string;
}): Promise<any> {
  const res = await apiRequest("POST", "/api/integrations/slack/test", input);
  return res.json();
}

export async function sendSlackChannelMessage(input: {
  message: string;
  channel: string;
}): Promise<any> {
  const res = await apiRequest("POST", "/api/integrations/slack/message", input);
  return res.json();
}
