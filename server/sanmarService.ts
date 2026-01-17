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
        timeout: 30000,
      });

      return response.data;
    } catch (error: any) {
      console.error('SOAP request error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Search products by style ID or brand
   * Note: SanMar returns one listResponse per size, so we need to aggregate
   */
  async searchProducts(query: string): Promise<SanMarProduct[]> {
    try {
      // Prepare credentials
      const credentials = `
        <sanMarCustomerNumber>${this.credentials.customerId}</sanMarCustomerNumber>
        <sanMarUserName>${this.credentials.username}</sanMarUserName>
        <sanMarUserPassword>${this.credentials.password}</sanMarUserPassword>
      `;

      // Try to determine if query is a style ID or brand name
      // Style IDs usually contain numbers (e.g., PC54, 18500, G500)
      // Brand names are usually just letters (e.g., Gildan, OGIO)
      const hasNumbers = /\d/.test(query);
      const isStyleId = query.length <= 8 && hasNumbers;
      
      let soapBody: string;
      let action: string;
      
      if (isStyleId) {
        // Search by style ID
        action = 'getProductInfoByStyle';
        soapBody = `      <impl:getProductInfoByStyle>
        <arg0>
          <styleId>${query.trim()}</styleId>
        </arg0>
        <arg1>
          ${credentials}
        </arg1>
      </impl:getProductInfoByStyle>`;
      } else {
        // Search by brand name
        action = 'getProductInfoByBrand';
        soapBody = `      <impl:getProductInfoByBrand>
        <arg0>
          <brandName>${query.trim()}</brandName>
        </arg0>
        <arg1>
          ${credentials}
        </arg1>
      </impl:getProductInfoByBrand>`;
      }

      const xmlResponse = await this.makeSoapRequest(action, soapBody);
      
      // Parse XML response
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

      // Navigate to listResponse
      const envelope = result?.['S:Envelope'] || result?.['soapenv:Envelope'] || result?.Envelope;
      const body = envelope?.['S:Body'] || envelope?.['soapenv:Body'] || envelope?.Body;
      const response = body?.[`ns2:${action}Response`] || body?.[`impl:${action}Response`] || body?.[`${action}Response`];
      const returnData = response?.return;

      if (!returnData || !returnData.listResponse) {
        console.log('No products found or error occurred');
        if (returnData?.errorOccured === 'true' || returnData?.errorOccured === true) {
          console.error('SanMar API Error:', returnData?.message);
        }
        return [];
      }

      // Parse the response
      const listResponses = Array.isArray(returnData.listResponse) 
        ? returnData.listResponse 
        : [returnData.listResponse];
      
      // Group by style ID and aggregate
      const productMap = new Map<string, any[]>();
      
      for (const response of listResponses) {
        const basicInfo = response.productBasicInfo;
        if (!basicInfo) continue;
        
        const styleId = basicInfo.style || basicInfo.styleId;
        if (!productMap.has(styleId)) {
          productMap.set(styleId, []);
        }
        productMap.get(styleId)!.push(response);
      }
      
      // Convert grouped data to SanMarProduct array
      const products: SanMarProduct[] = [];
      
      for (const [styleId, responses] of Array.from(productMap.entries())) {
        const product = this.aggregateProduct(responses);
        if (product) {
          products.push(product);
        }
      }
      
      return products;
    } catch (error) {
      console.error('SanMar search error:', error);
      throw new Error(`Failed to search SanMar products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    const sizes: string[] = [];
    
    for (const response of responses) {
      const info = response.productBasicInfo || {};
      if (info.color) colors.add(info.color);
      if (info.size) sizes.push(info.size);
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
      sizes: sizes,
      
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
      const products = await this.searchProducts(styleId);
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
