import { Request, Response } from "express";
import { shippingMethodRepository } from "../repositories/shipping-method.repository";

export class ShippingMethodController {
  /** GET /api/shipping-methods */
  static async list(req: Request, res: Response) {
    const methods = await shippingMethodRepository.getAll();
    res.json(methods);
  }

  /** POST /api/shipping-methods */
  static async create(req: Request, res: Response) {
    const { insertShippingMethodSchema } = await import("@shared/schema");
    const validated = insertShippingMethodSchema.parse(req.body);
    const method = await shippingMethodRepository.create(validated);
    res.status(201).json(method);
  }

  /** PUT /api/shipping-methods/:id */
  static async update(req: Request, res: Response) {
    const existing = await shippingMethodRepository.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Shipping method not found" });
    }
    const updated = await shippingMethodRepository.update(req.params.id, req.body);
    res.json(updated);
  }

  /** PUT /api/shipping-methods/reorder */
  static async reorder(req: Request, res: Response) {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "orderedIds must be an array" });
    }
    await shippingMethodRepository.reorder(orderedIds);
    res.json({ success: true });
  }

  /** DELETE /api/shipping-methods/:id */
  static async delete(req: Request, res: Response) {
    const existing = await shippingMethodRepository.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Shipping method not found" });
    }
    await shippingMethodRepository.softDelete(req.params.id);
    res.status(204).send();
  }
}
