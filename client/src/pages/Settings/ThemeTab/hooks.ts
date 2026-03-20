import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { BrandingSettings, ThemeState } from "./types";

const DEFAULT_THEME: ThemeState = {
  primaryColor: "#3b82f6",
  secondaryColor: "#64748b",
  accentColor: "#10b981",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  sidebarBackgroundColor: "#014559",
  sidebarTextColor: "#ffffff",
  sidebarBorderColor: "#374151",
  navHoverColor: "#374151",
  navActiveColor: "#3b82f6",
  navTextColor: "#d1d5db",
  navTextActiveColor: "#ffffff",
  borderColor: "#e5e7eb",
};

export function useThemeTab() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin =
    (user as any)?.role === "admin" ||
    (user as any)?.email === "bgoltzman@liquidscreendesign.com";
  const isManager = (user as any)?.role === "manager";
  const hasAccess = isAdmin || isManager;

  const { data: brandingSettings } = useQuery<BrandingSettings>({
    queryKey: ["/api/settings/branding"],
  });

  const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (brandingSettings) {
      setTheme({
        primaryColor: brandingSettings.primaryColor || DEFAULT_THEME.primaryColor,
        secondaryColor: brandingSettings.secondaryColor || DEFAULT_THEME.secondaryColor,
        accentColor: brandingSettings.accentColor || DEFAULT_THEME.accentColor,
        backgroundColor: brandingSettings.backgroundColor || DEFAULT_THEME.backgroundColor,
        textColor: brandingSettings.textColor || DEFAULT_THEME.textColor,
        sidebarBackgroundColor: brandingSettings.sidebarBackgroundColor || DEFAULT_THEME.sidebarBackgroundColor,
        sidebarTextColor: brandingSettings.sidebarTextColor || DEFAULT_THEME.sidebarTextColor,
        sidebarBorderColor: brandingSettings.sidebarBorderColor || DEFAULT_THEME.sidebarBorderColor,
        navHoverColor: brandingSettings.navHoverColor || DEFAULT_THEME.navHoverColor,
        navActiveColor: brandingSettings.navActiveColor || DEFAULT_THEME.navActiveColor,
        navTextColor: brandingSettings.navTextColor || DEFAULT_THEME.navTextColor,
        navTextActiveColor: brandingSettings.navTextActiveColor || DEFAULT_THEME.navTextActiveColor,
        borderColor: brandingSettings.borderColor || DEFAULT_THEME.borderColor,
      });
      setLogoUrl(brandingSettings.logoUrl || "");
    }
  }, [brandingSettings]);

  const updateThemeColor = (colorType: string, color: string) => {
    setTheme((prev) => ({ ...prev, [colorType]: color }));
  };

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
        title: "Branding Saved",
        description: "System branding and theme have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save branding settings.",
      });
    },
  });

  const saveTheme = () => {
    saveBrandingMutation.mutate({
      ...theme,
      logoUrl: logoUrl,
      logoSize: brandingSettings?.logoSize || "medium",
      logoPosition: brandingSettings?.logoPosition || "left",
      faviconUrl: brandingSettings?.faviconUrl || null,
      companyName: brandingSettings?.companyName || null,
      tagline: brandingSettings?.tagline || null,
      borderRadius: brandingSettings?.borderRadius || "medium",
      fontFamily: brandingSettings?.fontFamily || "inter",
    });
  };

  return {
    theme,
    updateThemeColor,
    saveTheme,
    authLoading,
    hasAccess,
    user,
    isSaving: saveBrandingMutation.isPending,
  };
}
