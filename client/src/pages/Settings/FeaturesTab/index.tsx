import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Lock, Shield, ToggleRight } from "lucide-react";
import { useFeaturesTab } from "./hooks";
import type { FeatureToggle, FeaturesTabProps } from "./types";

function FeatureCard({
  feature,
  canToggle,
  onToggle,
}: {
  feature: FeatureToggle;
  canToggle: boolean;
  onToggle: (id: string) => void;
}) {
  const Icon = feature.icon;

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
              onCheckedChange={() => onToggle(feature.id)}
              className="ml-4"
            />
          ) : (
            <Lock className="w-4 h-4 text-gray-400 ml-4" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function FeaturesTab(props: FeaturesTabProps) {
  const { features, isAdmin, toggleFeature } = useFeaturesTab(props);

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
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      canToggle={!feature.adminOnly || isAdmin}
                      onToggle={toggleFeature}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
