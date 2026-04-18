import { useState } from "react";
import { fetchFileBlob } from "@/services/media-library/requests";
import type { FilePreview, ArtworkSelection, UploadFilesModalProps } from "./types";

export function useUploadFilesModal({
  onUpload,
  onClose,
  fileType,
  products,
  availableProducts,
}: Pick<UploadFilesModalProps, 'onUpload' | 'onClose' | 'fileType' | 'products' | 'availableProducts'>) {
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
            const blob = await fetchFileBlob(artwork.filePath);
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

  return {
    filePreviews,
    selectedArtworks,
    uploadMode,
    notes,
    setNotes,
    isCustomerProof,
    productsToShow,
    handleFileSelect,
    handleRemoveFile,
    handleProductChange,
    handleArtworkSelect,
    handleUpload,
    handleClose,
    canUpload,
    hasMoreFilesThanProducts,
    hasDuplicateProducts,
  };
}
