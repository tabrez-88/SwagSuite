
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Target,
  Phone,
  Mail,
  Calendar,
  FileText,
  Clock,
  Star,
  Award,
  Activity,
  BarChart3,
  Eye,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function TeamPerformance() {
  const { data: teamData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/team-performance"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "needs_attention": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor sales performance, KPIs, and team achievements</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Team Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${(teamData?.teamStats?.totalRevenue / 1000000).toFixed(2)}M</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+12.3% vs target</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={teamData?.teamStats?.achievementPercentage} className="mt-3" />
            <p className="text-xs text-gray-500 mt-1">{teamData?.teamStats?.achievementPercentage}% of ${(teamData?.teamStats?.teamTargetRevenue / 1000000).toFixed(2)}M target</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{teamData?.teamStats?.totalOrders}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+8.4% this month</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">${teamData?.teamStats?.avgOrderValue?.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+5.7% this month</span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{teamData?.teamStats?.conversionRate}%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+1.2% this quarter</span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{teamData?.teamStats?.customerSatisfaction}/5</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+0.3 this month</span>
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Error Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">{teamData?.teamStats?.errorResolutionRate || 0}%</p>
                <div className="flex items-center mt-1">
                  {(teamData?.teamStats?.errorResolutionRate || 0) >= 90 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">+8.2% this month</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-xs text-red-600">-2.1% this month</span>
                    </>
                  )}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                {teamData?.teamStats?.resolvedErrors || 0} of {teamData?.teamStats?.totalErrors || 0} resolved
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="team-overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="team-overview">Team Overview</TabsTrigger>
          <TabsTrigger value="individual-performance">Individual Performance</TabsTrigger>
          <TabsTrigger value="kpi-metrics">KPI Metrics</TabsTrigger>
          <TabsTrigger value="product-performance">Product Performance</TabsTrigger>
          <TabsTrigger value="error-tracking">Error Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="team-overview" className="space-y-6">
          {/* Revenue Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={teamData?.monthlyTrends?.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${(value as number / 1000).toFixed(0)}K`, 'Revenue']} />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Communication Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Calls</span>
                  <span className="font-medium">{teamData?.activityMetrics?.totalCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Emails</span>
                  <span className="font-medium">{teamData?.activityMetrics?.totalEmails}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Meetings</span>
                  <span className="font-medium">{teamData?.activityMetrics?.totalMeetings}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Sales Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Proposals</span>
                  <span className="font-medium">{teamData?.activityMetrics?.totalProposals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Follow-up Rate</span>
                  <span className="font-medium">{teamData?.activityMetrics?.followUpRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="font-medium">{teamData?.activityMetrics?.avgResponseTime}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Client Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Deals</span>
                  <span className="font-medium">{teamData?.teamStats?.activeDeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">New Clients</span>
                  <span className="font-medium">{teamData?.teamStats?.newClients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Repeat Clients</span>
                  <span className="font-medium">{teamData?.teamStats?.repeatClients}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="individual-performance" className="space-y-6">
          {/* Individual Performance Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamData?.salesTeam?.map((member: any) => (
              <Card key={member.id} className={`${member.status === 'needs_attention' ? 'border-red-200' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">
                          {member.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(member.status)}>
                        {member.status.replace('_', ' ')}
                      </Badge>
                      {getTrendIcon(member.trend)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Revenue: ${(member.revenue / 1000).toFixed(0)}K</span>
                      <span>{member.achievement}% of target</span>
                    </div>
                    <Progress value={member.achievement} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Orders</p>
                      <p className="font-medium">{member.orders}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Order Value</p>
                      <p className="font-medium">${member.avgOrderValue?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Conversion Rate</p>
                      <p className="font-medium">{member.conversionRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">New Clients</p>
                      <p className="font-medium">{member.newClients}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Errors Reported
                      </p>
                      <p className="font-medium">{member.errorsReported || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Error Cost
                      </p>
                      <p className="font-medium text-red-600">${(member.errorCost || 0).toFixed(0)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Monthly Progress</p>
                    <ResponsiveContainer width="100%" height={80}>
                      <BarChart data={member.monthlyProgress}>
                        <Bar dataKey="revenue" fill="#8884d8" />
                        <Bar dataKey="target" fill="#e0e0e0" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kpi-metrics" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamData?.teamKPIs?.map((kpi: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{kpi.metric}</h3>
                    {getTrendIcon(kpi.trend)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-2xl font-bold">{kpi.value}</span>
                      <span className="text-sm text-gray-600">Target: {kpi.target}</span>
                    </div>
                    <Progress value={kpi.achievement} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className={`${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {kpi.change}
                      </span>
                      <span className="text-gray-500">{kpi.period}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="product-performance" className="space-y-6">
          {/* Product Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={teamData?.productPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, revenue }) => `${category}: $${(revenue / 1000).toFixed(0)}K`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {teamData?.productPerformance?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${(value as number / 1000).toFixed(0)}K`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamData?.productPerformance?.map((category: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{category.category}</h4>
                        <p className="text-sm text-gray-600">Top Rep: {category.topSalesperson}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(category.revenue / 1000).toFixed(0)}K</p>
                        <p className="text-sm text-gray-600">{category.orders} orders</p>
                        <p className="text-xs text-gray-500">AOV: ${category.avgOrderValue?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="error-tracking" className="space-y-6">
          {/* Error Tracking Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                  Error Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Errors</span>
                  <span className="font-medium text-red-600">{teamData?.teamStats?.totalErrors || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Resolved</span>
                  <span className="font-medium text-green-600">{teamData?.teamStats?.resolvedErrors || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Open Issues</span>
                  <span className="font-medium text-orange-600">{teamData?.teamStats?.unresolvedErrors || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Resolution Rate</span>
                  <span className="font-medium">{teamData?.teamStats?.errorResolutionRate || 0}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-red-500" />
                  Error Cost Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Cost</span>
                  <span className="font-medium text-red-600">${(teamData?.teamStats?.totalErrorCost || 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Cost/Error</span>
                  <span className="font-medium">
                    ${teamData?.teamStats?.totalErrors > 0 ? 
                      ((teamData?.teamStats?.totalErrorCost || 0) / teamData?.teamStats?.totalErrors).toFixed(0) : 
                      '0'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">% of Revenue</span>
                  <span className="font-medium">
                    {teamData?.teamStats?.totalRevenue > 0 ? 
                      (((teamData?.teamStats?.totalErrorCost || 0) / teamData?.teamStats?.totalRevenue) * 100).toFixed(2) : 
                      '0'
                    }%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-blue-500" />
                  Error Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">LSD Errors</span>
                  <span className="font-medium">{teamData?.teamStats?.lsdErrors || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vendor Errors</span>
                  <span className="font-medium">{teamData?.teamStats?.vendorErrors || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer Errors</span>
                  <span className="font-medium">{teamData?.teamStats?.customerErrors || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Resolution Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Error Resolution Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Resolution Rate</span>
                    <span>{teamData?.teamStats?.errorResolutionRate || 0}%</span>
                  </div>
                  <Progress value={teamData?.teamStats?.errorResolutionRate || 0} className="h-3" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-green-700">{teamData?.teamStats?.resolvedErrors || 0}</p>
                    <p className="text-sm text-green-600">Resolved</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-orange-700">{teamData?.teamStats?.unresolvedErrors || 0}</p>
                    <p className="text-sm text-orange-600">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-red-700">${(teamData?.teamStats?.totalErrorCost || 0).toFixed(0)}</p>
                    <p className="text-sm text-red-600">Total Cost</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Error Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Team Error Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamData?.salesTeam?.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-800">
                          {member.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{member.errorsReported || 0}</p>
                        <p className="text-gray-600">Reported</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-green-600">{member.errorsResolved || 0}</p>
                        <p className="text-gray-600">Resolved</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-red-600">${(member.errorCost || 0).toFixed(0)}</p>
                        <p className="text-gray-600">Cost</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">
                          {member.errorsReported > 0 ? 
                            Math.round((member.errorsResolved || 0) / member.errorsReported * 100) : 
                            0
                          }%
                        </p>
                        <p className="text-gray-600">Rate</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}