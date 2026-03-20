export interface Company {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
}

export interface LeadSourceReport {
  source: string;
  contacts: number;
  leads: number;
  total: number;
}
