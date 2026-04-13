import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "@/services/projects/keys";
import { useUpdateProjectStatus, useSavePresentationSettings, useCreateShareLink } from "@/services/projects/mutations";
import { calcMarginPercent } from "@/lib/projectDetailUtils";
import type { PresentationSectionProps, ViewMode } from "./types";

export const presentationStatuses = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-800" },
  { value: "client_review", label: "Client Review", color: "bg-purple-100 text-purple-800" },
  { value: "converted", label: "Converted", color: "bg-green-100 text-green-800" },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
];

export const calcMargin = (cost: number, price: number) => calcMarginPercent(cost, price);

export const marginColor = (m: number) =>
  m >= 30 ? "text-green-600" : m >= 15 ? "text-yellow-600" : "text-red-600";

export function usePresentationSection({ projectId, data }: PresentationSectionProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { order, orderItems, companyName, companyData, primaryContact, contacts, allProducts, allItemLines, allItemCharges } = data;

  const currentStatus = (order as any)?.presentationStatus || "open";
  const statusInfo = presentationStatuses.find((s) => s.value === currentStatus) || presentationStatuses[0];

  const _updateStatus = useUpdateProjectStatus(projectId);
  const updateStatusMutation = useMemo(() => ({
    ..._updateStatus,
    mutate: (newStatus: string) => _updateStatus.mutate({ presentationStatus: newStatus }),
  }), [_updateStatus]);

  // Presentation settings from stageData (persisted)
  const presSettings = (order as any)?.stageData?.presentation || {};

  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [introduction, setIntroduction] = useState(presSettings.introduction || "");
  const [hidePricing, setHidePricing] = useState(presSettings.hidePricing || false);
  const [conversionTarget, setConversionTarget] = useState<"quote" | "sales_order" | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [selectedContact, setSelectedContact] = useState(presSettings.clientContactId || primaryContact?.id || "");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [expiryDate, setExpiryDate] = useState(presSettings.expiryDate || "");
  const [currency, setCurrency] = useState(presSettings.currency || "USD");
  const [presentationDate, setPresentationDate] = useState(presSettings.presentationDate || (order?.createdAt ? format(new Date(order.createdAt), "yyyy-MM-dd") : ""));

  // Design tab state (persisted)
  const [primaryColor, setPrimaryColor] = useState(presSettings.primaryColor || "#1c6ea4");
  const [headerStyle, setHeaderStyle] = useState(presSettings.headerStyle || "banner");
  const [fontFamily, setFontFamily] = useState(presSettings.fontFamily || "default");
  const [footerText, setFooterText] = useState(presSettings.footerText || "");

  // Save presentation settings to stageData
  const _saveSettings = useSavePresentationSettings(projectId);
  const saveSettingsMutation = useMemo(() => ({
    ..._saveSettings,
    mutate: (updates: Record<string, any>, opts?: any) => {
      const currentStageData = (order as any)?.stageData || {};
      const currentPresentation = currentStageData.presentation || {};
      _saveSettings.mutate(
        { stageData: { ...currentStageData, presentation: { ...currentPresentation, ...updates } } },
        opts,
      );
    },
  }), [_saveSettings, order]);

  // Helper to save a single field
  const saveSetting = (key: string, value: any) => saveSettingsMutation.mutate({ [key]: value });

  // Share link
  const [shareLink, setShareLink] = useState<string | null>(null);
  const _shareLink = useCreateShareLink(projectId);
  const shareLinkMutation = useMemo(() => ({
    ..._shareLink,
    mutate: () => _shareLink.mutate(undefined, {
      onSuccess: (data: any) => {
        const url = data.url;
        setShareLink(url);
        navigator.clipboard.writeText(url).then(() => {
          toast({ title: "Link copied!", description: data.existingToken ? "Existing link copied to clipboard." : "New presentation link created and copied." });
        });
      },
    }),
  }), [_shareLink, toast]);

  // Product visibility & ordering
  const [showHidden, setShowHidden] = useState(false);
  const itemVisibility: Record<string, boolean> = presSettings.itemVisibility || {};
  const itemOrder: string[] = presSettings.itemOrder || [];

  const toggleItemVisibility = (itemId: string) => {
    const updated = { ...itemVisibility, [itemId]: !(itemVisibility[itemId] !== false) };
    saveSetting("itemVisibility", updated);
  };

  const moveItem = (itemId: string, direction: "up" | "down") => {
    const currentOrder = itemOrder.length > 0 ? [...itemOrder] : orderItems.map((i: any) => i.id);
    const idx = currentOrder.indexOf(itemId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentOrder.length) return;
    [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]];
    saveSetting("itemOrder", currentOrder);
  };

  // Enrich order items with product data, apply ordering & visibility
  const enrichedItems = useMemo(() => {
    const items = orderItems.map((item: any) => {
      const product = allProducts.find((p: any) => p.id === item.productId);
      const lines = allItemLines?.[item.id] || [];
      const charges = allItemCharges?.[item.id] || [];
      const isVisible = itemVisibility[item.id] !== false;
      return {
        ...item,
        imageUrl: item.productImageUrl || product?.imageUrl || null,
        colors: item.productColors || product?.colors || [],
        sizes: item.productSizes || product?.sizes || [],
        brand: item.productBrand || product?.brand || null,
        description: item.productDescription || product?.description || null,
        productImprintMethods: product?.imprintMethods || null,
        productSupplierId: product?.supplierId || item.supplierId || null,
        lines,
        charges,
        isVisible,
      };
    });

    // Apply custom ordering
    if (itemOrder.length > 0) {
      items.sort((a: any, b: any) => {
        const aIdx = itemOrder.indexOf(a.id);
        const bIdx = itemOrder.indexOf(b.id);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
    }

    return items;
  }, [orderItems, allProducts, allItemLines, allItemCharges, itemVisibility, itemOrder]);

  const visibleItems = useMemo(() => enrichedItems.filter((i: any) => i.isVisible), [enrichedItems]);
  const displayItems = showHidden ? enrichedItems : visibleItems;
  const hiddenCount = enrichedItems.length - visibleItems.length;

  // Product comments
  const { data: productComments = {} } = useQuery<Record<string, any[]>>({
    queryKey: projectKeys.productComments(projectId),
    enabled: !!projectId,
  });

  const contactEmail = contacts?.find((c: any) => c.id === selectedContact)?.email || primaryContact?.email || "";

  const handleInHandsDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== (order?.inHandsDate ? format(new Date(order.inHandsDate), "yyyy-MM-dd") : "")) {
      apiRequest("PATCH", `/api/projects/${projectId}`, { inHandsDate: e.target.value || null })
        .then(() => queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }));
    }
  };

  const handleConversionSuccess = () => {
    setConversionTarget(null);
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) });
  };

  const recipientName = contacts?.find((c: any) => c.id === selectedContact)
    ? `${contacts.find((c: any) => c.id === selectedContact)?.firstName} ${contacts.find((c: any) => c.id === selectedContact)?.lastName}`
    : companyName;

  const formattedContacts = (contacts || []).map((c: any) => ({
    id: String(c.id),
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    email: c.email,
    isPrimary: c.isPrimary,
    title: c.title,
    receiveOrderEmails: c.receiveOrderEmails,
  }));

  return {
    // Data
    order,
    orderItems,
    companyName,
    companyData,
    primaryContact,
    contacts,
    data,
    currentStatus,
    statusInfo,
    enrichedItems,
    visibleItems,
    displayItems,
    hiddenCount,
    productComments,
    contactEmail,
    recipientName,
    formattedContacts,

    // State
    isInfoCollapsed,
    setIsInfoCollapsed,
    introduction,
    setIntroduction,
    hidePricing,
    setHidePricing,
    conversionTarget,
    setConversionTarget,
    viewMode,
    setViewMode,
    selectedContact,
    setSelectedContact,
    editingItem,
    setEditingItem,
    previewItem,
    setPreviewItem,
    showSendDialog,
    setShowSendDialog,
    expiryDate,
    setExpiryDate,
    currency,
    setCurrency,
    presentationDate,
    setPresentationDate,
    primaryColor,
    setPrimaryColor,
    headerStyle,
    setHeaderStyle,
    fontFamily,
    setFontFamily,
    footerText,
    setFooterText,
    shareLink,
    showHidden,
    setShowHidden,

    // Mutations
    updateStatusMutation,
    saveSettingsMutation,
    shareLinkMutation,

    // Handlers
    saveSetting,
    toggleItemVisibility,
    moveItem,
    handleInHandsDateBlur,
    handleConversionSuccess,
    setLocation,
  };
}
