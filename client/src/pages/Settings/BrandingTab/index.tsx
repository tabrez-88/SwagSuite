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
import {
  Clock,
  Image,
  Save,
} from "lucide-react";
import { useBrandingTab } from "./hooks";

export function BrandingTab() {
  const {
    user,
    authLoading,
    hasAccess,
    logoConfig,
    saveBrandingMutation,
    handleLogoUpload,
    saveBranding,
  } = useBrandingTab();

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
              <span className="text-yellow-600 font-semibold">&#x26A0;&#xFE0F;</span>
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Admin/Manager Access Required
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Current Role:{" "}
                  <span className="font-mono font-semibold">
                    {(user as any)?.role || "unknown"}
                  </span>{" "}
                  &bull; Email:{" "}
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
