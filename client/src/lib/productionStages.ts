// Shared production stages configuration
// Stages are stored in the database and fetched via API

export interface ProductionStage {
  id: string;
  name: string;
  order: number;
  color: string;
  description?: string | null;
  icon: string;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export const DEFAULT_STAGES: ProductionStage[] = [
  { id: 'sales-booked', name: 'Sales Order Booked', order: 1, color: 'bg-blue-100 text-blue-800', icon: 'ShoppingCart', description: 'Initial order received from sales' },
  { id: 'po-placed', name: 'Purchase Order Placed', order: 2, color: 'bg-purple-100 text-purple-800', icon: 'FileText', description: 'PO sent to vendor' },
  { id: 'confirmation-received', name: 'Confirmation Received', order: 3, color: 'bg-indigo-100 text-indigo-800', icon: 'MessageSquare', description: 'Vendor confirmed order' },
  { id: 'proof-received', name: 'Proof Received', order: 4, color: 'bg-yellow-100 text-yellow-800', icon: 'Eye', description: 'Artwork proof from vendor' },
  { id: 'proof-approved', name: 'Proof Approved', order: 5, color: 'bg-orange-100 text-orange-800', icon: 'ThumbsUp', description: 'Client approved artwork' },
  { id: 'invoice-paid', name: 'Invoice Paid', order: 6, color: 'bg-green-100 text-green-800', icon: 'CreditCard', description: 'Payment received' },
  { id: 'shipping-scheduled', name: 'Shipping Scheduled', order: 7, color: 'bg-cyan-100 text-cyan-800', icon: 'Truck', description: 'Shipment scheduled' },
  { id: 'shipped', name: 'Shipped', order: 8, color: 'bg-emerald-100 text-emerald-800', icon: 'MapPin', description: 'Order shipped to customer' },
];

// Stage to order status mapping for cross-page compatibility
export const STAGE_STATUS_MAP: Record<string, string> = {
  'sales-booked': 'quote',
  'po-placed': 'pending_approval',
  'confirmation-received': 'pending_approval',
  'proof-received': 'approved',
  'proof-approved': 'approved',
  'invoice-paid': 'in_production',
  'shipping-scheduled': 'in_production',
  'shipped': 'shipped'
};

// Get stage by ID
export function getStageById(stages: ProductionStage[], stageId: string): ProductionStage | undefined {
  return stages.find(stage => stage.id === stageId);
}

// Get next stage
export function getNextStage(stages: ProductionStage[], currentStageId: string): ProductionStage | undefined {
  const currentIndex = stages.findIndex(stage => stage.id === currentStageId);
  if (currentIndex !== -1 && currentIndex < stages.length - 1) {
    return stages[currentIndex + 1];
  }
  return undefined;
}
