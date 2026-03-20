export interface PODetailPanelProps {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface PreviewFile {
  originalName: string;
  filePath: string;
  mimeType: string;
  fileName: string;
}
