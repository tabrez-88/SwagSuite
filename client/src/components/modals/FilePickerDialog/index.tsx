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
import {
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
import type { FilePickerDialogProps, MediaLibraryItem } from "./types";
import { useFilePickerDialog } from "./hooks";

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

export default function FilePickerDialog(props: FilePickerDialogProps) {
  const { title = "Select Files", multiple = false } = props;
  const h = useFilePickerDialog(props);

  const renderFileGrid = (
    fileList: MediaLibraryItem[],
    loading: boolean,
    emptyText: string,
    onUploadClick: () => void,
    uploading: boolean,
  ) => (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : fileList.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">
            {h.debouncedSearch ? "No files match your search" : emptyText}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onUploadClick} disabled={uploading}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload files
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
          {fileList.map((item) => {
            const isSelected = h.selectedItems.has(item.id);
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => h.toggleSelect(item)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); h.toggleSelect(item); } }}
                className={`relative group flex flex-col items-center p-2 rounded-lg border-2 transition-all hover:bg-gray-50 cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:border-gray-200"
                }`}
              >
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
                  {isImageFile(item.mimeType, item.cloudinaryUrl) ? (
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
                <p className="text-xs font-medium truncate w-full text-center">{item.originalName}</p>
                <p className="text-[10px] text-gray-400">
                  {formatFileSize(item.fileSize)}
                  {item.createdAt && ` \u00b7 ${format(new Date(item.createdAt), "MMM d")}`}
                </p>
                {item.category && (
                  <Badge variant="outline" className="text-[9px] mt-0.5 px-1 py-0 h-3.5">{item.category}</Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderLibraryView = () => (
    <>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search all files..."
            value={h.search}
            onChange={(e) => h.handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => h.libraryFileInputRef.current?.click()} disabled={h.libraryUploading}>
          {h.libraryUploading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 mr-1.5" />
          )}
          Upload
        </Button>
        <input ref={h.libraryFileInputRef} type="file" multiple className="hidden" onChange={h.handleLibraryUpload} />
      </div>
      <div className="flex gap-1.5 mb-3">
        {h.FILTER_OPTIONS.map((opt) => (
          <Badge
            key={opt.value || "all"}
            variant={(opt.isFolder ? h.folderFilter : h.mimeFilter) === opt.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => h.handleFilterClick(opt)}
          >
            {opt.label}
          </Badge>
        ))}
      </div>
      {renderFileGrid(
        h.libraryItems,
        h.libraryLoading,
        "No files in library yet",
        () => h.libraryFileInputRef.current?.click(),
        h.libraryUploading,
      )}
    </>
  );

  return (
    <Dialog open={props.open} onOpenChange={(isOpen) => !isOpen && h.resetAndClose()}>
      <DialogContent
        className="max-w-3xl max-h-[80vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          h.resetAndClose();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {h.hasOrderContext ? (
          <Tabs value={h.tab} onValueChange={h.setTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project">
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                Project Files
              </TabsTrigger>
              <TabsTrigger value="library">All Files</TabsTrigger>
            </TabsList>

            <TabsContent value="project" className="flex-1 flex flex-col min-h-0 mt-3">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search project files..."
                    value={h.search}
                    onChange={(e) => h.handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => h.projectFileInputRef.current?.click()} disabled={h.isUploading}>
                  {h.isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Upload
                </Button>
                <input ref={h.projectFileInputRef} type="file" multiple className="hidden" onChange={h.handleProjectUpload} />
              </div>
              {renderFileGrid(
                h.filteredProjectFiles,
                h.projectFilesLoading,
                "No files in this project yet",
                () => h.projectFileInputRef.current?.click(),
                h.isUploading,
              )}
            </TabsContent>

            <TabsContent value="library" className="flex-1 flex flex-col min-h-0 mt-3">
              {renderLibraryView()}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {renderLibraryView()}
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={h.resetAndClose}>Cancel</Button>
          <Button onClick={h.handleConfirmSelection} disabled={h.selectedItems.size === 0}>
            Select{h.selectedItems.size > 0 ? ` (${h.selectedItems.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
