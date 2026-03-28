import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreateShipment, useUpdateShipment, useDeleteShipment } from "@/services/shipments";
import { useToast } from "@/hooks/use-toast";
import { hasTimelineConflict } from "@/lib/dateUtils";
import type { OrderShipment } from "@shared/schema";
import type { ProjectData } from "@/types/project-types";
import { EMPTY_FORM, EMPTY_BULK } from "./types";
import type { ShipmentFormData, BulkEditData } from "./types";

export function useShippingSection(projectId: string, data: ProjectData) {
  const { order, orderItems, orderVendors, shipments, shipmentsLoading } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Shipment tracking state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<OrderShipment | null>(null);
  const [form, setForm] = useState<ShipmentFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<OrderShipment | null>(null);

  // Shipping details table state
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkEditData>(EMPTY_BULK);
  const [showShipmentTracking, setShowShipmentTracking] = useState(true);

  // Optimistic local state for shipping fields
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({});

  const getItemField = (item: any, field: string): string => {
    const key = `${item.id}:${field}`;
    if (key in localOverrides) return localOverrides[key];
    return item[field] || "";
  };

  const setLocalField = (itemId: string, field: string, value: string) => {
    setLocalOverrides(prev => ({ ...prev, [`${itemId}:${field}`]: value }));
  };

  // Parse order shipping address for auto-fill
  const parsedAddress = useMemo(() => {
    try {
      if ((order as any)?.shippingAddress) {
        return JSON.parse((order as any).shippingAddress as string);
      }
    } catch {
      return { street: (order as any)?.shippingAddress || "" };
    }
    return null;
  }, [order]);

  // Build supplier list from vendors
  const suppliers = useMemo(() => {
    return orderVendors.map((v: any) => ({ id: v.id, name: v.companyName || v.name || "Unknown Supplier" }));
  }, [orderVendors]);

  // Filter items by supplier
  const filteredItems = useMemo(() => {
    if (supplierFilter === "all") return orderItems;
    return orderItems.filter((item: any) => item.supplierId === supplierFilter);
  }, [orderItems, supplierFilter]);

  // Calculate shipping config progress
  const shippingProgress = useMemo(() => {
    const total = orderItems.length;
    const configured = orderItems.filter((item: any) => {
      const dest = getItemField(item, "shippingDestination");
      return !!dest;
    }).length;
    return { total, configured };
  }, [orderItems, localOverrides]);

  const createMutation = useCreateShipment(projectId);
  const updateMutation = useUpdateShipment(projectId);
  const deleteMutation = useDeleteShipment(projectId);

  const setField = useCallback((key: keyof ShipmentFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  // Shipping Details Mutations
  const updateItemShippingMutation = useMutation({
    mutationFn: async ({ itemId, fields }: { itemId: string; fields: Record<string, any> }) => {
      const res = await fetch(`/api/projects/${projectId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Failed to update shipping details");
      return res.json();
    },
    onMutate: async ({ itemId, fields }) => {
      await queryClient.cancelQueries({ queryKey: [`/api/projects/${projectId}/items`] });
      const previousItems = queryClient.getQueryData([`/api/projects/${projectId}/items`]);
      queryClient.setQueryData([`/api/projects/${projectId}/items`], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((item: any) =>
          item.id === itemId ? { ...item, ...fields } : item
        );
      });
      return { previousItems };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    },
    onError: (_err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData([`/api/projects/${projectId}/items`], context.previousItems);
      }
      setLocalOverrides(prev => {
        const next = { ...prev };
        for (const field of Object.keys(variables.fields)) {
          delete next[`${variables.itemId}:${field}`];
        }
        return next;
      });
      toast({ title: "Failed to update shipping details", variant: "destructive" });
    },
  });

  const handleItemShippingChange = (itemId: string, field: string, value: string) => {
    setLocalField(itemId, field, value);
    updateItemShippingMutation.mutate({ itemId, fields: { [field]: value || null } });
  };

  const handleBulkEdit = () => {
    if (selectedItems.size === 0) return;
    const fields: Record<string, any> = {};
    if (bulkForm.shippingDestination) fields.shippingDestination = bulkForm.shippingDestination;
    if (bulkForm.shippingAccountType) fields.shippingAccountType = bulkForm.shippingAccountType;
    if (bulkForm.shippingMethodOverride) fields.shippingMethodOverride = bulkForm.shippingMethodOverride;
    if (bulkForm.shippingNotes) fields.shippingNotes = bulkForm.shippingNotes;

    if (Object.keys(fields).length === 0) {
      toast({ title: "No fields to update", description: "Fill at least one field.", variant: "destructive" });
      return;
    }

    const itemIds = Array.from(selectedItems);
    setLocalOverrides(prev => {
      const next = { ...prev };
      itemIds.forEach(itemId => {
        Object.entries(fields).forEach(([field, value]) => {
          next[`${itemId}:${field}`] = value as string;
        });
      });
      return next;
    });

    const promises = Array.from(selectedItems).map(itemId =>
      updateItemShippingMutation.mutateAsync({ itemId, fields })
    );

    Promise.all(promises).then(() => {
      toast({ title: `Updated ${selectedItems.size} items` });
      setSelectedItems(new Set());
      setBulkEditOpen(false);
      setBulkForm(EMPTY_BULK);
    }).catch(() => {
      toast({ title: "Some items failed to update", variant: "destructive" });
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((i: any) => i.id)));
    }
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return "No Supplier";
    const s = suppliers.find((v: any) => v.id === supplierId);
    return s?.name || "Unknown";
  };

  // Shipment Tracking
  const openNew = useCallback(() => {
    setEditingShipment(null);
    setForm({
      ...EMPTY_FORM,
      shipToName: parsedAddress?.contactName || "",
      shipToCompany: parsedAddress?.company || "",
      shipToAddress: parsedAddress
        ? [parsedAddress.street, parsedAddress.city, parsedAddress.state, parsedAddress.zipCode].filter(Boolean).join(", ")
        : "",
      shipToPhone: parsedAddress?.phone || "",
    });
    setIsFormOpen(true);
  }, [parsedAddress]);

  const openEdit = useCallback((s: OrderShipment) => {
    setEditingShipment(s);
    setForm({
      carrier: s.carrier || "",
      shippingMethod: s.shippingMethod || "",
      trackingNumber: s.trackingNumber || "",
      shippingCost: s.shippingCost || "",
      shipDate: s.shipDate ? new Date(s.shipDate).toISOString().slice(0, 10) : "",
      estimatedDelivery: s.estimatedDelivery ? new Date(s.estimatedDelivery).toISOString().slice(0, 10) : "",
      shipToName: s.shipToName || "",
      shipToCompany: s.shipToCompany || "",
      shipToAddress: s.shipToAddress || "",
      shipToPhone: s.shipToPhone || "",
      status: s.status || "pending",
      notes: s.notes || "",
    });
    setIsFormOpen(true);
  }, []);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    const payload: Record<string, any> = {
      carrier: form.carrier || null,
      shippingMethod: form.shippingMethod || null,
      trackingNumber: form.trackingNumber || null,
      shippingCost: form.shippingCost || null,
      shipDate: form.shipDate ? new Date(form.shipDate).toISOString() : null,
      estimatedDelivery: form.estimatedDelivery ? new Date(form.estimatedDelivery).toISOString() : null,
      shipToName: form.shipToName || null,
      shipToCompany: form.shipToCompany || null,
      shipToAddress: form.shipToAddress || null,
      shipToPhone: form.shipToPhone || null,
      status: form.status,
      notes: form.notes || null,
    };

    if (editingShipment) {
      updateMutation.mutate(
        { shipmentId: editingShipment.id, data: payload },
        { onSuccess: () => setIsFormOpen(false) },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const getTrackingUrl = (carrier: string | null, tracking: string | null) => {
    if (!tracking) return null;
    const c = (carrier || "").toLowerCase();
    if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${tracking}`;
    if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
    if (c.includes("dhl")) return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${tracking}`;
    return null;
  };

  const totalShippingCost = shipments.reduce((s, sh) => s + parseFloat(sh.shippingCost || "0"), 0);
  const deliveredCount = shipments.filter(s => s.status === "delivered").length;
  const timelineConflicts = hasTimelineConflict(order, shipments);

  return {
    // Data
    order, orderItems, shipments, shipmentsLoading,
    parsedAddress, suppliers, filteredItems, shippingProgress,
    totalShippingCost, deliveredCount, timelineConflicts,

    // Shipment form state
    isFormOpen, setIsFormOpen,
    editingShipment,
    form, setField,
    deleteTarget, setDeleteTarget,
    isSaving,

    // Shipping details table state
    supplierFilter, setSupplierFilter,
    selectedItems,
    bulkEditOpen, setBulkEditOpen,
    bulkForm, setBulkForm,
    showShipmentTracking, setShowShipmentTracking,

    // Handlers
    getItemField,
    handleItemShippingChange,
    handleBulkEdit,
    toggleSelectAll,
    toggleItem,
    getSupplierName,
    openNew,
    openEdit,
    handleSave,
    getTrackingUrl,

    // Mutation state
    updateItemShippingMutation,
    deleteMutation,
  };
}
