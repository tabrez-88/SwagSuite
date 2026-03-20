import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  List,
  Package,
  Save,
  ShoppingCart,
} from "lucide-react";
import { useFormsTab } from "./hooks";

export function FormsTab() {
  const { formFields, toggleFormField, saveSettings } = useFormsTab();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="w-5 h-5" />
          Form Field Configuration
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure which fields are required in sales orders, purchase
          orders, and other forms.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Sales Order Fields
            </h3>
            <div className="space-y-2">
              {formFields.salesOrders.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{field.label}</Label>
                      <Badge
                        variant={field.required ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {field.required ? "Required" : "Optional"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs capitalize"
                      >
                        {field.type}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={field.enabled}
                    onCheckedChange={() =>
                      toggleFormField("salesOrders", field.id)
                    }
                    disabled={field.required}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Purchase Order Fields
            </h3>
            <div className="space-y-2">
              {formFields.purchaseOrders.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{field.label}</Label>
                      <Badge
                        variant={field.required ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {field.required ? "Required" : "Optional"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs capitalize"
                      >
                        {field.type}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={field.enabled}
                    onCheckedChange={() =>
                      toggleFormField("purchaseOrders", field.id)
                    }
                    disabled={field.required}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">
                Field Configuration Notes
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Required fields cannot be disabled. Optional fields can be
                toggled on/off based on your business needs. Changes will
                apply to new forms created after saving.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={saveSettings}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Field Configuration
        </Button>
      </CardContent>
    </Card>
  );
}
