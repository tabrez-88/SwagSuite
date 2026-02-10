import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Card } from "@/components/ui/card";
import { X, FileText, Image as ImageIcon, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

interface FilePreview {
    file: File;
    preview?: string;
    productId?: string;
}

interface ArtworkSelection {
    artworkId: string;
    artworkName: string;
    filePath: string;
    fileName: string;
    productId: string;
}

interface UploadFilesModalProps {
    open: boolean;
    onClose: () => void;
    onUpload: (files: { file: File; productId?: string }[], notes: string) => void;
    fileType: string;
    products: Array<{
        id: string;
        productName: string;
        color?: string;
        size?: string;
    }>;
    availableProducts?: Array<{
        id: string;
        productName: string;
        color?: string;
        size?: string;
    }>;
    artworkItems?: Record<string, any[]>;
    uploading?: boolean;
}

export function UploadFilesModal({
    open,
    onClose,
    onUpload,
    fileType,
    products,
    availableProducts,
    artworkItems,
    uploading = false,
}: UploadFilesModalProps) {
    const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
    const [selectedArtworks, setSelectedArtworks] = useState<ArtworkSelection[]>([]);
    const [uploadMode, setUploadMode] = useState<'upload' | 'select'>('upload');
    const [notes, setNotes] = useState("");

    const isCustomerProof = fileType === "customer_proof";
    const productsToShow = isCustomerProof && availableProducts ? availableProducts : products;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newPreviews: FilePreview[] = files.map((file) => {
            const preview = file.type.startsWith("image/")
                ? URL.createObjectURL(file)
                : undefined;

            return {
                file,
                preview,
                productId: undefined,
            };
        });

        setFilePreviews([...filePreviews, ...newPreviews]);
    };

    const handleRemoveFile = (index: number) => {
        const newPreviews = [...filePreviews];
        if (newPreviews[index].preview) {
            URL.revokeObjectURL(newPreviews[index].preview!);
        }
        newPreviews.splice(index, 1);
        setFilePreviews(newPreviews);
    };

    const handleProductChange = (index: number, productId: string) => {
        const newPreviews = [...filePreviews];
        newPreviews[index].productId = productId === "none" ? undefined : productId;
        setFilePreviews(newPreviews);
    };

    const handleArtworkSelect = (artwork: any, productId: string) => {
        const isSelected = selectedArtworks.some(a => a.artworkId === artwork.id);
        
        if (isSelected) {
            setSelectedArtworks(selectedArtworks.filter(a => a.artworkId !== artwork.id));
        } else {
            // Check if product is already assigned
            const alreadyAssigned = selectedArtworks.some(a => a.productId === productId);
            if (alreadyAssigned) {
                // Remove old assignment
                setSelectedArtworks([
                    ...selectedArtworks.filter(a => a.productId !== productId),
                    {
                        artworkId: artwork.id,
                        artworkName: artwork.name,
                        filePath: artwork.filePath,
                        fileName: artwork.fileName,
                        productId: productId,
                    }
                ]);
            } else {
                setSelectedArtworks([
                    ...selectedArtworks,
                    {
                        artworkId: artwork.id,
                        artworkName: artwork.name,
                        filePath: artwork.filePath,
                        fileName: artwork.fileName,
                        productId: productId,
                    }
                ]);
            }
        }
    };

    const handleUpload = () => {
        if (uploadMode === 'upload') {
            // Validate customer proof files have product assigned
            if (isCustomerProof) {
                const unassignedFiles = filePreviews.filter(fp => !fp.productId);
                if (unassignedFiles.length > 0) {
                    return; // Don't upload if validation fails
                }
            }

            const uploads = filePreviews.map(fp => ({
                file: fp.file,
                productId: fp.productId,
            }));

            onUpload(uploads, notes);
        } else {
            // Handle artwork selection - convert artwork to file objects
            if (selectedArtworks.length === 0) return;
            
            // For selected artworks, fetch images and create File objects
            Promise.all(
                selectedArtworks.map(async (artwork) => {
                    try {
                        const response = await fetch(artwork.filePath);
                        const blob = await response.blob();
                        const file = new File([blob], artwork.fileName, { type: blob.type });
                        return {
                            file,
                            productId: artwork.productId,
                        };
                    } catch (error) {
                        console.error('Error fetching artwork:', error);
                        return null;
                    }
                })
            ).then((uploads) => {
                const validUploads = uploads.filter((u): u is { file: File; productId: string } => u !== null);
                if (validUploads.length > 0) {
                    onUpload(validUploads, notes);
                }
            });
        }
        handleClose();
    };

    const handleClose = () => {
        // Clean up previews
        filePreviews.forEach(fp => {
            if (fp.preview) {
                URL.revokeObjectURL(fp.preview);
            }
        });
        setFilePreviews([]);
        setSelectedArtworks([]);
        setUploadMode('upload');
        setNotes("");
        onClose();
    };

    const canUpload = filePreviews.length > 0 && (
        !isCustomerProof || filePreviews.every(fp => fp.productId)
    );

    // Check if there are more files than available products (for customer proof)
    const hasMoreFilesThanProducts = isCustomerProof &&
        filePreviews.length > productsToShow.length;

    // Check if user is trying to assign same product to multiple files
    const hasDuplicateProducts = isCustomerProof &&
        filePreviews.filter(fp => fp.productId).length > 0 &&
        new Set(filePreviews.map(fp => fp.productId).filter(Boolean)).size <
        filePreviews.filter(fp => fp.productId).length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Upload Files - {fileType.replace('_', ' ').toUpperCase()}</DialogTitle>
                    <DialogDescription>
                        {isCustomerProof
                            ? "Upload proof files received from vendor. One file per product."
                            : "Add files to upload to cloud storage."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* File Input */}
                    <div>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload-modal"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        />
                        <Button
                            onClick={() => document.getElementById('file-upload-modal')?.click()}
                            variant="outline"
                            className="w-full"
                            disabled={uploading}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Add Files
                        </Button>
                    </div>

                    {/* Warnings */}
                    {hasMoreFilesThanProducts && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium">More files than available products</p>
                                <p className="text-xs mt-1">
                                    You have {filePreviews.length} files but only {productsToShow.length} products available.
                                    Each product can only have one proof. Please remove extra files or select different file type.
                                </p>
                            </div>
                        </div>
                    )}

                    {hasDuplicateProducts && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-800">
                                <p className="font-medium">Duplicate product assignment</p>
                                <p className="text-xs mt-1">
                                    Each product can only have one proof. Please assign different products to each file.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* File Previews */}
                    {filePreviews.length > 0 && (
                        <ScrollArea className="h-[400px] rounded-lg border p-4">
                            <div className="space-y-4">
                                {filePreviews.map((filePreview, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-4 p-4 bg-gray-50 rounded-lg border"
                                    >
                                        {/* Preview */}
                                        <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                            {filePreview.preview ? (
                                                <img
                                                    src={filePreview.preview}
                                                    alt={filePreview.file.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : filePreview.file.type.includes('pdf') ? (
                                                <FileText className="w-12 h-12 text-red-500" />
                                            ) : (
                                                <FileText className="w-12 h-12 text-gray-500" />
                                            )}
                                        </div>

                                        {/* Info & Product Selection */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-sm truncate max-w-md">
                                                        {filePreview.file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {(filePreview.file.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveFile(index)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {/* Product Selection for Customer Proof */}
                                            {isCustomerProof && (
                                                <div>
                                                    <Label className="text-xs">
                                                        Assign to Product <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Select
                                                        value={filePreview.productId || "none"}
                                                        onValueChange={(value) => handleProductChange(index, value)}
                                                    >
                                                        <SelectTrigger
                                                            className={`h-9 ${!filePreview.productId ? 'border-red-300' : ''}`}
                                                        >
                                                            <SelectValue placeholder="Select product..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none" disabled>
                                                                <span className="text-gray-400">-- Select a product --</span>
                                                            </SelectItem>
                                                            {productsToShow.map((product) => {
                                                                const alreadyAssigned = filePreviews.some(
                                                                    (fp, i) => i !== index && fp.productId === product.id
                                                                );
                                                                return (
                                                                    <SelectItem
                                                                        key={product.id}
                                                                        value={product.id}
                                                                        disabled={alreadyAssigned}
                                                                    >
                                                                        {product.productName}
                                                                        {product.color && ` - ${product.color}`}
                                                                        {product.size && ` / ${product.size}`}
                                                                        {alreadyAssigned && " (assigned)"}
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}

                    {/* Notes */}
                    <div className="pt-4">
                        <Label htmlFor="upload-notes">Notes (Optional)</Label>
                        <Input
                            id="upload-notes"
                            placeholder="Add notes about these files..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={uploading}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={uploading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!canUpload || uploading || hasMoreFilesThanProducts || hasDuplicateProducts}
                    >
                        {uploading
                            ? "Uploading..."
                            : `Upload ${filePreviews.length} File${filePreviews.length !== 1 ? 's' : ''}`
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
