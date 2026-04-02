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
  status: "pending",
};

export function useBillsSection({ projectId, data }: BillsSectionProps) {
  const { vendorInvoices, orderVendors, companyName, primaryContact } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [billForm, setBillForm] = useState<BillFormData>({ ...emptyForm });
  const [editForm, setEditForm] = useState<BillFormData>({ ...emptyForm });

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/vendor-invoices`] });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/documents`] });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activities`] });
  };

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
      invalidateAll();
      setShowCreate(false);
      setBillForm({ ...emptyForm });
    },
    onError: () => toast({ title: "Failed to create bill", variant: "destructive" }),
  });

  const updateBillMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: BillFormData }) => {
      const res = await apiRequest("PATCH", `/api/projects/${projectId}/vendor-invoices/${id}`, {
        invoiceNumber: formData.invoiceNumber,
        amount: formData.amount,
        dueDate: formData.dueDate || null,
        notes: formData.notes || null,
        status: formData.status,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Vendor bill updated" });
      invalidateAll();
      setShowEdit(false);
      setEditingBill(null);
      setEditForm({ ...emptyForm });
    },
    onError: () => toast({ title: "Failed to update bill", variant: "destructive" }),
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
      status: "pending",
    });
    setShowCreate(true);
  };

  const openEditBill = (bill: any) => {
    setEditingBill(bill);
    setEditForm({
      supplierId: bill.supplierId || "",
      documentId: bill.documentId || "",
      invoiceNumber: bill.invoiceNumber || "",
      amount: String(bill.amount || ""),
      dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split("T")[0] : "",
      notes: bill.notes || "",
      status: bill.status || "pending",
    });
    setShowEdit(true);
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

  const handleEditFieldChange = (field: keyof BillFormData, value: string) => {
    setEditForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = () => {
    if (!billForm.invoiceNumber.trim() || !billForm.amount) return;
    createBillMutation.mutate({
      ...billForm,
      documentId: billForm.documentId === "none" ? "" : billForm.documentId,
    });
  };

  const handleEditSubmit = () => {
    if (!editingBill || !editForm.invoiceNumber.trim() || !editForm.amount) return;
    updateBillMutation.mutate({ id: editingBill.id, formData: editForm });
  };

  const closeDialog = () => setShowCreate(false);
  const closeEditDialog = () => {
    setShowEdit(false);
    setEditingBill(null);
  };

  // Summary calculations
  const totalAmount = vendorInvoices.reduce((s: number, v: any) => s + Number(v.amount || 0), 0);
  const paidCount = vendorInvoices.filter((v: any) => v.status === "paid").length;

  const filteredPoDocuments = poDocuments.filter(
    (d: any) => !billForm.supplierId || d.vendorId === billForm.supplierId
  );

  const canSubmit = !createBillMutation.isPending && !!billForm.invoiceNumber.trim() && !!billForm.amount;
  const canEditSubmit = !updateBillMutation.isPending && !!editForm.invoiceNumber.trim() && !!editForm.amount;

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

    // Create form state
    showCreate,
    billForm,
    canSubmit,
    isCreating: createBillMutation.isPending,

    // Edit form state
    showEdit,
    editingBill,
    editForm,
    canEditSubmit,
    isUpdating: updateBillMutation.isPending,

    // Handlers
    openCreateForVendor,
    closeDialog,
    handleVendorChange,
    handleDocumentChange,
    handleFieldChange,
    handleSubmit,
    openEditBill,
    closeEditDialog,
    handleEditFieldChange,
    handleEditSubmit,
  };
}
