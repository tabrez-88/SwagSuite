import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface BrandingSettings {
  logoUrl?: string;
  logoSize?: string;
  logoPosition?: string;
  faviconUrl?: string;
  companyName?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  sidebarBackgroundColor?: string;
  sidebarTextColor?: string;
  sidebarBorderColor?: string;
  navHoverColor?: string;
  navActiveColor?: string;
  navTextColor?: string;
  navTextActiveColor?: string;
  borderColor?: string;
}

export function useBrandingTab() {
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

  const [logoConfig, setLogoConfig] = useState({
    current: "",
    uploading: false,
  });

  useEffect(() => {
    if (brandingSettings) {
      setLogoConfig((prev) => ({
        ...prev,
        current: brandingSettings.logoUrl || "",
      }));
    }
  }, [brandingSettings]);

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

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (
      file &&
      (file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/gif" ||
        file.type === "image/webp")
    ) {
      setLogoConfig((prev) => ({ ...prev, uploading: true }));

      try {
        const formData = new FormData();
        formData.append("logo", file);

        const response = await fetch("/api/settings/logo", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to upload logo");
        }

        const result = await response.json();

        setLogoConfig({ current: result.logoUrl, uploading: false });

        queryClient.invalidateQueries({ queryKey: ["/api/settings/branding"] });

        toast({
          title: "Logo Updated",
          description: "System logo has been successfully uploaded and saved.",
        });
      } catch (error: any) {
        setLogoConfig((prev) => ({ ...prev, uploading: false }));
        toast({
          title: "Upload Failed",
          description:
            error.message || "Failed to upload logo. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please select a JPEG, PNG, GIF, or WebP file.",
        variant: "destructive",
      });
    }
  };

  const saveBranding = () => {
    saveBrandingMutation.mutate({
      primaryColor: brandingSettings?.primaryColor || "#3b82f6",
      secondaryColor: brandingSettings?.secondaryColor || "#64748b",
      accentColor: brandingSettings?.accentColor || "#10b981",
      backgroundColor: brandingSettings?.backgroundColor || "#ffffff",
      textColor: brandingSettings?.textColor || "#1f2937",
      sidebarBackgroundColor: brandingSettings?.sidebarBackgroundColor || "#014559",
      sidebarTextColor: brandingSettings?.sidebarTextColor || "#ffffff",
      sidebarBorderColor: brandingSettings?.sidebarBorderColor || "#374151",
      navHoverColor: brandingSettings?.navHoverColor || "#374151",
      navActiveColor: brandingSettings?.navActiveColor || "#3b82f6",
      navTextColor: brandingSettings?.navTextColor || "#d1d5db",
      navTextActiveColor: brandingSettings?.navTextActiveColor || "#ffffff",
      borderColor: brandingSettings?.borderColor || "#e5e7eb",
      logoUrl: logoConfig.current,
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
    user,
    authLoading,
    hasAccess,
    logoConfig,
    saveBrandingMutation,
    handleLogoUpload,
    saveBranding,
  };
}
