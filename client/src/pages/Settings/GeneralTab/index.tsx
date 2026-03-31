import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Settings as SettingsIcon } from "lucide-react";
import { useGeneralTab } from "./hooks";
import type { GeneralTabProps } from "./types";

export function GeneralTab({ adminSettings }: GeneralTabProps) {
  const { generalSettings, updateField, saveSettings } =
    useGeneralTab(adminSettings);

  return (
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
              onChange={(e) => updateField("companyName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={generalSettings.currency}
              onValueChange={(value) => updateField("currency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (&#8364;)</SelectItem>
                <SelectItem value="GBP">GBP (&#163;)</SelectItem>
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
              onChange={(e) => updateField("defaultMargin", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minimumMargin">Minimum Margin (%)</Label>
            <Input
              id="minimumMargin"
              type="number"
              value={generalSettings.minimumMargin}
              onChange={(e) => updateField("minimumMargin", e.target.value)}
            />
          </div>
          {/* Hidden until enforcement logic is implemented */}
          {/* <div className="space-y-2">
            <Label htmlFor="maxOrderValue">Max Order Value ($)</Label>
            <Input
              id="maxOrderValue"
              type="number"
              value={generalSettings.maxOrderValue}
              onChange={(e) => updateField("maxOrderValue", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requireApprovalOver">
              Require Approval Over ($)
            </Label>
            <Input
              id="requireApprovalOver"
              type="number"
              value={generalSettings.requireApprovalOver}
              onChange={(e) =>
                updateField("requireApprovalOver", e.target.value)
              }
            />
          </div> */}
        </div>
        <Button onClick={saveSettings} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save General Settings
        </Button>
      </CardContent>
    </Card>
  );
}
