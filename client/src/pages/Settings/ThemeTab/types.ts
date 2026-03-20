export interface BrandingSettings {
  logoUrl?: string;
  logoSize?: string;
  logoPosition?: string;
  faviconUrl?: string;
  companyName?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  sidebarBackgroundColor?: string;
  sidebarTextColor?: string;
  sidebarBorderColor?: string;
  navHoverColor?: string;
  navActiveColor?: string;
  navTextColor?: string;
  navTextActiveColor?: string;
  borderColor?: string;
}

export interface ThemeState {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  sidebarBackgroundColor: string;
  sidebarTextColor: string;
  sidebarBorderColor: string;
  navHoverColor: string;
  navActiveColor: string;
  navTextColor: string;
  navTextActiveColor: string;
  borderColor: string;
}
