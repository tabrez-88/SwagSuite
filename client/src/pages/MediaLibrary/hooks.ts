import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMediaLibraryQuery,
  useUploadMediaFiles,
  useDeleteMediaItem,
  useRenameMediaItem,
  useBulkDeleteMediaItems,
  mediaLibraryKeys,
} from "@/services/media-library";
import type { MediaLibraryItem } from "@/lib/media-library";
import { useToast } from "@/hooks/use-toast";

export function useMediaLibraryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteTarget, setDeleteTarget] = useState<MediaLibraryItem | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaLibraryItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<MediaLibraryItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const { data, isLoading } = useMediaLibraryQuery({
    search: debouncedSearch || undefined,
    folder: folderFilter || undefined,
    limit: 100,
  });

  const uploadMutation = useUploadMediaFiles();
  const deleteMutation = useDeleteMediaItem();
  const renameMutation = useRenameMediaItem();

  const openRename = (item: MediaLibraryItem) => {
    setRenameTarget(item);
    setRenameValue(item.fileName || item.originalName || "");
  };
  const closeRename = () => {
    setRenameTarget(null);
    setRenameValue("");
  };
  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await renameMutation.mutateAsync({ id: renameTarget.id, fileName: renameValue.trim() });
      toast({ title: "Renamed", description: "File name updated." });
      closeRename();
    } catch {
      toast({ title: "Rename failed", variant: "destructive" });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    try {
      await uploadMutation.mutateAsync({ files });
      toast({ title: "Uploaded", description: `${files.length} file(s) uploaded successfully.` });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: "Deleted", description: "File removed from library." });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const items = data?.items || [];
  const total = data?.total || 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map((i) => i.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const bulkDeleteMutation = useBulkDeleteMediaItems();

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast({ title: "Deleted", description: `${ids.length} file(s) removed from library.` });
      clearSelection();
    } catch {
      toast({
        title: "Delete failed",
        description: "Some files could not be deleted.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.all });
      setSelectedIds(new Set());
    }
    setShowBulkDeleteDialog(false);
  };

  const handleItemClick = (item: MediaLibraryItem, e: React.MouseEvent) => {
    if (selectMode) {
      e.preventDefault();
      toggleSelect(item.id);
      return;
    }
    setPreviewItem(item);
  };

  const toggleViewMode = () => setViewMode(viewMode === "grid" ? "list" : "grid");

  const toggleSelectMode = () => {
    if (selectMode) clearSelection();
    else setSelectMode(true);
  };

  const toggleFolderFilter = (value: string) => {
    setFolderFilter(folderFilter === value ? "" : value);
  };

  const deselectAll = () => setSelectedIds(new Set());

  const openBulkDeleteDialog = () => setShowBulkDeleteDialog(true);

  const triggerFileInput = () => fileInputRef.current?.click();

  const closeDeleteTarget = () => setDeleteTarget(null);

  const closePreview = () => setPreviewItem(null);

  return {
    // State
    search,
    debouncedSearch,
    folderFilter,
    viewMode,
    deleteTarget,
    previewItem,
    selectedIds,
    selectMode,
    showBulkDeleteDialog,
    fileInputRef,
    items,
    total,
    isLoading,
    uploadIsPending: uploadMutation.isPending,
    bulkDeleteIsPending: bulkDeleteMutation.isPending,

    // Handlers
    handleSearchChange,
    handleUpload,
    handleDelete,
    handleBulkDelete,
    handleItemClick,
    toggleSelect,
    selectAll,
    deselectAll,
    clearSelection,
    toggleViewMode,
    toggleSelectMode,
    toggleFolderFilter,
    openBulkDeleteDialog,
    triggerFileInput,
    setDeleteTarget,
    setPreviewItem,
    closeDeleteTarget,
    closePreview,
    setShowBulkDeleteDialog,

    // Rename
    renameTarget,
    renameValue,
    setRenameValue,
    openRename,
    closeRename,
    handleRename,
    renameIsPending: renameMutation.isPending,
  };
}
