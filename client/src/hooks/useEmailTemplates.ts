import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface EmailTemplate {
  id: string;
  templateType: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  isActive: boolean;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useEmailTemplates(templateType?: string) {
  const url = templateType
    ? `/api/settings/email-templates?type=${templateType}`
    : "/api/settings/email-templates";

  return useQuery<EmailTemplate[]>({
    queryKey: ["/api/settings/email-templates", { type: templateType }],
    queryFn: async () => {
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });
}

export function useEmailTemplateMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/settings/email-templates"] });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<EmailTemplate>) => {
      const res = await apiRequest("POST", "/api/settings/email-templates", data);
      return res.json();
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmailTemplate> & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/settings/email-templates/${id}`, data);
      return res.json();
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/settings/email-templates/${id}`);
    },
    onSuccess: invalidate,
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/settings/email-templates/${id}/default`);
      return res.json();
    },
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation, setDefaultMutation };
}

/** Replace {{mergeField}} placeholders with actual values */
export function applyTemplate(
  template: { subject: string; body: string },
  mergeData: Record<string, string>
): { subject: string; body: string } {
  const replace = (str: string) =>
    str.replace(/\{\{(\w+)\}\}/g, (_, key) => mergeData[key] || "");
  return { subject: replace(template.subject), body: replace(template.body) };
}

/** Merge field definitions per template type */
export const TEMPLATE_MERGE_FIELDS: Record<string, { key: string; label: string }[]> = {
  quote: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "recipientName", label: "Recipient Name" },
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "orderNumber", label: "Order Number" },
  ],
  sales_order: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "recipientName", label: "Recipient Name" },
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "orderNumber", label: "Order Number" },
  ],
  invoice: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "recipientName", label: "Recipient Name" },
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "orderNumber", label: "Order Number" },
    { key: "invoiceNumber", label: "Invoice Number" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "dueDate", label: "Due Date" },
  ],
  purchase_order: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "vendorName", label: "Vendor Name" },
    { key: "vendorContactName", label: "Vendor Contact" },
    { key: "orderNumber", label: "Order Number" },
    { key: "poNumber", label: "PO Number" },
    { key: "supplierInHandsDate", label: "In-Hands Date" },
  ],
  presentation: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "recipientName", label: "Recipient Name" },
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "orderNumber", label: "Order Number" },
  ],
  proof: [
    { key: "companyName", label: "Company Name" },
    { key: "senderName", label: "Sender Name" },
    { key: "recipientName", label: "Recipient Name" },
    { key: "recipientFirstName", label: "Recipient First Name" },
    { key: "artworkList", label: "Artwork List" },
  ],
};

export const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  quote: "Quote",
  sales_order: "Sales Order",
  invoice: "Invoice",
  purchase_order: "Purchase Order",
  presentation: "Presentation",
  proof: "Proof",
};
