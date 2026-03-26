import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PresentationData, PresentationStatus } from "./types";

export function useAiPresentationBuilder() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHubspotModalOpen, setIsHubspotModalOpen] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState<PresentationData | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [newPresentation, setNewPresentation] = useState({
    title: "",
    description: "",
    dealNotes: ""
  });
  const [hubspotDealId, setHubspotDealId] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [presentationToDelete, setPresentationToDelete] = useState<PresentationData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch presentations
  const { data: presentations = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/presentations'],
  });

  // Create presentation mutation
  const createPresentationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/presentations', data);
    },
    onSuccess: () => {
      toast({
        title: "Presentation Created",
        description: "Your AI presentation is being generated with product suggestions.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
      setIsCreateModalOpen(false);
      setNewPresentation({ title: "", description: "", dealNotes: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create presentation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Import from HubSpot mutation
  const importHubspotMutation = useMutation({
    mutationFn: async (dealId: string) => {
      return apiRequest('POST', '/api/presentations/import-hubspot', { hubspotDealId: dealId });
    },
    onSuccess: () => {
      toast({
        title: "HubSpot Import Started",
        description: "Deal notes are being imported and analyzed by AI.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
      setIsHubspotModalOpen(false);
      setHubspotDealId("");
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Could not import from HubSpot. Check your deal ID and try again.",
        variant: "destructive"
      });
    }
  });

  // Generate presentation mutation
  const generatePresentationMutation = useMutation({
    mutationFn: async (presentationId: string) => {
      return apiRequest('POST', `/api/presentations/${presentationId}/generate`);
    },
    onSuccess: () => {
      toast({
        title: "Generation Started",
        description: "AI is analyzing your notes and suggesting products.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
    }
  });

  // Delete presentation mutation
  const deletePresentationMutation = useMutation({
    mutationFn: async (presentationId: string) => {
      return apiRequest('DELETE', `/api/presentations/${presentationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Presentation Deleted",
        description: "The presentation has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
    }
  });

  const handleCreatePresentation = async () => {
    if (!newPresentation.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title for your presentation.",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('title', newPresentation.title);
    formData.append('description', newPresentation.description);
    formData.append('dealNotes', newPresentation.dealNotes);

    uploadedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/presentations', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to create presentation');

      toast({
        title: "Presentation Created",
        description: "Your AI presentation is being generated with product suggestions.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
      setIsCreateModalOpen(false);
      setNewPresentation({ title: "", description: "", dealNotes: "" });
      setUploadedFiles([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create presentation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validTypes = ['.ai', '.eps', '.jpeg', '.jpg', '.png', '.pdf', '.psd', '.svg'];

    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Some files were skipped. Only AI, EPS, JPEG, PNG, PDF, PSD, and SVG files are supported.",
        variant: "destructive"
      });
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: PresentationStatus) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "generating": return "bg-blue-100 text-blue-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setNewPresentation({ title: "", description: "", dealNotes: "" });
    setUploadedFiles([]);
  };

  const handleConfirmDelete = () => {
    if (presentationToDelete) {
      deletePresentationMutation.mutate(presentationToDelete.id);
    }
    setPresentationToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleOpenDeleteDialog = (presentation: PresentationData) => {
    setPresentationToDelete(presentation);
    setIsDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setPresentationToDelete(null);
  };

  return {
    // State
    isCreateModalOpen,
    setIsCreateModalOpen,
    isHubspotModalOpen,
    setIsHubspotModalOpen,
    selectedPresentation,
    setSelectedPresentation,
    viewMode,
    setViewMode,
    newPresentation,
    setNewPresentation,
    hubspotDealId,
    setHubspotDealId,
    uploadedFiles,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    presentationToDelete,
    fileInputRef,

    // Query data
    presentations,
    isLoading,
    refetch,

    // Mutations
    createPresentationMutation,
    importHubspotMutation,
    generatePresentationMutation,
    deletePresentationMutation,

    // Handlers
    handleCreatePresentation,
    handleFileUpload,
    removeFile,
    getStatusColor,
    formatFileSize,
    handleCancelCreate,
    handleConfirmDelete,
    handleOpenDeleteDialog,
    handleCancelDelete,
  };
}
