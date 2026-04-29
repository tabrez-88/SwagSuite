import type { EntityType } from "@/services/search/requests";

export interface FilterState {
  entityTypes: EntityType[];
  stage: string;
  marginMin: string;
  marginMax: string;
  dateFrom: string;
  dateTo: string;
  industry: string;
}

export const DEFAULT_FILTERS: FilterState = {
  entityTypes: [],
  stage: "",
  marginMin: "",
  marginMax: "",
  dateFrom: "",
  dateTo: "",
  industry: "",
};

export const ALL_ENTITY_TYPES: EntityType[] = [
  "order",
  "product",
  "company",
  "contact",
  "vendor",
  "purchase_order",
  "shipment",
  "activity",
];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  order: "Orders",
  product: "Products",
  company: "Companies",
  contact: "Contacts",
  vendor: "Vendors",
  purchase_order: "Purchase Orders",
  shipment: "Shipments",
  activity: "Activities",
};

export const STAGE_OPTIONS = [
  { value: "", label: "All Stages" },
  { value: "presentation", label: "Presentation" },
  { value: "quote", label: "Quote" },
  { value: "sales_order", label: "Sales Order" },
  { value: "invoice", label: "Invoice" },
];
