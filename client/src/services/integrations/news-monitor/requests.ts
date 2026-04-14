import { apiRequest } from "@/lib/queryClient";
import type { NewsMonitorSettings } from "./types";

export async function updateNewsSettings(
  settings: Partial<NewsMonitorSettings>,
): Promise<void> {
  await apiRequest("POST", "/api/integrations/news/settings", settings);
}

export async function toggleNewsAlert(newsId: string): Promise<void> {
  await apiRequest("POST", `/api/integrations/news/${newsId}/toggle-alert`);
}

export async function sendManualNewsAlert(newsId: string): Promise<void> {
  await apiRequest("POST", `/api/integrations/news/${newsId}/send-alert`);
}
