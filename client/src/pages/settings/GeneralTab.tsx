import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Settings as SettingsIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface GeneralTabProps {
  adminSettings: any;
}

export function GeneralTab({ adminSettings }: GeneralTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [generalSettings, setGeneralSettings] = useState({
    companyName: "Liquid Screen Design",
    companyLogo: "",
    timezone: "America/New_York",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    defaultMargin: "30",
    minimumMargin: "15",
    maxOrderValue: "50000",
    requireApprovalOver: "5000",
  });

  // Fetch branding settings to get companyName
  const { data: brandingSettings } = useQuery<{
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    sidebarBackgroundColor?: string;
    sidebarTextColor?: string;
    sidebarBorderColor?: string;
    navHoverColor?: string;
    navActiveColor?: string;
    navTextColor?: string;
    navTextActiveColor?: string;
    borderColor?: string;
    logoSize?: string;
    logoPosition?: string;
    faviconUrl?: string;
    tagline?: string;
    borderRadius?: string;
    fontFamily?: string;
  }>({
    queryKey: ["/api/settings/branding"],
  });

  const saveBrandingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/settings/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          errorData.message || "Failed to save branding settings",
        );
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/branding"] });
      toast({
        title: "Settings Saved",
        description: "General settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save settings.",
      });
    },
  });

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

  const saveSettings = async () => {
    try {
      await apiRequest("PUT", "/api/admin/settings/general", {
        timezone: generalSettings.timezone,
        currency: generalSettings.currency,
        dateFormat: generalSettings.dateFormat,
        defaultMargin: generalSettings.defaultMargin,
        minimumMargin: generalSettings.minimumMargin,
        maxOrderValue: generalSettings.maxOrderValue,
        requireApprovalOver: generalSettings.requireApprovalOver,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          General Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={generalSettings.companyName}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  companyName: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={generalSettings.currency}
              onValueChange={(value) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  currency: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (&#8364;)</SelectItem>
                <SelectItem value="GBP">GBP (&#163;)</SelectItem>
                <SelectItem value="CAD">CAD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultMargin">Default Margin (%)</Label>
            <Input
              id="defaultMargin"
              type="number"
              value={generalSettings.defaultMargin}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  defaultMargin: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minimumMargin">Minimum Margin (%)</Label>
            <Input
              id="minimumMargin"
              type="number"
              value={generalSettings.minimumMargin}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  minimumMargin: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxOrderValue">Max Order Value ($)</Label>
            <Input
              id="maxOrderValue"
              type="number"
              value={generalSettings.maxOrderValue}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  maxOrderValue: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requireApprovalOver">
              Require Approval Over ($)
            </Label>
            <Input
              id="requireApprovalOver"
              type="number"
              value={generalSettings.requireApprovalOver}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  requireApprovalOver: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <Button
          onClick={saveSettings}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          Save General Settings
        </Button>
      </CardContent>
    </Card>
  );
}
