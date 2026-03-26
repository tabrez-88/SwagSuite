import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  file: {
    originalName: string;
    filePath: string;
    mimeType: string;
    fileName: string;
  } | null;
}

export function FilePreviewModal({ open, onClose, file }: FilePreviewModalProps) {
  if (!file) return null;

  const handleDownload = async () => {
    const url = file.filePath?.includes('cloudinary.com')
      ? file.filePath
      : `/api/files/download/${file.fileName}`;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = file.originalName || file.fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab if fetch fails
      window.open(url, "_blank");
    }
  };

  const getFileUrl = () => {
    if (file.filePath && file.filePath.includes('cloudinary.com')) {
      if (file.mimeType === 'application/pdf') {
        // Use Google Docs Viewer for Cloudinary PDFs (same pattern as client approval page)
        return `https://docs.google.com/gview?url=${encodeURIComponent(file.filePath)}&embedded=true&t=${Date.now()}`;
      }
      return file.filePath;
    }
    return `/api/files/download/${file.fileName}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="truncate">{file.originalName}</span>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="w-full h-[70vh] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {file.mimeType.startsWith('image/') ? (
            <img
              src={getFileUrl()}
              alt={file.originalName}
              className="max-w-full max-h-full object-contain"
            />
          ) : file.mimeType === 'application/pdf' ? (
            <iframe
              src={getFileUrl()}
              className="w-full h-full border-0"
              title={file.originalName}
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-600 mb-4">Preview not available for this file type</p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
