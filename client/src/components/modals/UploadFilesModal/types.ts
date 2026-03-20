export interface FilePreview {
  file: File;
  preview?: string;
  productId?: string;
}

export interface ArtworkSelection {
  artworkId: string;
  artworkName: string;
  filePath: string;
  fileName: string;
  productId: string;
}

export interface UploadFilesModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: { file: File; productId?: string }[], notes: string) => void;
  fileType: string;
  products: Array<{
    id: string;
    productName: string;
    color?: string;
    size?: string;
  }>;
  availableProducts?: Array<{
    id: string;
    productName: string;
    color?: string;
    size?: string;
  }>;
  artworkItems?: Record<string, any[]>;
  uploading?: boolean;
}
