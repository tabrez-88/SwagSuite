import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import type { CustomIntegrationType } from "../types";

interface AddIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIntegrationType: CustomIntegrationType | null;
  setSelectedIntegrationType: (type: CustomIntegrationType | null) => void;
  customIntegrations: CustomIntegrationType[];
  addIntegration: (type: CustomIntegrationType, config: Record<string, string>) => void;
  toast: (opts: Record<string, any>) => any;
}

export function AddIntegrationModal({
  open,
  onOpenChange,
  selectedIntegrationType,
  setSelectedIntegrationType,
  customIntegrations,
  addIntegration,
  toast,
}: AddIntegrationModalProps) {
  const [configData, setConfigData] = useState<Record<string, string>>({});

  const handleFieldChange = (key: string, value: string) => {
    setConfigData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!selectedIntegrationType) return;

    const requiredFields = selectedIntegrationType.fields.filter(
      (field) => field.required,
    );
    const missingFields = requiredFields.filter(
      (field) => !configData[field.key],
    );

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.map((f) => f.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    addIntegration(selectedIntegrationType, configData);
    setConfigData({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
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
              {selectedIntegrationType.fields.map((field) => (
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
                    value={configData[field.key] || ""}
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
}
