import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import { useToast } from "@/hooks/use-toast";
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
  Save,
  Plus,
  FileText,
  FileSpreadsheet,
  FileImage,
  Brain,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2
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
    <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <SettingsIcon className="mr-3 text-swag-primary" size={32} />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure your SwagSuite system preferences and integrations</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
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
            <TabsTrigger value="suggested" className="flex items-center space-x-2">
              <Lightbulb size={16} />
              <span>Suggested Items</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center space-x-2">
              <Globe size={16} />
              <span>Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center space-x-2">
              <Upload size={16} />
              <span>Data Import</span>
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
            <IntegrationSettings />
          </TabsContent>

          {/* Data Import */}
          <TabsContent value="import" className="space-y-6">
            <DataImportSystem />
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

          {/* Suggested Products Settings */}
          <TabsContent value="suggested" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="text-blue-600" />
                  Manage Suggested Products
                </CardTitle>
                <p className="text-sm text-gray-600">Add products to the suggested items list with custom discounts and notes</p>
              </CardHeader>
              <CardContent>
                <SuggestedProductsManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}

// Suggested Products Manager Component
function SuggestedProductsManager() {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    imageUrl: '',
    productType: 'apparel',
    avgPresentationPrice: '',
    discount: '',
    adminNote: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin suggested products
  const { data: adminProducts = [], isLoading } = useQuery({
    queryKey: ['/api/admin/suggested-products'],
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      await apiRequest('/api/admin/suggested-products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suggested-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/suggested'] });
      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        sku: '',
        imageUrl: '',
        productType: 'apparel',
        avgPresentationPrice: '',
        discount: '',
        adminNote: ''
      });
      toast({
        title: "Success",
        description: "Product added to suggested items",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    },
  });

  // Remove product mutation
  const removeProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest(`/api/admin/suggested-products/${productId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suggested-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/suggested'] });
      toast({
        title: "Success",
        description: "Product removed from suggested items",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove product",
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.avgPresentationPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      ...newProduct,
      avgPresentationPrice: parseFloat(newProduct.avgPresentationPrice),
      discount: parseFloat(newProduct.discount) || 0,
    };

    addProductMutation.mutate(productData);
  };

  return (
    <div className="space-y-6">
      {/* Add New Product */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Admin Suggested Products</h3>
          <Button 
            onClick={() => setIsAddingProduct(!isAddingProduct)}
            className="bg-swag-primary hover:bg-swag-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {isAddingProduct && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-base">Add New Suggested Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Nike Dri-FIT Polo"
                  />
                </div>
                <div>
                  <Label htmlFor="productSku">SKU *</Label>
                  <Input
                    id="productSku"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g., NK100"
                  />
                </div>
                <div>
                  <Label htmlFor="productType">Product Type</Label>
                  <Select 
                    value={newProduct.productType} 
                    onValueChange={(value) => setNewProduct(prev => ({ ...prev, productType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apparel">Apparel</SelectItem>
                      <SelectItem value="hard_goods">Hard Goods</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.avgPresentationPrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, avgPresentationPrice: e.target.value }))}
                    placeholder="25.00"
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={newProduct.discount}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, discount: e.target.value }))}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="/public-objects/products/product.jpg"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="adminNote">Admin Note</Label>
                <Textarea
                  id="adminNote"
                  value={newProduct.adminNote}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, adminNote: e.target.value }))}
                  placeholder="Special promotion details, volume discounts, etc."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddProduct}
                  disabled={addProductMutation.isPending}
                  className="bg-swag-primary hover:bg-swag-primary/90"
                >
                  {addProductMutation.isPending ? "Adding..." : "Add Product"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingProduct(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Existing Products List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Current Suggested Products</h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : adminProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="mx-auto h-12 w-12 mb-4 text-gray-400" />
            <p>No admin suggested products yet</p>
            <p className="text-sm">Add products to help promote specific items with discounts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {adminProducts.map((product: any) => (
              <div key={product.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-4">
                  <img 
                    src={product.imageUrl || '/public-objects/products/placeholder.jpg'} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/public-objects/products/placeholder.jpg';
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {product.productType === 'apparel' ? 'Apparel' : 'Hard Goods'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProductMutation.mutate(product.id)}
                          disabled={removeProductMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Price: ${product.avgPresentationPrice.toFixed(2)}</span>
                      {product.discount > 0 && (
                        <span className="text-green-600 font-medium">{product.discount}% off</span>
                      )}
                    </div>
                    {product.adminNote && (
                      <p className="text-sm text-blue-600 italic mt-1">{product.adminNote}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Data Import System Component
function DataImportSystem() {
  const [uploads, setUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  // Fetch existing uploads
  const { data: uploadHistory = [], refetch } = useQuery({
    queryKey: ['/api/data-uploads'],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/data-uploads', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded and is being processed by AI.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      const formData = new FormData();
      formData.append('file', file);
      uploadMutation.mutate(formData);
    });
  };

  const getSupportedFormats = () => [
    { name: "Excel Files", ext: ".xlsx, .xls", icon: FileSpreadsheet, desc: "Customer lists, order history, product catalogs" },
    { name: "CSV Files", ext: ".csv", icon: FileText, desc: "Data exports from other systems" },
    { name: "Google Sheets", ext: ".gsheet", icon: FileSpreadsheet, desc: "Shared spreadsheets and databases" },
    { name: "PDF Documents", ext: ".pdf", icon: FileText, desc: "Invoices, contracts, customer records" },
    { name: "Word Documents", ext: ".docx, .doc", icon: FileText, desc: "Customer communications, proposals" },
    { name: "Adobe Illustrator", ext: ".ai", icon: FileImage, desc: "Logo files and brand assets" },
    { name: "Image Files", ext: ".jpg, .png, .gif", icon: FileImage, desc: "Product photos, logos, artwork" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Data Import
          </CardTitle>
          <p className="text-muted-foreground">
            Upload your existing customer lists, order history, and business data. Our AI will analyze and organize everything into proper clients and orders.
          </p>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-purple-400 bg-purple-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Drop files here or click to browse</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports Excel, CSV, PDF, Word, AI files and more
            </p>
            <Input
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.pdf,.docx,.doc,.ai,.jpg,.jpeg,.png,.gif"
              onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Supported Formats */}
      <Card>
        <CardHeader>
          <CardTitle>Supported File Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getSupportedFormats().map((format, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <format.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium">{format.name}</div>
                  <div className="text-sm text-muted-foreground">{format.ext}</div>
                  <div className="text-xs text-muted-foreground mt-1">{format.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload History */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p>No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadHistory.map((upload: any) => (
                <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(upload.status)}
                    <div>
                      <div className="font-medium">{upload.originalName}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(upload.createdAt).toLocaleDateString()} • {(upload.fileSize / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {upload.status === 'completed' && (
                      <div className="text-sm text-green-600">
                        {upload.createdRecords?.clients || 0} clients, {upload.createdRecords?.orders || 0} orders
                      </div>
                    )}
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
