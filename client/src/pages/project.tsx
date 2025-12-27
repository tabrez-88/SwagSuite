import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Send,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Upload,
  Settings,
  Bell,
  AtSign,
  Clock,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface ProjectActivityUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface ProjectActivity {
  id: string;
  orderId: string;
  userId: string;
  activityType: "status_change" | "comment" | "file_upload" | "mention" | "system_action";
  content: string;
  metadata?: any;
  mentionedUsers?: string[];
  isSystemGenerated: boolean;
  createdAt: string;
  user: ProjectActivityUser;
}

interface Order {
  id: string;
  orderNumber: string;
  companyId: string | null;
  contactId: string | null;
  assignedUserId: string | null;
  status: string;
  orderType: string;
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  margin: string;
  inHandsDate: string | null;
  eventDate: string | null;
  supplierInHandsDate: string | null;
  isFirm: boolean;
  notes: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

const ActivityTypeIcons = {
  status_change: Settings,
  comment: MessageSquare,
  file_upload: Upload,
  mention: AtSign,
  system_action: Activity,
};

const ActivityTypeColors = {
  status_change: "bg-blue-100 text-blue-700",
  comment: "bg-green-100 text-green-700",
  file_upload: "bg-purple-100 text-purple-700",
  mention: "bg-yellow-100 text-yellow-700",
  system_action: "bg-gray-100 text-gray-700",
};

export default function ProjectPage() {
  const { orderId } = useParams();
  const [, setLocation] = useLocation();
  const [newComment, setNewComment] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentions, setSelectedMentions] = useState<TeamMember[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  // Fetch project activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ProjectActivity[]>({
    queryKey: [`/api/projects/${orderId}/activities`],
    enabled: !!orderId,
  });

  // Fetch team members for @ mentions
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/users/team"],
  });

  // Fetch companies to get company name
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return "Unknown Company";
    const company = companies?.find((c: any) => c.id === companyId);
    return company?.name || "Unknown Company";
  };

  // Add new activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async (data: { content: string; mentionedUsers: string[] }) => {
      const response = await fetch(`/api/projects/${orderId}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activityType: "comment",
          content: data.content,
          mentionedUsers: data.mentionedUsers,
        }),
      });
      if (!response.ok) throw new Error('Failed to create activity');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/activities`] });
      setNewComment("");
      setSelectedMentions([]);
    },
  });

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;

    const mentionedUserIds = selectedMentions.map(member => member.id);
    addActivityMutation.mutate({
      content: newComment,
      mentionedUsers: mentionedUserIds,
    });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf("@");
    const lastSpaceIndex = value.lastIndexOf(" ");

    if (lastAtIndex > lastSpaceIndex && lastAtIndex !== -1) {
      const query = value.substring(lastAtIndex + 1);
      setMentionQuery(query);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleMentionSelect = (member: TeamMember) => {
    const lastAtIndex = newComment.lastIndexOf("@");
    const beforeMention = newComment.substring(0, lastAtIndex);
    const afterMention = `@${member.firstName} ${member.lastName} `;

    setNewComment(beforeMention + afterMention);
    setSelectedMentions([...selectedMentions, member]);
    setShowMentionSuggestions(false);
    textareaRef.current?.focus();
  };

  const filteredTeamMembers = (teamMembers as TeamMember[]).filter((member: TeamMember) =>
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const formatActivityContent = (activity: ProjectActivity) => {
    if (activity.activityType === "status_change") {
      const { oldStatus, newStatus } = activity.metadata || {};
      return `Changed status from "${oldStatus}" to "${newStatus}"`;
    }
    if (activity.activityType === "file_upload") {
      const { fileName } = activity.metadata || {};
      return `Uploaded file: ${fileName}`;
    }
    return activity.content;
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-swag-primary mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Project Not Found</h3>
          <p className="text-sm text-red-700 mb-4">
            The project you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => setLocation('/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/orders')}
            data-testid="button-back-orders"
            className="w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-swag-navy">
              Project: {order.orderNumber}
            </h1>
            <p className="text-muted-foreground">
              {getCompanyName(order.companyId)}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Order Value</p>
                <p className="font-semibold">${Number(order.total).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <div className="flex items-center space-x-2 mt-1">
                  <UserAvatar name={getCompanyName(order.companyId)} size="sm" />
                  <span className="text-sm">{getCompanyName(order.companyId)}</span>
                </div>
              </div>
              {order.inHandsDate && (
                <div>
                  <p className="text-sm text-gray-500">In-Hands Date</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(order.inHandsDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm">
                  {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Update Status
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                Reassign Project
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="timeline">Full Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Comment Input */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        placeholder="Add a comment or @mention team members..."
                        value={newComment}
                        onChange={handleTextareaChange}
                        className="min-h-[100px] resize-none"
                        data-testid="textarea-new-comment"
                      />

                      {/* Mention Suggestions */}
                      {showMentionSuggestions && filteredTeamMembers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                          {filteredTeamMembers.slice(0, 5).map((member: TeamMember) => (
                            <button
                              key={member.id}
                              onClick={() => handleMentionSelect(member)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                              data-testid={`mention-${member.id}`}
                            >
                              <UserAvatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                              <span className="text-sm">{member.firstName} {member.lastName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap gap-2">
                        {selectedMentions.map((mention, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            @{mention.firstName} {mention.lastName}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim() || addActivityMutation.isPending}
                        size="sm"
                        data-testid="button-post-comment"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {addActivityMutation.isPending ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Project Timeline
                </h3>

                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16"></div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No activity yet. Be the first to add a comment!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {(activities as ProjectActivity[]).map((activity: ProjectActivity) => {
                      const IconComponent = ActivityTypeIcons[activity.activityType];
                      const colorClass = ActivityTypeColors[activity.activityType];

                      return (
                        <Card key={activity.id} className="relative" data-testid={`activity-${activity.id}`}>
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass} flex-shrink-0`}>
                                <IconComponent className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2 mb-1">
                                    <UserAvatar
                                      name={`${activity.user.firstName} ${activity.user.lastName}`}
                                      size="sm"
                                    />
                                    <span className="font-medium text-sm">
                                      {activity.user.firstName} {activity.user.lastName}
                                    </span>
                                    {activity.isSystemGenerated && (
                                      <Badge variant="secondary" className="text-xs">System</Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(activity.createdAt), 'MMM dd, h:mm a')}
                                  </span>
                                </div>

                                <p className="text-sm text-gray-700 mt-1">
                                  {formatActivityContent(activity)}
                                </p>

                                {activity.mentionedUsers && activity.mentionedUsers.length > 0 && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <AtSign className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                      Mentioned {activity.mentionedUsers.length} team member(s)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="files">
              <Card>
                <CardContent className="p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No files uploaded yet</p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Full timeline view coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}