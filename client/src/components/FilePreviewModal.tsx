import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

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

  const handleDownload = () => {
    if (file.filePath && file.filePath.includes('cloudinary.com')) {
      window.open(file.filePath, "_blank");
    } else {
      window.open(`/api/files/download/${file.fileName}`, "_blank");
    }
  };

  const getFileUrl = () => {
    if (file.filePath && file.filePath.includes('cloudinary.com')) {
      // For PDFs from Cloudinary, use proxy to avoid CORS/auth issues
      if (file.mimeType === 'application/pdf') {
        return `/api/files/cloudinary-proxy?url=${encodeURIComponent(file.filePath)}`;
      }
      // Use original Cloudinary URL for images
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(getFileUrl(), "_blank")}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
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
