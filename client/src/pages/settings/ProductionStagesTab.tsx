import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import { useToast } from "@/hooks/use-toast";
import { useProductionStages } from "@/hooks/useProductionStages";
import { useNextActionTypes } from "@/hooks/useNextActionTypes";
import { useState } from "react";
import {
  ClipboardList,
  Factory,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

const STAGE_COLORS = [
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

export function ProductionStagesTab() {
  const { toast } = useToast();

  const {
    stages: productionStages,
    isLoading: stagesLoading,
    createStage,
    updateStage,
    deleteStage,
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Production Stages
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize the production stages that appear on project overview pages.
            Users can manually mark stages as complete on each project.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {stagesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading stages...</div>
          ) : (
            <div className="space-y-2">
              {productionStages.map((stage: any, index: number) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={stage.color || "bg-gray-100 text-gray-800"}>
                        {stage.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Step {index + 1}
                      </span>
                    </div>
                    {stage.description && (
                      <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEditingStage(stage);
                      setEditStageOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      try {
                        await deleteStage(stage.id);
                        toast({ title: "Stage deleted" });
                      } catch {
                        toast({ title: "Failed to delete stage", variant: "destructive" });
                      }
                    }}
                    disabled={stageDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewStageName("");
                setNewStageDescription("");
                setNewStageColor("bg-gray-100 text-gray-800");
                setAddStageOpen(true);
              }}
              disabled={stageCreating}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Stage
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetConfirmOpen(true)}
            >
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Stage Dialog */}
      <Dialog open={addStageOpen} onOpenChange={setAddStageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Production Stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Stage Name *</Label>
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g. Quality Check"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newStageDescription}
                onChange={(e) => setNewStageDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Color</Label>
              <Select value={newStageColor} onValueChange={setNewStageColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={c.value}>{c.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddStageOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!newStageName.trim() || stageCreating}
                onClick={async () => {
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
                }}
              >
                Add Stage
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={editStageOpen} onOpenChange={setEditStageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Production Stage</DialogTitle>
          </DialogHeader>
          {editingStage && (
            <div className="space-y-4">
              <div>
                <Label>Stage Name *</Label>
                <Input
                  value={editingStage.name}
                  onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editingStage.description || ""}
                  onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Color</Label>
                <Select
                  value={editingStage.color || "bg-gray-100 text-gray-800"}
                  onValueChange={(val) => setEditingStage({ ...editingStage, color: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={c.value}>{c.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditStageOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!editingStage.name?.trim()}
                  onClick={async () => {
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
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Production Stages?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all custom stages and restore the default production stages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await resetStages();
                  toast({ title: "Stages reset to defaults" });
                } catch {
                  toast({ title: "Failed to reset stages", variant: "destructive" });
                }
              }}
            >
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Next Action Types ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Next Action Types
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize the follow-up action types available in the Production Report.
            Users select a Next Action + Date for each PO to track what needs to happen next.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionTypesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading action types...</div>
          ) : (
            <div className="space-y-2">
              {actionTypes.map((actionType: any, index: number) => (
                <div
                  key={actionType.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={actionType.color || "bg-gray-100 text-gray-800"}>
                        {actionType.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        #{index + 1}
                      </span>
                    </div>
                    {actionType.description && (
                      <p className="text-xs text-muted-foreground mt-1">{actionType.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingActionType({ ...actionType });
                      setEditActionTypeOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={async () => {
                      try {
                        await deleteActionType(actionType.id);
                        toast({ title: "Action type removed" });
                      } catch {
                        toast({ title: "Failed to delete action type", variant: "destructive" });
                      }
                    }}
                    disabled={actionTypeDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewActionTypeName("");
                setNewActionTypeDescription("");
                setNewActionTypeColor("bg-gray-100 text-gray-800");
                setAddActionTypeOpen(true);
              }}
              disabled={actionTypeCreating}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Action Type
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetActionTypesConfirmOpen(true)}
            >
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Action Type Dialog */}
      <Dialog open={addActionTypeOpen} onOpenChange={setAddActionTypeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Next Action Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action Name *</Label>
              <Input
                value={newActionTypeName}
                onChange={(e) => setNewActionTypeName(e.target.value)}
                placeholder="e.g. Follow Up with Vendor"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newActionTypeDescription}
                onChange={(e) => setNewActionTypeDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Color</Label>
              <Select value={newActionTypeColor} onValueChange={setNewActionTypeColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={c.value}>{c.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddActionTypeOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!newActionTypeName.trim() || actionTypeCreating}
                onClick={async () => {
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
                }}
              >
                Add Action Type
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Action Type Dialog */}
      <Dialog open={editActionTypeOpen} onOpenChange={setEditActionTypeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Next Action Type</DialogTitle>
          </DialogHeader>
          {editingActionType && (
            <div className="space-y-4">
              <div>
                <Label>Action Name *</Label>
                <Input
                  value={editingActionType.name}
                  onChange={(e) => setEditingActionType({ ...editingActionType, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editingActionType.description || ""}
                  onChange={(e) => setEditingActionType({ ...editingActionType, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Color</Label>
                <Select
                  value={editingActionType.color || "bg-gray-100 text-gray-800"}
                  onValueChange={(val) => setEditingActionType({ ...editingActionType, color: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={c.value}>{c.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditActionTypeOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!editingActionType.name?.trim()}
                  onClick={async () => {
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
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Action Types Confirmation */}
      <AlertDialog open={resetActionTypesConfirmOpen} onOpenChange={setResetActionTypesConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Next Action Types?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all custom action types and restore the defaults.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await resetActionTypes();
                  toast({ title: "Action types reset to defaults" });
                } catch {
                  toast({ title: "Failed to reset action types", variant: "destructive" });
                }
              }}
            >
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
