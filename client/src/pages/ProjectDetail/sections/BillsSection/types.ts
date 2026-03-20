import type { ProjectData } from "@/types/project-types";

export interface BillsSectionProps {
  orderId: string;
  data: ProjectData;
}

export interface BillFormData {
  supplierId: string;
  documentId: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  notes: string;
}

export const billStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  vouched: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};
