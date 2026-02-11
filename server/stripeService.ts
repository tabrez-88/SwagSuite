import { storage } from "./storage";
import crypto from 'crypto';

interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  publishableKey?: string;
}

interface PaymentIntentParams {
  amount: number; // in cents
  currency: string;
  orderId: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  private config: StripeConfig;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor(config: StripeConfig) {
    this.config = config;
  }

  private async request(endpoint: string, method: 'GET' | 'POST', body?: Record<string, any>) {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    let bodyString = '';
    if (body) {
      const params = new URLSearchParams();
      // Simple flattener for metadata and basic fields
      Object.entries(body).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            params.append(`${key}[${subKey}]`, String(subValue));
          });
        } else if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      bodyString = params.toString();
    }

    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method,
      headers,
      body: method === 'POST' ? bodyString : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const json = JSON.parse(errorText);
        errorMessage = json.error?.message || errorText;
      } catch (e) { }
      throw new Error(`Stripe API Error: ${errorMessage}`);
    }

    return await response.json();
  }

  async createPaymentIntent(params: PaymentIntentParams) {
    return await this.request('payment_intents', 'POST', {
      amount: params.amount,
      currency: params.currency,
      customer: params.customerId,
      'metadata[orderId]': params.orderId, // Explicitly handle metadata if generic flattener is too risky
      // or use the generic one if I trust it.
      // Let's use the explicit approach for safety in 'request' or valid body construction here.
      // Actually, passing 'metadata': { orderId: ... } to 'request' which handles 1 level nesting is better.
      metadata: params.metadata || { orderId: params.orderId }
    });
  }

  async createCustomer(email: string, name: string) {
    return await this.request('customers', 'POST', {
      email,
      name
    });
  }

  async searchCustomer(email: string) {
    console.log('searching customer: ', email);
    const response = await this.request('customers', 'GET', {
      email,
      limit: 1
    });
    return response.data?.[0] || null;
  }

  async createInvoiceItem(params: { customerId: string, amount: number, currency: string, description: string, invoiceId?: string }) {
    const payload: any = {
      customer: params.customerId,
      amount: params.amount,
      currency: params.currency,
      description: params.description
    };
    if (params.invoiceId) {
      payload.invoice = params.invoiceId;
    }
    return await this.request('invoiceitems', 'POST', payload);
  }

  async createInvoice(params: { customerId: string, collection_method: 'send_invoice', days_until_due: number, metadata?: Record<string, string>, pending_invoice_items_behavior?: 'exclude' | 'include' }) {
    const payload: any = {
      customer: params.customerId,
      collection_method: params.collection_method,
      days_until_due: params.days_until_due,
      metadata: params.metadata
    };
    if (params.pending_invoice_items_behavior) {
      payload.pending_invoice_items_behavior = params.pending_invoice_items_behavior;
    }
    return await this.request('invoices', 'POST', payload);
  }

  async finalizeInvoice(invoiceId: string) {
    return await this.request(`invoices/${invoiceId}/finalize`, 'POST');
  }

  constructEvent(payload: string | Buffer, signature: string) {
    const secret = this.config.webhookSecret;
    if (!secret) throw new Error("Webhook secret not configured");

    const header = signature; // t=timestamp,v1=signature
    const parts = header.split(',');

    let timestamp = '';
    let remoteSignature = '';

    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key === 't') timestamp = value;
      if (key === 'v1') remoteSignature = value;
    });

    if (!timestamp || !remoteSignature) throw new Error("Invalid signature header");

    const signedPayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', secret);
    const localSignature = hmac.update(signedPayload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(localSignature), Buffer.from(remoteSignature))) {
      throw new Error("Signature verification failed");
    }

    return JSON.parse(payload.toString());
  }
}

export async function getStripeCredentials(): Promise<StripeService | null> {
  const settings = await storage.getIntegrationSettings();

  const secretKey = settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  const webhookSecret = settings?.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
  const publishableKey = settings?.stripePublishableKey || process.env.STRIPE_PUBLISHABLE_KEY;

  console.log("Stripe credentials:", {
    secretKey,
    webhookSecret,
    publishableKey
  });

  if (!secretKey) return null;

  return new StripeService({
    secretKey,
    webhookSecret: webhookSecret || '',
    publishableKey
  });
}
