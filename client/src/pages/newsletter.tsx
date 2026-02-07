import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mail, 
  Users, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  UserX,
  Plus,
  Calendar,
  Layout,
  Settings,
  BarChart3,
  Zap,
  Target,
  Edit
} from "lucide-react";
import { SubscriberManagement } from "@/components/newsletter/SubscriberManagement";
import { EmailTemplateEditor } from "@/components/newsletter/EmailTemplateEditor";
import { CampaignWorkflow } from "@/components/newsletter/CampaignWorkflow";
import { AnalyticsDashboard } from "@/components/newsletter/AnalyticsDashboard";
import { FormsAndLanding } from "@/components/newsletter/FormsAndLanding";

interface DashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalCampaigns: number;
  sentThisMonth: number;
  avgOpenRate: number;
  avgClickRate: number;
  unsubscribeRate: number;
  revenueGenerated: number;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused";
  type: "regular" | "automation" | "ab_test";
  scheduledAt?: string;
  sentAt?: string;
  totalSent: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
}

interface RecentActivity {
  id: string;
  type: "campaign_sent" | "subscriber_added" | "automation_triggered";
  description: string;
  timestamp: string;
}

export default function Newsletter() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock data for development - will be replaced with real API calls
  const dashboardStats: DashboardStats = {
    totalSubscribers: 15420,
    activeSubscribers: 14830,
    totalCampaigns: 87,
    sentThisMonth: 24,
    avgOpenRate: 24.5,
    avgClickRate: 3.2,
    unsubscribeRate: 0.8,
    revenueGenerated: 85430
  };

  const recentCampaigns: Campaign[] = [
    {
      id: "1",
      name: "Weekly Product Update",
      subject: "New Promotional Products Available",
      status: "sent",
      type: "regular",
      sentAt: "2025-01-02T10:00:00Z",
      totalSent: 14500,
      opens: 3625,
      clicks: 465,
      openRate: 25.0,
      clickRate: 3.2
    },
    {
      id: "2", 
      name: "Holiday Sale Campaign",
      subject: "🎉 50% Off All Custom Apparel",
      status: "scheduled",
      type: "regular",
      scheduledAt: "2025-01-10T09:00:00Z",
      totalSent: 0,
      opens: 0,
      clicks: 0,
      openRate: 0,
      clickRate: 0
    },
    {
      id: "3",
      name: "Welcome Series",
      subject: "Welcome to SwagSuite!",
      status: "sending",
      type: "automation",
      totalSent: 1250,
      opens: 387,
      clicks: 58,
      openRate: 30.9,
      clickRate: 4.6
    }
  ];

  const recentActivity: RecentActivity[] = [
    {
      id: "1",
      type: "campaign_sent",
      description: "Weekly Product Update sent to 14,500 subscribers",
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      type: "subscriber_added",
      description: "25 new subscribers added via signup form",
      timestamp: "4 hours ago"
    },
    {
      id: "3",
      type: "automation_triggered",
      description: "Welcome series triggered for 12 new subscribers",
      timestamp: "6 hours ago"
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Newsletter Marketing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create, manage, and analyze your email marketing campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button data-testid="button-create-campaign">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="subscribers" data-testid="tab-subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
          <TabsTrigger value="automations" data-testid="tab-automations">Automations</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="card-total-subscribers">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-subscribers">
                  {formatNumber(dashboardStats.totalSubscribers)}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-green-600">+2.5%</span> from last month
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-open-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-open-rate">
                  {dashboardStats.avgOpenRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-green-600">+1.2%</span> from industry avg
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-click-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-click-rate">
                  {dashboardStats.avgClickRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-green-600">+0.3%</span> from last month
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-revenue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-revenue">
                  {formatCurrency(dashboardStats.revenueGenerated)}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-green-600">+15.3%</span> from last month
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Campaigns and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-recent-campaigns">
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium" data-testid={`text-campaign-name-${campaign.id}`}>
                            {campaign.name}
                          </h4>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {campaign.subject}
                        </p>
                        {campaign.status === "sent" && (
                          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                            <span data-testid={`text-sent-${campaign.id}`}>
                              Sent: {formatNumber(campaign.totalSent)}
                            </span>
                            <span data-testid={`text-opens-${campaign.id}`}>
                              Opens: {formatNumber(campaign.opens)} ({campaign.openRate}%)
                            </span>
                            <span data-testid={`text-clicks-${campaign.id}`}>
                              Clicks: {formatNumber(campaign.clicks)} ({campaign.clickRate}%)
                            </span>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" data-testid={`button-edit-campaign-${campaign.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-activity-feed">
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        {activity.type === "campaign_sent" && <Mail className="w-4 h-4 text-blue-600 dark:text-blue-300" />}
                        {activity.type === "subscriber_added" && <Users className="w-4 h-4 text-green-600 dark:text-green-300" />}
                        {activity.type === "automation_triggered" && <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-300" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm" data-testid={`text-activity-${activity.id}`}>
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-timestamp-${activity.id}`}>
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="flex items-center gap-2 h-auto p-4" data-testid="button-create-campaign-quick">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Create Campaign</div>
                    <div className="text-sm text-muted-foreground">Design and send emails</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="flex items-center gap-2 h-auto p-4" data-testid="button-manage-subscribers">
                  <Users className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Manage Subscribers</div>
                    <div className="text-sm text-muted-foreground">Import and segment lists</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="flex items-center gap-2 h-auto p-4" data-testid="button-create-template">
                  <Layout className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Create Template</div>
                    <div className="text-sm text-muted-foreground">Design reusable layouts</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="flex items-center gap-2 h-auto p-4" data-testid="button-setup-automation">
                  <Target className="w-5 h-5 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Setup Automation</div>
                    <div className="text-sm text-muted-foreground">Create drip campaigns</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignWorkflow />
        </TabsContent>

        <TabsContent value="subscribers">
          <SubscriberManagement />
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplateEditor />
        </TabsContent>

        <TabsContent value="automations">
          <FormsAndLanding />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}