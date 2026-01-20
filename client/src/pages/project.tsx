import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Activity,
  ArrowLeft,
  AtSign,
  Bell,
  Calendar,
  Clock,
  CreditCard,
  Eye,
  Factory,
  FileText,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  Send,
  Settings,
  ShoppingCart,
  ThumbsUp,
  Trash2,
  Truck,
  Upload,
  User
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { loadStages, STAGE_STATUS_MAP, type ProductionStage } from "@/lib/productionStages";

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
  csrUserId: string | null;
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
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [isReassignCsrDialogOpen, setIsReassignCsrDialogOpen] = useState(false);
  const [isUploadFileDialogOpen, setIsUploadFileDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [reassignCsrUserId, setReassignCsrUserId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
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
  
  // Load stages from shared library
  const [stages, setStages] = useState<ProductionStage[]>(loadStages);
  
  // Listen for stage updates from production report
  useEffect(() => {
    const handleStagesUpdate = (event: CustomEvent) => {
      setStages(event.detail);
    };
    window.addEventListener('stagesUpdated', handleStagesUpdate as EventListener);
    return () => {
      window.removeEventListener('stagesUpdated', handleStagesUpdate as EventListener);
    };
  }, []);
  
  const statusList: Record<string, string> = {
    'quote' : 'Quote',
    'pending_approval' : 'Pending Approval',
    'approved' : 'Approved',
    'in_production' : 'In Production',
    'shipped' : 'Shipped',
    'delivered' : 'Delivered',
    'cancelled' : 'Cancelled',
  };
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
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] }); // Update production report list
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] }); // Update dashboard
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

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { status });
      return response.json();
    },
    onSuccess: (data, status) => {
      toast({
        title: "Status Updated",
        description: `Order status changed to ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/activities`] });
      setIsUpdateStatusDialogOpen(false);
      setNewStatus("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  // Reassign order mutation
  const reassignOrderMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { assignedUserId: userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Project Reassigned",
        description: "Project has been reassigned successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/activities`] });
      setIsReassignDialogOpen(false);
      setAssignedUserId("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign project.",
        variant: "destructive",
      });
    },
  });

  // Reassign CSR mutation
  const reassignCsrMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { csrUserId: userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "CSR Reassigned",
        description: "CSR has been reassigned successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/activities`] });
      setIsReassignCsrDialogOpen(false);
      setReassignCsrUserId("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign CSR.",
        variant: "destructive",
      });
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/projects/${orderId}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "File Uploaded",
        description: `${data.metadata?.fileName || 'File'} has been uploaded successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/activities`] });
      setIsUploadFileDialogOpen(false);
      setUploadFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file.",
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
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
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
            onClick={() => window.history.back()}
            data-testid="button-back-orders"
            className="w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
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
        <Badge variant="outline" className="text-lg">
          {statusList[order.status] || order.status}
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
                <p className="text-sm text-gray-500 mb-2">Order Value</p>
                {/* Price Breakdown */}
                <div className="space-y-1 bg-gray-50 p-3 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${Number(order.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">${Number(order.tax || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">${Number(order.shipping || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-300 my-1"></div>
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total:</span>
                    <span className="text-green-600">${Number(order.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <div className="flex items-center space-x-2 mt-1">
                  <UserAvatar name={getCompanyName(order.companyId)} size="sm" />
                  <span className="text-sm">{getCompanyName(order.companyId)}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Sales Rep</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setAssignedUserId(order?.assignedUserId || "");
                      setIsReassignDialogOpen(true);
                    }}
                  >
                    <User className="w-3 h-3 mr-1" />
                    {order.assignedUserId ? 'Reassign' : 'Assign'}
                  </Button>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  {order.assignedUserId ? (
                    <>
                      <UserAvatar name={teamMembers.find(m => m.id === order.assignedUserId)?.firstName || 'Team Member'} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {teamMembers.find(m => m.id === order.assignedUserId)?.firstName || 'Team Member'} {teamMembers.find(m => m.id === order.assignedUserId)?.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {teamMembers.find(m => m.id === order.assignedUserId)?.email || ''}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-400">No one assigned</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">CSR (Customer Service Rep)</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setReassignCsrUserId(order?.csrUserId || "");
                      setIsReassignCsrDialogOpen(true);
                    }}
                  >
                    <User className="w-3 h-3 mr-1" />
                    {order.csrUserId ? 'Reassign' : 'Assign'}
                  </Button>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  {order.csrUserId ? (
                    <>
                      <UserAvatar name={teamMembers.find(m => m.id === order.csrUserId)?.firstName || 'Team Member'} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {teamMembers.find(m => m.id === order.csrUserId)?.firstName || 'Team Member'} {teamMembers.find(m => m.id === order.csrUserId)?.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {teamMembers.find(m => m.id === order.csrUserId)?.email || ''}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-400">No one assigned</span>
                    </>
                  )}
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
              {order.eventDate && (
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(order.eventDate), 'MMM dd, yyyy')}
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
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setNewStatus(order?.status || "");
                  setIsUpdateStatusDialogOpen(true);
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Update Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsUploadFileDialogOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
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
                      <h4 className="font-semibold text-gray-900 mb-2">No activity yet</h4>
                      <p className="text-gray-500 mb-4">Start collaborating by adding a comment, updating status, or uploading files.</p>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="outline" onClick={() => textareaRef.current?.focus()}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Add Comment
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsUploadFileDialogOpen(true)}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload File
                        </Button>
                      </div>
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

                                {/* File download link for file uploads */}
                                {activity.activityType === "file_upload" && activity.metadata?.fileName && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{activity.metadata.fileName}</p>
                                          <p className="text-xs text-gray-500">
                                            {activity.metadata.fileSize ? `${(activity.metadata.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'}
                                          </p>
                                        </div>
                                      </div>
                                      <a
                                        href={`/api/projects/${orderId}/files/${activity.id}`}
                                        download={activity.metadata.fileName}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                      >
                                        <Upload className="w-3 h-3" />
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                )}

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
                            <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-600">Subtotal:</td>
                            <td className="px-4 py-2 font-semibold">
                              ${orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0).toFixed(2)}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-600">Tax:</td>
                            <td className="px-4 py-2 font-semibold">
                              ${Number(order.tax || 0).toFixed(2)}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-600">Shipping:</td>
                            <td className="px-4 py-2 font-semibold">
                              ${Number(order.shipping || 0).toFixed(2)}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                          <tr className="border-t-2 border-gray-300">
                            <td colSpan={3} className="px-4 py-3 text-right font-bold">Grand Total:</td>
                            <td className="px-4 py-3 font-bold text-lg text-green-600">
                              ${Number(order.total).toFixed(2)}
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
                      {stages.map((stage, index) => {
                        const isCompleted = order.stagesCompleted?.includes(stage.id);
                        const isCurrent = order.currentStage === stage.id;
                        
                        // Map icon name to component
                        const iconMap: Record<string, any> = {
                          ShoppingCart, FileText, MessageSquare, Eye, ThumbsUp, 
                          Package, CreditCard, Truck, MapPin
                        };
                        const StageIcon = iconMap[stage.icon] || Package;

                        return (
                          <div
                            key={stage.id}
                            className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-swag-primary/50 ${isCompleted ? 'border-green-200 bg-green-50/30' : 'border-gray-100 bg-white'
                              }`}
                            onClick={() => {
                              if (!isCompleted) {
                                updateStageMutation.mutate({
                                  currentStage: stage.id,
                                  status: STAGE_STATUS_MAP[stage.id] || order.status
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

                            {isCurrent && !isCompleted && (
                              <div className="mt-3 pt-3 border-t border-swag-primary/10">
                                <Button
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700 h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextIdx = index + 1;
                                    const nextStage = nextIdx < stages.length ? stages[nextIdx].id : stage.id;

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
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Project Files
                    </CardTitle>
                    <Button onClick={() => setIsUploadFileDialogOpen(true)} size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const fileActivities = activities.filter(
                      (activity: ProjectActivity) => activity.activityType === "file_upload"
                    );

                    if (fileActivities.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">No files uploaded yet</p>
                          <Button onClick={() => setIsUploadFileDialogOpen(true)} variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload First File
                          </Button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {fileActivities.map((activity: ProjectActivity) => (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {activity.metadata?.fileName || 'Unknown file'}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                  <span>
                                    {activity.metadata?.fileSize 
                                      ? `${(activity.metadata.fileSize / 1024).toFixed(2)} KB`
                                      : 'Unknown size'}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {format(new Date(activity.createdAt), 'MMM dd, yyyy')}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <UserAvatar 
                                      name={`${activity.user.firstName} ${activity.user.lastName}`}
                                      size="sm"
                                    />
                                    {activity.user.firstName} {activity.user.lastName}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <a
                              href={`/api/projects/${orderId}/files/${activity.id}`}
                              download={activity.metadata?.fileName}
                              className="ml-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
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

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Select New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in_production">In Production</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateOrderStatusMutation.mutate(newStatus)}
                disabled={!newStatus || updateOrderStatusMutation.isPending}
              >
                {updateOrderStatusMutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign/Reassign Project Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {order?.assignedUserId ? 'Reassign Project' : 'Assign Project'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignUser">Assign To Team Member</Label>
              <Select value={assignedUserId || "unassigned"} onValueChange={setAssignedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Unassign (No one)</span>
                    </div>
                  </SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                        <div>
                          <div className="font-medium">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                {order?.assignedUserId 
                  ? 'Change the team member responsible for this project'
                  : 'Select a team member to take ownership of this project'}
              </p>
            </div>
            
            {/* Current Assignment */}
            {order?.assignedUserId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Currently Assigned To:</p>
                <div className="flex items-center gap-2">
                  <UserAvatar 
                    name={teamMembers.find(m => m.id === order.assignedUserId)?.firstName || 'User'} 
                    size="sm" 
                  />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      {teamMembers.find(m => m.id === order.assignedUserId)?.firstName} {teamMembers.find(m => m.id === order.assignedUserId)?.lastName}
                    </p>
                    <p className="text-xs text-blue-700">
                      {teamMembers.find(m => m.id === order.assignedUserId)?.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (assignedUserId === "unassigned") {
                    // Unassign - send empty string to API
                    reassignOrderMutation.mutate("");
                  } else {
                    reassignOrderMutation.mutate(assignedUserId);
                  }
                }}
                disabled={(assignedUserId || "unassigned") === (order?.assignedUserId || "unassigned") || reassignOrderMutation.isPending}
              >
                {reassignOrderMutation.isPending 
                  ? "Updating..." 
                  : assignedUserId === "unassigned" 
                    ? "Unassign" 
                    : order?.assignedUserId 
                      ? "Reassign Project" 
                      : "Assign Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign CSR Dialog */}
      <Dialog open={isReassignCsrDialogOpen} onOpenChange={setIsReassignCsrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {order?.csrUserId ? 'Reassign CSR' : 'Assign CSR'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignCsr">Assign CSR (Customer Service Rep)</Label>
              <Select value={reassignCsrUserId || "unassigned"} onValueChange={setReassignCsrUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select CSR..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Unassign (No one)</span>
                    </div>
                  </SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                        <div>
                          <div className="font-medium">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                {order?.csrUserId 
                  ? 'Change the CSR responsible for production coordination'
                  : 'Select a CSR to handle production coordination'}
              </p>
            </div>
            
            {/* Current CSR Assignment */}
            {order?.csrUserId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Currently Assigned CSR:</p>
                <div className="flex items-center gap-2">
                  <UserAvatar 
                    name={teamMembers.find(m => m.id === order.csrUserId)?.firstName || 'User'} 
                    size="sm" 
                  />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      {teamMembers.find(m => m.id === order.csrUserId)?.firstName} {teamMembers.find(m => m.id === order.csrUserId)?.lastName}
                    </p>
                    <p className="text-xs text-blue-700">
                      {teamMembers.find(m => m.id === order.csrUserId)?.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReassignCsrDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (reassignCsrUserId === "unassigned") {
                    reassignCsrMutation.mutate("");
                  } else {
                    reassignCsrMutation.mutate(reassignCsrUserId);
                  }
                }}
                disabled={(reassignCsrUserId || "unassigned") === (order?.csrUserId || "unassigned") || reassignCsrMutation.isPending}
              >
                {reassignCsrMutation.isPending 
                  ? "Updating..." 
                  : reassignCsrUserId === "unassigned" 
                    ? "Unassign CSR" 
                    : order?.csrUserId 
                      ? "Reassign CSR" 
                      : "Assign CSR"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog open={isUploadFileDialogOpen} onOpenChange={setIsUploadFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {uploadFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsUploadFileDialogOpen(false);
                setUploadFile(null);
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => uploadFile && uploadFileMutation.mutate(uploadFile)}
                disabled={!uploadFile || uploadFileMutation.isPending}
              >
                {uploadFileMutation.isPending ? "Uploading..." : "Upload File"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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