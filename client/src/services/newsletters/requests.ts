import { apiRequest } from "@/lib/queryClient";

export async function fetchNewsletters(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/newsletters");
  return res.json();
}

export async function createNewsletter(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/newsletters", data);
  return res.json();
}
