import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Using HTML5 drag and drop instead of react-beautiful-dnd for better compatibility
import {
  Factory,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Plus,
  ArrowRight,
  Settings,
  Bell,
  ShoppingCart,
  FileText,
  MessageSquare,
  Eye,
  ThumbsUp,
  Package,
  CreditCard,
  Truck,
  MapPin,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ProductionStage {
  id: string;
  name: string;
  order: number;
  color: string;
  description?: string;
  icon: string;
}

interface ProductionOrder {
  id: string;
  orderNumber: string;
  companyName: string;
  productName: string;
  quantity: number;
  currentStage: string;
  assignedTo?: string;
  nextActionDate?: string;
  nextActionNotes?: string;
  stagesCompleted: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  orderValue: number;
  stageData?: Record<string, any>; // Custom data for each stage
  trackingNumber?: string;
  customNotes?: Record<string, string>; // Custom notes per stage
}

const defaultStages: ProductionStage[] = [
  { id: 'sales-booked', name: 'Sales Order Booked', order: 1, color: 'bg-blue-100 text-blue-800', icon: 'ShoppingCart' },
  { id: 'po-placed', name: 'Purchase Order Placed', order: 2, color: 'bg-purple-100 text-purple-800', icon: 'FileText' },
  { id: 'confirmation-received', name: 'Confirmation Received', order: 3, color: 'bg-indigo-100 text-indigo-800', icon: 'MessageSquare' },
  { id: 'proof-received', name: 'Proof Received', order: 4, color: 'bg-yellow-100 text-yellow-800', icon: 'Eye' },
  { id: 'proof-approved', name: 'Proof Approved', order: 5, color: 'bg-orange-100 text-orange-800', icon: 'ThumbsUp' },
  { id: 'order-placed', name: 'Order Placed', order: 6, color: 'bg-teal-100 text-teal-800', icon: 'Package' },
  { id: 'invoice-paid', name: 'Invoice Paid', order: 7, color: 'bg-green-100 text-green-800', icon: 'CreditCard' },
  { id: 'shipping-scheduled', name: 'Shipping Scheduled', order: 8, color: 'bg-cyan-100 text-cyan-800', icon: 'Truck' },
  { id: 'shipped', name: 'Shipped', order: 9, color: 'bg-emerald-100 text-emerald-800', icon: 'MapPin' },
];

export default function ProductionReport() {
  const [stages, setStages] = useState<ProductionStage[]>(defaultStages);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<{ order: ProductionOrder; stage: ProductionStage } | null>(null);
  const [stageActionModal, setStageActionModal] = useState(false);
  const [newStage, setNewStage] = useState({ name: '', description: '', color: 'bg-gray-100 text-gray-800' });
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [editingStageData, setEditingStageData] = useState<Record<string, any>>({});
  const [stageInputs, setStageInputs] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'expanded' | 'list'>('expanded');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch production orders from API
  const { data: productionOrders = [], isLoading } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/production/orders"],
  });

  // Mock production orders fallback
  const mockProductionOrders: ProductionOrder[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      companyName: 'TechCorp Inc',
      productName: 'Custom T-Shirts',
      quantity: 500,
      currentStage: 'proof-received',
      assignedTo: 'Sarah Wilson',
      nextActionDate: format(new Date(), 'yyyy-MM-dd'),
      nextActionNotes: 'Follow up with client on proof approval',
      stagesCompleted: ['sales-booked', 'po-placed', 'confirmation-received'],
      priority: 'high',
      dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      orderValue: 12500,
      stageData: {
        'sales-booked': { confirmedBy: 'John Smith', salesOrderNumber: 'SO-2024-001' },
        'po-placed': { poNumber: 'PO-ABC-789', vendorConfirmation: 'Pending' },
        'confirmation-received': { confirmedDate: '2024-01-15', estimatedShipDate: '2024-01-22' }
      },
      customNotes: {
        'proof-received': 'Client requested minor color adjustments'
      }
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      companyName: 'StartupXYZ',
      productName: 'Branded Mugs',
      quantity: 200,
      currentStage: 'order-placed',
      assignedTo: 'Mike Johnson',
      nextActionDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      nextActionNotes: 'Check production timeline with vendor',
      stagesCompleted: ['sales-booked', 'po-placed', 'confirmation-received', 'proof-received', 'proof-approved'],
      priority: 'medium',
      dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      orderValue: 4800,
      stageData: {
        'sales-booked': { confirmedBy: 'Sarah Wilson', salesOrderNumber: 'SO-2024-002' },
        'po-placed': { poNumber: 'PO-XYZ-456', vendorConfirmation: 'Confirmed' },
        'order-placed': { productionStartDate: '2024-01-18', estimatedCompletion: '2024-01-25' }
      },
      customNotes: {
        'order-placed': 'Rush production requested - expedited timeline'
      }
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      companyName: 'Global Enterprise',
      productName: 'Laptop Bags',
      quantity: 1000,
      currentStage: 'shipping-scheduled',
      assignedTo: 'Emma Davis',
      nextActionDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      nextActionNotes: 'Coordinate delivery logistics',
      stagesCompleted: ['sales-booked', 'po-placed', 'confirmation-received', 'proof-received', 'proof-approved', 'order-placed', 'invoice-paid'],
      priority: 'urgent',
      dueDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      orderValue: 25000,
      trackingNumber: 'UPS1Z999AA1234567890',
      stageData: {
        'shipping-scheduled': {
          carrier: 'UPS',
          scheduledDate: '2024-01-20',
          deliveryAddress: '123 Business Way, Corporate City, CA 90210'
        }
      },
      customNotes: {
        'shipping-scheduled': 'Signature required on delivery - contact recipient day before'
      }
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getProgressPercentage = (order: ProductionOrder) => {
    const totalStages = stages.length;
    const completedStages = order.stagesCompleted.length;
    const currentStageIndex = stages.findIndex(s => s.id === order.currentStage);
    return Math.round(((completedStages + (currentStageIndex >= 0 ? 0.5 : 0)) / totalStages) * 100);
  };

  const handleStageReorder = (fromIndex: number, toIndex: number) => {
    const newStages = Array.from(stages);
    const [reorderedStage] = newStages.splice(fromIndex, 1);
    newStages.splice(toIndex, 0, reorderedStage);

    // Update order numbers
    const updatedStages = newStages.map((stage, index) => ({
      ...stage,
      order: index + 1
    }));

    setStages(updatedStages);
    toast({
      title: "Stages Reordered",
      description: "Production stages have been updated successfully.",
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      handleStageReorder(dragIndex, dropIndex);
    }
  };

  const handleOrderClick = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const updateOrderProductionMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string, data: any }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/production`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/production/orders"] });
      if (selectedOrder && selectedOrder.id === data.id) {
        setSelectedOrder({
          ...selectedOrder,
          ...data,
          orderValue: parseFloat(data.total)
        });
      }
      toast({
        title: "Success",
        description: "Order production information updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update production information.",
        variant: "destructive",
      });
    }
  });

  const handleStageUpdate = (orderId: string, newStage: string) => {
    // Basic mapping of stages to order statuses for cross-compatibility
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

    updateOrderProductionMutation.mutate({
      orderId,
      data: {
        currentStage: newStage,
        status: statusMap[newStage] || 'approved'
      }
    });
  };

  const handleStageDataSave = (stageId: string, data: any) => {
    if (!selectedOrder) return;

    const updatedStageData = {
      ...(selectedOrder.stageData || {}),
      [stageId]: data
    };

    updateOrderProductionMutation.mutate({
      orderId: selectedOrder.id,
      data: {
        stageData: updatedStageData,
        ...(stageId === 'shipped' && data.trackingNumber ? { trackingNumber: data.trackingNumber } : {})
      }
    });

    setEditingStageData({});
  };

  const handleCustomNotesSave = (stageId: string, notes: string) => {
    if (!selectedOrder) return;

    const updatedCustomNotes = {
      ...(selectedOrder.customNotes || {}),
      [stageId]: notes
    };

    updateOrderProductionMutation.mutate({
      orderId: selectedOrder.id,
      data: {
        customNotes: updatedCustomNotes
      }
    });

    setStageInputs({});
  };

  const getStageIcon = (iconName: string) => {
    const iconMap = {
      ShoppingCart,
      FileText,
      MessageSquare,
      Eye,
      ThumbsUp,
      Package,
      CreditCard,
      Truck,
      MapPin
    };
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent || ShoppingCart;
  };

  const getStageInputFields = (stageId: string) => {
    switch (stageId) {
      case 'sales-booked':
        return [
          { key: 'confirmedBy', label: 'Confirmed By', type: 'text' },
          { key: 'salesOrderNumber', label: 'Sales Order Number', type: 'text' }
        ];
      case 'po-placed':
        return [
          { key: 'poNumber', label: 'PO Number', type: 'text' },
          { key: 'vendorConfirmation', label: 'Vendor Confirmation', type: 'select', options: ['Pending', 'Confirmed', 'Rejected'] }
        ];
      case 'confirmation-received':
        return [
          { key: 'confirmedDate', label: 'Confirmation Date', type: 'date' },
          { key: 'estimatedShipDate', label: 'Estimated Ship Date', type: 'date' }
        ];
      case 'proof-received':
        return [
          { key: 'proofDate', label: 'Proof Received Date', type: 'date' },
          { key: 'revisionCount', label: 'Revision Number', type: 'number' }
        ];
      case 'proof-approved':
        return [
          { key: 'approvedBy', label: 'Approved By', type: 'text' },
          { key: 'approvalDate', label: 'Approval Date', type: 'date' }
        ];
      case 'order-placed':
        return [
          { key: 'productionStartDate', label: 'Production Start Date', type: 'date' },
          { key: 'estimatedCompletion', label: 'Estimated Completion', type: 'date' }
        ];
      case 'invoice-paid':
        return [
          { key: 'paymentDate', label: 'Payment Date', type: 'date' },
          { key: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Credit Card', 'Wire Transfer', 'Check', 'ACH'] }
        ];
      case 'shipping-scheduled':
        return [
          { key: 'carrier', label: 'Shipping Carrier', type: 'select', options: ['UPS', 'FedEx', 'USPS', 'DHL', 'Other'] },
          { key: 'scheduledDate', label: 'Scheduled Ship Date', type: 'date' },
          { key: 'deliveryAddress', label: 'Delivery Address', type: 'textarea' }
        ];
      case 'shipped':
        return [
          { key: 'trackingNumber', label: 'Tracking Number', type: 'text' },
          { key: 'shippedDate', label: 'Shipped Date', type: 'date' },
          { key: 'carrier', label: 'Carrier', type: 'select', options: ['UPS', 'FedEx', 'USPS', 'DHL', 'Other'] }
        ];
      default:
        return [];
    }
  };

  const handleAddStage = () => {
    if (!newStage.name) return;

    const stage: ProductionStage = {
      id: newStage.name.toLowerCase().replace(/\s+/g, '-'),
      name: newStage.name,
      order: stages.length + 1,
      color: newStage.color,
      description: newStage.description,
      icon: 'Package' // Default icon for custom stages
    };

    setStages([...stages, stage]);
    setNewStage({ name: '', description: '', color: 'bg-gray-100 text-gray-800' });
    setIsStageModalOpen(false);

    toast({
      title: "Stage Added",
      description: "New production stage has been added successfully.",
    });
  };

  // Use actual data if available, otherwise fallback to mock data
  const ordersToDisplay = productionOrders.length > 0 ? productionOrders : mockProductionOrders;

  const filteredOrders = ordersToDisplay.filter(order => {
    if (filterAssignee !== 'all' && order.assignedTo !== filterAssignee) return false;
    if (filterPriority !== 'all' && order.priority !== filterPriority) return false;
    return true;
  });

  const uniqueAssignees = Array.from(new Set(ordersToDisplay.map(o => o.assignedTo).filter(Boolean)));

  // Helper functions for view modes
  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const openOrderDetail = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const openStageAction = (order: ProductionOrder, stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (stage) {
      setSelectedStage({ order, stage });
      setStageActionModal(true);
    }
  };

  const openProjectPage = (order: ProductionOrder) => {
    // Navigation to project page would go here
    window.open(`/project/${order.id}`, '_blank');
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Factory className="mr-3 text-swag-primary" size={32} />
            Production Report
          </h1>
          <p className="text-gray-600 mt-1">Track orders through production stages with customizable workflow</p>
        </div>
        <div className="flex gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'expanded' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('expanded')}
              className="px-3"
              data-testid="button-expanded-view"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
              data-testid="button-list-view"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
          <Dialog open={isStageModalOpen} onOpenChange={setIsStageModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Manage Stages
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl ">
              <DialogHeader>
                <DialogTitle>Manage Production Stages</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 overflow-y-scroll h-[500px]">
                {/* Stage Reordering */}
                <div>
                  <h3 className="font-medium mb-3">Current Stages (Drag to Reorder)</h3>
                  <div className="space-y-2">
                    {stages.map((stage, index) => (
                      <div
                        key={stage.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border cursor-move hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500">#{stage.order}</span>
                          <Badge className={stage.color}>{stage.name}</Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Stage */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-3">Add New Stage</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stageName">Stage Name</Label>
                      <Input
                        id="stageName"
                        value={newStage.name}
                        onChange={(e) => setNewStage(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Quality Check"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stageColor">Color</Label>
                      <Select value={newStage.color} onValueChange={(value) => setNewStage(prev => ({ ...prev, color: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bg-red-100 text-red-800">Red</SelectItem>
                          <SelectItem value="bg-orange-100 text-orange-800">Orange</SelectItem>
                          <SelectItem value="bg-yellow-100 text-yellow-800">Yellow</SelectItem>
                          <SelectItem value="bg-green-100 text-green-800">Green</SelectItem>
                          <SelectItem value="bg-blue-100 text-blue-800">Blue</SelectItem>
                          <SelectItem value="bg-purple-100 text-purple-800">Purple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="stageDesc">Description (Optional)</Label>
                      <Textarea
                        id="stageDesc"
                        value={newStage.description}
                        onChange={(e) => setNewStage(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of this stage"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleAddStage} className="bg-swag-primary hover:bg-swag-primary/90">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Stage
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div>
              <Label htmlFor="assigneeFilter">Filter by Assignee:</Label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-fit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {uniqueAssignees.map(assignee => (
                    <SelectItem key={assignee} value={assignee || ''}>
                      {assignee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priorityFilter">Filter by Priority:</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-fit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Pipeline */}
      {viewMode === 'list' ? (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>Production Orders - List View</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const currentStage = stages.find(s => s.id === order.currentStage);
                    const StageIcon = currentStage ? getStageIcon(currentStage.icon) : ShoppingCart;
                    const isExpanded = expandedOrders.has(order.id);

                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer"
                          data-testid={`row-order-${order.id}`}
                          onClick={() => openOrderDetail(order)}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleOrderExpansion(order.id);
                                }}
                                className="p-1"
                                data-testid={`button-toggle-${order.id}`}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <div>
                                <div className="font-semibold">{order.orderNumber}</div>
                                <Badge className={getPriorityColor(order.priority)} variant="outline">
                                  {order.priority}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <UserAvatar name={order.companyName} size="sm" />
                              <span className="text-sm text-gray-900">{order.companyName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">{order.productName}</div>
                            <div className="text-xs text-gray-500">Qty: {order.quantity}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${order.stagesCompleted.includes(order.currentStage) ? 'bg-green-500 text-white' : 'bg-swag-primary text-white'
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openStageAction(order, order.currentStage);
                                }}
                              >
                                <StageIcon className="h-3 w-3" />
                              </div>
                              <span className="text-xs text-gray-700">{currentStage?.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-swag-primary h-2 rounded-full"
                                  style={{ width: `${getProgressPercentage(order)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">{getProgressPercentage(order)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <UserAvatar name={order.assignedTo} size="sm" />
                              <span className="text-sm text-gray-700">{order.assignedTo}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold">${order.orderValue.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Due: {order.dueDate ? format(new Date(order.dueDate), 'MMM dd') : 'TBD'}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOrderDetail(order);
                                }}
                                className="p-1"
                                data-testid={`button-order-detail-${order.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openProjectPage(order);
                                }}
                                className="p-1"
                                data-testid={`button-project-page-${order.id}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Details */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="px-4 py-4 bg-gray-50">
                              <div className="space-y-3">
                                {/* Stage Pipeline in List */}
                                <div className="flex items-center space-x-2 overflow-x-auto">
                                  {stages.map((stage, index) => {
                                    const isCompleted = order.stagesCompleted.includes(stage.id);
                                    const isCurrent = order.currentStage === stage.id;
                                    const StageIcon = getStageIcon(stage.icon);

                                    return (
                                      <div key={stage.id} className="flex items-center space-x-2 flex-shrink-0">
                                        <div className={`
                                            w-6 h-6 rounded-full flex items-center justify-center text-xs
                                            ${isCompleted ? 'bg-green-500 text-white' :
                                            isCurrent ? 'bg-swag-primary text-white' : 'bg-gray-200 text-gray-600'}
                                          `}>
                                          <StageIcon className="h-3 w-3" />
                                        </div>
                                        {index < stages.length - 1 && (
                                          <ArrowRight className="h-3 w-3 text-gray-400" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Next Action */}
                                {order.nextActionNotes && (
                                  <div className="flex items-start space-x-2 text-sm">
                                    <Clock className="h-4 w-4 text-orange-500 mt-0.5" />
                                    <div>
                                      <span className="font-medium text-orange-800">Next Action: </span>
                                      <span className="text-orange-700">{order.nextActionNotes}</span>
                                      <span className="text-xs text-orange-600 ml-2">
                                        Due: {order.nextActionDate ? format(new Date(order.nextActionDate), 'MMM dd') : 'Not set'}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Stage Information */}
                                {order.stageData && order.stageData[order.currentStage] && (
                                  <div className="text-sm">
                                    <span className="font-medium text-blue-800">Stage Info: </span>
                                    {Object.entries(order.stageData?.[order.currentStage] || {}).map(([key, value], index) => (
                                      <span key={key} className="text-blue-600">
                                        {key.replace(/([A-Z])/g, ' $1')}: {value as string}
                                        {index < Object.entries(order.stageData?.[order.currentStage] || {}).length - 1 && ' • '}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Expanded Card View */
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              data-testid={`card-order-${order.id}`}
              onClick={() => openOrderDetail(order)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-start justify-between mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col md:flex-row md:justify-start md:items-center gap-2 w-full">
                      <div className="flex justify-between md:justify-start gap-2 items-center w-fit">
                        <h3 className="font-semibold text-lg hover:text-swag-primary">
                          {order.orderNumber}
                        </h3>
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority.toUpperCase()}
                        </Badge>
                      </div>
                      {order.nextActionDate === format(new Date(), 'yyyy-MM-dd') && (
                        <Badge variant="destructive" className="animate-pulse text-nowrap h-fit gap-2 flex">
                          <Bell className="h-4 w-4" />
                          Action Due Today
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-end space-x-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderDetail(order);
                        }}
                        data-testid={`button-edit-order-${order.id}`}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProjectPage(order);
                        }}
                        data-testid={`button-view-project-${order.id}`}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Project
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 w-full items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <UserAvatar
                          name={order.companyName}
                          size="sm"
                        />
                        <span className="text-gray-600">{order.companyName} • {order.productName} (Qty: {order.quantity})</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <UserAvatar
                          name={order.assignedTo}
                          size="sm"
                        />
                        <span className="text-sm text-gray-500">Assigned to: {order.assignedTo}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.orderValue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Due: {order.dueDate ? format(new Date(order.dueDate), 'MMM dd') : 'TBD'}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{getProgressPercentage(order)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-swag-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(order)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stage Pipeline */}
                <div className="flex items-center space-x-2 overflow-x-auto p-2">
                  {stages.map((stage, index) => {
                    const isCompleted = order.stagesCompleted.includes(stage.id);
                    const isCurrent = order.currentStage === stage.id;

                    return (
                      <div key={stage.id} className="flex items-center space-x-2 flex-shrink-0">
                        <div className="relative">
                          <div
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer hover:scale-110 transition-transform
                              ${isCompleted ? 'bg-green-500 text-white' :
                                isCurrent ? 'bg-swag-primary text-white' : 'bg-gray-200 text-gray-600'}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              openStageAction(order, stage.id);
                            }}
                          >
                            {(() => {
                              const StageIcon = getStageIcon(stage.icon);
                              return <StageIcon className="h-4 w-4" />;
                            })()}
                          </div>
                          {isCurrent && (
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                              <Badge className={stage.color} variant="outline">
                                {stage.name}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {index < stages.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stage-specific Information */}
                {order.stageData && order.stageData[order.currentStage] && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">Stage Information</p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {Object.entries(order.stageData[order.currentStage]).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="font-medium text-blue-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                              <span className="text-blue-600">{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tracking Number for Shipped Orders */}
                {order.trackingNumber && (order.currentStage === 'shipped' || order.stagesCompleted.includes('shipped')) && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">Tracking Information</p>
                        <p className="text-sm text-green-700">Tracking Number: {order.trackingNumber}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Notes for Current Stage */}
                {order.customNotes && order.customNotes[order.currentStage] && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-800">Stage Notes</p>
                        <p className="text-sm text-purple-700">{order.customNotes[order.currentStage]}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Action */}
                {order.nextActionNotes && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div className="flex items-start space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Next Action</p>
                        <p className="text-sm text-yellow-700">{order.nextActionNotes}</p>
                        <p className="text-xs text-yellow-600">Due: {order.nextActionDate ? format(new Date(order.nextActionDate), 'MMM dd, yyyy') : 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Production Team & CSR Assignment */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Production:</span>
                      <UserAvatar
                        name={order.assignedTo}
                        size="sm"
                      />
                      <span className="text-sm text-gray-700">{order.assignedTo}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">CSR:</span>
                      <UserAvatar
                        name="Sarah Johnson"
                        size="sm"
                      />
                      <span className="text-sm text-gray-700">Sarah Johnson</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order Details - {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Company:</span> {selectedOrder.companyName}</p>
                    <p><span className="font-medium">Product:</span> {selectedOrder.productName}</p>
                    <p><span className="font-medium">Quantity:</span> {selectedOrder.quantity}</p>
                    <p><span className="font-medium">Value:</span> ${selectedOrder.orderValue.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Production Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Assigned To:</span>
                      <UserAvatar
                        name={selectedOrder.assignedTo}
                        size="sm"
                      />
                      <span>{selectedOrder.assignedTo}</span>
                    </div>
                    <p><span className="font-medium">Priority:</span>
                      <Badge className={`ml-2 ${getPriorityColor(selectedOrder.priority)}`}>
                        {selectedOrder.priority.toUpperCase()}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Due Date:</span> {selectedOrder.dueDate ? format(new Date(selectedOrder.dueDate), 'MMM dd, yyyy') : 'TBD'}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="font-medium">CSR:</span>
                      <UserAvatar
                        name="Sarah Johnson"
                        size="sm"
                      />
                      <span>Sarah Johnson</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Action Section */}
              <div>
                <h3 className="font-medium mb-3">Next Action</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nextActionDate">Next Action Date</Label>
                    <Input
                      id="nextActionDate"
                      type="date"
                      value={selectedOrder.nextActionDate || ''}
                      className="max-w-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextActionNotes">Next Action Notes</Label>
                    <Textarea
                      id="nextActionNotes"
                      value={selectedOrder.nextActionNotes || ''}
                      placeholder="Describe what needs to be done next..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Stage Management */}
              <div>
                <h3 className="font-medium mb-3">Production Stages</h3>
                <div className="space-y-4">
                  {stages.map((stage) => {
                    const isCompleted = selectedOrder.stagesCompleted.includes(stage.id);
                    const isCurrent = selectedOrder.currentStage === stage.id;
                    const stageData = selectedOrder.stageData?.[stage.id];
                    const customNotes = selectedOrder.customNotes?.[stage.id];
                    const isEditing = editingStageData[stage.id];
                    const inputFields = getStageInputFields(stage.id);

                    return (
                      <div key={stage.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center
                                ${isCompleted ? 'bg-green-500 text-white' :
                                isCurrent ? 'bg-swag-primary text-white' : 'bg-gray-200 text-gray-600'}
                              `}>
                              {(() => {
                                const StageIcon = getStageIcon(stage.icon);
                                return <StageIcon className="h-4 w-4" />;
                              })()}
                            </div>
                            <Badge className={stage.color}>{stage.name}</Badge>
                          </div>
                          <div className="flex gap-2">
                            {!isCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingStageData(prev => ({ ...prev, [stage.id]: !prev[stage.id] }))}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit Info
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStageUpdate(selectedOrder.id, stage.id)}
                              disabled={isCompleted}
                            >
                              {isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Set Current'}
                            </Button>
                          </div>
                        </div>

                        {/* Display current stage data */}
                        {stageData && !isEditing && (
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Stage Information:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(stageData).map(([key, value]) => (
                                <div key={key} className="text-xs">
                                  <span className="font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                                  <span className="text-gray-800">{value as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Edit stage data form */}
                        {isEditing && inputFields.length > 0 && (
                          <div className="bg-blue-50 rounded p-3 space-y-3">
                            <p className="text-sm font-medium text-blue-800">Edit Stage Information:</p>
                            <div className="grid grid-cols-1 gap-3">
                              {inputFields.map((field) => (
                                <div key={field.key}>
                                  <Label htmlFor={`${stage.id}-${field.key}`} className="text-xs">
                                    {field.label}
                                  </Label>
                                  {field.type === 'select' ? (
                                    <Select
                                      value={editingStageData[`${stage.id}-${field.key}`] || stageData?.[field.key] || ''}
                                      onValueChange={(value) => setEditingStageData(prev => ({
                                        ...prev,
                                        [`${stage.id}-${field.key}`]: value
                                      }))}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {field.options?.map(option => (
                                          <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : field.type === 'textarea' ? (
                                    <Textarea
                                      id={`${stage.id}-${field.key}`}
                                      value={editingStageData[`${stage.id}-${field.key}`] || stageData?.[field.key] || ''}
                                      onChange={(e) => setEditingStageData(prev => ({
                                        ...prev,
                                        [`${stage.id}-${field.key}`]: e.target.value
                                      }))}
                                      className="h-16"
                                      rows={2}
                                    />
                                  ) : (
                                    <Input
                                      id={`${stage.id}-${field.key}`}
                                      type={field.type}
                                      value={editingStageData[`${stage.id}-${field.key}`] || stageData?.[field.key] || ''}
                                      onChange={(e) => setEditingStageData(prev => ({
                                        ...prev,
                                        [`${stage.id}-${field.key}`]: e.target.value
                                      }))}
                                      className="h-8"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const stageDataToSave = inputFields.reduce((acc, field) => {
                                    const value = editingStageData[`${stage.id}-${field.key}`];
                                    if (value) acc[field.key] = value;
                                    return acc;
                                  }, {} as any);
                                  handleStageDataSave(stage.id, stageDataToSave);
                                }}
                                className="bg-swag-primary hover:bg-swag-primary/90"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingStageData(prev => ({ ...prev, [stage.id]: false }))}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Custom Notes Section */}
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">Custom Notes:</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setStageInputs(prev => ({ ...prev, [stage.id]: customNotes || '' }))}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>

                          {stageInputs[stage.id] !== undefined ? (
                            <div className="space-y-2">
                              <Textarea
                                value={stageInputs[stage.id]}
                                onChange={(e) => setStageInputs(prev => ({ ...prev, [stage.id]: e.target.value }))}
                                placeholder="Add custom notes for this stage..."
                                rows={2}
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleCustomNotesSave(stage.id, stageInputs[stage.id])}
                                  className="bg-swag-primary hover:bg-swag-primary/90"
                                >
                                  Save Notes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setStageInputs(prev => {
                                    const newInputs = { ...prev };
                                    delete newInputs[stage.id];
                                    return newInputs;
                                  })}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600 italic">
                              {customNotes || 'No custom notes added for this stage'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsOrderModalOpen(false)}>
                  Close
                </Button>
                <Button className="bg-swag-primary hover:bg-swag-primary/90">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stage Action Modal */}
      <Dialog open={stageActionModal} onOpenChange={setStageActionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStage?.stage.name} - {selectedStage?.order.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedStage && (
            <div className="space-y-6">
              {/* Stage Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Stage Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Order:</span> {selectedStage.order.orderNumber}</p>
                  <p><span className="font-medium">Company:</span> {selectedStage.order.companyName}</p>
                  <p><span className="font-medium">Product:</span> {selectedStage.order.productName}</p>
                  <p><span className="font-medium">Stage:</span> {selectedStage.stage.name}</p>
                  <p><span className="font-medium">Status:</span>
                    <Badge className={selectedStage.order.stagesCompleted.includes(selectedStage.stage.id) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {selectedStage.order.stagesCompleted.includes(selectedStage.stage.id) ? 'Completed' : 'In Progress'}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Stage-specific Data Entry/Display */}
              <div className="space-y-4">
                <h3 className="font-medium">Stage Information & Actions</h3>

                {/* Existing Stage Data */}
                {selectedStage.order.stageData?.[selectedStage.stage.id] && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Current Information</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedStage.order.stageData[selectedStage.stage.id]).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium text-blue-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                          <span className="text-blue-600">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stage-specific Forms */}
                {selectedStage.stage.id === 'po-placed' && (
                  <div className="space-y-3">
                    <Label>Purchase Order Number</Label>
                    <Input
                      placeholder="Enter PO number"
                      value={stageInputs[`${selectedStage.order.id}-po-number`] || ''}
                      onChange={(e) => setStageInputs({ ...stageInputs, [`${selectedStage.order.id}-po-number`]: e.target.value })}
                    />
                    <Label>Vendor</Label>
                    <Input
                      placeholder="Enter vendor name"
                      value={stageInputs[`${selectedStage.order.id}-vendor`] || ''}
                      onChange={(e) => setStageInputs({ ...stageInputs, [`${selectedStage.order.id}-vendor`]: e.target.value })}
                    />
                  </div>
                )}

                {selectedStage.stage.id === 'proof-received' && (
                  <div className="space-y-3">
                    <Label>Proof File URL</Label>
                    <Input
                      placeholder="Enter proof file URL or upload path"
                      value={stageInputs[`${selectedStage.order.id}-proof-url`] || ''}
                      onChange={(e) => setStageInputs({ ...stageInputs, [`${selectedStage.order.id}-proof-url`]: e.target.value })}
                    />
                    <Label>Proof Notes</Label>
                    <Textarea
                      placeholder="Any notes about the proof"
                      value={stageInputs[`${selectedStage.order.id}-proof-notes`] || ''}
                      onChange={(e) => setStageInputs({ ...stageInputs, [`${selectedStage.order.id}-proof-notes`]: e.target.value })}
                    />
                  </div>
                )}

                {selectedStage.stage.id === 'invoice-paid' && (
                  <div className="space-y-3">
                    <Label>Payment Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter payment amount"
                      value={stageInputs[`${selectedStage.order.id}-payment-amount`] || ''}
                      onChange={(e) => setStageInputs({ ...stageInputs, [`${selectedStage.order.id}-payment-amount`]: e.target.value })}
                    />
                    <Label>Payment Date</Label>
                    <Input
                      type="date"
                      value={stageInputs[`${selectedStage.order.id}-payment-date`] || ''}
                      onChange={(e) => setStageInputs({ ...stageInputs, [`${selectedStage.order.id}-payment-date`]: e.target.value })}
                    />
                  </div>
                )}

                {selectedStage.stage.id === 'shipped' && (
                  <div className="space-y-3">
                    <Label>Tracking Number</Label>
                    <Input
                      placeholder="Enter tracking number"
                      value={stageInputs[`${selectedStage.order.id}-tracking`] || selectedStage.order.trackingNumber || ''}
                      onChange={(e) => setStageInputs({ ...stageInputs, [`${selectedStage.order.id}-tracking`]: e.target.value })}
                    />
                    <Label>Ship Date</Label>
                    <Input
                      type="date"
                      value={stageInputs[`${selectedStage.order.id}-ship-date`] || ''}
                      onChange={(e) => setStageInputs({ ...stageInputs, [`${selectedStage.order.id}-ship-date`]: e.target.value })}
                    />
                    <Label>Carrier</Label>
                    <Select value={stageInputs[`${selectedStage.order.id}-carrier`] || ''} onValueChange={(value) => setStageInputs({ ...stageInputs, [`${selectedStage.order.id}-carrier`]: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fedex">FedEx</SelectItem>
                        <SelectItem value="ups">UPS</SelectItem>
                        <SelectItem value="usps">USPS</SelectItem>
                        <SelectItem value="dhl">DHL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Generic notes field for all stages */}
                <div className="space-y-3">
                  <Label>Stage Notes</Label>
                  <Textarea
                    placeholder="Add notes for this stage"
                    value={stageInputs[`${selectedStage.order.id}-notes`] || selectedStage.order.customNotes?.[selectedStage.stage.id] || ''}
                    onChange={(e) => setStageInputs({ ...stageInputs, [`${selectedStage.order.id}-notes`]: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <div className="space-x-2">
                  {!selectedStage.order.stagesCompleted.includes(selectedStage.stage.id) && (
                    <Button
                      onClick={() => {
                        const currentIdx = stages.findIndex(s => s.id === selectedStage.stage.id);
                        const nextStage = currentIdx < stages.length - 1 ? stages[currentIdx + 1].id : selectedStage.stage.id;

                        const updatedStagesCompleted = Array.from(new Set([...selectedStage.order.stagesCompleted, selectedStage.stage.id]));

                        updateOrderProductionMutation.mutate({
                          orderId: selectedStage.order.id,
                          data: {
                            stagesCompleted: updatedStagesCompleted,
                            currentStage: nextStage
                          }
                        });
                        setStageActionModal(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const stageDataFields = getStageInputFields(selectedStage.stage.id);
                      const stageDataToSave = { ...(selectedStage.order.stageData?.[selectedStage.stage.id] || {}) };

                      stageDataFields.forEach(field => {
                        const val = stageInputs[`${selectedStage.order.id}-${field.key}`];
                        if (val !== undefined) stageDataToSave[field.key] = val;
                      });

                      const updatedStageData = {
                        ...(selectedStage.order.stageData || {}),
                        [selectedStage.stage.id]: stageDataToSave
                      };

                      const customNotes = stageInputs[`${selectedStage.order.id}-notes`];
                      const updatedCustomNotes = {
                        ...(selectedStage.order.customNotes || {}),
                        [selectedStage.stage.id]: customNotes || selectedStage.order.customNotes?.[selectedStage.stage.id] || ''
                      };

                      updateOrderProductionMutation.mutate({
                        orderId: selectedStage.order.id,
                        data: {
                          stageData: updatedStageData,
                          customNotes: updatedCustomNotes,
                          ...(selectedStage.stage.id === 'shipped' && stageDataToSave.trackingNumber ? { trackingNumber: stageDataToSave.trackingNumber } : {})
                        }
                      });
                      setStageActionModal(false);
                    }}
                  >
                    Save Information
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setStageActionModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}