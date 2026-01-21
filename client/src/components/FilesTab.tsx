import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { UploadFilesModal } from "./UploadFilesModal";
import { FilePreviewModal } from "./FilePreviewModal";
import {
    Upload,
    FileText,
    Image as ImageIcon,
    Download,
    Trash2,
    MoreVertical,
    Send,
    Tag,
    ExternalLink,
    Cloud,
    Mail,
    Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";
import { format } from "date-fns";

interface OrderFile {
    id: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    filePath: string;
    thumbnailPath?: string;
    fileType: string;
    tags: string[];
    orderItemId?: string;
    orderItem?: {
        id: string;
        productName: string;
        productSku: string;
        productId: string;
        color?: string;
        size?: string;
        quantity: number;
    };
    approval?: {
        status: 'pending' | 'approved' | 'declined';
        approvedAt?: string;
        declinedAt?: string;
        feedback?: string;
        approvalToken?: string;
    };
    notes?: string;
    uploadedBy: string;
    createdAt: string;
}

interface FilesTabProps {
    orderId: string;
    products: Array<{
        id: string;
        productName: string;
        color?: string;
        size?: string;
        quantity: number;
    }>;
    onSwitchToEmail?: (emailData: { body: string; subject: string }) => void;
}

const FILE_TYPE_OPTIONS = [
    { value: "customer_proof", label: "Customer Proof", color: "bg-blue-500" },
    { value: "supplier_proof", label: "Supplier Proof", color: "bg-purple-500" },
    { value: "invoice", label: "Invoice", color: "bg-green-500" },
    { value: "artwork", label: "Artwork", color: "bg-orange-500" },
    { value: "other_document", label: "Other Document", color: "bg-gray-500" },
];

export function FilesTab({ orderId, products, onSwitchToEmail }: FilesTabProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFileType, setSelectedFileType] = useState("customer_proof");
    const [filterTag, setFilterTag] = useState<string>("all");
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [previewFile, setPreviewFile] = useState<OrderFile | null>(null);

    // Fetch files
    const { data: files = [], isLoading } = useQuery<OrderFile[]>({
        queryKey: [`/api/orders/${orderId}/files`],
    });

    // Get products that don't have pending/approved customer proofs
    // Allow re-upload if previous approval was declined
    const productsWithActiveProofs = new Set(
        files
            .filter(f =>
                f.fileType === "customer_proof" &&
                f.orderItemId &&
                f.approval?.status !== "declined"
            )
            .map(f => f.orderItemId)
    );

    const availableProductsForProof = products.filter(
        p => !productsWithActiveProofs.has(p.id)
    );

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (data: {
            uploads: { file: File; productId?: string }[];
            notes: string;
        }) => {
            const formData = new FormData();

            // Add all files
            data.uploads.forEach((upload) => {
                formData.append("files", upload.file);
            });

            formData.append("fileType", selectedFileType);

            // Add product assignments
            if (selectedFileType === "customer_proof") {
                data.uploads.forEach((upload, index) => {
                    if (upload.productId) {
                        formData.append(`productIds[${index}]`, upload.productId);
                    }
                });
                // Auto-generate approval links for customer proofs
                formData.append("autoGenerateApproval", "true");
            }

            if (data.notes) {
                formData.append("notes", data.notes);
            }

            const res = await fetch(`/api/orders/${orderId}/files`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/files`] });

            // Show approval links if generated
            if (selectedFileType === "customer_proof" && data.approvalLinks && data.approvalLinks.length > 0) {
                const links = data.approvalLinks.map((link: any) =>
                    `${link.productName}: ${window.location.origin}/approval/${link.token}`
                ).join('\n');

                navigator.clipboard.writeText(links).then(() => {
                    toast({
                        title: "Files uploaded & approval links generated! ✅",
                        description: `${data.approvalLinks.length} approval link(s) copied to clipboard`,
                    });
                });
            } else {
                toast({
                    title: "Files uploaded successfully",
                    description: selectedFileType === "customer_proof"
                        ? "Refresh page to see approval status"
                        : "Files have been uploaded successfully and are now stored in the system.",
                });
            }
        },
        onError: (error: Error) => {
            toast({
                title: "Upload failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (fileId: string) => {
            const res = await fetch(`/api/orders/${orderId}/files/${fileId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/files`] });
            toast({
                title: "File deleted",
                description: "File has been deleted successfully",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Delete failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleUploadFiles = (uploads: { file: File; productId?: string }[], notes: string) => {
        uploadMutation.mutate({ uploads, notes });
    };

    const handleDownload = async (file: OrderFile) => {
        // If filePath is a Cloudinary URL, use it directly
        if (file.filePath && file.filePath.includes('cloudinary.com')) {
            window.open(file.filePath, "_blank");
        } else {
            // Legacy: use download endpoint
            window.open(`/api/files/download/${file.fileName}`, "_blank");
        }
    };

    // Get optimized image URL from Cloudinary
    const getOptimizedImageUrl = (file: OrderFile, width: number = 400, height: number = 300) => {
        // If it's a Cloudinary URL and it's an image, request optimized version
        if (file.filePath && file.filePath.includes('cloudinary.com') && file.mimeType.startsWith('image/')) {
            // Use API to get optimized URL
            return `/api/files/cloudinary/optimize?publicId=${encodeURIComponent(file.fileName)}&width=${width}&height=${height}`;
        }
        // Fallback to original path
        return file.thumbnailPath || file.filePath || `/api/files/download/${file.fileName}`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) {
            return <ImageIcon className="w-8 h-8 text-blue-500" />;
        }
        return <FileText className="w-8 h-8 text-gray-500" />;
    };

    const getFileTypeColor = (fileType: string) => {
        return FILE_TYPE_OPTIONS.find((opt) => opt.value === fileType)?.color || "bg-gray-500";
    };

    const getFileTypeLabel = (fileType: string) => {
        return FILE_TYPE_OPTIONS.find((opt) => opt.value === fileType)?.label || fileType;
    };

    const handleSelectAll = () => {
        if (selectedFileIds.length === customerProofFiles.length) {
            setSelectedFileIds([]);
        } else {
            setSelectedFileIds(customerProofFiles.map(f => f.id));
        }
    };

    const handleSelectFile = (fileId: string) => {
        if (selectedFileIds.includes(fileId)) {
            setSelectedFileIds(selectedFileIds.filter(id => id !== fileId));
        } else {
            setSelectedFileIds([...selectedFileIds, fileId]);
        }
    };

    const handleEmailProofs = () => {
        // Get selected files with approval data
        const selectedFiles = files.filter(f => selectedFileIds.includes(f.id));

        // Generate email body with preview links in HTML format
        const emailBody = selectedFiles.map((file, index) => {
            const approvalLink = file.approval?.approvalToken
                ? `${window.location.origin}/approval/${file.approval.approvalToken}`
                : 'Pending';

            const productInfo = file.orderItem?.productName || 'Product';
            const colorSize = file.orderItem?.color
                ? ` (${file.orderItem.color}${file.orderItem?.size ? ` / ${file.orderItem.size}` : ''})`
                : '';

            return `<p style="margin-bottom: 15px;">
                <strong>${index + 1}. ${productInfo}${colorSize}</strong><br/>
                <span style="color: #666;font-size: 24px;">Approval Link:</span> <a href="${approvalLink}" style="color: #2563eb;font-size: 24px;font-weight: bold;">${approvalLink}</a>
            </p>`;
        }).join('');

        const emailSubject = `Artwork Approval Required - ${selectedFiles.length} Item${selectedFiles.length > 1 ? 's' : ''}`;
        const fullEmailBody = `<p>Hi,</p>
                                <p>Please review and approve the following artwork proofs:</p>
                                ${emailBody}
                                <p>Thank you!</p>
                                `;

        // Switch to email tab and pre-fill
        if (onSwitchToEmail) {
            onSwitchToEmail({ body: fullEmailBody, subject: emailSubject });
            toast({
                title: "Ready to send",
                description: "Email composition ready in Client Communication tab",
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(fullEmailBody).then(() => {
                toast({
                    title: "Preview links copied!",
                    description: "Approval preview links have been copied to clipboard",
                });
            });
        }
    };

    // Get unique tags from all files
    const allTags = Array.from(new Set(files.flatMap((f) => f.tags || [])));

    // Filter files
    const filteredFiles = filterTag === "all"
        ? files
        : files.filter(f => f.tags?.includes(filterTag));

    // Get customer proof files for selection
    const customerProofFiles = filteredFiles.filter(f => f.fileType === "customer_proof" && f.approval?.status !== "declined" && f.approval?.status !== 'approved');

    // Calculate Cloudinary stats
    const cloudinaryFiles = files.filter(f => f.filePath && f.filePath.includes('cloudinary.com'));
    const localFiles = files.filter(f => !f.filePath || !f.filePath.includes('cloudinary.com'));
    const totalCloudSize = cloudinaryFiles.reduce((sum, f) => sum + f.fileSize, 0);

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
                        <div className="flex-1 flex items-end">
                            <Button
                                onClick={() => setShowUploadModal(true)}
                                className="w-full"
                                disabled={selectedFileType === "customer_proof" && availableProductsForProof.length === 0}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Add Files
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
                            <Button onClick={handleEmailProofs} size="sm">
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
                                                        onClick={() => deleteMutation.mutate(file.id)}
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
                uploading={uploadMutation.isPending}
            />

            {/* File Preview Modal */}
            <FilePreviewModal
                open={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile}
            />
        </div>
    );
}
