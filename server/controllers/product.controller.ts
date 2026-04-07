import type { Request, Response } from "express";
import { productService } from "../services/product.service";
import { createProductRequest, updateProductRequest, syncProductRequest, searchProductRequest } from "../requests/product.request";

export class ProductController {
  static async list(req: Request, res: Response) {
    const supplierId = req.query.supplierId as string;
    const products = await productService.getAll(supplierId);
    res.json(products);
  }

  static async search(req: Request, res: Response) {
    const { q } = searchProductRequest.parse(req.query);
    const products = await productService.search(q);
    res.json(products);
  }

  static async syncFromSupplier(req: Request, res: Response) {
    const data = syncProductRequest.parse(req.body);
    const result = await productService.syncFromSupplier(data);
    res.json(result);
  }

  static async create(req: Request, res: Response) {
    const data = createProductRequest.parse(req.body);
    const product = await productService.create(data);
    res.status(201).json(product);
  }

  static async getById(req: Request, res: Response) {
    const product = await productService.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  }

  static async update(req: Request, res: Response) {
    const data = updateProductRequest.parse(req.body);
    const product = await productService.update(req.params.id, data);
    res.json(product);
  }

  static async delete(req: Request, res: Response) {
    await productService.delete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  }

  static async getOrdersByProduct(req: Request, res: Response) {
    const { db } = await import("../db");
    const { orderItems, orders, companies } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const results = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        companyName: companies.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        createdAt: orders.createdAt,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(companies, eq(orders.companyId, companies.id))
      .where(eq(orderItems.productId, req.params.id))
      .orderBy(orders.createdAt);

    res.json(results);
  }
}
