import { integrationRepository } from "../repositories/integration.repository";
import { supplierRepository } from "../repositories/supplier.repository";
import { productRepository } from "../repositories/product.repository";
import { contactRepository } from "../repositories/contact.repository";
import { supplierAddressRepository } from "../repositories/supplier-address.repository";

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
    productId: string;       // SPC code (e.g., "CARKJ-LQNFO")
    productNumber: string;   // Supplier item number (e.g., "HP-OASIS-32")
    prodEId?: string;        // Numeric SAGE product ID (e.g., "345733702")
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
                keywords: searchTerm,
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
                    productNumber: p.itemNum || p.ItemNum || p.productNumber || '',
                    prodEId: p.prodEId?.toString() || p.ProdEId?.toString() || '', // Numeric SAGE product ID for 105 API
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
     * Get full product detail including supplier information from SAGE (serviceId 105)
     */
    async getFullProductDetail(prodEId: string, includeSuppInfo: boolean = true): Promise<any> {
        try {
            const payload = {
                serviceId: 105,
                apiVer: 130,
                auth: this.getAuthPayload(),
                prodEId: prodEId,
                includeSuppInfo: includeSuppInfo ? 1 : 0,
            };

            console.log('Fetching SAGE full product detail for:', prodEId);

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

            const data: any = await response.json();

            if (data.errNum && data.errNum !== 0) {
                throw new Error(`SAGE API Error (${data.errNum}): ${data.errMsg}`);
            }

            return data.product || null;
        } catch (error) {
            console.error('Error fetching SAGE full product detail:', error);
            throw error;
        }
    }

    /**
     * Parse a name string like "Ross Rodriguez" into firstName/lastName
     */
    private parseContactName(fullName: string): { firstName: string; lastName: string } {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 0) return { firstName: 'Unknown', lastName: '' };
        if (parts.length === 1) return { firstName: parts[0], lastName: '' };
        return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }

    /**
     * Parse lead time string like "15 to 20 working days" into a number (average days)
     */
    private parseLeadTime(prodTime: string): number {
        if (!prodTime) return 10;
        const match = prodTime.match(/(\d+)\s*(?:to|-)\s*(\d+)/);
        if (match) {
            return Math.ceil((parseInt(match[1]) + parseInt(match[2])) / 2);
        }
        const single = prodTime.match(/(\d+)/);
        if (single) return parseInt(single[1]);
        return 10;
    }

    /**
     * Enrich supplier record with data from SAGE 105 response
     * Creates contacts, addresses, and updates supplier fields
     */
    async enrichSupplierFromResponse(
        dbSupplierId: string,
        sageSupplier: any,
        isNewSupplier: boolean
    ): Promise<void> {
        if (!sageSupplier) return;

        console.log('Enriching supplier from SAGE data:', sageSupplier.coName || 'unknown');

        try {
            // 1. Create/update contacts
            await this.syncSupplierContacts(dbSupplierId, sageSupplier);

            // 2. Create/update addresses
            await this.syncSupplierAddresses(dbSupplierId, sageSupplier);

            // 3. Update supplier record with enriched data
            const existingSupplier = await supplierRepository.getById(dbSupplierId);
            if (!existingSupplier) return;

            const generalInfo = sageSupplier.generalInfo || {};

            // Build sageData JSONB
            const sageData = {
                emails: {
                    primary: sageSupplier.email || undefined,
                    sales: sageSupplier.salesEmail || undefined,
                    order: sageSupplier.orderEmail || undefined,
                    sample: sageSupplier.sampleOrderEmail || undefined,
                    customerService: sageSupplier.customerServiceEmail || undefined,
                    art: sageSupplier.artContactEmail || undefined,
                },
                phones: {
                    main: sageSupplier.tel || undefined,
                    tollFree: sageSupplier.tollFreeTel || undefined,
                    fax: sageSupplier.fax || undefined,
                },
                contacts: {
                    primary: sageSupplier.contactName || undefined,
                    art: sageSupplier.artContactName ? {
                        name: sageSupplier.artContactName,
                        email: sageSupplier.artContactEmail,
                    } : undefined,
                },
                generalInfo: {
                    termsInfo: generalInfo.termsInfo || undefined,
                    shipInfo: generalInfo.shipInfo || undefined,
                    imprintMethods: generalInfo.imprintMethods || undefined,
                    imprintColors: generalInfo.imprintColors || undefined,
                    artInfo: generalInfo.artInfo || undefined,
                    proofInfo: generalInfo.proofInfo || undefined,
                    warrantyInfo: generalInfo.warrantyInfo || undefined,
                    returnsInfo: generalInfo.returnsInfo || undefined,
                    orderChangeInfo: generalInfo.orderChangeInfo || undefined,
                    orderCancelInfo: generalInfo.orderCancelInfo || undefined,
                    lessMinInfo: generalInfo.lessMinInfo || undefined,
                    overrunInfo: generalInfo.overrunInfo || undefined,
                    coOpInfo: generalInfo.coOpInfo || undefined,
                    copyChangeInfo: generalInfo.copyChangeInfo || undefined,
                    otherInfo: generalInfo.otherInfo || undefined,
                },
                charges: {
                    pmsCharge: parseFloat(generalInfo.pmscharge || generalInfo.pmsCharge || '0') || undefined,
                    copyChangeCharge: parseFloat(generalInfo.copyChangeCharge || '0') || undefined,
                    artChargeHr: parseFloat(generalInfo.artChargeHr || '0') || undefined,
                    artChargeJob: parseFloat(generalInfo.artChargeJob || '0') || undefined,
                    proofCharge: parseFloat(generalInfo.proofCharge || '0') || undefined,
                    specSampleCharge: parseFloat(generalInfo.specSampleCharge || '0') || undefined,
                },
                currency: sageSupplier.catCurrency || undefined,
                lineName: sageSupplier.lineName || undefined,
                catYear: sageSupplier.catYear || undefined,
                unionShop: sageSupplier.unionShop || undefined,
                esg: sageSupplier.esg || undefined,
                comment: sageSupplier.comment || undefined,
            };

            // Build update — for existing suppliers, only update NULL fields
            const updateData: any = {
                sageData,
                lastSyncAt: new Date(),
            };

            if (isNewSupplier || !existingSupplier.website) {
                updateData.website = sageSupplier.web || undefined;
            }
            // termsInfo goes to notes (not paymentTerms — that field uses payment_terms table selection)
            if (generalInfo.termsInfo && (isNewSupplier || !existingSupplier.notes)) {
                updateData.notes = `SAGE Terms: ${generalInfo.termsInfo}`;
            }
            if (isNewSupplier || !existingSupplier.phone) {
                updateData.phone = sageSupplier.tel || sageSupplier.tollFreeTel || undefined;
            }
            if (isNewSupplier || !existingSupplier.email) {
                updateData.email = sageSupplier.salesEmail || sageSupplier.email || undefined;
            }
            if (isNewSupplier || !existingSupplier.contactPerson) {
                updateData.contactPerson = sageSupplier.contactName || undefined;
            }

            await supplierRepository.update(dbSupplierId, updateData);
            console.log('Supplier enriched successfully:', dbSupplierId);

        } catch (error) {
            console.warn('Supplier enrichment failed (non-blocking):', error);
        }
    }

    /**
     * Sync contacts from SAGE supplier data to contacts table
     */
    private async syncSupplierContacts(dbSupplierId: string, sageSupplier: any): Promise<void> {
        // Get existing contacts for this supplier to avoid duplicates
        const existingContacts = await contactRepository.getAll(undefined, dbSupplierId, true);
        const existingEmails = new Set(
            existingContacts.map(c => c.email?.toLowerCase()).filter(Boolean)
        );

        const contactsToCreate: Array<{
            firstName: string;
            lastName: string;
            email?: string;
            phone?: string;
            department?: string;
            isPrimary?: boolean;
            receiveOrderEmails?: boolean;
        }> = [];

        // Primary contact
        if (sageSupplier.contactName) {
            const { firstName, lastName } = this.parseContactName(sageSupplier.contactName);
            const email = sageSupplier.salesEmail || sageSupplier.email;
            if (!email || !existingEmails.has(email?.toLowerCase())) {
                contactsToCreate.push({
                    firstName,
                    lastName,
                    email,
                    phone: sageSupplier.tel || sageSupplier.tollFreeTel,
                    department: 'sales',
                    isPrimary: true,
                    receiveOrderEmails: true,
                });
                if (email) existingEmails.add(email.toLowerCase());
            }
        }

        // Art contact (if different from primary)
        if (sageSupplier.artContactName && sageSupplier.artContactEmail) {
            if (!existingEmails.has(sageSupplier.artContactEmail.toLowerCase())) {
                const { firstName, lastName } = this.parseContactName(sageSupplier.artContactName);
                contactsToCreate.push({
                    firstName,
                    lastName,
                    email: sageSupplier.artContactEmail,
                    department: 'design_creative',
                });
                existingEmails.add(sageSupplier.artContactEmail.toLowerCase());
            }
        }

        // Order email contact (if unique)
        if (sageSupplier.orderEmail && !existingEmails.has(sageSupplier.orderEmail.toLowerCase())) {
            contactsToCreate.push({
                firstName: 'Orders',
                lastName: sageSupplier.coName || 'Dept',
                email: sageSupplier.orderEmail,
                department: 'sales',
                receiveOrderEmails: true,
            });
            existingEmails.add(sageSupplier.orderEmail.toLowerCase());
        }

        // Customer service email (if unique)
        if (sageSupplier.customerServiceEmail && !existingEmails.has(sageSupplier.customerServiceEmail.toLowerCase())) {
            contactsToCreate.push({
                firstName: 'Customer Service',
                lastName: sageSupplier.coName || 'Dept',
                email: sageSupplier.customerServiceEmail,
                department: 'customer_service',
            });
            existingEmails.add(sageSupplier.customerServiceEmail.toLowerCase());
        }

        // Create contacts
        for (const contact of contactsToCreate) {
            try {
                await contactRepository.create({
                    supplierId: dbSupplierId,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    email: contact.email,
                    phone: contact.phone,
                    department: contact.department,
                    isPrimary: contact.isPrimary || false,
                    receiveOrderEmails: contact.receiveOrderEmails || false,
                });
                console.log(`Created contact: ${contact.firstName} ${contact.lastName} (${contact.email})`);
            } catch (err) {
                console.warn(`Failed to create contact ${contact.email}:`, err);
            }
        }
    }

    /**
     * Sync addresses from SAGE supplier data to supplier_addresses table
     */
    private async syncSupplierAddresses(dbSupplierId: string, sageSupplier: any): Promise<void> {
        const existingAddresses = await supplierAddressRepository.getBySupplierId(dbSupplierId);

        // Mailing address → billing
        if (sageSupplier.mAddr) {
            const existingSageMailingAddr = existingAddresses.find(a => a.addressName === 'SAGE Mailing');
            const mailingData = {
                supplierId: dbSupplierId,
                addressName: 'SAGE Mailing',
                companyNameOnDocs: sageSupplier.coName || undefined,
                street: sageSupplier.mAddr,
                city: sageSupplier.mCity || '',
                state: sageSupplier.mState || '',
                zipCode: sageSupplier.mZip?.toString() || '',
                country: sageSupplier.mCountry || 'US',
                addressType: 'billing',
                isDefault: existingAddresses.length === 0, // default only if no other addresses
            };

            if (existingSageMailingAddr) {
                await supplierAddressRepository.update(existingSageMailingAddr.id, mailingData);
                console.log('Updated SAGE Mailing address');
            } else {
                await supplierAddressRepository.create(mailingData);
                console.log('Created SAGE Mailing address');
            }
        }

        // Shipping address (if different from mailing)
        if (sageSupplier.sAddr) {
            const existingSageShippingAddr = existingAddresses.find(a => a.addressName === 'SAGE Shipping');
            const shippingData = {
                supplierId: dbSupplierId,
                addressName: 'SAGE Shipping',
                companyNameOnDocs: sageSupplier.coName || undefined,
                street: sageSupplier.sAddr,
                city: sageSupplier.sCity || '',
                state: sageSupplier.sState || '',
                zipCode: sageSupplier.sZip?.toString() || '',
                country: sageSupplier.sCountry || 'US',
                addressType: 'shipping',
                isDefault: false,
            };

            if (existingSageShippingAddr) {
                await supplierAddressRepository.update(existingSageShippingAddr.id, shippingData);
                console.log('Updated SAGE Shipping address');
            } else {
                await supplierAddressRepository.create(shippingData);
                console.log('Created SAGE Shipping address');
            }
        }
    }

    /**
     * Sync a product from SAGE to local database
     * Fetches full product detail (105) for enriched data + supplier info
     * @param enrichedSupplierIds - Set to track already-enriched suppliers (for batch dedup)
     */
    async syncProductToDatabase(sageProduct: SageProduct, enrichedSupplierIds?: Set<string>): Promise<string> {
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

            // ── Step 1: Fetch full product detail from SAGE 105 ──
            // 105 API accepts prodEId (numeric) or SPC code — NOT the supplier item number
            let fullDetail: any = null;
            try {
                const prodEId = sageProduct.prodEId || sageProduct.productId; // numeric ID or SPC code
                console.log('Calling SAGE 105 with prodEId:', prodEId);
                fullDetail = await this.getFullProductDetail(prodEId, true);
                console.log('Got full product detail from SAGE 105:', fullDetail?.prName || 'unknown');
            } catch (detailErr) {
                console.warn('Failed to fetch SAGE 105 detail (falling back to search data):', detailErr);
            }

            // ── Step 2: Find or create supplier ──
            let supplier = null;
            if (supplierId) {
                supplier = await integrationRepository.getSupplierBySageId(supplierId);

                if (supplier && supplier.name.toLowerCase() !== supplierName.toLowerCase()) {
                    console.warn(`⚠️  Supplier name mismatch! DB: "${supplier.name}" vs SAGE: "${supplierName}"`);
                    supplier = null;
                }
            }

            if (!supplier) {
                supplier = await supplierRepository.getByName(supplierName);

                if (supplier) {
                    if (supplierId && !supplier.sageId) {
                        await supplierRepository.update(supplier.id, {
                            sageId: supplierId,
                            apiIntegrationStatus: 'active',
                            lastSyncAt: new Date()
                        });
                    }
                }
            }

            let dbSupplierId = supplier?.id;
            const isNewSupplier = !supplier;

            if (!supplier) {
                console.log('Creating new supplier:', supplierName);
                const newSupplier = await supplierRepository.create({
                    name: supplierName,
                    sageId: supplierId || undefined,
                    apiIntegrationStatus: 'active',
                    lastSyncAt: new Date()
                });
                dbSupplierId = newSupplier.id;
                console.log('Created new supplier with ID:', dbSupplierId);
            }

            // ── Step 3: Enrich supplier from SAGE 105 response (with dedup) ──
            const sageSupplierId = supplierId || fullDetail?.suppId?.toString();
            if (sageSupplierId && dbSupplierId && fullDetail?.supplier) {
                const shouldEnrich = !enrichedSupplierIds || !enrichedSupplierIds.has(sageSupplierId);
                if (shouldEnrich) {
                    try {
                        await this.enrichSupplierFromResponse(dbSupplierId, fullDetail.supplier, isNewSupplier);
                        enrichedSupplierIds?.add(sageSupplierId);
                    } catch (enrichErr) {
                        console.warn('Supplier enrichment failed (non-blocking):', enrichErr);
                    }
                } else {
                    console.log('Supplier already enriched in this batch, skipping:', sageSupplierId);
                }
            }

            // ── Step 4: Build enriched product data from 105 response (or fallback to search data) ──
            let enrichedProductData: {
                productName: string;
                productNumber: string;
                description: string;
                colors: string[];
                decorationMethods: string[];
                imageGallery: string[];
                pricingStructure: any;
                setupCharges: any;
                leadTime: number;
                minimumQuantity: number;
                basePrice: string;
                imprintArea?: string;
                imprintLoc?: string;
                priceIncludes?: string;
                onHand?: number;
                options?: any[];
            };

            if (fullDetail) {
                // Parse from SAGE 105 response format
                const colors = typeof fullDetail.colors === 'string'
                    ? fullDetail.colors.split(',').map((c: string) => c.trim()).filter(Boolean)
                    : Array.isArray(fullDetail.colors) ? fullDetail.colors : (sageProduct.colors || []);

                const decorationMethods = typeof fullDetail.decorationMethod === 'string'
                    ? fullDetail.decorationMethod.split(',').map((m: string) => m.trim()).filter(Boolean)
                    : (sageProduct.decorationMethods || []);

                const imageGallery = Array.isArray(fullDetail.pics)
                    ? fullDetail.pics.map((p: any) => p.url).filter(Boolean)
                    : (sageProduct.imageGallery || []);

                // Full pricing tiers from 105
                const qty = Array.isArray(fullDetail.qty) ? fullDetail.qty.map((q: string) => parseInt(q) || 0).filter((q: number) => q > 0) : [];
                const prc = Array.isArray(fullDetail.prc) ? fullDetail.prc.filter((p: string) => p !== '') : [];
                const net = Array.isArray(fullDetail.net) ? fullDetail.net.filter((n: string) => n !== '') : [];

                const pricingStructure = {
                    quantities: qty,
                    prices: prc,
                    netPrices: net,
                    priceCode: fullDetail.priceCode || '',
                    currency: fullDetail.currency || 'USD',
                    minPrice: prc.length > 0 ? parseFloat(prc[prc.length - 1]) : (sageProduct.pricingStructure as any)?.minPrice,
                    maxPrice: prc.length > 0 ? parseFloat(prc[0]) : (sageProduct.pricingStructure as any)?.maxPrice,
                };

                // Setup charges from 105
                const setupCharges = {
                    setupChg: parseFloat(fullDetail.setupChg || '0'),
                    repeatSetupChg: parseFloat(fullDetail.repeatSetupChg || '0'),
                    screenChg: parseFloat(fullDetail.screenChg || '0'),
                    plateChg: parseFloat(fullDetail.plateChg || '0'),
                    dieChg: parseFloat(fullDetail.dieChg || '0'),
                    toolingChg: parseFloat(fullDetail.toolingChg || '0'),
                    addClrChg: parseFloat(fullDetail.addClrChg || '0'),
                };

                enrichedProductData = {
                    productName: fullDetail.prName || sageProduct.productName,
                    productNumber: fullDetail.itemNum || sageProduct.productNumber,
                    description: fullDetail.description || sageProduct.description,
                    colors,
                    decorationMethods,
                    imageGallery,
                    pricingStructure,
                    setupCharges,
                    leadTime: this.parseLeadTime(fullDetail.prodTime),
                    minimumQuantity: qty.length > 0 ? qty[0] : 1,
                    basePrice: prc.length > 0 ? prc[0] : ((sageProduct.pricingStructure as any)?.minPrice?.toString() || '0'),
                    imprintArea: fullDetail.imprintArea || undefined,
                    imprintLoc: fullDetail.imprintLoc || undefined,
                    priceIncludes: fullDetail.priceIncludes || undefined,
                    onHand: fullDetail.onHand || undefined,
                    options: fullDetail.options || undefined,
                };
            } else {
                // Fallback to basic search data
                enrichedProductData = {
                    productName: sageProduct.productName,
                    productNumber: sageProduct.productNumber,
                    description: sageProduct.description,
                    colors: sageProduct.colors || [],
                    decorationMethods: sageProduct.decorationMethods || [],
                    imageGallery: sageProduct.imageGallery || [],
                    pricingStructure: sageProduct.pricingStructure,
                    setupCharges: sageProduct.setupCharges || {},
                    leadTime: 10,
                    minimumQuantity: 1,
                    basePrice: (sageProduct.pricingStructure as any)?.minPrice?.toString() || '0',
                };
            }

            // ── Step 5: Sync to sage_products table ──
            const existingSageProduct = await integrationRepository.getSageProductBySageId(sageProduct.productId);

            const sageProductData = {
                sageId: sageProduct.productId,
                productName: enrichedProductData.productName,
                productNumber: enrichedProductData.productNumber,
                supplierId: dbSupplierId,
                category: sageProduct.category,
                subcategory: sageProduct.subcategory,
                brand: supplierName,
                description: enrichedProductData.description,
                colors: enrichedProductData.colors,
                features: sageProduct.features || [],
                materials: sageProduct.materials || [],
                dimensions: sageProduct.dimensions || fullDetail?.dimensions,
                weight: (sageProduct.weight || fullDetail?.weightPerCarton) ? String(sageProduct.weight || fullDetail?.weightPerCarton) : null,
                eqpLevel: sageProduct.eqpLevel,
                pricingStructure: enrichedProductData.pricingStructure,
                quantityBreaks: sageProduct.quantityBreaks,
                setupCharges: enrichedProductData.setupCharges,
                decorationMethods: enrichedProductData.decorationMethods,
                leadTimes: sageProduct.leadTimes || (fullDetail?.prodTime ? { text: fullDetail.prodTime, days: enrichedProductData.leadTime } : {}),
                imageGallery: enrichedProductData.imageGallery,
                technicalDrawings: sageProduct.technicalDrawings || [],
                complianceCertifications: sageProduct.complianceCertifications || (fullDetail?.productCompliance ? [fullDetail.productCompliance] : []),
                lastSyncedAt: new Date(),
                syncStatus: 'active'
            };

            let sageProductId: string;
            if (existingSageProduct) {
                await integrationRepository.updateSageProduct(existingSageProduct.id, sageProductData);
                sageProductId = existingSageProduct.id;
            } else {
                sageProductId = await integrationRepository.createSageProduct(sageProductData);
            }

            // ── Step 6: Sync to main products table ──
            const mainProductData = {
                name: enrichedProductData.productName,
                sku: enrichedProductData.productNumber || sageProduct.productId,
                supplierSku: sageProduct.productId,
                description: enrichedProductData.description || '',
                basePrice: enrichedProductData.basePrice,
                supplierId: dbSupplierId,
                brand: supplierName,
                category: sageProduct.category,
                colors: enrichedProductData.colors,
                imageUrl: enrichedProductData.imageGallery[0] || null,
                productType: 'promotional',
                leadTime: enrichedProductData.leadTime,
                minimumQuantity: enrichedProductData.minimumQuantity,
                imprintMethods: enrichedProductData.decorationMethods.length > 0
                    ? JSON.stringify(enrichedProductData.decorationMethods)
                    : null,
            };

            const matchedProduct = await productRepository.getBySupplierSku(sageProduct.productId);

            if (matchedProduct) {
                console.log('Updating existing product:', matchedProduct.id);
                await productRepository.update(matchedProduct.id, mainProductData);
            } else {
                console.log('Creating new main product');
                const createdProduct = await productRepository.create(mainProductData);
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
     * Bulk sync multiple products with supplier deduplication
     */
    async bulkSyncProducts(sageProducts: SageProduct[]): Promise<{
        success: number;
        failed: number;
        errors: string[];
    }> {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];
        const enrichedSupplierIds = new Set<string>();

        for (const product of sageProducts) {
            try {
                await this.syncProductToDatabase(product, enrichedSupplierIds);
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
        const dbSettings = await integrationRepository.getIntegrationSettings();

        const acctId = dbSettings?.sageAcctId || process.env.SAGE_ACCT_ID?.trim() || '';
        const loginId = dbSettings?.sageLoginId || process.env.SAGE_LOGIN_ID?.trim() || '';
        const key = dbSettings?.sageApiKey || process.env.SAGE_API_KEY?.trim() || '';

        if (!acctId || !loginId || !key) {
            return null;
        }

        return { acctId, loginId, key };
    } catch (error) {
        console.error('Error getting SAGE credentials:', error);
        return null;
    }
}
