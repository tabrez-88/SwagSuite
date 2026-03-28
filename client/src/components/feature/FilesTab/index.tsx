import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { UploadFilesModal } from "@/components/modals/UploadFilesModal";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import {
    Upload,
    FileText,
    FolderOpen,
    Image as ImageIcon,
    Download,
    Trash2,
    MoreVertical,
    Send,
    Tag,
    ExternalLink,
    Mail,
    Eye,
    AlertTriangle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { FilesTabProps } from "./types";
import { FILE_TYPE_OPTIONS } from "./types";
import { useFilesTab } from "./hooks";

export function FilesTab({ projectId, products, artworkItems, onSwitchToEmail }: FilesTabProps) {
    const {
        showUploadModal,
        setShowUploadModal,
        showLibraryPicker,
        setShowLibraryPicker,
        selectedFileType,
        setSelectedFileType,
        filterTag,
        setFilterTag,
        selectedFileIds,
        previewFile,
        setPreviewFile,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        fileToDelete,
        setFileToDelete,
        files,
        isLoading,
        productsWithActiveProofs,
        uploadMutation,
        linkFromLibraryMutation,
        deleteMutation,
        handleUploadFiles,
        handleDownload,
        getFileTypeColor,
        getFileTypeLabel,
        allTags,
        filteredFiles,
        customerProofFiles,
        handleSelectAll,
        handleSelectFile,
        handleEmailProofs,
    } = useFilesTab(projectId);

    const availableProductsForProof = products.filter(
        p => !productsWithActiveProofs.has(p.id)
    );

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="file-type">File Type</Label>
                            <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                                <SelectTrigger id="file-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FILE_TYPE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${option.color}`} />
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 flex items-end gap-2">
                            <Button
                                onClick={() => setShowUploadModal(true)}
                                className="flex-1"
                                disabled={selectedFileType === "customer_proof" && availableProductsForProof.length === 0}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload New
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowLibraryPicker(true)}
                                className="flex-1"
                            >
                                <FolderOpen className="w-4 h-4 mr-2" />
                                From Library
                            </Button>
                        </div>

                    </div>
                    {selectedFileType === "customer_proof" && availableProductsForProof.length === 0 && (
                        <p className="text-xs text-yellow-600 mt-2 text-center">
                            ⚠️ All products already have customer proofs
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Filter Section */}
            {allTags.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <Tag className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Filter:</span>
                            <Select value={filterTag} onValueChange={setFilterTag}>
                                <SelectTrigger className="w-64">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Files ({files.length})
                                    </SelectItem>
                                    {allTags.map((tag) => (
                                        <SelectItem key={tag} value={tag}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getFileTypeColor(tag)}`} />
                                                {getFileTypeLabel(tag)} ({files.filter(f => f.tags?.includes(tag)).length})
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Email Proofs Button */}
                        {selectedFileIds.length > 0 && (
                            <Button onClick={() => handleEmailProofs(onSwitchToEmail)} size="sm">
                                <Mail className="w-4 h-4 mr-2" />
                                Email {selectedFileIds.length} Proof{selectedFileIds.length !== 1 ? 's' : ''}
                            </Button>
                        )}

                    </div>
                </div>
            )}

            {/* Files Table */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading files...</p>
                </div>
            ) : filteredFiles.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                            {filterTag === "all"
                                ? "No files uploaded yet"
                                : `No ${getFileTypeLabel(filterTag).toLowerCase()} files`}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {customerProofFiles.length > 0 && (
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedFileIds.length === customerProofFiles.length && customerProofFiles.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead className="w-16">Preview</TableHead>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="w-12">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFiles.map((file) => (
                                    <TableRow key={file.id}>
                                        {customerProofFiles.length > 0 && (
                                            <TableCell>
                                                {file.fileType === "customer_proof" && file.approval?.status != "declined" && file.approval?.status !== 'approved' ? (
                                                    <Checkbox
                                                        checked={selectedFileIds.includes(file.id)}
                                                        onCheckedChange={() => handleSelectFile(file.id)}
                                                    />
                                                ) : <div className="w-6" />}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <button
                                                onClick={() => setPreviewFile(file)}
                                                className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-500 transition-all group"
                                            >
                                                {file.mimeType.startsWith("image/") ? (
                                                    <img
                                                        src={file.filePath && file.filePath.includes('cloudinary.com')
                                                            ? file.filePath
                                                            : file.thumbnailPath || `/api/files/download/${file.fileName}`}
                                                        alt={file.originalName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : file.mimeType === 'application/pdf' ? (
                                                    <FileText className="w-6 h-6 text-red-500" />
                                                ) : (
                                                    <FileText className="w-6 h-6 text-gray-500" />
                                                )}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Eye className="w-5 h-5 text-white" />
                                                </div>
                                            </button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm truncate max-w-xs" title={file.originalName}>
                                                    {file.originalName}
                                                </span>
                                                {file.notes && (
                                                    <span className="text-xs text-gray-500 italic mt-1">"{file.notes}"</span>
                                                )}

                                                {file.orderItem ? (
                                                    <div className="text-xs">
                                                        <Separator className="my-2" />
                                                        <p className="font-medium">{file.orderItem.productName}</p>
                                                        {file.orderItem.productSku && (
                                                            <p className="text-gray-500">SKU: {file.orderItem.productSku}</p>
                                                        )}
                                                        {(file.orderItem.color || file.orderItem.size) && (
                                                            <p className="text-gray-500">
                                                                {file.orderItem.color} {file.orderItem.size && `/ ${file.orderItem.size}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getFileTypeColor(file.fileType)} text-white text-xs`}>
                                                {getFileTypeLabel(file.fileType)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell >
                                            {file.fileType === "customer_proof" && file.approval ? (
                                                <div className="flex gap-2 items-center justify-between">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            file.approval.status === 'approved'
                                                                ? 'border-green-200 bg-green-50 text-green-700'
                                                                : file.approval.status === 'declined'
                                                                    ? 'border-red-200 bg-red-50 text-red-700'
                                                                    : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                                        }
                                                    >
                                                        {file.approval.status === 'approved' && '✅ Approved'}
                                                        {file.approval.status === 'declined' && '❌ Rejected'}
                                                        {file.approval.status === 'pending' && '⏳ Pending'}
                                                    </Badge>
                                                    {file.approval.approvalToken && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 p4-2 pl-1.5 gap-1 text-xs rounded-full"
                                                            onClick={() => {
                                                                const link = `${window.location.origin}/approval/${file.approval!.approvalToken}`;
                                                                window.open(link, "_blank");
                                                            }}
                                                        >
                                                            <Send className="w-4 h-4" />
                                                            <span>
                                                                Open Link
                                                            </span>
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-500">
                                            {(file.fileSize / 1024).toFixed(1)} KB
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-500">
                                            {format(new Date(file.createdAt), "MMM dd, yyyy HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Preview
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDownload(file)}>
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        const url = file.filePath && file.filePath.includes('cloudinary.com')
                                                            ? file.filePath
                                                            : `/api/files/download/${file.fileName}`;
                                                        window.open(url, "_blank");
                                                    }}>
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Open in New Tab
                                                    </DropdownMenuItem>
                                                    {file.fileType === "customer_proof" && file.approval?.approvalToken && (
                                                        <DropdownMenuItem onClick={() => {
                                                            const link = `${window.location.origin}/approval/${file.approval!.approvalToken}`;
                                                            window.open(link, "_blank");
                                                        }}>
                                                            <Send className="w-4 h-4 mr-2" />
                                                            Open Approval Link
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setFileToDelete(file);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Upload Modal */}
            <UploadFilesModal
                open={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleUploadFiles}
                fileType={selectedFileType}
                products={products}
                availableProducts={availableProductsForProof}
                artworkItems={artworkItems}
                uploading={uploadMutation.isPending}
            />

            {/* Media Library Picker */}
            <FilePickerDialog
                open={showLibraryPicker}
                onClose={() => setShowLibraryPicker(false)}
                onSelect={(items) => {
                    linkFromLibraryMutation.mutate(items.map((i) => i.id));
                    setShowLibraryPicker(false);
                }}
                multiple={true}
                contextProjectId={projectId}
                title="Add Files from Library"
            />

            {/* File Preview Modal */}
            <FilePreviewModal
                open={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete File
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this file?
                            {fileToDelete && (
                                <span className="block mt-1 font-medium text-foreground">
                                    "{fileToDelete.originalName}"
                                </span>
                            )}
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setFileToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                                if (fileToDelete) {
                                    deleteMutation.mutate(fileToDelete.id);
                                }
                                setFileToDelete(null);
                                setIsDeleteDialogOpen(false);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
