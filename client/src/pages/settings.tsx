import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Trash2,
  Lightbulb,
  Eye,
  EyeOff,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings2,
  Lock,
  Unlock,
  ToggleLeft,
  ToggleRight,
  Star,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";

interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'core' | 'analytics' | 'integrations' | 'advanced';
  adminOnly?: boolean;
  icon: any;
}

interface UserPermission {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
  lastActive: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("features");

  // Load admin settings from backend
  const { data: adminSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: user?.email === 'bgoltzman@liquidscreendesign.com'
  });

  // Feature toggle mutation
  const featureToggleMutation = useMutation({
    mutationFn: async ({ featureId, enabled }: { featureId: string; enabled: boolean }) => {
      await apiRequest('/api/admin/settings/features', {
        method: 'PUT',
        body: { featureId, enabled }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Feature Updated",
        description: "Feature toggle has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature toggle.",
        variant: "destructive"
      });
    }
  });
  
  // Feature Toggles State
  const [features, setFeatures] = useState<FeatureToggle[]>([
    // Core Features
    {
      id: 'popular_products',
      name: 'Popular Products Analytics',
      description: 'Track and display most popular products with time-based filtering',
      enabled: true,
      category: 'analytics',
      icon: TrendingUp
    },
    {
      id: 'suggested_items',
      name: 'Suggested Items',
      description: 'AI-powered product suggestions and admin-managed recommendations',
      enabled: true,
      category: 'analytics',
      icon: Lightbulb
    },
    {
      id: 'admin_suggestions',
      name: 'Admin Product Suggestions',
      description: 'Allow admins to manually add suggested products with discounts',
      enabled: true,
      category: 'core',
      adminOnly: true,
      icon: Star
    },
    {
      id: 'universal_search',
      name: 'Universal Search',
      description: 'Global search functionality across all products and data',
      enabled: true,
      category: 'core',
      icon: Globe
    },
    {
      id: 'ss_activewear_integration',
      name: 'S&S Activewear Integration',
      description: 'Real-time product data from S&S Activewear supplier',
      enabled: true,
      category: 'integrations',
      icon: Package
    },
    {
      id: 'hubspot_sync',
      name: 'HubSpot CRM Sync',
      description: 'Synchronize customer data with HubSpot CRM',
      enabled: false,
      category: 'integrations',
      icon: Users
    },
    {
      id: 'slack_notifications',
      name: 'Slack Notifications',
      description: 'Send order updates and alerts to Slack channels',
      enabled: true,
      category: 'integrations',
      icon: Slack
    },
    {
      id: 'ai_knowledge_base',
      name: 'AI Knowledge Base',
      description: 'Intelligent search and answers for company documentation',
      enabled: true,
      category: 'advanced',
      icon: Brain
    },
    {
      id: 'production_reports',
      name: 'Production Reports',
      description: 'Detailed production tracking and reporting dashboard',
      enabled: true,
      category: 'analytics',
      icon: BarChart3
    },
    {
      id: 'team_leaderboard',
      name: 'Team Performance Leaderboard',
      description: 'Track and display team member performance metrics',
      enabled: true,
      category: 'analytics',
      icon: Target
    },
    {
      id: 'automation_workflows',
      name: 'Automation Workflows',
      description: 'Automated tasks and workflow management',
      enabled: true,
      category: 'advanced',
      icon: Zap
    },
    {
      id: 'multi_company_view',
      name: 'Multi-Company Dashboard',
      description: 'Manage multiple companies from single interface',
      enabled: false,
      category: 'advanced',
      adminOnly: true,
      icon: Settings2
    }
  ]);

  // User Management State
  const [users, setUsers] = useState<UserPermission[]>([
    {
      id: '1',
      name: 'Brandon Goltzman',
      email: 'bgoltzman@liquidscreendesign.com',
      role: 'admin',
      permissions: ['all'],
      lastActive: '2025-01-06T18:00:00Z'
    },
    {
      id: '2', 
      name: 'Mike Davis',
      email: 'mike@liquidscreendesign.com',
      role: 'manager',
      permissions: ['orders', 'customers', 'products', 'reports'],
      lastActive: '2025-01-06T16:30:00Z'
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      email: 'sarah@liquidscreendesign.com', 
      role: 'user',
      permissions: ['orders', 'customers'],
      lastActive: '2025-01-06T15:45:00Z'
    }
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
    requireApprovalOver: "5000"
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
    dailyDigest: true
  });

  // Integration Settings
  const [integrations, setIntegrations] = useState({
    ssActivewearAccount: "52733",
    ssActivewearApiKey: "1812622b-59cd-4863-8a9f-ad64eee5cd22",
    hubspotApiKey: "",
    slackBotToken: "",
    slackChannelId: "",
    quickbooksConnected: false,
    stripeConnected: false,
    shipmateConnected: false
  });

  // Custom integrations that can be added dynamically
  const [customIntegrations, setCustomIntegrations] = useState([
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Automate workflows with 5000+ apps',
      icon: Zap,
      status: 'available',
      fields: [
        { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
        { key: 'api_key', label: 'API Key', type: 'password', required: true }
      ]
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Email marketing and automation',
      icon: Mail,
      status: 'available',
      fields: [
        { key: 'api_key', label: 'API Key', type: 'password', required: true },
        { key: 'server_prefix', label: 'Server Prefix', type: 'text', required: true }
      ]
    },
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'E-commerce platform integration',
      icon: ShoppingCart,
      status: 'available',
      fields: [
        { key: 'shop_domain', label: 'Shop Domain', type: 'text', required: true },
        { key: 'access_token', label: 'Access Token', type: 'password', required: true },
        { key: 'api_version', label: 'API Version', type: 'text', required: false, placeholder: '2023-10' }
      ]
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks Online',
      description: 'Accounting and financial management',
      icon: FileSpreadsheet,
      status: 'available',
      fields: [
        { key: 'company_id', label: 'Company ID', type: 'text', required: true },
        { key: 'client_id', label: 'Client ID', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', type: 'password', required: true }
      ]
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing and billing',
      icon: Globe,
      status: 'available',
      fields: [
        { key: 'publishable_key', label: 'Publishable Key', type: 'text', required: true },
        { key: 'secret_key', label: 'Secret Key', type: 'password', required: true },
        { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false }
      ]
    }
  ]);

  const [configuredIntegrations, setConfiguredIntegrations] = useState([]);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.email === 'bgoltzman@liquidscreendesign.com';

  const toggleFeature = (featureId: string) => {
    const currentFeature = features.find(f => f.id === featureId);
    if (!currentFeature) return;
    
    featureToggleMutation.mutate({
      featureId,
      enabled: !currentFeature.enabled
    });
    
    // Optimistically update the UI
    setFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? { ...feature, enabled: !feature.enabled }
        : feature
    ));
  };

  const updateUserRole = (userId: string, newRole: 'admin' | 'manager' | 'user') => {
    setUsers(prev => prev.map(user =>
      user.id === userId
        ? { ...user, role: newRole }
        : user
    ));
    
    toast({
      title: "User Role Updated",
      description: "User permissions have been updated successfully.",
    });
  };

  const saveSettings = (section: string) => {
    // In production, this would save to backend
    toast({
      title: "Settings Saved",
      description: `${section} settings have been saved successfully.`,
    });
  };

  const addIntegration = (integrationType: any, config: any) => {
    const newIntegration = {
      id: `${integrationType.id}_${Date.now()}`,
      type: integrationType.id,
      name: integrationType.name,
      description: integrationType.description,
      icon: integrationType.icon,
      status: 'connected',
      config: config,
      connectedAt: new Date().toISOString()
    };
    
    setConfiguredIntegrations(prev => [...prev, newIntegration]);
    setShowAddIntegration(false);
    setSelectedIntegrationType(null);
    
    toast({
      title: "Integration Added",
      description: `${integrationType.name} has been successfully configured.`,
    });
  };

  const removeIntegration = (integrationId: string) => {
    setConfiguredIntegrations(prev => prev.filter(int => int.id !== integrationId));
    
    toast({
      title: "Integration Removed",
      description: "Integration has been successfully removed.",
    });
  };

  const FeatureCard = ({ feature }: { feature: FeatureToggle }) => {
    const Icon = feature.icon;
    const canToggle = !feature.adminOnly || isAdmin;
    
    return (
      <Card className={`transition-all ${feature.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg ${feature.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
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
      setConfigData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = () => {
      if (!selectedIntegrationType) return;
      
      // Validate required fields
      const requiredFields = selectedIntegrationType.fields.filter(field => field.required);
      const missingFields = requiredFields.filter(field => !configData[field.key]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Missing Required Fields",
          description: `Please fill in: ${missingFields.map(f => f.label).join(', ')}`,
          variant: "destructive"
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
              <p className="text-sm text-gray-600">Choose an integration to configure:</p>
              <div className="grid grid-cols-2 gap-3">
                {customIntegrations.map(integration => {
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
                          <h4 className="font-medium text-sm">{integration.name}</h4>
                          <p className="text-xs text-gray-600">{integration.description}</p>
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
                  <h3 className="font-medium">{selectedIntegrationType.name}</h3>
                  <p className="text-sm text-gray-600">{selectedIntegrationType.description}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {selectedIntegrationType.fields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      value={configData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      required={field.required}
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedIntegrationType(null)}>
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Settings2 className="w-12 h-12 text-gray-400 mb-4 animate-spin" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Settings</h2>
        <p className="text-gray-600">Please wait while we load the system configuration...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Shield className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600">You need administrator privileges to access system settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Manage features, users, and system configuration</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Administrator Access
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Integrations
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
                Control which features are available throughout the system. Admin-only features require administrator privileges.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(['core', 'analytics', 'integrations', 'advanced'] as const).map(category => (
                  <div key={category}>
                    <h3 className="font-medium text-sm text-gray-900 mb-3 capitalize">{category} Features</h3>
                    <div className="grid gap-3">
                      {features
                        .filter(feature => feature.category === category)
                        .map(feature => (
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <p className="text-sm text-gray-600">
                Manage user roles and permissions for system access control.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{user.name}</h4>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Last active: {new Date(user.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={user.role}
                        onValueChange={(value: 'admin' | 'manager' | 'user') => updateUserRole(user.id, value)}
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
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'manager' ? 'secondary' : 'outline'}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                ))}
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
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={generalSettings.currency}
                    onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, currency: value }))}
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
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, defaultMargin: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumMargin">Minimum Margin (%)</Label>
                  <Input
                    id="minimumMargin"
                    type="number"
                    value={generalSettings.minimumMargin}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, minimumMargin: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxOrderValue">Max Order Value ($)</Label>
                  <Input
                    id="maxOrderValue"
                    type="number"
                    value={generalSettings.maxOrderValue}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, maxOrderValue: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requireApprovalOver">Require Approval Over ($)</Label>
                  <Input
                    id="requireApprovalOver"
                    type="number"
                    value={generalSettings.requireApprovalOver}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, requireApprovalOver: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={() => saveSettings('General')} className="w-full">
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
                    <Label htmlFor={key} className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <p className="text-xs text-gray-600">
                      {key === 'emailNotifications' && 'Receive notifications via email'}
                      {key === 'slackNotifications' && 'Send alerts to configured Slack channels'}
                      {key === 'orderUpdates' && 'Get notified when orders change status'}
                      {key === 'customerUpdates' && 'Alerts for new customers and updates'}
                      {key === 'supplierUpdates' && 'Notifications about supplier changes'}
                      {key === 'marketingEmails' && 'Receive marketing and promotional emails'}
                      {key === 'weeklyReports' && 'Weekly performance and analytics reports'}
                      {key === 'instantAlerts' && 'Immediate notifications for urgent items'}
                      {key === 'dailyDigest' && 'Daily summary of all activities'}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
              <Button onClick={() => saveSettings('Notification')} className="w-full">
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
                <Button onClick={() => setShowAddIntegration(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Manage external service integrations and API connections.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Core Integrations */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-gray-900">Core Integrations</h3>
                
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
                        onChange={(e) => setIntegrations(prev => ({ ...prev, ssActivewearAccount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ssApiKey">API Key</Label>
                      <Input
                        id="ssApiKey"
                        type="password"
                        value={integrations.ssActivewearApiKey}
                        onChange={(e) => setIntegrations(prev => ({ ...prev, ssActivewearApiKey: e.target.value }))}
                      />
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
                      <Label htmlFor="slackToken">Bot Token</Label>
                      <Input
                        id="slackToken"
                        type="password"
                        value={integrations.slackBotToken}
                        onChange={(e) => setIntegrations(prev => ({ ...prev, slackBotToken: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slackChannel">Channel ID</Label>
                      <Input
                        id="slackChannel"
                        value={integrations.slackChannelId}
                        onChange={(e) => setIntegrations(prev => ({ ...prev, slackChannelId: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* HubSpot */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      <h4 className="font-medium">HubSpot CRM</h4>
                      <Badge variant="outline">Not Connected</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hubspotApi">API Key</Label>
                    <Input
                      id="hubspotApi"
                      type="password"
                      placeholder="Enter HubSpot API key"
                      value={integrations.hubspotApiKey}
                      onChange={(e) => setIntegrations(prev => ({ ...prev, hubspotApiKey: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Custom Integrations */}
              {configuredIntegrations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-gray-900">Custom Integrations</h3>
                  <div className="space-y-3">
                    {configuredIntegrations.map(integration => {
                      const Icon = integration.icon;
                      return (
                        <div key={integration.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{integration.name}</h4>
                                <p className="text-xs text-gray-600">{integration.description}</p>
                                <p className="text-xs text-gray-500">
                                  Connected: {new Date(integration.connectedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Connected</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeIntegration(integration.id)}
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

              <Button onClick={() => saveSettings('Integration')} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Integration Settings
              </Button>
            </CardContent>
          </Card>
          
          <AddIntegrationModal />
        </TabsContent>
      </Tabs>
    </div>
  );
}