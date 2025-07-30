import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Database,
  Slack,
  Mail,
  Globe,
  Upload,
  Save
} from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  
  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "Liquid Screen Design",
    companyLogo: "",
    timezone: "America/New_York",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    defaultMargin: "30",
    minimumMargin: "15",
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
  });

  // Production Workflow Settings
  const [workflowSettings, setWorkflowSettings] = useState({
    autoApprovalThreshold: "1000",
    requireArtworkApproval: true,
    autoFollowUpDays: "3",
    defaultLeadTime: "7",
    stages: [
      "Quote Created",
      "Customer Approval",
      "Production",
      "Quality Check",
      "Shipping",
      "Delivered"
    ]
  });

  // Integration Settings
  const [integrations, setIntegrations] = useState({
    hubspotApiKey: "",
    slackWebhook: "",
    quickbooksConnected: false,
    stripeConnected: false,
    shipmateConnected: false,
  });

  const handleSaveSettings = (section: string) => {
    // This would save settings to the backend
    alert(`${section} settings saved successfully!`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <SettingsIcon className="mr-3 text-swag-primary" size={32} />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure your SwagSuite system preferences and integrations</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <SettingsIcon size={16} />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell size={16} />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center space-x-2">
              <Database size={16} />
              <span>Workflow</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center space-x-2">
              <Globe size={16} />
              <span>Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield size={16} />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={generalSettings.companyName}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={generalSettings.timezone} 
                      onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select 
                      value={generalSettings.currency} 
                      onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select 
                      value={generalSettings.dateFormat} 
                      onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, dateFormat: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="companyLogo">Company Logo</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Upload className="text-gray-400" size={24} />
                    </div>
                    <Button variant="outline">
                      <Upload className="mr-2" size={16} />
                      Upload Logo
                    </Button>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings("General")} className="bg-swag-primary hover:bg-swag-primary/90">
                  <Save className="mr-2" size={16} />
                  Save General Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Margin Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultMargin">Default Margin (%)</Label>
                    <Input
                      id="defaultMargin"
                      type="number"
                      value={generalSettings.defaultMargin}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, defaultMargin: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimumMargin">Minimum Margin (%)</Label>
                    <Input
                      id="minimumMargin"
                      type="number"
                      value={generalSettings.minimumMargin}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, minimumMargin: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Orders below the minimum margin will require approval before proceeding.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="orderUpdates">Order Updates</Label>
                      <p className="text-sm text-gray-600">Notifications for order status changes</p>
                    </div>
                    <Switch
                      id="orderUpdates"
                      checked={notifications.orderUpdates}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, orderUpdates: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="customerUpdates">Customer Updates</Label>
                      <p className="text-sm text-gray-600">Notifications for new customers and updates</p>
                    </div>
                    <Switch
                      id="customerUpdates"
                      checked={notifications.customerUpdates}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, customerUpdates: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weeklyReports">Weekly Reports</Label>
                      <p className="text-sm text-gray-600">Receive weekly performance summaries</p>
                    </div>
                    <Switch
                      id="weeklyReports"
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings("Notification")} className="bg-swag-primary hover:bg-swag-primary/90">
                  <Save className="mr-2" size={16} />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slack Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="slackNotifications">Slack Notifications</Label>
                    <p className="text-sm text-gray-600">Send notifications to Slack channels</p>
                  </div>
                  <Switch
                    id="slackNotifications"
                    checked={notifications.slackNotifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, slackNotifications: checked }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <Slack className="mx-auto mb-2 text-green-600" size={24} />
                    <p className="text-sm font-medium">Connected Channels</p>
                    <p className="text-xs text-gray-600">3 active</p>
                  </div>
                  <div className="text-center">
                    <Bell className="mx-auto mb-2 text-blue-600" size={24} />
                    <p className="text-sm font-medium">Auto Notifications</p>
                    <p className="text-xs text-gray-600">Order updates enabled</p>
                  </div>
                  <div className="text-center">
                    <User className="mx-auto mb-2 text-purple-600" size={24} />
                    <p className="text-sm font-medium">Team Members</p>
                    <p className="text-xs text-gray-600">8 users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Settings */}
          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="autoApprovalThreshold">Auto Approval Threshold ($)</Label>
                    <Input
                      id="autoApprovalThreshold"
                      type="number"
                      value={workflowSettings.autoApprovalThreshold}
                      onChange={(e) => setWorkflowSettings(prev => ({ ...prev, autoApprovalThreshold: e.target.value }))}
                    />
                    <p className="text-xs text-gray-600 mt-1">Orders above this amount require manual approval</p>
                  </div>
                  <div>
                    <Label htmlFor="defaultLeadTime">Default Lead Time (days)</Label>
                    <Input
                      id="defaultLeadTime"
                      type="number"
                      value={workflowSettings.defaultLeadTime}
                      onChange={(e) => setWorkflowSettings(prev => ({ ...prev, defaultLeadTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="autoFollowUpDays">Auto Follow-up (days)</Label>
                    <Input
                      id="autoFollowUpDays"
                      type="number"
                      value={workflowSettings.autoFollowUpDays}
                      onChange={(e) => setWorkflowSettings(prev => ({ ...prev, autoFollowUpDays: e.target.value }))}
                    />
                    <p className="text-xs text-gray-600 mt-1">Send follow-up emails after this many days without response</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireArtworkApproval"
                      checked={workflowSettings.requireArtworkApproval}
                      onCheckedChange={(checked) => setWorkflowSettings(prev => ({ ...prev, requireArtworkApproval: checked }))}
                    />
                    <Label htmlFor="requireArtworkApproval">Require Artwork Approval</Label>
                  </div>
                </div>

                <div>
                  <Label>Production Stages</Label>
                  <div className="space-y-2 mt-2">
                    {workflowSettings.stages.map((stage, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="w-6 h-6 bg-swag-primary text-white text-xs rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <Input value={stage} readOnly className="flex-1" />
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="mr-2" size={16} />
                    Add Stage
                  </Button>
                </div>

                <Button onClick={() => handleSaveSettings("Workflow")} className="bg-swag-primary hover:bg-swag-primary/90">
                  <Save className="mr-2" size={16} />
                  Save Workflow Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>CRM & Marketing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hubspotApiKey">HubSpot API Key</Label>
                  <Input
                    id="hubspotApiKey"
                    type="password"
                    value={integrations.hubspotApiKey}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, hubspotApiKey: e.target.value }))}
                    placeholder="Enter your HubSpot API key"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Real-time sync with HubSpot for leads, customers, and marketing automation
                  </p>
                </div>

                <div>
                  <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                  <Input
                    id="slackWebhook"
                    value={integrations.slackWebhook}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, slackWebhook: e.target.value }))}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>

                <Button onClick={() => handleSaveSettings("CRM Integration")} className="bg-swag-primary hover:bg-swag-primary/90">
                  <Save className="mr-2" size={16} />
                  Save CRM Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial & Shipping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">QuickBooks</h4>
                      <Switch checked={integrations.quickbooksConnected} />
                    </div>
                    <p className="text-sm text-gray-600">Sync invoices and payments</p>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      {integrations.quickbooksConnected ? "Manage" : "Connect"}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Stripe</h4>
                      <Switch checked={integrations.stripeConnected} />
                    </div>
                    <p className="text-sm text-gray-600">Process online payments</p>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      {integrations.stripeConnected ? "Manage" : "Connect"}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">ShipStation</h4>
                      <Switch checked={integrations.shipmateConnected} />
                    </div>
                    <p className="text-sm text-gray-600">Manage shipping & tracking</p>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      {integrations.shipmateConnected ? "Manage" : "Connect"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Authentication Method</Label>
                    <p className="text-sm text-gray-600 mb-2">Currently using Replit Authentication</p>
                    <Button variant="outline" disabled>
                      Managed by Replit
                    </Button>
                  </div>
                  <div>
                    <Label>Session Timeout</Label>
                    <Select defaultValue="7days">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1day">1 Day</SelectItem>
                        <SelectItem value="7days">7 Days</SelectItem>
                        <SelectItem value="30days">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Data & Privacy</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Enable audit logging</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data encryption at rest</span>
                      <Switch defaultChecked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Two-factor authentication</span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings("Security")} className="bg-swag-primary hover:bg-swag-primary/90">
                  <Save className="mr-2" size={16} />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
