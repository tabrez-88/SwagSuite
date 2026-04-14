export interface EmailTemplate {
  id: string;
  templateType: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  isActive: boolean;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MergeField {
  key: string;
  label: string;
}
