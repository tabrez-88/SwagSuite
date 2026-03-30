export interface UpdateOrderItemInput {
  description?: string | null;
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
  decoratorId?: string | null;
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
  chargeCategory?: "run" | "fixed";
  amount: string;
  isVendorCharge: boolean;
  displayToClient?: boolean;
  includeInUnitPrice?: boolean;
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
  repeatLogo?: boolean;
}

export interface ArtworkChargeInput {
  artworkItemId: string;
  chargeName: string;
  chargeCategory: "run" | "fixed";
  netCost: string;
  margin: string;
  retailPrice: string;
  quantity?: number;
  displayMode: "include_in_price" | "display_to_client" | "subtract_from_margin";
}
