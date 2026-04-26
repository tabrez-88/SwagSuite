import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useShippingAccounts,
  useCreateShippingAccount,
  useUpdateShippingAccount,
  useDeleteShippingAccount,
  type ShippingAccount,
} from "@/services/shipping-accounts";
import {
  useShippingMethods,
  useCreateShippingMethod,
  useUpdateShippingMethod,
  useDeleteShippingMethod,
  useReorderShippingMethods,
  type ShippingMethod,
} from "@/services/shipping-methods";

const EMPTY_ACCOUNT_FORM: Partial<ShippingAccount> = {
  accountName: "",
  courier: undefined,
  accountNumber: "",
  billingZip: "",
  ownerType: "organization",
};

const EMPTY_METHOD_FORM: Partial<ShippingMethod> = {
  name: "",
  courier: undefined,
};

export function useShippingAccountsTab() {
  const { toast } = useToast();

  // ── Accounts state ──
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ShippingAccount | null>(null);
  const [accountForm, setAccountForm] = useState<Partial<ShippingAccount>>(EMPTY_ACCOUNT_FORM);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  const { data: accounts = [], isLoading: accountsLoading } = useShippingAccounts();
  const createAccountMutation = useCreateShippingAccount();
  const updateAccountMutation = useUpdateShippingAccount();
  const deleteAccountMutation = useDeleteShippingAccount();

  // ── Methods state ──
  const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [methodForm, setMethodForm] = useState<Partial<ShippingMethod>>(EMPTY_METHOD_FORM);
  const [deleteMethodId, setDeleteMethodId] = useState<string | null>(null);

  const { data: methods = [], isLoading: methodsLoading } = useShippingMethods();
  const createMethodMutation = useCreateShippingMethod();
  const updateMethodMutation = useUpdateShippingMethod();
  const deleteMethodMutation = useDeleteShippingMethod();
  const reorderMethodsMutation = useReorderShippingMethods();

  // ── Account handlers ──
  const openCreateAccount = () => {
    setEditingAccount(null);
    setAccountForm(EMPTY_ACCOUNT_FORM);
    setIsAccountDialogOpen(true);
  };

  const openEditAccount = (account: ShippingAccount) => {
    setEditingAccount(account);
    setAccountForm({
      accountName: account.accountName,
      courier: account.courier,
      accountNumber: account.accountNumber,
      billingZip: account.billingZip ?? "",
    });
    setIsAccountDialogOpen(true);
  };

  const handleAccountChange = (updates: Partial<ShippingAccount>) => {
    setAccountForm((prev) => ({ ...prev, ...updates }));
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      updateAccountMutation.mutate(
        { id: editingAccount.id, data: accountForm },
        {
          onSuccess: () => {
            setIsAccountDialogOpen(false);
            setEditingAccount(null);
            toast({ title: "Shipping account updated" });
          },
          onError: (err: Error) =>
            toast({ title: "Error", description: err.message, variant: "destructive" }),
        },
      );
    } else {
      createAccountMutation.mutate(
        { ...accountForm, ownerType: "organization" },
        {
          onSuccess: () => {
            setIsAccountDialogOpen(false);
            setAccountForm(EMPTY_ACCOUNT_FORM);
            toast({ title: "Shipping account created" });
          },
          onError: (err: Error) =>
            toast({ title: "Error", description: err.message, variant: "destructive" }),
        },
      );
    }
  };

  const handleDeleteAccount = () => {
    if (!deleteAccountId) return;
    deleteAccountMutation.mutate(deleteAccountId, {
      onSuccess: () => {
        setDeleteAccountId(null);
        toast({ title: "Shipping account deleted" });
      },
      onError: (err: Error) =>
        toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  // ── Method handlers ──
  const openCreateMethod = () => {
    setEditingMethod(null);
    setMethodForm(EMPTY_METHOD_FORM);
    setIsMethodDialogOpen(true);
  };

  const openEditMethod = (method: ShippingMethod) => {
    setEditingMethod(method);
    setMethodForm({ name: method.name, courier: method.courier });
    setIsMethodDialogOpen(true);
  };

  const handleMethodChange = (updates: Partial<ShippingMethod>) => {
    setMethodForm((prev) => ({ ...prev, ...updates }));
  };

  const handleMethodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMethod) {
      updateMethodMutation.mutate(
        { id: editingMethod.id, data: methodForm },
        {
          onSuccess: () => {
            setIsMethodDialogOpen(false);
            setEditingMethod(null);
            toast({ title: "Shipping method updated" });
          },
          onError: (err: Error) =>
            toast({ title: "Error", description: err.message, variant: "destructive" }),
        },
      );
    } else {
      createMethodMutation.mutate(
        { ...methodForm, sortOrder: methods.length },
        {
          onSuccess: () => {
            setIsMethodDialogOpen(false);
            setMethodForm(EMPTY_METHOD_FORM);
            toast({ title: "Shipping method created" });
          },
          onError: (err: Error) =>
            toast({ title: "Error", description: err.message, variant: "destructive" }),
        },
      );
    }
  };

  const handleDeleteMethod = () => {
    if (!deleteMethodId) return;
    deleteMethodMutation.mutate(deleteMethodId, {
      onSuccess: () => {
        setDeleteMethodId(null);
        toast({ title: "Shipping method deleted" });
      },
      onError: (err: Error) =>
        toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const handleMoveMethod = (index: number, direction: "up" | "down") => {
    const newMethods = [...methods];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newMethods.length) return;
    [newMethods[index], newMethods[swapIndex]] = [newMethods[swapIndex], newMethods[index]];
    reorderMethodsMutation.mutate(newMethods.map((m) => m.id));
  };

  return {
    // Accounts
    accounts,
    accountsLoading,
    isAccountDialogOpen,
    setIsAccountDialogOpen,
    editingAccount,
    accountForm,
    deleteAccountId,
    setDeleteAccountId,
    openCreateAccount,
    openEditAccount,
    handleAccountChange,
    handleAccountSubmit,
    handleDeleteAccount,
    isAccountPending: createAccountMutation.isPending || updateAccountMutation.isPending,
    isAccountDeleting: deleteAccountMutation.isPending,

    // Methods
    methods,
    methodsLoading,
    isMethodDialogOpen,
    setIsMethodDialogOpen,
    editingMethod,
    methodForm,
    deleteMethodId,
    setDeleteMethodId,
    openCreateMethod,
    openEditMethod,
    handleMethodChange,
    handleMethodSubmit,
    handleDeleteMethod,
    handleMoveMethod,
    isMethodPending: createMethodMutation.isPending || updateMethodMutation.isPending,
    isMethodDeleting: deleteMethodMutation.isPending,
  };
}
