import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Activity } from "@shared/schema";

interface ActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
}

const getActivityColor = (action: string) => {
  switch (action) {
    case "created":
      return "bg-green-500";
    case "updated":
      return "bg-blue-500";
    case "approved":
      return "bg-green-500";
    case "cancelled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export default function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-2 h-2 rounded-full mt-2" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No recent activity</p>
            <p className="text-sm mt-1">Activity will appear here as you use the system</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div 
                  className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.action)}`}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt!).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
