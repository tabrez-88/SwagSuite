import { useQuery } from "@tanstack/react-query";

export const customerPortalKeys = {
  all: ["customer-portal"] as const,
  data: (token: string) => [`/api/portal/${token}`] as const,
};

export async function fetchCustomerPortalData<T = any>(token: string): Promise<T> {
  const res = await fetch(`/api/portal/${token}`);
  if (!res.ok) throw new Error("Failed to load customer portal");
  return res.json();
}

export function useCustomerPortalData<T = any>(token: string | undefined) {
  return useQuery<T>({
    queryKey: customerPortalKeys.data(token ?? ""),
    queryFn: () => fetchCustomerPortalData<T>(token!),
    enabled: !!token,
  });
}
