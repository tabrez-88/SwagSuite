import { useToast } from "@/hooks/use-toast";
import { useUpdateFeatureToggles } from "@/services/settings";
import {
  BarChart3,
  Brain,
  Globe,
  Lightbulb,
  Package,
  Settings2,
  Slack,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { FeatureToggle, FeaturesTabProps } from "./types";

const DEFAULT_FEATURES: FeatureToggle[] = [
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
];

export function useFeaturesTab({ user, adminSettings }: FeaturesTabProps) {
  const { toast } = useToast();

  const isAdmin =
    user?.role === "admin" ||
    user?.email === "bgoltzman@liquidscreendesign.com";

  const [features, setFeatures] = useState<FeatureToggle[]>(DEFAULT_FEATURES);

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

  const featureToggleMutation = useUpdateFeatureToggles();

  const toggleFeature = (featureId: string) => {
    const currentFeature = features.find((f) => f.id === featureId);
    if (!currentFeature) return;

    const currentToggles: Record<string, boolean> = {};
    features.forEach((f) => {
      currentToggles[f.id] = f.enabled;
    });
    currentToggles[featureId] = !currentFeature.enabled;

    featureToggleMutation.mutate(currentToggles, {
      onSuccess: () =>
        toast({ title: "Feature Updated", description: "Feature toggle has been updated successfully." }),
      onError: () =>
        toast({ title: "Error", description: "Failed to update feature toggle.", variant: "destructive" }),
    });

    // Optimistically update the UI
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === featureId ? { ...feature, enabled: !feature.enabled } : feature,
      ),
    );
  };

  return {
    features,
    isAdmin,
    toggleFeature,
  };
}
