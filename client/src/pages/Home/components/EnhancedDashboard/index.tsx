import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Target,
  Trophy,
  Activity,
  Zap,
  MessageSquare,
  Newspaper,
  BarChart3,
  Database
} from "lucide-react";
import { SlackPanel } from "../SlackPanel";
import { PopularProducts } from "@/components/shared/PopularProducts";
import { useEnhancedDashboard } from "./hooks";

export function EnhancedDashboard() {
  const {
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    metrics,
    leaderboard,
    automationTasks,
    newsAlerts,
    getMetricByRange,
    getComparisonMetric,
    calculateGrowth,
    getPriorityColor,
    getSentimentColor,
    seedDataMutation,
  } = useEnhancedDashboard();

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-swag-navy">Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your promotional products business
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => seedDataMutation.mutate()}
            disabled={seedDataMutation.isPending}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {seedDataMutation.isPending ? "Adding Data..." : "Add Sample Data"}
          </Button>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="wtd">Week to Date</SelectItem>
              <SelectItem value="mtd">Month to Date</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="popular">Popular Items</TabsTrigger>
          <TabsTrigger value="automation">AI Automation</TabsTrigger>
          <TabsTrigger value="news">News & Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-swag-blue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue ({dateRange.toUpperCase()})</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-swag-blue">
                  ${getMetricByRange(dateRange).toLocaleString()}
                </div>
                {getComparisonMetric(dateRange) > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">
                      +{calculateGrowth(getMetricByRange(dateRange), getComparisonMetric(dateRange)).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs last period</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-swag-yellow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-swag-yellow">
                  {metrics?.activeOrders || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg order value: ${metrics?.avgOrderValue?.toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-swag-teal">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-swag-teal">
                  {metrics?.grossMargin?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Order quantity: {metrics?.orderQuantity || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-swag-navy">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-swag-navy">
                  ${metrics?.pipelineValue?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Conversion rate: {metrics?.conversionRate?.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-3">
                    {/* Recent activities would be loaded here */}
                    <div className="flex items-center gap-3 p-2 rounded bg-gray-50">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <p className="text-sm">New order from ABC Corp</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded bg-gray-50">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm">HubSpot sync completed</p>
                        <p className="text-xs text-muted-foreground">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded bg-gray-50">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="flex-1">
                        <p className="text-sm">AI draft ready for review</p>
                        <p className="text-xs text-muted-foreground">12 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Create New Order
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Team Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Team Leaderboard
              </CardTitle>
              <CardDescription>
                Performance metrics for {dateRange.toUpperCase()} period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard?.map((member, index) => (
                  <div key={member.userId} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-swag-blue rounded-full flex items-center justify-center text-white font-bold">
                        #{index + 1}
                      </div>
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.ordersCount} orders • {member.contactsReached} contacts
                        </p>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium">${member.ytdRevenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{member.conversionRate.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Conversion</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{member.meetingsHeld}</p>
                        <p className="text-sm text-muted-foreground">Meetings</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          <PopularProducts />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Automation Tasks
              </CardTitle>
              <CardDescription>
                AI-generated tasks and automated follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80 w-full">
                <div className="space-y-3">
                  {automationTasks?.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">
                            {task.type.replace('_', ' ')}
                          </Badge>
                          {task.entityName && (
                            <Badge variant="secondary">{task.entityName}</Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-1">{task.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Scheduled: {new Date(task.scheduledFor).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                        <Button size="sm">
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Breaking News & Alerts
              </CardTitle>
              <CardDescription>
                AI-powered news monitoring for customers and vendors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80 w-full">
                <div className="space-y-4">
                  {newsAlerts?.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSentimentColor(alert.sentiment)}>
                              {alert.sentiment}
                            </Badge>
                            <Badge variant="outline">
                              {alert.entityType}
                            </Badge>
                            <Badge variant="secondary">
                              {alert.entityName}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              Score: {alert.relevanceScore}/10
                            </span>
                          </div>
                          <h4 className="font-medium mb-2">{alert.headline}</h4>
                          <p className="text-sm text-muted-foreground">
                            Published: {new Date(alert.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm">
                            Send Alert
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
