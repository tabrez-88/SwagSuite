import { DocumentEditor } from "@/components/feature/DocumentEditor";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import SendSODialog from "@/components/modals/SendSODialog";
import ProductsSection from "@/components/sections/ProductsSection";
import LockBanner from "@/components/shared/LockBanner";
import TimelineWarningBanner from "@/components/shared/TimelineWarningBanner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import OrderInfoCard from "./components/OrderInfoCard";
import SODocumentCard from "./components/SODocumentCard";
import SOEditDialog from "./components/SOEditDialog";
import { useSalesOrderSection } from "./hooks";
import type { SalesOrderSectionProps } from "./types";

export default function SalesOrderSection(props: SalesOrderSectionProps) {
  const { projectId, lockStatus } = props;
  const hook = useSalesOrderSection(props);
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!hook.order) return null;

  return (
    <div className="space-y-6">
      {lockStatus && <LockBanner lockStatus={lockStatus} sectionName="Sales Order" sectionKey="salesOrder" projectId={projectId} />}
      <TimelineWarningBanner conflicts={hook.timelineConflicts} />

      <ProjectInfoBar companyName={hook.companyName} primaryContact={hook.primaryContact} />

      {/* Sales Order Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <Select value={hook.currentStatus} onValueChange={(val) => hook.updateStatusMutation.mutate(val)} disabled={hook.isLocked}>
              <SelectTrigger className="w-[220px] h-9">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${hook.statusInfo.color.split(" ")[0]}`} />
                    {hook.statusInfo.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {hook.salesOrderStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${s.color.split(" ")[0]}`} />
                      {s.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sales Order Date (read-only) */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Sales Order Date</label>
            <span className="text-sm font-medium">{hook.order.createdAt ? format(new Date(String(hook.order.createdAt)), "MMM d, yyyy") : "—"}</span>
          </div>

          {/* Deposit Status Badge */}
          {hook.order.depositPercent && Number(hook.order.depositPercent) > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Deposit</label>
              {hook.order.depositStatus === "received" ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">Deposit Received</Badge>
              ) : hook.order.depositStatus === "pending" ? (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">Deposit Pending</Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Deposit Required</Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={hook.handleDuplicate}
            disabled={hook.isDuplicating}
          >
            {hook.isDuplicating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Copy className="w-4 h-4 mr-1.5" />}
            Duplicate Order
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => hook.setIsInfoCollapsed(!hook.isInfoCollapsed)}
          >
            {hook.isInfoCollapsed ? (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand Info
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse Info
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Order Info Section */}
      {!hook.isInfoCollapsed && (
        <OrderInfoCard
          projectId={projectId}
          order={hook.order}
          isLocked={hook.isLocked}
          onEditClick={() => setShowEditDialog(true)}
          updateField={hook.updateField}
          isFieldPending={hook.isFieldPending}
          primaryContact={hook.primaryContact}
        />
      )}

      <ProductsSection projectId={projectId} data={hook.data} isLocked={hook.isLocked} />

      {/* Sales Order Document Section */}
      <SODocumentCard
        soDocuments={hook.soDocuments}
        orderItems={hook.orderItems}
        isGenerating={hook.isGenerating}
        isLocked={hook.isLocked}
        isDeleting={hook.isDeleting}
        isSOStale={hook.isSOStale}
        handleGenerateSO={hook.handleGenerateSO}
        handleRegenerateSO={hook.handleRegenerateSO}
        handleGetApprovalLink={hook.handleGetApprovalLink}
        setPreviewDocument={hook.setPreviewDocument}
        deleteDocument={hook.deleteDocument}
        onSendClick={() => hook.setShowSendDialog(true)}
      />

      {/* SO Details Edit Dialog */}
      <SOEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        order={hook.order}
        updateField={hook.updateField}
        isFieldPending={hook.isFieldPending}
      />

      {/* Document Editor Modal */}
      {hook.previewDocument && (
        <DocumentEditor
          document={hook.previewDocument}
          order={hook.order}
          orderItems={hook.orderItems}
          companyName={hook.companyName}
          primaryContact={hook.primaryContact}
          getEditedItem={hook.getEditedItem}
          onClose={() => hook.setPreviewDocument(null)}
          allArtworkItems={hook.allArtworkItems}
        />
      )}

      {/* Send SO to Client Dialog */}
      {hook.showSendDialog && hook.soDocuments.length > 0 && (
        <SendSODialog
          open={hook.showSendDialog}
          onOpenChange={hook.setShowSendDialog}
          projectId={projectId}
          recipientEmail={hook.primaryContact?.email || ""}
          recipientName={hook.primaryContact ? `${hook.primaryContact.firstName} ${hook.primaryContact.lastName}` : hook.companyName}
          companyName={hook.companyName}
          orderNumber={hook.order?.orderNumber || ""}
          soDocument={hook.soDocuments[0]}
          soTotal={hook.soTotal}
          quoteApprovals={hook.quoteApprovals}
          createQuoteApproval={hook.createQuoteApproval}
          contacts={hook.contactsList}
          assignedUserEmail={hook.data?.assignedUser?.email}
        />
      )}

      {/* Duplicate Order Confirmation */}
      <AlertDialog open={hook.showDuplicateConfirm} onOpenChange={hook.setShowDuplicateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5" />
              Duplicate Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              A new project will be created with all items, line items, charges, artwork, and settings copied from this order. The new project will start as a fresh draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={hook.confirmDuplicate} disabled={hook.isDuplicating}>
              {hook.isDuplicating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
              Duplicate
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
