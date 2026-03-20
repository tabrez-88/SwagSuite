import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import type { PresentationPreviewPageProps, EnrichedItem } from "./types";

const fontFamilyMap: Record<string, string> = {
  default: "system-ui, -apple-system, sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  poppins: "'Poppins', sans-serif",
  playfair: "'Playfair Display', serif",
};

export function usePresentationPreviewPage({ orderId, data }: PresentationPreviewPageProps) {
  const [, setLocation] = useLocation();
  const { order, orderItems, companyName, companyData, allProducts, allItemLines, allItemCharges } = data;
  const [selectedProduct, setSelectedProduct] = useState<EnrichedItem | null>(null);

  // Get design settings from stageData
  const presSettings = (order as any)?.stageData?.presentation || {};
  const primaryColor = presSettings.primaryColor || "#2563eb";
  const headerStyle = presSettings.headerStyle || "banner";
  const fontFamily = presSettings.fontFamily || "default";
  const footerText = presSettings.footerText || "";
  const logoUrl = presSettings.logoUrl || null;
  const hidePricing = presSettings.hidePricing || false;
  const introduction = presSettings.introduction || "";
  const itemVisibility = presSettings.itemVisibility || {};
  const itemOrder: string[] = presSettings.itemOrder || [];
  const font = fontFamilyMap[fontFamily] || fontFamilyMap.default;

  const enrichedItems = useMemo(() => {
    const items = orderItems
      .filter((item: any) => itemVisibility[item.id] !== false)
      .map((item: any) => {
        const product = allProducts.find((p: any) => p.id === item.productId);
        const lines = allItemLines?.[item.id] || [];
        const charges = (allItemCharges?.[item.id] || []).filter((c: any) => c.displayToClient !== false);
        return {
          ...item,
          imageUrl: item.productImageUrl || product?.imageUrl || null,
          colors: item.productColors || product?.colors || [],
          sizes: item.productSizes || product?.sizes || [],
          brand: item.productBrand || product?.brand || null,
          description: item.productDescription || product?.description || null,
          lines,
          charges,
        };
      });

    if (itemOrder.length > 0) {
      items.sort((a: any, b: any) => {
        const aIdx = itemOrder.indexOf(a.id);
        const bIdx = itemOrder.indexOf(b.id);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
    }

    return items as EnrichedItem[];
  }, [orderItems, allProducts, allItemLines, allItemCharges, itemVisibility, itemOrder]);

  const handleBackToEditor = useCallback(() => {
    setLocation(`/project/${orderId}/presentation`);
  }, [setLocation, orderId]);

  const handleCloseProduct = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  return {
    order,
    companyName,
    enrichedItems,
    selectedProduct,
    setSelectedProduct,
    primaryColor,
    headerStyle,
    font,
    footerText,
    logoUrl,
    hidePricing,
    introduction,
    handleBackToEditor,
    handleCloseProduct,
  };
}
