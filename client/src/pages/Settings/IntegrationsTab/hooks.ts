import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Globe,
  Mail,
  ShoppingCart,
  Zap,
} from "lucide-react";
import type {
  IntegrationSettings,
  ShowFields,
  CustomIntegrationType,
  ConfiguredIntegration,
} from "./types";

export function useIntegrationsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load integration settings
  const { data: integrationSettings } = useQuery({
    queryKey: ["/api/settings/integrations"],
    staleTime: 1000 * 60 * 5,
  });

  // Integration Settings
  const [integrations, setIntegrations] = useState<IntegrationSettings>({
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
  const [showFields, setShowFields] = useState<ShowFields>({
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
  const [customIntegrations] = useState<CustomIntegrationType[]>([
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

  const [configuredIntegrations, setConfiguredIntegrations] = useState<ConfiguredIntegration[]>([]);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [isRemoveIntegrationDialogOpen, setIsRemoveIntegrationDialogOpen] = useState(false);
  const [integrationToRemove, setIntegrationToRemove] = useState<ConfiguredIntegration | null>(null);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<CustomIntegrationType | null>(null);

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

  const addIntegration = (integrationType: CustomIntegrationType, config: Record<string, string>) => {
    const newIntegration: ConfiguredIntegration = {
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

  const connectQuickbooks = async () => {
    try {
      const res = await fetch("/api/integrations/quickbooks/auth");
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        toast({
          title: "Failed to start authentication",
          description: "Unable to connect to QuickBooks. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while connecting to QuickBooks.",
        variant: "destructive",
      });
    }
  };

  const toggleFieldVisibility = (field: keyof ShowFields) => {
    setShowFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const updateIntegrationField = (field: keyof IntegrationSettings, value: string) => {
    setIntegrations((prev) => ({ ...prev, [field]: value }));
  };

  const openRemoveDialog = (integration: ConfiguredIntegration) => {
    setIntegrationToRemove(integration);
    setIsRemoveIntegrationDialogOpen(true);
  };

  const closeRemoveDialog = () => {
    setIntegrationToRemove(null);
    setIsRemoveIntegrationDialogOpen(false);
  };

  return {
    integrations,
    showFields,
    customIntegrations,
    configuredIntegrations,
    showAddIntegration,
    setShowAddIntegration,
    isRemoveIntegrationDialogOpen,
    integrationToRemove,
    selectedIntegrationType,
    setSelectedIntegrationType,
    saveSettings,
    addIntegration,
    removeIntegration,
    connectQuickbooks,
    toggleFieldVisibility,
    updateIntegrationField,
    openRemoveDialog,
    closeRemoveDialog,
    toast,
  };
}
