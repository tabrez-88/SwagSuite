import { storage } from "./storage";
import { InsertOrder, Order } from "@shared/schema";

interface QuickBooksConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    environment: 'sandbox' | 'production';
    realmId?: string;
    accessToken?: string;
    refreshToken?: string;
}

interface QBTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
}

interface QBCustomer {
    Id?: string;
    DisplayName: string;
    PrimaryEmailAddr?: { Address: string };
    BillAddr?: QBAddress;
    ShipAddr?: QBAddress;
}

interface QBAddress {
    Line1: string;
    City?: string;
    CountrySubDivisionCode?: string; // State
    PostalCode?: string;
    Country?: string;
}

interface QBInvoice {
    CustomerRef: { value: string };
    Line: QBInvoiceLine[];
}

interface QBInvoiceLine {
    DetailType: 'SalesItemLineDetail';
    Amount: number;
    SalesItemLineDetail: {
        ItemRef?: { value: string; name?: string }; // '1' is usually 'Services' or generic item
        Qty?: number;
        UnitPrice?: number;
    };
}

export class QuickBooksService {
    private config: QuickBooksConfig;
    private baseUrl: string;

    constructor(config: QuickBooksConfig) {
        this.config = config;
        this.baseUrl = config.environment === 'production'
            ? 'https://quickbooks.api.intuit.com'
            : 'https://sandbox-quickbooks.api.intuit.com';
    }

    // --- Auth Flow ---

    getAuthUri(): string {
        const scopes = ['com.intuit.quickbooks.accounting'];
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            response_type: 'code',
            scope: scopes.join(' '),
            redirect_uri: this.config.redirectUri,
            state: 'security_token_or_random_state'
        });
        return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
    }

    async exchangeCodeForToken(code: string): Promise<QBTokenResponse> {
        const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

        const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.config.redirectUri
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to exchange token: ${await response.text()}`);
        }

        return await response.json();
    }

    async refreshToken(): Promise<QBTokenResponse> {
        if (!this.config.refreshToken) throw new Error("No refresh token available");

        const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

        const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.config.refreshToken
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to refresh token: ${await response.text()}`);
        }

        const tokens: QBTokenResponse = await response.json();

        // Update storage
        await storage.updateIntegrationSettings({
            qbAccessToken: tokens.access_token,
            qbRefreshToken: tokens.refresh_token
        });

        return tokens;
    }

    // --- API Methods ---

    private async request(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
        if (!this.config.accessToken || !this.config.realmId) {
            throw new Error("QuickBooks not connected");
        }

        const url = `${this.baseUrl}/v3/company/${this.config.realmId}/${endpoint}`;

        const makeRequest = async (token: string) => {
            return fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined
            });
        };

        let response = await makeRequest(this.config.accessToken);

        if (response.status === 401) {
            console.log("QB Access Token expired, refreshing...");
            const tokens = await this.refreshToken();
            response = await makeRequest(tokens.access_token);
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`QB API Error (${response.status}): ${errorText}`);
        }

        return await response.json();
    }

    async getCustomer(displayName: string): Promise<QBCustomer | null> {
        // QuickBooks API doesn't support querying nested properties like PrimaryEmailAddr.Address
        // Use DisplayName instead and escape single quotes
        const escapedName = displayName.replace(/'/g, "\\'");
        const query = `select * from Customer where DisplayName = '${escapedName}'`;
        const data = await this.request(`query?query=${encodeURIComponent(query)}`);
        return data.QueryResponse?.Customer?.[0] || null;
    }

    async createCustomer(customer: QBCustomer): Promise<QBCustomer> {
        const data = await this.request('customer', 'POST', customer);
        return data.Customer;
    }

    async createInvoice(invoice: QBInvoice): Promise<any> {
        const data = await this.request('invoice', 'POST', invoice);
        return data.Invoice;
    }

    // --- High Level Workflows ---

    async syncOrderToInvoice(orderId: string): Promise<string> {
        const order = await storage.getOrder(orderId);
        if (!order) throw new Error("Order not found");

        if (!order.companyId) throw new Error("Order has no company assigned");

        // 1. Resolve Customer (Company)
        const company = await storage.getCompany(order.companyId);
        if (!company) throw new Error("Company not found");

        let qbCustomerId = company.qbCustomerId;

        if (!qbCustomerId) {
            // Check if exists in QB by company name (DisplayName)
            const existingQbCustomer = await this.getCustomer(company.name);
            if (existingQbCustomer?.Id) {
                qbCustomerId = existingQbCustomer.Id;
            } else {
                // Create new customer in QuickBooks
                const email = company.email || `${company.name.replace(/\s+/g, '.')}@example.com`;
                const newQbCustomer = await this.createCustomer({
                    DisplayName: company.name,
                    PrimaryEmailAddr: { Address: email },
                    BillAddr: company.address ? {
                        Line1: company.address,
                        City: 'Unknown', // Parsing address is hard without structured data
                        Country: 'USA'
                    } : undefined
                });
                qbCustomerId = newQbCustomer.Id;
            }

            // Save mapping
            await storage.updateCompany(company.id, { qbCustomerId: qbCustomerId || null });
        }

        if (!qbCustomerId) throw new Error("Failed to resolve QB Customer ID");

        // 2. Build Invoice
        const lines: QBInvoiceLine[] = [];
        const items = await storage.getOrderItems(orderId);

        for (const item of items) {
            lines.push({
                DetailType: 'SalesItemLineDetail',
                Amount: Number(item.totalPrice),
                SalesItemLineDetail: {
                    ItemRef: { value: '1', name: 'Services' },
                    Qty: Number(item.quantity),
                    UnitPrice: Number(item.unitPrice)
                }
            });
        }

        const invoicePayload: QBInvoice = {
            CustomerRef: { value: qbCustomerId },
            Line: lines
        };

        // 3. Send to QB
        const invoice = await this.createInvoice(invoicePayload);

        // 4. Update Order
        await storage.updateOrder(orderId, { qbInvoiceId: invoice.Id });

        return invoice.Id;
    }

    async markInvoiceAsPaid(qbInvoiceId: string, amount: number): Promise<any> {
        // Create a Payment in QuickBooks
        const paymentPayload = {
            TotalAmt: amount,
            CustomerRef: { value: "1" }, // Will be updated with actual customer
            Line: [{
                Amount: amount,
                LinkedTxn: [{
                    TxnId: qbInvoiceId,
                    TxnType: "Invoice"
                }]
            }]
        };

        const payment = await this.request('payment', 'POST', paymentPayload);
        return payment.Payment;
    }
}

export async function getQuickBooksCredentials(): Promise<QuickBooksService | null> {
    const settings = await storage.getIntegrationSettings();
    if (!settings) return null;

    // In a real app, clientID/secret should probably come from env vars for security, 
    // but reading from settings if they are stored there (user input) is also valid for some SaaS models.
    const clientId = settings.qbClientId || process.env.QB_CLIENT_ID || '';
    const clientSecret = settings.qbClientSecret || process.env.QB_CLIENT_SECRET || '';
    const redirectUri = process.env.QB_REDIRECT_URI || 'http://localhost:5000/api/integrations/quickbooks/callback';
    const environment = (process.env.QB_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    if (!clientId || !clientSecret) return null;

    return new QuickBooksService({
        clientId,
        clientSecret,
        redirectUri,
        environment,
        realmId: settings.qbRealmId || undefined,
        accessToken: settings.qbAccessToken || undefined,
        refreshToken: settings.qbRefreshToken || undefined
    });
}
