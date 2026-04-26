import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { useCompanyShippingAccountsTab } from "./hooks";
import {
  ShippingAccountForm,
  COURIER_OPTIONS,
} from "@/pages/Settings/ShippingAccountsTab/components/ShippingAccountForm";

interface ShippingAccountsTabProps {
  companyId: string;
}

export default function ShippingAccountsTab({ companyId }: ShippingAccountsTabProps) {
  const hook = useCompanyShippingAccountsTab(companyId);

  const courierLabel = (courier: string) =>
    COURIER_OPTIONS.find((o) => o.value === courier)?.label ?? courier;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Client Shipping Accounts
          </CardTitle>
          <Button size="sm" onClick={hook.openCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Account
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage shipping accounts specific to this client. These appear alongside your
            organization's accounts when configuring shipping.
          </p>

          {hook.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading shipping accounts...
            </div>
          ) : hook.accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shipping accounts for this client yet.
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
                      <TableCell className="font-medium">{account.accountName}</TableCell>
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
                            onClick={() => hook.openEdit(account)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => hook.setDeleteId(account.id)}
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

      <Dialog open={hook.isDialogOpen} onOpenChange={hook.setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {hook.editingAccount ? "Edit Shipping Account" : "New Shipping Account"}
            </DialogTitle>
            <DialogDescription>
              {hook.editingAccount
                ? "Update this client's shipping account."
                : "Add a shipping account for this client."}
            </DialogDescription>
          </DialogHeader>
          <ShippingAccountForm
            form={hook.form}
            onChange={hook.handleChange}
            onSubmit={hook.handleSubmit}
            onCancel={() => hook.setIsDialogOpen(false)}
            isPending={hook.isPending}
            isEdit={!!hook.editingAccount}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!hook.deleteId}
        onOpenChange={(o) => !o && hook.setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipping Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate this shipping account for this client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={hook.handleDelete}
              disabled={hook.isDeleting}
            >
              {hook.isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
