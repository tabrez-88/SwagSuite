import { useQuery } from "@tanstack/react-query";
import KPICard from "./KPICard";
import RecentOrdersTable from "./RecentOrdersTable";
import TeamLeaderboard from "./TeamLeaderboard";
import ActivityFeed from "./ActivityFeed";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus, Box, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-orders"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your promotional products business today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Button className="bg-swag-primary hover:bg-swag-primary/90 p-4 h-auto flex items-center space-x-3">
          <PlusCircle size={20} />
          <span className="font-medium">New Quote</span>
        </Button>
        <Button className="bg-swag-accent hover:bg-swag-accent/90 p-4 h-auto flex items-center space-x-3">
          <UserPlus size={20} />
          <span className="font-medium">Add Customer</span>
        </Button>
        <Button className="bg-swag-secondary hover:bg-swag-secondary/90 text-swag-dark p-4 h-auto flex items-center space-x-3">
          <Box size={20} />
          <span className="font-medium">Add Product</span>
        </Button>
        <Button className="bg-gray-600 hover:bg-gray-700 p-4 h-auto flex items-center space-x-3">
          <FileText size={20} />
          <span className="font-medium">Generate Report</span>
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Revenue (YTD)"
          value={stats?.totalRevenue ? `$${(stats.totalRevenue / 1000000).toFixed(1)}M` : "$0"}
          change="+12.5% vs last year"
          changeType="positive"
          icon="dollar"
          loading={statsLoading}
        />
        <KPICard
          title="Active Orders"
          value={stats?.activeOrders?.toString() || "0"}
          change="8 new this week"
          changeType="positive"
          icon="cart"
          loading={statsLoading}
        />
        <KPICard
          title="Gross Margin"
          value={stats?.grossMargin ? `${stats.grossMargin.toFixed(1)}%` : "0%"}
          change="+2.1% improvement"
          changeType="positive"
          icon="percentage"
          loading={statsLoading}
        />
        <KPICard
          title="Customer Count"
          value={stats?.customerCount?.toString() || "0"}
          change="18 new customers"
          changeType="positive"
          icon="users"
          loading={statsLoading}
        />
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <RecentOrdersTable orders={recentOrders || []} loading={ordersLoading} />
        </div>

        {/* Team Leaderboard */}
        <TeamLeaderboard />
      </div>

      {/* Bottom Row Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Trend</CardTitle>
              <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
                <option>Last 6 months</option>
                <option>Last 12 months</option>
                <option>Year to date</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FileText size={48} className="mx-auto mb-2" />
                <p className="text-sm">Revenue Chart Placeholder</p>
                <p className="text-xs mt-1">Integration with charting library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <ActivityFeed activities={activities || []} loading={activitiesLoading} />
      </div>

      {/* Slack Integration Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-swag-primary rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <CardTitle>Team Slack Integration</CardTitle>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-sm font-medium text-gray-900">Connected Channels</p>
              <p className="text-xs text-gray-500 mt-1">3 channels active</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-xs">🔔</span>
              </div>
              <p className="text-sm font-medium text-gray-900">Auto Notifications</p>
              <p className="text-xs text-gray-500 mt-1">Order updates enabled</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-xs">🤖</span>
              </div>
              <p className="text-sm font-medium text-gray-900">AI Bot Active</p>
              <p className="text-xs text-gray-500 mt-1">Responds to queries</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
