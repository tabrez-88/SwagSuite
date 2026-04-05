import {
  Calendar,
  Building2,
  FileText,
  Mail,
  MessageSquare,
  Upload,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  UserPlus,
  Shield,
  Truck,
  DollarSign,
  Image,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useActivityTab } from "./hooks";
import type { ActivityTabProps } from "./types";

interface ActivityItem {
  id: string;
  type: "company" | "project";
  activityType: string;
  content: string;
  metadata: any;
  userId: string;
  orderId: string | null;
  orderNumber: string | null;
  projectName: string | null;
  isSystemGenerated: boolean;
  createdAt: string;
  userName: string | null;
}

function getActivityIcon(activity: ActivityItem) {
  const { activityType, metadata } = activity;

  // Company-level events
  if (activity.type === "company") {
    if (activityType === "created") return <Building2 className="h-4 w-4 text-green-600" />;
    if (activityType === "updated") return <Building2 className="h-4 w-4 text-blue-600" />;
    if (activityType === "deleted") return <Building2 className="h-4 w-4 text-red-600" />;
    return <Building2 className="h-4 w-4 text-gray-500" />;
  }

  // Project-level events
  switch (activityType) {
    case "status_change":
      return <ArrowRightLeft className="h-4 w-4 text-purple-600" />;
    case "system_action": {
      const action = metadata?.action || "";
      if (action.includes("overdue")) return <AlertTriangle className="h-4 w-4 text-red-600" />;
      if (action.includes("salesrep") || action.includes("csr")) return <UserPlus className="h-4 w-4 text-blue-600" />;
      if (action.includes("unlock")) return <Shield className="h-4 w-4 text-amber-600" />;
      if (action.includes("shipment") || action.includes("shipped")) return <Truck className="h-4 w-4 text-teal-600" />;
      if (action.includes("bill") || action.includes("invoice")) return <DollarSign className="h-4 w-4 text-green-600" />;
      if (action.includes("po_")) return <FileText className="h-4 w-4 text-indigo-600" />;
      if (action.includes("reminder")) return <Clock className="h-4 w-4 text-orange-600" />;
      if (action.includes("duplicate")) return <FileText className="h-4 w-4 text-gray-600" />;
      return <Shield className="h-4 w-4 text-gray-500" />;
    }
    case "comment":
    case "product_comment":
      return <MessageSquare className="h-4 w-4 text-blue-600" />;
    case "file_upload":
      return <Upload className="h-4 w-4 text-cyan-600" />;
    case "artwork_approved":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "artwork_rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Calendar className="h-4 w-4 text-gray-500" />;
  }
}

function getActivityBadge(activity: ActivityItem) {
  const { activityType, metadata } = activity;

  if (activity.type === "company") {
    return activityType;
  }

  switch (activityType) {
    case "status_change": {
      const section = metadata?.section || "";
      if (section) return `${section} status`;
      return "status change";
    }
    case "system_action": {
      const action = metadata?.action || "";
      return action.replace(/_/g, " ");
    }
    case "comment": return "note";
    case "product_comment": return "product note";
    case "file_upload": return "file upload";
    case "artwork_approved": return "artwork approved";
    case "artwork_rejected": return "revision requested";
    default: return activityType.replace(/_/g, " ");
  }
}

function getBadgeVariant(activity: ActivityItem): "default" | "secondary" | "destructive" | "outline" {
  const { activityType, metadata } = activity;

  if (activityType === "artwork_approved" || (activity.type === "company" && activityType === "created")) return "default";
  if (activityType === "artwork_rejected" || activityType === "deleted") return "destructive";
  if (activityType === "status_change") return "secondary";
  return "outline";
}

function getDotColor(activity: ActivityItem) {
  const { activityType, metadata } = activity;

  if (activity.type === "company") {
    if (activityType === "created") return "bg-green-500";
    if (activityType === "updated") return "bg-blue-500";
    if (activityType === "deleted") return "bg-red-500";
    return "bg-gray-400";
  }

  switch (activityType) {
    case "status_change": return "bg-purple-500";
    case "comment":
    case "product_comment": return "bg-blue-500";
    case "file_upload": return "bg-cyan-500";
    case "artwork_approved": return "bg-green-500";
    case "artwork_rejected": return "bg-red-500";
    case "system_action": {
      const action = metadata?.action || "";
      if (action.includes("overdue")) return "bg-red-500";
      if (action.includes("shipped")) return "bg-teal-500";
      if (action.includes("invoice") || action.includes("bill")) return "bg-green-500";
      return "bg-amber-500";
    }
    default: return "bg-gray-400";
  }
}

export default function ActivityTab({ companyId }: ActivityTabProps) {
  const { companyActivities } = useActivityTab(companyId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {companyActivities.length} activities
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {companyActivities.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {companyActivities.map((activity: ActivityItem) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 relative"
                >
                  {/* Timeline dot */}
                  <div className={`mt-1.5 h-[15px] w-[15px] rounded-full shrink-0 z-10 border-2 border-background ${getDotColor(activity)}`} />

                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {getActivityIcon(activity)}
                        <div className="min-w-0">
                          <p className="text-sm leading-relaxed">{activity.content}</p>

                          {/* Project reference */}
                          {activity.type === "project" && activity.orderNumber && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Project: <span className="font-medium text-swag-navy">{activity.projectName || `#${activity.orderNumber}`}</span>
                            </p>
                          )}

                          {/* User + timestamp */}
                          <div className="flex items-center gap-2 mt-1">
                            {activity.userName && (
                              <span className="text-xs text-muted-foreground font-medium">
                                {activity.userName}
                              </span>
                            )}
                            {activity.userName && activity.createdAt && (
                              <span className="text-xs text-muted-foreground">·</span>
                            )}
                            {activity.createdAt && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            )}
                          </div>

                          {/* Status change details */}
                          {activity.activityType === "status_change" && activity.metadata?.oldStatus && (
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-[10px] py-0 bg-red-50 text-red-700 border-red-200">
                                {activity.metadata.oldStatus.replace(/_/g, " ")}
                              </Badge>
                              <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                              <Badge variant="outline" className="text-[10px] py-0 bg-green-50 text-green-700 border-green-200">
                                {activity.metadata.newStatus.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant={getBadgeVariant(activity)}
                        className="text-[10px] capitalize shrink-0 whitespace-nowrap"
                      >
                        {getActivityBadge(activity)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No recent activity
            </h3>
            <p className="text-sm text-muted-foreground">
              Activity will appear here as changes are made to this company and its projects.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
