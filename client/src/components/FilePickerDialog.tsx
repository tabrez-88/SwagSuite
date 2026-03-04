import { useState, useRef, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMediaLibrary, useUploadToMediaLibrary } from "@/hooks/useMediaLibrary";
import {
  type MediaLibraryItem,
  getCloudinaryThumbnail,
  isImageFile,
  formatFileSize,
  getFileTypeIcon,
} from "@/lib/media-library";
import {
  Check,
  CheckSquare,
  FileText,
  FolderOpen,
  Image,
  FileSpreadsheet,
  Pen,
  File,
  Square,
  Upload,
  Search,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (files: MediaLibraryItem[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  contextOrderId?: string;
  contextCompanyId?: string;
  title?: string;
}

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Images", value: "image/" },
  { label: "Documents", value: "application/pdf" },
  { label: "Design Files", value: "design-files", isFolder: true },
];

function getFileIcon(mimeType: string | null) {
  const type = getFileTypeIcon(mimeType);
  switch (type) {
    case "image":
      return <Image className="w-8 h-8 text-blue-400" />;
    case "pdf":
      return <FileText className="w-8 h-8 text-red-400" />;
    case "design":
      return <Pen className="w-8 h-8 text-purple-400" />;
    case "spreadsheet":
      return <FileSpreadsheet className="w-8 h-8 text-green-400" />;
    case "document":
      return <FileText className="w-8 h-8 text-blue-400" />;
    default:
      return <File className="w-8 h-8 text-gray-400" />;
  }
}

/** Map an order file (from GET /api/orders/:id/files) to MediaLibraryItem shape */
function orderFileToMediaItem(file: any): MediaLibraryItem {
  return {
    id: `orderfile-${file.id}`,
    cloudinaryPublicId: file.fileName,
    cloudinaryUrl: file.filePath,
    cloudinaryResourceType: null,
    fileName: file.fileName,
    originalName: file.originalName,
    fileSize: file.fileSize,
    mimeType: file.mimeType,
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

export default function FilePickerDialog({
  open,
  onClose,
  onSelect,
  multiple = false,
  maxFiles = 10,
  contextOrderId,
  contextCompanyId,
  title = "Select Files",
}: FilePickerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hasOrderContext = !!contextOrderId;

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

  // Library query - shows ALL files, only fetch when dialog is open
  const { data: libraryData, isLoading: libraryLoading } = useMediaLibrary({
    search: debouncedSearch || undefined,
    mimeType: mimeFilter || undefined,
    folder: folderFilter || undefined,
    limit: 100,
    enabled: open,
  });

  // Project files query - only when contextOrderId is present
  const { data: projectFilesRaw, isLoading: projectFilesLoading } = useQuery<any[]>({
    queryKey: [`/api/orders/${contextOrderId}/files`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${contextOrderId}/files`, { credentials: "include" });
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

  // Upload to project (POST /api/orders/:orderId/files) so it appears in Project Files tab
  const handleProjectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !contextOrderId) return;
    const files = Array.from(e.target.files);
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("fileType", "other_document");

      const res = await fetch(`/api/orders/${contextOrderId}/files`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${contextOrderId}/files`] });
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload files.", variant: "destructive" });
    }
    setIsUploading(false);
    if (projectFileInputRef.current) projectFileInputRef.current.value = "";
  };

  // Upload to library (POST /api/media-library/upload) for All Files tab
  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    try {
      await libraryUploadMutation.mutateAsync({
        files,
        orderId: contextOrderId,
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

  const handleFilterClick = (opt: (typeof FILTER_OPTIONS)[number]) => {
    if (opt.isFolder) {
      setFolderFilter(folderFilter === opt.value ? "" : opt.value);
      setMimeFilter("");
    } else {
      setMimeFilter(mimeFilter === opt.value ? "" : opt.value);
      setFolderFilter("");
    }
  };

  const libraryItems = libraryData?.items || [];

  // Shared file grid renderer - uses <div> instead of <button> to avoid nested button issue with Checkbox
  const renderFileGrid = (
    fileList: MediaLibraryItem[],
    loading: boolean,
    emptyText: string,
    onUploadClick: () => void,
    uploading: boolean,
  ) => (
    <ScrollArea className="flex-1 min-h-0" style={{ maxHeight: "400px" }}>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : fileList.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">
            {debouncedSearch ? "No files match your search" : emptyText}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onUploadClick}
            disabled={uploading}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload files
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
          {fileList.map((item) => {
            const isSelected = selectedItems.has(item.id);
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleSelect(item)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSelect(item); } }}
                className={`relative group flex flex-col items-center p-2 rounded-lg border-2 transition-all hover:bg-gray-50 cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:border-gray-200"
                }`}
              >
                {/* Selection indicator using icons instead of Checkbox to avoid button-in-button */}
                {multiple && (
                  <div className="absolute top-1.5 right-1.5 z-10">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                    )}
                  </div>
                )}
                {!multiple && isSelected && (
                  <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                <div className="w-full aspect-square rounded bg-gray-100 flex items-center justify-center overflow-hidden mb-1.5">
                  {isImageFile(item.mimeType) ? (
                    <img
                      src={getCloudinaryThumbnail(item.cloudinaryUrl, 200, 200)}
                      alt={item.originalName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    getFileIcon(item.mimeType)
                  )}
                </div>

                <p className="text-xs font-medium truncate w-full text-center">
                  {item.originalName}
                </p>
                <p className="text-[10px] text-gray-400">
                  {formatFileSize(item.fileSize)}
                  {item.createdAt && ` · ${format(new Date(item.createdAt), "MMM d")}`}
                </p>
                {item.category && (
                  <Badge variant="outline" className="text-[9px] mt-0.5 px-1 py-0 h-3.5">
                    {item.category}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );

  const libraryUploading = libraryUploadMutation.isPending;

  const renderLibraryView = () => (
    <>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search all files..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => libraryFileInputRef.current?.click()}
          disabled={libraryUploading}
        >
          {libraryUploading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 mr-1.5" />
          )}
          Upload
        </Button>
        <input
          ref={libraryFileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleLibraryUpload}
        />
      </div>
      <div className="flex gap-1.5 mb-3">
        {FILTER_OPTIONS.map((opt) => (
          <Badge
            key={opt.value || "all"}
            variant={
              (opt.isFolder ? folderFilter : mimeFilter) === opt.value
                ? "default"
                : "outline"
            }
            className="cursor-pointer"
            onClick={() => handleFilterClick(opt)}
          >
            {opt.label}
          </Badge>
        ))}
      </div>
      {renderFileGrid(
        libraryItems,
        libraryLoading,
        "No files in library yet",
        () => libraryFileInputRef.current?.click(),
        libraryUploading,
      )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetAndClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {hasOrderContext ? (
          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project">
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                Project Files
              </TabsTrigger>
              <TabsTrigger value="library">All Files</TabsTrigger>
            </TabsList>

            {/* Project Files Tab */}
            <TabsContent value="project" className="flex-1 flex flex-col min-h-0 mt-3">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search project files..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => projectFileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Upload
                </Button>
                <input
                  ref={projectFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleProjectUpload}
                />
              </div>
              {renderFileGrid(
                filteredProjectFiles,
                projectFilesLoading,
                "No files in this project yet",
                () => projectFileInputRef.current?.click(),
                isUploading,
              )}
            </TabsContent>

            {/* All Files Tab */}
            <TabsContent value="library" className="flex-1 flex flex-col min-h-0 mt-3">
              {renderLibraryView()}
            </TabsContent>
          </Tabs>
        ) : (
          /* No order context - single view with no tabs */
          <div className="flex-1 flex flex-col min-h-0">
            {renderLibraryView()}
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSelection} disabled={selectedItems.size === 0}>
            Select{selectedItems.size > 0 ? ` (${selectedItems.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
