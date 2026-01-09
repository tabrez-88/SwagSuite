import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  DollarSign,
  Package,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  Truck,
  CheckCircle,
  MessageSquare,
  Send,
  AtSign,
  ExternalLink,
  Tag,
  AlertTriangle,
  Zap,
  Factory,
  Eye,
  ThumbsUp,
  CreditCard,
  ShoppingCart,
  TrendingUp
} from "lucide-react";
import type { Order } from "@shared/schema";
import { useState, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import OrderModal from "./OrderModal";
import { useToast } from "@/hooks/use-toast";

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  companyName: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProjectActivity {
  id: string;
  orderId: string;
  userId: string;
  activityType: string;
  content: string;
  metadata: any;
  mentionedUsers: string[];
  isSystemGenerated: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Communication {
  id: string;
  orderId: string;
  userId: string;
  communicationType: string;
  direction: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  metadata: any;
  sentAt: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const statusColorMap = {
  quote: "bg-blue-100 text-blue-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  in_production: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusDisplayMap = {
  quote: "Quote",
  pending_approval: "Pending Approval",
  approved: "Approved",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderDetailsModal({ open, onOpenChange, order, companyName }: OrderDetailsModalProps) {
  const [, setLocation] = useLocation();
  const [internalNote, setInternalNote] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [vendorEmailTo, setVendorEmailTo] = useState("");
  const [vendorEmailSubject, setVendorEmailSubject] = useState("");
  const [vendorEmailBody, setVendorEmailBody] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch latest order data to keep modal in sync
  const { data: latestOrder } = useQuery<Order>({
    queryKey: [`/api/orders/${order?.id}`],
    enabled: open && !!order?.id,
  });

  // Use latest order data if available, fallback to prop
  const currentOrder = latestOrder || order;

  // Fetch team members for @ mentions
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/users/team"],
    enabled: open && !!currentOrder,
  });

  // Fetch suppliers data
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    enabled: open && !!currentOrder,
  });

  // Get supplier information (memoized to update when order or suppliers change)
  const supplier = useMemo(() => {
    if (!currentOrder || !(currentOrder as any).supplierId) return null;
    return suppliers.find((s: any) => s.id === (currentOrder as any).supplierId);
  }, [currentOrder, suppliers]);

  // Fetch project activities (internal notes)
  const { data: activities = [] } = useQuery<ProjectActivity[]>({
    queryKey: [`/api/projects/${currentOrder?.id}/activities`],
    enabled: open && !!currentOrder,
  });

  // Fetch client communications
  const { data: clientCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/orders/${currentOrder?.id}/communications`, { type: "client_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${currentOrder?.id}/communications?type=client_email`);
      if (!response.ok) throw new Error("Failed to fetch client communications");
      return response.json();
    },
    enabled: open && !!currentOrder,
  });

  // Fetch vendor communications
  const { data: vendorCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/orders/${currentOrder?.id}/communications`, { type: "vendor_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${currentOrder?.id}/communications?type=vendor_email`);
      if (!response.ok) throw new Error("Failed to fetch vendor communications");
      return response.json();
    },
    enabled: open && !!currentOrder,
  });

  // Mutation for creating internal notes
  const createActivityMutation = useMutation({
    mutationFn: async (data: { activityType: string; content: string; mentionedUsers?: string[] }) => {
      const response = await fetch(`/api/projects/${currentOrder?.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentOrder?.id}/activities`] });
      toast({
        title: "Note sent",
        description: "Internal note has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send internal note.",
        variant: "destructive",
      });
    },
  });

  // Mutation for sending client emails
  const sendClientEmailMutation = useMutation({
    mutationFn: async (data: {
      recipientEmail: string;
      subject: string;
      body: string;
    }) => {
      const response = await fetch(`/api/orders/${currentOrder?.id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationType: "client_email",
          direction: "sent",
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          body: data.body,
        }),
      });
      if (!response.ok) throw new Error("Failed to send email");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/orders/${currentOrder?.id}/communications`, { type: "client_email" }],
      });
      toast({
        title: "Email sent",
        description: "Client email has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send client email.",
        variant: "destructive",
      });
    },
  });

  // Mutation for sending vendor emails
  const sendVendorEmailMutation = useMutation({
    mutationFn: async (data: {
      recipientEmail: string;
      subject: string;
      body: string;
    }) => {
      const response = await fetch(`/api/orders/${currentOrder?.id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationType: "vendor_email",
          direction: "sent",
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          body: data.body,
        }),
      });
      if (!response.ok) throw new Error("Failed to send email");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/orders/${currentOrder?.id}/communications`, { type: "vendor_email" }],
      });
      toast({
        title: "Email sent",
        description: "Vendor email has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send vendor email.",
        variant: "destructive",
      });
    },
  });

  // Mutation to update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${variables.orderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.orderId}/activities`] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-orders'] });
      toast({ title: "Order status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update order status", variant: "destructive" });
    },
  });

  // Mock team members for @ mentions (fallback)
  const defaultTeamMembers: TeamMember[] = [
    { id: "user1", firstName: "Sarah", lastName: "Johnson", email: "sarah@swag.com" },
    { id: "user2", firstName: "Mike", lastName: "Chen", email: "mike@swag.com" },
    { id: "user3", firstName: "Alex", lastName: "Rodriguez", email: "alex@swag.com" },
    { id: "user4", firstName: "Emily", lastName: "Davis", email: "emily@swag.com" },
  ];

  if (!currentOrder) return null;

  const statusClass = statusColorMap[currentOrder.status as keyof typeof statusColorMap] || "bg-gray-100 text-gray-800";
  const statusLabel = statusDisplayMap[currentOrder.status as keyof typeof statusDisplayMap] || currentOrder.status;

  // Check if this is a rush order based on in hands date
  const isRushOrder = currentOrder.inHandsDate ?
    new Date(currentOrder.inHandsDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 : false;

  const handleViewProject = () => {
    setLocation(`/project/${currentOrder.id}`);
    onOpenChange(false);
  };

  const handleMentionInput = (value: string) => {
    setInternalNote(value);
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1 && atIndex === value.length - 1) {
      setShowMentionSuggestions(true);
      setMentionQuery("");
    } else if (atIndex !== -1) {
      const query = value.slice(atIndex + 1);
      if (query.includes(' ')) {
        setShowMentionSuggestions(false);
      } else {
        setMentionQuery(query);
        setShowMentionSuggestions(true);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleMentionSelect = (member: TeamMember) => {
    const atIndex = internalNote.lastIndexOf('@');
    const beforeMention = internalNote.slice(0, atIndex);
    const afterMention = internalNote.slice(atIndex + mentionQuery.length + 1);
    setInternalNote(`${beforeMention}@${member.firstName} ${member.lastName}${afterMention}`);
    setShowMentionSuggestions(false);
    textareaRef.current?.focus();
  };

  const filteredTeamMembers = (teamMembers.length > 0 ? teamMembers : defaultTeamMembers).filter((member: TeamMember) =>
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleSendInternalNote = () => {
    if (!internalNote.trim()) return;

    // Extract mentioned user IDs from the note
    const mentionedUserIds: string[] = [];
    (teamMembers.length > 0 ? teamMembers : defaultTeamMembers).forEach((member) => {
      const fullName = `${member.firstName} ${member.lastName}`;
      if (internalNote.includes(`@${fullName}`)) {
        mentionedUserIds.push(member.id);
      }
    });

    createActivityMutation.mutate({
      activityType: "comment",
      content: internalNote,
      mentionedUsers: mentionedUserIds,
    });
    setInternalNote("");
  };

  const handleSendEmail = () => {
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all email fields.",
        variant: "destructive",
      });
      return;
    }

    sendClientEmailMutation.mutate({
      recipientEmail: emailTo,
      subject: emailSubject,
      body: emailBody,
    });
    setEmailTo("");
    setEmailSubject("");
    setEmailBody("");
  };

  const handleSendVendorEmail = () => {
    if (!vendorEmailTo.trim() || !vendorEmailSubject.trim() || !vendorEmailBody.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all email fields.",
        variant: "destructive",
      });
      return;
    }

    sendVendorEmailMutation.mutate({
      recipientEmail: vendorEmailTo,
      subject: vendorEmailSubject,
      body: vendorEmailBody,
    });
    setVendorEmailTo("");
    setVendorEmailSubject("");
    setVendorEmailBody("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl p-4 max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center pt-6 gap-3">
              <FileText className="w-6 h-6" />
              Order #{currentOrder.orderNumber}
              <Badge className={statusClass}>
                {statusLabel}
              </Badge>
              {isRushOrder && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  RUSH ORDER
                </Badge>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="ml-auto"
              >
                Edit Order
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewProject}
              >
                <ExternalLink className="w-4 h-4" />
                View Full Project
              </Button>
            </DialogTitle>
            <DialogDescription>
              Complete order details, internal communications, and client contact
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full h-fit gap-2 grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="communication">Internal Notes</TabsTrigger>
              <TabsTrigger value="email">Client Communication</TabsTrigger>
              <TabsTrigger value="vendor">Vendor Communication</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company & Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <UserAvatar name={companyName} size="sm" />
                      <div>
                        <p className="font-semibold">{companyName}</p>
                        <p className="text-sm text-gray-600">Primary Client</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Primary Contact</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">contact@company.com</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">(555) 123-4567</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Order Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Order Type</p>
                        <Badge variant="outline" className="mt-1">
                          {currentOrder.orderType?.replace('_', ' ').toUpperCase() || 'QUOTE'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Priority</p>
                        <Badge variant="secondary" className="mt-1">
                          NORMAL
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      {/* Price Breakdown */}
                      <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">${Number(currentOrder.subtotal || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-medium">${Number(currentOrder.tax || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium">${Number(currentOrder.shipping || 0).toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold">Total:</span>
                          </div>
                          <span className="text-lg font-bold text-green-600">
                            ${Number(currentOrder.total || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Deposit (50%): </span>
                        <span className="text-sm font-semibold">
                          ${(Number(currentOrder.total || 0) * 0.5).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rush Order & Timeline Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Timeline & Priority
                      {isRushOrder && (
                        <Badge variant="destructive" className="flex items-center gap-1 ml-2">
                          <AlertTriangle className="w-3 h-3" />
                          RUSH
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentOrder.inHandsDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">In Hands Date: </span>
                        <span className={`text-sm font-medium ${isRushOrder ? 'text-red-600' : 'text-gray-900'}`}>
                          {new Date(currentOrder.inHandsDate).toLocaleDateString()}
                        </span>
                        {isRushOrder && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                            {Math.ceil((new Date(currentOrder.inHandsDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))} days
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">No in-hands date specified</span>
                      </div>
                    )}

                    {currentOrder.createdAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Order Created: </span>
                        <span className="text-sm">
                          {new Date(currentOrder.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {isRushOrder && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Rush Order Alert</span>
                        </div>
                        <p className="text-xs text-red-700">
                          This order has a tight deadline. Coordinate with vendors for expedited production.
                        </p>
                      </div>
                    )}

                    {currentOrder.eventDate && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Event Date: </span>
                        <span className="text-sm">
                          {new Date(currentOrder.eventDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Shipping Address:</p>
                        <p className="text-gray-600 whitespace-pre-line">
                          {(currentOrder as any).shippingAddress || "No shipping address provided"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Shipping Method</p>
                      <p className="text-sm">{(currentOrder as any).shippingMethod || "Not specified"}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Tracking Number</p>
                      <p className="text-sm font-mono">{(currentOrder as any).trackingNumber || "Not available"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes & Special Instructions */}
                {currentOrder.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Notes & Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{currentOrder.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Order Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Order Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="text-sm">
                        <p className="font-medium">Order Created</p>
                        <p className="text-gray-500">
                          {currentOrder.createdAt ? new Date(currentOrder.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {currentOrder.updatedAt && currentOrder.updatedAt !== currentOrder.createdAt && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="text-sm">
                          <p className="font-medium">Last Updated</p>
                          <p className="text-gray-500">
                            {new Date(currentOrder.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Status Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Order Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="order-status">Current Status</Label>
                      <Select
                        value={currentOrder.status || undefined}
                        onValueChange={(value) => updateStatusMutation.mutate({ orderId: currentOrder.id, newStatus: value })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger id="order-status" className="w-full">
                          <SelectValue>
                            <Badge className={statusColorMap[currentOrder.status as keyof typeof statusColorMap]}>
                              {statusDisplayMap[currentOrder.status as keyof typeof statusDisplayMap]}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quote">
                            <div className="flex items-center gap-2">
                              <Badge className={statusColorMap.quote}>Quote</Badge>
                              <span className="text-xs text-gray-500">Initial proposal</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="pending_approval">
                            <div className="flex items-center gap-2">
                              <Badge className={statusColorMap.pending_approval}>Pending Approval</Badge>
                              <span className="text-xs text-gray-500">Awaiting approval</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="approved">
                            <div className="flex items-center gap-2">
                              <Badge className={statusColorMap.approved}>Approved</Badge>
                              <span className="text-xs text-gray-500">Ready to start</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="in_production">
                            <div className="flex items-center gap-2">
                              <Badge className={statusColorMap.in_production}>In Production</Badge>
                              <span className="text-xs text-gray-500">Being manufactured</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="shipped">
                            <div className="flex items-center gap-2">
                              <Badge className={statusColorMap.shipped}>Shipped</Badge>
                              <span className="text-xs text-gray-500">In transit</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="delivered">
                            <div className="flex items-center gap-2">
                              <Badge className={statusColorMap.delivered}>Delivered</Badge>
                              <span className="text-xs text-gray-500">Completed</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <div className="flex items-center gap-2">
                              <Badge className={statusColorMap.cancelled}>Cancelled</Badge>
                              <span className="text-xs text-gray-500">Order cancelled</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Change the order status to track progress and notify team members
                      </p>
                    </div>
                    
                    {/* Status History */}
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Status Timeline</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-gray-600">Created as {statusDisplayMap[currentOrder.status as keyof typeof statusDisplayMap]}</span>
                          <span className="text-gray-400">• {new Date(currentOrder.createdAt!).toLocaleDateString()}</span>
                        </div>
                        {currentOrder.updatedAt && currentOrder.updatedAt !== currentOrder.createdAt && (
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span className="text-gray-600">Last updated</span>
                            <span className="text-gray-400">• {new Date(currentOrder.updatedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Production Stages Progress */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Factory className="w-5 h-5" />
                      Production Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current Stage Highlight */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <Factory className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-900">Current Stage</p>
                              <p className="text-xs text-blue-700">
                                {(order as any).currentStage?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Sales Booked'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {((order as any).stagesCompleted?.length || 1)} / 9 Complete
                          </Badge>
                        </div>
                      </div>

                      {/* Stages Timeline */}
                      <div className="space-y-2">
                        {[
                          { id: 'sales-booked', name: 'Sales Order Booked', icon: ShoppingCart },
                          { id: 'po-placed', name: 'Purchase Order Placed', icon: FileText },
                          { id: 'confirmation-received', name: 'Confirmation Received', icon: MessageSquare },
                          { id: 'proof-received', name: 'Proof Received', icon: Eye },
                          { id: 'proof-approved', name: 'Proof Approved', icon: ThumbsUp },
                          { id: 'order-placed', name: 'Order Placed', icon: Package },
                          { id: 'invoice-paid', name: 'Invoice Paid', icon: CreditCard },
                          { id: 'shipping-scheduled', name: 'Shipping Scheduled', icon: Calendar },
                          { id: 'shipped', name: 'Shipped', icon: Truck },
                        ].map((stage, index) => {
                          const Icon = stage.icon;
                          const isCompleted = ((order as any).stagesCompleted || ['sales-booked']).includes(stage.id);
                          const isCurrent = (order as any).currentStage === stage.id && !isCompleted;

                          return (
                            <div key={stage.id} className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isCompleted
                                ? 'bg-green-100 border-green-500'
                                : isCurrent
                                  ? 'bg-blue-100 border-blue-500'
                                  : 'bg-gray-100 border-gray-300'
                                }`}>
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`} />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-600'
                                  }`}>
                                  {stage.name}
                                </p>
                              </div>
                              {isCurrent && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                                  In Progress
                                </Badge>
                              )}
                              {isCompleted && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Next Actions */}
                      {(order as any).stageData?.nextActionDate && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-amber-900">Next Action</p>
                              <p className="text-xs text-amber-700 mt-1">
                                Due: {new Date((order as any).stageData.nextActionDate).toLocaleDateString()}
                              </p>
                              {(order as any).customNotes?.nextAction && (
                                <p className="text-xs text-amber-600 mt-1">
                                  {(order as any).customNotes.nextAction}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="communication" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Internal Team Notes
                    <Tag className="w-4 h-4 ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Add internal note... Use @ to mention team members"
                      value={internalNote}
                      onChange={(e) => handleMentionInput(e.target.value)}
                      className="min-h-[120px]"
                      data-testid="textarea-internal-note"
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
                            <div>
                              <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendInternalNote}
                      disabled={!internalNote.trim()}
                      className="flex-1"
                      data-testid="button-send-internal-note"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Internal Note
                    </Button>
                  </div>

                  {/* Recent Internal Notes */}
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Recent Internal Notes</h4>
                    <div className="space-y-2">
                      {activities.length === 0 ? (
                        <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                          No internal notes yet. Add a note above to start tracking this project.
                        </div>
                      ) : (
                        activities
                          .filter((activity: ProjectActivity) => activity.activityType === "comment")
                          .slice(0, 5)
                          .map((activity: ProjectActivity) => {
                            const timeAgo = new Date(activity.createdAt).toLocaleString();
                            const userName = activity.user
                              ? `${activity.user.firstName} ${activity.user.lastName}`
                              : "Unknown User";

                            return (
                              <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <UserAvatar name={userName} size="sm" />
                                  <span className="text-sm font-medium">{userName}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(activity.createdAt).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{activity.content}</p>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Client Communication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">To:</label>
                      <Input
                        placeholder="client@company.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        data-testid="input-email-to"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Subject:</label>
                      <Input
                        placeholder={`Re: Order #${currentOrder.orderNumber}`}
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        data-testid="input-email-subject"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Message:</label>
                    <Textarea
                      placeholder="Compose your message to the client..."
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="min-h-[150px] mt-1"
                      data-testid="textarea-email-body"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendEmail}
                      disabled={!emailTo || !emailSubject || !emailBody.trim()}
                      className="flex-1"
                      data-testid="button-send-email"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                    <Button variant="outline">
                      Save Draft
                    </Button>
                  </div>

                  {/* Email Templates */}
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Quick Templates</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailSubject(`Order Update - #${currentOrder.orderNumber}`);
                          setEmailBody(`Hi there,\n\nI wanted to provide you with an update on your order #${currentOrder.orderNumber}.\n\nBest regards,\nYour SwagSuite Team`);
                        }}
                      >
                        Order Update
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailSubject(`Artwork Approval Required - #${currentOrder.orderNumber}`);
                          setEmailBody(`Hi there,\n\nWe need your approval on the artwork for order #${currentOrder.orderNumber} before we can proceed to production.\n\nPlease review and let us know if you have any changes.\n\nBest regards,\nYour SwagSuite Team`);
                        }}
                      >
                        Artwork Approval
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailSubject(`Order Shipped - #${currentOrder.orderNumber}`);
                          setEmailBody(`Great news!\n\nYour order #${currentOrder.orderNumber} has been shipped and is on its way to you.\n\nTracking information will be provided separately.\n\nBest regards,\nYour SwagSuite Team`);
                        }}
                      >
                        Order Shipped
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailSubject(`Invoice - #${currentOrder.orderNumber}`);
                          setEmailBody(`Hi there,\n\nPlease find attached the invoice for order #${currentOrder.orderNumber}.\n\nPayment is due within 30 days.\n\nBest regards,\nYour SwagSuite Team`);
                        }}
                      >
                        Invoice
                      </Button>
                    </div>
                  </div>

                  {/* Recent Emails */}
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Recent Communications</h4>
                    <div className="space-y-2">
                      {clientCommunications.length === 0 ? (
                        <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                          No client emails yet. Send your first email above.
                        </div>
                      ) : (
                        clientCommunications.slice(0, 5).map((comm: Communication) => {
                          const isSent = comm.direction === "sent";
                          const bgColor = isSent ? "bg-blue-50 border-blue-500" : "bg-green-50 border-green-500";

                          return (
                            <div key={comm.id} className={`p-3 rounded-lg border-l-4 ${bgColor}`}>
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-medium">
                                  {isSent ? "Sent: " : "Received: "}
                                  {comm.subject}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comm.sentAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-2">{comm.body}</p>
                              {comm.recipientEmail && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {isSent ? "To: " : "From: "}
                                  {comm.recipientEmail}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendor" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vendor Communication */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Vendor Communication
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium">To:</label>
                        <Input
                          placeholder={supplier?.email || "vendor@supplier.com"}
                          value={vendorEmailTo || supplier?.email || ""}
                          onChange={(e) => setVendorEmailTo(e.target.value)}
                          data-testid="input-vendor-email-to"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Subject:</label>
                        <Input
                          placeholder={`Production Update - Order #${currentOrder.orderNumber}`}
                          value={vendorEmailSubject}
                          onChange={(e) => setVendorEmailSubject(e.target.value)}
                          data-testid="input-vendor-email-subject"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Message:</label>
                      <Textarea
                        placeholder="Compose your message to the vendor..."
                        value={vendorEmailBody}
                        onChange={(e) => setVendorEmailBody(e.target.value)}
                        className="min-h-[150px] mt-1"
                        data-testid="textarea-vendor-email-body"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSendVendorEmail}
                        disabled={!vendorEmailTo || !vendorEmailSubject || !vendorEmailBody.trim()}
                        className="flex-1"
                        data-testid="button-send-vendor-email"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send to Vendor
                      </Button>
                      <Button variant="outline">
                        Save Draft
                      </Button>
                    </div>

                    {/* Vendor Email Templates */}
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Vendor Templates</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVendorEmailSubject(`Production Start Request - Order #${currentOrder.orderNumber}`);
                            setVendorEmailBody(`Hello,\n\nWe are ready to begin production for order #${currentOrder.orderNumber}.\n\nOrder Details:\n- Quantity: [QUANTITY]\n- Product: [PRODUCT]\n- In-Hands Date: ${currentOrder.inHandsDate ? new Date(currentOrder.inHandsDate).toLocaleDateString() : '[DATE]'}\n\nPlease confirm production timeline and any requirements.\n\nBest regards,\nSwagSuite Team`);
                          }}
                        >
                          Production Start Request
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVendorEmailSubject(`Production Status Check - Order #${currentOrder.orderNumber}`);
                            setVendorEmailBody(`Hello,\n\nCould you please provide a status update on order #${currentOrder.orderNumber}?\n\nWe need to confirm the production timeline to meet our delivery commitments.\n\nThank you for your attention to this matter.\n\nBest regards,\nSwagSuite Team`);
                          }}
                        >
                          Status Check
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVendorEmailSubject(`Artwork Files - Order #${currentOrder.orderNumber}`);
                            setVendorEmailBody(`Hello,\n\nPlease find attached the final artwork files for order #${currentOrder.orderNumber}.\n\nArtwork has been approved by the client and is ready for production.\n\nPlease confirm receipt and estimated production start date.\n\nBest regards,\nSwagSuite Team`);
                          }}
                        >
                          Send Artwork
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVendorEmailSubject(`Rush Order Request - Order #${currentOrder.orderNumber}`);
                            setVendorEmailBody(`Hello,\n\nWe have a rush request for order #${currentOrder.orderNumber}.\n\nRequired in-hands date: ${currentOrder.inHandsDate ? new Date(currentOrder.inHandsDate).toLocaleDateString() : '[DATE]'}\n\nPlease let us know if this timeline is possible and any additional costs.\n\nThank you for your flexibility.\n\nBest regards,\nSwagSuite Team`);
                          }}
                        >
                          Rush Request
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vendor Information & Communication History */}
                <div className="space-y-6">
                  {/* Current Vendor Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Assigned Vendor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {supplier ? (
                        <>
                          <div className="flex items-center space-x-3">
                            <UserAvatar name={supplier.name} size="sm" />
                            <div>
                              <p className="font-semibold">{supplier.name}</p>
                              <p className="text-sm text-gray-600">{supplier.isPreferred ? 'Preferred Vendor' : 'Vendor'}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {supplier.contactPerson && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">Contact: {supplier.contactPerson}</span>
                              </div>
                            )}

                            {supplier.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{supplier.email}</span>
                              </div>
                            )}

                            {supplier.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{supplier.phone}</span>
                              </div>
                            )}

                            {supplier.website && (
                              <div className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                                <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                  {supplier.website}
                                </a>
                              </div>
                            )}

                            {supplier.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{supplier.address}</span>
                              </div>
                            )}

                            {supplier.paymentTerms && (
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">Terms: {supplier.paymentTerms}</span>
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Vendor Performance</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">On-Time Delivery</p>
                                <p className="font-medium text-green-600">94%</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Quality Rating</p>
                                <p className="font-medium text-green-600">4.8/5</p>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No vendor assigned to this order</p>
                          <p className="text-xs text-gray-400 mt-1">Assign a vendor in the order details</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Vendor Communications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recent Vendor Communications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {vendorCommunications.length === 0 ? (
                          <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                            No vendor communications yet. Send your first email above.
                          </div>
                        ) : (
                          vendorCommunications.slice(0, 5).map((comm: Communication) => {
                            const isSent = comm.direction === "sent";
                            const bgColor = isSent ? "bg-blue-50 border-blue-500" : "bg-green-50 border-green-500";

                            return (
                              <div key={comm.id} className={`p-3 rounded-lg border-l-4 ${bgColor}`}>
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-sm font-medium">
                                    {isSent ? "Sent: " : "Received: "}
                                    {comm.subject}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comm.sentAt).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 line-clamp-2">{comm.body}</p>
                                {comm.recipientEmail && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {isSent ? "To: " : "From: "}
                                    {comm.recipientEmail}
                                    {comm.recipientName && ` (${comm.recipientName})`}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog >
      <OrderModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        order={order}
      />
    </>
  );
}