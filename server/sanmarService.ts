import axios from 'axios';
import { parseString } from 'xml2js';

// SanMar Web Services endpoint (verified working in Postman)
const SANMAR_PRODUCT_INFO_ENDPOINT = 'https://ws.sanmar.com:8080/SanMarWebService/SanMarProductInfoServicePort';
const SANMAR_INVENTORY_ENDPOINT = 'https://ws.sanmar.com:8080/SanMarWebService/SanMarInventoryServicePort';

export interface SanMarCredentials {
  customerId: string;
  username: string;
  password: string;
}

export interface SanMarProduct {
  styleId: string;
  styleName: string;
  brandName: string;
  productTitle: string;
  productDescription: string;
  categoryName: string;
  availableSizes: string; // e.g., "Adult Sizes: XS-5XL"
  caseSize: number;
  pieceWeight?: number;
  
  // Pricing
  casePrice?: number;
  caseSalePrice?: number;
  dozenPrice?: number;
  dozenSalePrice?: number;
  piecePrice?: number;
  pieceSalePrice?: number;
  priceCode?: string;
  priceText?: string;
  
  // Sale dates
  saleStartDate?: string;
  saleEndDate?: string;
  
  // Arrays (aggregated from multiple entries)
  colors: string[];
  sizes: string[];
  
  // Images
  productImage?: string;
  colorProductImage?: string;
  frontModel?: string;
  backModel?: string;
  sideModel?: string;
  frontFlat?: string;
  backFlat?: string;
  thumbnailImage?: string;
  brandLogoImage?: string;
  specSheet?: string;
  
  // Other
  keywords?: string;
  productStatus?: string;
  inventoryKey?: string;
}

export interface SanMarInventory {
  styleId: string;
  colorCode: string;
  sizeCode: string;
  quantityAvailable: number;
  warehouse: string;
}

/**
 * SanMar SOAP API Service
 * Based on SanMar Web Services Integration Guide 24.2
 */
export class SanMarService {
  private credentials: SanMarCredentials;

  constructor(credentials: SanMarCredentials) {
    this.credentials = credentials;
  }

  /**
   * Make raw SOAP request to SanMar API
   */
  private async makeSoapRequest(action: string, body: string): Promise<any> {
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:impl="http://impl.webservice.integration.sanmar.com/">
  <soapenv:Header/>
  <soapenv:Body>
${body}
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await axios.post(SANMAR_PRODUCT_INFO_ENDPOINT, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml',
          'SOAPAction': action,
        },
        timeout: 60000,
      });

      return response.data;
    } catch (error: any) {
      console.error('SOAP request error:', error.response?.data || error.message);
      throw error;
    }
  }

  private getCredentialsXml(): string {
    return `
        <sanMarCustomerNumber>${this.credentials.customerId}</sanMarCustomerNumber>
        <sanMarUserName>${this.credentials.username}</sanMarUserName>
        <sanMarUserPassword>${this.credentials.password}</sanMarUserPassword>
      `;
  }

  /**
   * Parse SOAP response XML and extract listResponse entries
   */
  private async parseSoapResponse(xmlResponse: string, action: string): Promise<any[]> {
    let result: any;

    await new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err: any, parsed: any) => {
        if (err) reject(err);
        else {
          result = parsed;
          resolve(parsed);
        }
      });
    });

    const envelope = result?.['S:Envelope'] || result?.['soapenv:Envelope'] || result?.Envelope;
    const body = envelope?.['S:Body'] || envelope?.['soapenv:Body'] || envelope?.Body;
    const response = body?.[`ns2:${action}Response`] || body?.[`impl:${action}Response`] || body?.[`${action}Response`];
    const returnData = response?.return;

    if (!returnData || !returnData.listResponse) {
      if (returnData?.errorOccured === 'true' || returnData?.errorOccured === true) {
        console.log(`SanMar API error (${action}):`, returnData?.message);
      }
      return [];
    }

    return Array.isArray(returnData.listResponse)
      ? returnData.listResponse
      : [returnData.listResponse];
  }

  /**
   * Aggregate listResponse entries into SanMarProduct array, with optional limit
   */
  private aggregateResponses(listResponses: any[], maxProducts?: number): SanMarProduct[] {
    const productMap = new Map<string, any[]>();

    for (const response of listResponses) {
      const basicInfo = response.productBasicInfo;
      if (!basicInfo) continue;

      const styleId = basicInfo.style || basicInfo.styleId;
      if (!productMap.has(styleId)) {
        // Stop collecting new styles once we hit the limit
        if (maxProducts && productMap.size >= maxProducts) continue;
        productMap.set(styleId, []);
      }
      productMap.get(styleId)!.push(response);
    }

    const products: SanMarProduct[] = [];
    for (const [, responses] of Array.from(productMap.entries())) {
      const product = this.aggregateProduct(responses);
      if (product) {
        products.push(product);
      }
    }
    return products;
  }

  /**
   * Search product by style number (e.g., "5000", "PC54", "G500")
   * This is much faster than brand search as it returns only one style
   */
  async searchByStyleNumber(styleNumber: string): Promise<SanMarProduct[]> {
    try {
      const action = 'getProductInfoByStyleNumber';
      const soapBody = `      <impl:getProductInfoByStyleNumber>
        <arg0>
          <styleNumber>${styleNumber.trim()}</styleNumber>
        </arg0>
        <arg1>
          ${this.getCredentialsXml()}
        </arg1>
      </impl:getProductInfoByStyleNumber>`;

      console.log(`SanMar: searching by style number "${styleNumber}"...`);
      const xmlResponse = await this.makeSoapRequest(action, soapBody);
      const listResponses = await this.parseSoapResponse(xmlResponse, action);

      if (listResponses.length === 0) return [];

      return this.aggregateResponses(listResponses);
    } catch (error) {
      console.error('SanMar searchByStyleNumber error:', error);
      throw new Error(`Failed to search SanMar by style: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search products by brand name
   * SanMar returns one listResponse per size/color, so we aggregate by style ID
   * Results are limited to avoid timeout on large brands
   */
  async searchByBrand(brandName: string, maxProducts: number = 50): Promise<SanMarProduct[]> {
    try {
      const action = 'getProductInfoByBrand';
      const soapBody = `      <impl:getProductInfoByBrand>
        <arg0>
          <brandName>${brandName.trim()}</brandName>
        </arg0>
        <arg1>
          ${this.getCredentialsXml()}
        </arg1>
      </impl:getProductInfoByBrand>`;

      console.log(`SanMar: searching by brand "${brandName}"...`);
      const xmlResponse = await this.makeSoapRequest(action, soapBody);
      const listResponses = await this.parseSoapResponse(xmlResponse, action);

      if (listResponses.length === 0) return [];

      console.log(`SanMar: received ${listResponses.length} raw entries, aggregating (limit ${maxProducts} styles)...`);
      return this.aggregateResponses(listResponses, maxProducts);
    } catch (error) {
      console.error('SanMar searchByBrand error:', error);
      throw new Error(`Failed to search SanMar by brand: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Smart search: detects if query is a style number or brand name
   * Style numbers typically contain digits (e.g., "5000", "PC54", "G500", "DT6000")
   * Brand names are typically all letters (e.g., "Nike", "Port Authority", "OGIO")
   */
  async searchProducts(query: string): Promise<SanMarProduct[]> {
    const trimmed = query.trim();

    // If query contains digits, try style number search first
    const hasDigits = /\d/.test(trimmed);

    if (hasDigits) {
      console.log(`SanMar: query "${trimmed}" contains digits, trying style number search first...`);
      try {
        const products = await this.searchByStyleNumber(trimmed);
        if (products.length > 0) {
          console.log(`SanMar: found ${products.length} product(s) by style number`);
          return products;
        }
      } catch {
        console.log(`SanMar: style number search failed, falling back to brand search...`);
      }
    }

    // Fall back to brand search (with limit to prevent huge responses)
    console.log(`SanMar: searching by brand name "${trimmed}"...`);
    return this.searchByBrand(trimmed, 50);
  }

  /**
   * Aggregate multiple listResponse entries (one per size) into single product
   */
  private aggregateProduct(responses: any[]): SanMarProduct | null {
    if (responses.length === 0) return null;
    
    // Use first entry as base
    const first = responses[0];
    const basicInfo = first.productBasicInfo || {};
    const imageInfo = first.productImageInfo || {};
    const priceInfo = first.productPriceInfo || {};
    
    // Collect unique colors and sizes
    const colors = new Set<string>();
    const sizes = new Set<string>();
    
    for (const response of responses) {
      const info = response.productBasicInfo || {};
      if (info.color) colors.add(info.color);
      if (info.size) sizes.add(info.size);
    }
    
    return {
      styleId: basicInfo.style || basicInfo.styleId || '',
      styleName: basicInfo.style || basicInfo.styleId || '',
      brandName: basicInfo.brandName || '',
      productTitle: basicInfo.productTitle || '',
      productDescription: basicInfo.productDescription || '',
      categoryName: basicInfo.category || '',
      availableSizes: basicInfo.availableSizes || '',
      caseSize: parseInt(basicInfo.caseSize || '0'),
      pieceWeight: parseFloat(basicInfo.pieceWeight || '0'),
      
      // Pricing from first entry (usually same for all sizes in range)
      casePrice: parseFloat(priceInfo.casePrice || '0'),
      caseSalePrice: priceInfo.caseSalePrice ? parseFloat(priceInfo.caseSalePrice) : undefined,
      dozenPrice: parseFloat(priceInfo.dozenPrice || '0'),
      dozenSalePrice: priceInfo.dozenSalePrice ? parseFloat(priceInfo.dozenSalePrice) : undefined,
      piecePrice: parseFloat(priceInfo.piecePrice || '0'),
      pieceSalePrice: priceInfo.pieceSalePrice ? parseFloat(priceInfo.pieceSalePrice) : undefined,
      priceCode: priceInfo.priceCode,
      priceText: priceInfo.priceText,
      saleStartDate: priceInfo.saleStartDate,
      saleEndDate: priceInfo.saleEndDate,
      
      // Aggregated arrays
      colors: Array.from(colors),
      sizes: Array.from(sizes),
      
      // Images
      productImage: imageInfo.productImage,
      colorProductImage: imageInfo.colorProductImage,
      frontModel: imageInfo.frontModel,
      backModel: imageInfo.backModel,
      sideModel: imageInfo.sideModel,
      frontFlat: imageInfo.frontFlat,
      backFlat: imageInfo.backFlat,
      thumbnailImage: imageInfo.thumbnailImage,
      brandLogoImage: imageInfo.brandLogoImage,
      specSheet: imageInfo.specSheet,
      
      // Other
      keywords: basicInfo.keywords,
      productStatus: basicInfo.productStatus,
      inventoryKey: basicInfo.inventoryKey,
    };
  }

  /**
   * Get product details by style ID
   */
  async getProductDetails(styleId: string): Promise<SanMarProduct | null> {
    try {
      const products = await this.searchByStyleNumber(styleId);
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error('SanMar getProductDetails error:', error);
      return null;
    }
  }

  /**
   * Test connection to SanMar API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a simple brand search to test connection
      const products = await this.searchProducts('OGIO');
      return true;
    } catch (error) {
      console.error('SanMar connection test failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create SanMar service instance
 */
export function createSanMarService(credentials: SanMarCredentials): SanMarService {
  return new SanMarService(credentials);
}
