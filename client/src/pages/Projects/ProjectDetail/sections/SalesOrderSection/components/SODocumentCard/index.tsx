import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeneratedDocument } from "@shared/schema";
import type { EnrichedOrderItem } from "@/types/project-types";
import { FileText, Loader2, Send } from "lucide-react";

interface SODocumentCardProps {
  soDocuments: GeneratedDocument[];
  orderItems: EnrichedOrderItem[];
  isGenerating: boolean;
  isLocked: boolean;
  isDeleting: boolean;
  isSOStale: (doc: GeneratedDocument) => boolean;
  handleGenerateSO: () => void;
  handleRegenerateSO: (docId: string) => void;
  handleGetApprovalLink: (doc: GeneratedDocument) => void;
  setPreviewDocument: (doc: GeneratedDocument) => void;
  deleteDocument: (docId: string) => Promise<unknown>;
  onSendClick: () => void;
}

export default function SODocumentCard({
  soDocuments,
  orderItems,
  isGenerating,
  isLocked,
  isDeleting,
  isSOStale,
  handleGenerateSO,
  handleRegenerateSO,
  handleGetApprovalLink,
  setPreviewDocument,
  deleteDocument,
  onSendClick,
}: SODocumentCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Sales Order Document
          </CardTitle>
          <div className="flex items-center gap-2">
            {soDocuments.length > 0 && (
              <Button
                size="sm"
                variant="default"
                onClick={onSendClick}
                disabled={isLocked}
              >
                <Send className="w-4 h-4 mr-1.5" />
                Send to Client
              </Button>
            )}
            {soDocuments.length === 0 && orderItems.length > 0 && (
              <Button
                size="sm"
                onClick={handleGenerateSO}
                disabled={isGenerating || isLocked}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-1.5" />
                )}
                Generate Sales Order PDF
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {soDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sales order document generated yet</h3>
            {orderItems.length > 0 && (
              <p className="text-sm text-gray-500">Click "Generate Sales Order PDF" to create a professional document</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {soDocuments.map((doc) => (
              <GeneratedDocumentCard
                key={doc.id}
                document={doc}
                isStale={isSOStale(doc)}
                onPreview={() => setPreviewDocument(doc)}
                onDelete={async () => { await deleteDocument(doc.id); }}
                onRegenerate={isLocked ? undefined : () => handleRegenerateSO(doc.id)}
                onGetApprovalLink={isLocked ? undefined : () => handleGetApprovalLink(doc)}
                isDeleting={isDeleting || isLocked}
                isRegenerating={isGenerating}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
