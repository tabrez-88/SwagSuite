export interface ShipmentInput {
  trackingNumber?: string;
  carrier?: string;
  shippingMethod?: string;
  estimatedDelivery?: string;
  shippedDate?: string;
  notes?: string;
  [key: string]: unknown;
}
