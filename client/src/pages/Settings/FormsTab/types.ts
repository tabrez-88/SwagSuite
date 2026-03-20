export interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  enabled: boolean;
}

export interface FormFields {
  salesOrders: FormField[];
  purchaseOrders: FormField[];
}
