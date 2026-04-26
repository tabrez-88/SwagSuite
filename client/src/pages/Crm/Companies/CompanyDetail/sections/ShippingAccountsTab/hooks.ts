import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useCompanyShippingAccounts,
  useCreateShippingAccount,
  useUpdateShippingAccount,
  useDeleteShippingAccount,
  type ShippingAccount,
} from "@/services/shipping-accounts";

const EMPTY_FORM: Partial<ShippingAccount> = {
  accountName: "",
  courier: undefined,
  accountNumber: "",
  billingZip: "",
  ownerType: "company",
};

export function useCompanyShippingAccountsTab(companyId: string) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ShippingAccount | null>(null);
  const [form, setForm] = useState<Partial<ShippingAccount>>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: accounts = [], isLoading } = useCompanyShippingAccounts(companyId);

  const createMutation = useCreateShippingAccount(companyId);
  const updateMutation = useUpdateShippingAccount(companyId);
  const deleteMutation = useDeleteShippingAccount(companyId);

  const openCreate = () => {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (account: ShippingAccount) => {
    setEditingAccount(account);
    setForm({
      accountName: account.accountName,
      courier: account.courier,
      accountNumber: account.accountNumber,
      billingZip: account.billingZip ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleChange = (updates: Partial<ShippingAccount>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      updateMutation.mutate(
        { id: editingAccount.id, data: form },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingAccount(null);
            toast({ title: "Shipping account updated" });
          },
          onError: (err: Error) =>
            toast({ title: "Error", description: err.message, variant: "destructive" }),
        },
      );
    } else {
      createMutation.mutate(
        { ...form, ownerType: "company", ownerId: companyId },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setForm(EMPTY_FORM);
            toast({ title: "Shipping account created" });
          },
          onError: (err: Error) =>
            toast({ title: "Error", description: err.message, variant: "destructive" }),
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast({ title: "Shipping account deleted" });
      },
      onError: (err: Error) =>
        toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return {
    accounts,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingAccount,
    form,
    deleteId,
    setDeleteId,
    openCreate,
    openEdit,
    handleChange,
    handleSubmit,
    handleDelete,
    isPending: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
