import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCreateShipment, useUpdateShipment, useDeleteShipment } from "@/services/shipments";
import { useUpdateItemShipping } from "@/services/project-items/mutations";
import { useToast } from "@/hooks/use-toast";
import { hasTimelineConflict } from "@/lib/dateUtils";
import type { OrderShipment } from "@shared/schema";
import type { ProjectData } from "@/types/project-types";
import { EMPTY_FORM, EMPTY_BULK, EMPTY_ITEM_SHIPPING } from "./types";
import type { ShipmentFormData, BulkEditData, ItemShippingFormData, ShippingAddressData } from "./types";


export function useShippingSection(projectId: string, data: ProjectData) {
  const { order, orderItems, orderVendors, shipments, shipmentsLoading, suppliers: allSuppliers } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Shipment Tracking state ──
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<OrderShipment | null>(null);
  const [form, setForm] = useState<ShipmentFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<OrderShipment | null>(null);
  const [showShipmentTracking, setShowShipmentTracking] = useState(true);

  // ── Shipping Details table state ──
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkEditData>(EMPTY_BULK);

  // ── Edit Dialog state (replaces inline auto-save) ──
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editShippingForm, setEditShippingForm] = useState<ItemShippingFormData>(EMPTY_ITEM_SHIPPING);

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

  // Shipping config progress — configured = has destination + address
  const shippingProgress = useMemo(() => {
    const total = orderItems.length;
    const configured = orderItems.filter((item: any) => {
      return item.shippingDestination && item.shipToAddress;
    }).length;
    return { total, configured };
  }, [orderItems]);

  // ── Address fetching for edit dialog ──
  const companyId = (order as any)?.companyId;
  const editingItem = editingItemId ? orderItems.find((i: any) => i.id === editingItemId) : null;

  // Fetch client company addresses (for "client" destination)
  const { data: companyAddresses = [] } = useQuery<any[]>({
    queryKey: [`/api/companies/${companyId}/addresses`],
    enabled: !!companyId && !!editingItemId,
  });

  // Fetch decorator/supplier addresses (for "decorator" or "other_supplier" destination)
  const decoratorIdForAddresses = editShippingForm.shippingDestination === "decorator"
    ? editingItem?.decoratorId
    : editShippingForm.shippingDestination === "other_supplier"
      ? editingItem?.supplierId
      : null;

  const { data: supplierAddresses = [] } = useQuery<any[]>({
    queryKey: [`/api/suppliers/${decoratorIdForAddresses}/addresses`],
    enabled: !!decoratorIdForAddresses && !!editingItemId,
  });

  // ── Mutations ──
  const createMutation = useCreateShipment(projectId);
  const updateMutation = useUpdateShipment(projectId);
  const deleteMutation = useDeleteShipment(projectId);
  const updateItemShippingMutation = useUpdateItemShipping(projectId);

  // ── Edit Dialog handlers ──
  const openEditDialog = (item: any) => {
    setEditingItemId(item.id);
    const addr = item.shipToAddress as ShippingAddressData | null;
    const leg2Addr = item.leg2Address as ShippingAddressData | null;
    setEditShippingForm({
      shippingDestination: item.shippingDestination || "",
      shippingAccountType: item.shippingAccountType || "",
      shippingMethodOverride: item.shippingMethodOverride || "",
      shippingNotes: item.shippingNotes || "",
      shipToAddressId: item.shipToAddressId || "",
      shipToAddress: addr || null,
      shipInHandsDate: item.shipInHandsDate
        ? new Date(item.shipInHandsDate).toISOString().slice(0, 10)
        : (order as any)?.inHandsDate
          ? new Date((order as any).inHandsDate).toISOString().slice(0, 10)
          : "",
      shipFirm: item.shipFirm || false,
      shippingQuote: item.shippingQuote || "",
      leg2ShipTo: item.leg2ShipTo || "client",
      leg2AddressId: item.leg2AddressId || "",
      leg2Address: leg2Addr || null,
      leg2InHandsDate: item.leg2InHandsDate ? new Date(item.leg2InHandsDate).toISOString().slice(0, 10) : "",
      leg2Firm: item.leg2Firm || false,
      leg2ShippingMethod: item.leg2ShippingMethod || "",
      leg2ShippingAccountType: item.leg2ShippingAccountType || "",
      leg2ShippingQuote: item.leg2ShippingQuote || "",
    });
  };

  const closeEditDialog = () => {
    setEditingItemId(null);
    setEditShippingForm(EMPTY_ITEM_SHIPPING);
  };

  const handleEditSave = () => {
    if (!editingItemId) return;
    const f = editShippingForm;
    const fields: Record<string, any> = {
      shippingDestination: f.shippingDestination || null,
      shippingAccountType: f.shippingAccountType || null,
      shippingMethodOverride: f.shippingMethodOverride || null,
      shippingNotes: f.shippingNotes || null,
      shipToAddressId: f.shipToAddressId || null,
      shipToAddress: f.shipToAddress || null,
      shipInHandsDate: f.shipInHandsDate ? new Date(f.shipInHandsDate).toISOString() : null,
      shipFirm: f.shipFirm,
      shippingQuote: f.shippingQuote || null,
    };
    // Leg 2 only for decorator
    if (f.shippingDestination === "decorator") {
      fields.leg2ShipTo = f.leg2ShipTo || "client";
      fields.leg2AddressId = f.leg2AddressId || null;
      fields.leg2Address = f.leg2Address || null;
      fields.leg2InHandsDate = f.leg2InHandsDate ? new Date(f.leg2InHandsDate).toISOString() : null;
      fields.leg2Firm = f.leg2Firm;
      fields.leg2ShippingMethod = f.leg2ShippingMethod || null;
      fields.leg2ShippingAccountType = f.leg2ShippingAccountType || null;
      fields.leg2ShippingQuote = f.leg2ShippingQuote || null;
    }
    updateItemShippingMutation.mutate(
      { itemId: editingItemId, fields },
      {
        onSuccess: () => {
          toast({ title: "Shipping details saved" });
          closeEditDialog();
        },
      }
    );
  };

  // Select a stored address → populate form fields
  const selectStoredAddress = (addr: any, leg: "leg1" | "leg2") => {
    const snapshot: ShippingAddressData = {
      contactName: addr.contactName || "",
      companyName: addr.companyNameOnDocs || addr.addressName || "",
      street: addr.street || "",
      street2: addr.street2 || "",
      city: addr.city || "",
      state: addr.state || "",
      zipCode: addr.zipCode || "",
      country: addr.country || "",
      email: addr.email || "",
      phone: addr.phone || "",
    };
    if (leg === "leg1") {
      setEditShippingForm(f => ({ ...f, shipToAddressId: addr.id, shipToAddress: snapshot }));
    } else {
      setEditShippingForm(f => ({ ...f, leg2AddressId: addr.id, leg2Address: snapshot }));
    }
  };

  // Auto-populate address when changing destination to "client"
  const handleDestinationChange = (destination: string) => {
    setEditShippingForm(f => {
      const updated = { ...f, shippingDestination: destination };
      // Auto-fill from order shipping address or default company address when selecting "client"
      if (destination === "client" && !f.shipToAddress?.street) {
        if (parsedAddress?.street) {
          updated.shipToAddress = {
            contactName: parsedAddress.contactName || "",
            companyName: parsedAddress.companyName || "",
            street: parsedAddress.street || "",
            street2: parsedAddress.street2 || "",
            city: parsedAddress.city || "",
            state: parsedAddress.state || "",
            zipCode: parsedAddress.zipCode || "",
            country: parsedAddress.country || "",
            email: parsedAddress.email || "",
            phone: parsedAddress.phone || "",
          };
          updated.shipToAddressId = "";
        } else if (companyAddresses.length > 0) {
          const defaultAddr = companyAddresses.find((a: any) => a.isDefault && (a.addressType === "shipping" || a.addressType === "both"))
            || companyAddresses.find((a: any) => a.addressType === "shipping" || a.addressType === "both")
            || companyAddresses[0];
          if (defaultAddr) {
            updated.shipToAddress = {
              contactName: (defaultAddr as any).contactName || "",
              companyName: (defaultAddr as any).companyNameOnDocs || (defaultAddr as any).addressName || "",
              street: (defaultAddr as any).street || "",
              street2: (defaultAddr as any).street2 || "",
              city: (defaultAddr as any).city || "",
              state: (defaultAddr as any).state || "",
              zipCode: (defaultAddr as any).zipCode || "",
              country: (defaultAddr as any).country || "",
              email: (defaultAddr as any).email || "",
              phone: (defaultAddr as any).phone || "",
            };
            updated.shipToAddressId = (defaultAddr as any).id || "";
          }
        }
      }
      return updated;
    });
  };

  // Update a free-form address field
  const updateAddressField = (leg: "leg1" | "leg2", field: keyof ShippingAddressData, value: string) => {
    if (leg === "leg1") {
      setEditShippingForm(f => ({
        ...f,
        shipToAddressId: "", // clear stored ref — now manual
        shipToAddress: { ...(f.shipToAddress || {}), [field]: value } as ShippingAddressData,
      }));
    } else {
      setEditShippingForm(f => ({
        ...f,
        leg2AddressId: "",
        leg2Address: { ...(f.leg2Address || {}), [field]: value } as ShippingAddressData,
      }));
    }
  };

  // Get readable address summary for table display
  const getAddressSummary = (addr: any): string => {
    if (!addr) return "";
    const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
    return parts.join(", ");
  };

  // ── Bulk Edit ──
  const handleBulkEdit = () => {
    if (selectedItems.size === 0) return;
    const fields: Record<string, any> = {};
    if (bulkForm.shippingDestination) fields.shippingDestination = bulkForm.shippingDestination;
    if (bulkForm.shippingAccountType) fields.shippingAccountType = bulkForm.shippingAccountType;
    if (bulkForm.shippingMethodOverride) fields.shippingMethodOverride = bulkForm.shippingMethodOverride;
    if (bulkForm.shippingNotes) fields.shippingNotes = bulkForm.shippingNotes;
    if (bulkForm.shipInHandsDate) fields.shipInHandsDate = new Date(bulkForm.shipInHandsDate).toISOString();
    if (bulkForm.shipFirm) fields.shipFirm = bulkForm.shipFirm;
    if (bulkForm.shippingQuote) fields.shippingQuote = bulkForm.shippingQuote;

    if (Object.keys(fields).length === 0) {
      toast({ title: "No fields to update", description: "Fill at least one field.", variant: "destructive" });
      return;
    }

    Promise.all(
      Array.from(selectedItems).map(itemId =>
        updateItemShippingMutation.mutateAsync({ itemId, fields })
      )
    ).then(() => {
      toast({ title: `Updated ${selectedItems.size} items` });
      setSelectedItems(new Set());
      setBulkEditOpen(false);
      setBulkForm(EMPTY_BULK);
    }).catch(() => {
      toast({ title: "Some items failed to update", variant: "destructive" });
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) setSelectedItems(new Set());
    else setSelectedItems(new Set(filteredItems.map((i: any) => i.id)));
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return "No Supplier";
    const s = allSuppliers?.find((v: any) => v.id === supplierId);
    return s?.name || "Unknown";
  };

  // ── Shipment Tracking ──
  const setField = useCallback((key: keyof ShipmentFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

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
      updateMutation.mutate({ shipmentId: editingShipment.id, data: payload }, { onSuccess: () => setIsFormOpen(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => setIsFormOpen(false) });
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

  // ── Notify Client ──
  const [notifyShipment, setNotifyShipment] = useState<any>(null);

  const getNotifyEmail = (s: any): { subject: string; body: string; mergeData: Record<string, string> } => {
    const trackUrl = getTrackingUrl(s.carrier, s.trackingNumber);
    const clientFirstName = data.primaryContact?.firstName || "there";
    const productNames = orderItems
      .map((item: any) => item.productName || item.name || item.product?.name)
      .filter(Boolean)
      .join(", ") || "your items";
    const csrName = data.assignedUser
      ? `${data.assignedUser.firstName || ""} ${data.assignedUser.lastName || ""}`.trim()
      : "";
    const orderNum = (order as any)?.orderNumber || "";

    const mergeData = {
      recipientFirstName: clientFirstName,
      companyName: (data.companyName as string) || "",
      productNames,
      carrier: s.carrier || "",
      method: s.shippingMethod || "",
      trackingNumber: s.trackingNumber || "",
      trackingUrl: trackUrl || "",
      csrName,
    };

    // Fallback defaults (used when no template is configured)
    let body = `Hi ${clientFirstName},\n\n`;
    body += `Great news: your ${productNames} order will be arriving soon!\n\n`;
    if (s.carrier) body += `Carrier: ${s.carrier}\n`;
    if (s.shippingMethod) body += `Method: ${s.shippingMethod}\n`;
    if (s.trackingNumber) body += `Tracking Number: ${s.trackingNumber}\n`;
    if (trackUrl) body += `\nTrack your shipment: ${trackUrl}\n`;
    body += `\nShipping services are sometimes inconsistent/slow in updating their tracking information. Please be patient and continue to check; it will update but may take some time.\n\n`;
    body += `PLEASE NOTE: When your items arrive please open the package(s) and check in the items to ensure that everything has been delivered and nothing has been damaged in transit.\n\n`;
    body += `If you have any questions upon receipt of your order, please be in touch with us. We love seeing our customers enjoying their swag; feel free to send photos back to kwoznak@liquidscreendesign.com to share.\n\n`;
    body += `Thank you for your business,\n`;
    if (csrName) body += `${csrName}\n`;
    body += `Liquid Screen Design`;
    return { subject: `Shipment Update — Order #${orderNum}`, body, mergeData };
  };

  const totalShippingCost = shipments.reduce((s, sh) => s + parseFloat(sh.shippingCost || "0"), 0);
  const deliveredCount = shipments.filter(s => s.status === "delivered").length;
  const timelineConflicts = hasTimelineConflict(order, shipments, orderItems);

  return {
    // Data
    order, orderItems, shipments, shipmentsLoading,
    parsedAddress, suppliers, filteredItems, shippingProgress,
    totalShippingCost, deliveredCount, timelineConflicts, allSuppliers,

    // Edit dialog
    editingItemId, editingItem, editShippingForm, setEditShippingForm,
    openEditDialog, closeEditDialog, handleEditSave,
    selectStoredAddress, updateAddressField, handleDestinationChange, getAddressSummary,
    companyAddresses, supplierAddresses,

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
    handleBulkEdit,
    toggleSelectAll,
    toggleItem,
    getSupplierName,
    openNew,
    openEdit,
    handleSave,
    getTrackingUrl,

    // Notify client
    notifyShipment, setNotifyShipment,
    getNotifyEmail,
    companyName: data.companyName,
    primaryContact: data.primaryContact,

    // Mutation state
    updateItemShippingMutation,
    deleteMutation,

    // Query client for invalidation
    queryClient,
  };
}
