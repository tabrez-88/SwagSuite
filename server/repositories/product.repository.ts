import { desc, eq, like } from "drizzle-orm";
import { db } from "../db";
import {
  products,
  type Product,
  type InsertProduct,
} from "@shared/schema";

export class ProductRepository {
  async getAll(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product;
  }

  async getBySupplierId(supplierId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.supplierId, supplierId));
  }

  async search(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(like(products.name, `%${query}%`))
      .orderBy(desc(products.createdAt));
  }

  async create(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async update(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async delete(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }
}

export const productRepository = new ProductRepository();
