import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  useBranding,
  useUpdateBranding,
  useUpdateGeneralSettings,
} from "@/services/settings";
import type { GeneralSettings, BrandingSettings } from "./types";

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  companyName: "Liquid Screen Design",
  companyLogo: "",
  timezone: "America/New_York",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  defaultMargin: "30",
  minimumMargin: "15",
  maxOrderValue: "50000",
  requireApprovalOver: "5000",
  orderNumberPrefix: "ORD",
  orderNumberDigits: "3",
};

export function useGeneralTab(adminSettings: any) {
  const { toast } = useToast();

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(
    DEFAULT_GENERAL_SETTINGS,
  );

  const { data: brandingSettings } = useBranding() as { data: BrandingSettings | undefined };

  const _saveBranding = useUpdateBranding();
  const _saveGeneral = useUpdateGeneralSettings();
  const saveBrandingMutation = {
    ..._saveBranding,
    mutate: (data: any) =>
      _saveBranding.mutate(data, {
        onSuccess: () =>
          toast({ title: "Settings Saved", description: "General settings have been saved successfully." }),
        onError: (error: Error) =>
          toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save settings." }),
      }),
  };

  // Initialize from server data
  useEffect(() => {
    if (adminSettings) {
      const s = adminSettings as any;
      setGeneralSettings((prev) => ({
        ...prev,
        timezone: s.timezone || prev.timezone,
        currency: s.currency || prev.currency,
        dateFormat: s.dateFormat || prev.dateFormat,
        defaultMargin: s.defaultMargin || prev.defaultMargin,
        minimumMargin: s.minimumMargin || prev.minimumMargin,
        maxOrderValue: s.maxOrderValue || prev.maxOrderValue,
        requireApprovalOver: s.requireApprovalOver || prev.requireApprovalOver,
        orderNumberPrefix: s.orderNumberPrefix || prev.orderNumberPrefix,
        orderNumberDigits: String(s.orderNumberDigits || prev.orderNumberDigits),
      }));
    }
  }, [adminSettings]);

  useEffect(() => {
    if (brandingSettings?.companyName) {
      setGeneralSettings((prev) => ({
        ...prev,
        companyName: brandingSettings.companyName || prev.companyName,
      }));
    }
  }, [brandingSettings]);

  const updateField = (field: keyof GeneralSettings, value: string) => {
    setGeneralSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    try {
      await _saveGeneral.mutateAsync({
        timezone: generalSettings.timezone,
        currency: generalSettings.currency,
        dateFormat: generalSettings.dateFormat,
        defaultMargin: generalSettings.defaultMargin,
        minimumMargin: generalSettings.minimumMargin,
        maxOrderValue: generalSettings.maxOrderValue,
        requireApprovalOver: generalSettings.requireApprovalOver,
        orderNumberPrefix: generalSettings.orderNumberPrefix,
        orderNumberDigits: parseInt(generalSettings.orderNumberDigits) || 3,
      });

      // Also save companyName to branding
      saveBrandingMutation.mutate({
        companyName: generalSettings.companyName || null,
        primaryColor: brandingSettings?.primaryColor || "#3b82f6",
        secondaryColor: brandingSettings?.secondaryColor || "#64748b",
        accentColor: brandingSettings?.accentColor || "#10b981",
        backgroundColor: brandingSettings?.backgroundColor || "#ffffff",
        textColor: brandingSettings?.textColor || "#1f2937",
        sidebarBackgroundColor:
          brandingSettings?.sidebarBackgroundColor || "#014559",
        sidebarTextColor: brandingSettings?.sidebarTextColor || "#ffffff",
        sidebarBorderColor: brandingSettings?.sidebarBorderColor || "#374151",
        navHoverColor: brandingSettings?.navHoverColor || "#374151",
        navActiveColor: brandingSettings?.navActiveColor || "#3b82f6",
        navTextColor: brandingSettings?.navTextColor || "#d1d5db",
        navTextActiveColor: brandingSettings?.navTextActiveColor || "#ffffff",
        borderColor: brandingSettings?.borderColor || "#e5e7eb",
        logoUrl: brandingSettings?.logoUrl || "",
        logoSize: brandingSettings?.logoSize || "medium",
        logoPosition: brandingSettings?.logoPosition || "left",
        faviconUrl: brandingSettings?.faviconUrl || null,
        tagline: brandingSettings?.tagline || null,
        borderRadius: brandingSettings?.borderRadius || "medium",
        fontFamily: brandingSettings?.fontFamily || "inter",
      });
    } catch (error) {
      console.error("Save settings error:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    generalSettings,
    updateField,
    saveSettings,
  };
}
