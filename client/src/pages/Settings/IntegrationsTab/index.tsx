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
import { AddressAutocomplete, type ParsedAddress } from "@/components/ui/address-autocomplete";
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
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Database,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Globe,
  Loader2,
  MapPin,
  Package,
  Save,
  Ship,
  Slack,
  Trash2,
} from "lucide-react";
import { useIntegrationsTab } from "./hooks";
import { AddIntegrationModal } from "./components/AddIntegrationModal";

export function IntegrationsTab() {
  const hook = useIntegrationsTab();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              External Integrations
            </div>
            {/* <Button onClick={() => hook.setShowAddIntegration(true)} size="sm">
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
                      hook.integrations.quickbooksConnected
                        ? "default"
                        : "outline"
                    }
                  >
                    {hook.integrations.quickbooksConnected
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
                  onClick={hook.connectQuickbooks}
                  className="w-full"
                >
                  {hook.integrations.quickbooksConnected
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
                      hook.integrations.stripeConnected ? "default" : "outline"
                    }
                  >
                    {hook.integrations.stripeConnected
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
                      value={hook.integrations.stripePublishableKey || ""}
                      onChange={(e) =>
                        hook.updateIntegrationField("stripePublishableKey", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripeSecretKey">Secret Key</Label>
                    <div className="relative">
                      <Input
                        id="stripeSecretKey"
                        type={
                          hook.showFields.stripeSecretKey ? "text" : "password"
                        }
                        placeholder="sk_test_..."
                        value={hook.integrations.stripeSecretKey || ""}
                        onChange={(e) =>
                          hook.updateIntegrationField("stripeSecretKey", e.target.value)
                        }
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => hook.toggleFieldVisibility("stripeSecretKey")}
                      >
                        {hook.showFields.stripeSecretKey ? (
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
                      hook.integrations.taxjarApiKey ? "default" : "outline"
                    }
                  >
                    {hook.integrations.taxjarApiKey
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
                      type={hook.showFields.taxjarApiKey ? "text" : "password"}
                      placeholder="Enter TaxJar API key"
                      value={hook.integrations.taxjarApiKey || ""}
                      onChange={(e) =>
                        hook.updateIntegrationField("taxjarApiKey", e.target.value)
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => hook.toggleFieldVisibility("taxjarApiKey")}
                    >
                      {hook.showFields.taxjarApiKey ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Tax Origin Address */}
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Tax Origin Address</p>
                  <p className="text-xs text-gray-500 mb-3">
                    Your business origin address for tax calculation. Required for accurate sales tax rates.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="taxOriginStreet">Street</Label>
                      <AddressAutocomplete
                        id="taxOriginStreet"
                        placeholder="Start typing your business address..."
                        value={hook.integrations.taxOriginStreet || ""}
                        onChange={(val) =>
                          hook.updateIntegrationField("taxOriginStreet", val)
                        }
                        onAddressSelect={(addr: ParsedAddress) => {
                          hook.updateIntegrationField("taxOriginStreet", addr.street);
                          hook.updateIntegrationField("taxOriginCity", addr.city);
                          hook.updateIntegrationField("taxOriginState", addr.state);
                          hook.updateIntegrationField("taxOriginZip", addr.zipCode);
                          hook.updateIntegrationField("taxOriginCountry", addr.country || "US");
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="taxOriginCity">City</Label>
                      <Input
                        id="taxOriginCity"
                        placeholder="New York"
                        value={hook.integrations.taxOriginCity || ""}
                        onChange={(e) =>
                          hook.updateIntegrationField("taxOriginCity", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="taxOriginState">State</Label>
                      <Input
                        id="taxOriginState"
                        placeholder="NY"
                        maxLength={2}
                        value={hook.integrations.taxOriginState || ""}
                        onChange={(e) =>
                          hook.updateIntegrationField("taxOriginState", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="taxOriginZip">ZIP Code</Label>
                      <Input
                        id="taxOriginZip"
                        placeholder="10001"
                        value={hook.integrations.taxOriginZip || ""}
                        onChange={(e) =>
                          hook.updateIntegrationField("taxOriginZip", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="taxOriginCountry">Country</Label>
                      <Input
                        id="taxOriginCountry"
                        placeholder="US"
                        maxLength={2}
                        value={hook.integrations.taxOriginCountry || ""}
                        onChange={(e) =>
                          hook.updateIntegrationField("taxOriginCountry", e.target.value)
                        }
                      />
                    </div>
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
                    value={hook.integrations.ssActivewearAccount}
                    onChange={(e) =>
                      hook.updateIntegrationField("ssActivewearAccount", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssApiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="ssApiKey"
                      type={
                        hook.showFields.ssActivewearApiKey ? "text" : "password"
                      }
                      value={hook.integrations.ssActivewearApiKey}
                      onChange={(e) =>
                        hook.updateIntegrationField("ssActivewearApiKey", e.target.value)
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => hook.toggleFieldVisibility("ssActivewearApiKey")}
                    >
                      {hook.showFields.ssActivewearApiKey ? (
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
                      hook.integrations.sanmarCustomerId &&
                      hook.integrations.sanmarUsername &&
                      hook.integrations.sanmarPassword
                        ? "default"
                        : "outline"
                    }
                  >
                    {hook.integrations.sanmarCustomerId &&
                    hook.integrations.sanmarUsername &&
                    hook.integrations.sanmarPassword
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
                    value={hook.integrations.sanmarCustomerId}
                    onChange={(e) =>
                      hook.updateIntegrationField("sanmarCustomerId", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sanmarUsername">Username</Label>
                  <Input
                    id="sanmarUsername"
                    placeholder="Enter username"
                    value={hook.integrations.sanmarUsername}
                    onChange={(e) =>
                      hook.updateIntegrationField("sanmarUsername", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sanmarPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="sanmarPassword"
                      type={hook.showFields.sanmarPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={hook.integrations.sanmarPassword}
                      onChange={(e) =>
                        hook.updateIntegrationField("sanmarPassword", e.target.value)
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => hook.toggleFieldVisibility("sanmarPassword")}
                    >
                      {hook.showFields.sanmarPassword ? (
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
                      hook.integrations.sageAcctId &&
                      hook.integrations.sageLoginId &&
                      hook.integrations.sageApiKey
                        ? "default"
                        : "outline"
                    }
                  >
                    {hook.integrations.sageAcctId &&
                    hook.integrations.sageLoginId &&
                    hook.integrations.sageApiKey
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
                    value={hook.integrations.sageAcctId}
                    onChange={(e) =>
                      hook.updateIntegrationField("sageAcctId", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sageLoginId">Login ID</Label>
                  <Input
                    id="sageLoginId"
                    placeholder="Enter SAGE login ID"
                    value={hook.integrations.sageLoginId}
                    onChange={(e) =>
                      hook.updateIntegrationField("sageLoginId", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="sageApiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="sageApiKey"
                      type={hook.showFields.sageApiKey ? "text" : "password"}
                      placeholder="Enter SAGE API key"
                      value={hook.integrations.sageApiKey}
                      onChange={(e) =>
                        hook.updateIntegrationField("sageApiKey", e.target.value)
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => hook.toggleFieldVisibility("sageApiKey")}
                    >
                      {hook.showFields.sageApiKey ? (
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
                    value={hook.integrations.slackChannelId}
                    onChange={(e) =>
                      hook.updateIntegrationField("slackChannelId", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slackToken">Bot Token</Label>
                  <div className="relative">
                    <Input
                      id="slackToken"
                      type={hook.showFields.slackBotToken ? "text" : "password"}
                      value={hook.integrations.slackBotToken}
                      onChange={(e) =>
                        hook.updateIntegrationField("slackBotToken", e.target.value)
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => hook.toggleFieldVisibility("slackBotToken")}
                    >
                      {hook.showFields.slackBotToken ? (
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
                      hook.integrations.geoapifyApiKey ? "default" : "outline"
                    }
                  >
                    {hook.integrations.geoapifyApiKey
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
                      hook.showFields.geoapifyApiKey ? "text" : "password"
                    }
                    placeholder="your-geoapify-api-key"
                    value={hook.integrations.geoapifyApiKey}
                    onChange={(e) =>
                      hook.updateIntegrationField("geoapifyApiKey", e.target.value)
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => hook.toggleFieldVisibility("geoapifyApiKey")}
                  >
                    {hook.showFields.geoapifyApiKey ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* ShipStation */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium">ShipStation</h4>
                  <Badge
                    variant={
                      hook.integrations.shipstationConnected
                        ? "default"
                        : "outline"
                    }
                  >
                    {hook.integrations.shipstationConnected
                      ? "Connected"
                      : "Not Connected"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Shipping management, label printing, and shipment tracking.
                  Get your API keys from{" "}
                  <a
                    href="https://ss.shipstation.com/#/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    ShipStation Settings → API Keys
                  </a>
                  .
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shipstationApiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="shipstationApiKey"
                        type={
                          hook.showFields.shipstationApiKey ? "text" : "password"
                        }
                        placeholder="Enter ShipStation API key"
                        value={hook.integrations.shipstationApiKey || ""}
                        onChange={(e) =>
                          hook.updateIntegrationField(
                            "shipstationApiKey",
                            e.target.value
                          )
                        }
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          hook.toggleFieldVisibility("shipstationApiKey")
                        }
                      >
                        {hook.showFields.shipstationApiKey ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipstationApiSecret">API Secret</Label>
                    <div className="relative">
                      <Input
                        id="shipstationApiSecret"
                        type={
                          hook.showFields.shipstationApiSecret
                            ? "text"
                            : "password"
                        }
                        placeholder="Enter ShipStation API secret"
                        value={hook.integrations.shipstationApiSecret || ""}
                        onChange={(e) =>
                          hook.updateIntegrationField(
                            "shipstationApiSecret",
                            e.target.value
                          )
                        }
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          hook.toggleFieldVisibility("shipstationApiSecret")
                        }
                      >
                        {hook.showFields.shipstationApiSecret ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!hook.integrations.shipstationApiKey || !hook.integrations.shipstationApiSecret) {
                      hook.toast({
                        title: "Missing Credentials",
                        description: "Please enter both API Key and API Secret first.",
                        variant: "destructive",
                      });
                      return;
                    }
                    try {
                      const res = await fetch("/api/shipstation/test-connection", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          apiKey: hook.integrations.shipstationApiKey,
                          apiSecret: hook.integrations.shipstationApiSecret,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        hook.toast({
                          title: "Connection Successful",
                          description: "Successfully connected to ShipStation API.",
                        });
                        hook.updateIntegrationField("shipstationConnected", "true" as any);
                      } else {
                        hook.toast({
                          title: "Connection Failed",
                          description: data.message || "Could not connect to ShipStation.",
                          variant: "destructive",
                        });
                      }
                    } catch {
                      hook.toast({
                        title: "Error",
                        description: "Failed to test ShipStation connection.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
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
                    type={hook.showFields.hubspotApiKey ? "text" : "password"}
                    placeholder="Enter HubSpot API key"
                    value={hook.integrations.hubspotApiKey}
                    onChange={(e) => hook.updateIntegrationField("hubspotApiKey", e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => hook.toggleFieldVisibility("hubspotApiKey")}
                  >
                    {hook.showFields.hubspotApiKey ? (
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
          {hook.configuredIntegrations.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-900">
                Custom Integrations
              </h3>
              <div className="space-y-3">
                {hook.configuredIntegrations.map((integration) => {
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
                            onClick={() => hook.openRemoveDialog(integration)}
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
            onClick={() => hook.saveSettings()}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Integration Settings
          </Button>
        </CardContent>
      </Card>

      <AddIntegrationModal
        open={hook.showAddIntegration}
        onOpenChange={hook.setShowAddIntegration}
        selectedIntegrationType={hook.selectedIntegrationType}
        setSelectedIntegrationType={hook.setSelectedIntegrationType}
        customIntegrations={hook.customIntegrations}
        addIntegration={hook.addIntegration}
        toast={hook.toast}
      />

      {/* Remove Integration Confirmation Dialog */}
      <AlertDialog open={hook.isRemoveIntegrationDialogOpen} onOpenChange={(open) => { if (!open) hook.closeRemoveDialog(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Remove Integration?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{hook.integrationToRemove?.name}</strong>?
              <span className="block mt-2 text-orange-600 font-medium">
                This will disconnect the integration from your system.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={hook.closeRemoveDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (hook.integrationToRemove) {
                  hook.removeIntegration(hook.integrationToRemove.id);
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
