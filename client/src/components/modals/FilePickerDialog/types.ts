import type { MediaLibraryItem } from "@/lib/media-library";

export interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (files: MediaLibraryItem[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  contextOrderId?: string;
  contextCompanyId?: string;
  title?: string;
}

export interface FilterOption {
  label: string;
  value: string;
  isFolder?: boolean;
}

export const FILTER_OPTIONS: FilterOption[] = [
  { label: "All", value: "" },
  { label: "Images", value: "image/" },
  { label: "Documents", value: "application/pdf" },
  { label: "Design Files", value: "design-files", isFolder: true },
];

export type { MediaLibraryItem };
