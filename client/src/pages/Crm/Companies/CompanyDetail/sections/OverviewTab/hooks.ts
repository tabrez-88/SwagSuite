import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  useCompanyContacts,
  useCompanyActivities,
} from "@/services/companies";
import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  ExternalLink,
} from "lucide-react";
import React from "react";

export function useOverviewTab(companyId: string | undefined, company: any) {
  const [openPopover, setOpenPopover] = useState<"clientRep" | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: companyContacts = [] } = useCompanyContacts(companyId);
  const { data: companyActivities = [] } = useCompanyActivities(companyId);

  const { data: teamMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/users/team"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: taxCodes } = useQuery<any[]>({
    queryKey: ["/api/tax-codes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Derived data
  const excitingNewsPosts = company?.socialMediaPosts?.filter((post: any) => post.isExcitingNews) || [];
  const previewContacts = companyContacts.slice(0, 4);
  const previewAddresses = (company?.addresses || []).slice(0, 3);
  const previewActivities = companyActivities.slice(0, 5);

  const taxCodeName = taxCodes?.find((tc: any) => tc.id === company?.defaultTaxCodeId)?.name;
  const termsLabel = company?.defaultTerms;

  // Client rep mutation
  const reassignMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string | null }) => {
      const res = await apiRequest("PATCH", `/api/companies/${company.id}`, {
        assignedUserId: userId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${company.id}`] });
      toast({ title: "Client Rep updated" });
      setOpenPopover(null);
    },
    onError: () => {
      toast({ title: "Failed to update Client Rep", variant: "destructive" });
    },
  });

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

    // State
    openPopover,
    setOpenPopover,
    isEmailDialogOpen,
    setIsEmailDialogOpen,

    // Mutations & handlers
    reassignMutation,
    handleSendEmail,

    // Helpers
    formatCurrency,
    getSocialMediaIcon,
    getPlatformColor,
  };
}
