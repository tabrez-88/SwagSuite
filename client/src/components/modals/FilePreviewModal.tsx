import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { getRenderableImageUrl } from "@/lib/media-library";
import { fetchFileBlob, downloadFile } from "@/services/media-library/requests";

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

// File extensions that Google Docs Viewer can preview
const GDOCS_EXTENSIONS = new Set([
  "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "tsv", "txt", "rtf",
]);

// MIME types that Google Docs Viewer can preview (excluding PDF — handled natively)
const GDOCS_MIMETYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
  "application/rtf",
]);

// MIME types for native video playback
const VIDEO_MIMETYPES = ["video/mp4", "video/webm", "video/ogg"];

// MIME types for native audio playback
const AUDIO_MIMETYPES = ["audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/mp3"];

function getFileExtension(filePath: string): string {
  return filePath.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase() || "";
}

function getNameExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

function isPdf(mimeType: string, filePath: string, originalName: string): boolean {
  if (mimeType === "application/pdf") return true;
  if (getFileExtension(filePath) === "pdf") return true;
  return getNameExtension(originalName) === "pdf";
}

function canUseGDocsViewer(mimeType: string, filePath: string, originalName: string): boolean {
  if (GDOCS_MIMETYPES.has(mimeType)) return true;
  if (GDOCS_EXTENSIONS.has(getFileExtension(filePath))) return true;
  return GDOCS_EXTENSIONS.has(getNameExtension(originalName));
}

function isVideo(mimeType: string, filePath: string): boolean {
  if (VIDEO_MIMETYPES.some((t) => mimeType.startsWith(t))) return true;
  return ["mp4", "webm", "ogg", "mov"].includes(getFileExtension(filePath));
}

function isAudio(mimeType: string, filePath: string): boolean {
  if (AUDIO_MIMETYPES.some((t) => mimeType.startsWith(t))) return true;
  return ["mp3", "wav", "ogg", "m4a", "flac"].includes(getFileExtension(filePath));
}

/** Fetches PDF as blob to bypass Content-Disposition: attachment from Cloudinary */
function PdfViewer({ url, title }: { url: string; title: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let revoke: string | null = null;
    fetchFileBlob(url)
      .then((blob) => {
        const u = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        revoke = u;
        setBlobUrl(u);
      })
      .catch(() => setError(true));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [url]);

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-2">Could not load PDF preview</p>
        <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
          Open in new tab
        </Button>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading PDF...
      </div>
    );
  }

  return <iframe src={blobUrl} className="w-full h-full border-0" title={title} />;
}

export function FilePreviewModal({ open, onClose, file }: FilePreviewModalProps) {
  if (!file) return null;

  const handleDownload = async () => {
    const url = file.filePath?.includes('cloudinary.com')
      ? file.filePath
      : `/api/files/download/${file.fileName}`;
    try {
      await downloadFile(url, file.originalName || file.fileName || "download");
    } catch {
      window.open(url, "_blank");
    }
  };

  const getDirectUrl = () => {
    if (file.filePath && file.filePath.includes('cloudinary.com')) {
      return file.filePath;
    }
    return `/api/files/download/${file.fileName}`;
  };

  const getGDocsViewerUrl = () => {
    // Google Docs Viewer needs a publicly accessible URL
    if (!file.filePath?.includes('cloudinary.com')) return null;

    // Ensure URL has file extension for type detection
    let url = file.filePath;
    const urlExt = getFileExtension(url);
    if (!urlExt || !GDOCS_EXTENSIONS.has(urlExt)) {
      const nameExt = getNameExtension(file.originalName);
      if (nameExt && GDOCS_EXTENSIONS.has(nameExt)) {
        url = url.includes('?') ? url : `${url}.${nameExt}`;
      }
    }

    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true&t=${Date.now()}`;
  };

  const renderableUrl = getRenderableImageUrl(file.filePath);

  const renderPreview = () => {
    // 1. Native image types
    if (file.mimeType.startsWith('image/')) {
      return (
        <img
          src={getDirectUrl()}
          alt={file.originalName}
          className="max-w-full max-h-full object-contain"
        />
      );
    }

    // 2. Design files (.ai, .eps, .psd) via Cloudinary transform
    if (renderableUrl) {
      return (
        <img
          src={renderableUrl}
          alt={file.originalName}
          className="max-w-full max-h-full object-contain"
        />
      );
    }

    // 3. PDF — fetch as blob to avoid Cloudinary Content-Disposition: attachment
    if (isPdf(file.mimeType, file.filePath, file.originalName)) {
      return <PdfViewer url={getDirectUrl()} title={file.originalName} />;
    }

    // 4. Video files
    if (isVideo(file.mimeType, file.filePath)) {
      return (
        <video controls className="max-w-full max-h-full">
          <source src={getDirectUrl()} />
          Your browser does not support video playback.
        </video>
      );
    }

    // 5. Audio files
    if (isAudio(file.mimeType, file.filePath)) {
      return (
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-3xl">🎵</span>
          </div>
          <p className="text-sm text-gray-600">{file.originalName}</p>
          <audio controls className="w-full max-w-md">
            <source src={getDirectUrl()} />
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }

    // 6. Documents/spreadsheets via Google Docs Viewer
    if (canUseGDocsViewer(file.mimeType, file.filePath, file.originalName)) {
      const gdocsUrl = getGDocsViewerUrl();
      if (gdocsUrl) {
        return (
          <iframe
            src={gdocsUrl}
            className="w-full h-full border-0"
            title={file.originalName}
          />
        );
      }
    }

    // 7. Fallback
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">Preview not available for this file type</p>
        <Button onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent
        className="max-w-5xl max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
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
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
