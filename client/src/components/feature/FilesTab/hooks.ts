import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { uploadProjectFiles, linkLibraryFiles, deleteProjectFile } from "@/services/projects/requests";
import type { OrderFile } from "./types";
import { FILE_TYPE_OPTIONS } from "./types";

export function useFilesTab(projectId: string) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showLibraryPicker, setShowLibraryPicker] = useState(false);
    const [selectedFileType, setSelectedFileType] = useState("customer_proof");
    const [filterTag, setFilterTag] = useState<string>("all");
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [previewFile, setPreviewFile] = useState<OrderFile | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<OrderFile | null>(null);

    // Fetch files
    const { data: files = [], isLoading } = useQuery<OrderFile[]>({
        queryKey: [`/api/projects/${projectId}/files`],
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

            return uploadProjectFiles(projectId, formData);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });

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

    // Link from media library mutation
    const linkFromLibraryMutation = useMutation({
        mutationFn: (mediaLibraryIds: string[]) => linkLibraryFiles(projectId, {
            mediaLibraryIds,
            fileType: selectedFileType,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });
            toast({
                title: "Files added",
                description: "Files from library have been linked to this order.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to add files",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (fileId: string) => deleteProjectFile(projectId, fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });
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

    const getFileTypeColor = (fileType: string) => {
        return FILE_TYPE_OPTIONS.find((opt) => opt.value === fileType)?.color || "bg-gray-500";
    };

    const getFileTypeLabel = (fileType: string) => {
        return FILE_TYPE_OPTIONS.find((opt) => opt.value === fileType)?.label || fileType;
    };

    // Get unique tags from all files
    const allTags = Array.from(new Set(files.flatMap((f) => f.tags || [])));

    // Filter files
    const filteredFiles = filterTag === "all"
        ? files
        : files.filter(f => f.tags?.includes(filterTag));

    // Get customer proof files for selection
    const customerProofFiles = filteredFiles.filter(f => f.fileType === "customer_proof" && f.approval?.status !== "declined" && f.approval?.status !== 'approved');

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

    const handleEmailProofs = (onSwitchToEmail?: (emailData: { body: string; subject: string }) => void) => {
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

    // Calculate Cloudinary stats
    const cloudinaryFiles = files.filter(f => f.filePath && f.filePath.includes('cloudinary.com'));
    const localFiles = files.filter(f => !f.filePath || !f.filePath.includes('cloudinary.com'));
    const totalCloudSize = cloudinaryFiles.reduce((sum, f) => sum + f.fileSize, 0);

    return {
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
        getOptimizedImageUrl,
        getFileTypeColor,
        getFileTypeLabel,
        allTags,
        filteredFiles,
        customerProofFiles,
        handleSelectAll,
        handleSelectFile,
        handleEmailProofs,
        cloudinaryFiles,
        localFiles,
        totalCloudSize,
    };
}
