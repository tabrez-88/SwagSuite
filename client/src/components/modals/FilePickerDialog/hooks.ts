import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMediaLibrary, useUploadToMediaLibrary } from "@/hooks/useMediaLibrary";
import { useToast } from "@/hooks/use-toast";
import { getFileTypeIcon } from "@/lib/media-library";
import type { FilePickerDialogProps, FilterOption, MediaLibraryItem } from "./types";
import { FILTER_OPTIONS } from "./types";

/** Infer MIME type from file extension when server doesn't provide it */
function inferMimeType(fileName: string | null, url: string | null): string | null {
  const source = fileName || url || "";
  const ext = source.split("?")[0].split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
    webp: "image/webp", svg: "image/svg+xml", bmp: "image/bmp", ico: "image/x-icon",
    pdf: "application/pdf", doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv", ai: "application/postscript", eps: "application/postscript",
  };
  return ext ? mimeMap[ext] || null : null;
}

/** Map an order file (from GET /api/projects/:id/files) to MediaLibraryItem shape */
function orderFileToMediaItem(file: any): MediaLibraryItem {
  const mimeType = file.mimeType || inferMimeType(file.originalName, file.filePath);
  return {
    id: `orderfile-${file.id}`,
    cloudinaryPublicId: file.fileName,
    cloudinaryUrl: file.filePath,
    cloudinaryResourceType: null,
    fileName: file.fileName,
    originalName: file.originalName,
    fileSize: file.fileSize,
    mimeType,
    fileExtension: file.originalName?.split(".").pop()?.toLowerCase() || null,
    thumbnailUrl: file.thumbnailPath || null,
    folder: "project",
    tags: file.tags || [],
    category: file.fileType || null,
    orderId: null,
    companyId: null,
    orderItemId: file.orderItemId || null,
    sourceTable: "order_files",
    sourceId: file.id,
    uploadedBy: file.uploadedBy || null,
    description: file.notes || null,
    createdAt: file.createdAt,
    updatedAt: file.createdAt,
  };
}

export function useFilePickerDialog({
  open,
  onClose,
  onSelect,
  multiple = false,
  maxFiles = 10,
  contextProjectId,
  contextCompanyId,
}: FilePickerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hasOrderContext = !!contextProjectId;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mimeFilter, setMimeFilter] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [selectedItems, setSelectedItems] = useState<Map<string, MediaLibraryItem>>(new Map());
  const [tab, setTab] = useState(hasOrderContext ? "project" : "library");
  const [isUploading, setIsUploading] = useState(false);

  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  // Library query
  const { data: libraryData, isLoading: libraryLoading } = useMediaLibrary({
    search: debouncedSearch || undefined,
    mimeType: mimeFilter || undefined,
    folder: folderFilter || undefined,
    limit: 100,
    enabled: open,
  });

  // Project files query
  const { data: projectFilesRaw, isLoading: projectFilesLoading } = useQuery<any[]>({
    queryKey: [`/api/projects/${contextProjectId}/files`],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${contextProjectId}/files`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && hasOrderContext,
  });

  const projectFiles = useMemo(() =>
    (projectFilesRaw || [])
      .filter((f: any) => f.filePath?.includes("cloudinary"))
      .map(orderFileToMediaItem),
    [projectFilesRaw],
  );

  const filteredProjectFiles = useMemo(() =>
    projectFiles.filter((f) => {
      if (debouncedSearch && !f.originalName.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (mimeFilter && !f.mimeType?.startsWith(mimeFilter)) return false;
      return true;
    }),
    [projectFiles, debouncedSearch, mimeFilter],
  );

  const libraryUploadMutation = useUploadToMediaLibrary();

  const handleProjectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !contextProjectId) return;
    const files = Array.from(e.target.files);
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("fileType", "other_document");
      const res = await fetch(`/api/projects/${contextProjectId}/files`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try { msg = JSON.parse(text).error || JSON.parse(text).message || text; } catch {}
        throw new Error(msg);
      }
      toast({ title: "Uploaded", description: `${files.length} file(s) uploaded to project.` });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${contextProjectId}/files`] });
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload files.", variant: "destructive" });
    }
    setIsUploading(false);
    if (projectFileInputRef.current) projectFileInputRef.current.value = "";
  };

  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    try {
      await libraryUploadMutation.mutateAsync({
        files,
        orderId: contextProjectId,
        companyId: contextCompanyId,
      });
      toast({ title: "Uploaded", description: `${files.length} file(s) uploaded.` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload files.", variant: "destructive" });
    }
    if (libraryFileInputRef.current) libraryFileInputRef.current.value = "";
  };

  const toggleSelect = (item: MediaLibraryItem) => {
    const newItems = new Map(selectedItems);
    if (newItems.has(item.id)) {
      newItems.delete(item.id);
    } else {
      if (!multiple) {
        newItems.clear();
      }
      if (newItems.size < maxFiles) {
        newItems.set(item.id, item);
      }
    }
    setSelectedItems(newItems);
  };

  const handleConfirmSelection = () => {
    onSelect(Array.from(selectedItems.values()));
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedItems(new Map());
    setSearch("");
    setDebouncedSearch("");
    setMimeFilter("");
    setFolderFilter("");
    setTab(hasOrderContext ? "project" : "library");
    onClose();
  };

  const handleFilterClick = (opt: FilterOption) => {
    if (opt.isFolder) {
      setFolderFilter(folderFilter === opt.value ? "" : opt.value);
      setMimeFilter("");
    } else {
      setMimeFilter(mimeFilter === opt.value ? "" : opt.value);
      setFolderFilter("");
    }
  };

  const libraryItems = libraryData?.items || [];
  const libraryUploading = libraryUploadMutation.isPending;

  return {
    // State
    search,
    debouncedSearch,
    mimeFilter,
    folderFilter,
    selectedItems,
    tab,
    setTab,
    isUploading,
    hasOrderContext,

    // Refs
    projectFileInputRef,
    libraryFileInputRef,

    // Data
    libraryItems,
    libraryLoading,
    filteredProjectFiles,
    projectFilesLoading,
    libraryUploading,

    // Handlers
    handleSearchChange,
    handleProjectUpload,
    handleLibraryUpload,
    toggleSelect,
    handleConfirmSelection,
    resetAndClose,
    handleFilterClick,

    // Constants
    FILTER_OPTIONS,
  };
}
