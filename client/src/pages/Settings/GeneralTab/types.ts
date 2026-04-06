export interface GeneralTabProps {
  adminSettings: any;
}

export interface GeneralSettings {
  companyName: string;
  companyLogo: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  defaultMargin: string;
  minimumMargin: string;
  maxOrderValue: string;
  requireApprovalOver: string;
  orderNumberPrefix: string;
  orderNumberDigits: string;
}

export interface BrandingSettings {
  logoUrl?: string;
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  sidebarBackgroundColor?: string;
  sidebarTextColor?: string;
  sidebarBorderColor?: string;
  navHoverColor?: string;
  navActiveColor?: string;
  navTextColor?: string;
  navTextActiveColor?: string;
  borderColor?: string;
  logoSize?: string;
  logoPosition?: string;
  faviconUrl?: string;
  tagline?: string;
  borderRadius?: string;
  fontFamily?: string;
}
