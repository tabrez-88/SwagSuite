import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  UserX,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  Mail,
  Users,
  DollarSign
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";

interface AnalyticsData {
  period: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  revenue: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  sentDate: string;
  recipients: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
  revenue: number;
}

interface SubjectLineTest {
  id: string;
  subjectA: string;
  subjectB: string;
  winningSide: "A" | "B";
  openRateA: number;
  openRateB: number;
  improvement: number;
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("opens");

  // Mock analytics data
  const performanceData: AnalyticsData[] = [
    { period: "Week 1", sent: 15420, delivered: 15200, opened: 3800, clicked: 456, unsubscribed: 12, bounced: 220, revenue: 12500 },
    { period: "Week 2", sent: 14800, delivered: 14580, opened: 3650, clicked: 438, unsubscribed: 18, bounced: 220, revenue: 11800 },
    { period: "Week 3", sent: 16200, delivered: 15950, opened: 4150, clicked: 515, unsubscribed: 15, bounced: 250, revenue: 14200 },
    { period: "Week 4", sent: 15800, delivered: 15580, opened: 3950, clicked: 482, unsubscribed: 21, bounced: 220, revenue: 13100 }
  ];

  const topCampaigns: CampaignPerformance[] = [
    {
      id: "1",
      name: "Holiday Sale Campaign",
      sentDate: "2025-01-02",
      recipients: 15420,
      opens: 4200,
      clicks: 840,
      openRate: 27.2,
      clickRate: 5.4,
      revenue: 18500
    },
    {
      id: "2", 
      name: "Product Launch: Custom Mugs",
      sentDate: "2024-12-28",
      recipients: 12300,
      opens: 3200,
      clicks: 480,
      openRate: 26.0,
      clickRate: 3.9,
      revenue: 12200
    },
    {
      id: "3",
      name: "Welcome Series Email #1",
      sentDate: "2024-12-20",
      recipients: 1250,
      opens: 387,
      clicks: 58,
      openRate: 30.9,
      clickRate: 4.6,
      revenue: 2800
    }
  ];

  const abTests: SubjectLineTest[] = [
    {
      id: "1",
      subjectA: "New Products Available",
      subjectB: "🔥 Hot New Products Just Arrived!",
      winningSide: "B",
      openRateA: 22.4,
      openRateB: 28.7,
      improvement: 28.1
    },
    {
      id: "2",
      subjectA: "Your Order Update",
      subjectB: "Great News About Your Order!",
      winningSide: "B", 
      openRateA: 31.2,
      openRateB: 35.8,
      improvement: 14.7
    }
  ];

  const deviceData = [
    { name: "Mobile", value: 58, color: "#3b82f6" },
    { name: "Desktop", value: 32, color: "#10b981" },
    { name: "Tablet", value: 10, color: "#f59e0b" }
  ];

  const engagementData = [
    { period: "Jan 1", subscribers: 14850, active: 12200, engaged: 8900 },
    { period: "Jan 8", subscribers: 15100, active: 12450, engaged: 9100 },
    { period: "Jan 15", subscribers: 15380, active: 12680, engaged: 9250 },
    { period: "Jan 22", subscribers: 15420, active: 12750, engaged: 9320 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-green-600";
    if (current < previous) return "text-red-600";
    return "text-gray-600";
  };

  const calculateTrend = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h3 className="text-lg font-medium">Email Analytics</h3>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-refresh-data">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" data-testid="button-export-report">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="engagement" data-testid="tab-engagement">Engagement</TabsTrigger>
          <TabsTrigger value="ab-tests" data-testid="tab-ab-tests">A/B Tests</TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="card-total-sent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-sent">
                  {performanceData.reduce((sum, d) => sum + d.sent, 0).toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {getTrendIcon(62220, 58500)}
                  <span className={getTrendColor(62220, 58500)}>
                    +{calculateTrend(62220, 58500)}% from last period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-avg-open-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-open-rate">
                  25.8%
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {getTrendIcon(25.8, 23.2)}
                  <span className={getTrendColor(25.8, 23.2)}>
                    +{calculateTrend(25.8, 23.2)}% from last period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-avg-click-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-click-rate">
                  3.8%
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {getTrendIcon(3.8, 3.2)}
                  <span className={getTrendColor(3.8, 3.2)}>
                    +{calculateTrend(3.8, 3.2)}% from last period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-total-revenue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-revenue">
                  {formatCurrency(performanceData.reduce((sum, d) => sum + d.revenue, 0))}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {getTrendIcon(51600, 44200)}
                  <span className={getTrendColor(51600, 44200)}>
                    +{calculateTrend(51600, 44200)}% from last period
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card data-testid="card-performance-chart">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Email Performance Trends</CardTitle>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-32" data-testid="select-metric">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opens">Opens</SelectItem>
                    <SelectItem value="clicks">Clicks</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-device-breakdown">
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-engagement-health">
              <CardHeader>
                <CardTitle>List Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Engagement Rate</span>
                    <span className="font-medium">73.2%</span>
                  </div>
                  <Progress value={73.2} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>List Growth Rate</span>
                    <span className="font-medium">2.8%</span>
                  </div>
                  <Progress value={28} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Unsubscribe Rate</span>
                    <span className="font-medium">0.4%</span>
                  </div>
                  <Progress value={4} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Bounce Rate</span>
                    <span className="font-medium">1.2%</span>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card data-testid="card-campaign-performance">
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium" data-testid={`text-campaign-name-${campaign.id}`}>
                        {campaign.name}
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        {campaign.sentDate}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Recipients:</span>
                        <div className="font-medium" data-testid={`text-recipients-${campaign.id}`}>
                          {campaign.recipients.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Open Rate:</span>
                        <div className="font-medium" data-testid={`text-open-rate-${campaign.id}`}>
                          {formatPercentage(campaign.openRate)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Click Rate:</span>
                        <div className="font-medium" data-testid={`text-click-rate-${campaign.id}`}>
                          {formatPercentage(campaign.clickRate)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Revenue:</span>
                        <div className="font-medium" data-testid={`text-revenue-${campaign.id}`}>
                          {formatCurrency(campaign.revenue)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Open Rate</div>
                        <Progress value={campaign.openRate} className="h-2" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Click Rate</div>
                        <Progress value={campaign.clickRate * 10} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card data-testid="card-engagement-trends">
            <CardHeader>
              <CardTitle>Subscriber Engagement Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="subscribers" stroke="#3b82f6" name="Total Subscribers" />
                  <Line type="monotone" dataKey="active" stroke="#10b981" name="Active Subscribers" />
                  <Line type="monotone" dataKey="engaged" stroke="#f59e0b" name="Highly Engaged" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab-tests" className="space-y-6">
          <Card data-testid="card-ab-test-results">
            <CardHeader>
              <CardTitle>A/B Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {abTests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Subject Line Test</h4>
                      <Badge className="bg-green-100 text-green-800">
                        Winner: Version {test.winningSide}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Version A</div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-subject-a-${test.id}`}>
                          "{test.subjectA}"
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Open Rate</span>
                          <span className="font-medium" data-testid={`text-open-rate-a-${test.id}`}>
                            {formatPercentage(test.openRateA)}
                          </span>
                        </div>
                        <Progress value={test.openRateA} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Version B (Winner)</div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-subject-b-${test.id}`}>
                          "{test.subjectB}"
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Open Rate</span>
                          <span className="font-medium" data-testid={`text-open-rate-b-${test.id}`}>
                            {formatPercentage(test.openRateB)}
                          </span>
                        </div>
                        <Progress value={test.openRateB} className="h-2" />
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-sm text-green-700 dark:text-green-300">
                        <Target className="w-4 h-4 inline mr-2" />
                        Version B performed {formatPercentage(test.improvement)} better than Version A
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card data-testid="card-revenue-analytics">
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Revenue tracking coming soon</h3>
                <p className="text-muted-foreground">Track email campaign ROI and revenue attribution</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}