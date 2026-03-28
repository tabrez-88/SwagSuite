import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { createCardSchema, createColumnSchema, type CreateCardFormData, type CreateColumnFormData } from "@/schemas/artwork.schemas";

// Safe JSON parsing helper
export const safeJsonParse = (jsonString: any, fallback: any = []) => {
  if (!jsonString) return fallback;
  if (typeof jsonString !== 'string') return jsonString;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent": return "bg-red-500";
    case "high": return "bg-orange-500";
    case "medium": return "bg-yellow-500";
    case "low": return "bg-green-500";
    default: return "bg-gray-500";
  }
};

export function useArtwork() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewCardDialog, setShowNewCardDialog] = useState(false);
  const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
  const [showEditCardDialog, setShowEditCardDialog] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState("");
  const [editingCard, setEditingCard] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [editUploadedFiles, setEditUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({});
  const [editFilePreviews, setEditFilePreviews] = useState<{ [key: string]: string }>({});
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const cardForm = useForm<CreateCardFormData>({
    resolver: zodResolver(createCardSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const editCardForm = useForm<CreateCardFormData>({
    resolver: zodResolver(createCardSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const columnForm = useForm<CreateColumnFormData>({
    resolver: zodResolver(createColumnSchema),
    defaultValues: {
      name: "",
      color: "#3b82f6",
    },
  });

  // Data queries
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ["/api/artwork/columns"],
  });

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["/api/artwork/cards"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Initialize columns if empty
  const initializeColumnsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/artwork/columns/initialize", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artwork/columns"] });
    },
  });

  // Create column mutation
  const createColumnMutation = useMutation({
    mutationFn: async (columnData: CreateColumnFormData) => {
      return apiRequest("POST", "/api/artwork/columns", {
        ...columnData,
        position: (columns as any[]).length + 1,
        isDefault: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artwork/columns"] });
      setShowNewColumnDialog(false);
      columnForm.reset();
    },
  });

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async (cardData: CreateCardFormData) => {
      console.log("Creating card with data:", cardData);
      console.log("Selected column ID:", selectedColumnId);

      const requestData = {
        ...cardData,
        columnId: selectedColumnId,
        position: (cards as any[]).filter((card: any) => card.columnId === selectedColumnId).length + 1,
      };

      console.log("Full request data:", requestData);

      return apiRequest("POST", "/api/artwork/cards", requestData);
    },
    onSuccess: (data) => {
      console.log("Card created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/artwork/cards"] });
      setShowNewCardDialog(false);
      cardForm.reset();
    },
    onError: (error) => {
      console.error("Error creating card:", error);
    },
  });

  // Update card position mutation
  const updateCardPositionMutation = useMutation({
    mutationFn: async ({ cardId, columnId, position }: { cardId: string; columnId: string; position: number }) => {
      return apiRequest("PATCH", `/api/artwork/cards/${cardId}/move`, {
        columnId,
        position,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artwork/cards"] });
    },
  });

  // Update card mutation
  const updateCardMutation = useMutation({
    mutationFn: async ({ cardId, data }: { cardId: string; data: any }) => {
      return apiRequest("PATCH", `/api/artwork/cards/${cardId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artwork/cards"] });
      setShowEditCardDialog(false);
      editCardForm.reset();
      setEditingCard(null);
      setEditUploadedFiles([]);
      setEditFilePreviews({});
      setExistingAttachments([]);
    },
  });

  // File upload functionality
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const allowedTypes = ['.ai', '.eps', '.jpeg', '.jpg', '.png', '.pdf'];

    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedTypes.includes(extension);
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);

    // Create previews for image files
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreviews(prev => ({
            ...prev,
            [file.name]: e.target?.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
    setFilePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[fileName];
      return newPreviews;
    });
  };

  // File management for edit dialog
  const handleEditFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const allowedTypes = ['.ai', '.eps', '.jpeg', '.jpg', '.png', '.pdf'];

    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedTypes.includes(extension);
    });

    setEditUploadedFiles(prev => [...prev, ...validFiles]);

    // Create previews for image files
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setEditFilePreviews(prev => ({
            ...prev,
            [file.name]: e.target?.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeEditFile = (fileName: string) => {
    setEditUploadedFiles(prev => prev.filter(file => file.name !== fileName));
    setEditFilePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[fileName];
      return newPreviews;
    });
  };

  const removeExistingAttachment = (attachmentId: string) => {
    setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleCreateCard = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowNewCardDialog(true);
  };

  const onCreateCard = (data: CreateCardFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Selected column:", selectedColumnId);

    if (!selectedColumnId) {
      console.error("No column selected!");
      return;
    }

    // Include uploaded files in the card data as an array (will be stored as jsonb)
    const attachmentsData = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      fileType: file.type,
      fileSize: file.size,
    }));

    const cardData = {
      ...data,
      attachments: attachmentsData,
      labels: [],
      checklist: [],
      comments: [],
    };

    console.log("Submitting card data:", cardData);
    createCardMutation.mutate(cardData);

    // Reset file upload state
    setUploadedFiles([]);
    setFilePreviews({});
  };

  const onCreateColumn = (data: CreateColumnFormData) => {
    createColumnMutation.mutate(data);
  };

  const onEditCard = (data: CreateCardFormData) => {
    if (editingCard) {
      // Combine existing attachments with new uploaded files
      const newAttachments = editUploadedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        fileSize: file.size
      }));

      const allAttachments = [...existingAttachments, ...newAttachments];

      updateCardMutation.mutate({
        cardId: editingCard.id,
        data: {
          ...data,
          attachments: allAttachments
        }
      });
    }
  };

  const handleCardClick = (card: any) => {
    setEditingCard(card);
    editCardForm.reset({
      title: card.title || "",
      description: card.description || "",
      companyId: card.companyId || "",
      orderId: card.orderId || "",
      assignedUserId: card.assignedUserId || "",
      priority: card.priority || "medium",
      dueDate: card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : "",
    });

    // Handle existing attachments
    const attachments = safeJsonParse(card.attachments, []);
    setExistingAttachments(attachments);
    setEditUploadedFiles([]);
    setEditFilePreviews({});

    setShowEditCardDialog(true);
  };

  // Drag and drop handler
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update card position
    updateCardPositionMutation.mutate({
      cardId: draggableId,
      columnId: destination.droppableId,
      position: destination.index + 1,
    });
  };

  // Initialize columns if empty
  useEffect(() => {
    if ((columns as any[]).length === 0 && !columnsLoading) {
      initializeColumnsMutation.mutate();
    }
  }, [(columns as any[]).length, columnsLoading]);

  const isLoading = columnsLoading || cardsLoading;

  return {
    // State
    searchQuery,
    setSearchQuery,
    showNewCardDialog,
    setShowNewCardDialog,
    showNewColumnDialog,
    setShowNewColumnDialog,
    showEditCardDialog,
    setShowEditCardDialog,
    uploadedFiles,
    editUploadedFiles,
    filePreviews,
    editFilePreviews,
    existingAttachments,
    fileInputRef,
    editFileInputRef,

    // Forms
    cardForm,
    editCardForm,
    columnForm,

    // Data
    columns: columns as any[],
    cards: cards as any[],
    companies: companies as any[],
    orders: orders as any[],
    isLoading,

    // Mutations
    createColumnMutation,
    createCardMutation,
    updateCardMutation,

    // Handlers
    handleFileUpload,
    removeFile,
    handleEditFileUpload,
    removeEditFile,
    removeExistingAttachment,
    handleCreateCard,
    onCreateCard,
    onCreateColumn,
    onEditCard,
    handleCardClick,
    onDragEnd,
  };
}
