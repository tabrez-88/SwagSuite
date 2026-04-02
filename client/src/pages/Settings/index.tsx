import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Brain,
  Factory,
  Globe,
  Grid3X3,
  Image,
  List,
  Mail,
  Palette,
  Receipt,
  Settings2,
  Settings as SettingsIcon,
  Shield,
  ToggleRight,
  Users,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { FeaturesTab } from "./FeaturesTab";
import { UsersTab } from "./UsersTab";
import { EmailReportsTab } from "./EmailReportsTab";
import { GeneralTab } from "./GeneralTab";
import { NotificationsTab } from "./NotificationsTab";
import { EmailConfigTab } from "./EmailConfigTab";
import { IntegrationsTab } from "./IntegrationsTab";
import { BrandingTab } from "./BrandingTab";
import { ThemeTab } from "./ThemeTab";
import { FormsTab } from "./FormsTab";
import { ProductionStagesTab } from "./ProductionStagesTab";
import { ImportTab } from "./ImportTab";
import { DecoratorMatrixTab } from "./DecoratorMatrixTab";
import { TaxCodesTab } from "./TaxCodesTab";
import { EmailTemplatesTab } from "./EmailTemplatesTab";

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get("tab") || "features");

  // Load admin settings from backend
  const { data: adminSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    enabled:
      (user as any)?.role === "admin" || (user as any)?.role === "manager",
  });

  const isAdmin =
    (user as any)?.role === "admin" ||
    (user as any)?.email === "bgoltzman@liquidscreendesign.com";
  const isManager = (user as any)?.role === "manager";
  const hasAccess = isAdmin || isManager;

  if (settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <Settings2 className="w-12 h-12 text-gray-400 mb-4 animate-spin" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading Settings
        </h2>
        <p className="text-gray-600">
          Please wait while we load the system configuration...
        </p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <Shield className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-600">
          You need administrator or manager privileges to access system
          settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">
            Manage features, users, and system configuration
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {isAdmin ? "Administrator" : "Manager"} Access
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 justify-start flex-wrap gap-2">
          <TabsTrigger value="features" className="flex items-center gap-2">
            <ToggleRight className="w-4 h-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="email-reports"
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email Reports
          </TabsTrigger>
          <TabsTrigger value="email-config" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Config
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="production-stages" className="flex items-center gap-2">
            <Factory className="w-4 h-4" />
            Production Stages
          </TabsTrigger>
          <TabsTrigger value="decorator-matrix" className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Decorator Matrix
          </TabsTrigger>
          <TabsTrigger value="tax-codes" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Tax Codes
          </TabsTrigger>
          <TabsTrigger value="email-templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Data Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <FeaturesTab user={user} adminSettings={adminSettings} />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersTab user={user} />
        </TabsContent>

        <TabsContent value="email-reports" className="space-y-6">
          <EmailReportsTab />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <GeneralTab adminSettings={adminSettings} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <BrandingTab />
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <ThemeTab />
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <FormsTab />
        </TabsContent>

        <TabsContent value="production-stages" className="space-y-6">
          <ProductionStagesTab />
        </TabsContent>

        <TabsContent value="decorator-matrix" className="space-y-6">
          <DecoratorMatrixTab />
        </TabsContent>

        <TabsContent value="tax-codes" className="space-y-6">
          <TaxCodesTab />
        </TabsContent>

        <TabsContent value="email-templates" className="space-y-6">
          <EmailTemplatesTab />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <ImportTab />
        </TabsContent>

        <TabsContent value="email-config">
          <EmailConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
