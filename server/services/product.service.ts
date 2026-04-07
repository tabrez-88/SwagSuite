import type { InsertProduct } from "@shared/schema";
import { productRepository } from "../repositories/product.repository";
import { supplierRepository } from "../repositories/supplier.repository";
import { normalizeArrayField } from "../utils/normalizeArrayField";

export class ProductService {
  async getAll(supplierId?: string) {
    if (supplierId) {
      return productRepository.getBySupplierId(supplierId);
    }
    return productRepository.getAll();
  }

  async search(query: string) {
    return productRepository.search(query);
  }

  async getById(id: string) {
    return productRepository.getById(id);
  }

  async syncFromSupplier(data: {
    name: string;
    sku?: string;
    supplierName: string;
    description?: string;
    basePrice?: number;
    category?: string;
    colors?: string[];
    sizes?: string[];
    imageUrl?: string;
    source?: string;
    pricingTiers?: { quantity: number; cost: number }[];
  }) {
    const { name, sku, supplierName, description, basePrice, category, colors, imageUrl, source, pricingTiers } = data;

    // Find or create the supplier/vendor
    let supplier = await supplierRepository.getByName(supplierName);
    if (!supplier) {
      supplier = await supplierRepository.create({
        name: supplierName,
        apiIntegrationStatus: source === 'sage' ? 'active' : source === 'sanmar' ? 'active' : source === 'ss_activewear' ? 'active' : 'none',
      });
    }

    // Find existing product by SKU + supplier, or create new
    let product = null;
    if (sku) {
      const existing = await productRepository.getAll();
      product = existing.find(p =>
        p.supplierSku === sku && p.supplierId === supplier!.id
      ) || existing.find(p =>
        p.sku === sku && p.supplierId === supplier!.id
      );
    }

    if (!product) {
      product = await productRepository.create({
        name,
        sku: sku || '',
        supplierSku: sku || '',
        description: description || '',
        basePrice: basePrice ? String(basePrice) : '0',
        supplierId: supplier.id,
        category: category || '',
        colors: Array.isArray(colors) ? colors : null,
        imageUrl: imageUrl || null,
        productType: source === 'ss_activewear' ? 'apparel' : 'promotional',
        minimumQuantity: 1,
        pricingTiers: pricingTiers && pricingTiers.length > 0 ? pricingTiers : undefined,
      } as any);
    } else if (pricingTiers && pricingTiers.length > 0) {
      // Update existing product with pricing tiers if not already set
      await productRepository.update(product.id, { pricingTiers } as any);
    }

    return {
      product: { ...product, supplierName: supplier.name },
      supplier,
      isNew: !product.createdAt || (Date.now() - new Date(product.createdAt).getTime()) < 2000,
    };
  }

  async create(data: InsertProduct) {
    const productData = { ...data };
    productData.colors = normalizeArrayField(productData.colors);
    productData.sizes = normalizeArrayField(productData.sizes);
    return productRepository.create(productData);
  }

  async update(id: string, data: Partial<InsertProduct>) {
    const updateData = { ...data };

    if (updateData.colors !== undefined) {
      updateData.colors = normalizeArrayField(updateData.colors);
    }
    if (updateData.sizes !== undefined) {
      updateData.sizes = normalizeArrayField(updateData.sizes);
    }

    return productRepository.update(id, updateData);
  }

  async delete(id: string) {
    return productRepository.delete(id);
  }
}

export const productService = new ProductService();
