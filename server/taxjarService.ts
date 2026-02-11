import { storage } from "./storage";

interface TaxJarConfig {
  apiKey: string;
}

interface TaxParams {
  from_country: string;
  from_zip: string;
  from_state: string;
  from_city?: string;
  from_street?: string;
  to_country: string;
  to_zip: string;
  to_state: string;
  to_city?: string;
  to_street?: string;
  amount: number;
  shipping: number;
  line_items?: TaxLineItem[];
}

interface TaxLineItem {
  id: string;
  quantity: number;
  product_tax_code?: string;
  unit_price: number;
  discount: number;
}

interface TaxResponse {
  tax: {
    amount_to_collect: number;
    rate: number;
    has_nexus: boolean;
    freight_taxable: boolean;
    tax_source: string;
    breakdown?: any;
  };
}

export class TaxJarService {
  private config: TaxJarConfig;
  private baseUrl = 'https://api.taxjar.com/v2';

  constructor(config: TaxJarConfig) {
    this.config = config;
  }

  private async request(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`TaxJar API Error: ${error.detail || error.error || response.statusText}`);
    }

    return await response.json();
  }

  async calculateTax(params: TaxParams): Promise<TaxResponse['tax']> {
    const data = await this.request('taxes', 'POST', params);
    return data.tax;
  }

  async validateAddress(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }): Promise<boolean> {
    try {
        const data = await this.request('addresses/validate', 'POST', address);
        return true; // Simplified validation check
    } catch (e) {
        return false;
    }
  }
}

export async function getTaxJarCredentials(): Promise<TaxJarService | null> {
  const settings = await storage.getIntegrationSettings();
  const apiKey = settings?.taxjarApiKey || process.env.TAXJAR_API_KEY;

  if (!apiKey) return null;

  return new TaxJarService({ apiKey });
}
