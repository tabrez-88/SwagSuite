// Production stages configuration — unified with PO lifecycle stages (CommonSKU-style)
// Stages are stored in the database and fetched via API
// Stage IDs match metadata.poStage values for seamless integration

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

// Default stages match PO lifecycle — IDs align with metadata.poStage values
export const DEFAULT_STAGES: ProductionStage[] = [
  { id: 'created', name: 'Created', order: 1, color: 'bg-gray-100 text-gray-700', icon: 'FileText', description: 'PO created, not yet sent to vendor' },
  { id: 'submitted', name: 'Submitted', order: 2, color: 'bg-blue-100 text-blue-800', icon: 'Send', description: 'PO sent to vendor' },
  { id: 'confirmed', name: 'Confirmed', order: 3, color: 'bg-green-100 text-green-800', icon: 'CheckCircle', description: 'Vendor confirmed the order' },
  { id: 'in_production', name: 'In Production', order: 4, color: 'bg-purple-100 text-purple-800', icon: 'Factory', description: 'Vendor is producing the order' },
  { id: 'shipped', name: 'Shipped', order: 5, color: 'bg-indigo-100 text-indigo-800', icon: 'Truck', description: 'Order shipped from vendor' },
  { id: 'ready_for_billing', name: 'Ready for Billing', order: 6, color: 'bg-teal-100 text-teal-800', icon: 'Receipt', description: 'Ready to create vendor bill' },
  { id: 'billed', name: 'Billed', order: 7, color: 'bg-orange-100 text-orange-800', icon: 'CreditCard', description: 'Vendor bill recorded' },
  { id: 'closed', name: 'Closed', order: 8, color: 'bg-red-100 text-red-800', icon: 'Lock', description: 'PO fully complete' },
];

// "Open" stages (not billed/closed) — for filtering active POs
export const DEFAULT_OPEN_STAGE_IDS = ['created', 'submitted', 'confirmed', 'in_production', 'shipped', 'ready_for_billing'];

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

// Get badge class from stage color (for production report / PO section)
export function getStageBadgeClass(stages: ProductionStage[], stageId: string): string {
  const stage = getStageById(stages, stageId);
  return stage ? `${stage.color} border-0` : 'bg-gray-100 text-gray-700 border-0';
}
