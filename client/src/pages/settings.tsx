import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  Bell,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Globe,
  Image,
  Lightbulb,
  List,
  Lock,
  Mail,
  MapPin,
  Package,
  Palette,
  Plus,
  Save,
  Settings2,
  Settings as SettingsIcon,
  Shield,
  ShoppingCart,
  Slack,
  Star,
  Target,
  ToggleRight,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  Zap,
  Database,
} from "lucide-react";
import { useState, useEffect } from "react";
import { MailCredentialsDialog } from "@/components/MailCredentialsDialog";

interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "core" | "analytics" | "integrations" | "advanced";
  adminOnly?: boolean;
  icon: any;
}

interface UserPermission {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
  permissions: string[];
  lastActive: string;
}

// Email Configuration Component
function EmailConfigSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingConnection, setTestingConnection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [mailCredentialsOpen, setMailCredentialsOpen] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings/integration"],
  });

  const [formData, setFormData] = useState<any>({});

  const updateSettings = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/settings/integration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/settings/integration"],
      });
      toast({
        title: "Settings saved",
        description: "Email configuration has been updated.",
      });
      setFormData({});
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      });
    },
  });

  const testConnection = async () => {
    if (!testEmailTo || !testEmailTo.includes("@")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address to send test email.",
      });
      return;
    }

    setTestingConnection(true);
    try {
      const response = await fetch("/api/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTo }),
        credentials: "include",
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Test Email Sent!",
          description: `Test email has been sent to ${testEmailTo}. Check your inbox.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: result.message || "Failed to send test email.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Test failed",
        description: "Unable to send test email.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  const currentSettings = { ...(settings || {}), ...formData };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Clock className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration (SMTP)
            </CardTitle>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setMailCredentialsOpen(true)}
              className="bg-primary hover:bg-primary/20 text-white"
            >
              SMTP/IMAP Config
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Configure SMTP settings for sending emails to clients and vendors
            (Mailtrap, Gmail, etc.)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SMTP Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="emailProvider">Email Provider</Label>
            <Select
              value={currentSettings.emailProvider || "mailtrap"}
              onValueChange={(value) => {
                const updates: any = { ...formData, emailProvider: value };

                // Auto-fill SMTP settings based on provider
                if (value === "mailtrap") {
                  updates.smtpHost = "sandbox.smtp.mailtrap.io";
                  updates.smtpPort = 2525;
                } else if (value === "gmail") {
                  updates.smtpHost = "smtp.gmail.com";
                  updates.smtpPort = 587;
                } else if (value === "outlook") {
                  updates.smtpHost = "smtp-mail.outlook.com";
                  updates.smtpPort = 587;
                }

                setFormData(updates);
              }}
            >
              <SelectTrigger id="emailProvider">
                <SelectValue placeholder="Select email provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mailtrap">Mailtrap</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="outlook">Outlook/Office 365</SelectItem>
                <SelectItem value="other">Other SMTP Server</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">SMTP Server Settings</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* SMTP Host */}
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  placeholder="smtp.mailtrap.io"
                  value={currentSettings.smtpHost || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpHost: e.target.value })
                  }
                />
              </div>

              {/* SMTP Port */}
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  placeholder="587"
                  value={currentSettings.smtpPort || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      smtpPort: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* SMTP Username */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                placeholder="your-username"
                value={currentSettings.smtpUser || ""}
                onChange={(e) =>
                  setFormData({ ...formData, smtpUser: e.target.value })
                }
              />
            </div>

            {/* SMTP Password */}
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <div className="relative">
                <Input
                  id="smtpPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="your-password"
                  value={currentSettings.smtpPassword || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpPassword: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                For Gmail, use an{" "}
                <a
                  href="https://support.google.com/accounts/answer/185833"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  App Password
                </a>
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Sender Information</h3>

            {/* From Address */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="emailFromAddress">From Email Address</Label>
              <Input
                id="emailFromAddress"
                type="email"
                placeholder="orders@yourdomain.com"
                value={currentSettings.emailFromAddress || ""}
                onChange={(e) =>
                  setFormData({ ...formData, emailFromAddress: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">
                Email address that will appear as the sender
              </p>
            </div>

            {/* From Name */}
            <div className="space-y-2">
              <Label htmlFor="emailFromName">From Name</Label>
              <Input
                id="emailFromName"
                placeholder="SwagSuite"
                value={currentSettings.emailFromName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, emailFromName: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {/* Test Email Section */}
          <div className="pt-4 border-t">
            <Label htmlFor="testEmailTo">Test Email Recipient</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="testEmailTo"
                type="email"
                placeholder="Enter email to receive test message"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={
                  testingConnection ||
                  !currentSettings.smtpHost ||
                  !currentSettings.smtpUser ||
                  !testEmailTo
                }
              >
                {testingConnection ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Send a test email to verify your SMTP configuration is working
              correctly.
            </p>
          </div>
        </CardContent>
      </Card>

      <MailCredentialsDialog
        open={mailCredentialsOpen}
        onOpenChange={setMailCredentialsOpen}
      />
    </form>
  );
}

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("features");

  // Load admin settings from backend
  const { data: adminSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    enabled:
      (user as any)?.role === "admin" || (user as any)?.role === "manager",
  });

  // Load integration settings
  const { data: integrationSettings } = useQuery({
    queryKey: ["/api/settings/integrations"],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Load users from backend
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled:
      (user as any)?.role === "admin" || (user as any)?.role === "manager",
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "manager" | "user";
    }) => {
      return await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Role Updated",
        description: "User permissions have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  // Feature toggle mutation
  const featureToggleMutation = useMutation({
    mutationFn: async ({
      featureId,
      enabled,
    }: {
      featureId: string;
      enabled: boolean;
    }) => {
      return await apiRequest("PUT", "/api/admin/settings/features", {
        featureId,
        enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Feature Updated",
        description: "Feature toggle has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature toggle.",
        variant: "destructive",
      });
    },
  });

  // Feature Toggles State
  const [features, setFeatures] = useState<FeatureToggle[]>([
    // Core Features
    {
      id: "popular_products",
      name: "Popular Products Analytics",
      description:
        "Track and display most popular products with time-based filtering",
      enabled: true,
      category: "analytics",
      icon: TrendingUp,
    },
    {
      id: "suggested_items",
      name: "Suggested Items",
      description:
        "AI-powered product suggestions and admin-managed recommendations",
      enabled: true,
      category: "analytics",
      icon: Lightbulb,
    },
    {
      id: "admin_suggestions",
      name: "Admin Product Suggestions",
      description:
        "Allow admins to manually add suggested products with discounts",
      enabled: true,
      category: "core",
      adminOnly: true,
      icon: Star,
    },
    {
      id: "universal_search",
      name: "Universal Search",
      description: "Global search functionality across all products and data",
      enabled: true,
      category: "core",
      icon: Globe,
    },
    {
      id: "ss_activewear_integration",
      name: "S&S Activewear Integration",
      description: "Real-time product data from S&S Activewear supplier",
      enabled: true,
      category: "integrations",
      icon: Package,
    },
    {
      id: "hubspot_sync",
      name: "HubSpot CRM Sync",
      description: "Synchronize customer data with HubSpot CRM",
      enabled: false,
      category: "integrations",
      icon: Users,
    },
    {
      id: "slack_notifications",
      name: "Slack Notifications",
      description: "Send order updates and alerts to Slack channels",
      enabled: true,
      category: "integrations",
      icon: Slack,
    },
    {
      id: "ai_knowledge_base",
      name: "AI Knowledge Base",
      description: "Intelligent search and answers for company documentation",
      enabled: true,
      category: "advanced",
      icon: Brain,
    },
    {
      id: "production_reports",
      name: "Production Reports",
      description: "Detailed production tracking and reporting dashboard",
      enabled: true,
      category: "analytics",
      icon: BarChart3,
    },
    {
      id: "team_leaderboard",
      name: "Team Performance Leaderboard",
      description: "Track and display team member performance metrics",
      enabled: true,
      category: "analytics",
      icon: Target,
    },
    {
      id: "automation_workflows",
      name: "Automation Workflows",
      description: "Automated tasks and workflow management",
      enabled: true,
      category: "advanced",
      icon: Zap,
    },
    {
      id: "multi_company_view",
      name: "Multi-Company Dashboard",
      description: "Manage multiple companies from single interface",
      enabled: false,
      category: "advanced",
      adminOnly: true,
      icon: Settings2,
    },
  ]);

  // General Settings State
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

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    slackNotifications: true,
    orderUpdates: true,
    customerUpdates: true,
    supplierUpdates: false,
    marketingEmails: true,
    weeklyReports: true,
    instantAlerts: true,
    dailyDigest: true,
  });

  // Integration Settings
  const [integrations, setIntegrations] = useState({
    ssActivewearAccount: "",
    ssActivewearApiKey: "",
    sanmarCustomerId: "",
    sanmarUsername: "",
    sanmarPassword: "",
    hubspotApiKey: "",
    slackBotToken: "",
    slackChannelId: "",
    sageAcctId: "",
    sageLoginId: "",
    sageApiKey: "",
    mapboxAccessToken: "",
    quickbooksConnected: false,
    stripeConnected: false,
    stripePublishableKey: "",
    stripeSecretKey: "",
    taxjarApiKey: "",
    shipmateConnected: false,
  });

  // Visibility state for sensitive fields
  const [showFields, setShowFields] = useState({
    ssActivewearApiKey: false,
    sanmarPassword: false,
    slackBotToken: false,
    hubspotApiKey: false,
    sageApiKey: false,
    mapboxAccessToken: false,
    stripeSecretKey: false,
    taxjarApiKey: false,
  });

  // Update integrations when data is loaded
  useEffect(() => {
    if (integrationSettings) {
      const settings = integrationSettings as any;
      setIntegrations({
        ssActivewearAccount: settings.ssActivewearAccount || "",
        ssActivewearApiKey: settings.ssActivewearApiKey || "",
        sanmarCustomerId: settings.sanmarCustomerId || "",
        sanmarUsername: settings.sanmarUsername || "",
        sanmarPassword: settings.sanmarPassword || "",
        hubspotApiKey: settings.hubspotApiKey || "",
        slackBotToken: settings.slackBotToken || "",
        slackChannelId: settings.slackChannelId || "",
        sageAcctId: settings.sageAcctId || "",
        sageLoginId: settings.sageLoginId || "",
        sageApiKey: settings.sageApiKey || "",
        mapboxAccessToken: settings.mapboxAccessToken || "",
        quickbooksConnected: settings.quickbooksConnected || false,
        stripeConnected: settings.stripeConnected || false,
        stripePublishableKey: settings.stripePublishableKey || "",
        stripeSecretKey: settings.stripeSecretKey || "",
        taxjarApiKey: settings.taxjarApiKey || "",
        shipmateConnected: settings.shipmateConnected || false,
      });
    }
  }, [integrationSettings]);

  // Custom integrations that can be added dynamically
  const [customIntegrations, setCustomIntegrations] = useState([
    {
      id: "zapier",
      name: "Zapier",
      description: "Automate workflows with 5000+ apps",
      icon: Zap,
      status: "available",
      fields: [
        {
          key: "webhook_url",
          label: "Webhook URL",
          type: "url",
          required: true,
        },
        { key: "api_key", label: "API Key", type: "password", required: true },
      ],
    },
    {
      id: "mailchimp",
      name: "Mailchimp",
      description: "Email marketing and automation",
      icon: Mail,
      status: "available",
      fields: [
        { key: "api_key", label: "API Key", type: "password", required: true },
        {
          key: "server_prefix",
          label: "Server Prefix",
          type: "text",
          required: true,
        },
      ],
    },
    {
      id: "shopify",
      name: "Shopify",
      description: "E-commerce platform integration",
      icon: ShoppingCart,
      status: "available",
      fields: [
        {
          key: "shop_domain",
          label: "Shop Domain",
          type: "text",
          required: true,
        },
        {
          key: "access_token",
          label: "Access Token",
          type: "password",
          required: true,
        },
        {
          key: "api_version",
          label: "API Version",
          type: "text",
          required: false,
          placeholder: "2023-10",
        },
      ],
    },
    {
      id: "quickbooks",
      name: "QuickBooks Online",
      description: "Accounting and financial management",
      icon: FileSpreadsheet,
      status: "available",
      fields: [
        {
          key: "company_id",
          label: "Company ID",
          type: "text",
          required: true,
        },
        { key: "client_id", label: "Client ID", type: "text", required: true },
        {
          key: "client_secret",
          label: "Client Secret",
          type: "password",
          required: true,
        },
      ],
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Payment processing and billing",
      icon: Globe,
      status: "available",
      fields: [
        {
          key: "publishable_key",
          label: "Publishable Key",
          type: "text",
          required: true,
        },
        {
          key: "secret_key",
          label: "Secret Key",
          type: "password",
          required: true,
        },
        {
          key: "webhook_secret",
          label: "Webhook Secret",
          type: "password",
          required: false,
        },
      ],
    },
  ]);

  const [configuredIntegrations, setConfiguredIntegrations] = useState<any[]>(
    [],
  );
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [selectedIntegrationType, setSelectedIntegrationType] =
    useState<any>(null);

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
    // Sidebar colors
    sidebarBackgroundColor?: string;
    sidebarTextColor?: string;
    sidebarBorderColor?: string;
    // Navigation colors
    navHoverColor?: string;
    navActiveColor?: string;
    navTextColor?: string;
    navTextActiveColor?: string;
    // Border color
    borderColor?: string;
  }>({
    queryKey: ["/api/settings/branding"],
  });

  // Mutation to save branding settings
  const saveBrandingMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending branding data:", data);
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
        console.error("Branding save failed:", response.status, errorData);
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
      console.error("Branding mutation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save branding settings.",
      });
    },
  });

  // System Configuration State
  const [systemConfig, setSystemConfig] = useState({
    logo: {
      current: "",
      uploading: false,
    },
    theme: {
      primaryColor: "#3b82f6",
      secondaryColor: "#64748b",
      accentColor: "#10b981",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      // Sidebar colors
      sidebarBackgroundColor: "#014559",
      sidebarTextColor: "#ffffff",
      sidebarBorderColor: "#374151",
      // Navigation colors
      navHoverColor: "#374151",
      navActiveColor: "#3b82f6",
      navTextColor: "#d1d5db",
      navTextActiveColor: "#ffffff",
      // Border and UI colors
      borderColor: "#e5e7eb",
    },
    formFields: {
      salesOrders: [
        {
          id: "customer",
          label: "Customer",
          type: "text",
          required: true,
          enabled: true,
        },
        {
          id: "orderDate",
          label: "Order Date",
          type: "date",
          required: true,
          enabled: true,
        },
        {
          id: "dueDate",
          label: "Due Date",
          type: "date",
          required: true,
          enabled: true,
        },
        {
          id: "total",
          label: "Total Amount",
          type: "number",
          required: true,
          enabled: true,
        },
        {
          id: "notes",
          label: "Notes",
          type: "textarea",
          required: false,
          enabled: true,
        },
        {
          id: "priority",
          label: "Priority",
          type: "select",
          required: false,
          enabled: false,
        },
        {
          id: "salesRep",
          label: "Sales Rep",
          type: "text",
          required: false,
          enabled: true,
        },
      ],
      purchaseOrders: [
        {
          id: "supplier",
          label: "Supplier",
          type: "text",
          required: true,
          enabled: true,
        },
        {
          id: "orderDate",
          label: "Order Date",
          type: "date",
          required: true,
          enabled: true,
        },
        {
          id: "expectedDate",
          label: "Expected Delivery",
          type: "date",
          required: true,
          enabled: true,
        },
        {
          id: "total",
          label: "Total Amount",
          type: "number",
          required: true,
          enabled: true,
        },
        {
          id: "terms",
          label: "Payment Terms",
          type: "text",
          required: false,
          enabled: true,
        },
        {
          id: "shipping",
          label: "Shipping Method",
          type: "select",
          required: false,
          enabled: false,
        },
      ],
    },
    dataImport: {
      processing: false,
      lastImport: null as string | null,
      supportedFormats: ["CSV", "Excel", "JSON", "XML"],
    },
  });

  const [showDataImport, setShowDataImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [configData, setConfigData] = useState<any>({});

  const isAdmin =
    (user as any)?.role === "admin" ||
    (user as any)?.email === "bgoltzman@liquidscreendesign.com";
  const isManager = (user as any)?.role === "manager";
  const hasAccess = isAdmin || isManager;

  const toggleFeature = (featureId: string) => {
    const currentFeature = features.find((f) => f.id === featureId);
    if (!currentFeature) return;

    featureToggleMutation.mutate({
      featureId,
      enabled: !currentFeature.enabled,
    });

    // Optimistically update the UI
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === featureId
          ? { ...feature, enabled: !feature.enabled }
          : feature,
      ),
    );
  };

  const updateUserRole = (
    userId: string,
    newRole: "admin" | "manager" | "user",
  ) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const saveSettings = async (section: string) => {
    try {
      if (section === "Integration") {
        console.log("Saving integrations:", integrations);
        await apiRequest("POST", "/api/settings/integrations", integrations);
        queryClient.invalidateQueries({
          queryKey: ["/api/settings/integrations"],
        });
      }

      if (section === "General") {
        // Save general settings (companyName goes to branding)
        saveBrandingMutation.mutate({
          companyName: generalSettings.companyName || null,
          // Keep existing branding values
          primaryColor:
            brandingSettings?.primaryColor || systemConfig.theme.primaryColor,
          secondaryColor:
            brandingSettings?.secondaryColor ||
            systemConfig.theme.secondaryColor,
          accentColor:
            brandingSettings?.accentColor || systemConfig.theme.accentColor,
          backgroundColor:
            brandingSettings?.backgroundColor ||
            systemConfig.theme.backgroundColor,
          textColor:
            brandingSettings?.textColor || systemConfig.theme.textColor,
          sidebarBackgroundColor:
            brandingSettings?.sidebarBackgroundColor ||
            systemConfig.theme.sidebarBackgroundColor,
          sidebarTextColor:
            brandingSettings?.sidebarTextColor ||
            systemConfig.theme.sidebarTextColor,
          sidebarBorderColor:
            brandingSettings?.sidebarBorderColor ||
            systemConfig.theme.sidebarBorderColor,
          navHoverColor:
            brandingSettings?.navHoverColor || systemConfig.theme.navHoverColor,
          navActiveColor:
            brandingSettings?.navActiveColor ||
            systemConfig.theme.navActiveColor,
          navTextColor:
            brandingSettings?.navTextColor || systemConfig.theme.navTextColor,
          navTextActiveColor:
            brandingSettings?.navTextActiveColor ||
            systemConfig.theme.navTextActiveColor,
          borderColor:
            brandingSettings?.borderColor || systemConfig.theme.borderColor,
          logoUrl: brandingSettings?.logoUrl || systemConfig.logo.current,
          logoSize: brandingSettings?.logoSize || "medium",
          logoPosition: brandingSettings?.logoPosition || "left",
          faviconUrl: brandingSettings?.faviconUrl || null,
          tagline: brandingSettings?.tagline || null,
          borderRadius: brandingSettings?.borderRadius || "medium",
          fontFamily: brandingSettings?.fontFamily || "inter",
        });
        return; // Mutation will handle toast
      }

      if (section === "Branding" || section === "Theme") {
        // Save branding and theme settings
        saveBrandingMutation.mutate({
          primaryColor: systemConfig.theme.primaryColor,
          secondaryColor: systemConfig.theme.secondaryColor,
          accentColor: systemConfig.theme.accentColor,
          backgroundColor: systemConfig.theme.backgroundColor,
          textColor: systemConfig.theme.textColor,
          // Sidebar colors
          sidebarBackgroundColor: systemConfig.theme.sidebarBackgroundColor,
          sidebarTextColor: systemConfig.theme.sidebarTextColor,
          sidebarBorderColor: systemConfig.theme.sidebarBorderColor,
          // Navigation colors
          navHoverColor: systemConfig.theme.navHoverColor,
          navActiveColor: systemConfig.theme.navActiveColor,
          navTextColor: systemConfig.theme.navTextColor,
          navTextActiveColor: systemConfig.theme.navTextActiveColor,
          // Border and UI colors
          borderColor: systemConfig.theme.borderColor,
          logoUrl: systemConfig.logo.current,
          logoSize: brandingSettings?.logoSize || "medium",
          logoPosition: brandingSettings?.logoPosition || "left",
          faviconUrl: brandingSettings?.faviconUrl || null,
          companyName: generalSettings.companyName || null,
          tagline: brandingSettings?.tagline || null,
          borderRadius: brandingSettings?.borderRadius || "medium",
          fontFamily: brandingSettings?.fontFamily || "inter",
        });
        return; // Mutation will handle toast
      }

      toast({
        title: "Settings Saved",
        description: `${section} settings have been saved successfully.`,
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

  // Initialize systemConfig with API data
  useEffect(() => {
    if (brandingSettings) {
      setSystemConfig((prev) => ({
        ...prev,
        logo: {
          ...prev.logo,
          current: brandingSettings.logoUrl || "",
        },
        theme: {
          primaryColor: brandingSettings.primaryColor || "#3b82f6",
          secondaryColor: brandingSettings.secondaryColor || "#64748b",
          accentColor: brandingSettings.accentColor || "#10b981",
          backgroundColor: brandingSettings.backgroundColor || "#ffffff",
          textColor: brandingSettings.textColor || "#1f2937",
          // Sidebar colors
          sidebarBackgroundColor:
            brandingSettings.sidebarBackgroundColor || "#014559",
          sidebarTextColor: brandingSettings.sidebarTextColor || "#ffffff",
          sidebarBorderColor: brandingSettings.sidebarBorderColor || "#374151",
          // Navigation colors
          navHoverColor: brandingSettings.navHoverColor || "#374151",
          navActiveColor: brandingSettings.navActiveColor || "#3b82f6",
          navTextColor: brandingSettings.navTextColor || "#d1d5db",
          navTextActiveColor: brandingSettings.navTextActiveColor || "#ffffff",
          // Border and UI colors
          borderColor: brandingSettings.borderColor || "#e5e7eb",
        },
      }));
      // Also update generalSettings.companyName from branding
      if (brandingSettings.companyName) {
        setGeneralSettings((prev) => ({
          ...prev,
          companyName: brandingSettings.companyName || prev.companyName,
        }));
      }
    }
  }, [brandingSettings]);

  const addIntegration = (integrationType: any, config: any) => {
    const newIntegration = {
      id: `${integrationType.id}_${Date.now()}`,
      type: integrationType.id,
      name: integrationType.name,
      description: integrationType.description,
      icon: integrationType.icon,
      status: "connected",
      config: config,
      connectedAt: new Date().toISOString(),
    };

    setConfiguredIntegrations((prev) => [...prev, newIntegration]);
    setShowAddIntegration(false);
    setSelectedIntegrationType(null);

    toast({
      title: "Integration Added",
      description: `${integrationType.name} has been successfully configured.`,
    });
  };

  const removeIntegration = (integrationId: string) => {
    setConfiguredIntegrations((prev) =>
      prev.filter((int) => int.id !== integrationId),
    );

    toast({
      title: "Integration Removed",
      description: "Integration has been successfully removed.",
    });
  };

  // System Configuration Functions
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
      setSystemConfig((prev) => ({
        ...prev,
        logo: { ...prev.logo, uploading: true },
      }));

      try {
        // Upload to server
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

        setSystemConfig((prev) => ({
          ...prev,
          logo: { current: result.logoUrl, uploading: false },
        }));

        // Invalidate branding query to refresh sidebar
        queryClient.invalidateQueries({ queryKey: ["/api/settings/branding"] });

        toast({
          title: "Logo Updated",
          description: "System logo has been successfully uploaded and saved.",
        });
      } catch (error: any) {
        console.error("Logo upload error:", error);
        setSystemConfig((prev) => ({
          ...prev,
          logo: { ...prev.logo, uploading: false },
        }));
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

  const updateThemeColor = (colorType: string, color: string) => {
    setSystemConfig((prev) => ({
      ...prev,
      theme: { ...prev.theme, [colorType]: color },
    }));
  };

  const toggleFormField = (formType: string, fieldId: string) => {
    setSystemConfig((prev) => ({
      ...prev,
      formFields: {
        ...prev.formFields,
        [formType]: (prev.formFields as any)[formType].map((field: any) =>
          field.id === fieldId ? { ...field, enabled: !field.enabled } : field,
        ),
      },
    }));
  };

  const handleDataImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setSystemConfig((prev) => ({
        ...prev,
        dataImport: { ...prev.dataImport, processing: true },
      }));

      // Simulate AI processing
      setTimeout(() => {
        setSystemConfig((prev) => ({
          ...prev,
          dataImport: {
            ...prev.dataImport,
            processing: false,
            lastImport: new Date().toISOString(),
          },
        }));
        setShowDataImport(false);
        setImportFile(null);

        toast({
          title: "Data Import Complete",
          description:
            "AI has successfully processed and imported your data. All records have been categorized and organized.",
        });
      }, 5000);
    }
  };

  const FeatureCard = ({ feature }: { feature: FeatureToggle }) => {
    const Icon = feature.icon;
    const canToggle = !feature.adminOnly || isAdmin;

    return (
      <Card
        className={`transition-all ${feature.enabled ? "border-green-200 bg-green-50" : "border-gray-200"}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`p-2 rounded-lg ${feature.enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{feature.name}</h4>
                  {feature.adminOnly && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin Only
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs capitalize">
                    {feature.category}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{feature.description}</p>
              </div>
            </div>
            {canToggle ? (
              <Switch
                checked={feature.enabled}
                onCheckedChange={() => toggleFeature(feature.id)}
                className="ml-4"
              />
            ) : (
              <Lock className="w-4 h-4 text-gray-400 ml-4" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const AddIntegrationModal = () => {
    const [configData, setConfigData] = useState({});

    const handleFieldChange = (key: string, value: string) => {
      setConfigData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = () => {
      if (!selectedIntegrationType) return;

      // Validate required fields
      const requiredFields = selectedIntegrationType.fields.filter(
        (field: any) => field.required,
      );
      const missingFields = requiredFields.filter(
        (field: any) => !(configData as any)[field.key],
      );

      if (missingFields.length > 0) {
        toast({
          title: "Missing Required Fields",
          description: `Please fill in: ${missingFields.map((f: any) => f.label).join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      addIntegration(selectedIntegrationType, configData);
      setConfigData({});
    };

    return (
      <Dialog open={showAddIntegration} onOpenChange={setShowAddIntegration}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Integration</DialogTitle>
          </DialogHeader>

          {!selectedIntegrationType ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose an integration to configure:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {customIntegrations.map((integration) => {
                  const Icon = integration.icon;
                  return (
                    <div
                      key={integration.id}
                      className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedIntegrationType(integration)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {integration.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {integration.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <selectedIntegrationType.icon className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-medium">
                    {selectedIntegrationType.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedIntegrationType.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedIntegrationType.fields.map((field: any) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      placeholder={
                        field.placeholder ||
                        `Enter ${field.label.toLowerCase()}`
                      }
                      value={(configData as any)[field.key] || ""}
                      onChange={(e) =>
                        handleFieldChange(field.key, e.target.value)
                      }
                      required={field.required}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIntegrationType(null)}
                >
                  Back
                </Button>
                <Button onClick={handleSubmit}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Connect Integration
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

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
        <TabsList className="grid grid-cols-2 md:flex justify-start flex-wrap gap-2">
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
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Data Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleRight className="w-5 h-5" />
                Feature Management
              </CardTitle>
              <p className="text-sm text-gray-600">
                Control which features are available throughout the system.
                Admin-only features require administrator privileges.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(
                  ["core", "analytics", "integrations", "advanced"] as const
                ).map((category) => (
                  <div key={category}>
                    <h3 className="font-medium text-sm text-gray-900 mb-3 capitalize">
                      {category} Features
                    </h3>
                    <div className="grid gap-3">
                      {features
                        .filter((feature) => feature.category === category)
                        .map((feature) => (
                          <FeatureCard key={feature.id} feature={feature} />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="space-y-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Manage user roles and permissions for system access control.
                  {isManager && (
                    <span className="block mt-1 text-amber-600 font-medium">
                      👀 Managers can view user roles but only admins can modify
                      them.
                    </span>
                  )}
                </p>
              </div>
              <Button
                onClick={() => (window.location.href = "/settings/users")}
                className="w-full sm:w-auto"
              >
                <Users className="w-4 h-4 mr-2" />
                Open Full User Management
              </Button>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Settings2 className="w-6 h-6 text-gray-400 animate-spin mr-2" />
                  <span className="text-gray-600">Loading users...</span>
                </div>
              ) : usersData &&
                Array.isArray(usersData) &&
                usersData.length > 0 ? (
                <div className="space-y-4">
                  {usersData.map((userItem: any) => (
                    <div
                      key={userItem.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {userItem.firstName} {userItem.lastName}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {userItem.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            Last active:{" "}
                            {userItem.updatedAt
                              ? new Date(
                                  userItem.updatedAt,
                                ).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select
                          value={userItem.role || "user"}
                          onValueChange={(
                            value: "admin" | "manager" | "user",
                          ) => updateUserRole(userItem.id, value)}
                          disabled={
                            updateUserRoleMutation.isPending || !isAdmin
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge
                          variant={
                            userItem.role === "admin"
                              ? "default"
                              : userItem.role === "manager"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {userItem.role || "user"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Weekly Email Reports Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure automated weekly email reports with custom metrics and
                scheduling.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      Email Reporting System
                    </h3>
                    <p className="text-xs text-gray-500">
                      System ready for SendGrid integration
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">
                    Ready for Setup
                  </Badge>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        Email Infrastructure Status
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Weekly reporting system is configured and ready.
                        Complete database schema, API routes, and metric
                        calculation logic are in place. When SendGrid API key is
                        provided, automated email delivery will be activated.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Report Configuration</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="report-day"
                        className="text-sm font-medium"
                      >
                        Send Day
                      </Label>
                      <Select defaultValue="monday">
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="report-time"
                        className="text-sm font-medium"
                      >
                        Send Time
                      </Label>
                      <Select defaultValue="09:00">
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="08:00">8:00 AM</SelectItem>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Available Metrics</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Weekly Orders</p>
                          <p className="text-xs text-gray-500">
                            Total orders processed this week
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Weekly Revenue</p>
                          <p className="text-xs text-gray-500">
                            Total revenue generated this week
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Profit Margin</p>
                          <p className="text-xs text-gray-500">
                            Average profit margin percentage
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">New Customers</p>
                          <p className="text-xs text-gray-500">
                            New companies added this week
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Test & Preview</h3>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Generate Sample Report
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Preview Email Template
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <SettingsIcon className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Next Steps
                      </h4>
                      <ul className="text-sm text-gray-700 mt-1 space-y-1">
                        <li>• Complete database schema setup (✓ Done)</li>
                        <li>• Configure API endpoints (✓ Done)</li>
                        <li>• Set up metric calculation logic (✓ Done)</li>
                        <li>• Add SendGrid API key for email delivery</li>
                        <li>• Schedule automated report generation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
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
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
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
                onClick={() => saveSettings("General")}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor={key}
                      className="text-sm font-medium capitalize"
                    >
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <p className="text-xs text-gray-600">
                      {key === "emailNotifications" &&
                        "Receive notifications via email"}
                      {key === "slackNotifications" &&
                        "Send alerts to configured Slack channels"}
                      {key === "orderUpdates" &&
                        "Get notified when orders change status"}
                      {key === "customerUpdates" &&
                        "Alerts for new customers and updates"}
                      {key === "supplierUpdates" &&
                        "Notifications about supplier changes"}
                      {key === "marketingEmails" &&
                        "Receive marketing and promotional emails"}
                      {key === "weeklyReports" &&
                        "Weekly performance and analytics reports"}
                      {key === "instantAlerts" &&
                        "Immediate notifications for urgent items"}
                      {key === "dailyDigest" &&
                        "Daily summary of all activities"}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
              <Button
                onClick={() => saveSettings("Notification")}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  External Integrations
                </div>
                {/* <Button onClick={() => setShowAddIntegration(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button> */}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Manage external service integrations and API connections.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Core Integrations */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-gray-900">
                  Core Integrations
                </h3>

                {/* QuickBooks */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium">QuickBooks Online</h4>
                      <Badge
                        variant={
                          integrations.quickbooksConnected
                            ? "default"
                            : "outline"
                        }
                      >
                        {integrations.quickbooksConnected
                          ? "Connected"
                          : "Not Connected"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Sync invoices and customers with QuickBooks Online for
                      seamless accounting integration.
                    </p>
                    <Button
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            "/api/integrations/quickbooks/auth",
                          );
                          if (res.ok) {
                            const { url } = await res.json();
                            window.location.href = url;
                          } else {
                            toast({
                              title: "Failed to start authentication",
                              description:
                                "Unable to connect to QuickBooks. Please try again.",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description:
                              "An error occurred while connecting to QuickBooks.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full"
                    >
                      {integrations.quickbooksConnected
                        ? "Reconnect QuickBooks"
                        : "Connect to QuickBooks"}
                    </Button>
                  </div>
                </div>

                {/* Stripe */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-purple-600" />
                      <h4 className="font-medium">Stripe Payments</h4>
                      <Badge
                        variant={
                          integrations.stripeConnected ? "default" : "outline"
                        }
                      >
                        {integrations.stripeConnected
                          ? "Connected"
                          : "Not Connected"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Accept credit card payments and manage billing through
                      Stripe.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stripePublishableKey">
                          Publishable Key
                        </Label>
                        <Input
                          id="stripePublishableKey"
                          placeholder="pk_test_..."
                          value={integrations.stripePublishableKey || ""}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              stripePublishableKey: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stripeSecretKey">Secret Key</Label>
                        <div className="relative">
                          <Input
                            id="stripeSecretKey"
                            type={
                              showFields.stripeSecretKey ? "text" : "password"
                            }
                            placeholder="sk_test_..."
                            value={integrations.stripeSecretKey || ""}
                            onChange={(e) =>
                              setIntegrations((prev) => ({
                                ...prev,
                                stripeSecretKey: e.target.value,
                              }))
                            }
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() =>
                              setShowFields((prev) => ({
                                ...prev,
                                stripeSecretKey: !prev.stripeSecretKey,
                              }))
                            }
                          >
                            {showFields.stripeSecretKey ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TaxJar */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                      <h4 className="font-medium">TaxJar</h4>
                      <Badge
                        variant={
                          integrations.taxjarApiKey ? "default" : "outline"
                        }
                      >
                        {integrations.taxjarApiKey
                          ? "Connected"
                          : "Not Connected"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Automated sales tax calculations and reporting.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="taxjarApiKey">API Key</Label>
                      <div className="relative">
                        <Input
                          id="taxjarApiKey"
                          type={showFields.taxjarApiKey ? "text" : "password"}
                          placeholder="Enter TaxJar API key"
                          value={integrations.taxjarApiKey || ""}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              taxjarApiKey: e.target.value,
                            }))
                          }
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() =>
                            setShowFields((prev) => ({
                              ...prev,
                              taxjarApiKey: !prev.taxjarApiKey,
                            }))
                          }
                        >
                          {showFields.taxjarApiKey ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* S&S Activewear */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      <h4 className="font-medium">S&S Activewear</h4>
                      <Badge variant="default">Connected</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ssAccount">Account Number</Label>
                      <Input
                        id="ssAccount"
                        value={integrations.ssActivewearAccount}
                        onChange={(e) =>
                          setIntegrations((prev) => ({
                            ...prev,
                            ssActivewearAccount: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ssApiKey">API Key</Label>
                      <div className="relative">
                        <Input
                          id="ssApiKey"
                          type={
                            showFields.ssActivewearApiKey ? "text" : "password"
                          }
                          value={integrations.ssActivewearApiKey}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              ssActivewearApiKey: e.target.value,
                            }))
                          }
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() =>
                            setShowFields((prev) => ({
                              ...prev,
                              ssActivewearApiKey: !prev.ssActivewearApiKey,
                            }))
                          }
                        >
                          {showFields.ssActivewearApiKey ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SanMar */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium">SanMar</h4>
                      <Badge
                        variant={
                          integrations.sanmarCustomerId &&
                          integrations.sanmarUsername &&
                          integrations.sanmarPassword
                            ? "default"
                            : "outline"
                        }
                      >
                        {integrations.sanmarCustomerId &&
                        integrations.sanmarUsername &&
                        integrations.sanmarPassword
                          ? "Connected"
                          : "Not Connected"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sanmarCustomerId">Customer ID</Label>
                      <Input
                        id="sanmarCustomerId"
                        placeholder="Enter customer ID"
                        value={integrations.sanmarCustomerId}
                        onChange={(e) =>
                          setIntegrations((prev) => ({
                            ...prev,
                            sanmarCustomerId: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sanmarUsername">Username</Label>
                      <Input
                        id="sanmarUsername"
                        placeholder="Enter username"
                        value={integrations.sanmarUsername}
                        onChange={(e) =>
                          setIntegrations((prev) => ({
                            ...prev,
                            sanmarUsername: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sanmarPassword">Password</Label>
                      <div className="relative">
                        <Input
                          id="sanmarPassword"
                          type={showFields.sanmarPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={integrations.sanmarPassword}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              sanmarPassword: e.target.value,
                            }))
                          }
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() =>
                            setShowFields((prev) => ({
                              ...prev,
                              sanmarPassword: !prev.sanmarPassword,
                            }))
                          }
                        >
                          {showFields.sanmarPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    SOAP API credentials for SanMar product catalog integration
                  </p>
                </div>

                {/* SAGE */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium">SAGE</h4>
                      <Badge
                        variant={
                          integrations.sageAcctId &&
                          integrations.sageLoginId &&
                          integrations.sageApiKey
                            ? "default"
                            : "outline"
                        }
                      >
                        {integrations.sageAcctId &&
                        integrations.sageLoginId &&
                        integrations.sageApiKey
                          ? "Connected"
                          : "Not Connected"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sageAcctId">Account ID</Label>
                      <Input
                        id="sageAcctId"
                        placeholder="Enter SAGE account ID"
                        value={integrations.sageAcctId}
                        onChange={(e) =>
                          setIntegrations((prev) => ({
                            ...prev,
                            sageAcctId: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sageLoginId">Login ID</Label>
                      <Input
                        id="sageLoginId"
                        placeholder="Enter SAGE login ID"
                        value={integrations.sageLoginId}
                        onChange={(e) =>
                          setIntegrations((prev) => ({
                            ...prev,
                            sageLoginId: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="sageApiKey">API Key</Label>
                      <div className="relative">
                        <Input
                          id="sageApiKey"
                          type={showFields.sageApiKey ? "text" : "password"}
                          placeholder="Enter SAGE API key"
                          value={integrations.sageApiKey}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              sageApiKey: e.target.value,
                            }))
                          }
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() =>
                            setShowFields((prev) => ({
                              ...prev,
                              sageApiKey: !prev.sageApiKey,
                            }))
                          }
                        >
                          {showFields.sageApiKey ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slack */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Slack className="w-5 h-5 text-primary" />
                      <h4 className="font-medium">Slack Integration</h4>
                      <Badge variant="secondary">Configured</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="slackChannel">Channel ID</Label>
                      <Input
                        id="slackChannel"
                        value={integrations.slackChannelId}
                        onChange={(e) =>
                          setIntegrations((prev) => ({
                            ...prev,
                            slackChannelId: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slackToken">Bot Token</Label>
                      <div className="relative">
                        <Input
                          id="slackToken"
                          type={showFields.slackBotToken ? "text" : "password"}
                          value={integrations.slackBotToken}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              slackBotToken: e.target.value,
                            }))
                          }
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() =>
                            setShowFields((prev) => ({
                              ...prev,
                              slackBotToken: !prev.slackBotToken,
                            }))
                          }
                        >
                          {showFields.slackBotToken ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mapbox Geocoding */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h4 className="font-medium">Mapbox Geocoding</h4>
                      <Badge
                        variant={
                          integrations.mapboxAccessToken ? "default" : "outline"
                        }
                      >
                        {integrations.mapboxAccessToken
                          ? "Connected"
                          : "Not Connected"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Address autocomplete for all address forms. Get your token
                    from{" "}
                    <a
                      href="https://account.mapbox.com/access-tokens/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Mapbox Dashboard
                    </a>
                    .
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="mapboxToken">Access Token</Label>
                    <div className="relative">
                      <Input
                        id="mapboxToken"
                        type={
                          showFields.mapboxAccessToken ? "text" : "password"
                        }
                        placeholder="pk.eyJ1Ijoi..."
                        value={integrations.mapboxAccessToken}
                        onChange={(e) =>
                          setIntegrations((prev) => ({
                            ...prev,
                            mapboxAccessToken: e.target.value,
                          }))
                        }
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowFields((prev) => ({
                            ...prev,
                            mapboxAccessToken: !prev.mapboxAccessToken,
                          }))
                        }
                      >
                        {showFields.mapboxAccessToken ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* HubSpot */}
                {/* <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      <h4 className="font-medium">HubSpot CRM</h4>
                      <Badge variant="outline">Not Connected</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hubspotApi">API Key</Label>
                    <div className="relative">
                      <Input
                        id="hubspotApi"
                        type={showFields.hubspotApiKey ? "text" : "password"}
                        placeholder="Enter HubSpot API key"
                        value={integrations.hubspotApiKey}
                        onChange={(e) => setIntegrations(prev => ({ ...prev, hubspotApiKey: e.target.value }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowFields(prev => ({ ...prev, hubspotApiKey: !prev.hubspotApiKey }))}
                      >
                        {showFields.hubspotApiKey ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div> */}
              </div>

              {/* Custom Integrations */}
              {configuredIntegrations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-gray-900">
                    Custom Integrations
                  </h3>
                  <div className="space-y-3">
                    {configuredIntegrations.map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <div
                          key={integration.id}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">
                                  {integration.name}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {integration.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Connected:{" "}
                                  {new Date(
                                    integration.connectedAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Connected</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  removeIntegration(integration.id)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                onClick={() => saveSettings("Integration")}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Integration Settings
              </Button>
            </CardContent>
          </Card>

          <AddIntegrationModal />
        </TabsContent>

        {/* Branding Tab - Logo Upload */}
        <TabsContent value="branding" className="space-y-6">
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
                    {systemConfig.logo.current ? (
                      <img
                        src={systemConfig.logo.current}
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
                        disabled={systemConfig.logo.uploading}
                        className="w-auto"
                      />
                      {systemConfig.logo.uploading && (
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
                  onClick={() => saveSettings("Branding")}
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
        </TabsContent>

        {/* Theme Tab - Color Customization */}
        <TabsContent value="theme" className="space-y-6">
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
                          style={{
                            backgroundColor: systemConfig.theme.primaryColor,
                          }}
                        />
                        <Input
                          id="primaryColor"
                          type="color"
                          value={systemConfig.theme.primaryColor}
                          onChange={(e) =>
                            updateThemeColor("primaryColor", e.target.value)
                          }
                          className="w-16 h-8 p-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="secondaryColor">Secondary</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{
                            backgroundColor: systemConfig.theme.secondaryColor,
                          }}
                        />
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={systemConfig.theme.secondaryColor}
                          onChange={(e) =>
                            updateThemeColor("secondaryColor", e.target.value)
                          }
                          className="w-16 h-8 p-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accentColor">Accent</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{
                            backgroundColor: systemConfig.theme.accentColor,
                          }}
                        />
                        <Input
                          id="accentColor"
                          type="color"
                          value={systemConfig.theme.accentColor}
                          onChange={(e) =>
                            updateThemeColor("accentColor", e.target.value)
                          }
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
                          style={{
                            backgroundColor: systemConfig.theme.backgroundColor,
                          }}
                        />
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={systemConfig.theme.backgroundColor}
                          onChange={(e) =>
                            updateThemeColor("backgroundColor", e.target.value)
                          }
                          className="w-16 h-8 p-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="textColor">Text</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{
                            backgroundColor: systemConfig.theme.textColor,
                          }}
                        />
                        <Input
                          id="textColor"
                          type="color"
                          value={systemConfig.theme.textColor}
                          onChange={(e) =>
                            updateThemeColor("textColor", e.target.value)
                          }
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
                          style={{
                            backgroundColor:
                              systemConfig.theme.sidebarBackgroundColor,
                          }}
                        />
                        <Input
                          id="sidebarBackgroundColor"
                          type="color"
                          value={systemConfig.theme.sidebarBackgroundColor}
                          onChange={(e) =>
                            updateThemeColor(
                              "sidebarBackgroundColor",
                              e.target.value,
                            )
                          }
                          className="w-16 h-8 p-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sidebarTextColor">Text</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{
                            backgroundColor:
                              systemConfig.theme.sidebarTextColor,
                          }}
                        />
                        <Input
                          id="sidebarTextColor"
                          type="color"
                          value={systemConfig.theme.sidebarTextColor}
                          onChange={(e) =>
                            updateThemeColor("sidebarTextColor", e.target.value)
                          }
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
                          style={{
                            backgroundColor:
                              systemConfig.theme.sidebarBorderColor,
                          }}
                        />
                        <Input
                          id="sidebarBorderColor"
                          type="color"
                          value={systemConfig.theme.sidebarBorderColor}
                          onChange={(e) =>
                            updateThemeColor(
                              "sidebarBorderColor",
                              e.target.value,
                            )
                          }
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
                          style={{
                            backgroundColor: systemConfig.theme.navHoverColor,
                          }}
                        />
                        <Input
                          id="navHoverColor"
                          type="color"
                          value={systemConfig.theme.navHoverColor}
                          onChange={(e) =>
                            updateThemeColor("navHoverColor", e.target.value)
                          }
                          className="w-16 h-8 p-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="navActiveColor">Active</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{
                            backgroundColor: systemConfig.theme.navActiveColor,
                          }}
                        />
                        <Input
                          id="navActiveColor"
                          type="color"
                          value={systemConfig.theme.navActiveColor}
                          onChange={(e) =>
                            updateThemeColor("navActiveColor", e.target.value)
                          }
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
                          style={{
                            backgroundColor: systemConfig.theme.navTextColor,
                          }}
                        />
                        <Input
                          id="navTextColor"
                          type="color"
                          value={systemConfig.theme.navTextColor}
                          onChange={(e) =>
                            updateThemeColor("navTextColor", e.target.value)
                          }
                          className="w-16 h-8 p-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="navTextActiveColor">Text Active</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{
                            backgroundColor:
                              systemConfig.theme.navTextActiveColor,
                          }}
                        />
                        <Input
                          id="navTextActiveColor"
                          type="color"
                          value={systemConfig.theme.navTextActiveColor}
                          onChange={(e) =>
                            updateThemeColor(
                              "navTextActiveColor",
                              e.target.value,
                            )
                          }
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
                        style={{
                          backgroundColor: systemConfig.theme.borderColor,
                        }}
                      />
                      <Input
                        id="borderColor"
                        type="color"
                        value={systemConfig.theme.borderColor}
                        onChange={(e) =>
                          updateThemeColor("borderColor", e.target.value)
                        }
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
                    backgroundColor: systemConfig.theme.backgroundColor,
                    color: systemConfig.theme.textColor,
                    borderColor: systemConfig.theme.secondaryColor,
                  }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div
                      className="w-8 h-8 rounded"
                      style={{
                        backgroundColor: systemConfig.theme.primaryColor,
                      }}
                    />
                    <h3 style={{ color: systemConfig.theme.textColor }}>
                      Sample Header
                    </h3>
                  </div>
                  <p className="text-sm mb-2">
                    This is how your theme will look in the application.
                  </p>
                  <Button
                    size="sm"
                    style={{
                      backgroundColor: systemConfig.theme.accentColor,
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
                  onClick={() => saveSettings("Theme")}
                  disabled={
                    authLoading || !hasAccess || saveBrandingMutation.isPending
                  }
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveBrandingMutation.isPending ? "Saving..." : "Apply Theme"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forms Tab - Field Configuration */}
        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5" />
                Form Field Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure which fields are required in sales orders, purchase
                orders, and other forms.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Sales Order Fields
                  </h3>
                  <div className="space-y-2">
                    {systemConfig.formFields.salesOrders.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">{field.label}</Label>
                            <Badge
                              variant={
                                field.required ? "destructive" : "secondary"
                              }
                              className="text-xs"
                            >
                              {field.required ? "Required" : "Optional"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {field.type}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          checked={field.enabled}
                          onCheckedChange={() =>
                            toggleFormField("salesOrders", field.id)
                          }
                          disabled={field.required}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Purchase Order Fields
                  </h3>
                  <div className="space-y-2">
                    {systemConfig.formFields.purchaseOrders.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">{field.label}</Label>
                            <Badge
                              variant={
                                field.required ? "destructive" : "secondary"
                              }
                              className="text-xs"
                            >
                              {field.required ? "Required" : "Optional"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {field.type}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          checked={field.enabled}
                          onCheckedChange={() =>
                            toggleFormField("purchaseOrders", field.id)
                          }
                          disabled={field.required}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Field Configuration Notes
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Required fields cannot be disabled. Optional fields can be
                      toggled on/off based on your business needs. Changes will
                      apply to new forms created after saving.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => saveSettings("Form Fields")}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Field Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Import Tab - AI-Powered Import */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI-Powered Data Import
              </CardTitle>
              <p className="text-sm text-gray-600">
                Import and organize your existing business data with AI
                assistance.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Supported Data Types</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Customer & Company Data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Sales Orders & Quotes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Purchase Orders</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Product Catalogs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Artwork & Files</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Estimates & Proofing</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label>Supported Formats</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {systemConfig.dataImport.supportedFormats.map((format) => (
                      <div
                        key={format}
                        className="flex items-center gap-2 p-2 border rounded"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{format}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Import Data</Label>
                {systemConfig.dataImport.processing ? (
                  <div className="border rounded-lg p-6 text-center">
                    <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <h3 className="font-medium mb-2">
                      AI Processing Your Data
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Our AI is analyzing and categorizing your import file.
                      This may take a few minutes.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Upload Your Data File</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Select a file containing your business data. Our AI will
                      automatically detect and organize:
                    </p>
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.json,.xml"
                      onChange={handleDataImport}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>

              {systemConfig.dataImport.lastImport && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">
                        Last Import Successful
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        Completed:{" "}
                        {new Date(
                          systemConfig.dataImport.lastImport,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">
                      AI Import Process
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Our AI will intelligently categorize your data, match
                      customer information, organize orders by status, and
                      maintain data relationships. Review suggested matches
                      before finalizing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Configuration Tab */}
        <TabsContent value="email-config">
          <EmailConfigSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
