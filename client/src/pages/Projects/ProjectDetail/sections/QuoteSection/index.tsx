import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowRight, Info } from "lucide-react";
import { format } from "date-fns";
import LockBanner from "@/components/shared/LockBanner";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import StageConversionDialog from "../../components/StageConversionDialog";
import { DocumentEditor } from "@/components/feature/DocumentEditor";
import { PdfPreviewDialog } from "@/components/documents/pdf/PdfPreviewDialog";
import SendQuoteDialog from "@/components/modals/SendQuoteDialog";
import ProductsSection from "@/components/sections/ProductsSection";

import { useQuoteSection } from "./hooks";
import { quoteStatuses } from "./types";
import { getEditedItem } from "@/lib/projectDetailUtils";
import type { QuoteSectionProps } from "./types";

import QuoteDetailsCard from "./components/QuoteDetailsCard";
import QuoteEditDialog from "./components/QuoteEditDialog";
import QuoteDocumentCard from "./components/QuoteDocumentCard";
import ApprovalStatusCard from "./components/ApprovalStatusCard";

export default function QuoteSection(props: QuoteSectionProps) {
  const {
    order,
    orderItems,
    quoteApprovals,
    companyName,
    primaryContact,
    allArtworkItems,
    enrichedItems,
    contactsList,
    data,
    currentStatus,
    statusInfo,
    isQuotePhase,
    isLocked,
    quoteDocuments,
    isGenerating,
    isDeleting,
    deleteDocument,
    createQuoteApproval,
    buildQuoteDoc,
    showLivePreview,
    setShowLivePreview,
    updateField,
    isFieldPending,
    updateStatusMutation,
    showConversionDialog,
    setShowConversionDialog,
    previewDocument,
    setPreviewDocument,
    showSendDialog,
    setShowSendDialog,
    handleGenerateQuote,
    handleRegenerateQuote,
    handleGetApprovalLink,
    handleConversionSuccess,
    isQuoteStale,
  } = useQuoteSection(props);

  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!order) return null;

  return (
    <div className="space-y-6">
      {props.lockStatus && <LockBanner lockStatus={props.lockStatus} sectionName="Quote" sectionKey="quote" projectId={props.projectId} />}

      <ProjectInfoBar companyName={companyName} primaryContact={primaryContact} />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <Select value={currentStatus} onValueChange={(val) => updateStatusMutation.mutate(val)} disabled={isLocked}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${statusInfo.color.split(" ")[0]}`} />
                    {statusInfo.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {quoteStatuses.map((s) => (
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

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Quote Date</label>
            <span className="text-sm font-medium">{order.createdAt ? format(new Date(String(order.createdAt)), "MMM d, yyyy") : "—"}</span>
          </div>
        </div>

        {!isLocked && (
          <div className="flex items-center gap-2">
            <Switch
              id="auto-approve-so"
              checked={(order?.stageData as Record<string, unknown>)?.quoteAutoApproveSo !== false}
              onCheckedChange={(checked) => {
                const currentStageData = order?.stageData || {};
                updateField({
                  stageData: { ...currentStageData, quoteAutoApproveSo: checked },
                });
              }}
              disabled={isFieldPending}
            />
            <Label htmlFor="auto-approve-so" className="text-sm text-muted-foreground cursor-pointer">
              Auto-approve SO on quote acceptance
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p className="text-xs">When ON, the Sales Order will be automatically set to "Client Approved" when the client accepts the quote. When OFF, the SO will require separate review and approval.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Quote Details + Addresses */}
      <QuoteDetailsCard
        projectId={props.projectId}
        order={order}
        isLocked={isLocked}
        onEditClick={() => setShowEditDialog(true)}
        updateField={updateField}
        isFieldPending={isFieldPending}
        primaryContact={primaryContact}
      />

      {/* Quote Edit Dialog */}
      <QuoteEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        order={order}
        updateField={updateField}
        isFieldPending={isFieldPending}
      />

      {/* Stage Conversion Banner */}
      {data.businessStage?.stage.id === "quote" && currentStatus === "approved" && (
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200 rounded-lg px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Quote approved!</h3>
            <p className="text-xs text-gray-500 mt-0.5">Convert to a sales order to proceed with fulfillment.</p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowConversionDialog(true)}
          >
            <ArrowRight className="w-4 h-4" />
            Convert to Sales Order
          </Button>
        </div>
      )}

      {/* Quote Products */}
      <ProductsSection projectId={props.projectId} data={data} isLocked={isLocked} />

      {/* Quote Document Section */}
      <QuoteDocumentCard
        quoteDocuments={quoteDocuments}
        orderItems={orderItems}
        isGenerating={isGenerating}
        isLocked={isLocked}
        isDeleting={isDeleting}
        isQuoteStale={isQuoteStale}
        handleGenerateQuote={handleGenerateQuote}
        handleRegenerateQuote={handleRegenerateQuote}
        handleGetApprovalLink={handleGetApprovalLink}
        setPreviewDocument={setPreviewDocument}
        deleteDocument={deleteDocument}
        onSendClick={() => setShowSendDialog(true)}
      />

      {/* Approval Status */}
      <ApprovalStatusCard
        quoteApprovals={quoteApprovals}
        isQuotePhase={isQuotePhase}
        primaryContact={primaryContact}
      />

      {/* Live PDF preview */}
      <PdfPreviewDialog
        open={showLivePreview}
        onOpenChange={setShowLivePreview}
        title={`Quote Preview — ${order?.orderNumber || ""}`}
        document={showLivePreview ? buildQuoteDoc() : null}
      />

      {/* Document Editor Modal */}
      {previewDocument && (
        <DocumentEditor
          document={previewDocument}
          order={order}
          orderItems={orderItems}
          companyName={companyName}
          primaryContact={primaryContact}
          getEditedItem={getEditedItem}
          onClose={() => setPreviewDocument(null)}
          allArtworkItems={allArtworkItems}
        />
      )}

      {showSendDialog && quoteDocuments.length > 0 && (
        <SendQuoteDialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          projectId={props.projectId}
          recipientEmail={primaryContact?.email || ""}
          recipientName={primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName}
          companyName={companyName}
          orderNumber={order?.orderNumber || ""}
          quoteDocument={quoteDocuments[0]}
          primaryContact={primaryContact}
          quoteTotal={Number(order.total || 0)}
          quoteApprovals={quoteApprovals}
          createQuoteApproval={createQuoteApproval}
          contacts={contactsList}
          assignedUserEmail={data?.assignedUser?.email}
        />
      )}

      {showConversionDialog && (
        <StageConversionDialog
          open={showConversionDialog}
          onOpenChange={setShowConversionDialog}
          targetStage="sales_order"
          projectId={props.projectId}
          enrichedItems={enrichedItems}
          onSuccess={handleConversionSuccess}
        />
      )}
    </div>
  );
}
