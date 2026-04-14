import type { MediaLibraryItem } from "@/lib/media-library";

export type { MediaLibraryItem };

export interface MediaLibraryFilters {
  folder?: string;
  category?: string;
  companyId?: string;
  orderId?: string;
  search?: string;
  mimeType?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export interface MediaLibraryListResponse {
  items: MediaLibraryItem[];
  total: number;
}

export interface UploadInput {
  files: File[];
  folder?: string;
  category?: string;
  orderId?: string;
  companyId?: string;
}
