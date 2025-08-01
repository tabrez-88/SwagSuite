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