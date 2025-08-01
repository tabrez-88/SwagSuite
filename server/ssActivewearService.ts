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

  async searchProducts(query: string): Promise<SsActivewearProduct[]> {
    try {
      // Universal search - try multiple approaches and combine results
      const searchPromises: Promise<SsActivewearProduct[]>[] = [];
      
      // 1. Try exact SKU match first
      if (query.match(/^[A-Z]?\d+/)) {
        searchPromises.push(this.searchBySku(query));
      }
      
      // 2. Try style search
      const styleNumber = this.extractStyleNumber(query);
      if (styleNumber) {
        searchPromises.push(this.searchByStyle(styleNumber));
      }
      
      // 3. Try brand/name search if query has letters
      if (query.match(/[A-Za-z]/)) {
        searchPromises.push(this.searchByName(query));
      }

      // 4. Try broad pattern matching as fallback
      searchPromises.push(this.searchByPattern(query));

      // Execute all searches in parallel and combine results
      const allResults = await Promise.allSettled(searchPromises);
      const combinedResults: SsActivewearProduct[] = [];
      const seenSkus = new Set<string>();

      for (const result of allResults) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          for (const product of result.value) {
            if (!seenSkus.has(product.sku)) {
              seenSkus.add(product.sku);
              combinedResults.push(product);
            }
          }
        }
      }

      console.log(`Universal search for "${query}" found ${combinedResults.length} unique products`);
      return combinedResults;
    } catch (error) {
      console.error('Error in universal search:', error);
      throw error;
    }
  }

  private extractStyleNumber(query: string): string | null {
    if (query.match(/^[A-Z]\d+/)) {
      // Format like B00760033 - extract digits after letter
      const match = query.match(/^[A-Z](\d+)/);
      if (match) {
        return match[1].length > 5 ? match[1].substring(0, 5) : match[1];
      }
    } else if (query.match(/^\d+/)) {
      // Format like 3001 or 00760033 - use as-is if short, or first 5 digits
      return query.length > 5 ? query.substring(0, 5) : query;
    }
    return null;
  }

  private async searchBySku(query: string): Promise<SsActivewearProduct[]> {
    const styleNumber = this.extractStyleNumber(query);
    if (!styleNumber) return [];

    try {
      const queryUrl = `${this.baseUrl}/products/?style=${styleNumber}`;
      console.log(`SKU search with URL: ${queryUrl}`);

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.log(`SKU search failed: ${response.status}`);
        return [];
      }

      const products = await response.json();
      if (!Array.isArray(products)) return [];

      // Find exact SKU match
      const exactMatch = products.find((product: SsActivewearProduct) => 
        product.sku?.toLowerCase() === query.toLowerCase()
      );
      return exactMatch ? [exactMatch] : [];
    } catch (error) {
      console.log('SKU search error:', error);
      return [];
    }
  }

  private async searchByStyle(styleNumber: string): Promise<SsActivewearProduct[]> {
    try {
      // Try multiple style variations for better matching
      const styleVariations = [
        styleNumber,
        styleNumber.padStart(5, '0'), // pad with zeros: 3001 -> 00301
        styleNumber.replace(/^0+/, ''), // remove leading zeros: 00301 -> 301
      ].filter((v, i, arr) => arr.indexOf(v) === i); // remove duplicates

      for (const style of styleVariations) {
        const queryUrl = `${this.baseUrl}/products/?style=${style}`;
        console.log(`Style search with URL: ${queryUrl}`);

        const response = await fetch(queryUrl, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });

        if (response.ok) {
          const products = await response.json();
          if (Array.isArray(products) && products.length > 0) {
            console.log(`Found ${products.length} products for style ${style}`);
            // Limit results to prevent memory issues
            return products.slice(0, 50);
          }
        } else {
          console.log(`Style search failed for ${style}: ${response.status}`);
        }
      }

      return [];
    } catch (error) {
      console.log('Style search error:', error);
      return [];
    }
  }

  private async searchByName(query: string): Promise<SsActivewearProduct[]> {
    try {
      // Map search terms to actual brand IDs from S&S Activewear API
      const brandMapping: { [key: string]: string } = {
        'gildan': '35',
        'bella': '5',
        'canvas': '5',
        'bella+canvas': '5',
        'bellacanvas': '5',
        'tultex': '201',
      };

      const lowerQuery = query.toLowerCase();
      let brandId = '';
      
      // Find matching brand
      for (const [brand, id] of Object.entries(brandMapping)) {
        if (lowerQuery.includes(brand)) {
          brandId = id;
          break;
        }
      }

      if (brandId) {
        const brandUrl = `${this.baseUrl}/products/?brandid=${brandId}`;
        console.log(`Brand ID search with URL: ${brandUrl}`);

        const response = await fetch(brandUrl, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });

        if (response.ok) {
          // Check content length to avoid memory issues
          const contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength) > 5000000) { // 5MB limit
            console.log(`Response too large for brand ID ${brandId}, limiting results`);
            // Try to get just a subset by adding pagination or limiting
            return [];
          }

          const products = await response.json();
          if (Array.isArray(products) && products.length > 0) {
            console.log(`Found ${products.length} products for brand ID ${brandId}`);
            // Return a limited set of results
            return products.slice(0, 20);
          }
        } else {
          console.log(`Brand ID search failed for ${brandId}: ${response.status}`);
        }
      }

      return [];
    } catch (error) {
      console.log('Brand ID search error:', error);
      return [];
    }
  }

  private async searchByPattern(query: string): Promise<SsActivewearProduct[]> {
    try {
      // Focus on known working patterns based on S&S Activewear API behavior
      const patterns = new Set<string>();
      
      // If query is numeric, try variations that we know work
      if (query.match(/^\d+$/)) {
        // The working pattern seems to be zero-padding to 5 digits
        patterns.add(query.padStart(5, '0')); // 3001 -> 03001, 2000 -> 02000
        patterns.add(query.padStart(4, '0')); // 3001 -> 3001, 200 -> 0200
        
        // Also try without leading zeros in case they were added
        patterns.add(query.replace(/^0+/, '') || query); // 03001 -> 3001
      }

      // Add specific patterns for known product lines
      // These are educated guesses based on common promotional product industry standards
      const knownProductMappings: { [key: string]: string[] } = {
        '3001': ['3001', '03001', '3001CVC', '3001C'],
        '2000': ['2000', '02000', '2000L'],
        '980': ['980', '00980', '0980'],
        'cvc': ['3001CVC', '3001C'],
        // Common style patterns that might exist
        '1800': ['1800', '01800', '18000'],
        '4200': ['4200', '04200', '42000'],
        '6400': ['6400', '06400', '64000'],
        '8800': ['8800', '08800', '88000'],
        // Bella+Canvas common styles
        'bella': ['3001', '3413', '6004', '3480'],
        // Tultex styles - check what they actually carry
        'tultex': ['241', '293', '214', '202'],
        '241': ['241', '0241'],
        '293': ['293', '0293'],  
        '214': ['214', '0214'],
        '202': ['202', '0202'],
      };

      const lowerQuery = query.toLowerCase();
      for (const [key, values] of Object.entries(knownProductMappings)) {
        if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
          values.forEach(v => patterns.add(v));
        }
      }

      console.log(`Trying patterns for "${query}": ${Array.from(patterns).join(', ')}`);

      // Try each pattern
      for (const pattern of patterns) {
        try {
          const queryUrl = `${this.baseUrl}/products/?style=${pattern}`;
          console.log(`Pattern search with URL: ${queryUrl}`);

          const response = await fetch(queryUrl, {
            method: 'GET',
            headers: this.getAuthHeaders(),
          });

          if (response.ok) {
            const products = await response.json();
            if (Array.isArray(products) && products.length > 0) {
              console.log(`Found ${products.length} products for pattern ${pattern}`);
              return products.slice(0, 20); // Limit results
            }
          } else {
            console.log(`Pattern search failed for ${pattern}: ${response.status}`);
          }
        } catch (patternError) {
          console.log(`Pattern search error for ${pattern}:`, patternError);
          continue;
        }
      }

      return [];
    } catch (error) {
      console.log('Pattern search error:', error);
      return [];
    }
  }

  async getProductBySku(sku: string): Promise<SsActivewearProduct | null> {
    const results = await this.searchProducts(sku);
    // Find exact SKU match from results
    const exactMatch = results.find(product => 
      product.sku?.toLowerCase() === sku.toLowerCase()
    );
    return exactMatch || (results.length > 0 ? results[0] : null);
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