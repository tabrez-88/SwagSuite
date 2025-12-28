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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
  Activity,
  Package,
  Plus,
  Trash2,
  Factory,
  ShoppingCart,
  Eye,
  ThumbsUp,
  CreditCard,
  Truck,
  MapPin,
  CheckCircle
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
  currentStage: string;
  stagesCompleted: string[];
  stageData: Record<string, any>;
  customNotes?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  color?: string | null;
  size?: string | null;
  imprintLocation?: string | null;
  imprintMethod?: string | null;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  basePrice?: string | null;
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
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    productId: "",
    quantity: "1",
    unitPrice: "0",
    color: "",
    size: "",
    imprintLocation: "",
    imprintMethod: "",
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  // Fetch order items
  const { data: orderItems = [], isLoading: orderItemsLoading } = useQuery<OrderItem[]>({
    queryKey: [`/api/orders/${orderId}/items`],
    enabled: !!orderId,
  });

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
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

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Unknown Product";
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

  const updateStageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/production`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      toast({
        title: "Stage Updated",
        description: "Production stage has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update production stage.",
        variant: "destructive",
      });
    }
  });

  // Add order item mutation
  const addOrderItemMutation = useMutation({
    mutationFn: async (data: typeof newProductForm) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/items`, {
        productId: data.productId,
        quantity: parseInt(data.quantity),
        unitPrice: parseFloat(data.unitPrice),
        totalPrice: (parseInt(data.quantity) * parseFloat(data.unitPrice)).toFixed(2),
        color: data.color || null,
        size: data.size || null,
        imprintLocation: data.imprintLocation || null,
        imprintMethod: data.imprintMethod || null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Added",
        description: "Product has been added to the order successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] }); // Refresh order to get updated total
      setIsAddProductDialogOpen(false);
      setNewProductForm({
        productId: "",
        quantity: "1",
        unitPrice: "0",
        color: "",
        size: "",
        imprintLocation: "",
        imprintMethod: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to order.",
        variant: "destructive",
      });
    },
  });

  // Delete order item mutation
  const deleteOrderItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}/items/${itemId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Removed",
        description: "Product has been removed from the order.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] }); // Refresh order to get updated total
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove product from order.",
        variant: "destructive",
      });
    },
  });

  const handleProductChange = (productId: string) => {
    setNewProductForm(prev => ({ ...prev, productId }));
    const product = products.find(p => p.id === productId);
    if (product?.basePrice) {
      setNewProductForm(prev => ({ ...prev, unitPrice: product.basePrice || "0" }));
    }
  };

  const handleAddProduct = () => {
    if (!newProductForm.productId || !newProductForm.quantity) {
      toast({
        title: "Missing Information",
        description: "Please select a product and enter quantity.",
        variant: "destructive",
      });
      return;
    }
    addOrderItemMutation.mutate(newProductForm);
  };

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
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
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

            <TabsContent value="products" className="space-y-6">
              {/* Products Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Products ({orderItems.length})
                </h3>
                <Button onClick={() => setIsAddProductDialogOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>

              {/* Products Table */}
              {orderItemsLoading ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-100 rounded h-16"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : orderItems.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No products in this order yet</p>
                    <Button onClick={() => setIsAddProductDialogOpen(true)} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Product
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {orderItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-medium text-sm">{getProductName(item.productId)}</p>
                                  {item.color && (
                                    <p className="text-xs text-gray-500">Color: {item.color}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm">{item.quantity}</td>
                              <td className="px-4 py-4 text-sm">${Number(item.unitPrice).toFixed(2)}</td>
                              <td className="px-4 py-4 text-sm font-semibold">${Number(item.totalPrice).toFixed(2)}</td>
                              <td className="px-4 py-4 text-xs text-gray-500">
                                <div className="space-y-1">
                                  {item.size && <div>Size: {item.size}</div>}
                                  {item.imprintLocation && <div>Location: {item.imprintLocation}</div>}
                                  {item.imprintMethod && <div>Method: {item.imprintMethod}</div>}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to remove this product?")) {
                                      deleteOrderItemMutation.mutate(item.id);
                                    }
                                  }}
                                  disabled={deleteOrderItemMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total:</td>
                            <td className="px-4 py-3 font-bold text-lg">
                              ${orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0).toFixed(2)}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="production" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="w-5 h-5 text-swag-primary" />
                    Production Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Overall Progress</span>
                        <span className="text-gray-500">
                          {Math.round(((order.stagesCompleted?.length || 0) / 9) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-swag-primary h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(((order.stagesCompleted?.length || 0) / 9) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stages list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { id: 'sales-booked', name: 'Order Booked', icon: ShoppingCart, color: 'blue' },
                        { id: 'po-placed', name: 'PO Placed', icon: FileText, color: 'purple' },
                        { id: 'confirmation-received', name: 'Confirmation', icon: MessageSquare, color: 'indigo' },
                        { id: 'proof-received', name: 'Proof Received', icon: Eye, color: 'yellow' },
                        { id: 'proof-approved', name: 'Proof Approved', icon: ThumbsUp, color: 'orange' },
                        { id: 'order-placed', name: 'Order Placed', icon: Package, color: 'teal' },
                        { id: 'invoice-paid', name: 'Invoice Paid', icon: CreditCard, color: 'green' },
                        { id: 'shipping-scheduled', name: 'Ship Scheduled', icon: Truck, color: 'cyan' },
                        { id: 'shipped', name: 'Shipped', icon: MapPin, color: 'emerald' },
                      ].map((stage, index) => {
                        const isCompleted = order.stagesCompleted?.includes(stage.id);
                        const isCurrent = order.currentStage === stage.id;
                        const StageIcon = stage.icon || Package;

                        return (
                          <div
                            key={stage.id}
                            className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-swag-primary/50 ${isCurrent ? 'border-swag-primary bg-swag-primary/5 shadow-md' :
                              isCompleted ? 'border-green-200 bg-green-50/30' : 'border-gray-100 bg-white'
                              }`}
                            onClick={() => {
                              if (!isCompleted) {
                                const statusMap: Record<string, string> = {
                                  'sales-booked': 'quote',
                                  'po-placed': 'pending_approval',
                                  'confirmation-received': 'pending_approval',
                                  'proof-received': 'approved',
                                  'proof-approved': 'approved',
                                  'order-placed': 'in_production',
                                  'invoice-paid': 'in_production',
                                  'shipping-scheduled': 'in_production',
                                  'shipped': 'shipped'
                                };
                                updateStageMutation.mutate({
                                  currentStage: stage.id,
                                  status: statusMap[stage.id] || order.status
                                });
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' :
                                isCurrent ? 'bg-swag-primary text-white' : 'bg-gray-100 text-gray-400'
                                }`}>
                                <StageIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">{stage.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {isCompleted ? (
                                    <Badge className="bg-green-500 text-[10px] h-4">Completed</Badge>
                                  ) : isCurrent ? (
                                    <Badge className="bg-swag-primary text-[10px] h-4">Current</Badge>
                                  ) : (
                                    <span className="text-[10px] text-gray-400">Step {index + 1}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isCurrent && (
                              <div className="mt-3 pt-3 border-t border-swag-primary/10">
                                <Button
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700 h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextStages = [
                                      'sales-booked', 'po-placed', 'confirmation-received',
                                      'proof-received', 'proof-approved', 'order-placed',
                                      'invoice-paid', 'shipping-scheduled', 'shipped'
                                    ];
                                    const nextIdx = nextStages.indexOf(stage.id) + 1;
                                    const nextStage = nextIdx < nextStages.length ? nextStages[nextIdx] : stage.id;

                                    const updatedCompleted = Array.from(new Set([...(order.stagesCompleted || []), stage.id]));
                                    updateStageMutation.mutate({
                                      stagesCompleted: updatedCompleted,
                                      currentStage: nextStage
                                    });
                                  }}
                                >
                                  Mark as Completed
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
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

      {/* Add Product Dialog */}
      <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product to Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product">Product *</Label>
                <Select
                  value={newProductForm.productId}
                  onValueChange={handleProductChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} {product.sku && `(${product.sku})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newProductForm.quantity}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProductForm.unitPrice}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                />
              </div>

              <div>
                <Label>Total Price</Label>
                <Input
                  type="text"
                  value={`$${(parseFloat(newProductForm.quantity) * parseFloat(newProductForm.unitPrice)).toFixed(2)}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="e.g., Navy Blue"
                  value={newProductForm.color}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  placeholder="e.g., Large"
                  value={newProductForm.size}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, size: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="imprintLocation">Imprint Location</Label>
                <Input
                  id="imprintLocation"
                  placeholder="e.g., Front Center"
                  value={newProductForm.imprintLocation}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, imprintLocation: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="imprintMethod">Imprint Method</Label>
                <Input
                  id="imprintMethod"
                  placeholder="e.g., Screen Print"
                  value={newProductForm.imprintMethod}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, imprintMethod: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddProductDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={addOrderItemMutation.isPending}
              >
                {addOrderItemMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}