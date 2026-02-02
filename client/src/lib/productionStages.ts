// Shared production stages configuration
// This ensures consistency across Production Report and Project pages

export interface ProductionStage {
  id: string;
  name: string;
  order: number;
  color: string;
  description?: string;
  icon: string;
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

// LocalStorage key for custom stages
const STORAGE_KEY = 'swagSuite_production_stages';

// Load stages from localStorage or return defaults
export function loadStages(): ProductionStage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate structure
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load stages from localStorage:', error);
  }
  return DEFAULT_STAGES;
}

// Save stages to localStorage
export function saveStages(stages: ProductionStage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stages));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('stagesUpdated', { detail: stages }));
  } catch (error) {
    console.error('Failed to save stages to localStorage:', error);
  }
}

// Reset to default stages
export function resetStages(): ProductionStage[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('stagesUpdated', { detail: DEFAULT_STAGES }));
  } catch (error) {
    console.error('Failed to reset stages:', error);
  }
  return DEFAULT_STAGES;
}

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
