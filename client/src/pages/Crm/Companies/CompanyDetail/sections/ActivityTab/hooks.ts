import { useCompanyActivities } from "@/services/companies";

export function useActivityTab(companyId: string | undefined) {
  const { data: companyActivities = [] } = useCompanyActivities(companyId);

  return { companyActivities };
}
