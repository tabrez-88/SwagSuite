export async function fetchCustomerPortalData<T = any>(token: string): Promise<T> {
  const res = await fetch(`/api/portal/${token}`);
  if (!res.ok) throw new Error("Failed to load customer portal");
  return res.json();
}
