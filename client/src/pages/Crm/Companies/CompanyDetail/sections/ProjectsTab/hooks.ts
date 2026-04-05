import { useMemo } from "react";
import { useCompanyProjects } from "@/services/companies";
import { determineBusinessStage, type DeterminedStage } from "@/constants/businessStages";

export function useProjectsTab(companyId: string | undefined) {
  const { data: companyProjects = [] } = useCompanyProjects(companyId);

  const projectsWithStage = useMemo(() => {
    return companyProjects.map((project) => ({
      ...project,
      _determinedStage: determineBusinessStage(project) as DeterminedStage,
    }));
  }, [companyProjects]);

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  return {
    projectsWithStage,
    formatCurrency,
  };
}
