import { useState } from "react";
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
  MapPin
} from "lucide-react";
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
  const [newStage, setNewStage] = useState({ name: '', description: '', color: 'bg-gray-100 text-gray-800' });
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [editingStageData, setEditingStageData] = useState<Record<string, any>>({});
  const [stageInputs, setStageInputs] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch production orders from API
  const { data: productionOrders = [], isLoading } = useQuery({
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

  const handleStageUpdate = (orderId: string, newStage: string, stageData?: any) => {
    // Update order stage logic would go here
    const updatedOrder = {
      ...selectedOrder,
      currentStage: newStage,
      stageData: {
        ...selectedOrder?.stageData,
        [newStage]: stageData || {}
      }
    };
    
    setSelectedOrder(updatedOrder as ProductionOrder);
    
    toast({
      title: "Stage Updated",
      description: "Order stage has been updated successfully.",
    });
  };

  const handleStageDataSave = (stageId: string, data: any) => {
    if (!selectedOrder) return;
    
    const updatedOrder = {
      ...selectedOrder,
      stageData: {
        ...selectedOrder.stageData,
        [stageId]: data
      },
      ...(stageId === 'shipped' && data.trackingNumber ? { trackingNumber: data.trackingNumber } : {})
    };
    
    setSelectedOrder(updatedOrder);
    setEditingStageData({});
    
    toast({
      title: "Stage Data Saved",
      description: "Stage information has been updated successfully.",
    });
  };

  const handleCustomNotesSave = (stageId: string, notes: string) => {
    if (!selectedOrder) return;
    
    const updatedOrder = {
      ...selectedOrder,
      customNotes: {
        ...selectedOrder.customNotes,
        [stageId]: notes
      }
    };
    
    setSelectedOrder(updatedOrder);
    setStageInputs({});
    
    toast({
      title: "Notes Saved",
      description: "Custom notes have been updated successfully.",
    });
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
      description: newStage.description
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

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Factory className="mr-3 text-swag-primary" size={32} />
              Production Report
            </h1>
            <p className="text-gray-600 mt-1">Track orders through production stages with customizable workflow</p>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={isStageModalOpen} onOpenChange={setIsStageModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Stages
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Manage Production Stages</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
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
            <div className="flex items-center space-x-4">
              <div>
                <Label htmlFor="assigneeFilter">Filter by Assignee:</Label>
                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                  <SelectTrigger className="w-48">
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
                  <SelectTrigger className="w-48">
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
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card 
              key={order.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOrderClick(order)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority.toUpperCase()}
                      </Badge>
                      {order.nextActionDate === format(new Date(), 'yyyy-MM-dd') && (
                        <Badge variant="destructive" className="animate-pulse">
                          <Bell className="mr-1 h-3 w-3" />
                          Action Due Today
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600">{order.companyName} • {order.productName} (Qty: {order.quantity})</p>
                    <p className="text-sm text-gray-500">Assigned to: {order.assignedTo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.orderValue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Due: {order.dueDate ? format(new Date(order.dueDate), 'MMM dd') : 'TBD'}</p>
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
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {stages.map((stage, index) => {
                    const isCompleted = order.stagesCompleted.includes(stage.id);
                    const isCurrent = order.currentStage === stage.id;
                    
                    return (
                      <div key={stage.id} className="flex items-center space-x-2 flex-shrink-0">
                        <div className="relative">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                            ${isCompleted ? 'bg-green-500 text-white' : 
                              isCurrent ? 'bg-swag-primary text-white' : 'bg-gray-200 text-gray-600'}
                          `}>
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
              </CardContent>
            </Card>
          ))}
        </div>

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
                      <p><span className="font-medium">Assigned To:</span> {selectedOrder.assignedTo}</p>
                      <p><span className="font-medium">Priority:</span> 
                        <Badge className={`ml-2 ${getPriorityColor(selectedOrder.priority)}`}>
                          {selectedOrder.priority.toUpperCase()}
                        </Badge>
                      </p>
                      <p><span className="font-medium">Due Date:</span> {selectedOrder.dueDate ? format(new Date(selectedOrder.dueDate), 'MMM dd, yyyy') : 'TBD'}</p>
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
    </div>
  );
}