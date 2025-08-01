import { storage } from "./storage";

interface SsActivewearConfig {
  accountNumber: string;
  apiKey: string;
}

interface SsActivewearProduct {
  sku: string;
  gtin: string;
  styleID: number;
  brandName: string;
  styleName: string;
  colorName: string;
  colorCode: string;
  sizeName: string;
  sizeCode: string;
  unitWeight: number;
  caseQty: number;
  piecePrice: number;
  dozenPrice: number;
  casePrice: number;
  customerPrice: number;
  qty: number;
  colorFrontImage: string;
  colorBackImage: string;
  colorSideImage: string;
  colorSwatchImage: string;
  countryOfOrigin: string;
}

export class SsActivewearService {
  private baseUrl = 'https://api.ssactivewear.com/V2';
  private config: SsActivewearConfig;

  constructor(config: SsActivewearConfig) {
    this.config = config;
  }

  private getAuthHeaders() {
    const credentials = Buffer.from(`${this.config.accountNumber}:${this.config.apiKey}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/products/?style=00760`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return response.ok;
    } catch (error) {
      console.error('S&S Activewear connection test failed:', error);
      return false;
    }
  }

  async getProducts(styleFilter?: string): Promise<SsActivewearProduct[]> {
    try {
      let url = `${this.baseUrl}/products/`;
      if (styleFilter) {
        url += `?style=${encodeURIComponent(styleFilter)}`;
      } else {
        // Default to a small sample style to avoid overwhelming API
        url += `?style=00760`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`S&S Activewear API error: ${response.status} ${response.statusText}`);
      }

      const products = await response.json();
      return products;
    } catch (error) {
      console.error('Error fetching S&S Activewear products:', error);
      throw error;
    }
  }

  async getProductBySku(sku: string): Promise<SsActivewearProduct | null> {
    try {
      // Parse S&S SKU format - they use different patterns
      // For B00760033: B = brand prefix, 00760 = style, 033 = size/color
      // For 00760033: 00760 = style, 033 = size/color  
      let styleNumber = '';
      
      if (sku.match(/^[A-Z]\d+/)) {
        // Format like B00760033 - extract digits after letter
        const match = sku.match(/^[A-Z](\d+)/);
        if (match) {
          styleNumber = match[1].substring(0, 5); // First 5 digits after letter
        }
      } else if (sku.match(/^\d+/)) {
        // Format like 00760033 - first 5 digits are style
        styleNumber = sku.substring(0, 5);
      }
      
      const queryUrl = `${this.baseUrl}/products/?style=${styleNumber || '00760'}`;

      console.log(`Searching S&S Activewear with URL: ${queryUrl}`);

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.log(`S&S API response not OK: ${response.status} ${response.statusText}`);
        if (response.status === 404) {
          return null;
        }
        throw new Error(`S&S Activewear API error: ${response.status} ${response.statusText}`);
      }

      const products = await response.json();
      console.log(`Found ${products.length} products, searching for SKU: ${sku}`);
      
      // Find the exact SKU match in the results
      if (Array.isArray(products)) {
        const exactMatch = products.find((product: SsActivewearProduct) => 
          product.sku?.toLowerCase() === sku.toLowerCase()
        );
        
        if (exactMatch) {
          console.log(`Found exact match for SKU ${sku}: ${exactMatch.brandName} ${exactMatch.styleName}`);
        } else {
          console.log(`No exact match found for SKU ${sku}. Available SKUs:`, products.slice(0, 5).map(p => p.sku));
        }
        
        return exactMatch || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching S&S Activewear product by SKU:', error);
      throw error;
    }
  }

  async getCategories(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`S&S Activewear API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching S&S Activewear categories:', error);
      throw error;
    }
  }

  async getBrands(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/brands/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`S&S Activewear API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching S&S Activewear brands:', error);
      throw error;
    }
  }

  async importProducts(userId: string, styleFilter?: string): Promise<string> {
    // Create import job
    const importJob = await storage.createSsActivewearImportJob({
      userId,
      status: 'pending',
    });

    // Start import process in background
    this.processImport(importJob.id, styleFilter).catch(error => {
      console.error('Import process failed:', error);
      storage.updateSsActivewearImportJob(importJob.id, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      });
    });

    return importJob.id;
  }

  private async processImport(jobId: string, styleFilter?: string): Promise<void> {
    await storage.updateSsActivewearImportJob(jobId, {
      status: 'running',
      startedAt: new Date(),
    });

    try {
      const products = await this.getProducts(styleFilter);
      
      await storage.updateSsActivewearImportJob(jobId, {
        totalProducts: products.length,
      });

      let processedProducts = 0;
      let newProducts = 0;
      let updatedProducts = 0;
      let errorCount = 0;

      for (const product of products) {
        try {
          const existingProduct = await storage.getSsActivewearProductBySku(product.sku);
          
          const productData = {
            sku: product.sku,
            gtin: product.gtin,
            styleId: product.styleID,
            brandName: product.brandName,
            styleName: product.styleName,
            colorName: product.colorName,
            colorCode: product.colorCode,
            sizeName: product.sizeName,
            sizeCode: product.sizeCode,
            unitWeight: product.unitWeight?.toString(),
            caseQty: product.caseQty,
            piecePrice: product.piecePrice?.toString(),
            dozenPrice: product.dozenPrice?.toString(),
            casePrice: product.casePrice?.toString(),
            customerPrice: product.customerPrice?.toString(),
            qty: product.qty,
            colorFrontImage: product.colorFrontImage,
            colorBackImage: product.colorBackImage,
            colorSideImage: product.colorSideImage,
            colorSwatchImage: product.colorSwatchImage,
            countryOfOrigin: product.countryOfOrigin,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          };

          if (existingProduct) {
            await storage.updateSsActivewearProduct(existingProduct.id, productData);
            updatedProducts++;
          } else {
            await storage.createSsActivewearProduct(productData);
            newProducts++;
          }

          processedProducts++;
          
          // Update progress every 10 products
          if (processedProducts % 10 === 0) {
            await storage.updateSsActivewearImportJob(jobId, {
              processedProducts,
              newProducts,
              updatedProducts,
              errorCount,
            });
          }
        } catch (error) {
          console.error(`Error processing product ${product.sku}:`, error);
          errorCount++;
        }
      }

      // Final update
      await storage.updateSsActivewearImportJob(jobId, {
        status: 'completed',
        processedProducts,
        newProducts,
        updatedProducts,
        errorCount,
        completedAt: new Date(),
      });

    } catch (error) {
      await storage.updateSsActivewearImportJob(jobId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      });
      throw error;
    }
  }
}