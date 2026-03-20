import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Mail,
  Settings as SettingsIcon,
} from "lucide-react";
import { useEmailReportsTab } from "./hooks";

export function EmailReportsTab() {
  useEmailReportsTab();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Weekly Email Reports Configuration
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure automated weekly email reports with custom metrics and
          scheduling.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">
                Email Reporting System
              </h3>
              <p className="text-xs text-gray-500">
                System ready for SendGrid integration
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50">
              Ready for Setup
            </Badge>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  Email Infrastructure Status
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Weekly reporting system is configured and ready.
                  Complete database schema, API routes, and metric
                  calculation logic are in place. When SendGrid API key is
                  provided, automated email delivery will be activated.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Report Configuration</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="report-day"
                  className="text-sm font-medium"
                >
                  Send Day
                </Label>
                <Select defaultValue="monday">
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="report-time"
                  className="text-sm font-medium"
                >
                  Send Time
                </Label>
                <Select defaultValue="09:00">
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Available Metrics</h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Weekly Orders</p>
                    <p className="text-xs text-gray-500">
                      Total orders processed this week
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Weekly Revenue</p>
                    <p className="text-xs text-gray-500">
                      Total revenue generated this week
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Profit Margin</p>
                    <p className="text-xs text-gray-500">
                      Average profit margin percentage
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">New Customers</p>
                    <p className="text-xs text-gray-500">
                      New companies added this week
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Test & Preview</h3>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Generate Sample Report
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Preview Email Template
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <SettingsIcon className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Next Steps
                </h4>
                <ul className="text-sm text-gray-700 mt-1 space-y-1">
                  <li>Complete database schema setup (Done)</li>
                  <li>Configure API endpoints (Done)</li>
                  <li>Set up metric calculation logic (Done)</li>
                  <li>Add SendGrid API key for email delivery</li>
                  <li>Schedule automated report generation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
