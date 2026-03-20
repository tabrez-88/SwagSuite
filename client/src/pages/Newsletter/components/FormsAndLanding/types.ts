export interface SignupForm {
  id: string;
  name: string;
  title: string;
  description: string;
  isActive: boolean;
  conversions: number;
  views: number;
  conversionRate: number;
  embedCode: string;
  createdAt: Date;
}

export interface LandingPage {
  id: string;
  name: string;
  title: string;
  description: string;
  isPublished: boolean;
  views: number;
  conversions: number;
  conversionRate: number;
  url: string;
  createdAt: Date;
}
