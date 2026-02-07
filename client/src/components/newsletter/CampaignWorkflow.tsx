import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Mail, 
  Plus, 
  Send, 
  Calendar as CalendarIcon, 
  Users,
  Eye,
  Edit,
  Pause,
  Play,
  Trash2,
  Copy,
  Target,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Filter
} from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused";
  type: "regular" | "automation" | "ab_test";
  scheduledAt?: Date;
  sentAt?: Date;
  totalSent: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
  listName: string;
}

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: "signup" | "birthday" | "purchase" | "custom";
  isActive: boolean;
  totalTriggered: number;
  emails: AutomationEmail[];
}

interface AutomationEmail {
  id: string;
  subject: string;
  delay: { value: number; unit: "minutes" | "hours" | "days" };
  opens: number;
  clicks: number;
}

export function CampaignWorkflow() {
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateAutomation, setShowCreateAutomation] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Mock data
  const campaigns: Campaign[] = [
    {
      id: "1",
      name: "Weekly Product Update",
      subject: "New Promotional Products Available",
      status: "sent",
      type: "regular",
      sentAt: new Date("2025-01-02T10:00:00Z"),
      totalSent: 14500,
      opens: 3625,
      clicks: 465,
      openRate: 25.0,
      clickRate: 3.2,
      listName: "Main List"
    },
    {
      id: "2",
      name: "Holiday Sale Campaign",
      subject: "🎉 50% Off All Custom Apparel",
      status: "scheduled",
      type: "regular",
      scheduledAt: new Date("2025-01-10T09:00:00Z"),
      totalSent: 0,
      opens: 0,
      clicks: 0,
      openRate: 0,
      clickRate: 0,
      listName: "VIP Customers"
    },
    {
      id: "3",
      name: "A/B Test: Subject Lines",
      subject: "Which subject performs better?",
      status: "sending",
      type: "ab_test",
      totalSent: 5000,
      opens: 1200,
      clicks: 180,
      openRate: 24.0,
      clickRate: 3.6,
      listName: "Main List"
    }
  ];

  const automations: Automation[] = [
    {
      id: "1",
      name: "Welcome Series",
      description: "Onboard new subscribers with a 5-email welcome sequence",
      trigger: "signup",
      isActive: true,
      totalTriggered: 1250,
      emails: [
        { id: "1", subject: "Welcome to SwagSuite!", delay: { value: 0, unit: "minutes" }, opens: 1200, clicks: 180 },
        { id: "2", subject: "Getting Started Guide", delay: { value: 2, unit: "days" }, opens: 980, clicks: 145 },
        { id: "3", subject: "Popular Products", delay: { value: 5, unit: "days" }, opens: 850, clicks: 125 }
      ]
    },
    {
      id: "2",
      name: "Birthday Campaign",
      description: "Send birthday greetings with special offers",
      trigger: "birthday",
      isActive: true,
      totalTriggered: 340,
      emails: [
        { id: "1", subject: "🎂 Happy Birthday! Special Gift Inside", delay: { value: 0, unit: "hours" }, opens: 280, clicks: 95 }
      ]
    },
    {
      id: "3",
      name: "Win-Back Series",
      description: "Re-engage inactive subscribers",
      trigger: "custom",
      isActive: false,
      totalTriggered: 0,
      emails: [
        { id: "1", subject: "We miss you! Come back for 20% off", delay: { value: 30, unit: "days" }, opens: 0, clicks: 0 },
        { id: "2", subject: "Last chance - 30% off before we say goodbye", delay: { value: 7, unit: "days" }, opens: 0, clicks: 0 }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "scheduled": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "sending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "draft": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "paused": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <CheckCircle className="w-4 h-4" />;
      case "scheduled": return <Clock className="w-4 h-4" />;
      case "sending": return <Zap className="w-4 h-4" />;
      case "draft": return <Edit className="w-4 h-4" />;
      case "paused": return <Pause className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automations" data-testid="tab-automations">Automations</TabsTrigger>
          <TabsTrigger value="ab-testing" data-testid="tab-ab-testing">A/B Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Email Campaigns</h3>
            <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-campaign">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="campaign-name">Campaign Name</Label>
                      <Input id="campaign-name" placeholder="Weekly Newsletter" data-testid="input-campaign-name" />
                    </div>
                    <div>
                      <Label htmlFor="campaign-type">Type</Label>
                      <Select>
                        <SelectTrigger data-testid="select-campaign-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Regular Campaign</SelectItem>
                          <SelectItem value="ab_test">A/B Test</SelectItem>
                          <SelectItem value="automation">Automation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="campaign-subject">Subject Line</Label>
                    <Input id="campaign-subject" placeholder="Your compelling subject line" data-testid="input-campaign-subject" />
                  </div>
                  
                  <div>
                    <Label htmlFor="campaign-preview">Preview Text</Label>
                    <Input id="campaign-preview" placeholder="Preview text shown in inbox" data-testid="input-campaign-preview" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from-name">From Name</Label>
                      <Input id="from-name" placeholder="SwagSuite Team" data-testid="input-from-name" />
                    </div>
                    <div>
                      <Label htmlFor="from-email">From Email</Label>
                      <Input id="from-email" placeholder="hello@swagsuite.com" data-testid="input-from-email" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subscriber-list">Subscriber List</Label>
                    <Select>
                      <SelectTrigger data-testid="select-subscriber-list">
                        <SelectValue placeholder="Select list" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main List (15,420 subscribers)</SelectItem>
                        <SelectItem value="vip">VIP Customers (1,250 subscribers)</SelectItem>
                        <SelectItem value="new">New Subscribers (340 subscribers)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Send Options</Label>
                    <div className="flex gap-4 mt-2">
                      <Button variant="outline" className="flex-1" data-testid="button-send-now">
                        <Send className="w-4 h-4 mr-2" />
                        Send Now
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex-1" data-testid="button-schedule">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Schedule
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Button variant="outline" className="flex-1" data-testid="button-save-draft">
                        <Edit className="w-4 h-4 mr-2" />
                        Save Draft
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
                      Cancel
                    </Button>
                    <Button data-testid="button-save-campaign">Create Campaign</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} data-testid={`card-campaign-${campaign.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg" data-testid={`text-campaign-name-${campaign.id}`}>
                          {campaign.name}
                        </h4>
                        <Badge className={getStatusColor(campaign.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </div>
                        </Badge>
                        {campaign.type === "ab_test" && (
                          <Badge variant="outline">A/B Test</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3" data-testid={`text-campaign-subject-${campaign.id}`}>
                        {campaign.subject}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">List:</span>
                          <div className="font-medium" data-testid={`text-campaign-list-${campaign.id}`}>
                            {campaign.listName}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sent:</span>
                          <div className="font-medium" data-testid={`text-campaign-sent-${campaign.id}`}>
                            {campaign.totalSent.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Open Rate:</span>
                          <div className="font-medium" data-testid={`text-campaign-open-rate-${campaign.id}`}>
                            {campaign.openRate}%
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Click Rate:</span>
                          <div className="font-medium" data-testid={`text-campaign-click-rate-${campaign.id}`}>
                            {campaign.clickRate}%
                          </div>
                        </div>
                      </div>

                      {campaign.status === "scheduled" && campaign.scheduledAt && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                            <Clock className="w-4 h-4" />
                            Scheduled for {format(campaign.scheduledAt, "PPP 'at' p")}
                          </div>
                        </div>
                      )}

                      {campaign.status === "sending" && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>Sending Progress</span>
                            <span>{((campaign.totalSent / 15000) * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={(campaign.totalSent / 15000) * 100} className="h-2" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" data-testid={`button-view-campaign-${campaign.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-edit-campaign-${campaign.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-copy-campaign-${campaign.id}`}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      {campaign.status === "sending" && (
                        <Button variant="outline" size="sm" data-testid={`button-pause-campaign-${campaign.id}`}>
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Email Automations</h3>
            <Dialog open={showCreateAutomation} onOpenChange={setShowCreateAutomation}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-automation">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Automation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Automation</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="automation-name">Automation Name</Label>
                    <Input id="automation-name" placeholder="Welcome Series" data-testid="input-automation-name" />
                  </div>
                  
                  <div>
                    <Label htmlFor="automation-description">Description</Label>
                    <Textarea 
                      id="automation-description" 
                      placeholder="Describe what this automation does..."
                      data-testid="textarea-automation-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="automation-trigger">Trigger</Label>
                    <Select>
                      <SelectTrigger data-testid="select-automation-trigger">
                        <SelectValue placeholder="When should this automation start?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="signup">When someone subscribes</SelectItem>
                        <SelectItem value="birthday">On subscriber's birthday</SelectItem>
                        <SelectItem value="purchase">After a purchase</SelectItem>
                        <SelectItem value="custom">Custom event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateAutomation(false)}>
                      Cancel
                    </Button>
                    <Button data-testid="button-save-automation">Create Automation</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {automations.map((automation) => (
              <Card key={automation.id} data-testid={`card-automation-${automation.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg" data-testid={`text-automation-name-${automation.id}`}>
                          {automation.name}
                        </h4>
                        <Badge className={automation.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {automation.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {automation.trigger}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-4" data-testid={`text-automation-description-${automation.id}`}>
                        {automation.description}
                      </p>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Email Sequence ({automation.emails.length} emails)</div>
                        <div className="space-y-2">
                          {automation.emails.map((email, index) => (
                            <div key={email.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm" data-testid={`text-email-subject-${email.id}`}>
                                  {email.subject}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {email.delay.value === 0 ? "Immediately" : `${email.delay.value} ${email.delay.unit} after trigger`}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {email.opens} opens • {email.clicks} clicks
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-muted-foreground" data-testid={`text-automation-triggered-${automation.id}`}>
                        Triggered {automation.totalTriggered} times
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        data-testid={`button-toggle-automation-${automation.id}`}
                      >
                        {automation.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-edit-automation-${automation.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-settings-automation-${automation.id}`}>
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ab-testing">
          <Card data-testid="card-ab-testing-placeholder">
            <CardHeader>
              <CardTitle>A/B Testing</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">A/B testing tools coming soon</h3>
                <p className="text-muted-foreground">Test subject lines, content, and send times to optimize performance</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}