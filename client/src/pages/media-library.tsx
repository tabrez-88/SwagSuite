import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMediaLibrary, useUploadToMediaLibrary, useDeleteMediaLibraryItem } from "@/hooks/useMediaLibrary";
import {
  type MediaLibraryItem,
  getCloudinaryThumbnail,
  isImageFile,
  formatFileSize,
  getFileTypeIcon,
} from "@/lib/media-library";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import {
  CheckSquare,
  Download,
  ExternalLink,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Grid3X3,
  Image,
  LayoutList,
  Loader2,
  MoreVertical,
  Pen,
  Search,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const FOLDER_FILTERS = [
  { label: "All Files", value: "", icon: FolderOpen },
  { label: "Images", value: "images", icon: Image },
  { label: "Documents", value: "documents", icon: FileText },
  { label: "Design Files", value: "design-files", icon: Pen },
  { label: "Spreadsheets", value: "spreadsheets", icon: FileSpreadsheet },
];

function getFileIcon(mimeType: string | null) {
  const type = getFileTypeIcon(mimeType);
  switch (type) {
    case "image":
      return <Image className="w-10 h-10 text-blue-400" />;
    case "pdf":
      return <FileText className="w-10 h-10 text-red-400" />;
    case "design":
      return <Pen className="w-10 h-10 text-purple-400" />;
    case "spreadsheet":
      return <FileSpreadsheet className="w-10 h-10 text-green-400" />;
    case "document":
      return <FileText className="w-10 h-10 text-blue-400" />;
    default:
      return <File className="w-10 h-10 text-gray-400" />;
  }
}

export default function MediaLibraryPage() {
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

  // Selection helpers
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

  // Bulk delete
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

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="w-6 h-6" />
            Media Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} file{total !== 1 ? "s" : ""} in library
          </p>
        </div>
        <div className="flex gap-2">
          {/* Select mode toggle */}
          <Button
            variant={selectMode ? "default" : "outline"}
            size="icon"
            onClick={() => {
              if (selectMode) clearSelection();
              else setSelectMode(true);
            }}
            title={selectMode ? "Cancel selection" : "Select files"}
          >
            {selectMode ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <LayoutList className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Files
          </Button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* Selection toolbar */}
      {selectMode && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size} selected
          </span>
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            Deselect All
          </Button>
          <div className="flex-1" />
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={() => setShowBulkDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete ({selectedIds.size})
          </Button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {FOLDER_FILTERS.map((f) => (
            <Badge
              key={f.value}
              variant={folderFilter === f.value ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setFolderFilter(folderFilter === f.value ? "" : f.value)}
            >
              <f.icon className="w-3 h-3 mr-1" />
              {f.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-2"}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className={viewMode === "grid" ? "aspect-square rounded-lg" : "h-16 rounded-lg"} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">
            {debouncedSearch ? "No files match your search" : "No files in library yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Upload files to get started, or they'll appear here automatically when uploaded anywhere in the app.
          </p>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <Card
                key={item.id}
                className={`group relative overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-blue-500 shadow-md"
                    : "hover:shadow-md"
                }`}
              >
                {/* Selection checkbox */}
                {selectMode && (
                  <div
                    className="absolute top-2 left-2 z-20"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                  >
                    <Checkbox checked={isSelected} className="bg-white" />
                  </div>
                )}

                {/* Actions dropdown */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewItem(item)}>
                        <Eye className="w-4 h-4 mr-2" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={item.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" /> Open in Cloudinary
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={item.cloudinaryUrl} download={item.originalName}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(item)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Thumbnail - click opens preview */}
                <div onClick={(e) => handleItemClick(item, e)}>
                  <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                    {isImageFile(item.mimeType) ? (
                      <img
                        src={getCloudinaryThumbnail(item.cloudinaryUrl, 300, 300)}
                        alt={item.originalName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      getFileIcon(item.mimeType)
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-2">
                  <p className="text-xs font-medium truncate" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-gray-400">{formatFileSize(item.fileSize)}</span>
                    <span className="text-[10px] text-gray-400">
                      {item.createdAt && format(new Date(item.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  {item.category && (
                    <Badge variant="outline" className="text-[10px] mt-1 px-1.5 py-0 h-4">
                      {item.category}
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-1">
          {items.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg group cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
                onClick={(e) => handleItemClick(item, e)}
              >
                {/* Selection checkbox */}
                {selectMode && (
                  <div onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}>
                    <Checkbox checked={isSelected} />
                  </div>
                )}

                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {isImageFile(item.mimeType) ? (
                    <img
                      src={getCloudinaryThumbnail(item.cloudinaryUrl, 80, 80)}
                      alt={item.originalName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    getFileIcon(item.mimeType)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.originalName}</p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(item.fileSize)} · {item.folder}
                    {item.createdAt && ` · ${format(new Date(item.createdAt), "MMM d, yyyy")}`}
                  </p>
                </div>
                {item.category && (
                  <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                )}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewItem(item)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        file={previewItem ? {
          originalName: previewItem.originalName,
          filePath: previewItem.cloudinaryUrl,
          mimeType: previewItem.mimeType || "application/octet-stream",
          fileName: previewItem.fileName,
        } : null}
      />

      {/* Single Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.originalName}" from Cloudinary and the media library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} file{selectedIds.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected files from Cloudinary and the media library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                `Delete ${selectedIds.size} file${selectedIds.size !== 1 ? "s" : ""}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
