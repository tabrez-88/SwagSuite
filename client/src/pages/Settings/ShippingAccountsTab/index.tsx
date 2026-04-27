import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { Plus, Pencil, Trash2, Truck, Package, GripVertical } from "lucide-react";
import { useShippingAccountsTab } from "./hooks";
import { ShippingAccountForm, COURIER_OPTIONS } from "./components/ShippingAccountForm";

export function ShippingAccountsTab() {
  const hook = useShippingAccountsTab();

  const courierLabel = (courier: string) =>
    COURIER_OPTIONS.find((o) => o.value === courier)?.label ?? courier;

  return (
    <div className="space-y-6">
      {/* ── Shipping Methods ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Shipping Methods
          </CardTitle>
          <Button size="sm" onClick={hook.openCreateMethod}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Method
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Configure available shipping methods. The courier type determines which shipping
            accounts appear when entering shipping details. The topmost method is the default
            for new purchase orders.
          </p>

          {hook.methodsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading shipping methods...
            </div>
          ) : hook.methods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shipping methods yet. Click "Add Method" to create your first one.
            </div>
          ) : (
            <DragDropContext onDragEnd={(result: DropResult) => {
              if (!result.destination || result.source.index === result.destination.index) return;
              hook.handleReorderMethods(result.source.index, result.destination.index);
            }}>
              <Droppable droppableId="shipping-methods">
                {(provided) => (
                  <div className="space-y-2" ref={provided.innerRef} {...provided.droppableProps}>
                    {hook.methods.map((method, index) => (
                      <Draggable key={method.id} draggableId={String(method.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-3 bg-muted/30 rounded-lg border ${
                              snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
                            }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{method.name}</span>
                                <Badge variant="outline">{courierLabel(method.courier)}</Badge>
                                {index === 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => hook.openEditMethod(method)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => hook.setDeleteMethodId(method.id)}
                              disabled={hook.isMethodDeleting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* ── Shipping Accounts ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Accounts
          </CardTitle>
          <Button size="sm" onClick={hook.openCreateAccount}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Account
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your organization's shipping accounts (UPS, FedEx, etc.). These appear when
            the selected shipping method's courier matches. Client-specific accounts are managed
            on each company profile.
          </p>

          {hook.accountsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading shipping accounts...
            </div>
          ) : hook.accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shipping accounts yet. Click "Add Account" to create your first one.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Account #</TableHead>
                    <TableHead>Billing Zip</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hook.accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {account.accountName}
                          {account.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{courierLabel(account.courier)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {account.accountNumber}
                      </TableCell>
                      <TableCell>{account.billingZip ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => hook.openEditAccount(account)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => hook.setDeleteAccountId(account.id)}
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

      {/* ── Account Dialog ── */}
      <Dialog open={hook.isAccountDialogOpen} onOpenChange={hook.setIsAccountDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {hook.editingAccount ? "Edit Shipping Account" : "New Shipping Account"}
            </DialogTitle>
            <DialogDescription>
              {hook.editingAccount
                ? "Update the shipping account details."
                : "Add a new shipping account for your organization."}
            </DialogDescription>
          </DialogHeader>
          <ShippingAccountForm
            form={hook.accountForm}
            onChange={hook.handleAccountChange}
            onSubmit={hook.handleAccountSubmit}
            onCancel={() => hook.setIsAccountDialogOpen(false)}
            isPending={hook.isAccountPending}
            isEdit={!!hook.editingAccount}
          />
        </DialogContent>
      </Dialog>

      {/* ── Method Dialog ── */}
      <Dialog open={hook.isMethodDialogOpen} onOpenChange={hook.setIsMethodDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {hook.editingMethod ? "Edit Shipping Method" : "New Shipping Method"}
            </DialogTitle>
            <DialogDescription>
              {hook.editingMethod
                ? "Update the shipping method."
                : "Add a new shipping method. The courier type determines which accounts appear."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={hook.handleMethodSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="methodName">Method Name *</Label>
              <Input
                id="methodName"
                placeholder="e.g., Ground, 2-Day Air, Next Day Air"
                value={hook.methodForm.name ?? ""}
                onChange={(e) => hook.handleMethodChange({ name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="methodCourier">Courier *</Label>
              <Select
                value={hook.methodForm.courier ?? ""}
                onValueChange={(v) =>
                  hook.handleMethodChange({ courier: v as ShippingMethodCourier })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select courier" />
                </SelectTrigger>
                <SelectContent>
                  {COURIER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => hook.setIsMethodDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  hook.isMethodPending ||
                  !hook.methodForm.name?.trim() ||
                  !hook.methodForm.courier
                }
              >
                {hook.isMethodPending
                  ? "Saving..."
                  : hook.editingMethod
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Account Confirmation ── */}
      <AlertDialog
        open={!!hook.deleteAccountId}
        onOpenChange={(o) => !o && hook.setDeleteAccountId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipping Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate this shipping account. It will no longer appear in dropdown
              selections but existing references will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={hook.handleDeleteAccount}
              disabled={hook.isAccountDeleting}
            >
              {hook.isAccountDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Method Confirmation ── */}
      <AlertDialog
        open={!!hook.deleteMethodId}
        onOpenChange={(o) => !o && hook.setDeleteMethodId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipping Method?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate this shipping method. Existing orders using it will retain
              the value but it won't appear in new selections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={hook.handleDeleteMethod}
              disabled={hook.isMethodDeleting}
            >
              {hook.isMethodDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper type for courier union
type ShippingMethodCourier = "ups" | "fedex" | "usps" | "dhl" | "other";
