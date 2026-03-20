export interface Product {
  id: string;
  name: string;
  number: string;
  image: string;
  category: string;
  colors: string[];
  description: string;
  source: 'ESP' | 'ASI' | 'SAGE';
}

export interface Logo {
  id: string;
  file: File;
  url: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  color?: string;
  backgroundRemoved: boolean;
}

export interface Template {
  id: string;
  name: string;
  type: 'company' | 'customer';
  header?: string;
  footer?: string;
  customerLogo?: string;
  companyLogo?: string;
  isActive: boolean;
  aiGenerated?: boolean;
  confidence?: number;
}
