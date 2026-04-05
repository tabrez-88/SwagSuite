import { useState } from "react";
import { useCompany } from "@/services/companies";
import { useParams, useLocation } from "wouter";
import { useTabParam } from "@/hooks/useTabParam";

export function useCompanyDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useTabParam("overview");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const companyId = params.id;

  const { data: company, isLoading, error } = useCompany(companyId);

  const handleCreateQuote = () => {
    setIsProjectModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return {
    company,
    companyId,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    isProjectModalOpen,
    setIsProjectModalOpen,
    handleCreateQuote,
    getInitials,
    setLocation,
  };
}
