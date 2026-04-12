import type { Company, Order } from "@shared/schema";
import type { BusinessStage } from "@/constants/businessStages";

export interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  initialCompanyId?: string;
  businessStageId?: BusinessStage;
}

export interface ProjectFormData {
  companyId: string;
  contactId: string;
  assignedUserId: string;
  orderType: string;
  projectName: string;
  budget: string;
  inHandsDate: string;
  eventDate: string;
  supplierInHandsDate: string;
  isFirm: boolean;
  notes: string;
  supplierNotes: string;
  additionalInformation: string;
  orderDiscount: string;
  paymentTerms: string;
  customerPo: string;
  billingContact: string;
  billingEmail: string;
  billingStreet: string;
  billingStreet2: string;
  billingCity: string;
  billingState: string;
  billingZipCode: string;
  billingCountry: string;
  billingPhone: string;
  shippingContact: string;
  shippingEmail: string;
  shippingStreet: string;
  shippingStreet2: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
  shippingPhone: string;
}

export type { Company, Order, BusinessStage };
