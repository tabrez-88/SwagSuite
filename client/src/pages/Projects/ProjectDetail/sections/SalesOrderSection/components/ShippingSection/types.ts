import type { ProjectData } from "@/types/project-types";
import type { OrderShipment } from "@shared/schema";

export interface ShipmentFormData {
  carrier: string;
  shippingMethod: string;
  trackingNumber: string;
  shippingCost: string;
  shipDate: string;
  estimatedDelivery: string;
  shipToName: string;
  shipToCompany: string;
  shipToAddress: string;
  shipToPhone: string;
  status: string;
  notes: string;
}

export interface ShippingAddressData {
  contactName?: string;
  companyName?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface ItemShippingFormData {
  // Leg 1
  shippingDestination: string;
  shippingAccountType: string;
  shippingMethodOverride: string;
  shippingNotes: string;
  shipToAddressId: string;
  shipToAddress: ShippingAddressData | null;
  shipInHandsDate: string;
  shipFirm: boolean | null;
  shippingAccountId: string;
  shippingQuote: string;
  // Leg 2 (only when destination = decorator)
  leg2ShipTo: string;
  leg2AddressId: string;
  leg2Address: ShippingAddressData | null;
  leg2InHandsDate: string;
  leg2Firm: boolean | null;
  leg2ShippingMethod: string;
  leg2ShippingAccountType: string;
  leg2ShippingAccountId: string;
  leg2ShippingQuote: string;
}

export interface BulkEditData {
  shippingDestination: string;
  shippingAccountType: string;
  shippingMethodOverride: string;
  shippingNotes: string;
  shipInHandsDate: string;
  shipFirm: boolean;
  shippingQuote: string;
}

export interface ShippingSectionProps {
  projectId: string;
  data: ProjectData;
  isLocked?: boolean;
}

export const CARRIERS = ["UPS", "FedEx", "USPS", "DHL", "Freight", "Local Delivery", "Other"] as const;

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-gray-100 text-gray-700" },
  { value: "shipped", label: "Shipped", color: "bg-blue-100 text-blue-700" },
  { value: "in_transit", label: "In Transit", color: "bg-indigo-100 text-indigo-700" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-700" },
  { value: "returned", label: "Returned", color: "bg-red-100 text-red-700" },
] as const;

export const SHIP_TO_OPTIONS = [
  { value: "client", label: "Client" },
  { value: "decorator", label: "Decorator" },
  { value: "other_supplier", label: "Other Supplier" },
  { value: "fulfillment", label: "Fulfillment Warehouse" },
];

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "ours", label: "Our Account" },
  { value: "client", label: "Client's Account" },
  { value: "supplier", label: "Supplier's Account" },
  { value: "other", label: "Other" },
];

export const SHIPPING_METHOD_OPTIONS = [
  { value: "ground", label: "Ground" },
  { value: "2day", label: "2-Day" },
  { value: "overnight", label: "Overnight" },
  { value: "freight", label: "Freight" },
  { value: "local_delivery", label: "Local Delivery" },
  { value: "pickup", label: "Pickup" },
  { value: "other", label: "Other" },
];

export const EMPTY_FORM: ShipmentFormData = {
  carrier: "", shippingMethod: "", trackingNumber: "", shippingCost: "",
  shipDate: "", estimatedDelivery: "", shipToName: "", shipToCompany: "",
  shipToAddress: "", shipToPhone: "", status: "pending", notes: "",
};

export const EMPTY_BULK: BulkEditData = {
  shippingDestination: "",
  shippingAccountType: "",
  shippingMethodOverride: "",
  shippingNotes: "",
  shipInHandsDate: "",
  shipFirm: false,
  shippingQuote: "",
};

export const EMPTY_ITEM_SHIPPING: ItemShippingFormData = {
  shippingDestination: "",
  shippingAccountType: "",
  shippingMethodOverride: "",
  shippingNotes: "",
  shipToAddressId: "",
  shipToAddress: null,
  shipInHandsDate: "",
  shipFirm: false,
  shippingAccountId: "",
  shippingQuote: "",
  leg2ShipTo: "client",
  leg2AddressId: "",
  leg2Address: null,
  leg2InHandsDate: "",
  leg2Firm: false,
  leg2ShippingMethod: "",
  leg2ShippingAccountType: "",
  leg2ShippingAccountId: "",
  leg2ShippingQuote: "",
};
