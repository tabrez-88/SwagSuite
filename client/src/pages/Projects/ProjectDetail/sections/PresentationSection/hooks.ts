import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "@/lib/wouter-compat";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "@/services/projects/keys";
import {
  useUpdateProject,
  useUpdateProjectStatus,
  useSavePresentationSettings,
  useCreateShareLink,
} from "@/services/projects/mutations";
import { useProjectProductComments } from "@/services/projects/queries";
import { calcMarginPercent } from "@/lib/projectDetailUtils";
import type { EnrichedOrderItem } from "@/types/project-types";
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

  const currentStatus = order?.presentationStatus || "open";
  const statusInfo = presentationStatuses.find((s) => s.value === currentStatus) || presentationStatuses[0];

  const _updateStatus = useUpdateProjectStatus(projectId);
  const updateStatusMutation = useMemo(() => ({
    ..._updateStatus,
    mutate: (newStatus: string) => _updateStatus.mutate({ presentationStatus: newStatus }),
  }), [_updateStatus]);

  // Presentation settings from stageData (persisted)
  // stageData.presentation is an unstructured JSON blob — fields vary per project
  const presSettings = ((order?.stageData as Record<string, unknown> | null)?.presentation || {}) as Record<string, string | boolean | string[] | Record<string, boolean>>;

  // Cast individual fields to expected types for useState inference
  const pres = {
    introduction: (presSettings.introduction || "") as string,
    hidePricing: (presSettings.hidePricing || false) as boolean,
    clientContactId: (presSettings.clientContactId || "") as string,
    expiryDate: (presSettings.expiryDate || "") as string,
    currency: (presSettings.currency || "USD") as string,
    presentationDate: (presSettings.presentationDate || "") as string,
    primaryColor: (presSettings.primaryColor || "#1c6ea4") as string,
    headerStyle: (presSettings.headerStyle || "banner") as string,
    fontFamily: (presSettings.fontFamily || "default") as string,
    footerText: (presSettings.footerText || "") as string,
    itemVisibility: (presSettings.itemVisibility || {}) as Record<string, boolean>,
    itemOrder: (presSettings.itemOrder || []) as string[],
  };

  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [introduction, setIntroduction] = useState(pres.introduction);
  const [hidePricing, setHidePricing] = useState(pres.hidePricing);
  const [conversionTarget, setConversionTarget] = useState<"quote" | "sales_order" | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [selectedContact, setSelectedContact] = useState(pres.clientContactId || primaryContact?.id || "");
  const [editingItem, setEditingItem] = useState<EnrichedOrderItem | null>(null);
  const [previewItem, setPreviewItem] = useState<EnrichedOrderItem | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [expiryDate, setExpiryDate] = useState(pres.expiryDate);
  const [currency, setCurrency] = useState(pres.currency);
  const [presentationDate, setPresentationDate] = useState(pres.presentationDate || (order?.createdAt ? format(new Date(order.createdAt), "yyyy-MM-dd") : ""));

  // Design tab state (persisted)
  const [primaryColor, setPrimaryColor] = useState(pres.primaryColor);
  const [headerStyle, setHeaderStyle] = useState(pres.headerStyle);
  const [fontFamily, setFontFamily] = useState(pres.fontFamily);
  const [footerText, setFooterText] = useState(pres.footerText);

  // Save presentation settings to stageData
  const _saveSettings = useSavePresentationSettings(projectId);
  const saveSettingsMutation = useMemo(() => ({
    ..._saveSettings,
    mutate: (updates: Record<string, unknown>, opts?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      const currentStageData = (order?.stageData || {}) as Record<string, unknown>;
      const currentPresentation = (currentStageData.presentation || {}) as Record<string, unknown>;
      _saveSettings.mutate(
        { stageData: { ...currentStageData, presentation: { ...currentPresentation, ...updates } } },
        opts,
      );
    },
  }), [_saveSettings, order]);

  // Helper to save a single field
  const saveSetting = (key: string, value: unknown) => saveSettingsMutation.mutate({ [key]: value });

  // Share link
  const [shareLink, setShareLink] = useState<string | null>(null);
  const _shareLink = useCreateShareLink(projectId);
  const shareLinkMutation = useMemo(() => ({
    ..._shareLink,
    mutate: () => _shareLink.mutate(undefined, {
      onSuccess: (data: { url: string }) => {
        const url = data.url;
        setShareLink(url);
        window.open(url, "_blank", "noopener,noreferrer");
      },
    }),
  }), [_shareLink, toast]);

  // Product visibility & ordering
  const [showHidden, setShowHidden] = useState(false);
  const itemVisibility = pres.itemVisibility;
  const itemOrder = pres.itemOrder;

  const toggleItemVisibility = (itemId: string) => {
    const updated = { ...itemVisibility, [itemId]: !(itemVisibility[itemId] !== false) };
    saveSetting("itemVisibility", updated);
  };

  const moveItem = (itemId: string, direction: "up" | "down") => {
    const currentOrder = itemOrder.length > 0 ? [...itemOrder] : orderItems.map((i) => i.id);
    const idx = currentOrder.indexOf(itemId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentOrder.length) return;
    [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]];
    saveSetting("itemOrder", currentOrder);
  };

  // Enrich order items with product data, apply ordering & visibility
  const enrichedItems = useMemo(() => {
    const items = orderItems.map((item) => {
      const product = allProducts.find((p) => p.id === item.productId);
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
      items.sort((a, b) => {
        const aIdx = itemOrder.indexOf(a.id);
        const bIdx = itemOrder.indexOf(b.id);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
    }

    return items;
  }, [orderItems, allProducts, allItemLines, allItemCharges, itemVisibility, itemOrder]);

  const visibleItems = useMemo(() => enrichedItems.filter((i) => i.isVisible), [enrichedItems]);
  const displayItems = showHidden ? enrichedItems : visibleItems;
  const hiddenCount = enrichedItems.length - visibleItems.length;

  // Product comments
  const { data: productComments = {} } = useProjectProductComments(projectId);

  const contactEmail = contacts?.find((c) => c.id === selectedContact)?.email || primaryContact?.email || "";

  const updateProjectMutation = useUpdateProject(projectId);
  const handleInHandsDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== (order?.inHandsDate ? format(new Date(order.inHandsDate), "yyyy-MM-dd") : "")) {
      updateProjectMutation.mutate({ inHandsDate: e.target.value || null });
    }
  };

  const handleConversionSuccess = () => {
    setConversionTarget(null);
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) });
  };

  const recipientName = contacts?.find((c) => c.id === selectedContact)
    ? `${contacts.find((c) => c.id === selectedContact)?.firstName} ${contacts.find((c) => c.id === selectedContact)?.lastName}`
    : companyName;

  const formattedContacts = (contacts || []).map((c) => ({
    id: String(c.id),
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    email: c.email ?? null,
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
