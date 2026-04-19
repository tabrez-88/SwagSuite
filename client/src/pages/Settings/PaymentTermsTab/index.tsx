import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  usePaymentTerms,
  useCreatePaymentTerm,
  useUpdatePaymentTerm,
  useDeletePaymentTerm,
  useSetDefaultPaymentTerm,
} from "@/services/payment-terms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Pencil, Trash2, CreditCard, Star } from "lucide-react";

interface PaymentTerm {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function PaymentTermsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<PaymentTerm | null>(null);
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: paymentTerms = [], isLoading } = usePaymentTerms() as unknown as {
    data: PaymentTerm[];
    isLoading: boolean;
  };

  const _create = useCreatePaymentTerm();
  const createMutation = {
    ..._create,
    mutate: (data: { name: string }) =>
      _create.mutate(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setName("");
          toast({ title: "Payment term created" });
        },
        onError: (err: Error) =>
          toast({ title: "Error", description: err.message, variant: "destructive" }),
      }),
  };

  const _update = useUpdatePaymentTerm();
  const updateMutation = {
    ..._update,
    mutate: ({ id, data }: { id: string; data: { name: string } }) =>
      _update.mutate(
        { id, data },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingTerm(null);
            setName("");
            toast({ title: "Payment term updated" });
          },
          onError: (err: Error) =>
            toast({ title: "Error", description: err.message, variant: "destructive" }),
        },
      ),
  };

  const _delete = useDeletePaymentTerm();
  const deleteMutation = {
    ..._delete,
    mutate: (id: string) =>
      _delete.mutate(id, {
        onSuccess: () => {
          setDeleteId(null);
          toast({ title: "Payment term deleted" });
        },
        onError: (err: Error) =>
          toast({ title: "Error", description: err.message, variant: "destructive" }),
      }),
  };

  const setDefaultMutation = useSetDefaultPaymentTerm();

  const handleSetDefault = (term: PaymentTerm) => {
    if (term.isDefault) return;
    setDefaultMutation.mutate(term.id, {
      onSuccess: () => {
        toast({ title: `"${term.name}" set as default payment term` });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const openCreate = () => {
    setEditingTerm(null);
    setName("");
    setIsDialogOpen(true);
  };

  const openEdit = (term: PaymentTerm) => {
    setEditingTerm(term);
    setName(term.name);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTerm) {
      updateMutation.mutate({ id: editingTerm.id, data: { name } });
    } else {
      createMutation.mutate({ name });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Terms
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Payment Term
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Create and manage payment terms used across companies, vendors, and orders.
            The default term will be automatically applied to new orders when no specific term is set.
          </p>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading payment terms...</div>
          ) : paymentTerms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment terms yet. Click "Add Payment Term" to create your first one.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {term.name}
                          {term.isDefault && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Default
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!term.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleSetDefault(term)}
                              disabled={setDefaultMutation.isPending}
                            >
                              <Star className="w-3.5 h-3.5 mr-1.5" />
                              Set Default
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openEdit(term)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteId(term.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTerm ? "Edit Payment Term" : "New Payment Term"}</DialogTitle>
            <DialogDescription>
              {editingTerm
                ? "Update the payment term name."
                : "Create a new payment term option."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Net 30"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? "Saving..." : editingTerm ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Term?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment term. It cannot be deleted if it's
              currently assigned to any companies, vendors, or orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
