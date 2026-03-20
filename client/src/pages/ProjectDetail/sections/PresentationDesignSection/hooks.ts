import { useState } from "react";
import type { useProjectData } from "../../hooks";

interface UsePresentationDesignSectionParams {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

export function usePresentationDesignSection({ orderId, data }: UsePresentationDesignSectionParams) {
  const { companyName, companyData } = data;
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [headerStyle, setHeaderStyle] = useState("banner");
  const [fontFamily, setFontFamily] = useState("default");

  const displayName = companyData?.name || companyName;

  return {
    orderId,
    displayName,
    companyData,
    companyName,
    primaryColor,
    setPrimaryColor,
    headerStyle,
    setHeaderStyle,
    fontFamily,
    setFontFamily,
  };
}
