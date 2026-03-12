import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Building2, Plus, Loader2, Link2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProjectInfoBar from "@/components/ProjectInfoBar";
import type { ProjectData } from "@/types/project-types";

interface BillsSectionProps {
  orderId: string;
  data: ProjectData;
}

const billStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  vouched: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function BillsSection({ orderId, data }: BillsSectionProps) {
  const { vendorInvoices, orderVendors, companyName, primaryContact } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [billForm, setBillForm] = useState({
    supplierId: "",
    documentId: "",
    invoiceNumber: "",
    amount: "",
    dueDate: "",
    notes: "",
  });

  // Fetch PO documents for linking
  const { data: allDocuments = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/documents`],
    enabled: !!orderId,
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
    mutationFn: async (formData: typeof billForm) => {
      return apiRequest("POST", `/api/orders/${orderId}/vendor-invoices`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/vendor-invoices`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/activities`] });
      setShowCreate(false);
      setBillForm({ supplierId: "", documentId: "", invoiceNumber: "", amount: "", dueDate: "", notes: "" });
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

  return (
    <div className="space-y-6">
      <ProjectInfoBar companyName={companyName} primaryContact={primaryContact} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Bills
          </h2>
          <p className="text-sm text-gray-500">
            Vendor invoices and bills for this project
          </p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => openCreateForVendor()}>
          <Plus className="w-4 h-4" /> Record Bill
        </Button>
      </div>

      {vendorInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendor bills yet</h3>
            <p className="text-gray-500 mb-4">
              Record vendor bills to vouch against purchase orders
            </p>
            {orderVendors.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => openCreateForVendor()}>
                <Plus className="w-4 h-4" /> Record First Bill
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500">Total Bills</p>
                <p className="text-2xl font-bold">{vendorInvoices.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold">
                  ${vendorInvoices.reduce((s: number, v: any) => s + Number(v.amount || 0), 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {vendorInvoices.filter((v: any) => v.status === "paid").length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bills List */}
          {Object.entries(invoicesByVendor).map(([supplierId, invoices]) => {
            const vendor = orderVendors.find((v: any) => v.id === supplierId);
            return (
              <Card key={supplierId}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {vendor?.name || "Unknown Vendor"}
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openCreateForVendor(supplierId)}>
                      <Plus className="w-3 h-3" /> Add Bill
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(invoices as any[]).map((inv: any) => {
                      const linkedDoc = inv.documentId
                        ? poDocuments.find((d: any) => d.id === inv.documentId)
                        : null;
                      return (
                        <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">
                              Invoice #{inv.invoiceNumber || "N/A"}
                            </p>
                            <div className="flex items-center gap-2">
                              {inv.receivedDate && (
                                <p className="text-xs text-gray-500">
                                  Received {format(new Date(inv.receivedDate), "MMM d, yyyy")}
                                </p>
                              )}
                              {linkedDoc && (
                                <span className="text-xs text-blue-600 flex items-center gap-1">
                                  <Link2 className="w-3 h-3" />
                                  PO #{linkedDoc.documentNumber}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">
                              ${Number(inv.amount || 0).toLocaleString()}
                            </span>
                            <Badge className={billStatusColors[inv.status] || ""}>
                              {inv.status?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Bill Dialog ── */}
      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Record Vendor Bill
            </DialogTitle>
            <DialogDescription>
              Record a vendor invoice. Link it to a PO to auto-transition the PO to "Billed".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Vendor</label>
              <Select value={billForm.supplierId} onValueChange={(val) => {
                const vendorDoc = poDocuments.find((d: any) => d.vendorId === val);
                setBillForm(f => ({ ...f, supplierId: val, documentId: vendorDoc?.id || "" }));
              }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {orderVendors.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {poDocuments.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Link to PO (auto-vouching)</label>
                <Select value={billForm.documentId} onValueChange={(val) => setBillForm(f => ({ ...f, documentId: val }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select PO (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No PO link</SelectItem>
                    {poDocuments
                      .filter((d: any) => !billForm.supplierId || d.vendorId === billForm.supplierId)
                      .map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          PO #{d.documentNumber} — {d.vendorName || "Vendor"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">Linking auto-transitions "Ready for Billing" POs to "Billed"</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Invoice Number *</label>
                <Input value={billForm.invoiceNumber} onChange={(e) => setBillForm(f => ({ ...f, invoiceNumber: e.target.value }))} placeholder="INV-001" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Amount *</label>
                <Input type="number" step="0.01" value={billForm.amount} onChange={(e) => setBillForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Due Date</label>
              <Input type="date" value={billForm.dueDate} onChange={(e) => setBillForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Notes</label>
              <Textarea value={billForm.notes} onChange={(e) => setBillForm(f => ({ ...f, notes: e.target.value }))} className="min-h-[80px] resize-none text-sm" placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!billForm.invoiceNumber.trim() || !billForm.amount) return;
                createBillMutation.mutate({
                  ...billForm,
                  documentId: billForm.documentId === "none" ? "" : billForm.documentId,
                });
              }}
              disabled={createBillMutation.isPending || !billForm.invoiceNumber.trim() || !billForm.amount}
              className="gap-1"
            >
              {createBillMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
