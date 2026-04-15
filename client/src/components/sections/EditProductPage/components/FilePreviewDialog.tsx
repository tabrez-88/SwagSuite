import { FilePreviewModal } from "@/components/modals/FilePreviewModal";

interface FilePreviewDialogProps {
  previewFile: { url: string; name: string } | null;
  onClose: () => void;
}

export function FilePreviewDialog({ previewFile, onClose }: FilePreviewDialogProps) {
  if (!previewFile) return null;

  return (
    <FilePreviewModal
      open={true}
      file={{
        fileName: previewFile.name,
        originalName: previewFile.name,
        filePath: previewFile.url,
        mimeType: previewFile.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? "image/png" : "application/pdf",
      }}
      onClose={onClose}
    />
  );
}
