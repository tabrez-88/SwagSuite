import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Brain,
  Globe,
  Lightbulb,
  Lock,
  Package,
  Settings2,
  Shield,
  Slack,
  Star,
  Target,
  ToggleRight,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";

interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "core" | "analytics" | "integrations" | "advanced";
  adminOnly?: boolean;
  icon: any;
}

interface FeaturesTabProps {
  user: any;
  adminSettings: any;
}

export function FeaturesTab({ user, adminSettings }: FeaturesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin =
    user?.role === "admin" ||
    user?.email === "bgoltzman@liquidscreendesign.com";

  const [features, setFeatures] = useState<FeatureToggle[]>([
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

  // Initialize features from server data
  useEffect(() => {
    if (adminSettings) {
      const serverToggles = (adminSettings as any).featureToggles || {};
      if (Object.keys(serverToggles).length > 0) {
        setFeatures((prev) =>
          prev.map((f) => ({
            ...f,
            enabled:
              serverToggles[f.id] !== undefined
                ? serverToggles[f.id]
                : f.enabled,
          })),
        );
      }
    }
  }, [adminSettings]);

  const featureToggleMutation = useMutation({
    mutationFn: async ({
      featureId,
      enabled,
    }: {
      featureId: string;
      enabled: boolean;
    }) => {
      const currentToggles: Record<string, boolean> = {};
      features.forEach((f) => {
        currentToggles[f.id] = f.enabled;
      });
      currentToggles[featureId] = enabled;
      return await apiRequest("PUT", "/api/admin/settings/features", {
        featureToggles: currentToggles,
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

  return (
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
  );
}
