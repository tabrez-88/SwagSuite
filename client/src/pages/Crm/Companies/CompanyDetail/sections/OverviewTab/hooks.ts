import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useCompanyContacts,
  useCompanyActivities,
  useCompanySpending,
  useReassignCompanyRep,
} from "@/services/companies";
import { useTeamMembers } from "@/services/users";
import { useTaxCodes } from "@/services/tax-codes";
import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  ExternalLink,
} from "lucide-react";
import React from "react";

export interface CompanySpendingReport {
  companyId: string;
  from: string;
  to: string;
  totalSpend: number;
  orderCount: number;
  orders: Array<{
    id: string;
    orderNumber: string;
    projectName: string | null;
    currentStage: string | null;
    total: number;
    createdAt: string | null;
    inHandsDate: string | null;
  }>;
  monthly: Array<{ month: string; total: number; count: number }>;
}

const startOfCurrentYear = () => {
  const d = new Date(new Date().getFullYear(), 0, 1);
  return d.toISOString().split("T")[0];
};

const todayIso = () => new Date().toISOString().split("T")[0];

export function useOverviewTab(companyId: string | undefined, company: any) {
  const [openPopover, setOpenPopover] = useState<"clientRep" | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [spendFrom, setSpendFrom] = useState<string>(startOfCurrentYear());
  const [spendTo, setSpendTo] = useState<string>(todayIso());
  const { toast } = useToast();

  // Data queries
  const { data: companyContacts = [] } = useCompanyContacts(companyId);
  const { data: companyActivities = [] } = useCompanyActivities(companyId);

  // Spending report
  const { data: spendingReport, isLoading: spendingLoading } = useCompanySpending(
    companyId,
    spendFrom,
    spendTo,
  ) as { data: CompanySpendingReport | undefined; isLoading: boolean };

  const applySpendPreset = (preset: "ytd" | "qtd" | "last30" | "last90" | "lastYear") => {
    const now = new Date();
    const year = now.getFullYear();
    const iso = (d: Date) => d.toISOString().split("T")[0];
    switch (preset) {
      case "ytd":
        setSpendFrom(iso(new Date(year, 0, 1)));
        setSpendTo(iso(now));
        return;
      case "qtd": {
        const q = Math.floor(now.getMonth() / 3);
        setSpendFrom(iso(new Date(year, q * 3, 1)));
        setSpendTo(iso(now));
        return;
      }
      case "last30":
        setSpendFrom(iso(new Date(now.getTime() - 30 * 86_400_000)));
        setSpendTo(iso(now));
        return;
      case "last90":
        setSpendFrom(iso(new Date(now.getTime() - 90 * 86_400_000)));
        setSpendTo(iso(now));
        return;
      case "lastYear":
        setSpendFrom(iso(new Date(year - 1, 0, 1)));
        setSpendTo(iso(new Date(year - 1, 11, 31)));
        return;
    }
  };

  const { data: teamMembers = [] } = useTeamMembers();
  const { data: taxCodes } = useTaxCodes();

  // Derived data
  const excitingNewsPosts = company?.socialMediaPosts?.filter((post: any) => post.isExcitingNews) || [];
  const previewContacts = companyContacts.slice(0, 4);
  const previewAddresses = (company?.addresses || []).slice(0, 3);
  const previewActivities = companyActivities.slice(0, 5);

  const taxCodeName = taxCodes?.find((tc: any) => tc.id === company?.defaultTaxCodeId)?.name;
  const termsLabel = company?.defaultTerms;

  // Client rep mutation
  const _reassign = useReassignCompanyRep(company?.id ?? "");
  const reassignMutation = {
    ..._reassign,
    mutate: ({ userId }: { userId: string | null }) =>
      _reassign.mutate(userId, {
        onSuccess: () => {
          toast({ title: "Client Rep updated" });
          setOpenPopover(null);
        },
        onError: () => toast({ title: "Failed to update Client Rep", variant: "destructive" }),
      }),
  };

  // Email handler
  const handleSendEmail = () => {
    const contactsWithEmail = companyContacts.filter((c: any) => c.email);
    if (contactsWithEmail.length === 0) {
      toast({
        title: "No Contacts with Email",
        description: "This company has no contacts with an email address.",
        variant: "destructive",
      });
      return;
    }
    setIsEmailDialogOpen(true);
  };

  // Helpers
  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const getSocialMediaIcon = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return React.createElement(Linkedin, { className: "h-4 w-4" });
      case "twitter":
        return React.createElement(Twitter, { className: "h-4 w-4" });
      case "facebook":
        return React.createElement(Facebook, { className: "h-4 w-4" });
      case "instagram":
        return React.createElement(Instagram, { className: "h-4 w-4" });
      default:
        return React.createElement(ExternalLink, { className: "h-4 w-4" });
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return "text-blue-600";
      case "twitter":
        return "text-sky-500";
      case "facebook":
        return "text-blue-700";
      case "instagram":
        return "text-pink-600";
      default:
        return "text-gray-600";
    }
  };

  return {
    // Data
    companyContacts,
    companyActivities,
    teamMembers,
    excitingNewsPosts,
    previewContacts,
    previewAddresses,
    previewActivities,
    taxCodeName,
    termsLabel,
    spendingReport,
    spendingLoading,

    // State
    openPopover,
    setOpenPopover,
    isEmailDialogOpen,
    setIsEmailDialogOpen,
    spendFrom,
    setSpendFrom,
    spendTo,
    setSpendTo,

    // Mutations & handlers
    reassignMutation,
    handleSendEmail,
    applySpendPreset,

    // Helpers
    formatCurrency,
    getSocialMediaIcon,
    getPlatformColor,
  };
}
