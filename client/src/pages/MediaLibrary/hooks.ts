import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMediaLibrary, useUploadToMediaLibrary, useDeleteMediaLibraryItem } from "@/hooks/useMediaLibrary";
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

  const { data, isLoading } = useMediaLibrary({
    search: debouncedSearch || undefined,
    folder: folderFilter || undefined,
    limit: 100,
  });

  const uploadMutation = useUploadToMediaLibrary();
  const deleteMutation = useDeleteMediaLibraryItem();

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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/media-library/${id}`, { method: "DELETE", credentials: "include" })
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) throw new Error(`${failed} file(s) failed to delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
    },
  });

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast({ title: "Deleted", description: `${ids.length} file(s) removed from library.` });
      clearSelection();
    } catch {
      toast({ title: "Delete failed", description: "Some files could not be deleted.", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
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
  };
}
