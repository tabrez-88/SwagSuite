export interface UpdateOrderItemInput {
  imprintMethod?: string;
  imprintLocation?: string;
  notes?: string;
  shippingDestination?: string;
  shippingAccountType?: string;
  shippingNotes?: string;
  quantity?: number;
  cost?: string;
  unitPrice?: string;
  totalPrice?: string;
  color?: string;
  size?: string;
  priceLabel?: string | null;
  personalComment?: string | null;
  privateNotes?: string | null;
  decoratorType?: string | null;
}

export interface LineItemInput {
  orderItemId: string;
  color?: string;
  size?: string;
  quantity: number;
  cost: string;
  unitPrice: string;
  totalPrice: string;
  margin?: number;
}

export interface ChargeInput {
  orderItemId: string;
  description: string;
  chargeType: string;
  amount: string;
  isVendorCharge: boolean;
  displayToClient?: boolean;
}

export interface ArtworkInput {
  orderItemId: string;
  name: string;
  filePath: string;
  fileName: string;
  location?: string;
  artworkType?: string;
  color?: string;
  size?: string;
}
