export interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "core" | "analytics" | "integrations" | "advanced";
  adminOnly?: boolean;
  icon: any;
}

export interface FeaturesTabProps {
  user: any;
  adminSettings: any;
}
