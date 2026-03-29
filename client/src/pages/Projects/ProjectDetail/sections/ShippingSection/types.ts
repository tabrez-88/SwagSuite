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

export interface BulkEditData {
  shippingDestination: string;
  shippingAccountType: string;
  shippingMethodOverride: string;
  shippingNotes: string;
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
};
