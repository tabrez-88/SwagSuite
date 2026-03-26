import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useProductionStages } from "@/hooks/useProductionStages";
import { useNextActionTypes } from "@/hooks/useNextActionTypes";

export const STAGE_COLORS = [
  { value: "bg-gray-100 text-gray-800", label: "Gray" },
  { value: "bg-blue-100 text-blue-800", label: "Blue" },
  { value: "bg-purple-100 text-purple-800", label: "Purple" },
  { value: "bg-indigo-100 text-indigo-800", label: "Indigo" },
  { value: "bg-yellow-100 text-yellow-800", label: "Yellow" },
  { value: "bg-orange-100 text-orange-800", label: "Orange" },
  { value: "bg-green-100 text-green-800", label: "Green" },
  { value: "bg-cyan-100 text-cyan-800", label: "Cyan" },
  { value: "bg-emerald-100 text-emerald-800", label: "Emerald" },
  { value: "bg-red-100 text-red-800", label: "Red" },
  { value: "bg-pink-100 text-pink-800", label: "Pink" },
];

export function useProductionStagesTab() {
  const { toast } = useToast();

  const {
    stages: productionStages,
    isLoading: stagesLoading,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
    resetStages,
    isCreating: stageCreating,
    isDeleting: stageDeleting,
  } = useProductionStages();

  // Production stages dialog state
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageDescription, setNewStageDescription] = useState("");
  const [newStageColor, setNewStageColor] = useState("bg-gray-100 text-gray-800");
  const [editStageOpen, setEditStageOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Next Action Types
  const {
    actionTypes,
    isLoading: actionTypesLoading,
    createType: createActionType,
    updateType: updateActionType,
    deleteType: deleteActionType,
    reorderTypes: reorderActionTypes,
    resetTypes: resetActionTypes,
    isCreating: actionTypeCreating,
    isDeleting: actionTypeDeleting,
  } = useNextActionTypes();

  const [addActionTypeOpen, setAddActionTypeOpen] = useState(false);
  const [newActionTypeName, setNewActionTypeName] = useState("");
  const [newActionTypeDescription, setNewActionTypeDescription] = useState("");
  const [newActionTypeColor, setNewActionTypeColor] = useState("bg-gray-100 text-gray-800");
  const [editActionTypeOpen, setEditActionTypeOpen] = useState(false);
  const [editingActionType, setEditingActionType] = useState<any>(null);
  const [resetActionTypesConfirmOpen, setResetActionTypesConfirmOpen] = useState(false);

  // Handlers - Production Stages
  const handleOpenAddStage = () => {
    setNewStageName("");
    setNewStageDescription("");
    setNewStageColor("bg-gray-100 text-gray-800");
    setAddStageOpen(true);
  };

  const handleOpenEditStage = (stage: any) => {
    setEditingStage(stage);
    setEditStageOpen(true);
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      await deleteStage(stageId);
      toast({ title: "Stage deleted" });
    } catch {
      toast({ title: "Failed to delete stage", variant: "destructive" });
    }
  };

  const handleCreateStage = async () => {
    try {
      await createStage({
        name: newStageName.trim(),
        description: newStageDescription.trim() || undefined,
        color: newStageColor,
        icon: "Package",
      });
      toast({ title: "Stage added" });
      setAddStageOpen(false);
    } catch {
      toast({ title: "Failed to add stage", variant: "destructive" });
    }
  };

  const handleUpdateStage = async () => {
    if (!editingStage) return;
    try {
      await updateStage({
        id: editingStage.id,
        name: editingStage.name.trim(),
        description: editingStage.description?.trim() || undefined,
        color: editingStage.color,
      });
      toast({ title: "Stage updated" });
      setEditStageOpen(false);
    } catch {
      toast({ title: "Failed to update stage", variant: "destructive" });
    }
  };

  const handleReorderStages = async (sourceIndex: number, destIndex: number) => {
    const reordered = [...productionStages];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, moved);
    try {
      await reorderStages(reordered.map((s: any) => s.id));
    } catch {
      toast({ title: "Failed to reorder stages", variant: "destructive" });
    }
  };

  const handleResetStages = async () => {
    try {
      await resetStages();
      toast({ title: "Stages reset to defaults" });
    } catch {
      toast({ title: "Failed to reset stages", variant: "destructive" });
    }
  };

  // Handlers - Next Action Types
  const handleOpenAddActionType = () => {
    setNewActionTypeName("");
    setNewActionTypeDescription("");
    setNewActionTypeColor("bg-gray-100 text-gray-800");
    setAddActionTypeOpen(true);
  };

  const handleOpenEditActionType = (actionType: any) => {
    setEditingActionType({ ...actionType });
    setEditActionTypeOpen(true);
  };

  const handleDeleteActionType = async (actionTypeId: string) => {
    try {
      await deleteActionType(actionTypeId);
      toast({ title: "Action type removed" });
    } catch {
      toast({ title: "Failed to delete action type", variant: "destructive" });
    }
  };

  const handleCreateActionType = async () => {
    try {
      await createActionType({
        name: newActionTypeName.trim(),
        description: newActionTypeDescription.trim() || undefined,
        color: newActionTypeColor,
        icon: "ClipboardList",
      });
      toast({ title: "Action type added" });
      setAddActionTypeOpen(false);
    } catch {
      toast({ title: "Failed to add action type", variant: "destructive" });
    }
  };

  const handleUpdateActionType = async () => {
    if (!editingActionType) return;
    try {
      await updateActionType({
        id: editingActionType.id,
        name: editingActionType.name.trim(),
        description: editingActionType.description?.trim() || undefined,
        color: editingActionType.color,
      });
      toast({ title: "Action type updated" });
      setEditActionTypeOpen(false);
    } catch {
      toast({ title: "Failed to update action type", variant: "destructive" });
    }
  };

  const handleReorderActionTypes = async (sourceIndex: number, destIndex: number) => {
    const reordered = [...actionTypes];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, moved);
    try {
      await reorderActionTypes(reordered.map((t: any) => t.id));
    } catch {
      toast({ title: "Failed to reorder action types", variant: "destructive" });
    }
  };

  const handleResetActionTypes = async () => {
    try {
      await resetActionTypes();
      toast({ title: "Action types reset to defaults" });
    } catch {
      toast({ title: "Failed to reset action types", variant: "destructive" });
    }
  };

  return {
    // Production Stages data
    productionStages,
    stagesLoading,
    stageCreating,
    stageDeleting,

    // Production Stages dialog state
    addStageOpen,
    setAddStageOpen,
    newStageName,
    setNewStageName,
    newStageDescription,
    setNewStageDescription,
    newStageColor,
    setNewStageColor,
    editStageOpen,
    setEditStageOpen,
    editingStage,
    setEditingStage,
    resetConfirmOpen,
    setResetConfirmOpen,

    // Production Stages handlers
    handleOpenAddStage,
    handleOpenEditStage,
    handleDeleteStage,
    handleCreateStage,
    handleUpdateStage,
    handleReorderStages,
    handleResetStages,

    // Next Action Types data
    actionTypes,
    actionTypesLoading,
    actionTypeCreating,
    actionTypeDeleting,

    // Next Action Types dialog state
    addActionTypeOpen,
    setAddActionTypeOpen,
    newActionTypeName,
    setNewActionTypeName,
    newActionTypeDescription,
    setNewActionTypeDescription,
    newActionTypeColor,
    setNewActionTypeColor,
    editActionTypeOpen,
    setEditActionTypeOpen,
    editingActionType,
    setEditingActionType,
    resetActionTypesConfirmOpen,
    setResetActionTypesConfirmOpen,

    // Next Action Types handlers
    handleOpenAddActionType,
    handleOpenEditActionType,
    handleDeleteActionType,
    handleCreateActionType,
    handleUpdateActionType,
    handleReorderActionTypes,
    handleResetActionTypes,
  };
}
