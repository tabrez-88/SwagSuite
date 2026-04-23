import type { InsertProduct } from "@shared/schema";
import { v2 as cloudinary } from "cloudinary";
import { productRepository } from "../repositories/product.repository";
import { supplierRepository } from "../repositories/supplier.repository";
import { normalizeArrayField } from "../utils/normalizeArrayField";

/**
 * Upload an external image URL to Cloudinary.
 * Returns the Cloudinary URL on success, or null on failure.
 * Useful for S&S Activewear images behind Cloudflare that can't be loaded client-side.
 */
async function uploadImageToCloudinary(imageUrl: string, sku?: string): Promise<string | null> {
  try {
    const publicId = `product-${sku || Date.now()}`;
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "swagsuite/product-images",
      public_id: publicId,
      overwrite: false,
      resource_type: "image",
      timeout: 10000,
    });
    return result.secure_url;
  } catch (err) {
    console.warn(`[ProductService] Failed to upload product image to Cloudinary: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

/**
 * Convert flat piece/dozen/case pricing into normalized per-unit tiers.
 * Used by SanMar & S&S sync paths.
 */
export function convertFlatPricingToTiers(
  piecePrice: number,
  dozenPrice: number,
  casePrice: number,
  caseQty: number = 72,
): { quantity: number; cost: number }[] | undefined {
  const tiers: { quantity: number; cost: number }[] = [];
  const piece = piecePrice || 0;
  const dozen = dozenPrice ? dozenPrice / 12 : 0;
  const caseUnit = casePrice ? casePrice / (caseQty || 72) : 0;
  if (piece > 0) tiers.push({ quantity: 1, cost: +piece.toFixed(2) });
  if (dozen > 0 && +dozen.toFixed(2) !== +piece.toFixed(2)) tiers.push({ quantity: 12, cost: +dozen.toFixed(2) });
  if (caseUnit > 0 && +caseUnit.toFixed(2) !== +dozen.toFixed(2)) tiers.push({ quantity: caseQty, cost: +caseUnit.toFixed(2) });
  return tiers.length > 0 ? tiers : undefined;
}

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

    // Upload external product images to Cloudinary (S&S, SanMar CDN etc. block client-side loading)
    let resolvedImageUrl = imageUrl || null;
    if (resolvedImageUrl && !resolvedImageUrl.includes("cloudinary.com")) {
      const cloudinaryUrl = await uploadImageToCloudinary(resolvedImageUrl, sku);
      if (cloudinaryUrl) {
        resolvedImageUrl = cloudinaryUrl;
      }
    }

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
        imageUrl: resolvedImageUrl,
        productType: source === 'ss_activewear' ? 'apparel' : 'promotional',
        minimumQuantity: 1,
        pricingTiers: pricingTiers && pricingTiers.length > 0 ? pricingTiers : undefined,
      } as any);
    } else {
      // Update existing product: pricing tiers + re-upload stale external image URLs
      const updates: Record<string, any> = {};
      if (pricingTiers && pricingTiers.length > 0) {
        updates.pricingTiers = pricingTiers;
      }
      if (resolvedImageUrl && product.imageUrl && !product.imageUrl.includes("cloudinary.com")) {
        updates.imageUrl = resolvedImageUrl;
      }
      if (Object.keys(updates).length > 0) {
        await productRepository.update(product.id, updates as any);
        product = { ...product, ...updates };
      }
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
