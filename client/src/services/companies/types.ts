export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  notes?: string;
  ytdSpend?: string;
  taxExempt?: boolean;
  defaultTaxCodeId?: string;
  accountNumber?: string;
  assignedUserId?: string;
  defaultTerms?: string;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  } | null;
  socialMediaLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    other?: string;
  };
  customerScore?: number;
  engagementLevel?: string;
  createdAt?: string;
  updatedAt?: string;
  socialMediaPosts?: Array<{
    platform: string;
    content: string;
    timestamp: string;
    url: string;
    isExcitingNews: boolean;
  }>;
  lastSocialMediaSync?: string;
  customFields?: Record<string, string>;
  addresses?: any[];
}
