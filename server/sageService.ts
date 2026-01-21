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
    colors?: string[];
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
                // Request extra fields including supplier info, colors, and category
                // Valid options: ITEMNUM, CATEGORY, DESCRIPTION, COLORS, THEMES, NET, SUPPID, LINE, SUPPLIER, PREFGROUPS, PRODTIME
                extraReturnFields: 'SUPPLIER,SUPPID,CATEGORY,COLORS,DESCRIPTION,ITEMNUM'
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

            console.log(`SAGE search returned ${rawProducts.length} products`);
            
            // Normalize product data to our interface
            const normalizedProducts: SageProduct[] = rawProducts.map((p: any) => {
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
                
                // Build image gallery from thumbPic
                const imageGallery = p.thumbPic ? [p.thumbPic] : [];
                
                // Parse colors array if available
                const colors = Array.isArray(p.colors) 
                    ? p.colors 
                    : typeof p.colors === 'string' 
                        ? p.colors.split(',').map((c: string) => c.trim()).filter(Boolean)
                        : [];
                
                return {
                    // Core identifiers
                    productId: p.spc || p.SPC || p.productId || p.ProductId || p.prodEId?.toString() || '',
                    productNumber: p.itemNum || p.ItemNum || p.prodEId?.toString() || p.productNumber || '',
                    productName: p.name || p.itemName || p.ItemName || p.productName || p.ProductName || 'Unnamed Product',
                    
                    // Supplier info (from SUPPLIER and SUPPID extraReturnFields)
                    supplierName: p.supplier || p.Supplier || p.supplierName || p.SupplierName || p.companyName || p.CompanyName || '',
                    supplierId: p.suppId || p.SuppId || p.supplierSageNum || p.SupplierSageNum || p.supplierId || p.SupplierId || p.SN?.toString() || '',
                    asiNumber: p.asiNumber || p.ASINumber || p.asi || '',
                    
                    // Product details (from CATEGORY, DESCRIPTION, COLORS extraReturnFields)
                    category: p.category || p.Category || p.categoryName || p.CategoryName || 'Uncategorized',
                    subcategory: p.subcategoryName || p.SubcategoryName || p.subcategory || p.SubCategory || '',
                    description: p.description || p.Description || p.itemDescription || p.desc || p.name || '',
                    colors,
                    
                    // Physical attributes
                    features: p.features || p.Features || p.keyFeatures || [],
                    materials: p.materials || p.Materials || [],
                    dimensions: p.size || p.Size || p.dimensions || p.Dimensions || '',
                    weight: p.weight || p.Weight || undefined,
                    eqpLevel: p.eqp || p.EQP || p.eqpLevel || p.EqpLevel || '',
                    
                    // Pricing and ordering
                    pricingStructure,
                    quantityBreaks: p.pricingDetails || p.PricingDetails || p.quantityBreaks || [],
                    setupCharges: p.setupCharges || p.SetupCharges || {},
                    decorationMethods: p.imprintMethods || p.ImprintMethods || p.decorationMethods || [],
                    leadTimes: p.productionTime || p.ProductionTime || p.prodTime || p.leadTimes || {},
                    
                    // Media and compliance
                    imageGallery,
                    technicalDrawings: p.technicalDrawings || p.drawings || [],
                    complianceCertifications: p.certifications || p.Certifications || []
                };
            });
            
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
            console.log('=== SAGE Product Sync Debug ===');
            console.log('Product Name:', sageProduct.productName);
            console.log('Supplier Name from SAGE:', sageProduct.supplierName);
            console.log('Supplier ID from SAGE:', sageProduct.supplierId);
            
            // Validate we have at least supplier name
            if (!sageProduct.supplierName || sageProduct.supplierName.trim() === '') {
                console.error('⚠️  ERROR: Supplier name is missing from SAGE API!');
                throw new Error('Cannot sync product: Supplier name is required from SAGE API');
            }
            
            const supplierName = sageProduct.supplierName;
            const supplierId = sageProduct.supplierId?.trim() || null;
            
            console.log('Processing with:', { supplierName, supplierId });
            
            // First, try to find supplier by SAGE ID (if provided)
            let supplier = null;
            if (supplierId) {
                supplier = await storage.getSupplierBySageId(supplierId);
                console.log('Found existing supplier by SAGE ID:', supplier);
                
                // If supplier found but name doesn't match, it might be wrong - check by name too
                if (supplier && supplier.name !== supplierName) {
                    console.warn(`⚠️  Supplier name mismatch! DB has "${supplier.name}" but SAGE says "${supplierName}"`);
                    console.log('This might be wrong - will search by name instead...');
                    supplier = null; // Reset and search by name below
                }
            } else {
                console.log('No SAGE supplier ID provided, will search by name only');
            }
            
            // If no supplier found by ID, or ID search was skipped, search by name
            if (!supplier) {
                console.log('Searching for supplier by name:', supplierName);
                const allSuppliers = await storage.getSuppliers();
                supplier = allSuppliers.find(s => 
                    s.name.toLowerCase() === supplierName.toLowerCase()
                );
                
                if (supplier) {
                    console.log('Found supplier by name:', supplier);
                    // Update with SAGE ID if we have one and it's not set
                    if (supplierId && !supplier.sageId) {
                        console.log('Updating supplier with SAGE ID:', supplierId);
                        await storage.updateSupplier(supplier.id, {
                            sageId: supplierId,
                            apiIntegrationStatus: 'active',
                            lastSyncAt: new Date()
                        });
                    }
                } else {
                    console.log('No existing supplier found, will create new one');
                }
            }

            let dbSupplierId = supplier?.id;
            
            if (!supplier) {
                // Create new supplier with name and SAGE ID (if available)
                console.log('Creating new supplier:', supplierName);
                const newSupplier = await storage.createSupplier({
                    name: supplierName,
                    sageId: supplierId || undefined,
                    apiIntegrationStatus: 'active',
                    lastSyncAt: new Date()
                });
                dbSupplierId = newSupplier.id;
                console.log('Created new supplier with ID:', dbSupplierId, 'Name:', newSupplier.name);
            }
            
            console.log('Final supplier ID for product:', dbSupplierId);
            console.log('Final supplier name:', supplierName);

            // Check if product already exists in sage_products
            const existingSageProduct = await storage.getSageProductBySageId(sageProduct.productId);

            const sageProductData = {
                sageId: sageProduct.productId,
                productName: sageProduct.productName,
                productNumber: sageProduct.productNumber,
                supplierId: dbSupplierId,
                category: sageProduct.category,
                subcategory: sageProduct.subcategory,
                brand: supplierName,
                description: sageProduct.description,
                colors: sageProduct.colors || [],
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
                supplierId: dbSupplierId,
                brand: supplierName || sageProduct.supplierName,
                category: sageProduct.category,
                colors: sageProduct.colors || [],
                imageUrl: sageProduct.imageGallery?.[0] || null,
                productType: 'promotional', // SAGE products are promotional items
                leadTime: 10, // Default lead time
                minimumQuantity: 1,
            };

            console.log('Main product data to save:', {
                name: mainProductData.name,
                supplierId: mainProductData.supplierId,
                brand: mainProductData.brand
            });

            // Check if already exists in main products table by supplierSku (SAGE SPC code)
            const existingMainProducts = await storage.getProducts();
            
            const matchedProduct = existingMainProducts.find(
                p => p.supplierSku === sageProduct.productId
            );

            if (matchedProduct) {
                // Update existing main product
                console.log('Updating existing product:', matchedProduct.id);
                await storage.updateProduct(matchedProduct.id, mainProductData);
            } else {
                // Create new main product
                console.log('Creating new main product');
                const createdProduct = await storage.createProduct(mainProductData);
                console.log('Created product with supplier ID:', createdProduct.supplierId);
            }

            console.log('=== End SAGE Product Sync ===\n');
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
