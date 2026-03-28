import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BillsSectionProps, BillFormData } from "./types";

const emptyForm: BillFormData = {
  supplierId: "",
  documentId: "",
  invoiceNumber: "",
  amount: "",
  dueDate: "",
  notes: "",
};

export function useBillsSection({ projectId, data }: BillsSectionProps) {
  const { vendorInvoices, orderVendors, companyName, primaryContact } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [billForm, setBillForm] = useState<BillFormData>({ ...emptyForm });

  // Fetch PO documents for linking
  const { data: allDocuments = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/documents`],
    enabled: !!projectId,
  });
  const poDocuments = allDocuments.filter((d: any) => d.documentType === "purchase_order");

  // Group vendor invoices by supplier
  const invoicesByVendor = vendorInvoices.reduce((acc: Record<string, any[]>, inv: any) => {
    const key = inv.supplierId || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(inv);
    return acc;
  }, {});

  const createBillMutation = useMutation({
    mutationFn: async (formData: BillFormData) => {
      return apiRequest("POST", `/api/projects/${projectId}/vendor-invoices`, {
        supplierId: formData.supplierId || null,
        documentId: formData.documentId || null,
        invoiceNumber: formData.invoiceNumber,
        amount: formData.amount,
        dueDate: formData.dueDate || null,
        notes: formData.notes || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Vendor bill created" });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/vendor-invoices`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activities`] });
      setShowCreate(false);
      setBillForm({ ...emptyForm });
    },
    onError: () => toast({ title: "Failed to create bill", variant: "destructive" }),
  });

  const openCreateForVendor = (supplierId?: string) => {
    const vendorDoc = supplierId
      ? poDocuments.find((d: any) => d.vendorId === supplierId)
      : undefined;
    setBillForm({
      supplierId: supplierId || "",
      documentId: vendorDoc?.id || "",
      invoiceNumber: "",
      amount: "",
      dueDate: "",
      notes: "",
    });
    setShowCreate(true);
  };

  const handleVendorChange = (val: string) => {
    const vendorDoc = poDocuments.find((d: any) => d.vendorId === val);
    setBillForm(f => ({ ...f, supplierId: val, documentId: vendorDoc?.id || "" }));
  };

  const handleDocumentChange = (val: string) => {
    setBillForm(f => ({ ...f, documentId: val }));
  };

  const handleFieldChange = (field: keyof BillFormData, value: string) => {
    setBillForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = () => {
    if (!billForm.invoiceNumber.trim() || !billForm.amount) return;
    createBillMutation.mutate({
      ...billForm,
      documentId: billForm.documentId === "none" ? "" : billForm.documentId,
    });
  };

  const closeDialog = () => setShowCreate(false);

  // Summary calculations
  const totalAmount = vendorInvoices.reduce((s: number, v: any) => s + Number(v.amount || 0), 0);
  const paidCount = vendorInvoices.filter((v: any) => v.status === "paid").length;

  const filteredPoDocuments = poDocuments.filter(
    (d: any) => !billForm.supplierId || d.vendorId === billForm.supplierId
  );

  const canSubmit = !createBillMutation.isPending && !!billForm.invoiceNumber.trim() && !!billForm.amount;

  return {
    // Data
    vendorInvoices,
    orderVendors,
    companyName,
    primaryContact,
    poDocuments,
    invoicesByVendor,
    filteredPoDocuments,
    totalAmount,
    paidCount,

    // Form state
    showCreate,
    billForm,
    canSubmit,
    isCreating: createBillMutation.isPending,

    // Handlers
    openCreateForVendor,
    closeDialog,
    handleVendorChange,
    handleDocumentChange,
    handleFieldChange,
    handleSubmit,
  };
}
