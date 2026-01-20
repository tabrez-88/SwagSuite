import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { FilesTab } from "@/components/FilesTab";
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
  TrendingUp,
  Upload,
  X,
  Edit,
  Trash2
} from "lucide-react";
import type { Order } from "@shared/schema";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useDropzone } from 'react-dropzone';
import { RichTextEditor } from './RichTextEditor';
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import OrderModal from "./OrderModal";
import ProductModal from "./ProductModal";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
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

function OrderDetailsModal({ open, onOpenChange, orderId }: OrderDetailsModalProps) {
  const [, setLocation] = useLocation();
  const [internalNote, setInternalNote] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [emailFromName, setEmailFromName] = useState("");
  const [emailFromCustom, setEmailFromCustom] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);
  const [vendorEmailTo, setVendorEmailTo] = useState("");
  const [vendorEmailFrom, setVendorEmailFrom] = useState("");
  const [vendorEmailFromName, setVendorEmailFromName] = useState("");
  const [vendorEmailFromCustom, setVendorEmailFromCustom] = useState(false);
  const [vendorEmailSubject, setVendorEmailSubject] = useState("");
  const [vendorEmailBody, setVendorEmailBody] = useState("");
  const [vendorEmailAttachments, setVendorEmailAttachments] = useState<File[]>([]);
  const [emailPreviewMode, setEmailPreviewMode] = useState<"compose" | "preview">("compose");
  const [vendorEmailPreviewMode, setVendorEmailPreviewMode] = useState<"compose" | "preview">("compose");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Edit dialog states
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [isEditBillingAddressOpen, setIsEditBillingAddressOpen] = useState(false);
  const [isEditShippingAddressOpen, setIsEditShippingAddressOpen] = useState(false);
  const [isEditShippingInfoOpen, setIsEditShippingInfoOpen] = useState(false);

  // Form data states
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [billingAddressForm, setBillingAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    contactName: "",
    email: ""
  });
  const [shippingAddressForm, setShippingAddressForm] = useState({
    address: "",
    contactName: "",
    email: ""
  });
  const [shippingInfoForm, setShippingInfoForm] = useState({
    supplierInHandsDate: "",
    inHandsDate: "",
    eventDate: "",
    isFirm: false,
    shippingMethod: ""
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch order data
  const { data: order, isLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: open && !!orderId,
  });

  // Fetch companies
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
    enabled: open && !!order,
  });

  // Fetch contacts for the order's company
  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: [`/api/contacts`, { companyId: order?.companyId }],
    queryFn: async () => {
      if (!order?.companyId) return [];
      const response = await fetch(`/api/contacts?companyId=${order.companyId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && !!order?.companyId,
  });

  // Get company name
  const companyName = order?.companyId
    ? companies.find((c: any) => c.id === order.companyId)?.name || "Unknown Company"
    : "Individual Client";

  // Get primary contact or first contact
  const primaryContact = contacts.find((c: any) => c.isPrimary) || contacts[0];

  // Get company data
  const companyData = order?.companyId
    ? companies.find((c: any) => c.id === order.companyId)
    : null;

  // Fetch team members for @ mentions
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/users/team"],
    enabled: open && !!order,
  });

  // Fetch order items with product and vendor info
  const { data: orderItems = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/items`],
    enabled: open && !!order,
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache (replaces cacheTime in newer versions)
  });

  // Fetch suppliers data (must be before orderVendors useMemo)
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    enabled: open && !!order,
    staleTime: 0, // Force fresh data
  });

  // Get unique vendors from order items
  const orderVendors = useMemo(() => {
    const vendorsMap = new Map();

    orderItems.forEach((item: any) => {
      if (item.supplierId && !vendorsMap.has(item.supplierId)) {
        // Try to get supplier info from the item first, then fallback to suppliers array
        const supplierFromArray = suppliers.find((s: any) => s.id === item.supplierId);

        vendorsMap.set(item.supplierId, {
          id: item.supplierId,
          name: item.supplierName || supplierFromArray?.name || "Unknown Vendor",
          email: item.supplierEmail || supplierFromArray?.email || "",
          phone: item.supplierPhone || supplierFromArray?.phone || "",
          contactPerson: item.supplierContactPerson || supplierFromArray?.contactPerson || "",
          products: [],
        });
      }
    });

    orderItems.forEach((item: any) => {
      if (item.supplierId && vendorsMap.has(item.supplierId)) {
        const vendor = vendorsMap.get(item.supplierId);
        vendor.products.push({
          id: item.id,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
        });
      }
    });

    return Array.from(vendorsMap.values());
  }, [orderItems, suppliers]);

  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  // Set first vendor as selected when vendors load
  useEffect(() => {
    if (orderVendors.length > 0 && !selectedVendor) {
      setSelectedVendor(orderVendors[0]);
      setVendorEmailTo(orderVendors[0].email || "");
    }
  }, [orderVendors, selectedVendor]);

  // Fetch all products to get current supplier info
  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    enabled: open && !!order && orderItems.length > 0,
    staleTime: 0,
  });

  // Fetch project activities (internal notes)
  const { data: activities = [] } = useQuery<ProjectActivity[]>({
    queryKey: [`/api/projects/${orderId}/activities`],
    enabled: open && !!order,
  });

  // Fetch client communications
  const { data: clientCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/orders/${orderId}/communications`, { type: "client_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/communications?type=client_email`);
      if (!response.ok) throw new Error("Failed to fetch client communications");
      return response.json();
    },
    enabled: open && !!order,
  });

  // Fetch vendor communications
  const { data: vendorCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/orders/${orderId}/communications`, { type: "vendor_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/communications?type=vendor_email`);
      if (!response.ok) throw new Error("Failed to fetch vendor communications");
      return response.json();
    },
    enabled: open && !!order,
  });

  // Fetch artwork approvals
  const { data: approvals = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/approvals`],
    enabled: open && !!order,
  });

  // Mutation for creating internal notes
  const createActivityMutation = useMutation({
    mutationFn: async (data: { activityType: string; content: string; mentionedUsers?: string[] }) => {
      const response = await fetch(`/api/projects/${order?.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${order?.id}/activities`] });
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
      fromEmail: string;
      fromName: string;
      recipientEmail: string;
      subject: string;
      body: string;
      attachments?: File[];
      attachmentIds?: string[];
    }) => {
      const response = await fetch(`/api/orders/${order?.id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationType: "client_email",
          direction: "sent",
          fromEmail: data.fromEmail,
          fromName: data.fromName,
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          body: data.body,
          attachmentIds: data.attachmentIds,
        }),
      });

      const result = await response.json();

      // Handle partial success (207) - email saved but not sent
      if (response.status === 207) {
        throw new Error(result.emailError || "Email saved to database but failed to send. Please check your email configuration.");
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to send email");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/orders/${order?.id}/communications`, { type: "client_email" }],
      });
      toast({
        title: "Email sent",
        description: "Client email has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Client email error:', error);
      toast({
        title: "Email Error",
        description: error.message || "Failed to send client email. Please check Settings → Email Config.",
        variant: "destructive",
      });
    },
  });

  // Mutation for sending vendor emails
  const sendVendorEmailMutation = useMutation({
    mutationFn: async (data: {
      fromEmail: string;
      fromName: string;
      recipientEmail: string;
      subject: string;
      body: string;
      attachments?: File[];
      attachmentIds?: string[];
    }) => {
      const response = await fetch(`/api/orders/${order?.id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationType: "vendor_email",
          direction: "sent",
          fromEmail: data.fromEmail,
          fromName: data.fromName,
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          body: data.body,
          attachmentIds: data.attachmentIds,
        }),
      });

      const result = await response.json();

      // Handle partial success (207) - email saved but not sent
      if (response.status === 207) {
        throw new Error(result.emailError || "Email saved to database but failed to send. Please check your email configuration.");
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to send email");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/orders/${order?.id}/communications`, { type: "vendor_email" }],
      });
      toast({
        title: "Email sent",
        description: "Vendor email has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Vendor email error:', error);
      toast({
        title: "Email Error",
        description: error.message || "Failed to send vendor email. Please check Settings → Email Config.",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete product
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete product');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      toast({
        title: "Product deleted",
        description: "Product has been removed successfully."
      });
    },
    onError: () => {
      setIsDeleteDialogOpen(false);
      toast({
        title: "Failed to delete product",
        description: "There was an error deleting the product. Please try again.",
        variant: "destructive"
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

  // Mutation to update order shipping info
  const updateShippingInfoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update shipping info');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setIsEditShippingInfoOpen(false);
      toast({ title: "Shipping information updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update shipping information", variant: "destructive" });
    },
  });

  // Mutation to update company billing address
  const updateBillingAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Sending billing address to server:', data);
      const response = await fetch(`/api/companies/${order?.companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingAddress: data }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update billing address');
      const result = await response.json();
      console.log('Server response for billing:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setIsEditBillingAddressOpen(false);
      toast({ title: "Billing address updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update billing address", variant: "destructive" });
    },
  });

  // Mutation to update order shipping address
  const updateShippingAddressMutation = useMutation({
    mutationFn: async (data: { shippingAddress: string }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update shipping address');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setIsEditShippingAddressOpen(false);
      toast({ title: "Shipping address updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update shipping address", variant: "destructive" });
    },
  });

  // Mutation to update order contact
  const updateOrderContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setIsEditContactOpen(false);
      toast({ title: "Contact updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update contact", variant: "destructive" });
    },
  });

  // Mock team members for @ mentions (fallback)
  const defaultTeamMembers: TeamMember[] = [
    { id: "user1", firstName: "Sarah", lastName: "Johnson", email: "sarah@swag.com" },
    { id: "user2", firstName: "Mike", lastName: "Chen", email: "mike@swag.com" },
    { id: "user3", firstName: "Alex", lastName: "Rodriguez", email: "alex@swag.com" },
    { id: "user4", firstName: "Emily", lastName: "Davis", email: "emily@swag.com" },
  ];

  if (!order) return null;

  const statusClass = statusColorMap[order.status as keyof typeof statusColorMap] || "bg-gray-100 text-gray-800";
  const statusLabel = statusDisplayMap[order.status as keyof typeof statusDisplayMap] || order.status;

  // Check if this is a rush order based on in hands date
  const isRushOrder = order.inHandsDate ?
    new Date(order.inHandsDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 : false;

  const handleViewProject = () => {
    setLocation(`/project/${order.id}`);
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

  const handleSendEmail = async () => {
    if (!emailFrom.trim() || !emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all email fields including sender.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload attachments first if any
      let attachmentIds: string[] = [];
      if (emailAttachments.length > 0) {
        const formData = new FormData();
        emailAttachments.forEach(file => formData.append('files', file));
        formData.append('category', 'email_attachment');

        const uploadResponse = await fetch(`/api/orders/${order.id}/attachments`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          attachmentIds = uploadData.attachments.map((att: any) => att.id);
        }
      }

      // Send email with attachment references
      sendClientEmailMutation.mutate({
        fromEmail: emailFrom,
        fromName: emailFromName || "SwagSuite",
        recipientEmail: emailTo,
        subject: emailSubject,
        body: emailBody,
        attachments: emailAttachments,
        attachmentIds,
      });

      setEmailFrom("");
      setEmailFromName("");
      setEmailTo("");
      setEmailSubject("");
      setEmailBody("");
      setEmailAttachments([]);
    } catch (error) {
      console.error('Error uploading attachments:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload attachments. Sending email without attachments.",
        variant: "destructive",
      });
    }
  };

  const handleSendVendorEmail = async () => {
    if (!vendorEmailFrom.trim() || !vendorEmailTo.trim() || !vendorEmailSubject.trim() || !vendorEmailBody.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all email fields including sender.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload attachments first if any
      let attachmentIds: string[] = [];
      if (vendorEmailAttachments.length > 0) {
        const formData = new FormData();
        vendorEmailAttachments.forEach(file => formData.append('files', file));
        formData.append('category', 'email_attachment');

        const uploadResponse = await fetch(`/api/orders/${order.id}/attachments`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          attachmentIds = uploadData.attachments.map((att: any) => att.id);
        }
      }

      // Send email with attachment references
      sendVendorEmailMutation.mutate({
        fromEmail: vendorEmailFrom,
        fromName: vendorEmailFromName || "SwagSuite",
        recipientEmail: vendorEmailTo,
        subject: vendorEmailSubject,
        body: vendorEmailBody,
        attachments: vendorEmailAttachments,
        attachmentIds,
      });

      setVendorEmailFrom("");
      setVendorEmailFromName("");
      setVendorEmailTo("");
      setVendorEmailSubject("");
      setVendorEmailBody("");
      setVendorEmailAttachments([]);
    } catch (error) {
      console.error('Error uploading attachments:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload attachments. Sending email without attachments.",
        variant: "destructive",
      });
    }
  };

  // Initialize form data when dialogs open
  const handleOpenEditShippingInfo = () => {
    setShippingInfoForm({
      supplierInHandsDate: (order as any).supplierInHandsDate
        ? new Date((order as any).supplierInHandsDate).toISOString().split('T')[0]
        : "",
      inHandsDate: order.inHandsDate
        ? new Date(order.inHandsDate).toISOString().split('T')[0]
        : "",
      eventDate: order.eventDate
        ? new Date(order.eventDate).toISOString().split('T')[0]
        : "",
      isFirm: (order as any).isFirm || false,
      shippingMethod: (order as any).shippingMethod || ""
    });
    setIsEditShippingInfoOpen(true);
  };

  const handleOpenEditBillingAddress = () => {
    const billing = companyData?.billingAddress || {};
    setBillingAddressForm({
      street: billing.street || "",
      city: billing.city || "",
      state: billing.state || "",
      zipCode: billing.zipCode || "",
      country: billing.country || "US",
      contactName: billing.contactName || "",
      email: billing.email || ""
    });
    setIsEditBillingAddressOpen(true);
  };

  const handleOpenEditShippingAddress = () => {
    const shippingAddr = (order as any).shippingAddress || "";
    // Try to parse if it's JSON
    try {
      const parsed = JSON.parse(shippingAddr);
      setShippingAddressForm({
        address: parsed.address || shippingAddr,
        contactName: parsed.contactName || "",
        email: parsed.email || ""
      });
    } catch {
      // Not JSON, just plain text address
      setShippingAddressForm({
        address: shippingAddr,
        contactName: "",
        email: ""
      });
    }
    setIsEditShippingAddressOpen(true);
  };

  const handleOpenEditContact = () => {
    setSelectedContactId(order.contactId || primaryContact?.id || "");
    setIsEditContactOpen(true);
  };

  const handleSaveShippingInfo = () => {
    const data: any = {};
    if (shippingInfoForm.supplierInHandsDate) data.supplierInHandsDate = shippingInfoForm.supplierInHandsDate;
    if (shippingInfoForm.inHandsDate) data.inHandsDate = shippingInfoForm.inHandsDate;
    if (shippingInfoForm.eventDate) data.eventDate = shippingInfoForm.eventDate;
    data.isFirm = shippingInfoForm.isFirm;
    updateShippingInfoMutation.mutate(data);
  };

  const handleSaveBillingAddress = () => {
    console.log('Saving billing address:', billingAddressForm);
    updateBillingAddressMutation.mutate(billingAddressForm);
  };

  const handleSaveShippingAddress = () => {
    console.log('Saving shipping address form:', shippingAddressForm);
    // Save as JSON if we have contact info, otherwise just the address
    const shippingData = (shippingAddressForm.contactName || shippingAddressForm.email)
      ? JSON.stringify(shippingAddressForm)
      : shippingAddressForm.address;

    console.log('Shipping data to save:', shippingData);
    updateShippingAddressMutation.mutate({ shippingAddress: shippingData });
  };

  const handleSaveContact = () => {
    if (selectedContactId) {
      updateOrderContactMutation.mutate(selectedContactId);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl p-4 max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center pt-6 gap-3">
              <FileText className="w-6 h-6" />
              Order #{order.orderNumber}
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
            <TabsList className="grid w-full h-fit gap-2 grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="products">Products ({orderItems.length})</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="communication">Internal Notes</TabsTrigger>
              <TabsTrigger value="email">Client Communication</TabsTrigger>
              <TabsTrigger value="vendor">Vendor Communication</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Details */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Order Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="order-status">Current Status</Label>
                      <Select
                        value={order.status || undefined}
                        onValueChange={(value) => updateStatusMutation.mutate({ orderId: order.id, newStatus: value })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger id="order-status" className="w-full">
                          <SelectValue>
                            <Badge className={statusColorMap[order.status as keyof typeof statusColorMap]}>
                              {statusDisplayMap[order.status as keyof typeof statusDisplayMap]}
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


                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Order Type</p>
                        <Badge variant="outline" className="mt-1">
                          {order.orderType?.replace('_', ' ').toUpperCase() || 'QUOTE'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Priority</p>
                        <Badge variant="secondary" className="mt-1">
                          NORMAL
                        </Badge>
                      </div>
                    </div>
                    {/* Status History */}
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Status Timeline</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-gray-600">Created as {statusDisplayMap[order.status as keyof typeof statusDisplayMap]}</span>
                          <span className="text-gray-400">• {new Date(order.createdAt!).toLocaleDateString()}</span>
                        </div>
                        {order.updatedAt && order.updatedAt !== order.createdAt && (
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span className="text-gray-600">Last updated</span>
                            <span className="text-gray-400">• {new Date(order.updatedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />

                    <div className="space-y-3">
                      {/* Price Breakdown */}
                      <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">${Number(order.subtotal || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-medium">${Number(order.tax || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium">${Number(order.shipping || 0).toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold">Total:</span>
                          </div>
                          <span className="text-lg font-bold text-green-600">
                            ${Number(order.total || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Deposit (50%): </span>
                        <span className="text-sm font-semibold">
                          ${(Number(order.total || 0) * 0.5).toLocaleString()}
                        </span>
                      </div>
                    </div>


                  </CardContent>
                </Card>

                {/* Company & Contact Information */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Account Information
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenEditContact}
                        className="ml-auto"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Contact
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Separator />
                      <h3 className="text-xl font-semibold">Account Details</h3>
                      <div className="flex items-center space-x-3">
                        <UserAvatar name={companyName} size="sm" />
                        <div>
                          <p className="font-semibold">{companyName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Contact Name:</p>
                        <span className="text-sm">
                          {primaryContact
                            ? `${primaryContact.firstName} ${primaryContact.lastName}${primaryContact.title ? ` - ${primaryContact.title}` : ''}`
                            : "No primary contact"}
                        </span>
                      </div>

                      {primaryContact?.email && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Email Contact:</p>
                          <span className="text-sm">{primaryContact.email}</span>
                        </div>
                      )}

                      {primaryContact?.phone && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Phone Contact:</p>
                          <span className="text-sm">{primaryContact.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Billing Address</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleOpenEditBillingAddress}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Billing Contact:</p>
                        <p className="text-sm">{(order as any).billingContact || "Not specified"}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Billing Customer Email:</p>
                        <p className="text-sm">{(order as any).billingCustomerEmail || "Not specified"}</p>
                      </div>

                      <div className="flex items-start gap-2 w-full">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="text-sm w-full">
                          {companyData?.billingAddress ? (
                            <>
                              {companyData.billingAddress.street && <p className="text-gray-600">{companyData.billingAddress.street}</p>}
                              {companyData.billingAddress.city && (
                                <p className="text-gray-600">
                                  {companyData.billingAddress.city}
                                  {companyData.billingAddress.state && `, ${companyData.billingAddress.state}`}
                                  {companyData.billingAddress.zipCode && ` ${companyData.billingAddress.zipCode}`}
                                </p>
                              )}
                              {companyData.billingAddress.country && <p className="text-gray-600">{companyData.billingAddress.country}</p>}
                              {companyData.billingAddress.contactName && (
                                <p className="text-gray-600 mt-1"><span className="font-medium">Contact:</span> {companyData.billingAddress.contactName}</p>
                              )}
                              {companyData.billingAddress.email && (
                                <p className="text-gray-600"><span className="font-medium">Email:</span> {companyData.billingAddress.email}</p>
                              )}
                            </>
                          ) : companyData?.address ? (
                            <>
                              <p className="text-gray-600">{companyData.address}</p>
                              {(companyData.city || companyData.state || companyData.zipCode) && (
                                <p className="text-gray-600">
                                  {companyData.city}
                                  {companyData.state && `, ${companyData.state}`}
                                  {companyData.zipCode && ` ${companyData.zipCode}`}
                                </p>
                              )}
                              {companyData.country && <p className="text-gray-600">{companyData.country}</p>}
                            </>
                          ) : (
                            <p className="text-gray-500 italic">No billing address on file</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Shipping Address</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleOpenEditShippingAddress}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Shipping Contact:</p>
                        <p className="text-sm">{(order as any).shippingContact || "Not specified"}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Shipping Customer Email:</p>
                        <p className="text-sm">{(order as any).shippingCustomerEmail || "Not specified"}</p>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="text-sm">
                          {(order as any).shippingAddress ? (
                            <>
                              <p className="font-medium">Order-Specific Shipping Address:</p>
                              {(() => {
                                try {
                                  const parsed = JSON.parse((order as any).shippingAddress);
                                  return (
                                    <>
                                      <p className="text-gray-600 whitespace-pre-line">{parsed.address}</p>
                                      {parsed.contactName && (
                                        <p className="text-gray-600 mt-1"><span className="font-medium">Contact:</span> {parsed.contactName}</p>
                                      )}
                                      {parsed.email && (
                                        <p className="text-gray-600"><span className="font-medium">Email:</span> {parsed.email}</p>
                                      )}
                                    </>
                                  );
                                } catch {
                                  return <p className="text-gray-600 whitespace-pre-line">{(order as any).shippingAddress}</p>;
                                }
                              })()}
                            </>
                          ) : companyData?.shippingAddresses && Array.isArray(companyData.shippingAddresses) && companyData.shippingAddresses.length > 0 ? (
                            <>
                              {companyData.shippingAddresses[0].street && <p className="text-gray-600">{companyData.shippingAddresses[0].street}</p>}
                              {companyData.shippingAddresses[0].city && (
                                <p className="text-gray-600">
                                  {companyData.shippingAddresses[0].city}
                                  {companyData.shippingAddresses[0].state && `, ${companyData.shippingAddresses[0].state}`}
                                  {companyData.shippingAddresses[0].zipCode && ` ${companyData.shippingAddresses[0].zipCode}`}
                                </p>
                              )}
                              {companyData.shippingAddresses[0].country && <p className="text-gray-600">{companyData.shippingAddresses[0].country}</p>}
                              {companyData.shippingAddresses.length > 1 && (
                                <p className="text-xs text-blue-600 mt-1">+{companyData.shippingAddresses.length - 1} more shipping address(es) on file</p>
                              )}
                            </>
                          ) : companyData?.address ? (
                            <>
                              <p className="text-gray-600">{companyData.address}</p>
                              {(companyData.city || companyData.state || companyData.zipCode) && (
                                <p className="text-gray-600">
                                  {companyData.city}
                                  {companyData.state && `, ${companyData.state}`}
                                  {companyData.zipCode && ` ${companyData.zipCode}`}
                                </p>
                              )}
                              {companyData.country && <p className="text-gray-600">{companyData.country}</p>}
                            </>
                          ) : (
                            <p className="text-gray-500 italic">No shipping address provided</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Shipping & Timeline Information
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenEditShippingInfo}
                        className="ml-auto"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Shipping Info
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Date Information */}
                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700">Important Dates</h4>

                      {(order as any).supplierInHandsDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Supplier In-Hands Date:</span>
                          <span className="text-sm font-semibold text-blue-700">
                            {format(new Date((order as any).supplierInHandsDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}

                      {order.inHandsDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Customer Requested In-Hands Date:</span>
                          <span className={`text-sm font-semibold ${isRushOrder ? 'text-red-600' : 'text-gray-900'}`}>
                            {format(new Date(order.inHandsDate), 'MMM dd, yyyy')}
                          </span>
                          {(order as any).isFirm && (
                            <Badge variant="destructive" className="text-xs">
                              FIRM
                            </Badge>
                          )}
                          {isRushOrder && (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                              {Math.ceil((new Date(order.inHandsDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))} days left
                            </Badge>
                          )}
                        </div>
                      )}

                      {order.eventDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Event Date:</span>
                          <span className="text-sm font-semibold text-purple-700">
                            {format(new Date(order.eventDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}

                      {order.createdAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Order Created:</span>
                          <span className="text-sm text-gray-600">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

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

                  </CardContent>
                </Card>

                {/* Notes & Special Instructions */}
                {order.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Notes & Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p>
                    </CardContent>
                  </Card>
                )}

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

            <TabsContent value="products" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Products ({orderItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orderItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No products in this order yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderItems.map((item: any) => {
                        // Get current product to find supplier
                        const currentProduct = allProducts.find((p: any) => p.id === item.productId);
                        const currentSupplierId = currentProduct?.supplierId || item.supplierId;

                        // Fallback: lookup supplier from suppliers array
                        const itemSupplier = item.supplierName
                          ? { name: item.supplierName }
                          : currentSupplierId
                            ? suppliers.find((s: any) => s.id === currentSupplierId)
                            : null;

                        // Find approval for this item
                        const itemApproval = approvals.find((a: any) => a.orderItemId === item.id);

                        return (
                          <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Package className="w-5 h-5 text-blue-600" />
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg">{item.productName}</h4>
                                    {item.productSku && (
                                      <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={async () => {
                                        const prodId = item.productId;

                                        if (!prodId) {
                                          toast({
                                            title: "Error",
                                            description: "Product ID not found in order item",
                                            variant: "destructive"
                                          });
                                          return;
                                        }

                                        try {
                                          const response = await fetch(`/api/products/${prodId}`, {
                                            credentials: 'include'
                                          });

                                          if (!response.ok) {
                                            toast({
                                              title: "Error",
                                              description: `Failed to load product (${response.status})`,
                                              variant: "destructive"
                                            });
                                            return;
                                          }

                                          const product = await response.json();
                                          setEditingProduct(product);
                                          setIsProductModalOpen(true);
                                        } catch (error) {
                                          console.error('Error fetching product:', error);
                                          toast({
                                            title: "Error",
                                            description: "Failed to load product",
                                            variant: "destructive"
                                          });
                                        }
                                      }}
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      title="Edit product"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const prodId = item.productId;

                                        if (!prodId) {
                                          toast({
                                            title: "Error",
                                            description: "Product ID not found in order item",
                                            variant: "destructive"
                                          });
                                          return;
                                        }

                                        setDeletingProduct({
                                          ...item,
                                          productId: prodId
                                        });
                                        setIsDeleteDialogOpen(true);
                                      }}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Delete product"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase">Quantity</p>
                                    <p className="font-semibold">{item.quantity}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase">Unit Price</p>
                                    <p className="font-semibold">${Number(item.unitPrice).toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase">Total</p>
                                    <p className="font-semibold text-green-600">${(item.quantity * Number(item.unitPrice)).toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase">Vendor</p>
                                    {itemSupplier ? (
                                      <p className="font-semibold text-blue-600">{itemSupplier.name}</p>
                                    ) : currentSupplierId ? (
                                      <p className="text-gray-500 text-xs">ID: {currentSupplierId.substring(0, 8)}...</p>
                                    ) : (
                                      <p className="text-gray-400 text-xs">No vendor</p>
                                    )}
                                  </div>
                                </div>

                                {(item.color || item.size) && (
                                  <div className="flex gap-4 mt-3">
                                    {item.color && (
                                      <div>
                                        <p className="text-xs text-gray-500 uppercase">Color</p>
                                        <Badge variant="outline" className="mt-1">{item.color}</Badge>
                                      </div>
                                    )}
                                    {item.size && (
                                      <div>
                                        <p className="text-xs text-gray-500 uppercase">Size</p>
                                        <Badge variant="outline" className="mt-1">{item.size}</Badge>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {(item.imprintLocation || item.imprintMethod) && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs text-gray-500 uppercase mb-2">Decoration Details</p>
                                    <div className="flex gap-4">
                                      {item.imprintLocation && (
                                        <div>
                                          <span className="text-xs text-gray-600">Location:</span>
                                          <span className="ml-1 text-sm font-medium">{item.imprintLocation}</span>
                                        </div>
                                      )}
                                      {item.imprintMethod && (
                                        <div>
                                          <span className="text-xs text-gray-600">Method:</span>
                                          <span className="ml-1 text-sm font-medium">{item.imprintMethod}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {item.notes && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                                    <p className="text-sm text-gray-700">{item.notes}</p>
                                  </div>
                                )}

                                {/* Artwork Approval Status */}
                                {itemApproval && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-gray-500 uppercase mb-1">Artwork Approval</p>
                                      {itemApproval.status === 'approved' && (
                                        <Badge className="bg-green-100 text-green-800">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Approved
                                        </Badge>
                                      )}
                                      {itemApproval.status === 'declined' && (
                                        <Badge variant="destructive">
                                          <X className="w-3 h-3 mr-1" />
                                          Revision Requested
                                        </Badge>
                                      )}
                                      {itemApproval.status === 'pending' && (
                                        <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                          <Clock className="w-3 h-3 mr-1" />
                                          Pending
                                        </Badge>
                                      )}
                                    </div>
                                    {itemApproval.declineReason && (
                                      <p className="text-sm text-gray-600 mt-2 italic">"{itemApproval.declineReason}"</p>
                                    )}
                                    {itemApproval.approvedAt && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Approved {new Date(itemApproval.approvedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                    {itemApproval.declinedAt && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Revision requested {new Date(itemApproval.declinedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Summary */}
                      <div className="border-t pt-4 mt-6">
                        <div className="flex justify-between items-center">
                          <div className="text-gray-600">
                            <span className="font-medium">Total Items:</span> {orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0)}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Subtotal</p>
                            <p className="text-2xl font-bold text-green-600">
                              ${orderItems.reduce((sum: number, item: any) => sum + (item.quantity * Number(item.unitPrice)), 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="mt-6">
              <FilesTab
                orderId={orderId!}
                products={orderItems.map((item: any) => ({
                  id: item.id,
                  productName: item.productName,
                  color: item.color,
                  size: item.size,
                  quantity: item.quantity,
                }))}
              />
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
                      <label className="text-sm font-medium">From:</label>
                      {emailFromCustom ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="your-email@company.com"
                            value={emailFrom}
                            onChange={(e) => setEmailFrom(e.target.value)}
                            type="email"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEmailFromCustom(false);
                              setEmailFrom("");
                            }}
                            className="w-full text-xs"
                          >
                            Select from team instead
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Select value={emailFrom} onValueChange={setEmailFrom}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sender..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(teamMembers.length > 0 ? teamMembers : defaultTeamMembers).map((member: TeamMember) => (
                                <SelectItem key={member.id} value={member.email}>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEmailFromCustom(true)}
                            className="w-full text-xs"
                          >
                            Use custom email
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">From Name:</label>
                      <Input
                        type="text"
                        placeholder="Your Name or Team Name"
                        value={emailFromName}
                        onChange={(e) => setEmailFromName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">To:</label>
                      <Input
                        placeholder="client@company.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        data-testid="input-email-to"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Subject:</label>
                    <Input
                      placeholder={`Re: Order #${order.orderNumber}`}
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      data-testid="input-email-subject"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Message:</label>
                      <div className="flex gap-2">
                        <Button
                          variant={emailPreviewMode === "compose" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEmailPreviewMode("compose")}
                        >
                          Compose
                        </Button>
                        <Button
                          variant={emailPreviewMode === "preview" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEmailPreviewMode("preview")}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                    {emailPreviewMode === "compose" ? (
                      <RichTextEditor
                        value={emailBody}
                        onChange={setEmailBody}
                        placeholder="Compose your message to the client..."
                        className="mt-1"
                      />
                    ) : (
                      <div className="border rounded-lg p-4 min-h-[300px] bg-gray-50">
                        <div className="max-w-2xl mx-auto bg-white shadow-sm">
                          <div className="bg-blue-600 p-6 text-center">
                            <h1 className="text-white text-2xl font-bold">SwagSuite</h1>
                          </div>
                          <div className="p-6">
                            <h2 className="text-gray-900 text-xl mb-4">{emailSubject || "(No subject)"}</h2>
                            {(order?.orderNumber || companyName) && (
                              <div className="bg-gray-100 p-4 rounded mb-4">
                                {order?.orderNumber && <p className="text-sm my-1"><strong>Order #:</strong> {order.orderNumber}</p>}
                                {companyName && <p className="text-sm my-1"><strong>Company:</strong> {companyName}</p>}
                              </div>
                            )}
                            <div
                              className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: emailBody || "<p class='text-gray-400 italic'>No content yet...</p>" }}
                            />
                          </div>
                          <div className="bg-gray-50 p-4 text-center border-t">
                            <p className="text-gray-500 text-xs">Sent from SwagSuite</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Attachments:</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => document.getElementById('client-file-upload')?.click()}
                    >
                      <input
                        id="client-file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setEmailAttachments(prev => [...prev, ...files]);
                        }}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload files</p>
                        <p className="text-xs text-gray-400">PDF, Images, Documents</p>
                      </div>
                    </div>
                    {emailAttachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {emailAttachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEmailAttachments(prev => prev.filter((_, i) => i !== index))}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendEmail}
                      disabled={!emailFrom || !emailTo || !emailSubject || !emailBody.trim()}
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
                          setEmailSubject(`Order Update - #${order.orderNumber}`);
                          setEmailBody(`Hi there,\n\nI wanted to provide you with an update on your order #${order.orderNumber}.\n\nBest regards,\nYour SwagSuite Team`);
                        }}
                      >
                        Order Update
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailSubject(`Artwork Approval Required - #${order.orderNumber}`);
                          setEmailBody(`Hi there,\n\nWe need your approval on the artwork for order #${order.orderNumber} before we can proceed to production.\n\nPlease review and let us know if you have any changes.\n\nBest regards,\nYour SwagSuite Team`);
                        }}
                      >
                        Artwork Approval
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailSubject(`Order Shipped - #${order.orderNumber}`);
                          setEmailBody(`Great news!\n\nYour order #${order.orderNumber} has been shipped and is on its way to you.\n\nTracking information will be provided separately.\n\nBest regards,\nYour SwagSuite Team`);
                        }}
                      >
                        Order Shipped
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailSubject(`Invoice - #${order.orderNumber}`);
                          setEmailBody(`Hi there,\n\nPlease find attached the invoice for order #${order.orderNumber}.\n\nPayment is due within 30 days.\n\nBest regards,\nYour SwagSuite Team`);
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">From:</label>
                        {vendorEmailFromCustom ? (
                          <div className="space-y-2">
                            <Input
                              placeholder="your-email@company.com"
                              value={vendorEmailFrom}
                              onChange={(e) => setVendorEmailFrom(e.target.value)}
                              type="email"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setVendorEmailFromCustom(false);
                                setVendorEmailFrom("");
                              }}
                              className="w-full text-xs"
                            >
                              Select from team instead
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Select value={vendorEmailFrom} onValueChange={setVendorEmailFrom}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sender..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(teamMembers.length > 0 ? teamMembers : defaultTeamMembers).map((member: TeamMember) => (
                                  <SelectItem key={member.id} value={member.email}>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setVendorEmailFromCustom(true)}
                              className="w-full text-xs"
                            >
                              Use custom email
                            </Button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium">From Name:</label>
                        <Input
                          type="text"
                          placeholder="Your Name or Team Name"
                          value={vendorEmailFromName}
                          onChange={(e) => setVendorEmailFromName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">To:</label>
                        <Input
                          placeholder={selectedVendor?.email || "vendor@selectedVendor.com"}
                          value={vendorEmailTo || selectedVendor?.email || ""}
                          onChange={(e) => setVendorEmailTo(e.target.value)}
                          data-testid="input-vendor-email-to"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Subject:</label>
                      <Input
                        placeholder={`Production Update - Order #${order.orderNumber}`}
                        value={vendorEmailSubject}
                        onChange={(e) => setVendorEmailSubject(e.target.value)}
                        data-testid="input-vendor-email-subject"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Message:</label>
                        <div className="flex gap-2">
                          <Button
                            variant={vendorEmailPreviewMode === "compose" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setVendorEmailPreviewMode("compose")}
                          >
                            Compose
                          </Button>
                          <Button
                            variant={vendorEmailPreviewMode === "preview" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setVendorEmailPreviewMode("preview")}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                      {vendorEmailPreviewMode === "compose" ? (
                        <RichTextEditor
                          value={vendorEmailBody}
                          onChange={setVendorEmailBody}
                          placeholder="Compose your message to the vendor..."
                          className="mt-1"
                        />
                      ) : (
                        <div className="border rounded-lg p-4 min-h-[300px] bg-gray-50">
                          <div className="max-w-2xl mx-auto bg-white shadow-sm">
                            <div className="bg-green-600 p-6 text-center">
                              <h1 className="text-white text-2xl font-bold">SwagSuite</h1>
                              <p className="text-green-100 text-sm mt-1">Vendor Communication</p>
                            </div>
                            <div className="p-6">
                              <h2 className="text-gray-900 text-xl mb-4">{vendorEmailSubject || "(No subject)"}</h2>
                              {(order?.orderNumber || selectedVendor?.name) && (
                                <div className="bg-gray-100 p-4 rounded mb-4">
                                  {order?.orderNumber && <p className="text-sm my-1"><strong>PO #:</strong> {order.orderNumber}</p>}
                                  {selectedVendor?.name && <p className="text-sm my-1"><strong>Vendor:</strong> {selectedVendor.name}</p>}
                                </div>
                              )}
                              <div
                                className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: vendorEmailBody || "<p class='text-gray-400 italic'>No content yet...</p>" }}
                              />
                            </div>
                            <div className="bg-gray-50 p-4 text-center border-t">
                              <p className="text-gray-500 text-xs">Sent from SwagSuite</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Attachments:</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => document.getElementById('vendor-file-upload')?.click()}
                      >
                        <input
                          id="vendor-file-upload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setVendorEmailAttachments(prev => [...prev, ...files]);
                          }}
                        />
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <p className="text-sm text-gray-600">Click to upload files</p>
                          <p className="text-xs text-gray-400">PDF, Images, Documents</p>
                        </div>
                      </div>
                      {vendorEmailAttachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {vendorEmailAttachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setVendorEmailAttachments(prev => prev.filter((_, i) => i !== index))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSendVendorEmail}
                        disabled={!vendorEmailFrom || !vendorEmailTo || !vendorEmailSubject || !vendorEmailBody.trim()}
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
                            setVendorEmailSubject(`Production Start Request - Order #${order.orderNumber}`);
                            setVendorEmailBody(`Hello,\n\nWe are ready to begin production for order #${order.orderNumber}.\n\nOrder Details:\n- Quantity: [QUANTITY]\n- Product: [PRODUCT]\n- In-Hands Date: ${order.inHandsDate ? new Date(order.inHandsDate).toLocaleDateString() : '[DATE]'}\n\nPlease confirm production timeline and any requirements.\n\nBest regards,\nSwagSuite Team`);
                          }}
                        >
                          Production Start Request
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVendorEmailSubject(`Production Status Check - Order #${order.orderNumber}`);
                            setVendorEmailBody(`Hello,\n\nCould you please provide a status update on order #${order.orderNumber}?\n\nWe need to confirm the production timeline to meet our delivery commitments.\n\nThank you for your attention to this matter.\n\nBest regards,\nSwagSuite Team`);
                          }}
                        >
                          Status Check
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVendorEmailSubject(`Artwork Files - Order #${order.orderNumber}`);
                            setVendorEmailBody(`Hello,\n\nPlease find attached the final artwork files for order #${order.orderNumber}.\n\nArtwork has been approved by the client and is ready for production.\n\nPlease confirm receipt and estimated production start date.\n\nBest regards,\nSwagSuite Team`);
                          }}
                        >
                          Send Artwork
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVendorEmailSubject(`Rush Order Request - Order #${order.orderNumber}`);
                            setVendorEmailBody(`Hello,\n\nWe have a rush request for order #${order.orderNumber}.\n\nRequired in-hands date: ${order.inHandsDate ? new Date(order.inHandsDate).toLocaleDateString() : '[DATE]'}\n\nPlease let us know if this timeline is possible and any additional costs.\n\nThank you for your flexibility.\n\nBest regards,\nSwagSuite Team`);
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
                      {selectedVendor ? (
                        <>
                          <div className="flex items-center space-x-3">
                            <UserAvatar name={selectedVendor.name} size="sm" />
                            <div>
                              <p className="font-semibold">{selectedVendor.name}</p>
                              <p className="text-sm text-gray-600">{selectedVendor.isPreferred ? 'Preferred Vendor' : 'Vendor'}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {selectedVendor.contactPerson && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">Contact: {selectedVendor.contactPerson}</span>
                              </div>
                            )}

                            {selectedVendor.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{selectedVendor.email}</span>
                              </div>
                            )}

                            {selectedVendor.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{selectedVendor.phone}</span>
                              </div>
                            )}

                            {selectedVendor.website && (
                              <div className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                                <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                  {selectedVendor.website}
                                </a>
                              </div>
                            )}

                            {selectedVendor.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{selectedVendor.address}</span>
                              </div>
                            )}

                            {selectedVendor.paymentTerms && (
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">Terms: {selectedVendor.paymentTerms}</span>
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
      <ProductModal
        open={isProductModalOpen}
        onOpenChange={(open) => {
          setIsProductModalOpen(open);
          if (!open) {
            setEditingProduct(null);
            // Force refresh orderItems to get updated supplier info
            queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
          }
        }}
        product={editingProduct}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Product?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingProduct?.productName}</strong>?
              {deletingProduct?.productSku && (
                <span className="block mt-1 text-xs text-gray-500">SKU: {deletingProduct.productSku}</span>
              )}
              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone. The product will be permanently removed from the system.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeletingProduct(null);
              setIsDeleteDialogOpen(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingProduct) {
                  deleteProductMutation.mutate(deletingProduct.productId);
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditContactOpen} onOpenChange={setIsEditContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Primary Contact</DialogTitle>
            <DialogDescription>
              Select the primary contact for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact: any) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={`${contact.firstName} ${contact.lastName}`} size="sm" />
                      <div>
                        <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditContactOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveContact} disabled={updateOrderContactMutation.isPending} className="flex-1">
              {updateOrderContactMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Billing Address Dialog */}
      <Dialog open={isEditBillingAddressOpen} onOpenChange={setIsEditBillingAddressOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Billing Address</DialogTitle>
            <DialogDescription>
              Update the billing address for {companyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="billing-street">Street Address</Label>
              <Input
                id="billing-street"
                value={billingAddressForm.street}
                onChange={(e) => setBillingAddressForm({ ...billingAddressForm, street: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billing-city">City</Label>
                <Input
                  id="billing-city"
                  value={billingAddressForm.city}
                  onChange={(e) => setBillingAddressForm({ ...billingAddressForm, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="billing-state">State</Label>
                <Input
                  id="billing-state"
                  value={billingAddressForm.state}
                  onChange={(e) => setBillingAddressForm({ ...billingAddressForm, state: e.target.value })}
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billing-zip">ZIP Code</Label>
                <Input
                  id="billing-zip"
                  value={billingAddressForm.zipCode}
                  onChange={(e) => setBillingAddressForm({ ...billingAddressForm, zipCode: e.target.value })}
                  placeholder="12345"
                />
              </div>
              <div>
                <Label htmlFor="billing-country">Country</Label>
                <Input
                  id="billing-country"
                  value={billingAddressForm.country}
                  onChange={(e) => setBillingAddressForm({ ...billingAddressForm, country: e.target.value })}
                  placeholder="US"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billing-contact">Contact Name</Label>
                <Input
                  id="billing-contact"
                  value={billingAddressForm.contactName}
                  onChange={(e) => setBillingAddressForm({ ...billingAddressForm, contactName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="billing-email">Email</Label>
                <Input
                  id="billing-email"
                  type="email"
                  value={billingAddressForm.email}
                  onChange={(e) => setBillingAddressForm({ ...billingAddressForm, email: e.target.value })}
                  placeholder="billing@company.com"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditBillingAddressOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveBillingAddress} disabled={updateBillingAddressMutation.isPending} className="flex-1">
              {updateBillingAddressMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shipping Address Dialog */}
      <Dialog open={isEditShippingAddressOpen} onOpenChange={setIsEditShippingAddressOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Shipping Address</DialogTitle>
            <DialogDescription>
              Update the shipping address for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const billing = companyData?.billingAddress || {};
                  const billingAddr = [
                    billing.street,
                    [billing.city, billing.state, billing.zipCode].filter(Boolean).join(', '),
                    billing.country
                  ].filter(Boolean).join('\n');

                  setShippingAddressForm({
                    address: billingAddr,
                    contactName: billing.contactName || "",
                    email: billing.email || ""
                  });
                }}
              >
                📋 Copy from Billing Address
              </Button>
            </div>

            <div>
              <Label htmlFor="shipping-address">Shipping Address</Label>
              <Textarea
                id="shipping-address"
                value={shippingAddressForm.address}
                onChange={(e) => setShippingAddressForm({ ...shippingAddressForm, address: e.target.value })}
                placeholder="Enter complete shipping address"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="shipping-contact">Contact Name</Label>
                <Input
                  id="shipping-contact"
                  value={shippingAddressForm.contactName}
                  onChange={(e) => setShippingAddressForm({ ...shippingAddressForm, contactName: e.target.value })}
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <Label htmlFor="shipping-email">Email</Label>
                <Input
                  id="shipping-email"
                  type="email"
                  value={shippingAddressForm.email}
                  onChange={(e) => setShippingAddressForm({ ...shippingAddressForm, email: e.target.value })}
                  placeholder="shipping@company.com"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditShippingAddressOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveShippingAddress} disabled={updateShippingAddressMutation.isPending} className="flex-1">
              {updateShippingAddressMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shipping Info Dialog */}
      <Dialog open={isEditShippingInfoOpen} onOpenChange={setIsEditShippingInfoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shipping & Timeline Information</DialogTitle>
            <DialogDescription>
              Update shipping details and important dates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier-in-hands">Supplier In-Hands Date</Label>
                <Input
                  id="supplier-in-hands"
                  type="date"
                  value={shippingInfoForm.supplierInHandsDate}
                  onChange={(e) => setShippingInfoForm({ ...shippingInfoForm, supplierInHandsDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customer-in-hands">Customer In-Hands Date</Label>
                <Input
                  id="customer-in-hands"
                  type="date"
                  value={shippingInfoForm.inHandsDate}
                  onChange={(e) => setShippingInfoForm({ ...shippingInfoForm, inHandsDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-date">Event Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={shippingInfoForm.eventDate}
                  onChange={(e) => setShippingInfoForm({ ...shippingInfoForm, eventDate: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="is-firm"
                  checked={shippingInfoForm.isFirm}
                  onChange={(e) => setShippingInfoForm({ ...shippingInfoForm, isFirm: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is-firm">Firm In-Hands Date</Label>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditShippingInfoOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveShippingInfo} disabled={updateShippingInfoMutation.isPending} className="flex-1">
              {updateShippingInfoMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OrderDetailsModal;