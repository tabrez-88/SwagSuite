import { FilesTab } from "@/components/FilesTab";
import { DocumentsTab } from "@/components/DocumentsTab";
import { VendorApprovalDialog } from "@/components/VendorApprovalDialog";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  AtSign,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  Factory,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Send,
  ShoppingCart,
  Tag,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  User,
  X,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import OrderModal from "./OrderModal";
import ProductModal from "./ProductModal";
import { RichTextEditor } from './RichTextEditor';
import { useProductionStages } from "@/hooks/useProductionStages";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  pageMode?: boolean;
  onPrefillEmail?: (data: { to: string; toName: string; subject: string; body: string; tab: string }) => void;
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

// Strip HTML tags and decode entities for plain text display
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

function OrderDetailsModal({ open, onOpenChange, orderId, pageMode }: OrderDetailsModalProps) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { stages: productionStages } = useProductionStages();
  const [activeTab, setActiveTab] = useState("details");
  const [internalNote, setInternalNote] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailToName, setEmailToName] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [emailFromName, setEmailFromName] = useState("");
  const [emailFromCustom, setEmailFromCustom] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);
  const [vendorEmailTo, setVendorEmailTo] = useState("");
  const [vendorEmailToName, setVendorEmailToName] = useState("");
  const [vendorEmailFrom, setVendorEmailFrom] = useState("");
  const [vendorEmailFromName, setVendorEmailFromName] = useState("");
  const [vendorEmailFromCustom, setVendorEmailFromCustom] = useState(false);
  const [vendorEmailSubject, setVendorEmailSubject] = useState("");
  const [vendorEmailBody, setVendorEmailBody] = useState("");
  const [vendorEmailCc, setVendorEmailCc] = useState("");
  const [vendorEmailBcc, setVendorEmailBcc] = useState("");
  const [vendorEmailAttachments, setVendorEmailAttachments] = useState<File[]>([]);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<string | null>(null);
  const [emailPreviewMode, setEmailPreviewMode] = useState<"compose" | "preview">("compose");
  const [vendorEmailPreviewMode, setVendorEmailPreviewMode] = useState<"compose" | "preview">("compose");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isEditOrderItemOpen, setIsEditOrderItemOpen] = useState(false);
  const [isArtworkDialogOpen, setIsArtworkDialogOpen] = useState(false);
  const [isArtworkListDialogOpen, setIsArtworkListDialogOpen] = useState(false);
  const [currentOrderItemId, setCurrentOrderItemId] = useState<string | null>(null);
  const [editingArtwork, setEditingArtwork] = useState<any>(null);
  const [expandedArtworkItems, setExpandedArtworkItems] = useState<Set<string>>(new Set());
  const [artworkForm, setArtworkForm] = useState({
    name: "",
    artworkType: "",
    location: "",
    color: "",
    size: "",
    status: "pending",
    file: null as File | null
  });

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingOrderItem, setEditingOrderItem] = useState<any>(null);
  const [newProductForm, setNewProductForm] = useState({
    productId: "",
    quantity: "1",
    unitPrice: "0",
    color: "",
    size: "",
    imprintLocation: "",
    imprintMethod: "",
  });
  const [orderItemForm, setOrderItemForm] = useState({
    quantity: "1",
    unitPrice: "0",
    color: "",
    size: "",
  });
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Do Not Order vendor approval dialog state
  const [showVendorApprovalDialog, setShowVendorApprovalDialog] = useState(false);
  const [blockedVendor, setBlockedVendor] = useState<{ id: string; name: string } | null>(null);
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  // Edit dialog states
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [isEditBillingAddressOpen, setIsEditBillingAddressOpen] = useState(false);
  const [isEditShippingAddressOpen, setIsEditShippingAddressOpen] = useState(false);
  const [isEditShippingInfoOpen, setIsEditShippingInfoOpen] = useState(false);

  // Reassign dialog states
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [isReassignCsrDialogOpen, setIsReassignCsrDialogOpen] = useState(false);
  const [isReassignPmDialogOpen, setIsReassignPmDialogOpen] = useState(false);
  const [reassignUserId, setReassignUserId] = useState("");
  const [reassignCsrUserId, setReassignCsrUserId] = useState("");
  const [reassignPmUserId, setReassignPmUserId] = useState("");

  // Inline product editing states
  const [editedItems, setEditedItems] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Form data states
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [billingAddressForm, setBillingAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
    contactName: "",
    email: ""
  });
  const [shippingAddressForm, setShippingAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
    contactName: "",
    email: ""
  });
  const [shippingInfoForm, setShippingInfoForm] = useState({
    supplierInHandsDate: "",
    inHandsDate: "",
    eventDate: "",
    isFirm: false,
    isRush: false,
    shippingMethod: ""
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-fill "From" fields with the current user's email and name
  useEffect(() => {
    if (currentUser) {
      const email = (currentUser as any).email || "";
      const name = `${(currentUser as any).firstName || ""} ${(currentUser as any).lastName || ""}`.trim();
      if (!emailFrom) {
        setEmailFrom(email);
        setEmailFromName(name);
      }
      if (!vendorEmailFrom) {
        setVendorEmailFrom(email);
        setVendorEmailFromName(name);
      }
    }
  }, [currentUser]);

  // Helper function to initialize edited item state
  const getEditedItem = (itemId: string, item: any) => {
    if (editedItems[itemId]) {
      return editedItems[itemId];
    }

    // Initialize with current values
    return {
      id: itemId,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      supplierId: item.supplierId,
      color: item.color || '',
      quantity: item.quantity || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      cost: parseFloat(item.cost || 0),
      decorationCost: parseFloat(item.decorationCost || 0),
      charges: parseFloat(item.charges || 0),
      margin: 44, // Default margin percentage
      sizePricing: item.sizePricing || {}, // For SanMar/S&S: { 'S': { cost: 0, price: 0, quantity: 0 }, ... }
    };
  };

  // Helper function to update edited item
  const updateEditedItem = (itemId: string, updates: any) => {
    const currentItem = orderItems.find((item: any) => item.id === itemId);
    if (!currentItem) return;

    const editedItem = getEditedItem(itemId, currentItem);
    const updatedItem = { ...editedItem, ...updates };

    setEditedItems(prev => ({
      ...prev,
      [itemId]: updatedItem
    }));
    setHasUnsavedChanges(true);
  };

  // Helper function to calculate totals for an item
  const calculateItemTotals = (item: any) => {
    const { quantity, unitPrice, decorationCost, charges, cost, uomFactory } = item;
    const productTotal = quantity * unitPrice;

    // Decoration dan Charges adalah PERSENTASE dari product total
    // Decoration % × Product Total = Decoration $
    // Charges % × (Product + Decoration) = Charges $
    const decorationPercent = decorationCost || 0;
    const chargesPercent = charges || 0;

    const decorationTotal = (decorationPercent / 100) * productTotal;
    const subtotalAfterDecoration = productTotal + decorationTotal;
    const chargesTotal = (chargesPercent / 100) * subtotalAfterDecoration;

    const total = productTotal + decorationTotal + chargesTotal;

    // Calculate product margin: Margin = (Price - Cost) / Price * 100
    const productCostTotal = (cost || 0) * quantity;
    const productMargin = productTotal > 0 ? ((productTotal - productCostTotal) / productTotal) * 100 : 0;

    // Calculate total margin: Total Margin = (Total Price - Total Cost) / Total Price * 100
    // Total Cost = Product Cost + Decoration Cost + Charges Cost
    const totalCost = productCostTotal + decorationTotal + chargesTotal;
    const totalMargin = total > 0 ? ((total - totalCost) / total) * 100 : 0;

    // Calculate factory quantity from UOM Factory
    // If UOM Factory = 12, and quantity = 140, factoryQuantity = ceil(140/12) = 12 boxes
    const factoryQuantity = uomFactory && uomFactory > 0 ? Math.ceil(quantity / uomFactory) : quantity;

    return {
      productTotal,
      decorationTotal,
      chargesTotal,
      total,
      productMargin,
      totalMargin,
      factoryQuantity
    };
  };

  // Helper function to calculate margin
  const calculateMargin = (price: number, cost: number) => {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  // Handler for updating color
  const handleColorChange = (itemId: string, color: string) => {
    updateEditedItem(itemId, { color });
  };

  // Handler for updating size-based pricing (SanMar/S&S)
  const handleSizePricingChange = (itemId: string, size: string, field: 'cost' | 'price' | 'quantity', value: number) => {
    const currentItem = orderItems.find((item: any) => item.id === itemId);
    if (!currentItem) return;

    const editedItem = getEditedItem(itemId, currentItem);
    const sizePricing = { ...editedItem.sizePricing };

    if (!sizePricing[size]) {
      sizePricing[size] = { cost: 0, price: 0, quantity: 0 };
    }

    sizePricing[size][field] = value;

    // Calculate total quantity and weighted average price
    let totalQuantity = 0;
    let totalPrice = 0;
    let totalCost = 0;

    Object.entries(sizePricing).forEach(([sz, data]: [string, any]) => {
      totalQuantity += data.quantity || 0;
      totalPrice += (data.price || 0) * (data.quantity || 0);
      totalCost += (data.cost || 0) * (data.quantity || 0);
    });

    const avgPrice = totalQuantity > 0 ? totalPrice / totalQuantity : 0;
    const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    updateEditedItem(itemId, {
      sizePricing,
      quantity: totalQuantity,
      unitPrice: avgPrice,
      cost: avgCost
    });
  };

  // Handler for simple pricing (non-SanMar/S&S)
  const handleSimplePricingChange = (itemId: string, field: 'cost' | 'price' | 'quantity', value: number) => {
    const updates: any = {};

    if (field === 'cost') {
      updates.cost = value;
    } else if (field === 'price') {
      updates.unitPrice = value;
    } else if (field === 'quantity') {
      updates.quantity = value;
    }

    updateEditedItem(itemId, updates);
  };

  // Handler for margin changes
  const handleMarginChange = (itemId: string, marginPercent: number) => {
    const currentItem = orderItems.find((item: any) => item.id === itemId);
    if (!currentItem) return;

    const editedItem = getEditedItem(itemId, currentItem);
    const cost = editedItem.cost || 0;

    // Calculate new price based on margin: price = cost / (1 - margin/100)
    const newPrice = cost > 0 ? cost / (1 - marginPercent / 100) : editedItem.unitPrice;

    updateEditedItem(itemId, {
      margin: marginPercent,
      unitPrice: newPrice
    });
  };

  // Handler for decoration cost
  const handleDecorationChange = (itemId: string, decorationCost: number) => {
    updateEditedItem(itemId, { decorationCost });
  };

  // Handler for charges
  const handleChargesChange = (itemId: string, charges: number) => {
    updateEditedItem(itemId, { charges });
  };

  // Handler for product margin changes
  const handleProductMarginChange = (itemId: string, marginPercent: number) => {
    const currentItem = orderItems.find((item: any) => item.id === itemId);
    if (!currentItem) return;

    const editedItem = getEditedItem(itemId, currentItem);
    const cost = editedItem.cost || 0;

    // Formula: Price = Cost / (1 - Margin%/100)
    // Kalau margin 30% → Price = Cost / 0.70
    // Kalau margin 44% → Price = Cost / 0.56
    let newUnitPrice = editedItem.unitPrice;

    if (cost > 0 && marginPercent < 100) {
      newUnitPrice = Math.round((cost / (1 - marginPercent / 100)) * 100) / 100;
    }

    updateEditedItem(itemId, {
      unitPrice: newUnitPrice
    });
  };

  // Handler for total margin changes (affects the final price including decoration and charges)
  const handleTotalMarginChange = (itemId: string, marginPercent: number) => {
    const currentItem = orderItems.find((item: any) => item.id === itemId);
    if (!currentItem) return;

    const editedItem = getEditedItem(itemId, currentItem);
    const totalCost = (editedItem.cost || 0) + (editedItem.decorationCost || 0) + (editedItem.charges || 0);

    // Calculate new total price based on total margin
    const newTotalPrice = totalCost > 0 ? totalCost / (1 - marginPercent / 100) : 0;

    // Back-calculate unitPrice (assuming decoration and charges stay the same)
    const newUnitPrice = newTotalPrice - (editedItem.decorationCost || 0) - (editedItem.charges || 0);

    updateEditedItem(itemId, {
      totalMargin: marginPercent,
      unitPrice: newUnitPrice > 0 ? newUnitPrice : editedItem.unitPrice
    });
  };

  // Handler for quantity change (direct)
  const handleQuantityChange = (itemId: string, quantity: number) => {
    updateEditedItem(itemId, { quantity });
  };

  // Handler for UOM Factory change
  const handleUomFactoryChange = (itemId: string, uomFactory: number) => {
    updateEditedItem(itemId, { uomFactory });
  };

  // UX Helper: select all text on focus for numeric inputs
  const handleSelectAll = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // UX Helper: format number for display in input (empty string if 0 or NaN, max 2 decimals)
  const formatInputValue = (value: number | string | undefined | null, allowZero = false): string => {
    if (value === undefined || value === null || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    if (num === 0 && !allowZero) return '';
    // Round to max 2 decimal places, remove trailing zeros
    return parseFloat(num.toFixed(2)).toString();
  };

  // Artwork handlers
  const handleOpenArtworkDialog = (orderItemId: string) => {
    setCurrentOrderItemId(orderItemId);
    setEditingArtwork(null);
    setArtworkForm({
      name: "",
      artworkType: "",
      location: "",
      color: "",
      size: "",
      status: "pending",
      file: null
    });
    setIsArtworkDialogOpen(true);
  };

  const toggleArtworkList = (orderItemId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentOrderItemId(orderItemId);
    setIsArtworkListDialogOpen(true);
  };

  const handleEditArtwork = (orderItemId: string, artwork: any) => {
    setCurrentOrderItemId(orderItemId);
    setEditingArtwork(artwork);
    setArtworkForm({
      name: artwork.name,
      artworkType: artwork.artworkType,
      location: artwork.location,
      color: artwork.color,
      size: artwork.size,
      status: artwork.status,
      file: null
    });
    setIsArtworkDialogOpen(true);
  };

  const handleSaveArtwork = async () => {
    if (!currentOrderItemId) return;

    if (!artworkForm.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter an artwork name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', artworkForm.name);
      formData.append('artworkType', artworkForm.artworkType);
      formData.append('location', artworkForm.location);
      formData.append('color', artworkForm.color);
      formData.append('size', artworkForm.size);
      formData.append('status', artworkForm.status);

      if (artworkForm.file) {
        formData.append('file', artworkForm.file);
      }

      const url = editingArtwork
        ? `/api/order-items/${currentOrderItemId}/artworks/${editingArtwork.id}`
        : `/api/order-items/${currentOrderItemId}/artworks`;

      const method = editingArtwork ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save artwork');
      }

      toast({
        title: editingArtwork ? "Artwork Updated" : "Artwork Added",
        description: `${artworkForm.name} has been ${editingArtwork ? 'updated' : 'added'} successfully.`,
      });

      // Refetch artwork items
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-artworks`] });
      setIsArtworkDialogOpen(false);
    } catch (error) {
      console.error('Error saving artwork:', error);
      toast({
        title: "Error",
        description: "Failed to save artwork. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteArtwork = async (orderItemId: string, artworkId: string) => {
    try {
      const response = await fetch(`/api/order-items/${orderItemId}/artworks/${artworkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      toast({
        title: "Artwork Deleted",
        description: "Artwork has been removed.",
      });

      // Refetch artwork items
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-artworks`] });
    } catch (error) {
      console.error('Error deleting artwork:', error);
      toast({
        title: "Error",
        description: "Failed to delete artwork. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [emailSearchQuery, setEmailSearchQuery] = useState("");
  const [vendorEmailSearchQuery, setVendorEmailSearchQuery] = useState("");

  // Fetch order data
  const { data: order, isLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: (open || !!pageMode) && !!orderId,
  });

  // Fetch companies
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
    enabled: (open || !!pageMode) && !!order,
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
    enabled: (open || !!pageMode) && !!order?.companyId,
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

  // Fetch invoice data
  const { data: invoice, isLoading: invoiceLoading } = useQuery<any>({
    queryKey: [`/api/orders/${orderId}/invoice`],
    enabled: open && !!orderId,
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create invoice');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/invoice`] });
      toast({
        title: "Invoice Created",
        description: "Invoice has been generated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice.",
        variant: "destructive"
      });
    }
  });

  // Fetch team members for @ mentions
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/users/team"],
    enabled: (open || !!pageMode) && !!order,
  });

  // Get assigned users
  const assignedUser = teamMembers.find((u: any) => u.id === (order as any)?.assignedUserId);
  const csrUser = teamMembers.find((u: any) => u.id === (order as any)?.csrUserId);
  const productionManager = teamMembers.find((u: any) => u.id === (order as any)?.productionManagerId);

  // Fetch order items with product and vendor info
  const { data: orderItems = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/items`],
    enabled: (open || !!pageMode) && !!order,
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache (replaces cacheTime in newer versions)
  });

  // Fetch artwork items for all order items
  const { data: allArtworkItems = {} } = useQuery<Record<string, any[]>>({
    queryKey: [`/api/orders/${orderId}/all-artworks`],
    queryFn: async () => {
      if (!orderItems || orderItems.length === 0) return {};

      const artworksByItem: Record<string, any[]> = {};

      await Promise.all(
        orderItems.map(async (item: any) => {
          try {
            const response = await fetch(`/api/order-items/${item.id}/artworks`);
            if (response.ok) {
              artworksByItem[item.id] = await response.json();
            } else {
              artworksByItem[item.id] = [];
            }
          } catch (error) {
            console.error(`Error fetching artworks for item ${item.id}:`, error);
            artworksByItem[item.id] = [];
          }
        })
      );

      return artworksByItem;
    },
    enabled: (open || !!pageMode) && !!orderItems && orderItems.length > 0,
  });

  // Fetch suppliers data (must be before orderVendors useMemo)
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    enabled: (open || !!pageMode) && !!order,
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

  // Fetch vendor contacts for the selected vendor
  const { data: vendorContacts = [] } = useQuery<any[]>({
    queryKey: [`/api/contacts`, { supplierId: selectedVendor?.id }],
    queryFn: async () => {
      if (!selectedVendor?.id) return [];
      const response = await fetch(`/api/contacts?supplierId=${selectedVendor.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: (open || !!pageMode) && !!selectedVendor?.id,
  });

  // Get primary contact or first contact for vendor
  const vendorPrimaryContact = vendorContacts.find((c: any) => c.isPrimary) || vendorContacts[0];

  // Set first vendor as selected when vendors load and auto-fill email from contact
  useEffect(() => {
    if (orderVendors.length > 0 && !selectedVendor) {
      setSelectedVendor(orderVendors[0]);
    }
  }, [orderVendors, selectedVendor]);

  // Auto-fill vendor email from primary contact when vendor or contacts change
  useEffect(() => {
    if (selectedVendor && vendorPrimaryContact) {
      setVendorEmailTo(vendorPrimaryContact.email || "");
      setVendorEmailToName(`${vendorPrimaryContact.firstName || ''} ${vendorPrimaryContact.lastName || ''}`.trim() || selectedVendor.name);
    } else if (selectedVendor && vendorContacts.length === 0) {
      // No contacts for this vendor
      setVendorEmailTo("");
      setVendorEmailToName(selectedVendor.name || "");
    }
  }, [selectedVendor, vendorPrimaryContact, vendorContacts]);

  // Auto-fill client email recipient from primary contact
  useEffect(() => {
    if (primaryContact && !emailTo) {
      setEmailTo(primaryContact.email);
      setEmailToName(`${primaryContact.firstName} ${primaryContact.lastName}`);
    }
  }, [primaryContact, emailTo]);

  // Fetch all products to get current supplier info and for add product dialog
  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    enabled: (open || !!pageMode) && !!order,
    staleTime: 0,
  });

  // Handler for opening edit order item dialog
  const handleEditOrderItem = (item: any) => {
    setEditingOrderItem(item);
    setOrderItemForm({
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      color: item.color || "",
      size: item.size || "",
    });
    setIsEditOrderItemOpen(true);
  };

  // Handler for saving order item changes
  const handleSaveOrderItem = () => {
    if (!editingOrderItem) return;

    const quantity = parseInt(orderItemForm.quantity);
    const unitPrice = parseFloat(orderItemForm.unitPrice);

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(unitPrice) || unitPrice < 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid unit price.",
        variant: "destructive",
      });
      return;
    }

    updateOrderItemMutation.mutate({
      itemId: editingOrderItem.id,
      updates: {
        quantity,
        unitPrice,
        totalPrice: (quantity * unitPrice).toFixed(2),
        color: orderItemForm.color || null,
        size: orderItemForm.size || null,
      },
    });
  };

  // Handler for adding product
  const handleAddProduct = () => {
    const quantity = parseInt(newProductForm.quantity);
    const unitPrice = parseFloat(newProductForm.unitPrice);

    if (!newProductForm.productId) {
      toast({
        title: "Product Required",
        description: "Please select a product.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(unitPrice) || unitPrice < 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid unit price.",
        variant: "destructive",
      });
      return;
    }

    // Get product's supplier ID
    const selectedProduct = allProducts.find((p: any) => p.id === newProductForm.productId);
    const dataToSend = {
      ...newProductForm,
      supplierId: selectedProduct?.supplierId || null,
    };

    addOrderItemMutation.mutate(dataToSend);
  };

  // Fetch project activities (internal notes)
  const { data: activities = [] } = useQuery<ProjectActivity[]>({
    queryKey: [`/api/projects/${orderId}/activities`],
    enabled: (open || !!pageMode) && !!order,
  });

  // Fetch client communications
  const { data: clientCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/orders/${orderId}/communications`, { type: "client_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/communications?type=client_email`);
      if (!response.ok) throw new Error("Failed to fetch client communications");
      return response.json();
    },
    enabled: (open || !!pageMode) && !!order,
  });

  // Fetch vendor communications
  const { data: vendorCommunications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/orders/${orderId}/communications`, { type: "vendor_email" }],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/communications?type=vendor_email`);
      if (!response.ok) throw new Error("Failed to fetch vendor communications");
      return response.json();
    },
    enabled: (open || !!pageMode) && !!order,
  });

  // Fetch artwork approvals
  const { data: approvals = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/approvals`],
    enabled: (open || !!pageMode) && !!order,
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
      recipientName: string;
      subject: string;
      body: string;
      cc?: string;
      bcc?: string;
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
          recipientName: data.recipientName,
          subject: data.subject,
          body: data.body,
          cc: data.cc,
          bcc: data.bcc,
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
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/orders/${order?.id}/communications`, { type: "client_email" }],
      });
      toast({
        title: "Email sent",
        description: "Client email has been sent successfully.",
      });

      // Update order status if this email was linked to a status transition
      if (pendingStatusUpdate && order?.id) {
        try {
          await fetch(`/api/orders/${order.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status: pendingStatusUpdate }),
          });
          queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
          setPendingStatusUpdate(null);
        } catch (err) {
          console.error("Failed to update order status after email:", err);
        }
      }
    },
    onError: (error: Error) => {
      console.error('Client email error:', error);
      toast({
        title: "Email Error",
        description: error.message || "Failed to send client email. Please check Settings → Email Config.",
        variant: "destructive",
      });
      // Don't clear pendingStatusUpdate on error - user might retry
    },
  });

  // Mutation for sending vendor emails
  const sendVendorEmailMutation = useMutation({
    mutationFn: async (data: {
      fromEmail: string;
      fromName: string;
      recipientEmail: string;
      recipientName: string;
      subject: string;
      body: string;
      cc?: string;
      bcc?: string;
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
          recipientName: data.recipientName,
          subject: data.subject,
          body: data.body,
          cc: data.cc,
          bcc: data.bcc,
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

  // Mutation to update order with all item changes (batch update)
  const updateOrderWithItemsMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("No order to update");

      // Prepare items array from edited items
      const itemsToUpdate = orderItems.map((item: any) => {
        const editedItem = editedItems[item.id];

        if (!editedItem) {
          // No changes for this item, return original
          return {
            id: item.id,
            productId: item.productId,
            supplierId: item.supplierId,
            quantity: item.quantity,
            cost: parseFloat(item.cost || 0),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice),
            decorationCost: parseFloat(item.decorationCost || 0),
            charges: parseFloat(item.charges || 0),
            sizePricing: item.sizePricing || null,
            color: item.color,
            size: item.size,
            imprintLocation: item.imprintLocation,
            imprintMethod: item.imprintMethod,
            notes: item.notes,
          };
        }

        // Calculate totals for edited item
        const totals = calculateItemTotals(editedItem);

        const itemPayload = {
          id: item.id,
          productId: item.productId,
          supplierId: item.supplierId,
          quantity: editedItem.quantity,
          cost: parseFloat(editedItem.cost || 0),
          unitPrice: parseFloat(editedItem.unitPrice),
          totalPrice: totals.total,
          decorationCost: parseFloat(editedItem.decorationCost || 0),
          charges: parseFloat(editedItem.charges || 0),
          sizePricing: editedItem.sizePricing || null,
          color: editedItem.color || null,
          size: editedItem.size || null,
          imprintLocation: item.imprintLocation,
          imprintMethod: item.imprintMethod,
          notes: item.notes,
        };

        console.log('Sending item update:', itemPayload);
        return itemPayload;
      });

      // Calculate order totals
      const subtotal = itemsToUpdate.reduce((sum, item) => sum + (typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice), 0);

      const payload = {
        items: itemsToUpdate,
        subtotal: subtotal.toFixed(2),
        total: subtotal.toFixed(2),
      };

      console.log('Full update payload:', payload);

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update order");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });

      // Reset edited items state
      setEditedItems({});
      setHasUnsavedChanges(false);

      toast({
        title: "Order updated",
        description: "All changes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler for Update Order button
  const handleUpdateOrder = async () => {
    if (!hasUnsavedChanges) {
      toast({
        title: "No changes",
        description: "There are no changes to save.",
      });
      return;
    }

    setIsUpdatingOrder(true);
    try {
      await updateOrderWithItemsMutation.mutateAsync();
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Mutation to add product to order
  const addOrderItemMutation = useMutation({
    mutationFn: async (data: typeof newProductForm & { supplierId?: string | null }) => {
      const response = await fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: data.productId,
          supplierId: data.supplierId || null,
          quantity: parseInt(data.quantity),
          unitPrice: parseFloat(data.unitPrice),
          totalPrice: (parseInt(data.quantity) * parseFloat(data.unitPrice)).toFixed(2),
          color: data.color || null,
          size: data.size || null,
          imprintLocation: data.imprintLocation || null,
          imprintMethod: data.imprintMethod || null,
        }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to add product to order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
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
      toast({
        title: "Product Added",
        description: "Product has been added to the order successfully.",
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

  // Mutation to update order item (quantity/price)
  const updateOrderItemMutation = useMutation({
    mutationFn: async (data: { itemId: string; updates: any }) => {
      const response = await fetch(`/api/orders/${orderId}/items/${data.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update order item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setIsEditOrderItemOpen(false);
      setEditingOrderItem(null);
      toast({
        title: "Item Updated",
        description: "Order item has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order item.",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete order item (remove item from this order)
  const deleteOrderItemMutation = useMutation({
    mutationFn: async (orderItemId: string) => {
      const response = await fetch(`/api/orders/${orderId}/items/${orderItemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete order item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      toast({
        title: "Item removed",
        description: "Product has been removed from this order."
      });
    },
    onError: () => {
      setIsDeleteDialogOpen(false);
      toast({
        title: "Failed to remove item",
        description: "There was an error removing the item from this order. Please try again.",
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

  // Mutation to update order billing address
  const updateBillingAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Sending billing address to server:', data);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingAddress: JSON.stringify(data) }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update billing address');
      const result = await response.json();
      console.log('Server response for billing:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
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

  // Reassign Sales Rep mutation
  const reassignSalesRepMutation = useMutation({
    mutationFn: async ({ orderId, userId }: { orderId: string; userId: string }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedUserId: userId }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reassign sales rep');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/team'] });
      setIsReassignDialogOpen(false);
      setReassignUserId("");
      toast({
        title: "Sales Rep Reassigned",
        description: "Sales rep has been reassigned successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign sales rep.",
        variant: "destructive",
      });
    },
  });

  // Reassign CSR mutation
  const reassignCsrMutation = useMutation({
    mutationFn: async ({ orderId, userId }: { orderId: string; userId: string }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrUserId: userId }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reassign CSR');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/team'] });
      setIsReassignCsrDialogOpen(false);
      setReassignCsrUserId("");
      toast({
        title: "CSR Reassigned",
        description: "CSR has been reassigned successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign CSR.",
        variant: "destructive",
      });
    },
  });

  // Reassign Production Manager mutation
  const reassignPmMutation = useMutation({
    mutationFn: async ({ orderId, userId }: { orderId: string; userId: string }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionManagerId: userId }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reassign Production Manager');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/activities`] });
      setIsReassignPmDialogOpen(false);
      setReassignPmUserId("");
      toast({
        title: "Production Manager Reassigned",
        description: "Production Manager has been reassigned successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign Production Manager.",
        variant: "destructive",
      });
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

  // Calculate priority from inHandsDate (same logic as production-report)
  const orderPriority = order.inHandsDate && new Date(order.inHandsDate) <= addDays(new Date(), 7) ? 'high' : 'medium';

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
    if (!emailFrom.trim() || !emailToName.trim() || !emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
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
        recipientName: emailToName,
        subject: emailSubject,
        body: emailBody,
        cc: emailCc || undefined,
        bcc: emailBcc || undefined,
        attachments: emailAttachments,
        attachmentIds,
      });

      setEmailFrom((currentUser as any)?.email || "");
      setEmailFromName(`${(currentUser as any)?.firstName || ""} ${(currentUser as any)?.lastName || ""}`.trim());
      setEmailTo("");
      setEmailCc("");
      setEmailBcc("");
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
    if (!vendorEmailFrom.trim() || !vendorEmailToName.trim() || !vendorEmailTo.trim() || !vendorEmailSubject.trim() || !vendorEmailBody.trim()) {
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
        recipientName: vendorEmailToName,
        subject: vendorEmailSubject,
        body: vendorEmailBody,
        cc: vendorEmailCc || undefined,
        bcc: vendorEmailBcc || undefined,
        attachments: vendorEmailAttachments,
        attachmentIds,
      });

      setVendorEmailFrom((currentUser as any)?.email || "");
      setVendorEmailFromName(`${(currentUser as any)?.firstName || ""} ${(currentUser as any)?.lastName || ""}`.trim());
      setVendorEmailTo("");
      setVendorEmailToName("");
      setVendorEmailCc("");
      setVendorEmailBcc("");
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
      isRush: (order as any).isRush || false,
      shippingMethod: (order as any).shippingMethod || ""
    });
    setIsEditShippingInfoOpen(true);
  };

  const handleOpenEditBillingAddress = () => {
    // Parse billing address from order JSON
    let billing: any = {};
    if ((order as any).billingAddress) {
      try {
        billing = JSON.parse((order as any).billingAddress);
      } catch {
        billing = {};
      }
    }

    setBillingAddressForm({
      street: billing.street || "",
      city: billing.city || "",
      state: billing.state || "",
      zipCode: billing.zipCode || "",
      country: billing.country || "US",
      phone: billing.phone || "",
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
        street: parsed.street || parsed.address || "",
        city: parsed.city || "",
        state: parsed.state || "",
        zipCode: parsed.zipCode || "",
        country: parsed.country || "US",
        phone: parsed.phone || "",
        contactName: parsed.contactName || "",
        email: parsed.email || ""
      });
    } catch {
      // Not JSON, just plain text address - put it in street field
      setShippingAddressForm({
        street: shippingAddr,
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        phone: "",
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
    data.isRush = shippingInfoForm.isRush;
    updateShippingInfoMutation.mutate(data);
  };

  const handleSaveBillingAddress = () => {
    console.log('Saving billing address:', billingAddressForm);
    updateBillingAddressMutation.mutate(billingAddressForm);
  };

  const handleSaveShippingAddress = () => {
    console.log('Saving shipping address form:', shippingAddressForm);
    // Always save as JSON with all fields
    const shippingData = JSON.stringify(shippingAddressForm);

    console.log('Shipping data to save:', shippingData);
    updateShippingAddressMutation.mutate({ shippingAddress: shippingData });
  };

  const handleSaveContact = () => {
    if (selectedContactId) {
      updateOrderContactMutation.mutate(selectedContactId);
    }
  };

  const headerContent = (
    <div className={pageMode ? "mb-6" : ""}>
      <div className="flex flex-wrap items-center gap-3">
        <FileText className="w-6 h-6" />
        <h2 className="text-lg font-semibold">Order #{order.orderNumber}</h2>
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
        {pageMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/orders")}
          >
            <X className="w-4 h-4" />
            Close
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Complete order details, internal communications, and client contact
      </p>
    </div>
  );

  const mainContent = (
    <>
      {headerContent}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-auto gap-2 flex flex-wrap justify-center overflow-x-auto">
              <TabsTrigger value="details" className="flex-shrink-0">Order Details</TabsTrigger>
              <TabsTrigger value="products" className="flex-shrink-0">Products ({orderItems.length})</TabsTrigger>
              <TabsTrigger value="documents" className="flex-shrink-0">Documents</TabsTrigger>
              <TabsTrigger value="files" className="flex-shrink-0">Files</TabsTrigger>
              <TabsTrigger value="communication" className="flex-shrink-0">Internal Notes</TabsTrigger>
              <TabsTrigger value="email" className="flex-shrink-0">Client Communication</TabsTrigger>
              <TabsTrigger value="vendor" className="flex-shrink-0">Vendor Communication</TabsTrigger>
              <TabsTrigger value="activities" className="flex-shrink-0">Activities</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Details */}
                <Card className="col-span-2">
                  <CardHeader className="flex flex-row justify-between py-2">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Order Info
                    </CardTitle>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Order Type</p>
                        <Badge variant="outline" className="mt-1">
                          {order.orderType?.replace('_', ' ').toUpperCase() || 'QUOTE'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Priority</p>
                        <Badge
                          variant={orderPriority === 'high' ? 'default' : 'secondary'}
                          className={`mt-1 ${orderPriority === 'high' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-white'
                            }`}
                        >
                          {orderPriority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <Label htmlFor="order-status">Current Status</Label>
                        <span className="text-xs text-gray-500 mt-1">
                          Change the order status to track progress
                        </span>
                      </div>
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
                    </div>
                    {/* Notes & Special Instructions */}
                    {order.notes && (
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <p className="font-semibold">
                          Order Description
                        </p>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p>
                        </div>
                      </div>
                    )}
                    {(order as any).supplierNotes && (
                      <div className="flex flex-col gap-2">
                        <p className="font-semibold">
                          Supplier Notes
                        </p>
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                          <p className="text-sm text-orange-800 whitespace-pre-line">{(order as any).supplierNotes}</p>
                        </div>
                      </div>
                    )}
                    {(order as any).additionalInformation && (
                      <div className="flex flex-col gap-2">
                        <p className="font-semibold">
                          Additional Information
                        </p>
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <p className="text-sm text-blue-800 whitespace-pre-line">{(order as any).additionalInformation}</p>
                        </div>
                      </div>
                    )}

                    {orderItems.length > 0 && (
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
                    )}

                    {/* Invoice Information */}
                    <div className="space-y-3">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Invoice Status
                        </h3>
                      </div>

                      {invoiceLoading ? (
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Loading invoice...</p>
                        </div>
                      ) : invoice ? (
                        <div className={`border-l-4 rounded-lg p-4 ${invoice.status === 'paid' ? 'border-l-green-500 bg-green-50' : 'border-l-orange-500 bg-orange-50'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Invoice #{invoice.invoiceNumber}</span>
                              <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                                {invoice.status.toUpperCase()}
                              </Badge>
                            </div>
                            {invoice.stripeInvoiceUrl && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </a>
                              </Button>
                            )}
                          </div>
                          
                          {/* Detailed Breakdown */}
                          <div className="space-y-1 mb-2">
                            {/* Subtotal */}
                            <div className="flex items-baseline justify-between text-sm">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-medium text-gray-900">
                                ${Number(invoice.subtotal).toLocaleString()}
                              </span>
                            </div>
                            
                            {/* Shipping */}
                            {Number(order?.shipping) > 0 && (
                              <div className="flex items-baseline justify-between text-sm">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-medium text-gray-900">
                                  ${Number(order.shipping).toLocaleString()}
                                </span>
                              </div>
                            )}
                            
                            {/* Tax */}
                            {invoice.taxAmount && Number(invoice.taxAmount) > 0 && (
                              <div className="flex items-baseline justify-between text-sm">
                                <span className="text-gray-600">Tax</span>
                                <span className="font-medium text-gray-900">
                                  ${Number(invoice.taxAmount).toFixed(2)}
                                </span>
                              </div>
                            )}
                            
                            {/* Total with separator */}
                            <div className="pt-2 border-t border-gray-300">
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                                <span className="text-lg font-bold text-gray-900">
                                  ${Number(invoice.totalAmount).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {invoice.dueDate && invoice.status === 'pending' && (
                            <div className="flex items-center justify-between text-sm mt-2">
                              <span className="text-gray-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due Date
                              </span>
                              <span className="font-medium text-orange-600">
                                {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                          {invoice.paidAt && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-green-700">
                              <CheckCircle className="w-3 h-3" />
                              <span>Paid on {format(new Date(invoice.paidAt), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">No Invoice Generated</p>
                              <p className="text-xs text-gray-500 mt-1">Create an invoice to enable payment processing</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => createInvoiceMutation.mutate()}
                              disabled={order?.status !== 'approved' || createInvoiceMutation.isPending}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              {createInvoiceMutation.isPending ? "Creating..." : "Generate Invoice"}
                            </Button>
                          </div>
                          {order?.status !== 'approved' && (
                            <p className="text-xs text-orange-600 mt-2">
                              Order must be approved first
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                  </CardContent>
                </Card>

                {/* Company & Contact Information */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Order Details
                      </div>

                    </CardTitle>

                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Separator />

                    <div className="space-y-3">

                      <div className="flex items-center justify-between">
                        <h5 className="text-xl font-semibold">Account Info</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOpenEditContact}
                          className="ml-auto"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
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
                          <p className="text-sm font-medium">Contact Email:</p>
                          <span className="text-sm">{primaryContact.email}</span>
                        </div>
                      )}

                      {primaryContact?.phone && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Contact Phone:</p>
                          <span className="text-sm">{primaryContact.phone}</span>
                        </div>
                      )}
                      <h5 className=" font-semibold">Attention To:</h5>
                      <div className="pl-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Sales Rep:</p>
                            <UserAvatar user={assignedUser} size="sm" />
                            <span className="text-sm">{assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Unassigned'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setReassignUserId((order as any)?.assignedUserId || "");
                              setIsReassignDialogOpen(true);
                            }}
                          >
                            <User className="w-3 h-3 mr-1" />
                            {assignedUser ? 'Reassign' : 'Assign'}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">CSR:</p>
                            <UserAvatar user={csrUser} size="sm" />
                            <span className="text-sm">{csrUser ? `${csrUser.firstName} ${csrUser.lastName}` : 'Unassigned'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setReassignCsrUserId((order as any)?.csrUserId || "");
                              setIsReassignCsrDialogOpen(true);
                            }}
                          >
                            <User className="w-3 h-3 mr-1" />
                            {csrUser ? 'Reassign' : 'Assign'}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Production Manager:</p>
                            <UserAvatar user={productionManager} size="sm" />
                            <span className="text-sm">{productionManager ? `${productionManager.firstName} ${productionManager.lastName}` : 'Unassigned'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setReassignPmUserId((order as any)?.productionManagerId || "");
                              setIsReassignPmDialogOpen(true);
                            }}
                          >
                            <User className="w-3 h-3 mr-1" />
                            {productionManager ? 'Reassign' : 'Assign'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Billing Address</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOpenEditBillingAddress}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Billing Contact:</p>
                        <p className="text-sm">
                          {(() => {
                            try {
                              if ((order as any).billingAddress) {
                                const parsed = JSON.parse((order as any).billingAddress);
                                return parsed.contactName || "Not specified";
                              }
                              return "Not specified";
                            } catch {
                              return "Not specified";
                            }
                          })()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Billing Customer Email:</p>
                        <p className="text-sm">
                          {(() => {
                            try {
                              if ((order as any).billingAddress) {
                                const parsed = JSON.parse((order as any).billingAddress);
                                return parsed.email || "Not specified";
                              }
                              return "Not specified";
                            } catch {
                              return "Not specified";
                            }
                          })()}
                        </p>
                      </div>

                      <div className="flex items-start gap-2 w-full">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="text-sm w-full">
                          {(order as any).billingAddress ? (
                            <>
                              {(() => {
                                try {
                                  const parsed = JSON.parse((order as any).billingAddress);
                                  return (
                                    <>
                                      {parsed.street && <p className="text-gray-600">{parsed.street}</p>}
                                      {parsed.city && (
                                        <p className="text-gray-600">
                                          {parsed.city}
                                          {parsed.state && `, ${parsed.state}`}
                                          {parsed.zipCode && ` ${parsed.zipCode}`}
                                        </p>
                                      )}
                                      {parsed.country && <p className="text-gray-600">{parsed.country}</p>}
                                      {parsed.phone && (
                                        <p className="text-gray-600 mt-1"><span className="font-medium">Phone:</span> {parsed.phone}</p>
                                      )}
                                    </>
                                  );
                                } catch {
                                  return <p className="text-gray-600">{(order as any).billingAddress}</p>;
                                }
                              })()}
                            </>
                          ) : companyData?.billingAddress ? (
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
                          variant="outline"
                          size="sm"
                          onClick={handleOpenEditShippingAddress}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Shipping Contact:</p>
                        <p className="text-sm">
                          {(() => {
                            try {
                              if ((order as any).shippingAddress) {
                                const parsed = JSON.parse((order as any).shippingAddress);
                                return parsed.contactName || "Not specified";
                              }
                              return "Not specified";
                            } catch {
                              return "Not specified";
                            }
                          })()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Shipping Customer Email:</p>
                        <p className="text-sm">
                          {(() => {
                            try {
                              if ((order as any).shippingAddress) {
                                const parsed = JSON.parse((order as any).shippingAddress);
                                return parsed.email || "Not specified";
                              }
                              return "Not specified";
                            } catch {
                              return "Not specified";
                            }
                          })()}
                        </p>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="text-sm">
                          {(order as any).shippingAddress ? (
                            <>
                              {(() => {
                                try {
                                  const parsed = JSON.parse((order as any).shippingAddress);
                                  return (
                                    <>
                                      {parsed.street && <p className="text-gray-600">{parsed.street}</p>}
                                      {parsed.city && (
                                        <p className="text-gray-600">
                                          {parsed.city}
                                          {parsed.state && `, ${parsed.state}`}
                                          {parsed.zipCode && ` ${parsed.zipCode}`}
                                        </p>
                                      )}
                                      {parsed.country && <p className="text-gray-600">{parsed.country}</p>}
                                      {parsed.phone && (
                                        <p className="text-gray-600 mt-1"><span className="font-medium">Phone:</span> {parsed.phone}</p>
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
                        Edit
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
                          {(order as any).isRush && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                              RUSH
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
                          <span className="text-sm font-medium">Customer Event Date:</span>
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
                      {order.updatedAt && order.updatedAt !== order.createdAt && (
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span className="text-gray-600">Last updated</span>
                          <span className="text-gray-400">• {new Date(order.updatedAt).toLocaleDateString()}</span>
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
                                {productionStages.find(s => s.id === (order as any).currentStage)?.name
                                  || (order as any).currentStage?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                                  || 'Sales Booked'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {((order as any).stagesCompleted?.length || 1)} / {productionStages.length} Complete
                          </Badge>
                        </div>
                      </div>

                      {/* Stages Timeline */}
                      <div className="space-y-2">
                        {productionStages.map((stage) => {
                          const iconMap: Record<string, any> = {
                            ShoppingCart, FileText, MessageSquare, Eye, ThumbsUp,
                            Package, CreditCard, Truck, MapPin, CheckCircle, Factory, Clock, Calendar
                          };
                          const Icon = iconMap[stage.icon] || Package;
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
              <div className="space-y-4">
                {/* Header with buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddProductDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Find Products
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Source:</span>
                      <Badge variant="outline">Catalog</Badge>
                    </div>
                    {hasUnsavedChanges && (
                      <Badge variant="default" className="bg-orange-500">
                        Unsaved Changes
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleUpdateOrder}
                    disabled={!hasUnsavedChanges || isUpdatingOrder}
                  >
                    {isUpdatingOrder ? "Updating..." : "Update Order"}
                  </Button>
                </div>

                {orderItems.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12 text-gray-500">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">No products in this order yet</p>
                      <p className="text-sm mb-4">Click "Find Products" to add items from your catalog</p>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddProductDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Product
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item: any, itemIndex: number) => {
                      const currentProduct = allProducts.find((p: any) => p.id === item.productId);
                      const currentSupplierId = currentProduct?.supplierId || item.supplierId;
                      const itemSupplier = item.supplierName
                        ? { name: item.supplierName }
                        : currentSupplierId
                          ? suppliers.find((s: any) => s.id === currentSupplierId)
                          : null;

                      // Determine if this supplier has size-based pricing (SanMar, S&S Activewear)
                      const hasSizePricing = itemSupplier && (
                        itemSupplier.name?.toLowerCase().includes('sanmar') ||
                        itemSupplier.name?.toLowerCase().includes('s&s') ||
                        itemSupplier.name?.toLowerCase().includes('s & s')
                      );

                      // Parse colors if available
                      const availableColors = currentProduct?.colors ?
                        (Array.isArray(currentProduct.colors) ? currentProduct.colors :
                          typeof currentProduct.colors === 'string' ? JSON.parse(currentProduct.colors) : [])
                        : [];

                      // Get edited or current item data
                      const editedItem = getEditedItem(item.id, item);
                      const totals = calculateItemTotals(editedItem);
                      const currentMargin = calculateMargin(editedItem.unitPrice, editedItem.cost);
                      const currentProductMargin = totals.productMargin;
                      const currentTotalMargin = totals.totalMargin;

                      return (
                        <Card key={item.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {/* Product Image */}
                              <div className="flex-shrink-0">
                                {currentProduct?.imageUrl ? (
                                  <img
                                    src={currentProduct.imageUrl}
                                    alt={item.productName}
                                    className="w-24 h-24 object-cover rounded border"
                                  />
                                ) : (
                                  <div className="w-24 h-24 bg-gray-100 rounded border flex items-center justify-center">
                                    <Package className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2 text-xs"
                                >
                                  Order In Bulk
                                </Button>
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-600 font-medium">{item.productSku || 'No SKU'}</span>
                                      <span className="text-gray-400 text-xs">{currentProduct?.id?.substring(0, 8)}</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mt-1">{item.productName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-sm text-gray-600">
                                        {itemSupplier?.name || 'No Vendor'}
                                      </span>
                                      {itemSupplier && (
                                        <Badge variant="outline" className="text-xs">
                                          DropShip
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">UOM</span>
                                    <span className="text-sm font-medium">Each</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setDeletingProduct(item);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Color Selection */}
                                {availableColors.length > 0 && (
                                  <div className="mb-3">
                                    <Label className="text-xs text-gray-600 mb-1">Color *</Label>
                                    <Select
                                      value={editedItem.color || ''}
                                      onValueChange={(value) => handleColorChange(item.id, value)}
                                    >
                                      <SelectTrigger className="w-48 h-8">
                                        <SelectValue placeholder="Select color" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableColors.map((color: string) => (
                                          <SelectItem key={color} value={color}>
                                            {color}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {/* Pricing Grid - Different layouts based on supplier */}
                                {hasSizePricing ? (
                                  /* Size-based pricing for SanMar/S&S */
                                  <div className="overflow-x-auto">
                                    <div className="inline-block min-w-full">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Button variant="ghost" size="sm" className="h-6 px-2">
                                          <span className="text-xs">Size ↓ ↓</span>
                                        </Button>
                                        <div className="flex gap-1 overflow-x-auto">
                                          {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                                            <div key={size} className="text-center min-w-[70px]">
                                              <span className="text-xs font-medium">{size}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Cost Row */}
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-600 w-16">Cost</span>
                                        <div className="flex gap-1">
                                          {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                                            <Input
                                              key={size}
                                              type="number"
                                              step="0.01"
                                              className="w-[70px] h-7 text-xs text-center"
                                              placeholder="0.00"
                                              value={formatInputValue(editedItem.sizePricing[size]?.cost)}
                                              onFocus={handleSelectAll}
                                              onChange={(e) => handleSizePricingChange(item.id, size, 'cost', parseFloat(e.target.value) || 0)}
                                            />
                                          ))}
                                        </div>
                                      </div>

                                      {/* Price Row */}
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-600 w-16">Price</span>
                                        <div className="flex gap-1">
                                          {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                                            <Input
                                              key={size}
                                              type="number"
                                              step="0.01"
                                              className="w-[70px] h-7 text-xs text-center"
                                              placeholder="0.00"
                                              value={formatInputValue(editedItem.sizePricing[size]?.price)}
                                              onFocus={handleSelectAll}
                                              onChange={(e) => handleSizePricingChange(item.id, size, 'price', parseFloat(e.target.value) || 0)}
                                            />
                                          ))}
                                        </div>
                                      </div>

                                      {/* Quantity Row */}
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-600 w-16">Quantity</span>
                                        <div className="flex gap-1">
                                          {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                                            <Input
                                              key={size}
                                              type="number"
                                              className="w-[70px] h-7 text-xs text-center"
                                              placeholder="0"
                                              value={formatInputValue(editedItem.sizePricing[size]?.quantity)}
                                              onFocus={handleSelectAll}
                                              onChange={(e) => handleSizePricingChange(item.id, size, 'quantity', parseInt(e.target.value) || 0)}
                                            />
                                          ))}
                                        </div>
                                      </div>

                                      {/* Total Per Unit Row */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600 w-16">Total Per Unit</span>
                                        <div className="flex gap-1">
                                          {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => {
                                            const sizeData = editedItem.sizePricing[size] || { price: 0, quantity: 0 };
                                            const total = (sizeData.price || 0) * (sizeData.quantity || 0);
                                            return (
                                              <div key={size} className="w-[70px] h-7 text-xs flex items-center justify-center border rounded bg-gray-50">
                                                {total.toFixed(2)}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Simple pricing for other vendors */
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                                      <div>Cost</div>
                                      <div>Price</div>
                                      <div>Quantity</div>
                                      <div>Total Per Unit</div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        className="h-8 text-sm"
                                        placeholder="0.00"
                                        value={formatInputValue(editedItem.cost)}
                                        onFocus={handleSelectAll}
                                        onChange={(e) => handleSimplePricingChange(item.id, 'cost', parseFloat(e.target.value) || 0)}
                                      />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        className="h-8 text-sm"
                                        placeholder="0.00"
                                        value={formatInputValue(editedItem.unitPrice)}
                                        onFocus={handleSelectAll}
                                        onChange={(e) => handleSimplePricingChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                                      />
                                      <Input
                                        type="number"
                                        className="h-8 text-sm"
                                        placeholder="0"
                                        value={formatInputValue(editedItem.quantity)}
                                        onFocus={handleSelectAll}
                                        onChange={(e) => handleSimplePricingChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                      />
                                      <div className="h-8 flex items-center justify-center border rounded bg-gray-50 text-sm">
                                        ${((editedItem.quantity || 0) * (editedItem.unitPrice || 0)).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <Separator className="my-3" />
                                {/* Margin and Totals */}
                                <div className="grid grid-cols-5 gap-2 mb-2">
                                  <div className="flex justify-center items-center">
                                    <span className="text-xs font-semibold text-gray-700">Margins</span>
                                  </div>
                                  <div className="flex justify-center items-center">
                                    <span className="text-xs font-semibold text-gray-700">Product Margin</span>
                                  </div>
                                  <div className="flex justify-center items-center">
                                    <span className="text-xs font-semibold text-gray-700">Decoration</span>
                                  </div>
                                  <div className="flex justify-center items-center">
                                    <span className="text-xs font-semibold text-gray-700">Charges</span>
                                  </div>
                                  <div className="flex justify-center items-center">
                                    <span className="text-xs font-semibold text-gray-700">Total Margin</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                  <div className="flex justify-center items-center">
                                    <span className="text-xs text-gray-600">Values</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      className="h-7 text-sm"
                                      postfix="%"
                                      placeholder="0.00"
                                      defaultValue={formatInputValue(currentProductMargin)}
                                      key={`margin-${item.id}-${formatInputValue(currentProductMargin)}`}
                                      onFocus={handleSelectAll}
                                      onBlur={(e) => {
                                        const val = e.target.value.replace(/[^0-9.\-]/g, '');
                                        if (val === '' || val === '-') {
                                          handleProductMarginChange(item.id, 0);
                                          return;
                                        }
                                        const num = parseFloat(val);
                                        if (!isNaN(num)) {
                                          // Clamp to 2 decimal places
                                          const rounded = Math.round(num * 100) / 100;
                                          handleProductMarginChange(item.id, rounded);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          (e.target as HTMLInputElement).blur();
                                        }
                                      }}
                                    />
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      className="h-7 text-sm"
                                      postfix="%"
                                      placeholder="0.00"
                                      defaultValue={formatInputValue(editedItem.decorationCost)}
                                      key={`deco-${item.id}-${formatInputValue(editedItem.decorationCost)}`}
                                      onFocus={handleSelectAll}
                                      onBlur={(e) => {
                                        const val = e.target.value.replace(/[^0-9.\-]/g, '');
                                        const num = parseFloat(val) || 0;
                                        handleDecorationChange(item.id, Math.round(num * 100) / 100);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          (e.target as HTMLInputElement).blur();
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      className="h-7 text-sm"
                                      postfix="%"
                                      placeholder="0.00"
                                      defaultValue={formatInputValue(editedItem.charges)}
                                      key={`charges-${item.id}-${formatInputValue(editedItem.charges)}`}
                                      onFocus={handleSelectAll}
                                      onBlur={(e) => {
                                        const val = e.target.value.replace(/[^0-9.\-]/g, '');
                                        const num = parseFloat(val) || 0;
                                        handleChargesChange(item.id, Math.round(num * 100) / 100);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          (e.target as HTMLInputElement).blur();
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 flex items-center justify-center border rounded bg-gray-100 text-sm font-semibold px-3 w-full">
                                      {currentTotalMargin.toFixed(2)}%
                                    </div>
                                  </div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="mt-2 grid grid-cols-5 gap-2">
                                  <div className="text-center">
                                    <span className="text-xs mb-1 text-gray-600">Quantity</span>
                                    <Input
                                      type="number"
                                      className="h-7 text-center text-sm font-medium"
                                      placeholder="0"
                                      value={formatInputValue(editedItem.quantity)}
                                      onFocus={handleSelectAll}
                                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs text-gray-600 mb-1">Product</span>
                                    <div className="bg-blue-500 text-white rounded px-2 py-1 text-sm font-semibold">
                                      ${totals.productTotal.toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs text-gray-600 mb-1">Decoration</span>
                                    <div className="bg-blue-500 text-white rounded px-2 py-1 text-sm font-semibold">
                                      ${totals.decorationTotal.toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs text-gray-600 mb-1">Charges</span>
                                    <div className="bg-blue-500 text-white rounded px-2 py-1 text-sm font-semibold">
                                      ${totals.chargesTotal.toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs text-gray-600 mb-1">Total</span>
                                    <div className="bg-blue-600 text-white rounded px-2 py-1 text-sm font-bold">
                                      ${totals.total.toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                {/* Action Icons */}
                                <div className="mt-3 grid grid-cols-5 items-end gap-2">
                                  <div className="text-center">
                                    <span className="text-xs mb-1 text-gray-600">UOM Factory</span>
                                    <Input
                                      type="number"
                                      className="h-7 text-center text-sm font-medium"
                                      placeholder="e.g., 12"
                                      value={formatInputValue(editedItem.uomFactory)}
                                      onFocus={handleSelectAll}
                                      onChange={(e) => handleUomFactoryChange(item.id, parseInt(e.target.value) || 0)}
                                    />
                                    {editedItem.uomFactory && editedItem.uomFactory > 0 && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        = {totals.factoryQuantity} {totals.factoryQuantity > 1 ? 'units' : 'unit'}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex col-span-4 items-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      title="Add Decoration"
                                      onClick={() => {
                                        // Focus on decoration input
                                        const input = document.querySelector(`input[value="${editedItem.decorationCost || ''}"]`) as HTMLInputElement;
                                        input?.focus();
                                      }}
                                    >
                                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <Plus className="w-4 h-4 text-white" />
                                      </div>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      title="Add Notes"
                                      onClick={() => {
                                        // TODO: Open notes dialog
                                        toast({
                                          title: "Coming Soon",
                                          description: "Notes feature will be available soon.",
                                        });
                                      }}
                                    >
                                      <MessageSquare className="w-5 h-5 text-gray-400" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      title="More options"
                                    >
                                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <Plus className="w-4 h-4 text-white" />
                                      </div>
                                    </Button>
                                  </div>
                                </div>

                                {/* Artwork Management Section - Outside Grid */}
                                <div className="mt-4 flex items-center gap-2 relative z-10">
                                  {/* View Artworks Button */}
                                  <Button
                                    type="button"
                                    variant={allArtworkItems[item.id]?.length > 0 ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 text-xs relative z-10 pointer-events-auto"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleArtworkList(item.id);
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Artworks
                                    {allArtworkItems[item.id]?.length > 0 && (
                                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                                        {allArtworkItems[item.id].length}
                                      </Badge>
                                    )}
                                  </Button>
                                  {/* Add Artwork Button */}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs relative z-10 pointer-events-auto"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleOpenArtworkDialog(item.id);
                                    }}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Artwork
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Update message at bottom if items exist */}
                {orderItems.length > 0 && hasUnsavedChanges && (
                  <div className="text-sm text-orange-600 font-medium text-center py-2 bg-orange-50 rounded border border-orange-200">
                    You have unsaved changes. Click "Update Order" to save your changes.
                  </div>
                )}
                {orderItems.length > 0 && !hasUnsavedChanges && (
                  <div className="text-sm text-gray-500 italic text-center py-2">
                    All changes saved. Edit any field to make changes.
                  </div>
                )}
              </div>
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
                artworkItems={allArtworkItems}
                onSwitchToEmail={(emailData) => {
                  setEmailSubject(emailData.subject);
                  setEmailBody(emailData.body);
                  // Set default recipient from primary contact
                  if (primaryContact) {
                    setEmailTo(primaryContact.email);
                    setEmailToName(`${primaryContact.firstName} ${primaryContact.lastName}`);
                  }
                  setActiveTab("email");
                }}
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <DocumentsTab
                orderId={orderId!}
                order={order}
                orderItems={orderItems}
                orderVendors={orderVendors}
                companyName={companyName}
                primaryContact={primaryContact}
                getEditedItem={getEditedItem}
                calculateItemTotals={calculateItemTotals}
                onSendEmail={(data) => {
                  // Track if status should be updated after email is sent
                  setPendingStatusUpdate((data as any).updateStatusOnSend || null);

                  if (data.type === 'client') {
                    // Auto-fill client communication tab
                    setEmailTo(data.to);
                    setEmailToName(data.toName);
                    setEmailSubject(data.subject);
                    setEmailBody(data.body);
                    if (primaryContact) {
                      setEmailTo(primaryContact.email || data.to);
                      setEmailToName(`${primaryContact.firstName} ${primaryContact.lastName}` || data.toName);
                    }
                    setActiveTab("email");
                  } else {
                    // Auto-fill vendor communication tab
                    if (data.vendorId) {
                      const vendor = orderVendors.find((v: any) => v.id === data.vendorId);
                      if (vendor) {
                        setSelectedVendor(vendor);
                      }
                    }
                    setVendorEmailTo(data.to);
                    setVendorEmailToName(data.toName);
                    setVendorEmailSubject(data.subject);
                    setVendorEmailBody(data.body);
                    setActiveTab("vendor");
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="activities" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activity Timeline
                  </CardTitle>
                  <CardDescription>Complete history of all actions on this order</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No activity yet</p>
                      <p className="text-xs mt-1">Actions on this order will appear here</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gray-200" />
                      <div className="space-y-4">
                        {activities.map((activity: ProjectActivity) => {
                          const timeAgo = new Date(activity.createdAt).toLocaleString();
                          const userName = activity.user
                            ? `${activity.user.firstName} ${activity.user.lastName}`
                            : activity.isSystemGenerated ? "System" : "Unknown";

                          const getActivityIcon = () => {
                            switch (activity.activityType) {
                              case "status_change":
                                return <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />;
                              case "comment":
                                return <MessageSquare className="w-3.5 h-3.5 text-green-600" />;
                              case "system_action":
                                return <Zap className="w-3.5 h-3.5 text-purple-600" />;
                              case "file_upload":
                                return <Upload className="w-3.5 h-3.5 text-orange-600" />;
                              case "mention":
                                return <AtSign className="w-3.5 h-3.5 text-indigo-600" />;
                              default:
                                return <Activity className="w-3.5 h-3.5 text-gray-600" />;
                            }
                          };

                          const getActivityBg = () => {
                            switch (activity.activityType) {
                              case "status_change": return "bg-blue-100 border-blue-300";
                              case "comment": return "bg-green-100 border-green-300";
                              case "system_action": return "bg-purple-100 border-purple-300";
                              case "file_upload": return "bg-orange-100 border-orange-300";
                              case "mention": return "bg-indigo-100 border-indigo-300";
                              default: return "bg-gray-100 border-gray-300";
                            }
                          };

                          return (
                            <div key={activity.id} className="relative flex gap-3 pl-0">
                              {/* Icon */}
                              <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center ${getActivityBg()}`}>
                                {getActivityIcon()}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pb-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-medium text-gray-900">{userName}</span>
                                  {activity.isSystemGenerated && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">System</Badge>
                                  )}
                                  <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{timeAgo}</span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                  {activity.content}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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

            <TabsContent value="email" className="mt-6 flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Client Communication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Subject:</label>
                      <Input
                        placeholder={`Re: Order #${order.orderNumber}`}
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        data-testid="input-email-subject"
                      />
                    </div>
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
                            variant="outline"
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
                            variant="outline"
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
                      <div className="relative">
                        <Input
                          placeholder="client@company.com"
                          value={emailTo}
                          onChange={(e) => {
                            setEmailTo(e.target.value);
                            setEmailSearchQuery(e.target.value);
                          }}
                          onFocus={() => setEmailSearchQuery(emailTo)}
                          onBlur={() => setTimeout(() => setEmailSearchQuery(""), 200)}
                          data-testid="input-email-to"
                        />
                        {emailSearchQuery && contacts.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {contacts
                              .filter((c: any) =>
                                c.email?.toLowerCase().includes(emailSearchQuery.toLowerCase()) ||
                                `${c.firstName} ${c.lastName}`.toLowerCase().includes(emailSearchQuery.toLowerCase())
                              )
                              .slice(0, 5)
                              .map((contact: any) => (
                                <button
                                  key={contact.id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                  onClick={() => {
                                    setEmailTo(contact.email);
                                    setEmailToName(`${contact.firstName} ${contact.lastName}`);
                                    setEmailSearchQuery("");
                                  }}
                                >
                                  <div>
                                    <div className="font-medium text-sm">{contact.firstName} {contact.lastName}</div>
                                    <div className="text-xs text-gray-500">{contact.email}</div>
                                  </div>
                                </button>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">To Name:</label>
                      <Input
                        placeholder="Your Client Name"
                        value={emailToName}
                        onChange={(e) => setEmailToName(e.target.value)}
                        data-testid="input-email-to-name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">CC (optional):</label>
                      <Input
                        placeholder="cc@email.com (comma-separated for multiple)"
                        value={emailCc}
                        onChange={(e) => setEmailCc(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">BCC (optional):</label>
                      <Input
                        placeholder="bcc@email.com (comma-separated for multiple)"
                        value={emailBcc}
                        onChange={(e) => setEmailBcc(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="">
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
                        className="mt-1 relative"
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
                  </div>

                  {emailAttachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {emailAttachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEmailAttachments(prev => prev.filter((_, i) => i !== index))}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

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
                </CardContent>
              </Card>

              {/* Recent Client Communications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Client Communications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {clientCommunications.length === 0 ? (
                      <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                        No client communications yet. Send your first email above.
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
                            <p className="text-sm text-gray-700 line-clamp-2">{stripHtml(comm.body)}</p>
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
            </TabsContent>

            <TabsContent value="vendor" className="mt-6">

              <div className="flex flex-col gap-6">
                {/* Vendor Communication */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Vendor Communication
                    </CardTitle>
                    <CardDescription>
                      {orderVendors.length > 0
                        ? `${orderVendors.length} vendor${orderVendors.length > 1 ? 's' : ''} from order items`
                        : "No vendors assigned to order items"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Vendor Selector */}
                    {orderVendors.length > 0 ? (
                      <div>
                        <label className="text-sm font-medium">Select Vendor:</label>
                        <Select
                          value={selectedVendor?.id || ""}
                          onValueChange={(vendorId) => {
                            const vendor = orderVendors.find((v: any) => v.id === vendorId);
                            if (vendor) {
                              setSelectedVendor(vendor);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a vendor from order items..." />
                          </SelectTrigger>
                          <SelectContent>
                            {orderVendors.map((vendor: any) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{vendor.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {vendor.products.length} product{vendor.products.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Contact info */}
                        {selectedVendor && vendorContacts.length > 0 && vendorPrimaryContact && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-xs font-medium text-blue-900">Contact: {vendorPrimaryContact.firstName} {vendorPrimaryContact.lastName}</p>
                            <p className="text-xs text-blue-700">{vendorPrimaryContact.email}</p>
                            {vendorPrimaryContact.phone && (
                              <p className="text-xs text-blue-700">{vendorPrimaryContact.phone}</p>
                            )}
                          </div>
                        )}

                        {/* Warning if no contacts */}
                        {selectedVendor && vendorContacts.length === 0 && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-xs font-medium text-amber-900">⚠️ No contacts for this vendor</p>
                            <p className="text-xs text-amber-700">Please add a contact for {selectedVendor.name} in the Suppliers page.</p>
                          </div>
                        )}

                        {/* Show products for selected vendor */}
                        {selectedVendor && selectedVendor.products && selectedVendor.products.length > 0 && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                            <p className="text-xs font-medium text-gray-700 mb-2">Products from this vendor:</p>
                            <div className="space-y-1">
                              {selectedVendor.products.map((product: any) => (
                                <div key={product.id} className="text-xs text-gray-600 flex items-center gap-2">
                                  <Package className="w-3 h-3" />
                                  <span className="font-medium">{product.productName}</span>
                                  {product.productSku && <span className="text-gray-400">({product.productSku})</span>}
                                  <span>× {product.quantity}</span>
                                  {product.color && <Badge variant="outline" className="text-xs">{product.color}</Badge>}
                                  {product.size && <Badge variant="outline" className="text-xs">{product.size}</Badge>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          ⚠️ No vendors found. Please assign suppliers to your order items first.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">Subject:</label>
                      <Input
                        placeholder={`Production Update - Order #${order.orderNumber}`}
                        value={vendorEmailSubject}
                        onChange={(e) => setVendorEmailSubject(e.target.value)}
                        data-testid="input-vendor-email-subject"
                        disabled={orderVendors.length === 0}
                      />
                    </div>
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
                              variant="outline"
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
                              variant="outline"
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
                        <label className="text-sm font-medium">To (Vendor Contact Email):</label>
                        <Input
                          placeholder={vendorPrimaryContact?.email || "vendor@supplier.com"}
                          value={vendorEmailTo || ""}
                          onChange={(e) => setVendorEmailTo(e.target.value)}
                          data-testid="input-vendor-email-to"
                          disabled={orderVendors.length === 0 || (selectedVendor && vendorContacts.length === 0)}
                        />
                        {selectedVendor && vendorContacts.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠️ No contact found for this vendor. Add a contact first.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium">To Name:</label>
                        <Input
                          placeholder={vendorPrimaryContact ? `${vendorPrimaryContact.firstName} ${vendorPrimaryContact.lastName}` : selectedVendor?.name || "Vendor Name"}
                          value={vendorEmailToName || ""}
                          onChange={(e) => setVendorEmailToName(e.target.value)}
                          data-testid="input-vendor-email-to-name"
                          disabled={orderVendors.length === 0 || (selectedVendor && vendorContacts.length === 0)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">CC (optional):</label>
                        <Input
                          placeholder="cc@vendor.com (comma-separated for multiple)"
                          value={vendorEmailCc}
                          onChange={(e) => setVendorEmailCc(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">BCC (optional):</label>
                        <Input
                          placeholder="bcc@vendor.com (comma-separated for multiple)"
                          value={vendorEmailBcc}
                          onChange={(e) => setVendorEmailBcc(e.target.value)}
                        />
                      </div>
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
                                variant="outline"
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
                        disabled={!vendorEmailFrom || !vendorEmailTo || !vendorEmailSubject || !vendorEmailBody.trim() || orderVendors.length === 0}
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
                                <p className="text-sm text-gray-700 line-clamp-2">{stripHtml(comm.body)}</p>
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
    </>
  );

  return (
    <>
      {pageMode ? (
        <div className="p-6 pb-6 space-y-4">
          {mainContent}
        </div>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[95vw] md:max-w-[80vw] p-4 max-h-[95vh] overflow-y-auto">
            {mainContent}
          </DialogContent>
        </Dialog>
      )}
      <OrderModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            // Refresh order items and order data when OrderModal closes
            queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
            queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
          }
        }}
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
              Remove Item from Order?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deletingProduct?.productName}</strong> from this order?
              {deletingProduct?.productSku && (
                <span className="block mt-1 text-xs text-gray-500">SKU: {deletingProduct.productSku}</span>
              )}
              <span className="block mt-2 text-orange-600 font-medium">
                This will only remove the item from this order. The product will remain in your catalog.
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
                  deleteOrderItemMutation.mutate(deletingProduct.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteOrderItemMutation.isPending}
            >
              {deleteOrderItemMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Item
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
            <div>
              <Label htmlFor="billing-phone">Phone</Label>
              <Input
                id="billing-phone"
                type="tel"
                value={billingAddressForm.phone}
                onChange={(e) => setBillingAddressForm({ ...billingAddressForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
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
                  if (order?.billingAddress) {
                    try {
                      const billing = JSON.parse(order.billingAddress);
                      setShippingAddressForm({
                        street: billing.street || "",
                        city: billing.city || "",
                        state: billing.state || "",
                        zipCode: billing.zipCode || "",
                        country: billing.country || "US",
                        phone: billing.phone || "",
                        contactName: billing.contactName || "",
                        email: billing.email || ""
                      });
                    } catch {
                      toast({
                        title: "Error",
                        description: "Could not copy billing address",
                        variant: "destructive"
                      });
                    }
                  }
                }}
              >
                📋 Copy from Billing Address
              </Button>
            </div>

            <div>
              <Label htmlFor="shipping-street">Street Address</Label>
              <Input
                id="shipping-street"
                value={shippingAddressForm.street}
                onChange={(e) => setShippingAddressForm({ ...shippingAddressForm, street: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="shipping-city">City</Label>
                <Input
                  id="shipping-city"
                  value={shippingAddressForm.city}
                  onChange={(e) => setShippingAddressForm({ ...shippingAddressForm, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="shipping-state">State</Label>
                <Input
                  id="shipping-state"
                  value={shippingAddressForm.state}
                  onChange={(e) => setShippingAddressForm({ ...shippingAddressForm, state: e.target.value })}
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="shipping-zip">ZIP Code</Label>
                <Input
                  id="shipping-zip"
                  value={shippingAddressForm.zipCode}
                  onChange={(e) => setShippingAddressForm({ ...shippingAddressForm, zipCode: e.target.value })}
                  placeholder="12345"
                />
              </div>
              <div>
                <Label htmlFor="shipping-country">Country</Label>
                <Input
                  id="shipping-country"
                  value={shippingAddressForm.country}
                  onChange={(e) => setShippingAddressForm({ ...shippingAddressForm, country: e.target.value })}
                  placeholder="US"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="shipping-phone">Phone</Label>
              <Input
                id="shipping-phone"
                type="tel"
                value={shippingAddressForm.phone}
                onChange={(e) => setShippingAddressForm({ ...shippingAddressForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <Separator />

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
                <Label htmlFor="shipping-email">Contact Email</Label>
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
              <div className="flex items-center gap-6 pt-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-firm"
                    checked={shippingInfoForm.isFirm}
                    onChange={(e) => setShippingInfoForm({ ...shippingInfoForm, isFirm: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is-firm">Firm In-Hands Date</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-rush"
                    checked={shippingInfoForm.isRush}
                    onChange={(e) => setShippingInfoForm({ ...shippingInfoForm, isRush: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is-rush" className="text-red-600 font-medium">Rush Order</Label>
                </div>
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

      {/* Add Product Dialog */}
      <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product to Order</DialogTitle>
            <DialogDescription>
              Select a product and specify quantity and pricing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Label htmlFor="add-product">Product *</Label>
              <Input
                id="add-product"
                type="text"
                placeholder="Search product by name or SKU..."
                value={productSearchQuery}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                onBlur={() => {
                  // Delay to allow click on dropdown item
                  setTimeout(() => setShowProductDropdown(false), 200);
                }}
              />

              {/* Selected Product Display */}
              {newProductForm.productId && (() => {
                const selectedProduct = allProducts.find((p: any) => p.id === newProductForm.productId);
                return selectedProduct ? (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{selectedProduct.name}</p>
                      <p className="text-xs text-gray-600">
                        {selectedProduct.sku && `SKU: ${selectedProduct.sku} • `}
                        Price: ${Number(selectedProduct.basePrice || 0).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewProductForm({ ...newProductForm, productId: "", unitPrice: "0" });
                        setProductSearchQuery("");
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                ) : null;
              })()}

              {/* Dropdown */}
              {showProductDropdown && (() => {
                const filteredProducts = allProducts.filter((p: any) => {
                  const search = productSearchQuery.toLowerCase();
                  return (
                    p.name?.toLowerCase().includes(search) ||
                    p.sku?.toLowerCase().includes(search)
                  );
                }).slice(0, 10);

                return filteredProducts.length > 0 ? (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.map((product: any) => (
                      <button
                        key={product.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 cursor-pointer"
                        onMouseDown={(e) => {
                          // Prevent blur from firing before click completes
                          e.preventDefault();
                        }}
                        onClick={async () => {
                          console.log('Product selected:', product.id, product.name);
                          
                          // Check if the product's supplier has doNotOrder status via API
                          if (product.supplierId) {
                            try {
                              const response = await fetch(
                                `/api/vendor-approvals/check/${product.supplierId}?orderId=${orderId}`,
                                { credentials: "include" }
                              );
                              const data = await response.json();
                              
                              if (data.requiresApproval) {
                                // Vendor is blocked and no approved request for this order
                                setBlockedVendor({ id: data.supplier.id, name: data.supplier.name || 'Unknown Vendor' });
                                setPendingProduct(product);
                                setShowProductDropdown(false);
                                setShowVendorApprovalDialog(true);
                                return;
                              }
                            } catch (error) {
                              console.error('Error checking vendor approval:', error);
                            }
                          }
                          
                          setNewProductForm({
                            ...newProductForm,
                            productId: product.id,
                            unitPrice: (Number(product.basePrice) || 0).toFixed(2),
                          });
                          setProductSearchQuery(product.name);
                          setShowProductDropdown(false);
                        }}
                      >
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-gray-600">
                          {product.sku && `SKU: ${product.sku} • `}
                          Price: ${Number(product.basePrice || 0).toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : productSearchQuery ? (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-sm text-gray-500">
                    No products found
                  </div>
                ) : null;
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-quantity">Quantity *</Label>
                <Input
                  id="add-quantity"
                  type="number"
                  min="1"
                  value={newProductForm.quantity}
                  onChange={(e) => setNewProductForm({ ...newProductForm, quantity: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="add-unit-price">Unit Price *</Label>
                <Input
                  id="add-unit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProductForm.unitPrice}
                  onChange={(e) => setNewProductForm({ ...newProductForm, unitPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-color">Color</Label>
                <Input
                  id="add-color"
                  value={newProductForm.color}
                  onChange={(e) => setNewProductForm({ ...newProductForm, color: e.target.value })}
                  placeholder="e.g., Red, Blue"
                />
              </div>
              <div>
                <Label htmlFor="add-size">Size</Label>
                <Input
                  id="add-size"
                  value={newProductForm.size}
                  onChange={(e) => setNewProductForm({ ...newProductForm, size: e.target.value })}
                  placeholder="e.g., S, M, L, XL"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-imprint-location">Imprint Location</Label>
                <Input
                  id="add-imprint-location"
                  value={newProductForm.imprintLocation}
                  onChange={(e) => setNewProductForm({ ...newProductForm, imprintLocation: e.target.value })}
                  placeholder="e.g., Front Center"
                />
              </div>
              <div>
                <Label htmlFor="add-imprint-method">Imprint Method</Label>
                <Input
                  id="add-imprint-method"
                  value={newProductForm.imprintMethod}
                  onChange={(e) => setNewProductForm({ ...newProductForm, imprintMethod: e.target.value })}
                  placeholder="e.g., Screen Print, Embroidery"
                />
              </div>
            </div>

            {newProductForm.productId && newProductForm.quantity && newProductForm.unitPrice && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-800">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${(parseFloat(newProductForm.quantity) * parseFloat(newProductForm.unitPrice)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAddProductDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={addOrderItemMutation.isPending} className="flex-1">
              {addOrderItemMutation.isPending ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Order Item Dialog */}
      <Dialog open={isEditOrderItemOpen} onOpenChange={setIsEditOrderItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Order Item</DialogTitle>
            <DialogDescription>
              Update quantity, price, color, and size for {editingOrderItem?.productName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Product</p>
              <p className="font-semibold">{editingOrderItem?.productName}</p>
              {editingOrderItem?.productSku && (
                <p className="text-xs text-gray-500">SKU: {editingOrderItem.productSku}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-quantity">Quantity *</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={orderItemForm.quantity}
                  onChange={(e) => setOrderItemForm({ ...orderItemForm, quantity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-unit-price">Unit Price *</Label>
                <Input
                  id="edit-unit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderItemForm.unitPrice}
                  onChange={(e) => setOrderItemForm({ ...orderItemForm, unitPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  value={orderItemForm.color}
                  onChange={(e) => setOrderItemForm({ ...orderItemForm, color: e.target.value })}
                  placeholder="e.g., Red, Blue"
                />
              </div>
              <div>
                <Label htmlFor="edit-size">Size</Label>
                <Input
                  id="edit-size"
                  value={orderItemForm.size}
                  onChange={(e) => setOrderItemForm({ ...orderItemForm, size: e.target.value })}
                  placeholder="e.g., S, M, L, XL"
                />
              </div>
            </div>

            {orderItemForm.quantity && orderItemForm.unitPrice && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-800">New Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${(parseFloat(orderItemForm.quantity) * parseFloat(orderItemForm.unitPrice)).toFixed(2)}
                  </span>
                </div>
                {editingOrderItem && (
                  <p className="text-xs text-gray-600 mt-1">
                    Previous: ${(editingOrderItem.quantity * parseFloat(editingOrderItem.unitPrice)).toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditOrderItemOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveOrderItem} disabled={updateOrderItemMutation.isPending} className="flex-1">
              {updateOrderItemMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Artwork List Dialog */}
      <Dialog open={isArtworkListDialogOpen} onOpenChange={setIsArtworkListDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <span>Artwork List</span>
              <Button
                size="sm"
                onClick={() => {
                  setIsArtworkListDialogOpen(false);
                  handleOpenArtworkDialog(currentOrderItemId!);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Artwork
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {currentOrderItemId && allArtworkItems[currentOrderItemId]?.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {allArtworkItems[currentOrderItemId].map((artwork: any) => (
                  <Card key={artwork.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Artwork Image Preview */}
                        {artwork.filePath && (
                          <div className="relative w-48 h-48 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={artwork.filePath}
                              alt={artwork.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3ENo Preview%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        )}

                        {/* Artwork Details */}
                        <div className="w-full ">
                          <h3 className="font-semibold text-lg md:text-xl text-gray-900">{artwork.name}</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="col-span-2 flex gap-2 items-center">
                              <span className="font-medium text-gray-700">Status:</span>
                              <div className="mt-1">
                                <Badge
                                  variant={artwork.status === 'approved' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {artwork.status}
                                </Badge>
                              </div>
                            </div>
                            {artwork.artworkType && (
                              <div className="flex gap-2 items-center">
                                <span className="font-medium text-gray-700">Type:</span>
                                <div className="text-gray-900">{artwork.artworkType}</div>
                              </div>
                            )}
                            {artwork.location && (
                              <div className="flex gap-2 items-center">
                                <span className="font-medium text-gray-700">Location:</span>
                                <div className="text-gray-900">{artwork.location}</div>
                              </div>
                            )}
                            {artwork.color && (
                              <div className="flex gap-2 items-center">
                                <span className="font-medium text-gray-700">Color:</span>
                                <div className="text-gray-900">{artwork.color}</div>
                              </div>
                            )}
                            {artwork.size && (
                              <div className="flex gap-2 items-center">
                                <span className="font-medium text-gray-700">Size:</span>
                                <div className="text-gray-900">{artwork.size}</div>
                              </div>
                            )}

                            {artwork.fileName && (
                              <div className="col-span-2 flex gap-2 items-center">
                                <span className="font-medium text-gray-700">File:</span>
                                <div className="text-gray-900 truncate">{artwork.fileName}</div>
                              </div>
                            )}
                            {artwork.notes && (
                              <div className="col-span-2">
                                <span className="font-medium text-gray-700">Notes:</span>
                                <div className="text-gray-900">{artwork.notes}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col justify-start h-full gap-2">
                          <Button
                            variant="outline"
                            size="lg"
                            className="flex-1 py-2"
                            onClick={() => {
                              handleEditArtwork(currentOrderItemId, artwork);
                              setIsArtworkListDialogOpen(false);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            className="flex-1 py-2 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteArtwork(currentOrderItemId, artwork.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No artworks yet</p>
                <p className="text-sm mb-4">Click "Add Artwork" to create your first artwork</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Artwork Dialog */}
      <Dialog open={isArtworkDialogOpen} onOpenChange={setIsArtworkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingArtwork ? 'Edit' : 'Add'} Artwork</DialogTitle>
            <DialogDescription>
              {editingArtwork ? 'Update' : 'Add'} artwork details for this product
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="artwork-name">Artwork Name *</Label>
                <Input
                  id="artwork-name"
                  placeholder="e.g., Company Logo"
                  value={artworkForm.name}
                  onChange={(e) => setArtworkForm({ ...artworkForm, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="artwork-type">Artwork Type</Label>
                <Select
                  value={artworkForm.artworkType}
                  onValueChange={(value) => setArtworkForm({ ...artworkForm, artworkType: value })}
                >
                  <SelectTrigger id="artwork-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="embroidery">Embroidery</SelectItem>
                    <SelectItem value="screen-print">Screen Print</SelectItem>
                    <SelectItem value="heat-transfer">Heat Transfer</SelectItem>
                    <SelectItem value="dtg">Direct to Garment (DTG)</SelectItem>
                    <SelectItem value="sublimation">Sublimation</SelectItem>
                    <SelectItem value="laser-engraving">Laser Engraving</SelectItem>
                    <SelectItem value="pad-print">Pad Print</SelectItem>
                    <SelectItem value="deboss">Deboss</SelectItem>
                    <SelectItem value="emboss">Emboss</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="artwork-location">Location</Label>
                <Input
                  id="artwork-location"
                  placeholder="e.g., Front - Centered"
                  value={artworkForm.location}
                  onChange={(e) => setArtworkForm({ ...artworkForm, location: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="artwork-color">Color</Label>
                <Input
                  id="artwork-color"
                  placeholder="e.g., White, PMS 186"
                  value={artworkForm.color}
                  onChange={(e) => setArtworkForm({ ...artworkForm, color: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="artwork-size">Size</Label>
                <Input
                  id="artwork-size"
                  placeholder='e.g., 3" x 3"'
                  value={artworkForm.size}
                  onChange={(e) => setArtworkForm({ ...artworkForm, size: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="artwork-status">Status</Label>
                <Select
                  value={artworkForm.status}
                  onValueChange={(value) => setArtworkForm({ ...artworkForm, status: value })}
                >
                  <SelectTrigger id="artwork-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="revision-needed">Revision Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="artwork-file">Artwork File</Label>
                <div className="mt-1">
                  <input
                    id="artwork-file"
                    type="file"
                    accept="image/*,.pdf,.ai,.eps,.svg"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setArtworkForm({ ...artworkForm, file });
                    }}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  {artworkForm.file && (
                    <p className="text-xs text-gray-600 mt-1">
                      Selected: {artworkForm.file.name}
                    </p>
                  )}
                  {editingArtwork?.fileName && !artworkForm.file && (
                    <p className="text-xs text-gray-600 mt-1">
                      Current: {editingArtwork.fileName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsArtworkDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveArtwork}
              className="flex-1"
            >
              {editingArtwork ? 'Update' : 'Add'} Artwork
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign Sales Rep Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Sales Rep</DialogTitle>
            <DialogDescription>
              Select a team member to assign as the sales representative for this order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reassign-user">Team Member</Label>
              <Select value={reassignUserId} onValueChange={setReassignUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Unassign (No one)</span>
                    </div>
                  </SelectItem>
                  {teamMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={member} size="sm" />
                        <div>
                          <div className="font-medium">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {assignedUser && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Currently Assigned To:</p>
                <div className="flex items-center gap-2">
                  <UserAvatar user={assignedUser} size="sm" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      {assignedUser.firstName} {assignedUser.lastName}
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
                  if (orderId) {
                    reassignSalesRepMutation.mutate({
                      orderId,
                      userId: reassignUserId === "unassigned" ? "" : reassignUserId
                    });
                  }
                }}
                disabled={!reassignUserId || reassignSalesRepMutation.isPending}
              >
                {reassignSalesRepMutation.isPending ? "Reassigning..." : "Reassign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign CSR Dialog */}
      <Dialog open={isReassignCsrDialogOpen} onOpenChange={setIsReassignCsrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign CSR</DialogTitle>
            <DialogDescription>
              Select a team member to assign as the customer service representative for this order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reassign-csr-user">Team Member</Label>
              <Select value={reassignCsrUserId} onValueChange={setReassignCsrUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Unassign (No one)</span>
                    </div>
                  </SelectItem>
                  {teamMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={member} size="sm" />
                        <div>
                          <div className="font-medium">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {csrUser && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Currently Assigned CSR:</p>
                <div className="flex items-center gap-2">
                  <UserAvatar user={csrUser} size="sm" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      {csrUser.firstName} {csrUser.lastName}
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
                  if (orderId) {
                    reassignCsrMutation.mutate({
                      orderId,
                      userId: reassignCsrUserId === "unassigned" ? "" : reassignCsrUserId
                    });
                  }
                }}
                disabled={!reassignCsrUserId || reassignCsrMutation.isPending}
              >
                {reassignCsrMutation.isPending ? "Reassigning..." : "Reassign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign Production Manager Dialog */}
      <Dialog open={isReassignPmDialogOpen} onOpenChange={setIsReassignPmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Production Manager</DialogTitle>
            <DialogDescription>
              Select a team member to assign as the production manager for this order. They will be notified when the quote is approved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reassign-pm-user">Team Member</Label>
              <Select value={reassignPmUserId} onValueChange={setReassignPmUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Unassign (No one)</span>
                    </div>
                  </SelectItem>
                  {teamMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={member} size="sm" />
                        <div>
                          <div className="font-medium">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {productionManager && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs font-medium text-purple-900 mb-1">Currently Assigned Production Manager:</p>
                <div className="flex items-center gap-2">
                  <UserAvatar user={productionManager} size="sm" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-900">
                      {productionManager.firstName} {productionManager.lastName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReassignPmDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (orderId) {
                    reassignPmMutation.mutate({
                      orderId,
                      userId: reassignPmUserId === "unassigned" ? "" : reassignPmUserId
                    });
                  }
                }}
                disabled={!reassignPmUserId || reassignPmMutation.isPending}
              >
                {reassignPmMutation.isPending ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vendor Approval Dialog - for Do Not Order vendors */}
      {blockedVendor && (
        <VendorApprovalDialog
          open={showVendorApprovalDialog}
          onOpenChange={setShowVendorApprovalDialog}
          vendor={blockedVendor}
          orderId={orderId || undefined}
          productId={pendingProduct?.id}
          onApprovalRequested={() => {
            setShowVendorApprovalDialog(false);
            setBlockedVendor(null);
            setPendingProduct(null);
          }}
          onCancel={() => {
            setShowVendorApprovalDialog(false);
            setBlockedVendor(null);
            setPendingProduct(null);
          }}
        />
      )}
    </>
  );
}

export default OrderDetailsModal;