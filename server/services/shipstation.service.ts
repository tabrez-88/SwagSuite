/**
 * ShipStation Integration Service
 *
 * Handles communication with ShipStation REST API v2 for:
 * - Order creation/sync
 * - Shipment tracking retrieval
 * - Webhook event processing
 *
 * ShipStation API: https://www.shipstation.com/docs/api/
 * Auth: Basic auth with API Key:API Secret
 */

import { integrationRepository } from "../repositories/integration.repository";

const SHIPSTATION_BASE_URL = "https://ssapi.shipstation.com";

export interface ShipStationConfig {
  apiKey: string;
  apiSecret: string;
}

export interface ShipStationOrder {
  orderId?: number;
  orderNumber: string;
  orderKey?: string;
  orderDate: string;
  orderStatus: string;
  customerEmail?: string;
  billTo: ShipStationAddress;
  shipTo: ShipStationAddress;
  items: ShipStationOrderItem[];
  amountPaid?: number;
  shippingAmount?: number;
  customerNotes?: string;
  internalNotes?: string;
  requestedShippingService?: string;
  shipDate?: string;
}

export interface ShipStationAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface ShipStationOrderItem {
  lineItemKey?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  imageUrl?: string;
}

export interface ShipStationShipment {
  shipmentId: number;
  orderId: number;
  orderNumber: string;
  trackingNumber: string;
  carrierCode: string;
  serviceCode?: string;
  shipDate: string;
  deliveryDate?: string;
  shipmentCost: number;
  voided: boolean;
  batchNumber?: string;
}

export interface ShipStationWebhookPayload {
  resource_url: string;
  resource_type: "SHIP_NOTIFY" | "ITEM_SHIP_NOTIFY" | "ORDER_NOTIFY" | "ITEM_ORDER_NOTIFY";
}

export interface ShipStationCarrier {
  name: string;
  code: string;
  accountNumber?: string;
  shippingProviderId?: number;
}

export class ShipStationService {
  private config: ShipStationConfig;

  constructor(config: ShipStationConfig) {
    this.config = config;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString("base64");
    return `Basic ${credentials}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${SHIPSTATION_BASE_URL}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ShipStation API error (${response.status}): ${errorText}`);
    }

    // Some endpoints return empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  // ── Connection Test ──

  async testConnection(): Promise<boolean> {
    try {
      await this.request<any>("GET", "/carriers");
      return true;
    } catch (error) {
      console.error("ShipStation connection test failed:", error);
      return false;
    }
  }

  // ── Carriers ──

  async getCarriers(): Promise<ShipStationCarrier[]> {
    return this.request<ShipStationCarrier[]>("GET", "/carriers");
  }

  // ── Orders ──

  async createOrUpdateOrder(order: ShipStationOrder): Promise<ShipStationOrder> {
    return this.request<ShipStationOrder>("POST", "/orders/createorder", order);
  }

  async getOrder(orderId: number): Promise<ShipStationOrder> {
    return this.request<ShipStationOrder>("GET", `/orders/${orderId}`);
  }

  async listOrders(params?: {
    orderNumber?: string;
    orderStatus?: string;
    pageSize?: number;
    page?: number;
  }): Promise<{ orders: ShipStationOrder[]; total: number; page: number; pages: number }> {
    const query = new URLSearchParams();
    if (params?.orderNumber) query.set("orderNumber", params.orderNumber);
    if (params?.orderStatus) query.set("orderStatus", params.orderStatus);
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.page) query.set("page", String(params.page));

    const queryStr = query.toString();
    return this.request("GET", `/orders?${queryStr}`);
  }

  // ── Shipments ──

  async getShipments(params?: {
    orderId?: number;
    orderNumber?: string;
    trackingNumber?: string;
    pageSize?: number;
    page?: number;
  }): Promise<{ shipments: ShipStationShipment[]; total: number; page: number; pages: number }> {
    const query = new URLSearchParams();
    if (params?.orderId) query.set("orderId", String(params.orderId));
    if (params?.orderNumber) query.set("orderNumber", params.orderNumber);
    if (params?.trackingNumber) query.set("trackingNumber", params.trackingNumber);
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.page) query.set("page", String(params.page));

    const queryStr = query.toString();
    return this.request("GET", `/shipments?${queryStr}`);
  }

  // ── Tracking ──

  async getTrackingInfo(carrier: string, trackingNumber: string): Promise<any> {
    // ShipStation doesn't have a direct tracking API - tracking is part of shipment data.
    // For real-time tracking, we'd use the carrier APIs directly or a service like AfterShip.
    // Here we pull shipment data which includes tracking status from ShipStation.
    const result = await this.getShipments({ trackingNumber });
    return result.shipments?.[0] || null;
  }

  // ── Webhook Processing ──

  async fetchWebhookResource<T>(resourceUrl: string): Promise<T> {
    // ShipStation webhooks send a resource_url that you fetch to get the actual data
    const response = await fetch(resourceUrl, {
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch webhook resource (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  // ── Webhooks Management ──

  async listWebhooks(): Promise<any[]> {
    return this.request<any[]>("GET", "/webhooks");
  }

  async subscribeWebhook(params: {
    target_url: string;
    event: "SHIP_NOTIFY" | "ITEM_SHIP_NOTIFY" | "ORDER_NOTIFY" | "ITEM_ORDER_NOTIFY";
    store_id?: number;
    friendly_name?: string;
  }): Promise<{ id: number }> {
    return this.request<{ id: number }>("POST", "/webhooks/subscribe", params);
  }

  async unsubscribeWebhook(webhookId: number): Promise<void> {
    await this.request<void>("DELETE", `/webhooks/${webhookId}`);
  }

  // ── Mapping Helpers ──

  /**
   * Map a SwagSuite order to ShipStation order format
   */
  static mapToShipStationOrder(
    order: any,
    items: any[],
    shipToAddress: any
  ): ShipStationOrder {
    return {
      orderNumber: order.orderNumber,
      orderKey: `swag_${order.id}`,
      orderDate: new Date(order.createdAt).toISOString(),
      orderStatus: "awaiting_shipment",
      customerEmail: order.contactEmail || undefined,
      billTo: ShipStationService.mapAddress(
        order.billingAddress ? JSON.parse(order.billingAddress) : shipToAddress
      ),
      shipTo: ShipStationService.mapAddress(shipToAddress),
      items: items.map((item) => ({
        lineItemKey: item.id,
        sku: item.sku || undefined,
        name: item.productName || item.description || "Product",
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : undefined,
        imageUrl: item.productImageUrl || undefined,
      })),
      amountPaid: order.total ? parseFloat(order.total) : undefined,
      shippingAmount: order.shipping ? parseFloat(order.shipping) : undefined,
      internalNotes: order.internalNotes || undefined,
      shipDate: order.supplierInHandsDate
        ? new Date(order.supplierInHandsDate).toISOString()
        : undefined,
    };
  }

  static mapAddress(addr: any): ShipStationAddress {
    if (!addr) {
      return {
        name: "",
        street1: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
      };
    }

    return {
      name: addr.contactName || addr.name || "",
      company: addr.companyName || addr.company || undefined,
      street1: addr.street || addr.street1 || addr.line1 || "",
      street2: addr.street2 || addr.line2 || undefined,
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.zipCode || addr.postalCode || addr.zip || "",
      country: addr.country || "US",
      phone: addr.phone || undefined,
    };
  }

  /**
   * Map ShipStation carrier codes to our carrier names
   */
  static mapCarrierCode(carrierCode: string): string {
    const mapping: Record<string, string> = {
      stamps_com: "USPS",
      usps: "USPS",
      ups: "UPS",
      ups_walleted: "UPS",
      fedex: "FedEx",
      dhl_express: "DHL",
      dhl_express_worldwide: "DHL",
      other: "Other",
    };
    return mapping[carrierCode?.toLowerCase()] || carrierCode || "Other";
  }

  /**
   * Map ShipStation shipment status to our status
   */
  static mapShipmentStatus(shipment: ShipStationShipment): string {
    if (shipment.voided) return "returned";
    if (shipment.deliveryDate) return "delivered";
    if (shipment.trackingNumber) return "shipped";
    return "pending";
  }
}

// ── Credentials Helper ──

export async function getShipStationCredentials(): Promise<ShipStationConfig | null> {
  const dbSettings = await integrationRepository.getIntegrationSettings();

  const apiKey = dbSettings?.shipstationApiKey || process.env.SHIPSTATION_API_KEY?.trim() || "";
  const apiSecret = dbSettings?.shipstationApiSecret || process.env.SHIPSTATION_API_SECRET?.trim() || "";

  if (!apiKey || !apiSecret) {
    return null;
  }

  return { apiKey, apiSecret };
}
