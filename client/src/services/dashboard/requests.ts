import { apiRequest } from "@/lib/queryClient";

export async function seedDummyData(): Promise<any> {
  const res = await apiRequest("POST", "/api/seed-dummy-data", {});
  return res.json();
}
