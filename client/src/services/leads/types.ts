export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  source: string;
  status: string;
  score?: number;
  estimatedValue?: number;
  notes?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
