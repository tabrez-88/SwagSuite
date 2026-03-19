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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Clock,
  Image,
  Save,
} from "lucide-react";

export function BrandingTab() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin =
    (user as any)?.role === "admin" ||
    (user as any)?.email === "bgoltzman@liquidscreendesign.com";
  const isManager = (user as any)?.role === "manager";
  const hasAccess = isAdmin || isManager;

  // Fetch branding settings from API
  const { data: brandingSettings } = useQuery<{
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
  }>({
    queryKey: ["/api/settings/branding"],
  });

  const [logoConfig, setLogoConfig] = useState({
    current: "",
    uploading: false,
  });

  // Initialize from API data
  useEffect(() => {
    if (brandingSettings) {
      setLogoConfig((prev) => ({
        ...prev,
        current: brandingSettings.logoUrl || "",
      }));
    }
  }, [brandingSettings]);

  // Mutation to save branding settings
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          System Branding
        </CardTitle>
        <p className="text-sm text-gray-600">
          Customize your system logo and branding elements.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Current Logo</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border rounded-lg flex items-center justify-center overflow-hidden">
              {logoConfig.current ? (
                <img
                  src={logoConfig.current}
                  alt="System Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Upload a new logo (JPEG, PNG, GIF, or WebP format)
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleLogoUpload}
                  disabled={logoConfig.uploading}
                  className="w-auto"
                />
                {logoConfig.uploading && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <Label>Logo Placement</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoSize">Logo Size</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (32px)</SelectItem>
                  <SelectItem value="medium">Medium (48px)</SelectItem>
                  <SelectItem value="large">Large (64px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoPosition">Position</Label>
              <Select defaultValue="left">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Top Left</SelectItem>
                  <SelectItem value="center">Top Center</SelectItem>
                  <SelectItem value="right">Top Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <Separator />

        {/* Debug Info */}
        {!authLoading && !hasAccess && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 font-semibold">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Admin/Manager Access Required
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Current Role:{" "}
                  <span className="font-mono font-semibold">
                    {(user as any)?.role || "unknown"}
                  </span>{" "}
                  • Email:{" "}
                  <span className="font-mono">
                    {(user as any)?.email || "unknown"}
                  </span>
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Only users with admin or manager role can modify
                  branding settings. Please contact an administrator to
                  change your role.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {authLoading
              ? "Loading..."
              : hasAccess
                ? "Save your branding changes to apply them system-wide."
                : "Only administrators and managers can modify branding settings."}
          </p>
          <Button
            onClick={saveBranding}
            disabled={
              authLoading || !hasAccess || saveBrandingMutation.isPending
            }
          >
            <Save className="w-4 h-4 mr-2" />
            {saveBrandingMutation.isPending
              ? "Saving..."
              : "Save Branding"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
