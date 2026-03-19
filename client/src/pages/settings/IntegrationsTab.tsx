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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Database,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Globe,
  Mail,
  MapPin,
  Package,
  Plus,
  Save,
  ShoppingCart,
  Slack,
  Trash2,
  Zap,
} from "lucide-react";

export function IntegrationsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load integration settings
  const { data: integrationSettings } = useQuery({
    queryKey: ["/api/settings/integrations"],
    staleTime: 1000 * 60 * 5,
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
    geoapifyApiKey: "",
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
    geoapifyApiKey: false,
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
        geoapifyApiKey: settings.geoapifyApiKey || "",
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
  const [customIntegrations] = useState([
    {
      id: "zapier",
      name: "Zapier",
      description: "Automate workflows with 5000+ apps",
      icon: Zap,
      status: "available",
      fields: [
        { key: "webhook_url", label: "Webhook URL", type: "url", required: true },
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
        { key: "server_prefix", label: "Server Prefix", type: "text", required: true },
      ],
    },
    {
      id: "shopify",
      name: "Shopify",
      description: "E-commerce platform integration",
      icon: ShoppingCart,
      status: "available",
      fields: [
        { key: "shop_domain", label: "Shop Domain", type: "text", required: true },
        { key: "access_token", label: "Access Token", type: "password", required: true },
        { key: "api_version", label: "API Version", type: "text", required: false, placeholder: "2023-10" },
      ],
    },
    {
      id: "quickbooks",
      name: "QuickBooks Online",
      description: "Accounting and financial management",
      icon: FileSpreadsheet,
      status: "available",
      fields: [
        { key: "company_id", label: "Company ID", type: "text", required: true },
        { key: "client_id", label: "Client ID", type: "text", required: true },
        { key: "client_secret", label: "Client Secret", type: "password", required: true },
      ],
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Payment processing and billing",
      icon: Globe,
      status: "available",
      fields: [
        { key: "publishable_key", label: "Publishable Key", type: "text", required: true },
        { key: "secret_key", label: "Secret Key", type: "password", required: true },
        { key: "webhook_secret", label: "Webhook Secret", type: "password", required: false },
      ],
    },
  ]);

  const [configuredIntegrations, setConfiguredIntegrations] = useState<any[]>([]);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [isRemoveIntegrationDialogOpen, setIsRemoveIntegrationDialogOpen] = useState(false);
  const [integrationToRemove, setIntegrationToRemove] = useState<any>(null);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<any>(null);

  const saveSettings = async () => {
    try {
      console.log("Saving integrations:", integrations);
      await apiRequest("POST", "/api/settings/integrations", integrations);
      queryClient.invalidateQueries({ queryKey: ["/api/settings/integrations"] });
      toast({
        title: "Settings Saved",
        description: "Integration settings have been saved successfully.",
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
    setIsRemoveIntegrationDialogOpen(false);
    setIntegrationToRemove(null);
  };

  const AddIntegrationModal = () => {
    const [configData, setConfigData] = useState({});

    const handleFieldChange = (key: string, value: string) => {
      setConfigData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = () => {
      if (!selectedIntegrationType) return;

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

  return (
    <>
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

            {/* Geoapify Geocoding */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h4 className="font-medium">Geoapify Geocoding</h4>
                  <Badge
                    variant={
                      integrations.geoapifyApiKey ? "default" : "outline"
                    }
                  >
                    {integrations.geoapifyApiKey
                      ? "Connected"
                      : "Not Connected"}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Address autocomplete for all address forms. Get your API key
                from{" "}
                <a
                  href="https://myprojects.geoapify.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Geoapify Dashboard
                </a>
                .
              </p>
              <div className="space-y-2">
                <Label htmlFor="geoapifyKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="geoapifyKey"
                    type={
                      showFields.geoapifyApiKey ? "text" : "password"
                    }
                    placeholder="your-geoapify-api-key"
                    value={integrations.geoapifyApiKey}
                    onChange={(e) =>
                      setIntegrations((prev) => ({
                        ...prev,
                        geoapifyApiKey: e.target.value,
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
                        geoapifyApiKey: !prev.geoapifyApiKey,
                      }))
                    }
                  >
                    {showFields.geoapifyApiKey ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* HubSpot - commented out */}
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
                            onClick={() => {
                              setIntegrationToRemove(integration);
                              setIsRemoveIntegrationDialogOpen(true);
                            }}
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
            onClick={() => saveSettings()}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Integration Settings
          </Button>
        </CardContent>
      </Card>

      <AddIntegrationModal />

      {/* Remove Integration Confirmation Dialog */}
      <AlertDialog open={isRemoveIntegrationDialogOpen} onOpenChange={setIsRemoveIntegrationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Remove Integration?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{integrationToRemove?.name}</strong>?
              <span className="block mt-2 text-orange-600 font-medium">
                This will disconnect the integration from your system.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIntegrationToRemove(null); setIsRemoveIntegrationDialogOpen(false); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (integrationToRemove) {
                  removeIntegration(integrationToRemove.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove Integration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
