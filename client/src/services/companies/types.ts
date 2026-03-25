export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  notes?: string;
  ytdSpend?: string;
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
}
