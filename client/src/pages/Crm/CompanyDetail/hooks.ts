import { useState } from "react";
import { useCompany, useCompanyContacts, useUpdateCompanyDetail } from "@/services/companies";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companyFormSchema, type CompanyFormData } from "@/schemas/crm.schemas";
import { normalizeCountryCode } from "@/lib/address";
import type { ShippingAddress } from "./types";
import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  ExternalLink,
} from "lucide-react";
import React from "react";

export function useCompanyDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [editShippingAddresses, setEditShippingAddresses] = useState<ShippingAddress[]>([]);
  const [editCustomFields, setEditCustomFields] = useState<Record<string, string>>({});
  const [newCustomFieldKey, setNewCustomFieldKey] = useState("");
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("");
  const { toast } = useToast();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      industry: "",
      notes: "",
      linkedinUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      otherSocialUrl: "",
    },
  });

  const companyId = params.id;

  const { data: company, isLoading, error } = useCompany(companyId);
  const { data: companyContacts = [] } = useCompanyContacts(companyId);
  const updateCompanyMutation = useUpdateCompanyDetail(companyId);

  const handleEditCompany = () => {
    if (!company) return;

    form.reset({
      name: company.name,
      email: "",
      phone: "",
      website: company.website || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zipCode: company.zipCode || "",
      country: normalizeCountryCode(company.country || ""),
      industry: company.industry || "",
      notes: company.notes || "",
      linkedinUrl: company.socialMediaLinks?.linkedin || "",
      twitterUrl: company.socialMediaLinks?.twitter || "",
      facebookUrl: company.socialMediaLinks?.facebook || "",
      instagramUrl: company.socialMediaLinks?.instagram || "",
      otherSocialUrl: company.socialMediaLinks?.other || "",
    });

    setEditShippingAddresses(company.shippingAddresses ? [...company.shippingAddresses] : []);
    setEditCustomFields(company.customFields ? { ...company.customFields } : {});
    setNewCustomFieldKey("");
    setNewCustomFieldValue("");
    setIsEditModalOpen(true);
  };

  const handleUpdateCompany = (data: CompanyFormData) => {
    updateCompanyMutation.mutate(
      {
        id: companyId!,
        data: {
          ...data,
          shippingAddresses: editShippingAddresses,
          customFields: editCustomFields,
        },
      } as any,
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
        },
      }
    );
  };

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

  const handleCreateQuote = () => {
    setIsOrderModalOpen(true);
  };

  const addShippingAddress = () => {
    setEditShippingAddresses([
      ...editShippingAddresses,
      { label: "", street: "", city: "", state: "", zipCode: "", country: "US" },
    ]);
  };

  const removeShippingAddress = (idx: number) => {
    const updated = [...editShippingAddresses];
    updated.splice(idx, 1);
    setEditShippingAddresses(updated);
  };

  const updateShippingAddress = (idx: number, field: keyof ShippingAddress, value: string) => {
    const updated = [...editShippingAddresses];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditShippingAddresses(updated);
  };

  const updateCustomFieldValue = (key: string, value: string) => {
    setEditCustomFields({ ...editCustomFields, [key]: value });
  };

  const removeCustomField = (key: string) => {
    const updated = { ...editCustomFields };
    delete updated[key];
    setEditCustomFields(updated);
  };

  const addCustomField = () => {
    if (newCustomFieldKey.trim()) {
      setEditCustomFields({ ...editCustomFields, [newCustomFieldKey.trim()]: newCustomFieldValue });
      setNewCustomFieldKey("");
      setNewCustomFieldValue("");
    }
  };

  const excitingNewsPosts = company?.socialMediaPosts?.filter((post) => post.isExcitingNews) || [];

  return {
    // Data
    company,
    companyId,
    companyContacts,
    isLoading,
    error,
    excitingNewsPosts,
    form,

    // State
    activeTab,
    setActiveTab,
    isOrderModalOpen,
    setIsOrderModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isEmailDialogOpen,
    setIsEmailDialogOpen,
    editShippingAddresses,
    editCustomFields,
    newCustomFieldKey,
    setNewCustomFieldKey,
    newCustomFieldValue,
    setNewCustomFieldValue,

    // Mutations
    updateCompanyMutation,

    // Handlers
    handleEditCompany,
    handleUpdateCompany,
    handleSendEmail,
    handleCreateQuote,
    addShippingAddress,
    removeShippingAddress,
    updateShippingAddress,
    updateCustomFieldValue,
    removeCustomField,
    addCustomField,

    // Helpers
    formatCurrency,
    getSocialMediaIcon,
    getPlatformColor,
    getInitials,
    setLocation,
  };
}
