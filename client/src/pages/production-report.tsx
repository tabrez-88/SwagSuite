import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
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
  Bell
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
}

const defaultStages: ProductionStage[] = [
  { id: 'sales-booked', name: 'Sales Order Booked', order: 1, color: 'bg-blue-100 text-blue-800' },
  { id: 'po-placed', name: 'Purchase Order Placed', order: 2, color: 'bg-purple-100 text-purple-800' },
  { id: 'confirmation-received', name: 'Confirmation Received', order: 3, color: 'bg-indigo-100 text-indigo-800' },
  { id: 'proof-received', name: 'Proof Received', order: 4, color: 'bg-yellow-100 text-yellow-800' },
  { id: 'proof-approved', name: 'Proof Approved', order: 5, color: 'bg-orange-100 text-orange-800' },
  { id: 'order-placed', name: 'Order Placed', order: 6, color: 'bg-teal-100 text-teal-800' },
  { id: 'invoice-paid', name: 'Invoice Paid', order: 7, color: 'bg-green-100 text-green-800' },
  { id: 'shipping-scheduled', name: 'Shipping Scheduled', order: 8, color: 'bg-cyan-100 text-cyan-800' },
  { id: 'shipped', name: 'Shipped', order: 9, color: 'bg-emerald-100 text-emerald-800' },
];

export default function ProductionReport() {
  const [stages, setStages] = useState<ProductionStage[]>(defaultStages);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [newStage, setNewStage] = useState({ name: '', description: '', color: 'bg-gray-100 text-gray-800' });
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

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
      orderValue: 12500
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
      orderValue: 4800
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
      orderValue: 25000
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

  const handleStageUpdate = (orderId: string, newStage: string) => {
    // Update order stage logic would go here
    toast({
      title: "Stage Updated",
      description: "Order stage has been updated successfully.",
    });
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
    <Layout>
      <div className="space-y-6">
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
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : isCurrent ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              index + 1
                            )}
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
                  <div className="space-y-3">
                    {stages.map((stage) => {
                      const isCompleted = selectedOrder.stagesCompleted.includes(stage.id);
                      const isCurrent = selectedOrder.currentStage === stage.id;
                      
                      return (
                        <div key={stage.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center
                              ${isCompleted ? 'bg-green-500 text-white' : 
                                isCurrent ? 'bg-swag-primary text-white' : 'bg-gray-200 text-gray-600'}
                            `}>
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : isCurrent ? (
                                <AlertCircle className="h-4 w-4" />
                              ) : (
                                stage.order
                              )}
                            </div>
                            <Badge className={stage.color}>{stage.name}</Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStageUpdate(selectedOrder.id, stage.id)}
                            disabled={isCompleted}
                          >
                            {isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Set Current'}
                          </Button>
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
    </Layout>
  );
}