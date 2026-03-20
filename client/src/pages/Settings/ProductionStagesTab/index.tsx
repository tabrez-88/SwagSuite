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
import {
  ClipboardList,
  Factory,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useProductionStagesTab, STAGE_COLORS } from "./hooks";

export function ProductionStagesTab() {
  const {
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
    handleResetActionTypes,
  } = useProductionStagesTab();

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
                    onClick={() => handleOpenEditStage(stage)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteStage(stage.id)}
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
              onClick={handleOpenAddStage}
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
                onClick={handleCreateStage}
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
                  onClick={handleUpdateStage}
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
            <AlertDialogAction onClick={handleResetStages}>
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
                    onClick={() => handleOpenEditActionType(actionType)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteActionType(actionType.id)}
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
              onClick={handleOpenAddActionType}
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
                onClick={handleCreateActionType}
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
                  onClick={handleUpdateActionType}
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
            <AlertDialogAction onClick={handleResetActionTypes}>
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
