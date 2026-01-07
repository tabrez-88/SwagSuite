import { storage } from "./storage";

interface SageConfig {
    acctId: string;
    loginId: string;
    key: string;
}

interface SageAuthRequest {
    acctId: number;
    loginId: string;
    key: string;
}

interface SageSearchRec {
    keywords?: string;
    quickSearch?: string;
    categories?: string;
    itemNum?: string;
    itemName?: string;
    spc?: string;
    suppId?: number;
    maxTotalItems?: number;
    startNum?: number;
    maxRecs?: number;
    thumbPicRes?: number;
    priceLow?: number;
    priceHigh?: number;
    qty?: number;
    endUserOnly?: boolean;
    extraReturnFields?: string;
    sort?: string;
}

interface SageProductSearchRequest {
    serviceId: number;
    apiVer: number;
    auth: SageAuthRequest;
    search: SageSearchRec;
    endBuyerSearch?: boolean;
    ref?: string;
}

interface SageProductDetailRequest {
    serviceId: number;
    apiVer: number;
    auth: SageAuthRequest;
    productId: string;
}

interface SageProduct {
    productId: string;
    productNumber: string;
    productName: string;
    supplierName: string;
    supplierId: string;
    asiNumber?: string;
    category: string;
    subcategory?: string;
    description: string;
    features?: string[];
    materials?: string[];
    dimensions?: string;
    weight?: number;
    eqpLevel?: string;
    pricingStructure?: any;
    quantityBreaks?: any[];
    setupCharges?: any;
    decorationMethods?: string[];
    leadTimes?: any;
    imageGallery?: string[];
    technicalDrawings?: string[];
    complianceCertifications?: string[];
}

interface SageApiResponse {
    ErrNum?: number;
    ErrMsg?: string;
    products?: SageProduct[];
    product?: SageProduct;
    totalResults?: number;
}

export class SageService {
    private baseUrl = 'https://www.promoplace.com/ws/ws.dll/ConnectAPI';
    private config: SageConfig;

    constructor(config: SageConfig) {
        this.config = config;
    }

    private getAuthPayload(): SageAuthRequest {
        return {
            acctId: parseInt(this.config.acctId),
            loginId: this.config.loginId,
            key: this.config.key
        };
    }

    /**
     * Test the SAGE API connection
     */
    async testConnection(): Promise<boolean> {
        try {
            const payload = {
                serviceId: 107, // Basic auth test service ID
                apiVer: 130,
                auth: this.getAuthPayload()
            };
            
            console.log('Testing SAGE connection with acctId:', this.config.acctId);

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('SAGE API connection failed:', response.status, errorText);
                return false;
            }

            const data: any = await response.json();
            
            console.log('SAGE test connection response:', data);

            // Check for API errors
            if (data.ErrNum && data.ErrNum !== 0) {
                console.error('SAGE API Error:', data.ErrNum, data.ErrMsg);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error testing SAGE connection:', error);
            return false;
        }
    }

    /**
     * Search for products in SAGE database
     */
    async searchProducts(searchTerm: string, options?: {
        categoryId?: string;
        supplierId?: string;
        maxResults?: number;
    }): Promise<SageProduct[]> {
        try {
            const searchRec: SageSearchRec = {
                quickSearch: searchTerm,
                maxTotalItems: options?.maxResults || 50,
                thumbPicRes: 300,
                endUserOnly: false,
                // Request extra fields including supplier info
                extraReturnFields: 'supplierName,companyName,supplierSageNum,asi'
            };

            // Add category if specified
            if (options?.categoryId) {
                searchRec.categories = options.categoryId;
            }

            // Add supplier ID if specified
            if (options?.supplierId) {
                searchRec.suppId = parseInt(options.supplierId);
            }

            const payload: SageProductSearchRequest = {
                serviceId: 103, // Product search service ID per documentation
                apiVer: 130,
                auth: this.getAuthPayload(),
                search: searchRec,
                endBuyerSearch: false
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('SAGE API request failed:', response.status, errorText);
                throw new Error(`SAGE API request failed: ${response.statusText}`);
            }

            const data: any = await response.json();
            
            console.log('SAGE API Full Response:', JSON.stringify(data, null, 2));

            // Check for API errors
            if (data.ErrNum && data.ErrNum !== 0) {
                console.error('SAGE API Error:', data.ErrNum, data.ErrMsg);
                throw new Error(`SAGE API Error (${data.ErrNum}): ${data.ErrMsg}`);
            }

            // Response might have different structures - try multiple field names
            let rawProducts = data.products || data.Products || data.items || data.Items || data.results || [];
            
            // If response is wrapped in a 'data' field
            if (!Array.isArray(rawProducts) && data.data) {
                rawProducts = data.data.products || data.data.Products || data.data.items || [];
            }

            console.log(`SAGE returned ${rawProducts.length} raw products`);
            console.log('Raw product sample (first product):', JSON.stringify(rawProducts[0], null, 2));
            
            // Normalize product data to our interface
            const normalizedProducts: SageProduct[] = rawProducts.map((p: any) => {
                // Log fields available in first product for debugging
                if (rawProducts.indexOf(p) === 0) {
                    console.log('Available fields in first product:', Object.keys(p));
                }
                
                // Parse price range if available (e.g., "0.75 - 0.89")
                let pricingStructure = {};
                if (p.prc && typeof p.prc === 'string') {
                    const priceMatch = p.prc.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
                    if (priceMatch) {
                        pricingStructure = {
                            minPrice: parseFloat(priceMatch[1]),
                            maxPrice: parseFloat(priceMatch[2]),
                            priceRange: p.prc
                        };
                    }
                }
                
                // Extract supplier ID (SN) from thumbPic URL
                // URL format: https://www.promoplace.com/ws/ws.dll/QPic?SN=50018&P=166970358&RS=300
                let extractedSupplierId = '';
                if (p.thumbPic) {
                    const snMatch = p.thumbPic.match(/[?&]SN=(\d+)/);
                    if (snMatch) {
                        extractedSupplierId = snMatch[1];
                        console.log(`Product ${p.name} - Extracted supplier ID: ${extractedSupplierId} from URL: ${p.thumbPic}`);
                    } else {
                        console.log(`Product ${p.name} - No SN parameter found in URL: ${p.thumbPic}`);
                    }
                }
                
                // Build image gallery from thumbPic
                const imageGallery = [];
                if (p.thumbPic) {
                    imageGallery.push(p.thumbPic);
                }
                
                return {
                    productId: p.spc || p.SPC || p.productId || p.ProductId || p.prodEId?.toString() || '',
                    productNumber: p.prodEId?.toString() || p.itemNum || p.ItemNum || p.productNumber || '',
                    productName: p.name || p.itemName || p.ItemName || p.productName || p.ProductName || 'Unnamed Product',
                    supplierName: p.supplierName || p.SupplierName || p.companyName || p.CompanyName || '',
                    // Prioritize extracted ID from URL since search API doesn't return supplier fields
                    supplierId: extractedSupplierId || p.supplierSageNum || p.SupplierSageNum || p.supplierId || p.SupplierId || p.SN?.toString() || '',
                    asiNumber: p.asiNumber || p.ASINumber || p.asi || '',
                    category: p.categoryName || p.CategoryName || p.category || p.Category || 'Uncategorized',
                    subcategory: p.subcategoryName || p.SubcategoryName || p.subcategory || p.SubCategory || '',
                    description: p.description || p.Description || p.itemDescription || p.desc || p.name || '',
                    features: p.features || p.Features || p.keyFeatures || [],
                    materials: p.materials || p.Materials || [],
                    dimensions: p.size || p.Size || p.dimensions || p.Dimensions || '',
                    weight: p.weight || p.Weight || undefined,
                    eqpLevel: p.eqp || p.EQP || p.eqpLevel || p.EqpLevel || '',
                    pricingStructure: pricingStructure,
                    quantityBreaks: p.pricingDetails || p.PricingDetails || p.quantityBreaks || [],
                    setupCharges: p.setupCharges || p.SetupCharges || {},
                    decorationMethods: p.imprintMethods || p.ImprintMethods || p.decorationMethods || [],
                    leadTimes: p.productionTime || p.ProductionTime || p.leadTimes || {},
                    imageGallery: imageGallery,
                    technicalDrawings: p.technicalDrawings || p.drawings || [],
                    complianceCertifications: p.certifications || p.Certifications || []
                };
            });
            
            console.log(`Normalized ${normalizedProducts.length} products`);
            console.log('First product sample:', JSON.stringify(normalizedProducts[0], null, 2));
            
            return normalizedProducts;
        } catch (error) {
            console.error('Error searching SAGE products:', error);
            throw error;
        }
    }

    /**
     * Get detailed information for a specific product
     */
    async getProductDetail(productId: string): Promise<SageProduct | null> {
        try {
            const payload: SageProductDetailRequest = {
                serviceId: 201, // Product detail service ID
                apiVer: 130,
                auth: this.getAuthPayload(),
                productId: productId
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`SAGE API request failed: ${response.statusText}`);
            }

            const data: SageApiResponse = await response.json();

            // Check for API errors
            if (data.ErrNum && data.ErrNum !== 0) {
                throw new Error(`SAGE API Error: ${data.ErrMsg}`);
            }

            return data.product || null;
        } catch (error) {
            console.error('Error fetching SAGE product detail:', error);
            throw error;
        }
    }

    /**
     * Get supplier information from SAGE
     */
    async getSupplierInfo(supplierId: string): Promise<any> {
        try {
            const payload = {
                serviceId: 150, // Supplier info service ID
                apiVer: 130,
                auth: this.getAuthPayload(),
                supplierId: supplierId
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`SAGE API request failed: ${response.statusText}`);
            }

            const data: SageApiResponse = await response.json();

            if (data.ErrNum && data.ErrNum !== 0) {
                throw new Error(`SAGE API Error: ${data.ErrMsg}`);
            }

            return data;
        } catch (error) {
            console.error('Error fetching SAGE supplier info:', error);
            throw error;
        }
    }

    /**
     * Sync a product from SAGE to local database
     */
    async syncProductToDatabase(sageProduct: SageProduct): Promise<string> {
        try {
            // If supplier name is empty but we have supplierId, try to fetch supplier info
            let supplierName = sageProduct.supplierName;
            if (!supplierName && sageProduct.supplierId) {
                try {
                    console.log(`Fetching supplier info for supplier ID: ${sageProduct.supplierId}`);
                    const supplierInfo = await this.getSupplierInfo(sageProduct.supplierId);
                    console.log('Supplier info response:', supplierInfo);
                    supplierName = supplierInfo?.name || supplierInfo?.companyName || supplierInfo?.supplier?.name || supplierInfo?.supplier?.companyName || `Supplier ${sageProduct.supplierId}`;
                    console.log(`Resolved supplier name: ${supplierName}`);
                } catch (error) {
                    console.log(`Could not fetch supplier info for ${sageProduct.supplierId}, using ID as name`);
                    console.error('Supplier fetch error:', error);
                    supplierName = `Supplier ${sageProduct.supplierId}`;
                }
            }

            // First, check if supplier exists, if not create it
            let supplier = await storage.getSupplierBySageId(sageProduct.supplierId);

            let supplierId = supplier?.id;
            
            if (!supplier && (supplierName || sageProduct.supplierId)) {
                // Create new supplier
                const newSupplier = await storage.createSupplier({
                    name: supplierName || `Supplier ${sageProduct.supplierId}`,
                    sageId: sageProduct.supplierId,
                    apiIntegrationStatus: 'active',
                    lastSyncAt: new Date()
                });
                supplierId = newSupplier.id;
            }

            // Check if product already exists in sage_products
            const existingSageProduct = await storage.getSageProductBySageId(sageProduct.productId);

            const sageProductData = {
                sageId: sageProduct.productId,
                productName: sageProduct.productName,
                productNumber: sageProduct.productNumber,
                supplierId: supplierId,
                category: sageProduct.category,
                subcategory: sageProduct.subcategory,
                brand: supplierName || sageProduct.supplierName,
                description: sageProduct.description,
                features: sageProduct.features || [],
                materials: sageProduct.materials || [],
                dimensions: sageProduct.dimensions,
                weight: sageProduct.weight ? String(sageProduct.weight) : null,
                eqpLevel: sageProduct.eqpLevel,
                pricingStructure: sageProduct.pricingStructure,
                quantityBreaks: sageProduct.quantityBreaks,
                setupCharges: sageProduct.setupCharges,
                decorationMethods: sageProduct.decorationMethods || [],
                leadTimes: sageProduct.leadTimes,
                imageGallery: sageProduct.imageGallery || [],
                technicalDrawings: sageProduct.technicalDrawings || [],
                complianceCertifications: sageProduct.complianceCertifications || [],
                lastSyncedAt: new Date(),
                syncStatus: 'active'
            };

            let sageProductId: string;
            if (existingSageProduct) {
                // Update existing sage product
                await storage.updateSageProduct(existingSageProduct.id, sageProductData);
                sageProductId = existingSageProduct.id;
            } else {
                // Create new sage product
                sageProductId = await storage.createSageProduct(sageProductData);
            }

            // Also sync to main products table for orders
            const mainProductData = {
                name: sageProduct.productName,
                sku: sageProduct.productNumber || sageProduct.productId,
                supplierSku: sageProduct.productId, // Store SAGE SPC code here
                description: sageProduct.description || '',
                basePrice: (sageProduct.pricingStructure as any)?.minPrice?.toString() || '0',
                supplierId: supplierId,
                imageUrl: sageProduct.imageGallery?.[0] || null,
                productType: 'promotional', // SAGE products are promotional items
                leadTime: 10, // Default lead time
                minimumQuantity: 1,
            };

            // Check if already exists in main products table by supplierSku (SAGE SPC code)
            const existingMainProducts = await storage.getProducts();
            
            const matchedProduct = existingMainProducts.find(
                p => p.supplierSku === sageProduct.productId
            );

            if (matchedProduct) {
                // Update existing main product
                await storage.updateProduct(matchedProduct.id, mainProductData);
            } else {
                // Create new main product
                await storage.createProduct(mainProductData);
            }

            return sageProductId;
        } catch (error) {
            console.error('Error syncing SAGE product to database:', error);
            throw error;
        }
    }

    /**
     * Bulk sync multiple products
     */
    async bulkSyncProducts(sageProducts: SageProduct[]): Promise<{
        success: number;
        failed: number;
        errors: string[];
    }> {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const product of sageProducts) {
            try {
                await this.syncProductToDatabase(product);
                success++;
            } catch (error) {
                failed++;
                errors.push(`Failed to sync ${product.productName}: ${error}`);
            }
        }

        return { success, failed, errors };
    }
}

// Helper function to get SAGE credentials from database or env
export async function getSageCredentials(): Promise<SageConfig | null> {
    try {
        const dbSettings = await storage.getIntegrationSettings();

        const acctId = dbSettings?.sageAcctId || process.env.SAGE_ACCT_ID || '';
        const loginId = dbSettings?.sageLoginId || process.env.SAGE_LOGIN_ID || '';
        const key = dbSettings?.sageApiKey || process.env.SAGE_API_KEY || '';

        if (!acctId || !loginId || !key) {
            return null;
        }

        return { acctId, loginId, key };
    } catch (error) {
        console.error('Error getting SAGE credentials:', error);
        return null;
    }
}
