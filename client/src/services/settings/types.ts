export interface BrandingSettings {
  id?: string;
  companyName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  [key: string]: any;
}

export interface GeneralSettings {
  [key: string]: any;
}
