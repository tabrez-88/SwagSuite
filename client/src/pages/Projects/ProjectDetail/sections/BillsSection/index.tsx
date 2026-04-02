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
import { FileText, Building2, Plus, Loader2, Link2, Pencil } from "lucide-react";
import { format } from "date-fns";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import { useBillsSection } from "./hooks";
import { billStatusColors, BILL_STATUSES } from "./types";
import type { BillsSectionProps } from "./types";

export default function BillsSection(props: BillsSectionProps) {
  const {
    vendorInvoices,
    orderVendors,
    companyName,
    primaryContact,
    poDocuments,
    invoicesByVendor,
    filteredPoDocuments,
    totalAmount,
    paidCount,
    showCreate,
    billForm,
    canSubmit,
    isCreating,
    showEdit,
    editingBill,
    editForm,
    canEditSubmit,
    isUpdating,
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
  } = useBillsSection(props);

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
                  ${totalAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {paidCount}
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
                              {inv.dueDate && (
                                <p className="text-xs text-gray-500">
                                  Due {format(new Date(inv.dueDate), "MMM d, yyyy")}
                                </p>
                              )}
                              {linkedDoc && (
                                <span className="text-xs text-blue-600 flex items-center gap-1">
                                  <Link2 className="w-3 h-3" />
                                  PO #{linkedDoc.documentNumber}
                                </span>
                              )}
                            </div>
                            {inv.notes && (
                              <p className="text-xs text-gray-400 mt-1">{inv.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">
                              ${Number(inv.amount || 0).toLocaleString()}
                            </span>
                            <Badge className={billStatusColors[inv.status] || ""}>
                              {inv.status?.toUpperCase()}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditBill(inv)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
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

      {/* Create Bill Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => !open && closeDialog()}>
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
              <Select value={billForm.supplierId} onValueChange={handleVendorChange}>
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
                <Select value={billForm.documentId} onValueChange={handleDocumentChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select PO (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No PO link</SelectItem>
                    {filteredPoDocuments.map((d: any) => (
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
                <Input value={billForm.invoiceNumber} onChange={(e) => handleFieldChange("invoiceNumber", e.target.value)} placeholder="INV-001" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Amount *</label>
                <Input type="number" step="0.01" value={billForm.amount} onChange={(e) => handleFieldChange("amount", e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Due Date</label>
              <Input type="date" value={billForm.dueDate} onChange={(e) => handleFieldChange("dueDate", e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Notes</label>
              <Textarea value={billForm.notes} onChange={(e) => handleFieldChange("notes", e.target.value)} className="min-h-[80px] resize-none text-sm" placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="gap-1"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog open={showEdit} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" /> Edit Bill
            </DialogTitle>
            <DialogDescription>
              Update vendor bill details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Invoice Number *</label>
                <Input value={editForm.invoiceNumber} onChange={(e) => handleEditFieldChange("invoiceNumber", e.target.value)} placeholder="INV-001" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Amount *</label>
                <Input type="number" step="0.01" value={editForm.amount} onChange={(e) => handleEditFieldChange("amount", e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
              <Select value={editForm.status} onValueChange={(val) => handleEditFieldChange("status", val)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {BILL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Due Date</label>
              <Input type="date" value={editForm.dueDate} onChange={(e) => handleEditFieldChange("dueDate", e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Notes</label>
              <Textarea value={editForm.notes} onChange={(e) => handleEditFieldChange("notes", e.target.value)} className="min-h-[80px] resize-none text-sm" placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>Cancel</Button>
            <Button
              onClick={handleEditSubmit}
              disabled={!canEditSubmit}
              className="gap-1"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
