import { apiRequest } from "@/lib/queryClient";
import type { BrandingSettings, GeneralSettings } from "./types";

export async function updateBranding(data: Partial<BrandingSettings>): Promise<BrandingSettings> {
  // Server accepts POST for settings upserts.
  const res = await apiRequest("POST", "/api/settings/branding", data);
  return res.json();
}

export async function uploadLogo(file: File): Promise<{ logoUrl: string }> {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await fetch("/api/settings/logo", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload logo");
  }
  return res.json();
}

export async function updateGeneralSettings(data: Partial<GeneralSettings>): Promise<GeneralSettings> {
  const res = await apiRequest("PUT", "/api/admin/settings/general", data);
  return res.json();
}

export async function updateIntegrationSettings(data: any): Promise<any> {
  const res = await apiRequest("PUT", "/api/settings/integration", data);
  return res.json();
}

export async function sendTestEmail(to: string): Promise<{ success: boolean; message?: string }> {
  const res = await apiRequest("POST", "/api/settings/test-email", { to });
  return res.json();
}

export async function updateFeatureToggles(featureToggles: Record<string, boolean>): Promise<any> {
  const res = await apiRequest("PUT", "/api/admin/settings/features", { featureToggles });
  return res.json();
}

// ---- Notification Preferences ----

export async function fetchNotificationPrefs(): Promise<any> {
  const res = await apiRequest("GET", "/api/users/me/notification-preferences");
  return res.json();
}

export async function updateNotificationPrefs(data: Record<string, any>): Promise<any> {
  const res = await apiRequest("PATCH", "/api/users/me/notification-preferences", data);
  return res.json();
}

// ---- ShipStation ----

export async function testShipStationConnection(data: { apiKey: string; apiSecret: string }): Promise<any> {
  const res = await apiRequest("POST", "/api/shipstation/test-connection", data);
  return res.json();
}

export async function pushOrderToShipStation(orderId: string): Promise<{ success: boolean; shipstationOrderId?: number; message: string }> {
  const res = await apiRequest("POST", `/api/shipstation/orders/${orderId}/push`);
  return res.json();
}

// ---- User Email Settings (Mail Credentials) ----

export async function saveUserEmailSettings(data: Record<string, any>): Promise<any> {
  const res = await apiRequest("POST", "/api/user-email-settings", data);
  return res.json();
}

export async function testSmtpConnection(data: Record<string, any>): Promise<any> {
  const res = await apiRequest("POST", "/api/user-email-settings/test-smtp", data);
  return res.json();
}

export async function testImapConnection(data: Record<string, any>): Promise<any> {
  const res = await apiRequest("POST", "/api/user-email-settings/test-imap", data);
  return res.json();
}

export async function searchGeocode(query: string): Promise<any> {
  const res = await apiRequest("GET", `/api/geocode/search?q=${encodeURIComponent(query)}`);
  return res.json();
}
