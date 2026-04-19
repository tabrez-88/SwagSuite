import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  Inbox,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useApproveImprintSuggestion,
  useCreateImprintOption,
  useDeleteImprintOption,
  useImprintOptions,
  useImprintSuggestionPendingCount,
  useImprintSuggestions,
  useRejectImprintSuggestion,
  useUpdateImprintOption,
  type ImprintOption,
  type ImprintOptionType,
} from "@/services/imprint-options";

export function ImprintOptionsTab() {
  const { data: pendingCount } = useImprintSuggestionPendingCount();
  const [inner, setInner] = useState<"options" | "suggestions">("options");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Imprint Options
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage the canonical lists of imprint locations and methods that appear in
          project forms. Review user-submitted suggestions and decide whether to add
          them to the global lists.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={inner} onValueChange={(v) => setInner(v as any)}>
          <TabsList>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              Suggestions
              {pendingCount && pendingCount.count > 0 && (
                <Badge className="bg-amber-500 text-white h-5 px-1.5 text-xs">
                  {pendingCount.count}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="space-y-6 pt-4">
            <OptionsList type="location" title="Imprint Locations" />
            <OptionsList type="method" title="Imprint Methods" />
          </TabsContent>

          <TabsContent value="suggestions" className="pt-4">
            <SuggestionsList />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function OptionsList({ type, title }: { type: ImprintOptionType; title: string }) {
  const { toast } = useToast();
  const { data: options = [], isLoading } = useImprintOptions(type, true);
  const createMutation = useCreateImprintOption();
  const updateMutation = useUpdateImprintOption();
  const deleteMutation = useDeleteImprintOption();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ImprintOption | null>(null);
  const [label, setLabel] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setLabel("");
    setDialogOpen(true);
  };

  const openEdit = (opt: ImprintOption) => {
    setEditing(opt);
    setLabel(opt.label);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: { label } });
        toast({ title: "Option updated" });
      } else {
        await createMutation.mutateAsync({ type, label });
        toast({ title: "Option added" });
      }
      setDialogOpen(false);
      setLabel("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "Could not save option",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (opt: ImprintOption) => {
    try {
      await updateMutation.mutateAsync({
        id: opt.id,
        data: { isActive: !opt.isActive },
      });
    } catch (err: any) {
      toast({
        title: "Could not update",
        description: err?.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({ title: "Option deleted" });
    } catch (err: any) {
      toast({
        title: "Could not delete",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Loading…
        </div>
      ) : options.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg">
          No options yet.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead className="w-40">Value</TableHead>
                <TableHead className="w-20 text-center">Built-in</TableHead>
                <TableHead className="w-24 text-center">Active</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((opt) => (
                <TableRow key={opt.id} className={!opt.isActive ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{opt.label}</TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground">{opt.value}</code>
                  </TableCell>
                  <TableCell className="text-center">
                    {opt.isBuiltIn && (
                      <Badge variant="secondary" className="text-xs text-nowrap">Built-in</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={opt.isActive}
                      onCheckedChange={() => toggleActive(opt)}
                      disabled={updateMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(opt)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {!opt.isBuiltIn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteId(opt.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Change the display label. The stored value stays the same so existing records keep working."
                : `Add a new option to the ${type === "location" ? "imprint locations" : "imprint methods"} list.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Label *</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={
                  type === "location" ? "e.g., Inside Hem" : "e.g., Glow-in-dark Ink"
                }
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !label.trim()}>
                {isPending ? "Saving…" : editing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete option?</AlertDialogTitle>
            <AlertDialogDescription>
              Existing records that reference this option will keep their stored value
              but lose the label mapping. Consider deactivating it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SuggestionsList() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">(
    "pending",
  );
  const { data: suggestions = [], isLoading } = useImprintSuggestions(
    filter === "all" ? undefined : filter,
  );
  const approveMutation = useApproveImprintSuggestion();
  const rejectMutation = useRejectImprintSuggestion();

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast({ title: "Approved — added to global list" });
    } catch (err: any) {
      toast({
        title: "Could not approve",
        description: err?.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMutation.mutateAsync({ id });
      toast({ title: "Rejected" });
    } catch (err: any) {
      toast({
        title: "Could not reject",
        description: err?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Loading…
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg flex flex-col items-center gap-2">
          <Inbox className="w-6 h-6" />
          No {filter === "all" ? "" : filter} suggestions.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-36">Submitted</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.label}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {s.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs capitalize ${
                        s.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : s.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleApprove(s.id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(s.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
