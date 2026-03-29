export interface PresentationData {
  presentation: {
    orderNumber: string;
    companyName: string;
    companyLogo: string | null;
    introduction: string;
    primaryColor: string;
    headerStyle: string;
    fontFamily: string;
    footerText: string;
    logoUrl: string | null;
    hidePricing: boolean;
    currency: string;
  };
  items: any[];
  comments: Record<string, any[]>;
}

export const fontFamilyMap: Record<string, string> = {
  default: "system-ui, -apple-system, sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  poppins: "'Poppins', sans-serif",
  playfair: "'Playfair Display', serif",
};
