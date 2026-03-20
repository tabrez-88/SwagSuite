import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Palette, Save } from "lucide-react";
import { useThemeTab } from "./hooks";

export function ThemeTab() {
  const {
    theme,
    updateThemeColor,
    saveTheme,
    authLoading,
    hasAccess,
    user,
    isSaving,
  } = useThemeTab();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          System Theme
        </CardTitle>
        <p className="text-sm text-gray-600">
          Customize system colors and visual appearance.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label>Primary Colors</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="primaryColor">Primary</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <Input
                    id="primaryColor"
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => updateThemeColor("primaryColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="secondaryColor">Secondary</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.secondaryColor }}
                  />
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => updateThemeColor("secondaryColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="accentColor">Accent</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <Input
                    id="accentColor"
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => updateThemeColor("accentColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Label>Background & Text</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="backgroundColor">Background</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.backgroundColor }}
                  />
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => updateThemeColor("backgroundColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="textColor">Text</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.textColor }}
                  />
                  <Input
                    id="textColor"
                    type="color"
                    value={theme.textColor}
                    onChange={(e) => updateThemeColor("textColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sidebar Colors Section */}
        <div className="space-y-4">
          <Label>Sidebar Colors</Label>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sidebarBackgroundColor">Background</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.sidebarBackgroundColor }}
                  />
                  <Input
                    id="sidebarBackgroundColor"
                    type="color"
                    value={theme.sidebarBackgroundColor}
                    onChange={(e) => updateThemeColor("sidebarBackgroundColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sidebarTextColor">Text</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.sidebarTextColor }}
                  />
                  <Input
                    id="sidebarTextColor"
                    type="color"
                    value={theme.sidebarTextColor}
                    onChange={(e) => updateThemeColor("sidebarTextColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sidebarBorderColor">Border</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.sidebarBorderColor }}
                  />
                  <Input
                    id="sidebarBorderColor"
                    type="color"
                    value={theme.sidebarBorderColor}
                    onChange={(e) => updateThemeColor("sidebarBorderColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Navigation Colors Section */}
        <div className="space-y-4">
          <Label>Navigation Colors</Label>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="navHoverColor">Hover</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.navHoverColor }}
                  />
                  <Input
                    id="navHoverColor"
                    type="color"
                    value={theme.navHoverColor}
                    onChange={(e) => updateThemeColor("navHoverColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="navActiveColor">Active</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.navActiveColor }}
                  />
                  <Input
                    id="navActiveColor"
                    type="color"
                    value={theme.navActiveColor}
                    onChange={(e) => updateThemeColor("navActiveColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="navTextColor">Text</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.navTextColor }}
                  />
                  <Input
                    id="navTextColor"
                    type="color"
                    value={theme.navTextColor}
                    onChange={(e) => updateThemeColor("navTextColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="navTextActiveColor">Text Active</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: theme.navTextActiveColor }}
                  />
                  <Input
                    id="navTextActiveColor"
                    type="color"
                    value={theme.navTextActiveColor}
                    onChange={(e) => updateThemeColor("navTextActiveColor", e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* UI Colors Section */}
        <div className="space-y-4">
          <Label>UI Colors</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between max-w-md">
              <Label htmlFor="borderColor">Border Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: theme.borderColor }}
                />
                <Input
                  id="borderColor"
                  type="color"
                  value={theme.borderColor}
                  onChange={(e) => updateThemeColor("borderColor", e.target.value)}
                  className="w-16 h-8 p-1"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />
        <div className="space-y-4">
          <Label>Theme Preview</Label>
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: theme.backgroundColor,
              color: theme.textColor,
              borderColor: theme.secondaryColor,
            }}
          >
            <div className="flex items-center gap-4 mb-3">
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: theme.primaryColor }}
              />
              <h3 style={{ color: theme.textColor }}>
                Sample Header
              </h3>
            </div>
            <p className="text-sm mb-2">
              This is how your theme will look in the application.
            </p>
            <Button
              size="sm"
              style={{
                backgroundColor: theme.accentColor,
                color: "#ffffff",
              }}
            >
              Sample Button
            </Button>
          </div>
        </div>
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
                  Only users with admin or manager role can modify theme
                  settings. Please contact an administrator to change your
                  role.
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
                ? "Apply your theme changes to update the system appearance."
                : "Only administrators and managers can modify theme settings."}
          </p>
          <Button
            onClick={saveTheme}
            disabled={authLoading || !hasAccess || isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Apply Theme"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
