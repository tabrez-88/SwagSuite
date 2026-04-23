import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  RefreshCw,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useState } from "react";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface GeneratedDocumentCardProps {
  document: any;
  isStale?: boolean;
  onPreview: () => void;
  onDelete: () => Promise<void>;
  onRegenerate?: () => void;
  onGetApprovalLink?: () => void;
  isDeleting?: boolean;
  isRegenerating?: boolean;
}

export default function GeneratedDocumentCard({
  document: doc,
  isStale,
  onPreview,
  onDelete,
  onRegenerate,
  onGetApprovalLink,
  isDeleting,
  isRegenerating,
}: GeneratedDocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isProtected = doc.status === "approved" || doc.status === "sent";


  return (
    <>
      <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {doc.documentType === "quote" ? (
              <FileText className="w-5 h-5 text-blue-500" />
            ) : doc.documentType === "sales_order" ? (
              <FileText className="w-5 h-5 text-emerald-500" />
            ) : (
              <ShoppingCart className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">
              {doc.documentType === "quote" ? "Quote" : doc.documentType === "sales_order" ? "Sales Order" : doc.documentType === "purchase_order" ? "Purchase Order" : "Invoice"} #{doc.documentNumber}
            </p>
            {doc.vendorName && (
              <p className="text-xs text-gray-500">Vendor: {doc.vendorName}</p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(doc.createdAt), "MMM dd, yyyy")}
              </span>
              {doc.fileSize && (
                <span className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</span>
              )}
              {isStale && isProtected && (
                <Badge
                  variant="outline"
                  className="text-xs border-amber-500 text-amber-600 bg-amber-50 flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Items changed since {doc.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {/* Regenerate button — always available for non-protected docs */}
          {!isProtected && onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className={isStale ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : ""}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRegenerating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          )}
          {/* Approval link for quotes and sales orders */}
          {(doc.documentType === "quote" || doc.documentType === "sales_order") && onGetApprovalLink && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetApprovalLink}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Approval Link
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {doc.documentType === "quote" ? "quote" : doc.documentType === "sales_order" ? "sales order" : "purchase order"}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                await onDelete();
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
