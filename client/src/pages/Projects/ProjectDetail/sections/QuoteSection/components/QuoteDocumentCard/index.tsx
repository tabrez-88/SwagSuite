import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Send } from "lucide-react";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import type { GeneratedDocument } from "@shared/schema";
import type { OrderItem } from "@shared/schema";

interface QuoteDocumentCardProps {
  quoteDocuments: GeneratedDocument[];
  orderItems: OrderItem[];
  isGenerating: boolean;
  isLocked: boolean;
  isDeleting: boolean;
  isQuoteStale: (doc: GeneratedDocument) => boolean;
  handleGenerateQuote: () => void;
  handleRegenerateQuote: (docId: string) => Promise<void>;
  handleGetApprovalLink: (doc: GeneratedDocument) => Promise<void>;
  setPreviewDocument: (doc: GeneratedDocument | null) => void;
  deleteDocument: (docId: string) => Promise<void>;
  onSendClick: () => void;
}

export default function QuoteDocumentCard({
  quoteDocuments,
  orderItems,
  isGenerating,
  isLocked,
  isDeleting,
  isQuoteStale,
  handleGenerateQuote,
  handleRegenerateQuote,
  handleGetApprovalLink,
  setPreviewDocument,
  deleteDocument,
  onSendClick,
}: QuoteDocumentCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Quote Document
          </CardTitle>
          <div className="flex items-center gap-2">
            {quoteDocuments.length > 0 && !isLocked && (
              <Button size="sm" onClick={onSendClick}>
                <Send className="w-4 h-4 mr-1.5" />
                Send to Client
              </Button>
            )}
            {quoteDocuments.length === 0 && orderItems.length > 0 && (
              <Button
                size="sm"
                onClick={handleGenerateQuote}
                disabled={isGenerating || isLocked}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-1.5" />
                )}
                Generate Quote PDF
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {quoteDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quote document generated yet</h3>
            {orderItems.length > 0 && (
              <p className="text-sm text-gray-500">Click "Generate Quote PDF" to create a professional quote</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {quoteDocuments.map((doc) => (
              <GeneratedDocumentCard
                key={doc.id}
                document={doc}
                isStale={isQuoteStale(doc)}
                onPreview={() => setPreviewDocument(doc)}
                onDelete={async () => { await deleteDocument(doc.id); }}
                onRegenerate={isLocked ? undefined : () => handleRegenerateQuote(doc.id)}
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
